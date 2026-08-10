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

Teammate setup: `src/firebase/firebase.ts`

Simulator responsibilities (this app):

1. Listen to `rooms` with `onValue`
2. Seed `rooms` on first launch if empty
3. Write device `status` (and `turnedOnAt` for heavy appliances) on toggle

Database shape:

```
rooms/
  room-1/
    id, name, floor
    devices/
      r1-ceiling: { id, name, type, powerDrawWatts, status }
      ...
  room-2/
    devices/
      r2-iron: { ..., status, maxOnDurationSeconds, turnedOnAt }
```

Backend can listen to the same tree for iron auto-OFF, logging, and notifications.

## Verification checklist

- **Main breaker OFF (Room 4):** All glows and wires cut; HUD shows `[BLACKOUT / MAIN OFF]`.
- **Table lamp ON:** Local warm aura only; branch wire stays cyan (standard load).
- **Iron (Room 2) or Stove (Room 5) ON:** Branch wire turns amber; HUD shows `[HIGH LOAD ALERT]` and wattage spike.
- **Firebase:** HUD shows `FIREBASE LIVE`; toggling a device updates RTDB and refreshes without manual reload.
