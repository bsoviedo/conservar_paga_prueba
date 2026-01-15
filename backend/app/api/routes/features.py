from app.api.routes.ingest import MEMORY_STORE
from fastapi import APIRouter

router = APIRouter(tags=["features"])

@router.get("/features")
def get_data():
    if MEMORY_STORE["gdf"] is None:
        return {"count": 0, "features": []}
    
    return {
        "count": MEMORY_STORE["count"],
        "crs": MEMORY_STORE["crs"].to_string(),
        "features": MEMORY_STORE["gdf"].to_dict(orient="records")
    }