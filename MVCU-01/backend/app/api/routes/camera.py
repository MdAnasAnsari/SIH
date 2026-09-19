from fastapi import APIRouter
from fastapi.responses import StreamingResponse

from app.config import CAMERA_URL
from app.services.camera_service import check_camera_stream, generate_camera_stream


router = APIRouter()


@router.get("/camera/status")
def camera_status() -> dict[str, object]:
    return check_camera_stream(CAMERA_URL)


@router.get("/camera/stream", response_class=StreamingResponse)
def camera_stream() -> StreamingResponse:
    return StreamingResponse(
        generate_camera_stream(CAMERA_URL),
        media_type="multipart/x-mixed-replace; boundary=frame",
    )
