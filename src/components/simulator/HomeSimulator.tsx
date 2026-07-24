import { motion } from 'framer-motion';
import styles from './HomeSimulator.module.css';
import {
  HudBar,
  HudLabel,
  HudMetric,
  HudValue,
  HouseStage,
  SimulatorShell,
  StatusBadge,
  WiringSvg,
} from './HomeSimulator.styles';
import HouseBlueprint from './HouseBlueprint';
import RoomCard from './RoomCard';
import { BREAKER_HUB, DISTRIBUTION_HUB } from './houseLayout';
import { useSimulatorState } from './useSimulatorState';

function statusVariant(status: string): 'stable' | 'high' | 'blackout' {
  if (status === 'BLACKOUT / MAIN OFF') return 'blackout';
  if (status === 'HIGH LOAD ALERT') return 'high';
  return 'stable';
}

function statusClass(status: string): string {
  if (status === 'BLACKOUT / MAIN OFF') return styles.statusBadgeBlackout;
  if (status === 'HIGH LOAD ALERT') return styles.statusBadgeHighLoad;
  return styles.statusBadgeStable;
}

function wirePulseClass(loadLevel: string): string {
  if (loadLevel === 'trunk') return styles.wirePulseTrunk;
  if (loadLevel === 'high') return styles.wirePulseHigh;
  if (loadLevel === 'standard') return styles.wirePulseStandard;
  return '';
}

export default function HomeSimulator() {
  const {
    roomViewModels,
    toggleDevice,
    totalWattage,
    activeDeviceCount,
    totalDevices,
    systemStatus,
    mainBreakerOn,
    wirePaths,
    getWireColor,
  } = useSimulatorState();

  return (
    <section className={styles.simulatorRoot}>
      <SimulatorShell>
        <HudBar>
          <HudMetric>
            <HudLabel>Live Total Wattage</HudLabel>
            <HudValue>{totalWattage.toLocaleString()} W</HudValue>
          </HudMetric>

          <HudMetric>
            <HudLabel>Active Devices</HudLabel>
            <HudValue>
              {activeDeviceCount} / {totalDevices}
            </HudValue>
          </HudMetric>

          <HudMetric>
            <HudLabel>System Status</HudLabel>
            <StatusBadge
              $variant={statusVariant(systemStatus)}
              className={statusClass(systemStatus)}
            >
              [{systemStatus}]
            </StatusBadge>
          </HudMetric>
        </HudBar>

        <HouseStage>
          <HouseBlueprint rooms={roomViewModels} mainBreakerOn={mainBreakerOn} />

          <WiringSvg
            className={styles.wiringLayer}
            viewBox="0 0 1280 780"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden
          >
            {wirePaths.map((path) => {
              const color = getWireColor(path.loadLevel);
              const isActive = path.loadLevel !== 'off';

              return (
                <motion.path
                  key={path.id}
                  d={path.d}
                  stroke={color}
                  className={clsx(
                    styles.wirePath,
                    isActive ? styles.wirePathActive : styles.wirePathOff,
                    wirePulseClass(path.loadLevel),
                  )}
                  initial={false}
                  animate={{
                    stroke: color,
                    opacity: isActive ? 1 : 0.45,
                  }}
                  transition={{ duration: 0.35 }}
                />
              );
            })}

            <circle
              cx={BREAKER_HUB.x}
              cy={BREAKER_HUB.y}
              r="6"
              fill={mainBreakerOn ? '#a855f7' : '#475569'}
              opacity={0.9}
            />
            <circle
              cx={DISTRIBUTION_HUB.x}
              cy={DISTRIBUTION_HUB.y}
              r="5"
              fill={mainBreakerOn ? '#a855f7' : '#334155'}
              opacity={0.75}
            />
          </WiringSvg>

          {roomViewModels.map((room) => (
            <RoomCard key={room.id} room={room} onToggleDevice={toggleDevice} />
          ))}
        </HouseStage>
      </SimulatorShell>
    </section>
  );
}

function clsx(...values: Array<string | false | undefined>): string {
  return values.filter(Boolean).join(' ');
}
