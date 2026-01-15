from typing import Any, Dict, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File
import geopandas as gpd
from shapely.geometry import shape
from shapely.validation import explain_validity
from pyproj import CRS
import json

router = APIRouter(tags=["ingest"])

MEMORY_STORE: Dict[str, Any] = {
    "gdf": None,      # gdf
    "crs": None,      # CRS
    "count": 0
}

REQUIRED_PROPS = {"id", "nombre", "categoria"}


def _parse_crs(fc: dict) -> CRS:
    """
    """
    if fc.get("type") != "FeatureCollection":
        raise HTTPException(
            status_code=422,
            detail="El objeto no es un GeoJSON FeatureCollection"
        )

    crs_obj = fc.get("crs")

    # GeoJSON moderno: asumir WGS84
    if crs_obj is None:
        return CRS.from_epsg(4326)

    # Formato GeoJSON clásico obligatorio
    if (
        not isinstance(crs_obj, dict)
        or crs_obj.get("type") != "name"
        or "properties" not in crs_obj
        or "name" not in crs_obj["properties"]
    ):
        raise HTTPException(
            status_code=422,
            detail="CRS inválido. Se espera formato GeoJSON clásico con properties.name"
        )

    try:
        return CRS.from_user_input(crs_obj["properties"]["name"])
    except Exception:
        raise HTTPException(
            status_code=422,
            detail="CRS no reconocible por pyproj"
        )


def _validate_feature(feature: dict, idx: int) -> None:
    """
    valida datos obligatorios en los props del feature
    """

    props = feature.get("properties") or {}
    missing = REQUIRED_PROPS - set(props.keys())
    if missing:
        raise HTTPException(
            status_code=422,
            detail=f"Feature {idx}: faltan propiedades obligatorias: {sorted(list(missing))}"
        )


@router.post("/ingest")
async def ingest(file: UploadFile = File(...)):
    """
    Recibe un archivo GeoJSON FeatureCollection y lo guarda en memoria como GeoDataFrame.
    """
    # Leer el contenido del archivo
    try:
        content = await file.read()
        payload = json.loads(content)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="El archivo no contiene JSON válido")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al leer el archivo: {str(e)}")
    
    if payload.get("type") != "FeatureCollection":
        raise HTTPException(status_code=500, detail="El archivo debe contener un GeoJSON FeatureCollection")

    features = payload.get("features")

    # CRS
    crs = _parse_crs(payload)

    # Validación feature por feature
    for i, feat in enumerate(features):
        _validate_feature(feat, i)

    # Crear GeoDataFrame
    try:
        gdf = gpd.GeoDataFrame.from_features(features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo construir GeoDataFrame: {str(e)}")

    # Set CRS en el gdf
    try:
        gdf = gdf.set_crs(crs, allow_override=True)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"No se pudo asignar CRS: {str(e)}")

    # Persistencia en memoria, si no existe lo crea, si ya existe le hace un append
    if MEMORY_STORE["gdf"] is None:
        MEMORY_STORE["gdf"] = gdf.copy()
        MEMORY_STORE["crs"] = crs
        MEMORY_STORE["count"] = len(gdf)
    else:
        # Si el CRS cambia, lo transformamos al CRS del store (4326 por defecto )
        store_crs: CRS = MEMORY_STORE["crs"]
        if store_crs != crs:
            gdf = gdf.to_crs(store_crs)

        MEMORY_STORE["gdf"] = gpd.pd.concat([MEMORY_STORE["gdf"], gdf], ignore_index=True)
        MEMORY_STORE["count"] = int(len(MEMORY_STORE["gdf"]))

    return {
        "status": "ok",
        "ingested": len(gdf),
        "total_in_memory": MEMORY_STORE["count"],
        "crs": MEMORY_STORE["crs"].to_string()
    }
