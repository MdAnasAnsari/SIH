import threading
import time
from pathlib import Path

import cv2
import torch
from ultralytics import YOLO


CAMERA_URL = "http://192.168.137.158:8080/video"
ML_DIR = Path(__file__).parent
YOLO26N_PATH = ML_DIR / "models" / "yolo26n.pt"
ROCK_MODEL_PATH = ML_DIR / "models" / "rock_best.pt"
INFERENCE_SIZE = 416
INFERENCE_EVERY_N_FRAMES = 2


def draw_detections(frame, result, model_label: str, color: tuple[int, int, int], rock_only: bool = False):
    detections = []
    for box in result.boxes:
        class_id = int(box.cls[0])
        class_name = result.names[class_id]
        if rock_only and class_name.lower() != "rock":
            continue

        confidence = float(box.conf[0])
        x1, y1, x2, y2 = [int(value) for value in box.xyxy[0].tolist()]
        label = f"{model_label} | {class_name} {confidence:.2f}"
        cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
        label_top = max(y1 - 8, 20)
        cv2.putText(
            frame,
            label,
            (x1, label_top),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.55,
            color,
            2,
            cv2.LINE_AA,
        )
        detections.append((class_name, confidence))
    return detections


class LatestFrameCapture:
    def __init__(self, camera_url: str):
        self.camera_url = camera_url
        self.stop_event = threading.Event()
        self.ready_event = threading.Event()
        self.lock = threading.Lock()
        self.latest_frame = None
        self.latest_frame_id = 0
        self.latest_captured_at = 0.0
        self.captured_frames = 0
        self.dropped_frames = 0
        self.error = None
        self.capture = None
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)

    def start(self) -> None:
        self.thread.start()
        self.ready_event.wait(timeout=5)

    def _capture_loop(self) -> None:
        self.capture = cv2.VideoCapture(self.camera_url)
        if not self.capture.isOpened():
            self.error = f"unable to open {self.camera_url}"
            self.ready_event.set()
            return
        self.ready_event.set()

        try:
            while not self.stop_event.is_set():
                is_valid, frame = self.capture.read()
                if not is_valid:
                    self.error = "no frame received"
                    break

                with self.lock:
                    if self.latest_frame is not None:
                        self.dropped_frames += 1
                    self.latest_frame = frame
                    self.latest_frame_id += 1
                    self.latest_captured_at = time.perf_counter()
                    self.captured_frames += 1
        finally:
            self.capture.release()

    def get_latest(self):
        with self.lock:
            if self.latest_frame is None:
                return None
            return (
                self.latest_frame.copy(),
                self.latest_frame_id,
                self.latest_captured_at,
            )

    def stop(self) -> None:
        self.stop_event.set()
        self.thread.join(timeout=2)


def main() -> None:
    print(f"Camera URL: {CAMERA_URL}")
    print(f"Inference size: {INFERENCE_SIZE}")
    print(f"Inference every N frames: {INFERENCE_EVERY_N_FRAMES}")

    try:
        yolo26n = YOLO(YOLO26N_PATH)
        rock_model = YOLO(ROCK_MODEL_PATH)
    except Exception as error:
        print(f"Model loading error: {error}")
        return

    print("YOLO26n loaded successfully")
    print(f"YOLO26n classes: {len(yolo26n.names)}")
    print("rock_best loaded successfully")
    print(f"rock_best classes: {len(rock_model.names)}")

    camera = LatestFrameCapture(CAMERA_URL)
    camera.start()
    if camera.error:
        print(f"Camera connection error: {camera.error}")
        camera.stop()
        return

    print("Phone stream opened successfully")
    print("Press q in the video window to stop.")

    observed = {"YOLO26n": set(), "rock_best": set()}
    last_frame_id = 0
    processed_frames = 0
    displayed_frames = 0
    last_latency_ms = 0.0
    last_display = None
    started_at = time.perf_counter()

    try:
        while not camera.error:
            latest = camera.get_latest()
            if latest is None:
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
                continue

            frame, frame_id, captured_at = latest
            if frame_id == last_frame_id:
                if last_display is not None:
                    cv2.imshow("MVCU Live ML Test", last_display)
                    displayed_frames += 1
                if cv2.waitKey(1) & 0xFF == ord("q"):
                    break
                continue

            last_frame_id = frame_id
            if frame_id % INFERENCE_EVERY_N_FRAMES != 0:
                continue

            with torch.no_grad():
                yolo_result = yolo26n(frame, imgsz=INFERENCE_SIZE, verbose=False)[0]
                rock_result = rock_model(frame, imgsz=INFERENCE_SIZE, verbose=False)[0]

            yolo_detections = draw_detections(frame, yolo_result, "YOLO26n", (0, 255, 0))
            rock_detections = draw_detections(
                frame,
                rock_result,
                "ROCK",
                (0, 0, 255),
                rock_only=True,
            )
            for class_name, _ in yolo_detections:
                observed["YOLO26n"].add(class_name)
            for class_name, _ in rock_detections:
                observed["rock_best"].add(class_name)

            processed_frames += 1
            last_latency_ms = (time.perf_counter() - captured_at) * 1000
            elapsed = max(time.perf_counter() - started_at, 0.001)
            processing_fps = processed_frames / elapsed
            cv2.putText(
                frame,
                f"Processed FPS: {processing_fps:.1f} | Latency: {last_latency_ms:.0f} ms",
                (15, 30),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7,
                (255, 255, 255),
                2,
                cv2.LINE_AA,
            )
            last_display = frame
            cv2.imshow("MVCU Live ML Test", last_display)
            displayed_frames += 1
            if cv2.waitKey(1) & 0xFF == ord("q"):
                break
    except KeyboardInterrupt:
        print("Live test interrupted")
    finally:
        camera.stop()
        cv2.destroyAllWindows()

    elapsed = max(time.perf_counter() - started_at, 0.001)
    print(f"Live frames captured: {camera.captured_frames}")
    print(f"Live frames processed: {processed_frames}")
    print(f"Approximate processing FPS: {processed_frames / elapsed:.2f}")
    print(f"Approximate displayed FPS: {displayed_frames / elapsed:.2f}")
    print(f"Dropped frames: {camera.dropped_frames}")
    print(f"Last processing latency: {last_latency_ms:.0f} ms")
    print(f"YOLO26n detections observed: {sorted(observed['YOLO26n'])}")
    print(f"rock_best detections observed: {sorted(observed['rock_best'])}")
    if camera.error:
        print(f"Camera read error: {camera.error}")


if __name__ == "__main__":
    main()