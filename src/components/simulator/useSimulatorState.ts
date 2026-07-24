import { useCallback, useMemo, useState } from 'react';
import {
  DeviceState,
  INITIAL_ROOMS,
  MAIN_BREAKER_ID,
  OperationalState,
  RoomData,
  SystemStatus,
  TOTAL_CONTROLLABLE_DEVICES,
  WIRE_COLORS,
  WireLoadLevel,
  WirePathDefinition,
  isPowered,
  toggleOperationalState,
} from '../../types/simulator';
import { BREAKER_HUB, DISTRIBUTION_HUB } from './houseLayout';

export interface EffectiveDevice extends DeviceState {
  /** State after main-breaker / fault rules are applied */
  effectiveState: OperationalState;
  effectiveWatts: number;
}

export interface RoomViewModel extends RoomData {
  devices: EffectiveDevice[];
  wireLoadLevel: WireLoadLevel;
}

function cloneInitialRooms(): RoomData[] {
  return INITIAL_ROOMS.map((room) => ({
    ...room,
    devices: room.devices.map((device) => ({ ...device })),
  }));
}

function isHighLoadDevice(device: DeviceState): boolean {
  return device.type === 'heavy_appliance' && device.powerDrawWatts >= 1000;
}

/**
 * Resolves delivered power state:
 * - ERROR / DISCONNECTED stay as stored
 * - Main breaker uses its own state
 * - Other devices lose power (OFF) when main breaker is not ON
 */
function resolveEffectiveState(
  device: DeviceState,
  mainBreakerOn: boolean,
): OperationalState {
  if (device.state === 'ERROR' || device.state === 'DISCONNECTED') {
    return device.state;
  }
  if (device.type === 'main_breaker') {
    return device.state;
  }
  if (!mainBreakerOn) {
    return 'OFF';
  }
  return device.state;
}

export function useSimulatorState() {
  const [rooms, setRooms] = useState<RoomData[]>(cloneInitialRooms);

  const mainBreakerOn = useMemo(() => {
    const breakerRoom = rooms.find((room) => room.isMainBreakerRoom);
    const breaker = breakerRoom?.devices.find((device) => device.id === MAIN_BREAKER_ID);
    return isPowered(breaker?.state ?? 'OFF');
  }, [rooms]);

  const toggleDevice = useCallback((deviceId: string) => {
    setRooms((prev) =>
      prev.map((room) => ({
        ...room,
        devices: room.devices.map((device) =>
          device.id === deviceId
            ? { ...device, state: toggleOperationalState(device.state) }
            : device,
        ),
      })),
    );
  }, []);

  const roomViewModels: RoomViewModel[] = useMemo(() => {
    return rooms.map((room) => {
      const devices: EffectiveDevice[] = room.devices.map((device) => {
        const effectiveState = resolveEffectiveState(device, mainBreakerOn);
        const effectiveWatts = isPowered(effectiveState) ? device.powerDrawWatts : 0;

        return {
          ...device,
          effectiveState,
          effectiveWatts,
        };
      });

      let wireLoadLevel: WireLoadLevel = 'off';

      if (mainBreakerOn) {
        const activeDevices = devices.filter(
          (device) =>
            isPowered(device.effectiveState) && device.type !== 'main_breaker',
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

  const activeDeviceCount = useMemo(
    () =>
      roomViewModels.reduce(
        (count, room) =>
          count +
          room.devices.filter(
            (device) =>
              isPowered(device.effectiveState) && device.type !== 'main_breaker',
          ).length,
        0,
      ),
    [roomViewModels],
  );

  const highLoadActive = useMemo(
    () =>
      roomViewModels.some((room) =>
        room.devices.some(
          (device) => isPowered(device.effectiveState) && isHighLoadDevice(device),
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
    totalDevices: TOTAL_CONTROLLABLE_DEVICES,
    systemStatus,
    mainBreakerOn,
    wirePaths,
    getWireColor,
  };
}
