import { Component } from '@angular/core';
/* import { RouterOutlet } from '@angular/router';*/
import { MapComponent } from './components/map/map.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-root',
  //  imports: [RouterOutlet, MapComponent, SidebarComponent],
  imports: [MapComponent, SidebarComponent],

  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'conservar-paga';
}
