import {
  DeviceState,
  DeviceStatus,
  DeviceType,
  INITIAL_ROOMS,
  RoomData,
  SwitchChannel,
  anySwitchOn,
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
  'room-garden': 'floor1',
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
  'electrical_outlet',
  'multi_switch',
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

  const scheduleRaw = d.schedule;
  if (scheduleRaw && typeof scheduleRaw === 'object') {
    const s = scheduleRaw as Record<string, unknown>;
    if (
      typeof s.enabled === 'boolean' &&
      typeof s.onTime === 'string' &&
      typeof s.offTime === 'string'
    ) {
      device.schedule = {
        enabled: s.enabled,
        onTime: s.onTime,
        offTime: s.offTime,
      };
    }
  }

  if (typeof d.streamUri === 'string') device.streamUri = d.streamUri;
  if (typeof d.snapshotUri === 'string') device.snapshotUri = d.snapshotUri;

  const switchesRaw = d.switches;
  if (switchesRaw && typeof switchesRaw === 'object') {
    const channels: SwitchChannel[] = [];
    for (const [swKey, swValue] of Object.entries(
      switchesRaw as Record<string, unknown>,
    )) {
      if (!swValue || typeof swValue !== 'object') continue;
      const sw = swValue as Record<string, unknown>;
      const swStatus = isDeviceStatus(sw.status) ? sw.status : 'OFF';
      const channel: SwitchChannel = {
        id: typeof sw.id === 'string' ? sw.id : swKey,
        name: typeof sw.name === 'string' ? sw.name : swKey,
        status: swStatus,
      };
      if (typeof sw.controlsDeviceId === 'string') {
        channel.controlsDeviceId = sw.controlsDeviceId;
      }
      channels.push(channel);
    }
    channels.sort((a, b) => a.id.localeCompare(b.id));
    if (channels.length > 0) {
      device.switches = channels;
      // Parent status mirrors “any channel ON” for wattage / UI (unless faulted)
      if (device.status !== 'ERROR' && device.status !== 'DISCONNECTED') {
        device.status = anySwitchOn(device) ? 'ON' : 'OFF';
      }
    }
  }

  return device;
}

/** Firebase map form for nested switches */
export function switchesToFirebaseMap(
  switches: SwitchChannel[],
): Record<string, Record<string, unknown>> {
  const map: Record<string, Record<string, unknown>> = {};
  for (const sw of switches) {
    map[sw.id] = {
      id: sw.id,
      name: sw.name,
      status: sw.status,
      ...(sw.controlsDeviceId ? { controlsDeviceId: sw.controlsDeviceId } : {}),
    };
  }
  return map;
}

export function deviceToFirebasePayload(device: DeviceState): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    id: device.id,
    name: device.name,
    type: device.type,
    powerDrawWatts: device.powerDrawWatts,
    status: device.status,
  };
  if (device.turnedOnAt !== undefined) payload.turnedOnAt = device.turnedOnAt;
  if (device.turnedOffAt !== undefined) payload.turnedOffAt = device.turnedOffAt;
  if (device.maxOnDuration !== undefined) payload.maxOnDuration = device.maxOnDuration;
  if (device.safetyCutoff !== undefined) payload.safetyCutoff = device.safetyCutoff;
  if (device.schedule) payload.schedule = { ...device.schedule };
  if (device.streamUri) payload.streamUri = device.streamUri;
  if (device.snapshotUri) payload.snapshotUri = device.snapshotUri;
  if (device.switches && device.switches.length > 0) {
    payload.switches = switchesToFirebaseMap(device.switches);
  }
  return payload;
}

export function switchPath(
  floorId: string,
  roomId: string,
  deviceId: string,
  switchId: string,
): string {
  return `${devicePath(floorId, roomId, deviceId)}/switches/${switchId}`;
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

/**
 * Merge any INITIAL_ROOMS devices missing from houses/house1/floors
 * (garden CCTV, outlet, multi-switch channels, etc.).
 * Never writes top-level `rooms/`.
 */
export function buildMissingHouseDevicePatches(
  existingRooms: RoomData[],
): Record<string, unknown> | null {
  const patches: Record<string, unknown> = {};

  for (const seedRoom of INITIAL_ROOMS) {
    const floorId =
      seedRoom.floorId ??
      ROOM_FLOOR_IDS[seedRoom.id] ??
      (seedRoom.floor === 2 ? 'floor2' : 'floor1');
    const roomPath = `${FLOORS_PATH}/${floorId}/rooms/${seedRoom.id}`;
    const existing = existingRooms.find((room) => room.id === seedRoom.id);

    if (!existing) {
      const devices: Record<string, unknown> = {};
      for (const device of seedRoom.devices) {
        devices[device.id] = deviceToFirebasePayload(device);
      }
      patches[roomPath] = {
        id: seedRoom.id,
        name: seedRoom.name,
        devices,
      };
      continue;
    }

    for (const device of seedRoom.devices) {
      const live = existing.devices.find((d) => d.id === device.id);
      if (!live) {
        patches[devicePath(floorId, seedRoom.id, device.id)] =
          deviceToFirebasePayload(device);
        continue;
      }

      if (device.schedule && !live.schedule) {
        patches[`${devicePath(floorId, seedRoom.id, device.id)}/schedule`] = {
          ...device.schedule,
        };
      }
      if (device.streamUri && !live.streamUri) {
        patches[`${devicePath(floorId, seedRoom.id, device.id)}/streamUri`] =
          device.streamUri;
      }
      if (device.snapshotUri && !live.snapshotUri) {
        patches[`${devicePath(floorId, seedRoom.id, device.id)}/snapshotUri`] =
          device.snapshotUri;
      }
      if (device.switches && device.switches.length > 0) {
        if (!live.switches || live.switches.length === 0) {
          patches[`${devicePath(floorId, seedRoom.id, device.id)}/switches`] =
            switchesToFirebaseMap(device.switches);
        } else {
          for (const sw of device.switches) {
            if (!live.switches.some((l) => l.id === sw.id)) {
              patches[
                `${devicePath(floorId, seedRoom.id, device.id)}/switches/${sw.id}`
              ] = { ...sw };
            }
          }
        }
      }
    }
  }

  return Object.keys(patches).length > 0 ? patches : null;
}

/** @deprecated use buildMissingHouseDevicePatches */
export function buildMissingGardenCameraPatches(
  existingRooms: RoomData[],
): Record<string, unknown> | null {
  return buildMissingHouseDevicePatches(existingRooms);
}
