import { Component, OnInit, OnDestroy, ElementRef, ViewChild } from "@angular/core";

import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import GraphicsLayer from "@arcgis/core/layers/GraphicsLayer";
import Graphic from "@arcgis/core/Graphic";

import Point from "@arcgis/core/geometry/Point";
import Polygon from "@arcgis/core/geometry/Polygon";
import Polyline from "@arcgis/core/geometry/Polyline";
import Extent from "@arcgis/core/geometry/Extent";

import { MapCommunicationService } from "../../services/map-communication.service";

type BackendResponse = {
  count?: number;
  total_in_memory?: number;
  crs?: string;
  features: Array<{
    id?: string;
    type: "Feature";
    properties: {
      id: number | string;
      nombre: string;
      categoria: string;
      [k: string]: any;
    };
    geometry: {
      type: "Point" | "Polygon" | "LineString" | "MultiPolygon" | "MultiLineString" | "MultiPoint";
      coordinates: any;
    };
  }>;
};

@Component({
  selector: "app-map",
  imports: [],
  templateUrl: "./map.component.html",
  styleUrl: "./map.component.css",
})
export class MapComponent implements OnInit, OnDestroy {
  @ViewChild("mapViewNode", { static: true }) private mapViewEl!: ElementRef;
  private view: MapView | null = null;

  // guarda referencia para limpiar/actualizar
  private backendLayer: GraphicsLayer | null = null;

  constructor(private mapCommunicationService: MapCommunicationService) {}

  ngOnInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    if (this.view) this.view.destroy();
  }

  private initializeMap(): void {
    const map = new Map({ basemap: "osm" });

    this.view = new MapView({
      container: this.mapViewEl.nativeElement,
      map,
      center: [-74.006, 4.711],
      zoom: 6,
    });

    this.mapCommunicationService.setMapView(this.view);

    this.initLayersFromBackend();
  }

  private async initLayersFromBackend(): Promise<void> {
    if (!this.view?.map) return;

    // Limpia capa anterior si recargas
    if (this.backendLayer) {
      this.view.map.remove(this.backendLayer);
      this.backendLayer.destroy();
      this.backendLayer = null;
    }

    const resp = await fetch("http://localhost:8000/features/");
    if (!resp.ok) {
      console.error("Backend error:", resp.status, await resp.text());
      return;
    }

    const data = (await resp.json()) as BackendResponse;

    if (!data?.features?.length) {
      console.log("No hay features para renderizar");
      return;
    }

    // ✅ armar FeatureCollection “normal” (por si luego lo necesitas)
    const featureCollection = {
      type: "FeatureCollection",
      features: data.features,
    };

    // categorías únicas
    const categorias = new Set<string>();
    featureCollection.features.forEach((f: any) => {
      const cat = f?.properties?.categoria;
      if (cat) categorias.add(cat);
    });

    // Colores para categorías
    const colores = [
      [255, 99, 71],
      [60, 179, 113],
      [255, 165, 0],
      [147, 112, 219],
      [255, 215, 0],
      [70, 130, 180],
      [220, 20, 60],
      [46, 139, 87],
      [218, 112, 214],
      [95, 158, 160],
    ];

    const coloresMap: Record<string, number[]> = {};
    Array.from(categorias).forEach((cat, idx) => {
      coloresMap[cat] = colores[idx % colores.length];
    });

    // Capa gráfica
    const graphicsLayer = new GraphicsLayer({
      title: "Backend (GeoJSON)",
    });

    // Convertir GeoJSON -> Geometry ArcGIS (sin jsonUtils)
    for (const feature of featureCollection.features) {
      const geom = this.geojsonToArcgisGeometry(feature.geometry);
      if (!geom) continue;

      const categoria = feature.properties?.categoria ?? "sin_categoria";
      const color = coloresMap[categoria] || [128, 128, 128];

      const symbol = this.symbolForGeometryType(geom.type, color);

      const graphic = new Graphic({
        geometry: geom,
        attributes: feature.properties,
        symbol,
        popupTemplate: {
          title: "{categoria}",
          content: (evt: any) => {
            const attributes = evt.graphic.attributes || {};
            let html = '<div style="padding:10px;">';
            for (const key of Object.keys(attributes)) {
              html += `<p><b>${key}:</b> ${attributes[key]}</p>`;
            }
            html += "</div>";
            return html;
          },
        },
      });

      graphicsLayer.add(graphic);
    }

    this.backendLayer = graphicsLayer;
    this.view.map.add(graphicsLayer);

   
  }

  private geojsonToArcgisGeometry(geometry: any): Point | Polygon | Polyline | null {
    if (!geometry?.type) return null;

    switch (geometry.type) {
      case "Point": {
        const [x, y] = geometry.coordinates ?? [];
        if (typeof x !== "number" || typeof y !== "number") return null;
        return new Point({ x, y, spatialReference: { wkid: 4326 } });
      }

      case "LineString": {
        const paths = [geometry.coordinates]; // GeoJSON: [[x,y],[x,y]...]
        if (!Array.isArray(paths[0]) || paths[0].length < 2) return null;
        return new Polyline({ paths, spatialReference: { wkid: 4326 } });
      }

      case "Polygon": {
        const rings = geometry.coordinates; // GeoJSON: [ [ [x,y]... ] , ...]
        if (!Array.isArray(rings) || rings.length === 0) return null;
        return new Polygon({ rings, spatialReference: { wkid: 4326 } });
      }

      default:
        console.warn("Tipo GeoJSON no soportado aún:", geometry.type);
        return null;
    }
  }

  private symbolForGeometryType(type: string, color: number[]) {
    if (type === "point") {
      return {
        type: "simple-marker",
        color,
        size: 10,
        outline: { color: [255, 255, 255], width: 2 },
      } as any;
    }

    if (type === "polyline") {
      return {
        type: "simple-line",
        color,
        width: 3,
      } as any;
    }

    if (type === "polygon") {
      return {
        type: "simple-fill",
        color: [...color, 0.45],
        outline: { color, width: 2 },
      } as any;
    }

    // default
    return {
      type: "simple-marker",
      color: [128, 128, 128],
      size: 10,
      outline: { color: [255, 255, 255], width: 1 },
    } as any;
  }

}
