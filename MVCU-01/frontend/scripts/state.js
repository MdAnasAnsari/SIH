export const ESP32_BASE_URL = 'http://192.168.4.1';

export const state = {
  wifiConnected: false,
  vehicleOn: false,
  direction: 'STOP',
  brake: false,
  pwm: 0,
  gear: 1,
  tripKm: 0,
  speed: 0,
  last: Date.now(),
  gpsLat: 30.5164,
  gpsLon: 75.9553,
  gpsAlt: 248,
  gpsHeading: 0,
  laser: null,
  imuRoll: 0,
  imuPitch: 0,
};
