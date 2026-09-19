import { ESP32_BASE_URL, state } from './state.js';
import { $, setText } from './dom.js';

function updateDemoTelemetry() {
  const dt = (Date.now() - state.last) / 3600000;
  state.last = Date.now();
  if (state.vehicleOn && !state.brake && state.direction !== 'STOP') {
    state.speed = Math.max(0, state.pwm * .18);
    state.tripKm += state.speed * dt;
  } else state.speed = 0;
  const current = state.vehicleOn && !state.brake ? state.pwm * .12 : 0;
  const motorTemp = 32 + (state.vehicleOn ? Math.min(28, state.pwm * .22) : 0);
  const controllerTemp = 30 + (state.vehicleOn ? Math.min(22, state.pwm * .15) : 0);
  setText('speed', state.speed.toFixed(1)); setText('distance', state.tripKm.toFixed(2));
  setText('rpm', Math.round(state.speed * 150)); setText('current', current.toFixed(1));
  setText('power', Math.round(24.6 * current));
  setText('motorTemp', motorTemp.toFixed(0)); setText('controllerTemp', controllerTemp.toFixed(0));
  setText('battery', Math.max(15, 92 - state.tripKm * .7).toFixed(0));

  if (state.vehicleOn && state.direction !== 'STOP' && !state.brake) {
    const step = state.speed * dt / 111.32;
    if (state.direction === 'forward') state.gpsLat += step;
    if (state.direction === 'reverse') state.gpsLat -= step;
    if (state.direction === 'left') { state.gpsLon -= step * .55; state.gpsHeading = (state.gpsHeading + 4) % 360; }
    if (state.direction === 'right') { state.gpsLon += step * .55; state.gpsHeading = (state.gpsHeading + 4) % 360; }
  }
  setText('gpsLat', state.gpsLat.toFixed(6)); setText('gpsLon', state.gpsLon.toFixed(6));
  setText('gpsAlt', Math.round(state.gpsAlt + (Math.random() - .5) * .4) + ' m');
  setText('gpsHeading', Math.round(state.gpsHeading) + '°');
  setText('gpsSats', state.vehicleOn ? Math.floor(10 + Math.random() * 5) : 12);
  setText('gpsAccuracy', '±' + (1.8 + Math.random() * .8).toFixed(1) + ' m');
  setText('gpsUpdateAge', (0.3 + Math.random() * .4).toFixed(1) + 's');
  $('vehicleDot').style.left = (42 + (state.gpsLon - 75.9553) * 900) + '%';
  $('vehicleDot').style.top = (57 - (state.gpsLat - 30.5164) * 900) + '%';

  const moving = state.vehicleOn && !state.brake && state.direction !== 'STOP';
  state.imuRoll = moving ? Math.sin(Date.now() / 700) * 3.5 : Math.sin(Date.now() / 1400) * .3;
  state.imuPitch = moving ? Math.cos(Date.now() / 900) * 2.8 : Math.cos(Date.now() / 1600) * .2;
  setText('imuAx', (moving ? (Math.random() - .5) * 1.2 : .02).toFixed(2));
  setText('imuAy', (moving ? (Math.random() - .5) * 1.0 : -.01).toFixed(2));
  setText('imuAz', (9.81 + (Math.random() - .5) * .08).toFixed(2));
  setText('imuRoll', state.imuRoll.toFixed(1) + '°'); setText('imuPitch', state.imuPitch.toFixed(1) + '°');
  setText('avgSpeed', (12 + state.speed * .35).toFixed(1));
  setText('fleetDistance', (126.8 + state.tripKm).toFixed(1));
}

function updateLaserDisplay() {
  const distance = Number(state.laser);

  if (!Number.isFinite(distance) || distance < 0) {
    setText('laserDistance', '--');
    $('laserBar').style.width = '0%';
    setText('laserStatus', '● SENSOR ERROR');
    setText('mobLaser', 'ERROR');
    $('mobLaser').className = 'red';
    return;
  }

  const meters = distance > 20 ? distance / 1000 : distance;

  setText('laserDistance', meters.toFixed(2));

  const percentage = Math.max(
    4,
    Math.min(100, (meters / 4) * 100)
  );

  $('laserBar').style.width = percentage + '%';

  if (meters < 0.5) {
    setText('laserStatus', '● CRITICAL · OBSTACLE VERY CLOSE');
    setText('mobLaser', 'CRITICAL');
    $('mobLaser').className = 'red';
  } else if (meters < 1.0) {
    setText('laserStatus', '● WARNING · REDUCE SPEED');
    setText('mobLaser', 'WARNING');
    $('mobLaser').className = 'yellow';
  } else {
    setText('laserStatus', '● SAFE · CLEAR PATH');
    setText('mobLaser', 'SAFE');
    $('mobLaser').className = 'green';
  }
}

async function pollTelemetry() {
  if (!state.wifiConnected) return;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1200);
    const response = await fetch(ESP32_BASE_URL + '/telemetry', { cache: 'no-store', signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    const data = await response.json();
    if (data.lat != null) setText('gpsLat', Number(data.lat).toFixed(6));
    if (data.lon != null) setText('gpsLon', Number(data.lon).toFixed(6));
    if (data.alt != null) setText('gpsAlt', Number(data.alt).toFixed(0) + ' m');
    if (data.heading != null) setText('gpsHeading', Number(data.heading).toFixed(0) + '°');
    if (data.speed != null) { state.speed = Number(data.speed); setText('speed', state.speed.toFixed(1)); }
    if (data.laser != null) state.laser = Number(data.laser);
    if (data.ax != null) setText('imuAx', Number(data.ax).toFixed(2));
    if (data.ay != null) setText('imuAy', Number(data.ay).toFixed(2));
    if (data.az != null) setText('imuAz', Number(data.az).toFixed(2));
    if (data.roll != null) setText('imuRoll', Number(data.roll).toFixed(1) + '°');
    if (data.pitch != null) setText('imuPitch', Number(data.pitch).toFixed(1) + '°');
    } catch (error) {
    setText('mobLink', 'OFFLINE');
    $('mobLink').className = 'red';

    console.warn('ESP32 telemetry unavailable:', error.message);
  }

export function startTelemetry() {
  setInterval(updateDemoTelemetry, 500);
  setInterval(updateLaserDisplay, 200);
  setInterval(pollTelemetry, 1000);
}
