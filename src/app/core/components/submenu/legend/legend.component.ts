import {
  animate,
  AUTO_STYLE,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { IMenuLayer } from 'src/app/core/interfaces/menu-layer.interface';
import { MapService } from 'src/app/services/map.service';
import { SelectorsHelperService } from 'src/app/services/selectors-helper.service';

const DEFAULT_DURATION = 300;

@Component({
  selector: 'app-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.scss'],
  animations: [
    trigger('cardContentCollapsed', [
      state('false', style({ height: AUTO_STYLE, visibility: AUTO_STYLE })),
      state('true', style({ height: '0', visibility: 'hidden' })),
      transition('false => true', animate(DEFAULT_DURATION + 'ms ease-in')),
      transition('true => false', animate(DEFAULT_DURATION + 'ms ease-out')),
    ]),
  ],
})
export class LegendComponent implements OnInit {
  public menuLayers: IMenuLayer[];

  // subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    private selectorsHelperService: SelectorsHelperService,
    private mapService: MapService
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.selectorsHelperService
        .getMapMenuLayers()
        .subscribe(
          (layers) => (this.menuLayers = this.mapService.deepClone(layers))
        )
    );
  }

  searchLayers(e: Event): void {
    const event = e as KeyboardEvent;

    this.menuLayers.forEach((el) => {
      el.layers.forEach((layer) => {
        if (
          !layer.description
            .toLowerCase()
            // eslint-disable-next-line @typescript-eslint/dot-notation
            .includes(event.target['value'].toLowerCase())
        ) {
          layer.hide = true;
        } else {
          layer.hide = false;
        }
      });

      // find at least 1 layer in the group that is not hide
      const groupHideStatus = el.layers.map((x) => x.hide).find((x) => !x);
      el.hide = typeof groupHideStatus === 'undefined' ? true : false;
    });
  }
}
