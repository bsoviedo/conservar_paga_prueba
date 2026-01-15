from app.api.routes.ingest import MEMORY_STORE
from fastapi import APIRouter, Query, HTTPException
from typing import Optional, Literal
import json

router = APIRouter(tags=["stats"])

@router.get("/stats")
def get_stats(
    stat_type: Literal["count", "area"] = Query(..., description="Tipo de estadística: count o area, el area se devuelve en ha")
):
    if MEMORY_STORE["gdf"] is None:
        return {"message": "No hay datos en memoria", "stats": {}}
    
    gdf = MEMORY_STORE["gdf"].copy()
    
    if stat_type == "count":
        # Conteo por categoría
        counts = gdf["categoria"].value_counts().to_dict()
        return {
            "stat_type": "count",
            "total": len(gdf),
            "by_categoria": counts
        }
    
    elif stat_type == "area":
        # Área total por categoría (solo para geometrías de tipo Polygon/MultiPolygon)
        # Proyectamos a un CRS métrico apropiado para Colombia (EPSG:3116 - MAGNA-SIRGAS / Colombia Bogota zone)
        try:
            gdf_projected = gdf.to_crs(epsg=3116)
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Error al proyectar geometrías: {str(e)}"
            )
        
        # Calcular áreas en hectáreas (1 ha = 10,000 m²)
        gdf_projected["area_ha"] = gdf_projected.geometry.area / 10000
        
        # Agrupar por categoría
        area_by_cat = gdf_projected.groupby("categoria")["area_ha"].sum().to_dict()
        total_area = gdf_projected["area_ha"].sum()
        
        return {
            "stat_type": "area",
            "unit": "ha",
            "crs_used": "EPSG:3116",
            "total_area": float(total_area),
            "by_categoria": {k: float(v) for k, v in area_by_cat.items()}
        }