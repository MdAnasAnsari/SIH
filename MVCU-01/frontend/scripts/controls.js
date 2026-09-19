import { state } from './state.js';
import { $, log, setText } from './dom.js';
import { connectEsp32, disconnectEsp32, sendCommand } from './connection.js';

export function updateDrive() {
  setText('driveBadge', state.vehicleOn ? (state.brake ? 'BRAKING' : state.direction) : 'STOPPED');
  setText('direction', state.direction);
  setText('mobDirection', state.direction);
  setText('mobBrake', state.brake ? 'APPLIED' : 'RELEASED');
  setText('mobMotor', state.vehicleOn && !state.brake ? 'RUNNING' : 'STOPPED');
  $('mobBrake').className = state.brake ? 'red' : 'green';
  $('mobMotor').className = state.vehicleOn && !state.brake ? 'green' : 'muted';
}

function setDirection(direction) {

  if (state.mode === 'AUTO') {
    log(
      'Manual movement blocked: vehicle is in AUTO mode',
      'warn'
    );
    return;
  }

  if (!state.vehicleOn) {
    log('START required before direction command', 'warn');
    return;
  }

  if (state.brake) {
    log('Movement blocked: BRAKE is active', 'warn');
    return;
  }

  state.direction = direction;

  state.speed =
    direction === 'STOP'
      ? 0
      : Math.max(0.5, state.pwm * 0.18);

  updateDrive();

  sendCommand('DIR:' + direction);
}

function brakeOn() {
  state.brake = true;
  state.speed = 0;
  updateDrive();
  sendCommand('BRAKE:ON');
  log('BRAKE APPLIED', 'warn');
}

function brakeOff() {
  if (!state.brake) return;
  state.brake = false;
  updateDrive();
  sendCommand('BRAKE:OFF');
  log('BRAKE RELEASED');
}
function setDriveMode(mode) {
  const previousMode = state.mode;

  state.mode = mode;

  document.querySelectorAll('[data-mode]').forEach(button => {
    button.classList.toggle(
      'active',
      button.dataset.mode === mode
    );
  });

  setText('systemStatus', mode);

  log(`Driving mode changed: ${previousMode} → ${mode}`);

  /*
   * Send the selected mode to ESP32.
   */
  sendCommand('MODE:' + mode);

  /*
   * Safety:
   * Whenever the mode changes, stop the vehicle first.
   */
  state.direction = 'STOP';
  state.speed = 0;

  updateDrive();

  sendCommand('MOTOR:OFF');
  sendCommand('PWM:0');

  /*
   * Keep steering centered when changing modes.
   */
  sendCommand('SERVO:60');

  if (mode === 'MANUAL') {
    log('MANUAL mode active — operator controls enabled');
  }

  if (mode === 'AUTO') {
    log('AUTO mode active — autonomous control enabled', 'warn');
  }

  if (mode === 'ASSIST') {
    log('ASSIST mode active — driver assistance enabled');
  }
}
export function bindControls() {
    document.querySelectorAll('[data-mode]').forEach(button => {
    button.onclick = () => {
      setDriveMode(button.dataset.mode);
    };
  });
  $('btnStart').onclick = () => {
    state.vehicleOn = true;
    state.brake = false;
    state.direction = 'STOP';
    updateDrive();
    sendCommand('START');
    setText('systemStatus', 'RUNNING');
    log('Vehicle START command received');
  };
  $('btnOff').onclick = () => {
    state.vehicleOn = false;
    state.brake = false;
    state.direction = 'STOP';
    state.speed = 0;
    updateDrive();
    sendCommand('OFF');
    setText('systemStatus', 'STANDBY');
    log('Vehicle OFF command received', 'warn');
  };
  $('btnStop').onclick = () => {
    state.direction = 'STOP';
    state.speed = 0;
    updateDrive();
    sendCommand('DIR:STOP');
    log('Direction STOP');
  };
  document.querySelectorAll('[data-dir]').forEach(button => {
    button.onpointerdown = () => setDirection(button.dataset.dir);
  });
  $('btnBrake').onpointerdown = brakeOn;
  $('btnBrake').onpointerup = brakeOff;
  $('btnBrake').onpointerleave = brakeOff;
  $('btnBrake').onpointercancel = brakeOff;
  $('btnEmergency').onclick = () => {
    state.vehicleOn = false;
    state.brake = true;
    state.direction = 'STOP';
    state.speed = 0;
    updateDrive();
    sendCommand('BRAKE:ON');
    log('EMERGENCY STOP ACTIVATED', 'err');
    setText('systemStatus', 'EMERGENCY');
  };
  $('pwmSlider').oninput = event => {
    state.pwm = +event.target.value;
    setText('pwmBadge', state.pwm + '%');
    setText('gaugeValue', state.pwm + '%');
    sendCommand('PWM:' + state.pwm);
    if (state.vehicleOn && !state.brake && state.direction !== 'STOP') state.speed = state.pwm * .18;
  };
  document.querySelectorAll('[data-gear]').forEach(button => button.onclick = () => {
    state.gear = +button.dataset.gear;
    document.querySelectorAll('[data-gear]').forEach(item => item.classList.toggle('active', item === button));
    setText('currentGear', 'G' + state.gear);
    sendCommand('GEAR:' + state.gear);
    log('Gear changed → G' + state.gear);
  });
  document.querySelector('[data-gear="1"]').classList.add('active');
  document.querySelectorAll('[data-head]').forEach(button => button.onclick = () => {
    document.querySelectorAll('[data-head]').forEach(item => item.classList.toggle('active', item === button));
    sendCommand('HEAD:' + button.dataset.head);
    log('Headlight → ' + button.dataset.head.toUpperCase());
  });
  $('btnConnect').onclick = connectEsp32;
  $('btnDisconnect').onclick = disconnectEsp32;
  $('clearLog').onclick = () => {
    $('log').innerHTML = '';
    log('Log cleared');
  };
}
