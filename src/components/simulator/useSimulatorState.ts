import { useCallback, useMemo, useState } from 'react';
import {
  DeviceState,
  INITIAL_ROOMS,
  MAIN_BREAKER_ID,
  RoomData,
  SystemStatus,
  TOTAL_CONTROLLABLE_DEVICES,
  WIRE_COLORS,
  WireLoadLevel,
  WirePathDefinition,
} from '../../types/simulator';
import { BREAKER_HUB, DISTRIBUTION_HUB } from './houseLayout';

export interface EffectiveDevice extends DeviceState {
  effectiveOn: boolean;
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

export function useSimulatorState() {
  const [rooms, setRooms] = useState<RoomData[]>(cloneInitialRooms);

  const mainBreakerOn = useMemo(() => {
    const breakerRoom = rooms.find((room) => room.isMainBreakerRoom);
    const breaker = breakerRoom?.devices.find((device) => device.id === MAIN_BREAKER_ID);
    return breaker?.isOn ?? false;
  }, [rooms]);

  const toggleDevice = useCallback((deviceId: string) => {
    setRooms((prev) =>
      prev.map((room) => ({
        ...room,
        devices: room.devices.map((device) =>
          device.id === deviceId ? { ...device, isOn: !device.isOn } : device,
        ),
      })),
    );
  }, []);

  const roomViewModels: RoomViewModel[] = useMemo(() => {
    return rooms.map((room) => {
      const devices: EffectiveDevice[] = room.devices.map((device) => {
        const isBreaker = device.type === 'main_breaker';
        const effectiveOn = isBreaker ? device.isOn : mainBreakerOn && device.isOn;
        const effectiveWatts = effectiveOn ? device.powerDrawWatts : 0;

        return {
          ...device,
          effectiveOn,
          effectiveWatts,
        };
      });

      let wireLoadLevel: WireLoadLevel = 'off';

      if (mainBreakerOn) {
        const activeDevices = devices.filter(
          (device) => device.effectiveOn && device.type !== 'main_breaker',
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
            (device) => device.effectiveOn && device.type !== 'main_breaker',
          ).length,
        0,
      ),
    [roomViewModels],
  );

  const highLoadActive = useMemo(
    () =>
      roomViewModels.some((room) =>
        room.devices.some(
          (device) => device.effectiveOn && isHighLoadDevice(device),
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
