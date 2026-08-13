import { motion } from 'framer-motion';
import type { CSSProperties, MouseEvent } from 'react';
import {
  Flame,
  Lamp,
  Lightbulb,
  Plug,
  Power,
  Shirt,
  ToggleLeft,
  Tv,
  type LucideIcon,
} from 'lucide-react';
import {
  DeviceSchedule,
  DeviceStatus,
  DeviceType,
  isPowered,
} from '../../types/simulator';
import styles from './HomeSimulator.module.css';
import { DevicePin, DevicePinIcon, ToggleButton } from './HomeSimulator.styles';

type IconDeviceType = Exclude<
  DeviceType,
  'security_camera' | 'air_conditioner' | 'multi_switch'
>;

const ICON_MAP: Record<IconDeviceType, LucideIcon> = {
  ceiling_light: Lightbulb,
  table_lamp: Lamp,
  heavy_appliance: Flame,
  main_breaker: Power,
  smart_tv: Tv,
  electrical_outlet: Plug,
};

function resolveIcon(deviceId: string, type: IconDeviceType): LucideIcon {
  if (deviceId === 'r2-iron') return Shirt;
  if (deviceId === 'r5-stove') return Flame;
  if (type === 'electrical_outlet') return Plug;
  return ICON_MAP[type] ?? ToggleLeft;
}

function canToggle(status: DeviceStatus): boolean {
  return status === 'ON' || status === 'OFF';
}

export interface DeviceControlCardProps {
  id: string;
  name: string;
  type: DeviceType;
  status: DeviceStatus;
  effectiveStatus: DeviceStatus;
  schedule?: DeviceSchedule;
  streamUri?: string;
  snapshotUri?: string;
  onToggle: (deviceId: string) => void;
  onCycleStatus?: (deviceId: string) => void;
  onOpenMonitor?: () => void;
  style?: CSSProperties;
}

export default function DeviceControlCard({
  id,
  name,
  type,
  status,
  effectiveStatus,
  schedule,
  onToggle,
  onCycleStatus,
  onOpenMonitor,
  style,
}: DeviceControlCardProps) {
  const isBreaker = type === 'main_breaker';
  const isCamera = type === 'security_camera';
  const isAc = type === 'air_conditioner';
  const active = isPowered(effectiveStatus);
  const buttonActive = status === 'ON';
  const toggleable = canToggle(status);

  const handleClick = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (event.altKey && onCycleStatus) {
      onCycleStatus(id);
      return;
    }
    if (toggleable) onToggle(id);
  };

  return (
    <DevicePin $active={active} $isBreaker={isBreaker} style={style}>
      {type === 'table_lamp' && (
        <div
          className={`${styles.lampAura} ${active ? styles.lampAuraActive : ''}`}
          aria-hidden
        />
      )}

      {isCamera || isAc ? (
        <span className={styles.acToggleAnchor} aria-hidden />
      ) : type === 'multi_switch' ? null : (
        <DevicePinIcon $active={active} $isBreaker={isBreaker}>
          {(() => {
            const Icon = resolveIcon(id, type as IconDeviceType);
            return (
              <Icon
                size={24}
                strokeWidth={2.3}
                className={active ? styles.deviceIconOn : styles.deviceIconOff}
              />
            );
          })()}
        </DevicePinIcon>
      )}

      {schedule?.enabled && (
        <span className={styles.scheduleBadge} title="Automatic daily schedule">
          {schedule.onTime}–{schedule.offTime}
        </span>
      )}

      {isCamera && onOpenMonitor && (
        <button
          type="button"
          className={styles.cameraViewBtn}
          onClick={(e) => {
            e.stopPropagation();
            onOpenMonitor();
          }}
        >
          VIEW
        </button>
      )}

      <motion.div whileTap={toggleable || onCycleStatus ? { scale: 0.88 } : undefined}>
        <ToggleButton
          type="button"
          $active={buttonActive}
          disabled={!toggleable && !onCycleStatus}
          className={buttonActive ? styles.toggleGlowOn : styles.toggleGlowOff}
          onClick={handleClick}
          aria-pressed={buttonActive}
          aria-label={`${name} ${status}`}
          title="Click: ON/OFF · Alt+click: cycle ERROR/DISCONNECTED"
        >
          {status}
        </ToggleButton>
      </motion.div>
    </DevicePin>
  );
}
