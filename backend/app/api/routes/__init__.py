from fastapi import APIRouter
from app.api.routes.health import router as health_router
from app.api.routes.ingest import router as ingest_router

# from app.api.routes.features import router as features_router
# from app.api.routes.stats import router as stats_router

api_router = APIRouter()

api_router.include_router(health_router)
api_router.include_router(ingest_router )

# api_router.include_router(features_router, prefix="/features", tags=["Features"])
# api_router.include_router(stats_router, prefix="/stats", tags=["Stats"])