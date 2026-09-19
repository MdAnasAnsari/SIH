from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.camera import router as camera_router
from app.api.routes.health import router as health_router
from app.config import API_PREFIX, APP_NAME, FRONTEND_URL


app = FastAPI(title=APP_NAME)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix=API_PREFIX)
app.include_router(camera_router, prefix=API_PREFIX)
