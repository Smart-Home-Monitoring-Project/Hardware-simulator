export type DeviceType =
  | 'ceiling_light'
  | 'table_lamp'
  | 'heavy_appliance'
  | 'main_breaker'
  | 'smart_tv';

export interface DeviceState {
  id: string;
  name: string;
  type: DeviceType;
  powerDrawWatts: number;
  isOn: boolean;
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
        isOn: false,
      },
      {
        id: 'r1-lamp',
        name: 'Table Lamp',
        type: 'table_lamp',
        powerDrawWatts: 45,
        isOn: false,
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
        isOn: false,
      },
      {
        id: 'r2-iron',
        name: 'Clothes Iron',
        type: 'heavy_appliance',
        powerDrawWatts: 1500,
        isOn: false,
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
        isOn: false,
      },
      {
        id: 'r3-lamp',
        name: 'Accent Table Lamp',
        type: 'table_lamp',
        powerDrawWatts: 40,
        isOn: false,
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
        isOn: false,
      },
      {
        id: 'r4-breaker',
        name: 'Main Circuit Breaker',
        type: 'main_breaker',
        powerDrawWatts: 0,
        isOn: true,
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
        isOn: false,
      },
      {
        id: 'r5-stove',
        name: 'Electric Stove',
        type: 'heavy_appliance',
        powerDrawWatts: 2000,
        isOn: false,
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
        isOn: false,
      },
      {
        id: 'r6-lamp',
        name: 'Decorative Lamp',
        type: 'table_lamp',
        powerDrawWatts: 50,
        isOn: false,
      },
      {
        id: 'r6-tv',
        name: 'Smart TV',
        type: 'smart_tv',
        powerDrawWatts: 120,
        isOn: false,
      },
    ],
  },
];

export const TOTAL_CONTROLLABLE_DEVICES = INITIAL_ROOMS.reduce(
  (sum, room) => sum + room.devices.filter((d) => d.type !== 'main_breaker').length,
  0,
);

export const MAIN_BREAKER_ID = 'r4-breaker';
