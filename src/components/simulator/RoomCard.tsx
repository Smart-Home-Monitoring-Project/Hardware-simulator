import DeviceControlCard from './DeviceControlCard';
import MultiSwitchPanel from './MultiSwitchPanel';
import styles from './HomeSimulator.module.css';
import { ROOM_BOUNDS } from './houseLayout';
import { RoomPanel } from './HomeSimulator.styles';
import { isPowered } from '../../types/simulator';
import { EffectiveDevice, RoomViewModel } from './useSimulatorState';

export interface RoomCardProps {
  room: RoomViewModel;
  onToggleDevice: (deviceId: string) => void;
  onCycleStatus?: (deviceId: string) => void;
}

function hasCeilingOn(devices: EffectiveDevice[]): boolean {
  return devices.some(
    (d) => d.type === 'ceiling_light' && isPowered(d.effectiveStatus),
  );
}

function hasLampOn(devices: EffectiveDevice[]): boolean {
  return devices.some(
    (d) => d.type === 'table_lamp' && isPowered(d.effectiveStatus),
  );
}

function hasAcOn(devices: EffectiveDevice[]): boolean {
  return devices.some(
    (d) => d.type === 'air_conditioner' && isPowered(d.effectiveStatus),
  );
}

/** Room overlay: devices live inside this room's bounds */
export default function RoomCard({
  room,
  onToggleDevice,
  onCycleStatus,
}: RoomCardProps) {
  const bounds = ROOM_BOUNDS.find((b) => b.roomId === room.id);
  if (!bounds) return null;

  const deviceById = Object.fromEntries(room.devices.map((d) => [d.id, d]));
  const ceilingOn = hasCeilingOn(room.devices);
  const lampOn = hasLampOn(room.devices);
  const acOn = hasAcOn(room.devices);

  return (
    <RoomPanel
      style={{
        left: `${bounds.left}%`,
        top: `${bounds.top}%`,
        width: `${bounds.width}%`,
        height: `${bounds.height}%`,
      }}
      $isBreakerRoom={room.isMainBreakerRoom}
    >
      <div
        className={`${styles.ceilingGlow} ${ceilingOn ? styles.ceilingGlowActive : ''}`}
        aria-hidden
      />
      <div
        className={`${styles.roomLampWash} ${lampOn ? styles.roomLampWashActive : ''}`}
        aria-hidden
      />
      <div
        className={`${styles.roomAcWash} ${acOn ? styles.roomAcWashActive : ''}`}
        aria-hidden
      />

      {bounds.devices.map((placement) => {
        const device = deviceById[placement.deviceId];
        if (!device) return null;
        if (device.type === 'multi_switch') return null;

        return (
          <DeviceControlCard
            key={device.id}
            id={device.id}
            name={device.name}
            type={device.type}
            status={device.status}
            effectiveStatus={device.effectiveStatus}
            schedule={device.schedule}
            onToggle={onToggleDevice}
            onCycleStatus={onCycleStatus}
            style={{
              left: `${placement.x}%`,
              top: `${placement.y}%`,
            }}
          />
        );
      })}

      {(bounds.panels ?? []).map((panel) => {
        const switches = panel.switchIds
          .map((id) => deviceById[id])
          .filter((d): d is EffectiveDevice => Boolean(d));

        return (
          <MultiSwitchPanel
            key={panel.panelId}
            label={panel.label}
            switches={switches}
            onToggle={onToggleDevice}
            onCycleStatus={onCycleStatus}
            style={{
              left: `${panel.x}%`,
              top: `${panel.y}%`,
            }}
          />
        );
      })}
    </RoomPanel>
  );
}
