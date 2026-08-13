import { useCallback, useEffect, useMemo, useState } from 'react';
import { onValue, ref, update } from 'firebase/database';
import { database } from '../../firebase/firebase';
import {
  buildMissingGardenCameraPatches,
  devicePath,
  FLOORS_PATH,
  resolveFloorId,
  roomsFromFloorsSnapshot,
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
  isPowered,
  toggleDeviceStatus,
} from '../../types/simulator';
import { BREAKER_HUB, DISTRIBUTION_HUB } from './houseLayout';

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

        // Ensure garden CCTV exists under houses/house1/floors (not top-level rooms/)
        const gardenPatch = buildMissingGardenCameraPatches(parsed);
        if (gardenPatch) {
          void update(ref(database), gardenPatch).catch((err: unknown) => {
            const message =
              err instanceof Error
                ? err.message
                : 'Failed to create garden CCTV in Firebase';
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

  /**
   * Toggle writes status (+ turnedOnAt) to houses/house1/floors/...
   * Local UI updates via onValue; optimistic update for snappy feedback.
   * No simulator-side safety timer — backend owns iron cutoff.
   */
  const toggleDevice = useCallback(
    (deviceId: string) => {
      const location = findDeviceLocation(rooms, deviceId);
      if (!location) return;

      const { room, device } = location;
      if (device.status === 'ERROR' || device.status === 'DISCONNECTED') return;

      const nextStatus = toggleDeviceStatus(device.status);
      const floorId = resolveFloorId(room);
      const path = devicePath(floorId, room.id, deviceId);
      const now = Date.now();

      // Match Android: status + turnedOnAt (null when OFF)
      const patch: Record<string, unknown> = {
        status: nextStatus,
        turnedOnAt: nextStatus === 'ON' ? now : null,
      };

      // Optimistic local update (overwritten by Firebase listener)
      setRooms((prev) =>
        prev.map((r) => ({
          ...r,
          devices: r.devices.map((d) =>
            d.id === deviceId
              ? {
                  ...d,
                  status: nextStatus,
                  turnedOnAt: nextStatus === 'ON' ? now : null,
                }
              : d,
          ),
        })),
      );

      void update(ref(database, path), patch).catch((err: unknown) => {
        const message =
          err instanceof Error ? err.message : 'Failed to update device status';
        setSyncState('error');
        setSyncError(message);
      });
    },
    [rooms],
  );

  const roomViewModels: RoomViewModel[] = useMemo(() => {
    return rooms.map((room) => {
      const devices: EffectiveDevice[] = room.devices.map((device) => {
        const effectiveStatus = resolveEffectiveStatus(device, mainBreakerOn);
        const effectiveWatts = isPowered(effectiveStatus) ? device.powerDrawWatts : 0;

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
