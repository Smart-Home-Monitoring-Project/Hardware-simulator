import styles from './HomeSimulator.module.css';

interface RealCctvGraphicProps {
  active: boolean;
  /** bullet = outdoor style, dome = indoor ceiling style */
  variant?: 'bullet' | 'dome';
  size?: number;
}

/** Detailed CCTV illustration — clearer than a generic icon */
export default function RealCctvGraphic({
  active,
  variant = 'bullet',
  size = 44,
}: RealCctvGraphicProps) {
  if (variant === 'dome') {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        className={active ? styles.cctvSvgOn : styles.cctvSvgOff}
        aria-hidden
      >
        {/* Mount plate */}
        <rect x="22" y="8" width="20" height="6" rx="1.5" fill={active ? '#334155' : '#27272a'} />
        {/* Dome shell */}
        <ellipse
          cx="32"
          cy="34"
          rx="20"
          ry="18"
          fill={active ? '#1e293b' : '#18181b'}
          stroke={active ? '#94a3b8' : '#3f3f46'}
          strokeWidth="2"
        />
        {/* Glass dome highlight */}
        <ellipse
          cx="32"
          cy="34"
          rx="14"
          ry="12"
          fill={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.04)'}
        />
        {/* Lens */}
        <circle cx="32" cy="36" r="8" fill={active ? '#0f172a' : '#09090b'} />
        <circle cx="32" cy="36" r="5" fill={active ? '#e2e8f0' : '#3f3f46'} />
        <circle cx="32" cy="36" r="2.5" fill={active ? '#ffffff' : '#52525b'} />
        {active && (
          <>
            <circle cx="32" cy="36" r="11" fill="rgba(255,255,255,0.12)" />
            <circle cx="40" cy="24" r="2.2" fill="#ef4444" className={styles.cctvLedPulse} />
          </>
        )}
        {!active && <circle cx="40" cy="24" r="2" fill="#3f3f46" />}
      </svg>
    );
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 72 56"
      className={active ? styles.cctvSvgOn : styles.cctvSvgOff}
      aria-hidden
    >
      {/* Wall bracket */}
      <rect x="4" y="22" width="10" height="12" rx="2" fill={active ? '#475569' : '#27272a'} />
      <rect x="10" y="26" width="12" height="5" rx="1" fill={active ? '#64748b' : '#3f3f46'} />

      {/* Camera body */}
      <rect
        x="20"
        y="14"
        width="36"
        height="28"
        rx="6"
        fill={active ? '#1e293b' : '#18181b'}
        stroke={active ? '#cbd5e1' : '#3f3f46'}
        strokeWidth="2"
      />

      {/* Top sun shield / hood */}
      <path
        d="M22 18 H52 L56 14 H20 Z"
        fill={active ? '#334155' : '#27272a'}
      />

      {/* Lens barrel */}
      <ellipse
        cx="56"
        cy="28"
        rx="10"
        ry="11"
        fill={active ? '#0f172a' : '#09090b'}
        stroke={active ? '#e2e8f0' : '#52525b'}
        strokeWidth="2"
      />
      {/* Glass lens */}
      <ellipse cx="56" cy="28" rx="6" ry="7" fill={active ? '#f8fafc' : '#3f3f46'} />
      <ellipse
        cx="54"
        cy="25"
        rx="2.2"
        ry="2.8"
        fill={active ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.08)'}
      />

      {/* Status LED */}
      <circle
        cx="30"
        cy="22"
        r="2.4"
        fill={active ? '#ef4444' : '#3f3f46'}
        className={active ? styles.cctvLedPulse : undefined}
      />

      {/* ON: white lens bloom + red tip glow */}
      {active && (
        <>
          <ellipse cx="64" cy="28" rx="14" ry="10" fill="rgba(255,255,255,0.35)" />
          <ellipse cx="68" cy="28" rx="18" ry="12" fill="rgba(248,113,113,0.22)" />
        </>
      )}
    </svg>
  );
}
