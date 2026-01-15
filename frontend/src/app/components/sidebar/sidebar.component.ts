import { Component, OnInit } from '@angular/core';
import { MapCommunicationService } from '../../services/map-communication.service';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit {
  currentZoom: number = 12;
  currentCenter: {longitude: number, latitude: number} = {longitude: -74.0060, latitude: 4.7110};
  backendHasLayers: boolean = false;
  file: File | null = null;

  constructor(private mapCommunicationService: MapCommunicationService) {}

  ngOnInit(): void {
    // Suscribirse a los cambios del mapa
    this.mapCommunicationService.zoom$.subscribe(zoom => {
      this.currentZoom = zoom;
    });

    this.mapCommunicationService.center$.subscribe(center => {
      this.currentCenter = center;
    });

    this.mapCommunicationService.backendHasLayers$.subscribe(hasLayers => {
      this.backendHasLayers = hasLayers;
    });
  }

  async loadGeoJson(): Promise<void> {
    if(!this.file){
      Swal.fire({
        icon: 'warning',
        title: 'Archivo no seleccionado',
        text: 'Por favor, selecciona un archivo GeoJSON antes de continuar',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Validar extensión del archivo
    const validExtensions = ['.geojson', '.json'];
    const fileExtension = this.file.name.substring(this.file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
      Swal.fire({
        icon: 'error',
        title: 'Formato inválido',
        text: 'Por favor, selecciona un archivo .geojson o .json',
        confirmButtonText: 'Entendido'
      });
      return;
    }

    // Validar contenido GeoJSON
    try {
      const fileContent = await this.file.text();
      const geoJsonData = JSON.parse(fileContent);
      
      // Validar estructura básica de GeoJSON
      if (!geoJsonData.type || (geoJsonData.type !== 'FeatureCollection' && geoJsonData.type !== 'Feature')) {
        Swal.fire({
          icon: 'error',
          title: 'GeoJSON inválido',
          text: 'El archivo no tiene una estructura GeoJSON válida. Debe ser un Feature o FeatureCollection.',
          confirmButtonText: 'Entendido'
        });
        return;
      }

      // Mostrar loading
      Swal.fire({
        title: 'Enviando archivo...',
        text: 'Por favor espera mientras se procesa el GeoJSON',
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      // Enviar al backend
      const formData = new FormData();
      formData.append('file', this.file);

      const response = await fetch('http://127.0.0.1:8000/ingest', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();

        this.backendHasLayers = true;
        this.mapCommunicationService['backendHasLayers'].next(true);
        Swal.fire({
          icon: 'success',
          title: '¡Archivo enviado exitosamente!',
          text: 'El GeoJSON ha sido procesado correctamente',
          confirmButtonText: 'Aceptar'
        });
        console.log('Respuesta del servidor:', result);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Error desconocido' }));
        Swal.fire({
          icon: 'error',
          title: 'Error al enviar el archivo',
          text: errorData.detail || `Error ${response.status}: ${response.statusText}`,
          confirmButtonText: 'Entendido'
        });
      }

    } catch (error: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: error.message || 'No se pudo validar o enviar el archivo GeoJSON',
        confirmButtonText: 'Entendido'
      });
      console.error('Error:', error);
    }
  }

  onFileSelected(event: any): void {
    const file: File = event.target.files[0];

    if (file) {
      this.file = file;
      Swal.fire({
        icon: 'info',
        title: 'Archivo seleccionado',
        text: `${file.name} (${(file.size / 1024).toFixed(2)} KB)`,
        toast: true,
        position: 'top-end',
        timer: 3000,
        showConfirmButton: false
      });
    }
  }


}
