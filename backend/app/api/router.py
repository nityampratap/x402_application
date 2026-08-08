from fastapi import APIRouter
from app.api.v1.investigations import router as investigations_router
from app.api.v1.payments import router as payments_router
from app.api.v1.stream import router as stream_router

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(investigations_router)
api_router.include_router(payments_router)
api_router.include_router(stream_router)
