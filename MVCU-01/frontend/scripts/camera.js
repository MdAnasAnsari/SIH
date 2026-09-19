import { $, log, setText } from './dom.js';

function startCamera() {
  const url = $('cameraUrl').value.trim();
  if (!url) {
    log('Enter phone camera stream URL', 'warn');
    return;
  }
  $('cameraStream').src = url;
  $('cameraStream').style.display = 'block';
  $('cameraPlaceholder').style.display = 'none';
  setText('cameraStatus', 'ONLINE');
  setText('cameraBadge', 'ONLINE');
  setText('cameraRec', '● CAMERA LIVE');
  setText('mobCamera', 'ONLINE');
  $('mobCamera').className = 'green';
  log('Phone camera stream started');
}

function stopCamera() {
  const image = $('cameraStream');
  image.src = '';
  image.style.display = 'none';
  $('cameraPlaceholder').style.display = 'block';
  setText('cameraStatus', 'OFFLINE');
  setText('cameraBadge', 'OFFLINE');
  setText('cameraRec', '● CAMERA OFF');
  setText('mobCamera', 'OFFLINE');
  $('mobCamera').className = 'red';
  log('Phone camera stream stopped', 'warn');
}

export function bindCamera() {
  $('btnCameraStart').onclick = startCamera;
  $('btnCameraStop').onclick = stopCamera;
  $('btnSetCamera').onclick = () => {
  const url = $('cameraUrl').value.trim();

  if (!url) {
    log('Enter a valid camera URL', 'warn');
    return;
  }

  stopCamera();

  log('Camera URL updated: ' + url);

  startCamera();
};
  $('btnFullscreen').onclick = () => {
    const frame = $('cameraFrame');
    if (!document.fullscreenElement) frame.requestFullscreen?.();
    else document.exitFullscreen?.();
  };
}
