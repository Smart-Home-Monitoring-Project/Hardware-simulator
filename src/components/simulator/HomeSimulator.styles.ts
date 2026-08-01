import styled from '@emotion/styled';

export const SimulatorShell = styled.section`
  position: relative;
  max-width: 1480px;
  margin: 0 auto;
  font-family: 'Outfit', system-ui, sans-serif;
`;

export const HudBar = styled.header`
  position: relative;
  z-index: 4;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin-bottom: 1.1rem;
  padding: 1rem 1.35rem;
  border-radius: 16px;
  background: linear-gradient(
    135deg,
    rgba(15, 23, 42, 0.85) 0%,
    rgba(30, 41, 59, 0.7) 100%
  );
  backdrop-filter: blur(16px);
  border: 1px solid rgba(148, 163, 184, 0.2);
  box-shadow: 0 8px 32px rgba(2, 6, 23, 0.4);
`;

export const HudMetric = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
`;

export const HudLabel = styled.span`
  font-size: 0.7rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #94a3b8;
  font-weight: 600;
`;

export const HudValue = styled.strong`
  font-family: 'JetBrains Mono', monospace;
  font-size: clamp(1.25rem, 2vw, 1.75rem);
  font-weight: 700;
  color: #f8fafc;
  line-height: 1.1;
`;

export const StatusBadge = styled.div<{ $variant: 'stable' | 'high' | 'blackout' }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  padding: 0.5rem 0.9rem;
  border-radius: 999px;
  border: 1px solid transparent;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  background: rgba(15, 23, 42, 0.7);
`;

export const HouseStage = styled.div`
  position: relative;
  width: 100%;
  min-width: 1280px;
  aspect-ratio: 1280 / 780;
  max-height: 82vh;
  margin: 0 auto;
  border-radius: 18px;
  overflow: hidden;
  background: #475569;
  box-shadow:
    0 28px 70px rgba(2, 6, 23, 0.55),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
`;

export const RoomPanel = styled.div<{ $isBreakerRoom?: boolean }>`
  position: absolute;
  z-index: 3;
  pointer-events: none;
  border-radius: 2px;

  ${({ $isBreakerRoom }) =>
    $isBreakerRoom &&
    `
    box-shadow: inset 0 0 0 2px rgba(168, 85, 247, 0.4);
  `}
`;

export const DevicePin = styled.div<{ $active: boolean; $isBreaker?: boolean }>`
  position: absolute;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.22rem;
  transform: translate(-50%, -50%);
  pointer-events: auto;
`;

/** Device icon — primary visual inside dark room */
export const DevicePinIcon = styled.div<{ $active: boolean; $isBreaker?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: ${({ $active }) =>
    $active ? 'rgba(15, 23, 42, 0.75)' : 'rgba(10, 10, 10, 0.85)'};
  border: 2px solid
    ${({ $active, $isBreaker }) =>
      $active
        ? $isBreaker
          ? 'rgba(192, 132, 252, 0.95)'
          : 'rgba(253, 224, 71, 0.95)'
        : 'rgba(63, 63, 70, 0.9)'};
  color: ${({ $active, $isBreaker }) =>
    $active ? ($isBreaker ? '#e9d5ff' : '#fde047') : '#52525b'};
  box-shadow: ${({ $active, $isBreaker }) =>
    $active
      ? $isBreaker
        ? '0 0 22px rgba(168, 85, 247, 0.65)'
        : '0 0 28px rgba(253, 224, 71, 0.7), 0 0 12px rgba(251, 146, 60, 0.45)'
      : '0 2px 8px rgba(0,0,0,0.5)'};
  transition: border-color 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;
`;

/** Tiny ON/OFF button — smaller than device */
export const ToggleButton = styled.button<{ $active: boolean }>`
  appearance: none;
  border: none;
  cursor: pointer;
  min-width: 28px;
  height: 15px;
  padding: 0 0.28rem;
  border-radius: 999px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.48rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  line-height: 1;
  color: ${({ $active }) => ($active ? '#052e16' : '#a1a1aa')};
  background: ${({ $active }) => ($active ? '#fde047' : '#27272a')};
  border: 1px solid ${({ $active }) => ($active ? '#facc15' : '#3f3f46')};
  transition: background 0.2s ease, color 0.2s ease, transform 0.12s ease;

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.65;
  }

  &:focus-visible {
    outline: 2px solid #fde047;
    outline-offset: 2px;
  }
`;

export const WiringSvg = styled.svg`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  overflow: visible;
`;
