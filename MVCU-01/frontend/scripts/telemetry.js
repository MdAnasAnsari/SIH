import { ESP32_BASE_URL, state } from './state.js';
import { $, setText } from './dom.js';


// ==================================================
// DASHBOARD MOTOR / VEHICLE DISPLAY
// ==================================================

function updateVehicleDisplay() {

  const moving =
    state.vehicleOn &&
    !state.brake &&
    state.direction !== 'STOP';

  // Use real GPS speed when available
  if (
    state.gpsFix &&
    Number.isFinite(state.gpsSpeed)
  ) {
    state.speed = state.gpsSpeed;
  }

  // Until GPS speed is available, show 0
  else if (!moving) {
    state.speed = 0;
  }

  setText(
    'speed',
    Number(state.speed || 0).toFixed(1)
  );

  setText(
    'rpm',
    Math.round(
      Number(state.speed || 0) * 150
    )
  );


  // Current is still estimated from PWM
  const current =
    moving
      ? Number(state.pwm || 0) * 0.12
      : 0;

  setText(
    'current',
    current.toFixed(1)
  );

  setText(
    'power',
    Math.round(24.6 * current)
  );


  // Temperature is not currently supplied
  // by the ESP32 motor controller.
  if (state.motorTemp != null) {
    setText(
      'motorTemp',
      Number(state.motorTemp).toFixed(0)
    );
  }

  if (state.controllerTemp != null) {
    setText(
      'controllerTemp',
      Number(state.controllerTemp).toFixed(0)
    );
  }


  // Battery is not currently supplied by ESP32.
  if (state.battery != null) {
    setText(
      'battery',
      Number(state.battery).toFixed(0)
    );
  }


  // Average speed
  setText(
    'avgSpeed',
    Number(state.speed || 0).toFixed(1)
  );
}


// ==================================================
// REAL LASER DISPLAY
// ==================================================

function updateLaserDisplay() {

  const distance = Number(state.laser);

  if (
    !Number.isFinite(distance) ||
    distance <= 0
  ) {

    setText(
      'laserDistance',
      '--'
    );

    $('laserBar').style.width = '0%';

    setText(
      'laserStatus',
      '● SENSOR ERROR'
    );

    setText(
      'mobLaser',
      'ERROR'
    );

    $('mobLaser').className = 'red';

    return;
  }


  // ESP32 sends distance_mm
  // state.laser is stored in meters

  const meters = distance > 20
    ? distance / 1000
    : distance;


  setText(
    'laserDistance',
    meters.toFixed(2)
  );


  const percentage =
    Math.max(
      4,
      Math.min(
        100,
        (meters / 4) * 100
      )
    );

  $('laserBar').style.width =
    percentage + '%';


  // ==========================================
  // SAFETY ZONES
  // ==========================================

  if (meters < 0.5) {

    setText(
      'laserStatus',
      '● CRITICAL · OBSTACLE VERY CLOSE'
    );

    setText(
      'mobLaser',
      'CRITICAL'
    );

    $('mobLaser').className =
      'red';

  }

  else if (meters < 1.0) {

    setText(
      'laserStatus',
      '● WARNING · REDUCE SPEED'
    );

    setText(
      'mobLaser',
      'WARNING'
    );

    $('mobLaser').className =
      'yellow';

  }

  else {

    setText(
      'laserStatus',
      '● SAFE · CLEAR PATH'
    );

    setText(
      'mobLaser',
      'SAFE'
    );

    $('mobLaser').className =
      'green';
  }
}


// ==================================================
// REAL GPS DISPLAY
// ==================================================

function updateGPSDisplay() {

  if (state.gpsFix) {

    setText(
      'gpsLat',
      Number(state.gpsLat).toFixed(6)
    );

    setText(
      'gpsLon',
      Number(state.gpsLon).toFixed(6)
    );

    setText(
      'gpsAlt',
      Number(state.gpsAlt).toFixed(1) + ' m'
    );

    setText(
      'gpsHeading',
      Number(state.gpsHeading || 0).toFixed(0) + '°'
    );

    setText(
      'gpsSats',
      Number(state.gpsSats || 0)
    );

    // NEO-6M does not currently provide
    // an explicit accuracy value in your ESP32 JSON.
    setText(
      'gpsAccuracy',
      state.gpsSats > 0
        ? 'GPS FIX'
        : 'NO FIX'
    );

    setText(
      'gpsUpdateAge',
      'LIVE'
    );

  }

  else {

    setText(
      'gpsLat',
      '--'
    );

    setText(
      'gpsLon',
      '--'
    );

    setText(
      'gpsAlt',
      '--'
    );

    setText(
      'gpsHeading',
      '--'
    );

    setText(
      'gpsSats',
      '0'
    );

    setText(
      'gpsAccuracy',
      'NO FIX'
    );

    setText(
      'gpsUpdateAge',
      '--'
    );
  }


  // ==========================================
  // MAP POSITION
  // ==========================================

  if (state.gpsFix) {

    const lat =
      Number(state.gpsLat);

    const lon =
      Number(state.gpsLon);


    $('vehicleDot').style.left =
      (
        42 +
        (lon - 75.9553) * 900
      ) + '%';


    $('vehicleDot').style.top =
      (
        57 -
        (lat - 30.5164) * 900
      ) + '%';
  }
}


// ==================================================
// REAL MPU6050 DISPLAY
// ==================================================

function updateIMUDisplay() {

  setText(
    'imuAx',
    Number(state.imuAx || 0).toFixed(2)
  );

  setText(
    'imuAy',
    Number(state.imuAy || 0).toFixed(2)
  );

  setText(
    'imuAz',
    Number(state.imuAz || 0).toFixed(2)
  );


  // Your current ESP32 code sends acceleration
  // and gyro, but does NOT calculate roll/pitch.
  //
  // Therefore we calculate basic tilt here
  // from the accelerometer.

  const ax =
    Number(state.imuAx || 0);

  const ay =
    Number(state.imuAy || 0);

  const az =
    Number(state.imuAz || 0);


  const roll =
    Math.atan2(
      ay,
      Math.sqrt(
        ax * ax +
        az * az
      )
    ) * 180 / Math.PI;


  const pitch =
    Math.atan2(
      -ax,
      Math.sqrt(
        ay * ay +
        az * az
      )
    ) * 180 / Math.PI;


  state.imuRoll = roll;
  state.imuPitch = pitch;


  setText(
    'imuRoll',
    roll.toFixed(1) + '°'
  );

  setText(
    'imuPitch',
    pitch.toFixed(1) + '°'
  );
}


// ==================================================
// ESP32 TELEMETRY
// ==================================================

async function pollTelemetry() {

  if (!state.wifiConnected) {
    return;
  }


  try {

    const controller =
      new AbortController();


    const timer =
      setTimeout(
        () => controller.abort(),
        1200
      );


    // IMPORTANT:
    // ESP32 provides /status
    // NOT /telemetry

    const response =
      await fetch(
        ESP32_BASE_URL + '/status',
        {
          cache: 'no-store',
          signal: controller.signal
        }
      );


    clearTimeout(timer);


    if (!response.ok) {

      throw new Error(
        'HTTP ' + response.status
      );
    }


    const data =
      await response.json();


    // ==========================================
    // MOTOR
    // ==========================================

    if (
      data.motorEnabled != null
    ) {

      state.vehicleOn =
        Boolean(
          data.motorEnabled
        );
    }


    if (
      data.brake != null
    ) {

      state.brake =
        Boolean(
          data.brake
        );
    }


    if (
      data.pwm != null
    ) {

      state.pwm =
        Number(data.pwm);


      const pwmPercent =
        Math.round(
          (state.pwm / 255) * 100
        );


      setText(
        'pwmBadge',
        pwmPercent + '%'
      );

      setText(
        'gaugeValue',
        pwmPercent + '%'
      );


      if ($('pwmSlider')) {

        $('pwmSlider').value =
          pwmPercent;
      }
    }


    // ==========================================
    // GEAR
    // ==========================================

    if (
      data.gear != null
    ) {

      state.gear =
        Number(data.gear);


      setText(
        'currentGear',
        'G' + state.gear
      );


      document
        .querySelectorAll('[data-gear]')
        .forEach(button => {

          button.classList.toggle(
            'active',
            Number(
              button.dataset.gear
            ) === state.gear
          );

        });
    }


    // ==========================================
    // STEERING
    // ==========================================

    if (
      data.steering != null
    ) {

      const steering =
        Number(data.steering);


      if (steering < 45) {

        state.direction =
          'LEFT';

      }

      else if (steering > 75) {

        state.direction =
          'RIGHT';

      }

      else if (!state.vehicleOn) {

        state.direction =
          'STOP';
      }
    }


    // ==========================================
    // VL53L0X
    // ==========================================

    if (
      data.distance_mm != null
    ) {

      const mm =
        Number(data.distance_mm);


      if (
        data.sensor_ok &&
        mm > 0
      ) {

        // Store in meters
        state.laser =
          mm / 1000;

      }

      else {

        state.laser =
          null;
      }
    }


    // ==========================================
    // GPS
    // ==========================================

    if (
      data.gps_fix != null
    ) {

      state.gpsFix =
        Boolean(data.gps_fix);
    }


    if (
      data.latitude != null
    ) {

      state.gpsLat =
        Number(data.latitude);
    }


    if (
      data.longitude != null
    ) {

      state.gpsLon =
        Number(data.longitude);
    }


    if (
      data.altitude_m != null
    ) {

      state.gpsAlt =
        Number(data.altitude_m);
    }


    if (
      data.gps_speed_kmph != null
    ) {

      state.gpsSpeed =
        Number(data.gps_speed_kmph);
    }


    if (
      data.gps_satellites != null
    ) {

      state.gpsSats =
        Number(data.gps_satellites);
    }


    if (
      data.gps_heading != null
    ) {

      state.gpsHeading =
        Number(data.gps_heading);
    }


    // ==========================================
    // MPU6050
    // ==========================================

    if (
      data.mpu_ok != null
    ) {

      state.imuOK =
        Boolean(data.mpu_ok);
    }


    if (
      data.accel_x != null
    ) {

      state.imuAx =
        Number(data.accel_x);
    }


    if (
      data.accel_y != null
    ) {

      state.imuAy =
        Number(data.accel_y);
    }


    if (
      data.accel_z != null
    ) {

      state.imuAz =
        Number(data.accel_z);
    }


    if (
      data.gyro_x != null
    ) {

      state.imuGx =
        Number(data.gyro_x);
    }


    if (
      data.gyro_y != null
    ) {

      state.imuGy =
        Number(data.gyro_y);
    }


    if (
      data.gyro_z != null
    ) {

      state.imuGz =
        Number(data.gyro_z);
    }


    // ==========================================
    // LINK STATUS
    // ==========================================

    state.wifiConnected =
      true;


    setText(
      'mobLink',
      'ONLINE'
    );

    $('mobLink').className =
      'green';


    setText(
      'controllerStatus',
      'ONLINE'
    );


    setText(
      'wifiStatus',
      'ONLINE'
    );


    // ==========================================
    // UPDATE REAL DATA
    // ==========================================

    updateVehicleDisplay();

    updateGPSDisplay();

    updateIMUDisplay();

    updateLaserDisplay();


  } catch (error) {

    setText(
      'mobLink',
      'OFFLINE'
    );

    $('mobLink').className =
      'red';


    setText(
      'controllerStatus',
      'OFFLINE'
    );


    console.warn(
      'ESP32 telemetry unavailable:',
      error.message
    );
  }
}


// ==================================================
// START TELEMETRY
// ==================================================

export function startTelemetry() {

  // Real ESP32 data
  setInterval(
    pollTelemetry,
    500
  );


  // Dashboard refresh
  setInterval(
    updateVehicleDisplay,
    500
  );

  setInterval(
    updateGPSDisplay,
    500
  );

  setInterval(
    updateIMUDisplay,
    500
  );

  setInterval(
    updateLaserDisplay,
    200
  );
}
