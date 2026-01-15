import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import MapView from '@arcgis/core/views/MapView';

@Injectable({
  providedIn: 'root',
})
export class MapCommunicationService {
  mapViewSubject = new BehaviorSubject<MapView | null>(null);

  backendHasLayers = new BehaviorSubject<boolean>(false);
  backendHasLayers$: Observable<boolean> = this.backendHasLayers.asObservable();

  zoomSubject = new BehaviorSubject<number>(12);
  centerSubject = new BehaviorSubject<{ longitude: number; latitude: number }>({
    longitude: -74.006,
    latitude: 4.711,
  });

  // Observable para que los componentes se suscriban
  mapView$: Observable<MapView | null> = this.mapViewSubject.asObservable();
  zoom$: Observable<number> = this.zoomSubject.asObservable();
  center$: Observable<{ longitude: number; latitude: number }> =
    this.centerSubject.asObservable();

  constructor() {}

  // Método para registrar la instancia del MapView
  setMapView(mapView: MapView): void {
    this.mapViewSubject.next(mapView);
  }

  // Obtener la instancia actual del MapView
  getMapView(): MapView | null {
    return this.mapViewSubject.value;
  }

}
