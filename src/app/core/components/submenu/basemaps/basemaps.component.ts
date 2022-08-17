import {
  Component,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { IMenuLayer } from 'src/app/core/interfaces/menu-layer.interface';
import { DispatchActionsHelperService } from 'src/app/services/dispatch-actions-helper.service';
import { MapService } from 'src/app/services/map.service';
import { SelectorsHelperService } from 'src/app/services/selectors-helper.service';

@Component({
  selector: 'app-basemaps',
  templateUrl: './basemaps.component.html',
  styleUrls: ['./basemaps.component.scss'],
})
export class BasemapsComponent implements OnInit, OnDestroy {
  @Output() layerOnClickOutput = new EventEmitter<number>();

  public menuBasemaps: IMenuLayer[];

  // subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    private selectorsHelperService: SelectorsHelperService,
    private dispatchActionsHelperService: DispatchActionsHelperService,
    private mapService: MapService
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.selectorsHelperService
        .getMapMenuBasemaps()
        .subscribe(
          (basemaps) =>
            (this.menuBasemaps = this.mapService.deepClone(basemaps))
        )
    );
  }

  layerOnClick(id: number): void {
    let layerFound: {
      id?: number;
      icon: string;
      description: string;
      checked?: string;
      selected?: boolean;
    };
    let currentSelectedId: number;

    this.menuBasemaps.forEach((x) => {
      if (layerFound) {
        x.layers.forEach((y) => {
          if (y.selected) {
            currentSelectedId = y.id;
          }
          y.selected = false;
        });
        return;
      }
      layerFound = x.layers
        .map((y) => {
          if (y.selected) {
            currentSelectedId = y.id;
          }
          y.selected = false;
          return y;
        })
        .find((y) => y.id === id);
    });

    layerFound.selected = true;

    const layersArray = this.mapService.getLayersArray();
    const layersArrayFound = layersArray.find(
      (x) => x.properties.layerId === layerFound.id
    );

    if (layerFound.id !== currentSelectedId) {
      // this.layerOnClickOutput.emit(layerFound.id);
      this.dispatchActionsHelperService.dispatchMapMenuBasemaps(
        this.menuBasemaps
      );
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }
}
