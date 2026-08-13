# Smart Home Hardware Simulator

Interactive 2D two-story smart home electrical network simulator built with React, TypeScript, Emotion, CSS Modules, Framer Motion, Lucide, and SVG wiring animations.

## Run locally (no Android Studio required)

```bash
cd hardware-simulator
npm install
npm run dev
```

Open the URL shown in the terminal (usually `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

## Project structure

```
src/
├── types/simulator.ts
└── components/simulator/
    ├── HomeSimulator.tsx
    ├── HomeSimulator.styles.ts
    ├── HomeSimulator.module.css
    ├── DeviceControlCard.tsx
    ├── RoomCard.tsx
    └── useSimulatorState.ts
```

## Device status model (shared with Android / backend)

Devices use a string `status`, **not** a boolean `isOn`:

```ts
status: "ON" | "OFF" | "ERROR" | "DISCONNECTED"
```

Defined in `src/types/simulator.ts`. Toggle logic lives in `useSimulatorState.ts`.

## Firebase Realtime Database sync

Same project as Android / backend (`smart-home-monitoring-84ea7`).  
Config: `src/firebase/firebase.ts`

**Official path (do not use top-level `rooms/`):**

```
houses/house1/floors/{floorId}/rooms/{roomId}/devices/{deviceId}
```

Example stove:

```
houses/house1/floors/floor1/rooms/room-5/devices/r5-stove
```

Simulator responsibilities:

1. Listen to `houses/house1/floors` with `onValue` (Firebase = source of truth)
2. Never seed or write a separate simulator tree
3. On toggle, write `status` + `turnedOnAt` to the same device path
4. Preserve backend fields (`maxOnDuration`, `safetyCutoff`, etc.) — no local safety timer

Floor map:

| Floor   | Room    | Name              |
|---------|---------|-------------------|
| floor2  | room-1  | Master Bedroom    |
| floor2  | room-2  | Utility Room      |
| floor2  | room-3  | Guest Bedroom     |
| floor1  | room-4  | Main Hall / Entry |
| floor1  | room-5  | Kitchen / Dining  |
| floor1  | room-6  | Living Room       |
| floor1  | room-garden | Garden / Exterior (garden-camera) |

Garden CCTV path:

```
houses/house1/floors/floor1/rooms/room-garden/devices/garden-camera
```

## Verification checklist

- **Main breaker OFF (Room 4):** All glows and wires cut; HUD shows `[BLACKOUT / MAIN OFF]`.
- **Table lamp ON:** Local warm aura only; branch wire stays cyan (standard load).
- **Iron (Room 2) or Stove (Room 5) ON:** Branch wire turns amber; HUD shows `[HIGH LOAD ALERT]` and wattage spike.
- **Firebase:** HUD shows `FIREBASE LIVE`; toggling a device updates RTDB and refreshes without manual reload.
