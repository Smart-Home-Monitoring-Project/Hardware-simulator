import {
  DeviceState,
  DeviceStatus,
  DeviceType,
  INITIAL_ROOMS,
  RoomData,
} from '../types/simulator';

/** Official house tree used by Android + backend — never use top-level `rooms`. */
export const HOUSE_ID = 'house1';
export const FLOORS_PATH = `houses/${HOUSE_ID}/floors`;

/** Known room → floor mapping (matches App-main / Firebase). */
export const ROOM_FLOOR_IDS: Record<string, 'floor1' | 'floor2'> = {
  'room-1': 'floor2',
  'room-2': 'floor2',
  'room-3': 'floor2',
  'room-4': 'floor1',
  'room-5': 'floor1',
  'room-6': 'floor1',
};

const ROOM_META = Object.fromEntries(
  INITIAL_ROOMS.map((room) => [
    room.id,
    {
      name: room.name,
      floor: room.floor,
      floorId: ROOM_FLOOR_IDS[room.id] ?? (room.floor === 2 ? 'floor2' : 'floor1'),
      isMainBreakerRoom: Boolean(room.isMainBreakerRoom),
    },
  ]),
) as Record<
  string,
  {
    name: string;
    floor: 1 | 2;
    floorId: 'floor1' | 'floor2';
    isMainBreakerRoom: boolean;
  }
>;

export function devicePath(
  floorId: string,
  roomId: string,
  deviceId: string,
): string {
  return `${FLOORS_PATH}/${floorId}/rooms/${roomId}/devices/${deviceId}`;
}

function isDeviceStatus(value: unknown): value is DeviceStatus {
  return value === 'ON' || value === 'OFF' || value === 'ERROR' || value === 'DISCONNECTED';
}

const ALLOWED_TYPES: DeviceType[] = [
  'ceiling_light',
  'table_lamp',
  'heavy_appliance',
  'main_breaker',
  'smart_tv',
  'security_camera',
  'air_conditioner',
];

function normalizeDevice(raw: unknown, fallbackId: string): DeviceState | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Record<string, unknown>;

  const id = typeof d.id === 'string' ? d.id : fallbackId;
  const name = typeof d.name === 'string' ? d.name : id;
  const type = d.type;
  const powerDrawWatts =
    typeof d.powerDrawWatts === 'number' ? d.powerDrawWatts : 0;
  const status = isDeviceStatus(d.status) ? d.status : 'OFF';

  if (typeof type !== 'string' || !ALLOWED_TYPES.includes(type as DeviceType)) {
    return null;
  }

  const device: DeviceState = {
    id,
    name,
    type: type as DeviceType,
    powerDrawWatts,
    status,
  };

  if (typeof d.turnedOnAt === 'number' || d.turnedOnAt === null) {
    device.turnedOnAt = d.turnedOnAt as number | null;
  }
  if (typeof d.turnedOffAt === 'number' || d.turnedOffAt === null) {
    device.turnedOffAt = d.turnedOffAt as number | null;
  }
  // Android / backend field name
  if (typeof d.maxOnDuration === 'number') {
    device.maxOnDuration = d.maxOnDuration;
  }
  // Legacy simulator field — keep if present, do not invent
  if (typeof d.maxOnDurationSeconds === 'number' && device.maxOnDuration == null) {
    device.maxOnDuration = d.maxOnDurationSeconds;
  }
  if (typeof d.safetyCutoff === 'boolean') {
    device.safetyCutoff = d.safetyCutoff;
  }

  return device;
}

/**
 * Parse `houses/house1/floors` snapshot into ordered RoomData for the UI.
 * Firebase is the source of truth for devices and statuses.
 */
export function roomsFromFloorsSnapshot(raw: unknown): RoomData[] {
  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const floors = raw as Record<string, unknown>;
  const roomsById = new Map<string, RoomData>();

  for (const [floorKey, floorValue] of Object.entries(floors)) {
    if (!floorValue || typeof floorValue !== 'object') continue;
    const floorNode = floorValue as Record<string, unknown>;
    const roomsRaw = floorNode.rooms;
    if (!roomsRaw || typeof roomsRaw !== 'object') continue;

    const floorId =
      floorKey === 'floor2' || floorKey === 'floor1'
        ? floorKey
        : (ROOM_FLOOR_IDS[
            Object.keys(roomsRaw as object)[0] ?? ''
          ] as 'floor1' | 'floor2' | undefined) ?? 'floor1';

    for (const [roomKey, roomValue] of Object.entries(
      roomsRaw as Record<string, unknown>,
    )) {
      if (!roomValue || typeof roomValue !== 'object') continue;
      const r = roomValue as Record<string, unknown>;
      const meta = ROOM_META[roomKey];

      const devices: DeviceState[] = [];
      const devicesRaw = r.devices;
      if (devicesRaw && typeof devicesRaw === 'object') {
        for (const [deviceKey, deviceValue] of Object.entries(
          devicesRaw as Record<string, unknown>,
        )) {
          const device = normalizeDevice(deviceValue, deviceKey);
          if (device) devices.push(device);
        }
      }
      devices.sort((a, b) => a.id.localeCompare(b.id));

      const floorNum: 1 | 2 =
        meta?.floor ?? (floorId === 'floor2' ? 2 : 1);

      roomsById.set(roomKey, {
        id: typeof r.id === 'string' ? r.id : roomKey,
        name:
          typeof r.name === 'string'
            ? r.name
            : (meta?.name ?? roomKey),
        floor: floorNum,
        floorId: (meta?.floorId ?? floorId) as 'floor1' | 'floor2',
        isMainBreakerRoom:
          meta?.isMainBreakerRoom ??
          (Boolean(r.isMainBreakerRoom) ||
            devices.some((d) => d.type === 'main_breaker')),
        devices,
      });
    }
  }

  const order = new Map(INITIAL_ROOMS.map((room, index) => [room.id, index]));

  return Array.from(roomsById.values()).sort(
    (a, b) => (order.get(a.id) ?? 99) - (order.get(b.id) ?? 99),
  );
}

export function resolveFloorId(room: RoomData): string {
  if (room.floorId) return room.floorId;
  return ROOM_FLOOR_IDS[room.id] ?? (room.floor === 2 ? 'floor2' : 'floor1');
}
