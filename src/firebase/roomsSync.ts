import { DeviceState, DeviceStatus, INITIAL_ROOMS, RoomData } from '../types/simulator';

/** Root path shared with Android app + backend */
export const ROOMS_PATH = 'rooms';

export type FirebaseDevicesMap = Record<string, DeviceState>;

export interface FirebaseRoomNode {
  id: string;
  name: string;
  floor: 1 | 2;
  isMainBreakerRoom?: boolean;
  devices: FirebaseDevicesMap;
}

export type FirebaseRoomsMap = Record<string, FirebaseRoomNode>;

export function devicePath(roomId: string, deviceId: string): string {
  return `${ROOMS_PATH}/${roomId}/devices/${deviceId}`;
}

/** Convert simulator room arrays into Firebase-friendly object maps */
export function roomsToFirebaseMap(rooms: RoomData[]): FirebaseRoomsMap {
  const map: FirebaseRoomsMap = {};

  for (const room of rooms) {
    const devices: FirebaseDevicesMap = {};
    for (const device of room.devices) {
      devices[device.id] = { ...device };
    }
    map[room.id] = {
      id: room.id,
      name: room.name,
      floor: room.floor,
      ...(room.isMainBreakerRoom ? { isMainBreakerRoom: true } : {}),
      devices,
    };
  }

  return map;
}

function isDeviceStatus(value: unknown): value is DeviceStatus {
  return value === 'ON' || value === 'OFF' || value === 'ERROR' || value === 'DISCONNECTED';
}

function normalizeDevice(raw: unknown, fallbackId: string): DeviceState | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;

  const id = typeof d.id === 'string' ? d.id : fallbackId;
  const name = typeof d.name === 'string' ? d.name : id;
  const type = d.type;
  const powerDrawWatts =
    typeof d.powerDrawWatts === 'number' ? d.powerDrawWatts : 0;
  const status = isDeviceStatus(d.status) ? d.status : 'OFF';

  if (
    type !== 'ceiling_light' &&
    type !== 'table_lamp' &&
    type !== 'heavy_appliance' &&
    type !== 'main_breaker' &&
    type !== 'smart_tv'
  ) {
    return null;
  }

  const device: DeviceState = {
    id,
    name,
    type,
    powerDrawWatts,
    status,
  };

  if (typeof d.turnedOnAt === 'number' || d.turnedOnAt === null) {
    device.turnedOnAt = d.turnedOnAt as number | null;
  }
  if (typeof d.maxOnDurationSeconds === 'number') {
    device.maxOnDurationSeconds = d.maxOnDurationSeconds;
  }

  return device;
}

/** Convert Firebase object maps back into ordered RoomData arrays for the UI */
export function roomsFromFirebaseMap(raw: unknown): RoomData[] {
  if (!raw || typeof raw !== 'object') {
    return INITIAL_ROOMS.map((room) => ({
      ...room,
      devices: room.devices.map((device) => ({ ...device })),
    }));
  }

  const roomEntries = Object.entries(raw as Record<string, unknown>);

  const rooms: RoomData[] = [];

  for (const [roomKey, roomValue] of roomEntries) {
    if (!roomValue || typeof roomValue !== 'object') continue;
    const r = roomValue as Record<string, unknown>;

    const devicesRaw = r.devices;
    const devices: DeviceState[] = [];

    if (devicesRaw && typeof devicesRaw === 'object') {
      for (const [deviceKey, deviceValue] of Object.entries(
        devicesRaw as Record<string, unknown>,
      )) {
        const device = normalizeDevice(deviceValue, deviceKey);
        if (device) devices.push(device);
      }
    }

    devices.sort((a, b) => a.id.localeCompare(b.id));

    const floor: 1 | 2 = r.floor === 2 ? 2 : 1;

    rooms.push({
      id: typeof r.id === 'string' ? r.id : roomKey,
      name: typeof r.name === 'string' ? r.name : roomKey,
      floor,
      isMainBreakerRoom: Boolean(r.isMainBreakerRoom),
      devices,
    });
  }

  // Keep a stable visual order matching INITIAL_ROOMS when possible
  const order = new Map(INITIAL_ROOMS.map((room, index) => [room.id, index]));
  rooms.sort((a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99));

  return rooms;
}

/** Seed payload including iron safety fields for backend shutoff workers */
export function buildSeedRooms(): FirebaseRoomsMap {
  const rooms = INITIAL_ROOMS.map((room) => ({
    ...room,
    devices: room.devices.map((device) => {
      if (device.id === 'r2-iron') {
        return {
          ...device,
          maxOnDurationSeconds: 1800,
          turnedOnAt: null as number | null,
        };
      }
      if (device.id === 'r5-stove') {
        return {
          ...device,
          maxOnDurationSeconds: 3600,
          turnedOnAt: null as number | null,
        };
      }
      return { ...device };
    }),
  }));

  return roomsToFirebaseMap(rooms);
}
