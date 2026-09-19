import { bindCamera } from './camera.js';
import { updateDrive, bindControls } from './controls.js';
import { updateLink } from './connection.js';
import { log } from './dom.js';
import { startTelemetry } from './telemetry.js';

bindControls();
bindCamera();
startTelemetry();
log('MVCU-01 mining dashboard loaded');
log('GPS + Laser Distance + IMU monitoring enabled');
log('ESP32 status endpoint: /status · LIVE controller data');
log('VL53L0X distance is LIVE · GPS and IMU use DEMO values', 'warn');
log('Current ESP32: motor + servo + brake + VL53L0X controller');
updateLink();
updateDrive();
