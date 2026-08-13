import { useCallback, useEffect, useMemo, useState } from 'react';
import { onValue, ref, update } from 'firebase/database';
import { database } from '../../firebase/firebase';
import {
  buildMissingHouseDevicePatches,
  devicePath,
  FLOORS_PATH,
  resolveFloorId,
  roomsFromFloorsSnapshot,
  switchPath,
} from '../../firebase/roomsSync';
import {
  DeviceState,
  DeviceStatus,
  INITIAL_ROOMS,
  MAIN_BREAKER_ID,
  RoomData,
  SystemStatus,
  WIRE_COLORS,
  WireLoadLevel,
  WirePathDefinition,
  KITCHEN_MULTISWITCH_LINKS,
  anySwitchOn,
  cycleDemoStatus,
  isPowered,
  toggleDeviceStatus,
} from '../../types/simulator';
import { BREAKER_HUB, DISTRIBUTION_HUB } from './houseLayout';

function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => Number(n));
  if (!Number.isFinite(h) || !Number.isFinite(m)) return 0;
  return h * 60 + m;
}

/** True when local time is inside the ON window (supports overnight windows). */
function isWithinScheduleWindow(onTime: string, offTime: string, now = new Date()): boolean {
  const cur = now.getHours() * 60 + now.getMinutes();
  const on = timeToMinutes(onTime);
  const off = timeToMinutes(offTime);
  if (on === off) return false;
  if (on > off) return cur >= on || cur < off;
  return cur >= on && cur < off;
}

export interface EffectiveDevice extends DeviceState {
  /** Status after main-breaker / fault rules are applied */
  effectiveStatus: DeviceStatus;
  effectiveWatts: number;
}

export interface RoomViewModel extends RoomData {
  devices: EffectiveDevice[];
  wireLoadLevel: WireLoadLevel;
}

export type SyncState = 'connecting' | 'live' | 'error';

/** Empty shell rooms for first paint before Firebase arrives (no fake ON states). */
function cloneFallbackRooms(): RoomData[] {
  return INITIAL_ROOMS.map((room) => ({
    ...room,
    devices: room.devices.map((device) => ({
      ...device,
      // Keep breaker default ON for UI until Firebase overrides
      status: device.type === 'main_breaker' ? device.status : 'OFF',
    })),
  }));
}

function isHighLoadDevice(device: DeviceState): boolean {
  return device.type === 'heavy_appliance' && device.powerDrawWatts >= 1000;
}

/**
 * Resolves delivered power status:
 * - ERROR / DISCONNECTED stay as stored
 * - Main breaker uses its own status
 * - Other devices lose power (OFF) when main breaker is not ON
 */
function resolveEffectiveStatus(
  device: DeviceState,
  mainBreakerOn: boolean,
): DeviceStatus {
  if (device.status === 'ERROR' || device.status === 'DISCONNECTED') {
    return device.status;
  }
  if (device.type === 'main_breaker') {
    return device.status;
  }
  if (!mainBreakerOn) {
    return 'OFF';
  }
  return device.status;
}

function findDeviceLocation(
  rooms: RoomData[],
  deviceId: string,
): { room: RoomData; device: DeviceState } | null {
  for (const room of rooms) {
    const device = room.devices.find((d) => d.id === deviceId);
    if (device) return { room, device };
  }
  return null;
}

export function useSimulatorState() {
  const [rooms, setRooms] = useState<RoomData[]>(cloneFallbackRooms);
  const [syncState, setSyncState] = useState<SyncState>('connecting');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Live subscribe to official house floors tree (Android + backend)
  useEffect(() => {
    const floorsRef = ref(database, FLOORS_PATH);

    const unsubscribe = onValue(
      floorsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setSyncState('error');
          setSyncError(
            `No data at ${FLOORS_PATH}. Expect houses/house1/floors from Android/backend.`,
          );
          return;
        }

        const parsed = roomsFromFloorsSnapshot(snapshot.val());
        if (parsed.length === 0) {
          setSyncState('error');
          setSyncError('Firebase floors snapshot contained no rooms.');
          return;
        }

        setRooms(parsed);
        setSyncState('live');
        setSyncError(null);

        // Merge missing official devices (outlet, multi-switch, garden CCTV, …)
        const missingPatch = buildMissingHouseDevicePatches(parsed);
        if (missingPatch) {
          void update(ref(database), missingPatch).catch((err: unknown) => {
            const message =
              err instanceof Error
                ? err.message
                : 'Failed to merge missing house devices into Firebase';
            setSyncState('error');
            setSyncError(message);
          });
        }
      },
      (error) => {
        setSyncState('error');
        setSyncError(error.message);
      },
    );

    return () => unsubscribe();
  }, []);

  const mainBreakerOn = useMemo(() => {
    const breakerRoom = rooms.find((room) => room.isMainBreakerRoom);
    const breaker = breakerRoom?.devices.find((device) => device.id === MAIN_BREAKER_ID);
    return isPowered(breaker?.status ?? 'OFF');
  }, [rooms]);

  const writeDeviceStatus = useCallback(
    (deviceId: string, nextStatus: DeviceStatus) => {
      const location = findDeviceLocation(rooms, deviceId);
      if (!location) return;

      const { room } = location;
      const floorId = resolveFloorId(room);
      const path = devicePath(floorId, room.id, deviceId);
      const now = Date.now();

      // If this device is driven by a kitchen multi-switch channel, keep channel in sync
      const msu = room.devices.find((d) => d.id === 'r5-multiswitch');
      const linkedSwitch = msu?.switches?.find(
        (sw) =>
          (sw.controlsDeviceId ?? KITCHEN_MULTISWITCH_LINKS[sw.id]) === deviceId,
      );

      const updates: Record<string, unknown> = {
        [`${path}/status`]: nextStatus,
        [`${path}/turnedOnAt`]: nextStatus === 'ON' ? now : null,
      };

      setRooms((prev) =>
        prev.map((r) => ({
          ...r,
          devices: r.devices.map((d) => {
            if (d.id === deviceId) {
              return {
                ...d,
                status: nextStatus,
                turnedOnAt: nextStatus === 'ON' ? now : null,
              };
            }
            if (d.id === 'r5-multiswitch' && linkedSwitch && d.switches) {
              const nextSwitches = d.switches.map((sw) =>
                sw.id === linkedSwitch.id ? { ...sw, status: nextStatus } : sw,
              );
              return {
                ...d,
                switches: nextSwitches,
                status: nextSwitches.some((sw) => sw.status === 'ON') ? 'ON' : 'OFF',
              };
            }
            return d;
          }),
        })),
      );

      if (linkedSwitch && msu) {
        updates[`${switchPath(floorId, room.id, msu.id, linkedSwitch.id)}/status`] =
          nextStatus;
        updates[`${devicePath(floorId, room.id, msu.id)}/status`] =
          // approximate unit status after this change
          nextStatus === 'ON' ||
          (msu.switches ?? []).some(
            (sw) => sw.id !== linkedSwitch.id && sw.status === 'ON',
          )
            ? 'ON'
            : 'OFF';
      }

      void update(ref(database), updates).catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Failed to update device status';
        setSyncState('error');
        setSyncError(message);
      });
    },
    [rooms],
  );

  /**
   * Toggle writes status (+ turnedOnAt) to houses/house1/floors/...
   * No simulator-side iron safety timer — backend owns that.
   */
  const toggleDevice = useCallback(
    (deviceId: string) => {
      const location = findDeviceLocation(rooms, deviceId);
      if (!location) return;
      const { device } = location;
      if (device.status === 'ERROR' || device.status === 'DISCONNECTED') return;
      writeDeviceStatus(deviceId, toggleDeviceStatus(device.status));
    },
    [rooms, writeDeviceStatus],
  );

  /** Alt+click demo: ON → OFF → ERROR → DISCONNECTED → ON */
  const cycleDeviceStatus = useCallback(
    (deviceId: string) => {
      const location = findDeviceLocation(rooms, deviceId);
      if (!location) return;
      writeDeviceStatus(deviceId, cycleDemoStatus(location.device.status));
    },
    [rooms, writeDeviceStatus],
  );

  /**
   * Toggle one channel inside the Kitchen Multi-Switch entity.
   * Writes nested switch status, and mirrors to the linked kitchen device
   * (Light / Stove / Outlet) so icons stay in sync.
   */
  const toggleSwitchChannel = useCallback(
    (deviceId: string, switchId: string) => {
      const location = findDeviceLocation(rooms, deviceId);
      if (!location) return;
      const { room, device } = location;
      if (device.type !== 'multi_switch' || !device.switches) return;
      if (device.status === 'ERROR' || device.status === 'DISCONNECTED') return;

      const channel = device.switches.find((sw) => sw.id === switchId);
      if (!channel) return;
      if (channel.status !== 'ON' && channel.status !== 'OFF') return;

      const nextSwStatus = toggleDeviceStatus(channel.status);
      const nextSwitches = device.switches.map((sw) =>
        sw.id === switchId ? { ...sw, status: nextSwStatus } : sw,
      );
      const unitStatus: DeviceStatus = nextSwitches.some((sw) => sw.status === 'ON')
        ? 'ON'
        : 'OFF';
      const floorId = resolveFloorId(room);
      const now = Date.now();
      const linkedId =
        channel.controlsDeviceId ?? KITCHEN_MULTISWITCH_LINKS[switchId];

      setRooms((prev) =>
        prev.map((r) => ({
          ...r,
          devices: r.devices.map((d) => {
            if (d.id === deviceId) {
              return { ...d, status: unitStatus, switches: nextSwitches };
            }
            if (linkedId && d.id === linkedId) {
              return {
                ...d,
                status: nextSwStatus,
                turnedOnAt: nextSwStatus === 'ON' ? now : null,
              };
            }
            return d;
          }),
        })),
      );

      const updates: Record<string, unknown> = {
        [`${switchPath(floorId, room.id, deviceId, switchId)}/status`]: nextSwStatus,
        [`${devicePath(floorId, room.id, deviceId)}/status`]: unitStatus,
        [`${devicePath(floorId, room.id, deviceId)}/turnedOnAt`]:
          unitStatus === 'ON' ? now : null,
      };

      if (linkedId) {
        updates[`${devicePath(floorId, room.id, linkedId)}/status`] = nextSwStatus;
        updates[`${devicePath(floorId, room.id, linkedId)}/turnedOnAt`] =
          nextSwStatus === 'ON' ? now : null;
      }

      void update(ref(database), updates).catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Failed to update multi-switch channel';
        setSyncState('error');
        setSyncError(message);
      });
    },
    [rooms],
  );

  // Apply preset light schedules (does not touch iron safety / breaker logic)
  useEffect(() => {
    const tick = () => {
      for (const room of rooms) {
        for (const device of room.devices) {
          const schedule = device.schedule;
          if (!schedule?.enabled) continue;
          if (device.status === 'ERROR' || device.status === 'DISCONNECTED') continue;

          const wantOn = isWithinScheduleWindow(schedule.onTime, schedule.offTime);
          const next: DeviceStatus = wantOn ? 'ON' : 'OFF';
          if (device.status === next) continue;

          const floorId = resolveFloorId(room);
          const path = devicePath(floorId, room.id, device.id);
          const now = Date.now();
          void update(ref(database, path), {
            status: next,
            turnedOnAt: next === 'ON' ? now : null,
          });
        }
      }
    };

    tick();
    const id = window.setInterval(tick, 30_000);
    return () => window.clearInterval(id);
  }, [rooms]);

  const roomViewModels: RoomViewModel[] = useMemo(() => {
    return rooms.map((room) => {
      const devices: EffectiveDevice[] = room.devices.map((device) => {
        const effectiveStatus = resolveEffectiveStatus(device, mainBreakerOn);
        const drawsPower =
          device.type === 'multi_switch'
            ? isPowered(effectiveStatus) && anySwitchOn(device)
            : isPowered(effectiveStatus);
        const effectiveWatts = drawsPower ? device.powerDrawWatts : 0;

        return {
          ...device,
          effectiveStatus,
          effectiveWatts,
        };
      });

      let wireLoadLevel: WireLoadLevel = 'off';

      if (mainBreakerOn) {
        const activeDevices = devices.filter(
          (device) =>
            isPowered(device.effectiveStatus) && device.type !== 'main_breaker',
        );

        if (activeDevices.some(isHighLoadDevice)) {
          wireLoadLevel = 'high';
        } else if (activeDevices.length > 0) {
          wireLoadLevel = 'standard';
        }
      }

      return {
        ...room,
        devices,
        wireLoadLevel,
      };
    });
  }, [rooms, mainBreakerOn]);

  const totalWattage = useMemo(
    () =>
      roomViewModels.reduce(
        (sum, room) =>
          sum + room.devices.reduce((roomSum, device) => roomSum + device.effectiveWatts, 0),
        0,
      ),
    [roomViewModels],
  );

  const totalDevices = useMemo(
    () =>
      roomViewModels.reduce(
        (count, room) =>
          count + room.devices.filter((device) => device.type !== 'main_breaker').length,
        0,
      ),
    [roomViewModels],
  );

  const activeDeviceCount = useMemo(
    () =>
      roomViewModels.reduce(
        (count, room) =>
          count +
          room.devices.filter(
            (device) =>
              isPowered(device.effectiveStatus) && device.type !== 'main_breaker',
          ).length,
        0,
      ),
    [roomViewModels],
  );

  const highLoadActive = useMemo(
    () =>
      roomViewModels.some((room) =>
        room.devices.some(
          (device) => isPowered(device.effectiveStatus) && isHighLoadDevice(device),
        ),
      ),
    [roomViewModels],
  );

  const systemStatus: SystemStatus = useMemo(() => {
    if (!mainBreakerOn) return 'BLACKOUT / MAIN OFF';
    if (highLoadActive) return 'HIGH LOAD ALERT';
    return 'GRID STABLE';
  }, [mainBreakerOn, highLoadActive]);

  const wirePaths: WirePathDefinition[] = useMemo(() => {
    const roomById = Object.fromEntries(roomViewModels.map((room) => [room.id, room]));

    const branchPaths: WirePathDefinition[] = [
      {
        id: 'wire-r1',
        roomId: 'room-1',
        d: `M ${DISTRIBUTION_HUB.x} ${DISTRIBUTION_HUB.y} L ${DISTRIBUTION_HUB.x} 270 L 250 270`,
        loadLevel: 'off',
      },
      {
        id: 'wire-r2',
        roomId: 'room-2',
        d: `M ${DISTRIBUTION_HUB.x} ${DISTRIBUTION_HUB.y} L ${DISTRIBUTION_HUB.x} 270`,
        loadLevel: 'off',
      },
      {
        id: 'wire-r3',
        roomId: 'room-3',
        d: `M ${DISTRIBUTION_HUB.x} ${DISTRIBUTION_HUB.y} L ${DISTRIBUTION_HUB.x} 270 L 1030 270`,
        loadLevel: 'off',
      },
      {
        id: 'wire-r5',
        roomId: 'room-5',
        d: `M ${DISTRIBUTION_HUB.x} ${DISTRIBUTION_HUB.y} L ${DISTRIBUTION_HUB.x} 545 L 1030 545`,
        loadLevel: 'off',
      },
      {
        id: 'wire-r6',
        roomId: 'room-6',
        d: `M ${DISTRIBUTION_HUB.x} ${DISTRIBUTION_HUB.y} L ${DISTRIBUTION_HUB.x} 545 L 250 545`,
        loadLevel: 'off',
      },
    ].map((path) => ({
      ...path,
      loadLevel: roomById[path.roomId]?.wireLoadLevel ?? 'off',
    }));

    const trunkLevel: WireLoadLevel = mainBreakerOn ? 'trunk' : 'off';

    return [
      {
        id: 'wire-trunk',
        roomId: 'room-4',
        d: `M ${BREAKER_HUB.x} ${BREAKER_HUB.y} L ${DISTRIBUTION_HUB.x} ${DISTRIBUTION_HUB.y}`,
        loadLevel: trunkLevel,
      },
      ...branchPaths,
    ];
  }, [roomViewModels, mainBreakerOn]);

  const getWireColor = useCallback((level: WireLoadLevel) => WIRE_COLORS[level], []);

  return {
    roomViewModels,
    toggleDevice,
    cycleDeviceStatus,
    toggleSwitchChannel,
    totalWattage,
    activeDeviceCount,
    totalDevices,
    systemStatus,
    mainBreakerOn,
    wirePaths,
    getWireColor,
    syncState,
    syncError,
  };
}
