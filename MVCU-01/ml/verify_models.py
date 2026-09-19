from pathlib import Path


MODEL_DIR = Path(__file__).parent / "models"
MODEL_PATHS = {
    "YOLO26n": MODEL_DIR / "yolo26n.pt",
    "rock_best": MODEL_DIR / "rock_best.pt",
}


try:
    from ultralytics import YOLO
except Exception as error:
    print(f"Dependency error: {error}")
    for model_name, model_path in MODEL_PATHS.items():
        print(f"{model_name} loaded successfully: False")
        print(f"{model_name} error: {error}")
    raise SystemExit(1)


for model_name, model_path in MODEL_PATHS.items():
    try:
        model = YOLO(model_path)
        class_names = model.names
        print(f"{model_name} loaded successfully: True")
        print(f"{model_name} class count: {len(class_names)}")
        print(f"{model_name} class names: {class_names}")
    except Exception as error:
        print(f"{model_name} loaded successfully: False")
        print(f"{model_name} error: {error}")