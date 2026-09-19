export const $ = id => document.getElementById(id);

export function setText(id, value) {
  $(id).textContent = value;
}

export function log(message, type = 'ok') {
  const entry = document.createElement('div');
  entry.className = 'logLine ' + (type === 'cmd' ? 'logCmd' : type === 'warn' ? 'logWarn' : type === 'err' ? 'logErr' : 'logOk');
  entry.innerHTML = '<span class="time">[' + new Date().toLocaleTimeString() + ']</span> ' + message;
  $('log').appendChild(entry);
  $('log').scrollTop = $('log').scrollHeight;
}
