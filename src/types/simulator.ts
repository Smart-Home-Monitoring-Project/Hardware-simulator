export type DeviceType =
  | 'ceiling_light'
  | 'table_lamp'
  | 'heavy_appliance'
  | 'main_breaker'
  | 'smart_tv'
  | 'security_camera'
  | 'air_conditioner';

/**
 * Shared device status — same values as Android app / backend.
 * Prefer this over a boolean so ERROR and DISCONNECTED are representable.
 */
export type DeviceStatus = 'ON' | 'OFF' | 'ERROR' | 'DISCONNECTED';

export interface DeviceState {
  id: string;
  name: string;
  type: DeviceType;
  powerDrawWatts: number;
  status: DeviceStatus;
  /** Epoch ms when last turned ON — used by backend safety cutoffs */
  turnedOnAt?: number | null;
  /** Max seconds device may stay ON before backend auto-OFF */
  maxOnDurationSeconds?: number;
}

export interface RoomData {
  id: string;
  name: string;
  floor: 1 | 2;
  devices: DeviceState[];
  isMainBreakerRoom?: boolean;
}

export type SystemStatus = 'GRID STABLE' | 'HIGH LOAD ALERT' | 'BLACKOUT / MAIN OFF';

export type WireLoadLevel = 'off' | 'standard' | 'high' | 'trunk';

export interface WirePathDefinition {
  id: string;
  roomId: string;
  d: string;
  loadLevel: WireLoadLevel;
}

/** Electrical path stroke colors per specification */
export const WIRE_COLORS = {
  off: '#334155',
  standard: '#06B6D4',
  high: '#F59E0B',
  trunk: '#A855F7',
} as const;

/** True when the device is actively powered / drawing load */
export function isPowered(status: DeviceStatus): boolean {
  return status === 'ON';
}

/** Toggle only between ON ↔ OFF; ERROR / DISCONNECTED stay unchanged */
export function toggleDeviceStatus(status: DeviceStatus): DeviceStatus {
  if (status === 'ERROR' || status === 'DISCONNECTED') return status;
  return status === 'ON' ? 'OFF' : 'ON';
}

export const INITIAL_ROOMS: RoomData[] = [
  {
    id: 'room-1',
    name: 'Master Bedroom',
    floor: 2,
    devices: [
      {
        id: 'r1-ceiling',
        name: 'Ceiling Light',
        type: 'ceiling_light',
        powerDrawWatts: 60,
        status: 'OFF',
      },
      {
        id: 'r1-lamp',
        name: 'Table Lamp',
        type: 'table_lamp',
        powerDrawWatts: 45,
        status: 'OFF',
      },
      {
        id: 'r1-ac',
        name: 'Master Bedroom AC',
        type: 'air_conditioner',
        powerDrawWatts: 1200,
        status: 'OFF',
      },
    ],
  },
  {
    id: 'room-2',
    name: 'Utility / Laundry',
    floor: 2,
    devices: [
      {
        id: 'r2-ceiling',
        name: 'Ceiling Light',
        type: 'ceiling_light',
        powerDrawWatts: 60,
        status: 'OFF',
      },
      {
        id: 'r2-iron',
        name: 'Clothes Iron',
        type: 'heavy_appliance',
        powerDrawWatts: 1500,
        status: 'OFF',
      },
      {
        id: 'r2-ac',
        name: 'Utility AC',
        type: 'air_conditioner',
        powerDrawWatts: 1000,
        status: 'OFF',
      },
    ],
  },
  {
    id: 'room-3',
    name: 'Guest Bedroom',
    floor: 2,
    devices: [
      {
        id: 'r3-ceiling',
        name: 'Ceiling Light',
        type: 'ceiling_light',
        powerDrawWatts: 60,
        status: 'OFF',
      },
      {
        id: 'r3-lamp',
        name: 'Accent Table Lamp',
        type: 'table_lamp',
        powerDrawWatts: 40,
        status: 'OFF',
      },
      {
        id: 'r3-ac',
        name: 'Guest Bedroom AC',
        type: 'air_conditioner',
        powerDrawWatts: 1100,
        status: 'OFF',
      },
    ],
  },
  {
    id: 'room-4',
    name: 'Main Hall / Entry',
    floor: 1,
    isMainBreakerRoom: true,
    devices: [
      {
        id: 'r4-ceiling',
        name: 'Ceiling Light',
        type: 'ceiling_light',
        powerDrawWatts: 60,
        status: 'OFF',
      },
      {
        id: 'r4-breaker',
        name: 'Main Circuit Breaker',
        type: 'main_breaker',
        powerDrawWatts: 0,
        status: 'ON',
      },
      {
        id: 'r4-ac',
        name: 'Hall AC',
        type: 'air_conditioner',
        powerDrawWatts: 1300,
        status: 'OFF',
      },
    ],
  },
  {
    id: 'room-5',
    name: 'Kitchen / Dining',
    floor: 1,
    devices: [
      {
        id: 'r5-ceiling',
        name: 'Ceiling Light',
        type: 'ceiling_light',
        powerDrawWatts: 60,
        status: 'OFF',
      },
      {
        id: 'r5-stove',
        name: 'Electric Stove',
        type: 'heavy_appliance',
        powerDrawWatts: 2000,
        status: 'OFF',
      },
      {
        id: 'r5-ac',
        name: 'Kitchen AC',
        type: 'air_conditioner',
        powerDrawWatts: 1400,
        status: 'OFF',
      },
    ],
  },
  {
    id: 'room-6',
    name: 'Living Room',
    floor: 1,
    devices: [
      {
        id: 'r6-ceiling',
        name: 'Ceiling Light',
        type: 'ceiling_light',
        powerDrawWatts: 60,
        status: 'OFF',
      },
      {
        id: 'r6-lamp',
        name: 'Decorative Lamp',
        type: 'table_lamp',
        powerDrawWatts: 50,
        status: 'OFF',
      },
      {
        id: 'r6-tv',
        name: 'Smart TV',
        type: 'smart_tv',
        powerDrawWatts: 120,
        status: 'OFF',
      },
      {
        id: 'r6-camera',
        name: 'Living Room CCTV',
        type: 'security_camera',
        powerDrawWatts: 12,
        status: 'OFF',
      },
      {
        id: 'r6-ac',
        name: 'Living Room AC',
        type: 'air_conditioner',
        powerDrawWatts: 1500,
        status: 'OFF',
      },
    ],
  },
  {
    id: 'room-garden',
    name: 'Garden / Exterior',
    floor: 1,
    devices: [
      {
        id: 'garden-camera',
        name: 'Garden CCTV',
        type: 'security_camera',
        powerDrawWatts: 15,
        status: 'OFF',
      },
    ],
  },
];

export const TOTAL_CONTROLLABLE_DEVICES = INITIAL_ROOMS.reduce(
  (sum, room) => sum + room.devices.filter((d) => d.type !== 'main_breaker').length,
  0,
);

export const MAIN_BREAKER_ID = 'r4-breaker';
