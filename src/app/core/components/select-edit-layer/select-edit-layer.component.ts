import { Component, Input, OnInit } from '@angular/core';
import { IonSelect, PopoverController } from '@ionic/angular';
import { MapService } from 'src/app/services/map.service';
import {
  IConfiguration,
  IConfigurationLayer,
} from '../../interfaces/configuration.interface';

@Component({
  selector: 'app-select-edit-layer',
  templateUrl: './select-edit-layer.component.html',
  styleUrls: ['./select-edit-layer.component.scss'],
})
export class SelectEditLayerComponent implements OnInit {
  @Input() editableLayers: IConfigurationLayer[];

  constructor(
    public popoverController: PopoverController,
    public mapService: MapService
  ) {}

  ngOnInit() {}

  dismissPopover(exportLayer: string) {
    this.popoverController.dismiss({ exportLayer });
  }
}
