import styles from './HomeSimulator.module.css';
import { isPowered } from '../../types/simulator';
import { EffectiveDevice, RoomViewModel } from './useSimulatorState';

interface HouseBlueprintProps {
  rooms: RoomViewModel[];
  mainBreakerOn: boolean;
}

function roomLit(devices: EffectiveDevice[]): boolean {
  return devices.some(
    (d) =>
      isPowered(d.effectiveStatus) &&
      (d.type === 'ceiling_light' || d.type === 'table_lamp'),
  );
}

function ceilingOn(devices: EffectiveDevice[]): boolean {
  return devices.some(
    (d) => d.type === 'ceiling_light' && isPowered(d.effectiveStatus),
  );
}

function lampOn(devices: EffectiveDevice[]): boolean {
  return devices.some(
    (d) => d.type === 'table_lamp' && isPowered(d.effectiveStatus),
  );
}

function cameraOn(devices: EffectiveDevice[]): boolean {
  return devices.some(
    (d) => d.type === 'security_camera' && isPowered(d.effectiveStatus),
  );
}

function acOn(devices: EffectiveDevice[]): boolean {
  return devices.some(
    (d) => d.type === 'air_conditioner' && isPowered(d.effectiveStatus),
  );
}

export default function HouseBlueprint({ rooms, mainBreakerOn }: HouseBlueprintProps) {
  const map = Object.fromEntries(rooms.map((r) => [r.id, r]));

  const lit = (id: string) => mainBreakerOn && roomLit(map[id]?.devices ?? []);
  const ceil = (id: string) => mainBreakerOn && ceilingOn(map[id]?.devices ?? []);
  const lamp = (id: string) => mainBreakerOn && lampOn(map[id]?.devices ?? []);
  const ac = (id: string) => mainBreakerOn && acOn(map[id]?.devices ?? []);
  const gardenCamOn = mainBreakerOn && cameraOn(map['room-garden']?.devices ?? []);
  const livingCamOn = mainBreakerOn && cameraOn(map['room-6']?.devices ?? []);

  return (
    <svg
      className={styles.houseSvg}
      viewBox="0 0 1280 780"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden
    >
      <defs>
        <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#64748b" />
          <stop offset="55%" stopColor="#475569" />
          <stop offset="100%" stopColor="#334155" />
        </linearGradient>
        <linearGradient id="whiteShell" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e8e8e8" />
        </linearGradient>
        <linearGradient id="deckWood" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c4a574" />
          <stop offset="100%" stopColor="#8b6914" />
        </linearGradient>
        <linearGradient id="darkInterior" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a1a1a" />
          <stop offset="100%" stopColor="#0a0a0a" />
        </linearGradient>
        <linearGradient id="roofFace" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6b7280" />
          <stop offset="45%" stopColor="#4b5563" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <linearGradient id="roofShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#374151" />
        </linearGradient>
        <linearGradient id="chimneyBrick" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        <pattern id="shingles" width="28" height="14" patternUnits="userSpaceOnUse">
          <rect width="28" height="14" fill="#4b5563" />
          <path d="M0 7 H28 M14 0 V14" stroke="#374151" strokeWidth="1.2" opacity="0.85" />
          <path d="M0 13.5 H28" stroke="#1f2937" strokeWidth="1" opacity="0.55" />
        </pattern>
        <linearGradient id="camBeam" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(255,255,255,0.55)" />
          <stop offset="55%" stopColor="rgba(248,113,113,0.22)" />
          <stop offset="100%" stopColor="rgba(248,113,113,0)" />
        </linearGradient>
        <filter id="warmBloom" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="14" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="softShadow" x="-10%" y="-10%" width="120%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#000" floodOpacity="0.35" />
        </filter>
        <filter id="roofShadow" x="-5%" y="-5%" width="110%" height="130%">
          <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Overcast sky */}
      <rect width="1280" height="780" fill="url(#skyGrad)" />
      <ellipse cx="640" cy="120" rx="520" ry="60" fill="#94a3b8" opacity="0.25" />

      {/* Ground / lawn */}
      <rect x="0" y="700" width="1280" height="80" fill="#3f4a3a" />
      <rect x="0" y="700" width="1280" height="18" fill="#4a5540" opacity="0.6" />

      {/* House shadow */}
      <ellipse cx="640" cy="708" rx="480" ry="18" fill="#000" opacity="0.25" />

      {/* ═══ REAL PITCHED ROOF ═══ */}
      <g filter="url(#roofShadow)">
        {/* Left roof pitch */}
        <polygon
          points="24,138 640,28 640,138"
          fill="url(#roofFace)"
        />
        <polygon
          points="24,138 640,28 640,138"
          fill="url(#shingles)"
          opacity="0.55"
        />
        {/* Right roof pitch (slightly darker for depth) */}
        <polygon
          points="640,28 1256,138 640,138"
          fill="url(#roofShade)"
        />
        <polygon
          points="640,28 1256,138 640,138"
          fill="url(#shingles)"
          opacity="0.4"
        />

        {/* Ridge cap */}
        <line
          x1="640"
          y1="28"
          x2="640"
          y2="138"
          stroke="#1f2937"
          strokeWidth="3"
          opacity="0.35"
        />
        <path
          d="M 628 34 Q 640 18 652 34"
          fill="none"
          stroke="#9ca3af"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <line x1="610" y1="32" x2="670" y2="32" stroke="#d1d5db" strokeWidth="4" strokeLinecap="round" />

        {/* Eave fascia / overhang boards */}
        <rect x="20" y="132" width="1240" height="10" rx="2" fill="#1f2937" />
        <rect x="24" y="134" width="1232" height="4" fill="#4b5563" opacity="0.7" />

        {/* Soft shadow under eaves onto house wall */}
        <rect x="48" y="138" width="1184" height="14" fill="#000" opacity="0.18" />

        {/* Chimney */}
        <rect x="980" y="42" width="42" height="78" rx="2" fill="url(#chimneyBrick)" />
        <rect x="974" y="38" width="54" height="12" rx="2" fill="#78350f" />
        <rect x="988" y="52" width="10" height="8" fill="#92400e" opacity="0.5" />
        <rect x="1004" y="68" width="10" height="8" fill="#92400e" opacity="0.5" />
        <rect x="988" y="84" width="10" height="8" fill="#92400e" opacity="0.5" />
        {/* Chimney smoke hint */}
        <ellipse cx="1001" cy="28" rx="10" ry="6" fill="#94a3b8" opacity="0.35" />
        <ellipse cx="1008" cy="18" rx="8" ry="5" fill="#cbd5e1" opacity="0.25" />
      </g>

      {/* ═══ MODULAR WHITE SHELL ═══ */}
      <g filter="url(#softShadow)">
        {/* Main body */}
        <rect x="48" y="138" width="1184" height="550" rx="6" fill="url(#whiteShell)" />
      </g>

      {/* Floor gap between levels — same tone as shell, no bright white bar */}
      <rect x="48" y="378" width="1184" height="52" fill="#ececec" />

      {/* Solid center wall accents */}
      <rect x="580" y="168" width="120" height="210" fill="#fafafa" />
      {/* Wall sconces on center panel */}
      <Sconce x={610} y={250} on={lit('room-2')} />
      <Sconce x={670} y={250} on={lit('room-2')} />

      {/* ═══ GLASS ROOM BAYS — DARK INTERIORS ═══ */}
      <GlassRoom
        x={70}
        y={168}
        w={360}
        h={210}
        lit={lit('room-1')}
        ceiling={ceil('room-1')}
        lamp={lamp('room-1')}
        acActive={ac('room-1')}
        furniture="bedroom"
      />
      <GlassRoom
        x={460}
        y={168}
        w={360}
        h={210}
        lit={lit('room-2')}
        ceiling={ceil('room-2')}
        lamp={false}
        acActive={ac('room-2')}
        furniture="utility"
      />
      <GlassRoom
        x={850}
        y={168}
        w={360}
        h={210}
        lit={lit('room-3')}
        ceiling={ceil('room-3')}
        lamp={lamp('room-3')}
        acActive={ac('room-3')}
        furniture="bedroom"
      />

      <GlassRoom
        x={70}
        y={430}
        w={360}
        h={230}
        lit={lit('room-6')}
        ceiling={ceil('room-6')}
        lamp={lamp('room-6')}
        acActive={ac('room-6')}
        furniture="living"
      />
      <GlassRoom
        x={460}
        y={430}
        w={360}
        h={230}
        lit={lit('room-4')}
        ceiling={ceil('room-4')}
        lamp={false}
        acActive={ac('room-4')}
        furniture="hall"
      />
      <GlassRoom
        x={850}
        y={430}
        w={360}
        h={230}
        lit={lit('room-5')}
        ceiling={ceil('room-5')}
        lamp={false}
        acActive={ac('room-5')}
        furniture="kitchen"
      />

      {/* Wooden front deck */}
      <rect x="48" y="660" width="1184" height="42" fill="url(#deckWood)" />
      {[80, 160, 240, 320, 400, 480, 560, 640, 720, 800, 880, 960, 1040, 1120].map((x) => (
        <line key={x} x1={x} y1="660" x2={x} y2="702" stroke="#6b5420" strokeWidth="1" opacity="0.35" />
      ))}
      {/* Deck steps */}
      <rect x="560" y="702" width="160" height="12" rx="2" fill="#a07840" />
      <rect x="580" y="714" width="120" height="10" rx="2" fill="#8b6914" />

      {/* Living-room indoor bullet CCTV */}
      <SceneBulletCamera x={392} y={445} active={livingCamOn} facing="left" />

      {/* Garden CCTV on pole (front lawn) */}
      <g>
        <rect x="126" y="695" width="6" height="42" rx="1.5" fill="#27272a" />
        <rect x="120" y="732" width="18" height="5" rx="1" fill="#18181b" />
        <SceneBulletCamera x={118} y={682} active={gardenCamOn} facing="right" scale={1.15} />
        {gardenCamOn && (
          <text
            x="158"
            y="668"
            fill="#f87171"
            fontSize="11"
            fontFamily="JetBrains Mono, monospace"
            fontWeight="700"
          >
            REC
          </text>
        )}
      </g>
    </svg>
  );
}

/** Scene-level realistic bullet CCTV drawn in house SVG */
function SceneBulletCamera({
  x,
  y,
  active,
  facing,
  scale = 1,
}: {
  x: number;
  y: number;
  active: boolean;
  facing: 'left' | 'right';
  scale?: number;
}) {
  const flip = facing === 'left' ? -1 : 1;

  return (
    <g transform={`translate(${x}, ${y}) scale(${flip * scale}, ${scale})`}>
      {/* Cone shine when ON */}
      {active && (
        <polygon
          points="28,0 78,-22 78,22"
          fill="url(#camBeam)"
          opacity="0.55"
        />
      )}

      {/* Bracket */}
      <rect x="-10" y="-5" width="12" height="10" rx="2" fill={active ? '#52525b' : '#3f3f46'} />
      <rect x="-14" y="-10" width="6" height="20" rx="1.5" fill={active ? '#71717a' : '#3f3f46'} />

      {/* Body */}
      <ellipse
        cx="14"
        cy="0"
        rx="22"
        ry="12"
        fill={active ? '#27272a' : '#3f3f46'}
        stroke={active ? '#a1a1aa' : '#52525b'}
        strokeWidth="1.8"
      />
      <ellipse
        cx="14"
        cy="0"
        rx="16"
        ry="7"
        fill="none"
        stroke={active ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}
        strokeWidth="1"
      />

      {/* Bezel + lens */}
      <circle
        cx="32"
        cy="0"
        r="10"
        fill="#09090b"
        stroke={active ? '#e4e4e7' : '#52525b'}
        strokeWidth="2"
      />
      <circle
        cx="32"
        cy="0"
        r="6.5"
        fill={active ? '#f8fafc' : '#52525b'}
        opacity={active ? 1 : 0.7}
      />
      {active && (
        <>
          <circle cx="32" cy="0" r="11" fill="rgba(255,255,255,0.22)" />
          <ellipse cx="29.5" cy="-2.5" rx="2" ry="1.3" fill="#ffffff" />
        </>
      )}

      {/* Red status LED */}
      <circle cx="2" cy="-6" r="2.4" fill={active ? '#ef4444' : '#3f3f46'} />
      {active && <circle cx="2" cy="-6" r="5" fill="rgba(239,68,68,0.4)" />}
    </g>
  );
}

function Sconce({ x, y, on }: { x: number; y: number; on: boolean }) {
  return (
    <g>
      <rect x={x - 5} y={y - 14} width={10} height={28} rx="2" fill={on ? '#fde047' : '#d4d4d4'} />
      {on && (
        <>
          <ellipse cx={x} cy={y - 22} rx={12} ry={16} fill="rgba(253,224,71,0.35)" filter="url(#warmBloom)" />
          <ellipse cx={x} cy={y + 22} rx={12} ry={16} fill="rgba(253,224,71,0.25)" />
        </>
      )}
    </g>
  );
}

type Furniture = 'bedroom' | 'utility' | 'living' | 'hall' | 'kitchen';

function GlassRoom({
  x,
  y,
  w,
  h,
  lit,
  ceiling,
  lamp,
  acActive,
  furniture,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  lit: boolean;
  ceiling: boolean;
  lamp: boolean;
  acActive: boolean;
  furniture: Furniture;
}) {
  return (
    <g>
      {/* Dark room cavity */}
      <rect x={x} y={y} width={w} height={h} fill="url(#darkInterior)" />

      {/* Warm ambient fill when any light on */}
      {lit && (
        <rect
          x={x}
          y={y}
          width={w}
          height={h}
          fill="rgba(251, 146, 60, 0.22)"
          className={styles.windowGlowActive}
        />
      )}

      {/* Cool wash when wall AC is on */}
      {acActive && (
        <ellipse
          cx={x + w * 0.28}
          cy={y + h * 0.42}
          rx={120}
          ry={90}
          fill="rgba(103, 232, 249, 0.22)"
          className={styles.sceneAcWash}
        />
      )}

      {/* Ceiling wash */}
      {ceiling && (
        <ellipse
          cx={x + w / 2}
          cy={y + 28}
          rx={w * 0.42}
          ry={55}
          fill="rgba(253, 224, 71, 0.55)"
          filter="url(#warmBloom)"
        />
      )}

      {/* Table lamp local glow */}
      {lamp && (
        <ellipse
          cx={x + w * 0.18}
          cy={y + h * 0.58}
          rx={48}
          ry={42}
          fill="rgba(245, 158, 11, 0.55)"
          filter="url(#warmBloom)"
        />
      )}

      {/* Furniture silhouettes */}
      <FurnitureSilhouette x={x} y={y} w={w} h={h} type={furniture} lit={lit} />

      {/* Wall-mounted split AC — pinned inside this room only (never outdoors) */}
      <SceneWallAc x={x + w * 0.14} y={y + h * 0.12} active={acActive} />

      {/* Black window mullions — glass facade look */}
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        fill="none"
        stroke="#0a0a0a"
        strokeWidth="5"
      />
      <line
        x1={x + w / 2}
        y1={y}
        x2={x + w / 2}
        y2={y + h}
        stroke="#0a0a0a"
        strokeWidth="3.5"
      />
      <line
        x1={x}
        y1={y + h / 2}
        x2={x + w}
        y2={y + h / 2}
        stroke="#0a0a0a"
        strokeWidth="3"
      />

      {/* Glass reflection sheen */}
      <rect
        x={x + 6}
        y={y + 6}
        width={w * 0.18}
        height={h - 12}
        fill="rgba(255,255,255,0.04)"
      />
    </g>
  );
}

/**
 * Indoor wall-split AC unit (SVG scene).
 * From the prior 4× size: width ×0.5, height ×0.75 → scale(2, 3) on the base unit.
 */
function SceneWallAc({ x, y, active }: { x: number; y: number; active: boolean }) {
  const body = active ? '#f8fafc' : '#d1d5db';
  const stroke = active ? '#cbd5e1' : '#9ca3af';
  const vent = active ? '#67e8f9' : '#6b7280';
  const led = active ? '#22d3ee' : '#6b7280';

  return (
    <g
      transform={`translate(${x}, ${y}) scale(2, 3)`}
      className={active ? styles.sceneAcOn : styles.sceneAcOff}
    >
      {/* Chassis (base 58×22 → ~116×66) */}
      <rect x={0} y={0} width={58} height={22} rx={4} fill={body} stroke={stroke} strokeWidth={1.2} />
      <line x1={6} y1={8} x2={52} y2={8} stroke={active ? '#e2e8f0' : '#c4c4c4'} strokeWidth={1} />
      {[10, 13, 16].map((vy) => (
        <rect key={vy} x={7} y={vy} width={44} height={1.4} rx={0.7} fill={vent} opacity={active ? 0.95 : 0.5} />
      ))}
      <rect x={42} y={3} width={12} height={5} rx={1} fill={active ? '#0f172a' : '#9ca3af'} opacity={0.85} />
      <circle cx={48} cy={5.5} r={1.5} fill={led} className={active ? styles.acLedOn : undefined} />
      {active && (
        <ellipse
          cx={29}
          cy={26}
          rx={22}
          ry={8}
          fill="rgba(165, 243, 252, 0.45)"
          className={styles.sceneAcMist}
        />
      )}
    </g>
  );
}

function FurnitureSilhouette({
  x,
  y,
  w,
  h,
  type,
  lit,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  type: Furniture;
  lit: boolean;
}) {
  const tone = lit ? '#4a4035' : '#2a2a2a';
  const accent = lit ? '#6b5a45' : '#333';

  switch (type) {
    case 'bedroom':
      return (
        <g opacity="0.85">
          <rect x={x + w * 0.28} y={y + h * 0.52} width={w * 0.55} height={h * 0.32} rx="3" fill={tone} />
          <rect x={x + w * 0.28} y={y + h * 0.52} width={w * 0.55} height={12} rx="2" fill={accent} />
          <rect x={x + w * 0.08} y={y + h * 0.62} width={36} height={32} rx="2" fill={accent} />
        </g>
      );
    case 'utility':
      return (
        <g opacity="0.85">
          <rect x={x + w * 0.15} y={y + h * 0.48} width={64} height={64} rx="4" fill={tone} />
          <circle cx={x + w * 0.15 + 32} cy={y + h * 0.48 + 34} r={16} fill={accent} />
          <rect x={x + w * 0.55} y={y + h * 0.58} width={90} height={26} rx="2" fill={accent} />
        </g>
      );
    case 'living':
      return (
        <g opacity="0.85">
          <rect x={x + w * 0.1} y={y + h * 0.55} width={w * 0.48} height={h * 0.28} rx="5" fill={tone} />
          <rect x={x + w * 0.68} y={y + h * 0.5} width={72} height={48} rx="2" fill={accent} />
          <rect x={x + w * 0.7} y={y + h * 0.42} width={58} height={8} rx="1" fill={lit ? '#334155' : '#1a1a1a'} />
        </g>
      );
    case 'hall':
      return (
        <g opacity="0.85">
          <rect x={x + w * 0.38} y={y + h * 0.35} width={48} height={h * 0.48} rx="2" fill="#3d2914" />
          <circle cx={x + w * 0.38 + 38} cy={y + h * 0.55} r={3.5} fill="#fbbf24" opacity={lit ? 1 : 0.4} />
          <rect x={x + w * 0.12} y={y + h * 0.65} width={64} height={22} rx="2" fill={accent} />
        </g>
      );
    case 'kitchen':
      return (
        <g opacity="0.85">
          <rect x={x + w * 0.1} y={y + h * 0.55} width={w * 0.48} height={h * 0.28} rx="3" fill={tone} />
          <rect x={x + w * 0.62} y={y + h * 0.48} width={78} height={70} rx="3" fill={accent} />
          <circle cx={x + w * 0.62 + 22} cy={y + h * 0.48 + 22} r={9} fill="#1a1a1a" />
          <circle cx={x + w * 0.62 + 54} cy={y + h * 0.48 + 22} r={9} fill="#1a1a1a" />
          <circle cx={x + w * 0.62 + 22} cy={y + h * 0.48 + 50} r={9} fill="#1a1a1a" />
          <circle cx={x + w * 0.62 + 54} cy={y + h * 0.48 + 50} r={9} fill="#1a1a1a" />
        </g>
      );
    default:
      return null;
  }
}
