import { useId } from 'react';
import styles from './HomeSimulator.module.css';

interface RealCctvCameraProps {
  active: boolean;
  /** Compact control pin vs larger house graphic */
  size?: 'pin' | 'scene';
  className?: string;
}

/**
 * Realistic bullet CCTV graphic.
 * ON  → white lens shine + red status LED
 * OFF → flat dark gray, no glow
 */
export default function RealCctvCamera({
  active,
  size = 'pin',
  className,
}: RealCctvCameraProps) {
  const uid = useId().replace(/:/g, '');
  const dim = size === 'pin' ? 56 : 72;
  const lensId = `lensGrad-${uid}`;
  const bodyId = `bodyGrad-${uid}`;
  const glowId = `lensGlow-${uid}`;

  return (
    <div
      className={`${styles.cctvWrap} ${active ? styles.cctvWrapOn : styles.cctvWrapOff} ${className ?? ''}`}
      style={{ width: dim, height: dim }}
      aria-hidden
    >
      {active && <div className={styles.cctvBeam} />}
      <svg
        viewBox="0 0 64 64"
        width={dim}
        height={dim}
        className={styles.cctvSvg}
      >
        <defs>
          <radialGradient id={lensId} cx="38%" cy="35%" r="65%">
            {active ? (
              <>
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="35%" stopColor="#e2e8f0" />
                <stop offset="70%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#0f172a" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#52525b" />
                <stop offset="55%" stopColor="#3f3f46" />
                <stop offset="100%" stopColor="#18181b" />
              </>
            )}
          </radialGradient>
          <linearGradient id={bodyId} x1="0" y1="0" x2="1" y2="1">
            {active ? (
              <>
                <stop offset="0%" stopColor="#3f3f46" />
                <stop offset="50%" stopColor="#27272a" />
                <stop offset="100%" stopColor="#09090b" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#3f3f46" />
                <stop offset="100%" stopColor="#27272a" />
              </>
            )}
          </linearGradient>
          <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.2" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Wall mount / bracket */}
        <rect
          x="6"
          y="28"
          width="10"
          height="8"
          rx="1.5"
          fill={active ? '#52525b' : '#3f3f46'}
        />
        <rect
          x="4"
          y="24"
          width="5"
          height="16"
          rx="1"
          fill={active ? '#71717a' : '#3f3f46'}
        />

        {/* Bullet housing */}
        <ellipse
          cx="34"
          cy="32"
          rx="22"
          ry="14"
          fill={`url(#${bodyId})`}
          stroke={active ? '#a1a1aa' : '#52525b'}
          strokeWidth="1.5"
        />
        <ellipse
          cx="34"
          cy="32"
          rx="18"
          ry="10"
          fill="none"
          stroke={active ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.04)'}
          strokeWidth="1"
        />

        {/* Front bezel */}
        <circle
          cx="50"
          cy="32"
          r="11"
          fill={active ? '#18181b' : '#09090b'}
          stroke={active ? '#d4d4d8' : '#3f3f46'}
          strokeWidth="2"
        />

        {/* Glass lens */}
        <circle
          cx="50"
          cy="32"
          r="7.5"
          fill={`url(#${lensId})`}
          filter={active ? `url(#${glowId})` : undefined}
        />
        {active && (
          <ellipse cx="47.5" cy="28.5" rx="2.2" ry="1.4" fill="#ffffff" opacity="0.95" />
        )}

        {/* Status LED */}
        <circle
          cx="22"
          cy="26"
          r="2.2"
          fill={active ? '#ef4444' : '#3f3f46'}
          className={active ? styles.cctvLedOn : undefined}
        />
        {active && (
          <circle cx="22" cy="26" r="4.5" fill="rgba(239,68,68,0.35)" />
        )}
      </svg>
    </div>
  );
}
