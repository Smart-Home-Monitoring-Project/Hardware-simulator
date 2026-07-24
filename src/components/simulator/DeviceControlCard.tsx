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
import { DeviceType } from '../../types/simulator';
import styles from './HomeSimulator.module.css';
import { DevicePin, DevicePinIcon, ToggleButton } from './HomeSimulator.styles';

const ICON_MAP: Record<DeviceType, LucideIcon> = {
  ceiling_light: Lightbulb,
  table_lamp: Lamp,
  heavy_appliance: Flame,
  main_breaker: Power,
  smart_tv: Tv,
};

function resolveIcon(deviceId: string, type: DeviceType): LucideIcon {
  if (deviceId === 'r2-iron') return Shirt;
  if (deviceId === 'r5-stove') return Flame;
  return ICON_MAP[type];
}

export interface DeviceControlCardProps {
  id: string;
  name: string;
  type: DeviceType;
  isOn: boolean;
  effectiveOn: boolean;
  onToggle: (deviceId: string) => void;
  style?: CSSProperties;
}

export default function DeviceControlCard({
  id,
  name,
  type,
  isOn,
  effectiveOn,
  onToggle,
  style,
}: DeviceControlCardProps) {
  const Icon = resolveIcon(id, type);
  const isBreaker = type === 'main_breaker';
  const lit = effectiveOn;

  return (
    <DevicePin $isOn={lit} $isBreaker={isBreaker} style={style}>
      {type === 'table_lamp' && (
        <div
          className={`${styles.lampAura} ${lit ? styles.lampAuraActive : ''}`}
          aria-hidden
        />
      )}

      <DevicePinIcon $isOn={lit} $isBreaker={isBreaker}>
        <Icon
          size={24}
          strokeWidth={2.3}
          className={lit ? styles.deviceIconOn : styles.deviceIconOff}
        />
      </DevicePinIcon>

      <motion.div whileTap={{ scale: 0.88 }}>
        <ToggleButton
          type="button"
          $isOn={isOn}
          className={isOn ? styles.toggleGlowOn : styles.toggleGlowOff}
          onClick={() => onToggle(id)}
          aria-pressed={isOn}
          aria-label={`${name} ${isOn ? 'on' : 'off'}`}
        >
          {isOn ? 'ON' : 'OFF'}
        </ToggleButton>
      </motion.div>
    </DevicePin>
  );
}
