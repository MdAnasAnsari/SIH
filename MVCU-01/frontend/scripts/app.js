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
log('ESP32 telemetry endpoint: /telemetry (optional live JSON)');
log('Laser, GPS and IMU currently use DEMO values until sensors are connected', 'warn');
log('For production: connect GNSS + VL53L1X/ToF + 6/9-axis IMU to ESP32');
updateLink();
updateDrive();
