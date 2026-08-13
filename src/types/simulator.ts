export type DeviceType =
  | 'ceiling_light'
  | 'table_lamp'
  | 'heavy_appliance'
  | 'main_breaker'
  | 'smart_tv'
  | 'security_camera'
  | 'air_conditioner'
  | 'electrical_outlet'
  | 'multi_switch';

/**
 * Shared device status — same values as Android app / backend.
 * Prefer this over a boolean so ERROR and DISCONNECTED are representable.
 */
export type DeviceStatus = 'ON' | 'OFF' | 'ERROR' | 'DISCONNECTED';

/** Preset daily ON/OFF window for a light (local time, HH:mm) */
export interface DeviceSchedule {
  enabled: boolean;
  onTime: string;
  offTime: string;
}

/** One channel inside a multi_switch unit (independent ON/OFF) */
export interface SwitchChannel {
  id: string;
  name: string;
  status: DeviceStatus;
  /** Optional linked room device this channel drives (e.g. r5-ceiling) */
  controlsDeviceId?: string;
}

/** Kitchen multi-switch channel → room device mapping */
export const KITCHEN_MULTISWITCH_LINKS: Record<string, string> = {
  'switch-1': 'r5-ceiling',
  'switch-2': 'r5-stove',
  'switch-3': 'r5-outlet',
};

export const KITCHEN_MULTISWITCH_ID = 'r5-multiswitch';

export interface DeviceState {
  id: string;
  name: string;
  type: DeviceType;
  powerDrawWatts: number;
  status: DeviceStatus;
  /** Epoch ms when last turned ON — used by backend safety cutoffs */
  turnedOnAt?: number | null;
  /** Epoch ms when last turned OFF — set by backend / Android */
  turnedOffAt?: number | null;
  /** Max seconds ON before backend auto-OFF (Android field name) */
  maxOnDuration?: number;
  /** Backend iron safety flag */
  safetyCutoff?: boolean;
  /** Optional automatic daily schedule (e.g. ceiling light) */
  schedule?: DeviceSchedule;
  /** Nested switches for type multi_switch (single Firebase device entity) */
  switches?: SwitchChannel[];
  /** Mock CCTV live stream URI (assignment monitoring view) */
  streamUri?: string;
  /** Mock CCTV snapshot image URI */
  snapshotUri?: string;
}

export function anySwitchOn(device: DeviceState): boolean {
  return (device.switches ?? []).some((sw) => sw.status === 'ON');
}

/** Cycle statuses for assignment demos (Alt+click a device) */
export function cycleDemoStatus(status: DeviceStatus): DeviceStatus {
  if (status === 'ON') return 'OFF';
  if (status === 'OFF') return 'ERROR';
  if (status === 'ERROR') return 'DISCONNECTED';
  return 'ON';
}

export interface RoomData {
  id: string;
  name: string;
  floor: 1 | 2;
  /** Firebase floor key: floor1 | floor2 */
  floorId?: 'floor1' | 'floor2';
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

/**
 * Room metadata + official Firebase device IDs (houses/house1).
 * Statuses here are UI fallback only — Firebase is the source of truth.
 * Extra simulator-only devices (AC/CCTV) are not listed until added to Firebase.
 */
export const INITIAL_ROOMS: RoomData[] = [
  {
    id: 'room-1',
    name: 'Master Bedroom',
    floor: 2,
    floorId: 'floor2',
    devices: [
      {
        id: 'r1-ceiling',
        name: 'Ceiling Light',
        type: 'ceiling_light',
        powerDrawWatts: 60,
        status: 'OFF',
        // Preset schedule for assignment demo (local time)
        schedule: {
          enabled: true,
          onTime: '18:00',
          offTime: '06:00',
        },
      },
      {
        id: 'r1-lamp',
        name: 'Table Lamp',
        type: 'table_lamp',
        powerDrawWatts: 45,
        status: 'OFF',
      },
    ],
  },
  {
    id: 'room-2',
    name: 'Utility Room',
    floor: 2,
    floorId: 'floor2',
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
    ],
  },
  {
    id: 'room-3',
    name: 'Guest Bedroom',
    floor: 2,
    floorId: 'floor2',
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
    ],
  },
  {
    id: 'room-4',
    name: 'Main Hall / Entry',
    floor: 1,
    floorId: 'floor1',
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
    ],
  },
  {
    id: 'room-5',
    name: 'Kitchen / Dining',
    floor: 1,
    floorId: 'floor1',
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
        id: 'r5-outlet',
        name: 'Kitchen Power Outlet',
        type: 'electrical_outlet',
        powerDrawWatts: 0,
        status: 'OFF',
      },
      {
        id: 'r5-multiswitch',
        name: 'Kitchen Multi-Switch',
        type: 'multi_switch',
        powerDrawWatts: 8,
        status: 'OFF',
        switches: [
          {
            id: 'switch-1',
            name: 'Kitchen Light',
            status: 'OFF',
            controlsDeviceId: 'r5-ceiling',
          },
          {
            id: 'switch-2',
            name: 'Stove',
            status: 'OFF',
            controlsDeviceId: 'r5-stove',
          },
          {
            id: 'switch-3',
            name: 'Outlet',
            status: 'OFF',
            controlsDeviceId: 'r5-outlet',
          },
        ],
      },
    ],
  },
  {
    id: 'room-6',
    name: 'Living Room',
    floor: 1,
    floorId: 'floor1',
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
    ],
  },
  {
    id: 'room-garden',
    name: 'Garden / Exterior',
    floor: 1,
    floorId: 'floor1',
    devices: [
      {
        id: 'garden-camera',
        name: 'Garden CCTV',
        type: 'security_camera',
        powerDrawWatts: 15,
        status: 'OFF',
        streamUri: 'https://mock.smarthome.local/house1/garden/live.m3u8',
        snapshotUri:
          'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=480&h=270&fit=crop',
      },
    ],
  },
];

export const TOTAL_CONTROLLABLE_DEVICES = INITIAL_ROOMS.reduce(
  (sum, room) => sum + room.devices.filter((d) => d.type !== 'main_breaker').length,
  0,
);

export const MAIN_BREAKER_ID = 'r4-breaker';
