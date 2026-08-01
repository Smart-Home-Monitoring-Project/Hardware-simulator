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

## Verification checklist

- **Main breaker OFF (Room 4):** All glows and wires cut; HUD shows `[BLACKOUT / MAIN OFF]`.
- **Table lamp ON:** Local warm aura only; branch wire stays cyan (standard load).
- **Iron (Room 2) or Stove (Room 5) ON:** Branch wire turns amber; HUD shows `[HIGH LOAD ALERT]` and wattage spike.
