from app.api.routes.ingest import MEMORY_STORE
from fastapi import APIRouter, Query
from typing import Optional
import json

router = APIRouter(tags=["features"])

@router.get("/features")
def get_data(
    categoria: Optional[str] = Query(None, description="Filtrar por categoría exacta"),
    nombre: Optional[str] = Query(None, description="Búsqueda parcial por nombre")
):
    if MEMORY_STORE["gdf"] is None:
        return {"count": 0, "features": []}
    
    gdf = MEMORY_STORE["gdf"].copy()
    
    # Filtro por categoría
    if categoria:
        gdf = gdf[gdf["categoria"] == categoria]
    
    # Filtro por nombre (búsqueda parcial, case-insensitive)
    if nombre:
        gdf = gdf[gdf["nombre"].str.contains(nombre, case=False, na=False)]
    
    # Convertir GeoDataFrame a GeoJSON
    geojson = json.loads(gdf.to_json())
    
    return {
        "count": len(gdf),
        "total_in_memory": MEMORY_STORE["count"],
        "crs": MEMORY_STORE["crs"].to_string(),
        "features": geojson["features"]
    }