import { ESP32_BASE_URL, state } from './state.js';
import { $, log, setText } from './dom.js';

export function updateLink() {
  setText('wifiStatus', state.wifiConnected ? 'CONNECTED' : 'OFFLINE');
  setText('controllerStatus', state.wifiConnected ? 'CONNECTED' : 'OFFLINE');
  setText('mobLink', state.wifiConnected ? 'ONLINE' : 'OFFLINE');
  $('mobLink').className = state.wifiConnected ? 'green' : 'red';
}

export async function sendCommand(command) {
  log('TX → ' + command, 'cmd');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1800);
    const response = await fetch(ESP32_BASE_URL + '/cmd?c=' + encodeURIComponent(command), { method: 'GET', signal: controller.signal, cache: 'no-store' });
    clearTimeout(timer);
    if (!response.ok) throw new Error('HTTP ' + response.status);
    state.wifiConnected = true;
    updateLink();
    return true;
  } catch (error) {
    state.wifiConnected = false;
    updateLink();
    log('Controller unreachable: ' + error.message, 'err');
    return false;
  }
}

export async function connectEsp32() {
  log('Connecting to ESP32 controller at ' + ESP32_BASE_URL + '…', 'cmd');
  try {
    const response = await fetch(ESP32_BASE_URL + '/', { cache: 'no-store' });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    state.wifiConnected = true;
    updateLink();
    log('ESP32 Wi-Fi controller CONNECTED');
  } catch (error) {
    state.wifiConnected = false;
    updateLink();
    log('Connect failed. Join Wi-Fi MVCU-01 first.', 'err');
  }
}

export function disconnectEsp32() {
  state.wifiConnected = false;
  updateLink();
  log('ESP32 Wi-Fi link marked disconnected', 'warn');
}
