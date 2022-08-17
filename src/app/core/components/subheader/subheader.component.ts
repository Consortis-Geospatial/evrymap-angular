import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import L from 'leaflet';
import { Subscription } from 'rxjs';
import { DispatchActionsHelperService } from 'src/app/services/dispatch-actions-helper.service';
import { MapEventsService } from 'src/app/services/map-events.service';
import { MapViewHistoryService } from 'src/app/services/map-view-history.service';
import { MapService } from 'src/app/services/map.service';
import { SelectorsHelperService } from 'src/app/services/selectors-helper.service';
import { IAddressSearch } from '../../interfaces/address-search.interface';

@Component({
  selector: 'app-subheader',
  templateUrl: './subheader.component.html',
  styleUrls: ['./subheader.component.scss'],
})
export class SubheaderComponent implements OnInit, OnDestroy {
  @Input() searchedLayers: L.GeoJSON;

  public editClicked: boolean;
  public disableHistory: { next: boolean; previous: boolean };
  public rectangleSearchClicked: boolean;
  // public polygonSearchClicked: boolean;
  public pointSearchClicked: boolean;
  public configuration;
  public map: L.Map;
  public searchedData: IAddressSearch[];
  public filteredOptions: string[];

  // subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    private mapService: MapService,
    public mapEventsService: MapEventsService,
    private mapViewHistoryService: MapViewHistoryService,
    private selectorsHelperService: SelectorsHelperService,
    private dispatchActionsHelperService: DispatchActionsHelperService
  ) { }

  ngOnInit() {
    this.configuration = this.mapService.getConfiguration();
    this.mapEventsService.getMap().subscribe((mapData) => {
      this.map = mapData;
    });

    this.subscriptions.add(
      this.selectorsHelperService
        .getSubheaderSearchResults()
        .subscribe((results) => {
          if (!results.length) {
            return;
          }
          const newResults = results.find((x) => x.id === 1);

          this.filteredOptions = newResults.address.map((x) => x.display_name);
        })
    );

    this.subscriptions.add(
      this.selectorsHelperService
        .getSubheaderEditClicked()
        .subscribe((editClicked) => {
          this.editClicked = editClicked;
        })
    );

    this.subscriptions.add(
      this.selectorsHelperService
        .getSubheaderDisableHistory()
        .subscribe((disableHistory) => {
          this.disableHistory = disableHistory;
        })
    );

    this.subscriptions.add(
      this.selectorsHelperService
        .getSubheaderRectangleSearchClicked()
        .subscribe((rectangleSearchClicked) => {
          this.rectangleSearchClicked = rectangleSearchClicked;
        })
    );

    this.subscriptions.add(
      this.selectorsHelperService
        .getSubheaderPointSearchClicked()
        .subscribe((pointSearchClicked) => {
          this.pointSearchClicked = pointSearchClicked;
        })
    );
  }

  editLayerClick(): void {
    this.dispatchActionsHelperService.dispatchSubheaderEditClicked(
      this.editClicked
    );
    // this.map.pm.toggleControls();

    if (this.editClicked) {
      this.map.pm.setPathOptions(
        { color: 'var(--ion-color-warning)', fillColor: '#3388ff' },
        {
          ignoreShapes: ['Rectangle'],
        }
      );
      this.mapEventsService.onPolygonCreate(this.map);
      this.mapEventsService.selectlayerToEdit(this.map);
    } else {
      this.mapEventsService.layersEditModeCreate.forEach((l) =>
        this.map.removeLayer(l)
      );
      this.mapEventsService.layersEditModeCreate = [];
      this.mapEventsService.layersEditModePart.forEach((l) =>
        this.map.removeLayer(l)
      );
      this.mapEventsService.layersEditModePart = [];

      this.map.pm.toggleControls(); //off
      this.initiatePmPathOptions();
      this.map.pm.disableGlobalEditMode();
      this.map.pm.disableGlobalCutMode();
      //todo revert changed
      if (
        this.mapEventsService.selectedLayerConfigToEdit != null &&
        this.mapEventsService.selectedLayerConfigToEdit.type === 'WMS'
      ) {
        this.mapEventsService.replaceWmsWithGeojson(
          this.map,
          'WMS',
          this.mapEventsService.selectedLayerConfigToEdit
        );
      } else if (
        this.mapEventsService.selectedLayerConfigToEdit != null &&
        this.mapEventsService.selectedLayerConfigToEdit.type === 'GeoJSON'
      ) {
        this.mapEventsService.replaceWmsWithGeojson(
          this.map,
          'GeoJSON',
          this.mapEventsService.selectedLayerConfigToEdit
        );
      }
    }
  }

  previousExtentClick(): void {
    const history = this.mapViewHistoryService.getHistory().history;
    let currentPosition =
      this.mapViewHistoryService.getHistory().currentPosition;

    // currentPosition > 1 because initialy currentPosition is 1
    if (currentPosition > 1) {
      currentPosition -= 1;
      this.mapViewHistoryService.setCurrentHistoryPosition(currentPosition);
      this.map.setView(
        history[currentPosition - 1].center,
        history[currentPosition - 1].zoom
      );
    }
  }

  nextExtentClick(): void {
    const history = this.mapViewHistoryService.getHistory().history;
    let currentPosition =
      this.mapViewHistoryService.getHistory().currentPosition;

    // currentPosition < history.length because it can't be more then arrays length
    if (currentPosition < history.length) {
      currentPosition += 1;
      this.mapViewHistoryService.setCurrentHistoryPosition(currentPosition);
      this.map.setView(
        history[currentPosition - 1].center,
        history[currentPosition - 1].zoom
      );
    }
  }
  homeClick(): void {
    let convertedCoordinates = [
      this.mapService.convertCoordinates(
        this.configuration.map.defaultProjectionCode,
        null,
        this.configuration.map.mapExtent[0] as proj4.TemplateCoordinates
      ),
      this.mapService.convertCoordinates(
        this.configuration.map.defaultProjectionCode,
        null,
        this.configuration.map.mapExtent[1] as proj4.TemplateCoordinates
      ),
    ];
    convertedCoordinates = [
      this.mapService.convertToLatLng(convertedCoordinates[0]),
      this.mapService.convertToLatLng(convertedCoordinates[1]),
    ];
    this.map.flyToBounds(convertedCoordinates as L.LatLngBoundsExpression);
  }

  pointSearch(): void {
    this.dispatchActionsHelperService.dispatchRectangleSearchClicked(false);
    this.mapEventsService.offRectangeSearch(this.map);

    this.dispatchActionsHelperService.dispatchPointSearchClicked(
      !this.pointSearchClicked
    );

    if (this.pointSearchClicked) {
      this.mapEventsService.onSearchPointClickEvent(this.map, this.searchedLayers);
    } else {
      this.mapEventsService.offSearchPointClickEvent(
        this.map,
        this.searchedLayers
      );
    }
  }

  rectangleSearch(): void {
    this.dispatchActionsHelperService.dispatchPointSearchClicked(false);
    this.mapEventsService.offSearchPointClickEvent(
      this.map,
      this.searchedLayers
    );

    this.dispatchActionsHelperService.dispatchRectangleSearchClicked(
      !this.rectangleSearchClicked
    );

    if (this.rectangleSearchClicked) {
      this.mapEventsService.onRectangeSearch(this.map);
    } else {
      this.mapEventsService.offRectangeSearch(this.map);
    }
  }

  // polygonSearch(): void {
  //   this.rectangleSearchClicked = false;
  //   this.pointSearchClicked = false;
  //   this.polygonSearchClicked = !this.polygonSearchClicked;
  //   console.log('polygonSearch');
  //   this.map.pm.enableDraw('Polygon');

  //   if (this.polygonSearchClicked) {
  //     this.mapEventsService.onPolygonSearch(this.map);
  //   } else {
  //     this.mapEventsService.offPolygonSearch(this.map);
  //     this.map.pm.disableDraw('Polygon');
  //   }
  // }

  searchAutocompleteAddress(e: Event) {
    const event = e as KeyboardEvent;
    const code = event.code || event.key;
    const codeNumber = event.keyCode || event.which;

    // search except tab key, caps lock key, shift key, control key etc.
    if (
      [
        16, 17, 18, 19, 20, 27, 33, 34, 35, 36, 37, 38, 39, 40, 44, 45, 46, 91,
        92, 93, 113, 115, 119, 120, 122, 123, 144, 145,
      ].includes(codeNumber)
    ) {
      return;
    }

    setTimeout(() => {
      this.dispatchActionsHelperService.dispatchSubheaderAddressSearchResults(
        // eslint-disable-next-line @typescript-eslint/dot-notation
        event.target['value'],
        this.mapService.getConfiguration().general.searchAddressMode,
        ['Enter', 'NumpadEnter'].includes(code)
      );
    }, 500);
  }

  initiatePmPathOptions(): void {
    this.map.pm.setPathOptions(
      { color: 'var(--ion-color-primary)', fillColor: '#3388ff' },
      {
        ignoreShapes: ['Rectangle'],
      }
    );
    this.mapEventsService.offPolygonCreate(this.map);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
