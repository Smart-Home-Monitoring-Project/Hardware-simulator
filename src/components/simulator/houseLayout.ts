/**
 * Modern modular glass-house layout (inspired by container-style home).
 * Room bounds as % of house stage — aligned to SVG glass bays.
 */

export interface DevicePlacement {
  deviceId: string;
  x: number;
  y: number;
}

export interface RoomBounds {
  roomId: string;
  left: number;
  top: number;
  width: number;
  height: number;
  devices: DevicePlacement[];
}

export const HOUSE_VIEWBOX = { width: 1280, height: 780 } as const;

export const BREAKER_HUB = { x: 640, y: 560 } as const;
export const DISTRIBUTION_HUB = { x: 640, y: 390 } as const;

/**
 * Floor 2 (upper glass bays): room-1 | room-2 | room-3
 * Floor 1 (lower glass bays): room-6 | room-4 | room-5
 * Coordinates match HouseBlueprint glass panes (viewBox 1280×780).
 *
 * Wall AC + CCTV machines are drawn in the SVG scene.
 * Pins below are the small ON/OFF toggles only.
 * Garden has no AC.
 */
export const ROOM_BOUNDS: RoomBounds[] = [
  {
    // Upper-left bedroom bay
    roomId: 'room-1',
    left: (70 / 1280) * 100,
    top: (168 / 780) * 100,
    width: (360 / 1280) * 100,
    height: (210 / 780) * 100,
    devices: [
      { deviceId: 'r1-ac', x: 30, y: 48 },
      { deviceId: 'r1-ceiling', x: 50, y: 14 },
      { deviceId: 'r1-lamp', x: 18, y: 68 },
    ],
  },
  {
    // Upper-center utility bay
    roomId: 'room-2',
    left: (460 / 1280) * 100,
    top: (168 / 780) * 100,
    width: (360 / 1280) * 100,
    height: (210 / 780) * 100,
    devices: [
      { deviceId: 'r2-ac', x: 30, y: 48 },
      { deviceId: 'r2-ceiling', x: 50, y: 14 },
      { deviceId: 'r2-iron', x: 78, y: 62 },
    ],
  },
  {
    // Upper-right guest bay
    roomId: 'room-3',
    left: (850 / 1280) * 100,
    top: (168 / 780) * 100,
    width: (360 / 1280) * 100,
    height: (210 / 780) * 100,
    devices: [
      { deviceId: 'r3-ac', x: 30, y: 48 },
      { deviceId: 'r3-ceiling', x: 50, y: 14 },
      { deviceId: 'r3-lamp', x: 82, y: 68 },
    ],
  },
  {
    // Lower-left living bay
    roomId: 'room-6',
    left: (70 / 1280) * 100,
    top: (430 / 780) * 100,
    width: (360 / 1280) * 100,
    height: (230 / 780) * 100,
    devices: [
      { deviceId: 'r6-ac', x: 30, y: 46 },
      { deviceId: 'r6-ceiling', x: 50, y: 12 },
      { deviceId: 'r6-lamp', x: 18, y: 62 },
      // TV lower-right; camera toggle near scene CCTV (top-right) — no overlap
      { deviceId: 'r6-tv', x: 78, y: 72 },
      { deviceId: 'r6-camera', x: 90, y: 14 },
    ],
  },
  {
    // Outdoor garden CCTV — toggle to the right of pole camera (not on top of it)
    roomId: 'room-garden',
    left: (100 / 1280) * 100,
    top: (700 / 780) * 100,
    width: (160 / 1280) * 100,
    height: (70 / 780) * 100,
    devices: [{ deviceId: 'garden-camera', x: 78, y: 42 }],
  },
  {
    // Lower-center hall + main breaker
    roomId: 'room-4',
    left: (460 / 1280) * 100,
    top: (430 / 780) * 100,
    width: (360 / 1280) * 100,
    height: (230 / 780) * 100,
    devices: [
      { deviceId: 'r4-ac', x: 30, y: 46 },
      { deviceId: 'r4-ceiling', x: 50, y: 12 },
      { deviceId: 'r4-breaker', x: 80, y: 68 },
    ],
  },
  {
    // Lower-right kitchen bay
    roomId: 'room-5',
    left: (850 / 1280) * 100,
    top: (430 / 780) * 100,
    width: (360 / 1280) * 100,
    height: (230 / 780) * 100,
    devices: [
      { deviceId: 'r5-ac', x: 30, y: 46 },
      { deviceId: 'r5-ceiling', x: 50, y: 12 },
      { deviceId: 'r5-stove', x: 78, y: 62 },
    ],
  },
];

export const ROOM_ZONES = ROOM_BOUNDS;
