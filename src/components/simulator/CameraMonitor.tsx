import styles from './HomeSimulator.module.css';

export interface CameraMonitorProps {
  name: string;
  active: boolean;
  streamUri?: string;
  snapshotUri?: string;
  onClose: () => void;
}

/**
 * Mock CCTV monitoring view — snapshot image + stream URI
 * (assignment requirement beyond the outdoor camera graphic alone).
 */
export default function CameraMonitor({
  name,
  active,
  streamUri,
  snapshotUri,
  onClose,
}: CameraMonitorProps) {
  const stream =
    streamUri ?? 'https://mock.smarthome.local/house1/garden/live.m3u8';
  const snapshot =
    snapshotUri ??
    'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=480&h=270&fit=crop';

  return (
    <div className={styles.cameraModalBackdrop} onClick={onClose} role="presentation">
      <div
        className={styles.cameraModal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={`${name} monitor`}
      >
        <header className={styles.cameraModalHeader}>
          <div>
            <strong>{name}</strong>
            <span
              className={
                active ? styles.cameraModalLive : styles.cameraModalOffline
              }
            >
              {active ? '● LIVE' : '○ OFFLINE'}
            </span>
          </div>
          <button type="button" className={styles.cameraModalClose} onClick={onClose}>
            Close
          </button>
        </header>

        <div className={styles.cameraMonitorFrame}>
          {active ? (
            <img
              src={snapshot}
              alt={`${name} mock snapshot`}
              className={styles.cameraSnapshot}
            />
          ) : (
            <div className={styles.cameraOfflinePane}>Camera offline — turn ON to view feed</div>
          )}
          {active && <span className={styles.cameraRecCorner}>REC</span>}
        </div>

        <dl className={styles.cameraMeta}>
          <div>
            <dt>Snapshot URI</dt>
            <dd>
              <code>{snapshot}</code>
            </dd>
          </div>
          <div>
            <dt>Stream URI (mock)</dt>
            <dd>
              <code>{stream}</code>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
