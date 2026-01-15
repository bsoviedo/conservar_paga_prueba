import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import MapView from '@arcgis/core/views/MapView';

@Injectable({
  providedIn: 'root',
})
export class MapCommunicationService {
  public mapViewSubject = new BehaviorSubject<MapView | null>(null);

  public backendHasLayers = new BehaviorSubject<boolean>(false);
  public backendHasLayers$: Observable<boolean> = this.backendHasLayers.asObservable();

  public shouldReloadLayers = new BehaviorSubject<boolean>(false);
  public shouldReloadLayers$: Observable<boolean> =
    this.shouldReloadLayers.asObservable();

  public zoomSubject = new BehaviorSubject<number>(12);
  public centerSubject = new BehaviorSubject<{ longitude: number; latitude: number }>({
    longitude: -74.006,
    latitude: 4.711,
  });

  // Observable para que los componentes se suscriban
  public mapView$: Observable<MapView | null> = this.mapViewSubject.asObservable();
  public zoom$: Observable<number> = this.zoomSubject.asObservable();
  public center$: Observable<{ longitude: number; latitude: number }> =
    this.centerSubject.asObservable();

  // Subject para filtros
  private filtroSubject = new BehaviorSubject<{ categoria?: string; nombre?: string } | null>(null);
  public filtro$: Observable<{ categoria?: string; nombre?: string } | null> = this.filtroSubject.asObservable();

  constructor() {}

  // Método para registrar la instancia del MapView
  setMapView(mapView: MapView): void {
    this.mapViewSubject.next(mapView);
  }

  // Obtener la instancia actual del MapView
  getMapView(): MapView | null {
    return this.mapViewSubject.value;
  }

  // Aplicar filtro
  aplicarFiltro(filtro: { categoria?: string; nombre?: string } | null): void {
    this.filtroSubject.next(filtro);
  }

}
