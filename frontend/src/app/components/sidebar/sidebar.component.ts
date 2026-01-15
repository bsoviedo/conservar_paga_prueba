import { Component, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { MapCommunicationService } from '../../services/map-communication.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.css'
})
export class SidebarComponent implements OnInit, AfterViewInit {
  @ViewChild('statsChart') statsChartRef!: ElementRef<HTMLCanvasElement>;
  
  currentZoom: number = 12;
  currentCenter: {longitude: number, latitude: number} = {longitude: -74.0060, latitude: 4.7110};
  backendHasLayers: boolean = false;
  file: File | null = null;
  
  // Propiedades para stats
  statType: 'area' | 'count' = 'count';
  private chart: Chart | null = null;

  // Propiedades para filtros
  categorias: string[] = ['cultivo', 'conservación', 'restauración'];
  categoriaSeleccionada: string | null = null;
  nombreFiltro: string = '';
  filtroActivo: 'categoria' | 'nombre' | null = null;

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
      if (hasLayers) {
        // Cargar estadísticas cuando haya capas
        setTimeout(() => this.loadStats(), 500);
      }
    });
  }

  ngAfterViewInit(): void {
    // El chart se inicializa después de que el view esté listo
  }

  async loadStats(): Promise<void> {
    try {
      const response = await fetch(`http://localhost:8000/stats?stat_type=${this.statType}`);
      const data = await response.json();
      
      this.renderChart(data);
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  }

  onStatTypeChange(type: 'area' | 'count'): void {
    this.statType = type;
    this.loadStats();
  }

  private renderChart(data: any): void {
    if (!this.statsChartRef) return;

    const categorias = Object.keys(data.by_categoria);
    const valores = Object.values(data.by_categoria) as number[];

    // Colores por categoría
    const colores: Record<string, string> = {
      'cultivo': 'rgba(255, 99, 71, 0.8)',
      'conservación': 'rgba(60, 179, 113, 0.8)',
      'restauración': 'rgba(255, 165, 0, 0.8)'
    };

    const backgroundColor = categorias.map(cat => colores[cat] || 'rgba(128, 128, 128, 0.8)');

    // Destruir chart anterior si existe
    if (this.chart) {
      this.chart.destroy();
    }

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels: categorias,
        datasets: [{
          label: this.statType === 'area' ? 'Área (ha)' : 'Conteo',
          data: valores,
          backgroundColor: backgroundColor,
          borderColor: backgroundColor.map(c => c.replace('0.8', '1')),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          title: {
            display: true,
            text: this.statType === 'area' ? `Total: ${data.total_area?.toFixed(2)} ha` : `Total: ${data.total}`
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    };

    this.chart = new Chart(this.statsChartRef.nativeElement, config);
  }

  // Métodos de filtrado
  filtrarPorCategoria(categoria: string): void {
    if (this.categoriaSeleccionada === categoria) {
      // Si ya está seleccionada, quitar filtro
      this.quitarFiltros();
    } else {
      this.categoriaSeleccionada = categoria;
      this.nombreFiltro = '';
      this.filtroActivo = 'categoria';
      this.mapCommunicationService.aplicarFiltro({ categoria });
    }
  }

  onNombreChange(): void {
    if (this.nombreFiltro.length >= 3) {
      this.categoriaSeleccionada = null;
      this.filtroActivo = 'nombre';
      this.mapCommunicationService.aplicarFiltro({ nombre: this.nombreFiltro });
    } else if (this.nombreFiltro.length === 0 && this.filtroActivo === 'nombre') {
      this.quitarFiltros();
    }
  }

  quitarFiltros(): void {
    this.categoriaSeleccionada = null;
    this.nombreFiltro = '';
    this.filtroActivo = null;
    this.mapCommunicationService.aplicarFiltro(null);
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

        this.mapCommunicationService.shouldReloadLayers.next(true);
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
