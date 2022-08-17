import {
  AfterViewInit,
  Component,
  Input,
  OnInit,
  ViewChild,
} from '@angular/core';
import { IonSelect, PopoverController } from '@ionic/angular';
import { MapService } from 'src/app/services/map.service';

@Component({
  selector: 'app-actions-popover',
  templateUrl: './actions-popover.component.html',
  styleUrls: ['./actions-popover.component.scss'],
})
export class ActionsPopoverComponent implements OnInit, AfterViewInit {
  @ViewChild(IonSelect) crsSelect: IonSelect;
  @Input() hideShapefile: string;
  crsArray: { value: string; description: string }[] = [];

  constructor(
    public popoverController: PopoverController,
    public mapService: MapService
  ) { }

  //const defaultProjection = this.configuration.map.defaultProjectionCode;
  //mapservice
  ngOnInit() {
    this.crsArray.push({
      value: this.mapService.getConfiguration().map.defaultProjectionCode,
      description: this.mapService.getConfiguration().map.defaultProjectionCode
    }
    );
    if (this.crsArray[0].value !== 'EPSG:4326') {
      this.crsArray.push({ description: 'EPSG:4326', value: 'EPSG:4326' });
    }
    if (this.crsArray[0].value !== 'EPSG:3857') {
      this.crsArray.push({ description: 'EPSG:3857', value: 'EPSG:3857' });
    }
  }

  ngAfterViewInit() { }

  dismissPopover(exportType: string, crs: string) {
    this.popoverController.dismiss({ exportType, crs }, 'selectionClicked');
  }
}
