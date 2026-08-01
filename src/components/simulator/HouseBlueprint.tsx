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

export default function HouseBlueprint({ rooms, mainBreakerOn }: HouseBlueprintProps) {
  const map = Object.fromEntries(rooms.map((r) => [r.id, r]));

  const lit = (id: string) => mainBreakerOn && roomLit(map[id]?.devices ?? []);
  const ceil = (id: string) => mainBreakerOn && ceilingOn(map[id]?.devices ?? []);
  const lamp = (id: string) => mainBreakerOn && lampOn(map[id]?.devices ?? []);

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

      {/* Upper balcony rail */}
      <line x1="70" y1="378" x2="1210" y2="378" stroke="#1a1a1a" strokeWidth="3" />
      {[120, 280, 440, 600, 760, 920, 1080].map((x) => (
        <line key={x} x1={x} y1="378" x2={x} y2="400" stroke="#1a1a1a" strokeWidth="2" />
      ))}

      {/* Floor slab between levels */}
      <rect x="48" y="400" width="1184" height="22" fill="#f0f0f0" />
      <rect x="48" y="400" width="1184" height="4" fill="#ffffff" />

      {/* Solid white center wall accents (like reference) */}
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
    </svg>
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
  furniture,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  lit: boolean;
  ceiling: boolean;
  lamp: boolean;
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
