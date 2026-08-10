import { useCallback, useEffect, useMemo, useState } from 'react';
import { onValue, ref, set, update } from 'firebase/database';
import { database } from '../../firebase/firebase';
import {
  buildSeedRooms,
  devicePath,
  roomsFromFirebaseMap,
  ROOMS_PATH,
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

function cloneFallbackRooms(): RoomData[] {
  return INITIAL_ROOMS.map((room) => ({
    ...room,
    devices: room.devices.map((device) => ({ ...device })),
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
): { roomId: string; device: DeviceState } | null {
  for (const room of rooms) {
    const device = room.devices.find((d) => d.id === deviceId);
    if (device) return { roomId: room.id, device };
  }
  return null;
}

export function useSimulatorState() {
  const [rooms, setRooms] = useState<RoomData[]>(cloneFallbackRooms);
  const [syncState, setSyncState] = useState<SyncState>('connecting');
  const [syncError, setSyncError] = useState<string | null>(null);

  // Live subscribe to Firebase Realtime Database
  useEffect(() => {
    const roomsRef = ref(database, ROOMS_PATH);

    const unsubscribe = onValue(
      roomsRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          // First run: seed rooms so Android / backend / simulator share one tree
          void set(roomsRef, buildSeedRooms())
            .then(() => {
              setSyncState('live');
              setSyncError(null);
            })
            .catch((err: unknown) => {
              const message =
                err instanceof Error ? err.message : 'Failed to seed Firebase rooms';
              setSyncState('error');
              setSyncError(message);
            });
          return;
        }

        setRooms(roomsFromFirebaseMap(snapshot.val()));
        setSyncState('live');
        setSyncError(null);
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
   * Toggle writes to Firebase. Local UI updates via the onValue listener
   * (and a small optimistic update for snappy feedback).
   */
  const toggleDevice = useCallback(
    (deviceId: string) => {
      const location = findDeviceLocation(rooms, deviceId);
      if (!location) return;

      const { roomId, device } = location;
      if (device.status === 'ERROR' || device.status === 'DISCONNECTED') return;

      const nextStatus = toggleDeviceStatus(device.status);
      const patch: Record<string, unknown> = { status: nextStatus };

      // Help backend safety workers (iron / stove max duration)
      if (device.type === 'heavy_appliance') {
        patch.turnedOnAt = nextStatus === 'ON' ? Date.now() : null;
      }

      // Optimistic local update
      setRooms((prev) =>
        prev.map((room) => ({
          ...room,
          devices: room.devices.map((d) =>
            d.id === deviceId
              ? {
                  ...d,
                  status: nextStatus,
                  ...(d.type === 'heavy_appliance'
                    ? { turnedOnAt: nextStatus === 'ON' ? Date.now() : null }
                    : {}),
                }
              : d,
          ),
        })),
      );

      void update(ref(database, devicePath(roomId, deviceId)), patch).catch(
        (err: unknown) => {
          const message =
            err instanceof Error ? err.message : 'Failed to update device status';
          setSyncState('error');
          setSyncError(message);
        },
      );
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
