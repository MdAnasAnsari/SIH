import argparse
from pathlib import Path

from ultralytics import YOLO


ML_DIR = Path(__file__).parent
OUTPUT_DIR = ML_DIR / "test_output"
MODEL_PATHS = {
    "YOLO26n": ML_DIR / "models" / "yolo26n.pt",
    "Rock model": ML_DIR / "models" / "rock_best.pt",
}
OUTPUT_PATHS = {
    "YOLO26n": OUTPUT_DIR / "yolo26n_result.jpg",
    "Rock model": OUTPUT_DIR / "rock_result.jpg",
}


def run_model(model_name: str, model_path: Path, image_path: Path):
    model = YOLO(model_path)
    result = model(str(image_path), verbose=False)[0]
    detections = []

    for box in result.boxes:
        class_id = int(box.cls[0])
        confidence = float(box.conf[0])
        coordinates = [round(value, 2) for value in box.xyxy[0].tolist()]
        class_name = result.names[class_id]
        detections.append((class_name, confidence, coordinates))
        print(
            f"{model_name} detection: {class_name} | "
            f"confidence: {confidence:.2f} | box: {coordinates}"
        )

    result.save(filename=OUTPUT_PATHS[model_name])
    return detections


def print_summary(model_name: str, detections: list[tuple[str, float, list[float]]]):
    print(f"\n{model_name} detections:")
    if not detections:
        print("- none")
        return
    for class_name, confidence, _ in detections:
        print(f"- {class_name}: {confidence:.2f}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Run both YOLO models on one local image.")
    parser.add_argument("image", type=Path, help="Path to one local image")
    args = parser.parse_args()

    if not args.image.is_file():
        parser.error(f"Image does not exist: {args.image}")

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for model_name, model_path in MODEL_PATHS.items():
        detections = run_model(model_name, model_path, args.image)
        print_summary(model_name, detections)


if __name__ == "__main__":
    main()