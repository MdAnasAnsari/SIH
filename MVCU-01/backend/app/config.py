"""Application configuration reserved for future backend services."""

import os

APP_NAME = "MVCU-01 Backend"
API_PREFIX = "/api"
FRONTEND_URL = "http://localhost:5500"
CAMERA_URL = os.getenv("MVCU_CAMERA_URL", "http://192.168.137.158:8080/video")
