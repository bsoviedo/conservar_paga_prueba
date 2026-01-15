from app.api.routes.ingest import MEMORY_STORE
from fastapi import APIRouter

router = APIRouter(tags=["intersections"])

@router.get("/intersections")
def get_intersections():
    """
    Retorna todas las intersecciones que haya entre features en el gdf
    """
    if MEMORY_STORE["gdf"] is None:
        return {"count": 0, "intersections": []}
    
    gdf = MEMORY_STORE["gdf"]
    
    # Buscar intersecciones entre todas las geometrías
    intersections = []
    for i in range(len(gdf)):
        for j in range(i + 1, len(gdf)):
            row1 = gdf.iloc[i]
            row2 = gdf.iloc[j]
            if row1.geometry.intersects(row2.geometry):
                intersections.append({
                    "feature1": {
                        "id": int(row1["id"]),
                        "nombre": str(row1["nombre"]),
                        "categoria": str(row1["categoria"])
                    },
                    "feature2": {
                        "id": int(row2["id"]),
                        "nombre": str(row2["nombre"]),
                        "categoria": str(row2["categoria"])
                    }
                })
    
    return {
        "count": len(intersections),
        "intersections": intersections
    }
