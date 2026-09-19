import cv2


def check_camera_stream(camera_url: str) -> dict[str, object]:
    capture = cv2.VideoCapture(camera_url)
    try:
        is_open = capture.isOpened()
        return {
            "reachable": is_open,
            "camera_url": camera_url,
            "message": "Camera stream opened successfully" if is_open else "Unable to open camera stream",
        }
    finally:
        capture.release()


def generate_camera_stream(camera_url: str):
    capture = cv2.VideoCapture(camera_url)
    try:
        if not capture.isOpened():
            return

        while True:
            is_valid, frame = capture.read()
            if not is_valid:
                return

            is_encoded, buffer = cv2.imencode(".jpg", frame)
            if not is_encoded:
                continue

            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n"
                + buffer.tobytes()
                + b"\r\n"
            )
    finally:
        capture.release()
