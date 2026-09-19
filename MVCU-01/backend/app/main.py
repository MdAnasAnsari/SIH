from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.camera import router as camera_router
from app.api.routes.health import router as health_router
from app.config import API_PREFIX, APP_NAME, FRONTEND_URL


app = FastAPI(title=APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
        "http://localhost:5500",
        "http://127.0.0.1:5500",
        "null",
    ],
    allow_credentials=False,
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=API_PREFIX)
app.include_router(camera_router, prefix=API_PREFIX)
