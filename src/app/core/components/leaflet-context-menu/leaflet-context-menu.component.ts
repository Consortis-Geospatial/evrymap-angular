import {
  AfterViewInit,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { IonItem } from '@ionic/angular';
import { LatLng } from 'leaflet';
import { ExtentionService } from 'src/app/services/extention.service';
import { MapEventsService } from 'src/app/services/map-events.service';
import { IConfigurationLayer } from '../../interfaces/configuration.interface';

@Component({
  selector: 'app-leaflet-context-menu',
  templateUrl: './leaflet-context-menu.component.html',
  styleUrls: ['./leaflet-context-menu.component.scss'],
})
export class LeafletContextMenuComponent implements OnInit {
  @Input() public configLayer: IConfigurationLayer;
  @Input() public coords: LatLng;
  @Input() public feature;

  constructor(
    private mapEventsSerevice: MapEventsService,
    private extentionService: ExtentionService
  ) {}

  ngOnInit() {}

  openHyperlink(link: string) {
    if (link) {
      window.open(link, 'blank');
    }
  }

  //TODO HOOK FOR ADDITIONAL TABS
  customEvent(event, methodName, feature, layer) {
    // console.log('pre custom event');
    // console.log(methodName, feature, layer);
    this.extentionService.customEvent(event, methodName, feature, layer);
  }
}
