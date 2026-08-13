import type { CSSProperties, MouseEvent } from 'react';
import { DeviceStatus, isPowered } from '../../types/simulator';
import styles from './HomeSimulator.module.css';
import type { EffectiveDevice } from './useSimulatorState';

export interface MultiSwitchPanelProps {
  label: string;
  switches: EffectiveDevice[];
  onToggle: (deviceId: string) => void;
  /** Alt+click cycles ON → OFF → ERROR → DISCONNECTED */
  onCycleStatus?: (deviceId: string) => void;
  style?: CSSProperties;
}

/** Short row label for room devices on the panel */
function shortLabel(name: string, deviceId: string): string {
  if (deviceId.includes('ceiling')) return 'Light';
  if (deviceId.includes('stove')) return 'Stove';
  if (deviceId.includes('outlet')) return 'Outlet';
  if (deviceId.includes('lamp')) return 'Lamp';
  if (deviceId.includes('tv')) return 'TV';
  if (deviceId.includes('iron')) return 'Iron';
  const parts = name.split('—');
  return (parts[parts.length - 1] ?? name).trim();
}

function statusClass(status: DeviceStatus): string {
  if (status === 'ON') return styles.msuBtnOn;
  if (status === 'ERROR') return styles.msuBtnError;
  if (status === 'DISCONNECTED') return styles.msuBtnDisc;
  return styles.msuBtnOff;
}

/**
 * Multi-switch unit for one room.
 * Each button toggles a real room device (same Firebase path as the device icon).
 */
export default function MultiSwitchPanel({
  label,
  switches,
  onToggle,
  onCycleStatus,
  style,
}: MultiSwitchPanelProps) {
  if (switches.length === 0) return null;

  const anyActive = switches.some((s) => isPowered(s.effectiveStatus));

  const handleClick = (event: MouseEvent, deviceId: string, status: DeviceStatus) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.altKey && onCycleStatus) {
      onCycleStatus(deviceId);
      return;
    }
    if (status === 'ON' || status === 'OFF') {
      onToggle(deviceId);
    }
  };

  return (
    <div
      className={`${styles.msuPanel} ${anyActive ? styles.msuPanelOn : ''}`}
      style={style}
      role="group"
      aria-label={label}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={styles.msuTitle}>{label}</div>
      <div className={styles.msuRows}>
        {switches.map((sw) => {
          const toggleable = sw.status === 'ON' || sw.status === 'OFF';
          const powered = isPowered(sw.effectiveStatus);

          return (
            <div key={sw.id} className={styles.msuRow}>
              <span
                className={`${styles.msuChannel} ${powered ? styles.msuChannelOn : ''}`}
              >
                {shortLabel(sw.name, sw.id)}
              </span>
              <button
                type="button"
                className={`${styles.msuBtn} ${statusClass(sw.status)}`}
                disabled={!toggleable && !onCycleStatus}
                onClick={(e) => handleClick(e, sw.id, sw.status)}
                aria-pressed={sw.status === 'ON'}
                aria-label={`${sw.name} ${sw.status}`}
                title="Controls this room device · Alt+click: cycle ERROR/DISCONNECTED"
              >
                {sw.status}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
