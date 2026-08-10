import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import {
  Flame,
  Lamp,
  Lightbulb,
  Power,
  Shirt,
  Tv,
  type LucideIcon,
} from 'lucide-react';
import {
  DeviceStatus,
  DeviceType,
  isPowered,
} from '../../types/simulator';
import styles from './HomeSimulator.module.css';
import { DevicePin, DevicePinIcon, ToggleButton } from './HomeSimulator.styles';

type IconDeviceType = Exclude<DeviceType, 'security_camera' | 'air_conditioner'>;

const ICON_MAP: Record<IconDeviceType, LucideIcon> = {
  ceiling_light: Lightbulb,
  table_lamp: Lamp,
  heavy_appliance: Flame,
  main_breaker: Power,
  smart_tv: Tv,
};

function resolveIcon(deviceId: string, type: IconDeviceType): LucideIcon {
  if (deviceId === 'r2-iron') return Shirt;
  if (deviceId === 'r5-stove') return Flame;
  return ICON_MAP[type];
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
  onToggle: (deviceId: string) => void;
  style?: CSSProperties;
}

export default function DeviceControlCard({
  id,
  name,
  type,
  status,
  effectiveStatus,
  onToggle,
  style,
}: DeviceControlCardProps) {
  const isBreaker = type === 'main_breaker';
  const isCamera = type === 'security_camera';
  const isAc = type === 'air_conditioner';
  const active = isPowered(effectiveStatus);
  const buttonActive = status === 'ON';
  const toggleable = canToggle(status);

  return (
    <DevicePin $active={active} $isBreaker={isBreaker} style={style}>
      {type === 'table_lamp' && (
        <div
          className={`${styles.lampAura} ${active ? styles.lampAuraActive : ''}`}
          aria-hidden
        />
      )}

      {isCamera || isAc ? (
        /* Camera/AC machines are drawn in the house SVG; pin is toggle-only */
        <span className={styles.acToggleAnchor} aria-hidden />
      ) : (
        <DevicePinIcon $active={active} $isBreaker={isBreaker}>
          {(() => {
            const Icon = resolveIcon(id, type);
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

      <motion.div whileTap={toggleable ? { scale: 0.88 } : undefined}>
        <ToggleButton
          type="button"
          $active={buttonActive}
          disabled={!toggleable}
          className={buttonActive ? styles.toggleGlowOn : styles.toggleGlowOff}
          onClick={() => toggleable && onToggle(id)}
          aria-pressed={buttonActive}
          aria-label={`${name} ${status}`}
        >
          {status}
        </ToggleButton>
      </motion.div>
    </DevicePin>
  );
}
