import type { CSSProperties, MouseEvent } from 'react';
import { DeviceStatus } from '../../types/simulator';
import styles from './HomeSimulator.module.css';
import type { EffectiveDevice } from './useSimulatorState';

export interface MultiSwitchPanelProps {
  device: EffectiveDevice;
  mainBreakerOn: boolean;
  onToggleSwitch: (deviceId: string, switchId: string) => void;
  onCycleStatus?: (deviceId: string) => void;
  style?: CSSProperties;
}

function statusClass(status: DeviceStatus): string {
  if (status === 'ON') return styles.msuBtnOn;
  if (status === 'ERROR') return styles.msuBtnError;
  if (status === 'DISCONNECTED') return styles.msuBtnDisc;
  return styles.msuBtnOff;
}

/**
 * Single multi_switch Firebase entity with nested independent channels.
 * Path: .../devices/{msuId}/switches/{swId}/status
 */
export default function MultiSwitchPanel({
  device,
  mainBreakerOn,
  onToggleSwitch,
  onCycleStatus,
  style,
}: MultiSwitchPanelProps) {
  const channels = device.switches ?? [];
  if (channels.length === 0) return null;

  const unitFaulted =
    device.status === 'ERROR' || device.status === 'DISCONNECTED';
  const canOperate = mainBreakerOn && !unitFaulted;
  const anyActive = canOperate && channels.some((sw) => sw.status === 'ON');

  const handleClick = (
    event: MouseEvent,
    switchId: string,
    status: DeviceStatus,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.altKey && onCycleStatus) {
      onCycleStatus(device.id);
      return;
    }
    if (!canOperate) return;
    if (status === 'ON' || status === 'OFF') {
      onToggleSwitch(device.id, switchId);
    }
  };

  return (
    <div
      className={`${styles.msuPanel} ${anyActive ? styles.msuPanelOn : ''}`}
      style={style}
      role="group"
      aria-label={device.name}
      onMouseDown={(e) => e.stopPropagation()}
    >
      <div className={styles.msuTitle}>Kitchen Multi-Switch</div>
      <div className={styles.msuUnitStatus}>
        Unit: <strong>{device.status}</strong>
      </div>
      <div className={styles.msuRows}>
        {channels.map((sw) => {
          const toggleable =
            canOperate && (sw.status === 'ON' || sw.status === 'OFF');
          const lit = canOperate && sw.status === 'ON';

          return (
            <div key={sw.id} className={styles.msuRow}>
              <span
                className={`${styles.msuChannel} ${lit ? styles.msuChannelOn : ''}`}
              >
                {sw.name}
              </span>
              <button
                type="button"
                className={`${styles.msuBtn} ${statusClass(sw.status)}`}
                disabled={!toggleable && !onCycleStatus}
                onClick={(e) => handleClick(e, sw.id, sw.status)}
                aria-pressed={sw.status === 'ON'}
                aria-label={`${device.name} ${sw.name} ${sw.status}`}
                title="Independent channel on multi-switch unit"
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
