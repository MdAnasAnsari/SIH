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
log('ESP32 telemetry endpoint: /status');
log('VL53L0X laser distance sensor connected to ESP32');
log('GPS and IMU currently use DEMO values until sensors are connected', 'warn');

updateLink();
updateDrive();
