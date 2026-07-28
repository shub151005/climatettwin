from fastapi import APIRouter

from app.api.v1.health import router as health_router
from app.api.v1.rainfall import router as rainfall_router
from app.api.v1.temperature import router as temperature_router


api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(rainfall_router)
api_router.include_router(temperature_router)