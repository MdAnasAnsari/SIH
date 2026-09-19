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

export function bindControls() {
    document.querySelectorAll('[data-mode]').forEach(button => {
    button.onclick = () => {
      setDriveMode(button.dataset.mode);
    };
  });
  $('btnStart').onclick = async () => {
  state.vehicleOn = true;
  state.brake = false;
  state.direction = 'STOP';
  state.speed = 0;
  state.pwm = 0;

  $('pwmSlider').value = 0;
  setText('pwmBadge', '0%');
  setText('gaugeValue', '0%');

  updateDrive();

  await sendCommand('START');
  await sendCommand('MOTOR:OFF');
  await sendCommand('PWM:0');
  await sendCommand('SERVO:60');
  await sendCommand('BRAKE:OFF');

  setText('systemStatus', 'RUNNING');
  log('Vehicle STARTED — awaiting movement');
};
  $('btnOff').onclick = async () => {
  state.vehicleOn = false;
  state.brake = false;
  state.direction = 'STOP';
  state.speed = 0;
  state.pwm = 0;

  $('pwmSlider').value = 0;
  setText('pwmBadge', '0%');
  setText('gaugeValue', '0%');

  updateDrive();

  await sendCommand('MOTOR:OFF');
  await sendCommand('PWM:0');
  await sendCommand('SERVO:60');
  await sendCommand('BRAKE:OFF');
  await sendCommand('OFF');

  setText('systemStatus', 'STANDBY');
  log('Vehicle OFF');
};
 $('btnStop').onclick = () => {
  state.direction = 'STOP';
  state.speed = 0;

  updateDrive();

  sendCommand('MOTOR:OFF');
  sendCommand('SERVO:60');

  log('Vehicle STOPPED');
};
  document.querySelectorAll('[data-dir]').forEach(button => {
    button.onpointerdown = () => setDirection(button.dataset.dir);
  });
  $('btnBrake').onpointerdown = brakeOn;
  $('btnBrake').onpointerup = brakeOff;
  $('btnBrake').onpointerleave = brakeOff;
  $('btnBrake').onpointercancel = brakeOff;
$('btnEmergency').onclick = async () => {
  state.vehicleOn = false;
  state.brake = true;
  state.direction = 'STOP';
  state.speed = 0;
  state.pwm = 0;

  $('pwmSlider').value = 0;
  setText('pwmBadge', '0%');
  setText('gaugeValue', '0%');

  updateDrive();

  // HARD STOP SEQUENCE
  await sendCommand('MOTOR:OFF');
  await sendCommand('PWM:0');
  await sendCommand('SERVO:60');
  await sendCommand('BRAKE:ON');
  await sendCommand('EMERGENCY:STOP');

  log('EMERGENCY STOP ACTIVATED — VEHICLE FULLY STOPPED', 'err');
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
