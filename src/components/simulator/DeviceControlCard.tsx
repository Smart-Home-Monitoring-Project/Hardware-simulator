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
  DeviceType,
  OperationalState,
  isPowered,
} from '../../types/simulator';
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

function canToggle(state: OperationalState): boolean {
  return state === 'ON' || state === 'OFF';
}

export interface DeviceControlCardProps {
  id: string;
  name: string;
  type: DeviceType;
  state: OperationalState;
  effectiveState: OperationalState;
  onToggle: (deviceId: string) => void;
  style?: CSSProperties;
}

export default function DeviceControlCard({
  id,
  name,
  type,
  state,
  effectiveState,
  onToggle,
  style,
}: DeviceControlCardProps) {
  const Icon = resolveIcon(id, type);
  const isBreaker = type === 'main_breaker';
  const lit = isPowered(effectiveState);
  const buttonOn = state === 'ON';
  const toggleable = canToggle(state);

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

      <motion.div whileTap={toggleable ? { scale: 0.88 } : undefined}>
        <ToggleButton
          type="button"
          $isOn={buttonOn}
          disabled={!toggleable}
          className={buttonOn ? styles.toggleGlowOn : styles.toggleGlowOff}
          onClick={() => toggleable && onToggle(id)}
          aria-pressed={buttonOn}
          aria-label={`${name} ${state}`}
        >
          {state}
        </ToggleButton>
      </motion.div>
    </DevicePin>
  );
}
