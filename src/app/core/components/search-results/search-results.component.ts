import {
  Component,
  Input,
  OnDestroy,
  AfterViewInit,
  ViewChild,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { PopoverController } from '@ionic/angular';
import * as turf from '@turf/turf';
import { FeatureGroup, LayerEvent } from 'leaflet';
import { Subscription } from 'rxjs';
import { ILayer } from 'src/app/core/models/layer.model';
import { DispatchActionsHelperService } from 'src/app/services/dispatch-actions-helper.service';
import { ExtentionService } from 'src/app/services/extention.service';
import { HttpCallsService } from 'src/app/services/http-calls.service';
import { MapEventsService } from 'src/app/services/map-events.service';
import { MapService } from 'src/app/services/map.service';
import { SelectorsHelperService } from 'src/app/services/selectors-helper.service';
import { ToastService } from 'src/app/services/toast.service';
import { TranslationService } from 'src/app/services/translation.service';
import { IAddressSearch } from '../../interfaces/address-search.interface';
import { IMapServerRequest } from '../../interfaces/map-server-geojson.interface';
import { ActionsPopoverComponent } from './actions-popover/actions-popover.component';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss'],
})
export class SearchResultsComponent implements AfterViewInit, OnDestroy {
  @Input() searchedLayers: L.GeoJSON;
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild(MatSort) sort: MatSort;

  public layersArray: ILayer[] = [];
  public addressResults: IAddressSearch[] = [];
  public layersResults = {};
  public dataSource: MatTableDataSource<
    IAddressSearch | IMapServerRequest | any
  >;
  public displayedColumns: string[] = [];
  public displayedColumnsDescription = {};
  public displayedColumnsIsLink = {};
  public displayedColumnsIsEvent = {};
  public searchSegmentValue: string;
  public groups: { value: string; description: string }[] = [];
  public searchCollapsed: boolean;

  private map: L.Map;
  // subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    private translationService: TranslationService,
    private toastService: ToastService,
    private mapService: MapService,
    private mapEventsService: MapEventsService,
    private selectorsHelperService: SelectorsHelperService,
    private dispatchActionsHelperService: DispatchActionsHelperService,
    public popoverController: PopoverController,
    public httpCallsService: HttpCallsService,
    public extentionService: ExtentionService
  ) {
    this.dataSource = new MatTableDataSource([]);
    this.subscriptions.add(
      this.selectorsHelperService
        .getLayers()
        .subscribe(() => (this.layersArray = this.mapService.getLayersArray()))
    );

    this.subscriptions.add(
      this.selectorsHelperService
        .getSearchResultsSearchCollapsed()
        .subscribe(
          (searchCollapsed) => (this.searchCollapsed = searchCollapsed)
        )
    );

    this.subscriptions.add(
      this.mapEventsService.getMap().subscribe((map: L.Map) => (this.map = map))
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.subscriptions.add(
      this.selectorsHelperService.getSearchResults().subscribe((results) => {
        if (!results.length) {
          return;
        }
        const newResults = results.find((x) => x.id === 1);

        let index = 1;

        this.addressResults = newResults.address.map((x) => {
          const newObject = {
            ...x,
            geometry: x.geojson,
            searchId: index++,
            clicked: false,
            properties: {
              addressDisplayName: x.display_name,
              addressCategory: x.category,
            },
          };
          delete newObject.geojson;
          return newObject;
        });

        this.layersResults = newResults.layers;

        this.fetchDatasource();
      })
    );
  }

  datasourceFilterPredicate() {
    this.dataSource.filterPredicate = (data, filter: string): boolean => {
      try {
        let found = false;

        // get properties from table's displayed columns
        const propertiesValuesArray = Object.entries(data.properties)
          .filter((x) => this.displayedColumns.includes(x[0]))
          .map((x) => x[1]) as string[];

        const valueFound = propertiesValuesArray.find((x) =>
          x.toLocaleLowerCase().includes(filter)
        );

        found = valueFound ? true : false;

        return found;
      } catch (error) {
        console.error(error);
      }
    };
  }

  fetchDatasource(): void {
    this.searchedLayers.clearLayers().unbindPopup();
    this.createGroupsAndSegmentValue();

    if (this.groups.length) {
      this.dataSource = new MatTableDataSource(
        this.addressResults.length > 0
          ? this.addressResults
          : this.layersResults[this.searchSegmentValue].map(
            (x: turf.helpers.Feature<turf.helpers.GeometryCollection>) => ({
              ...x,
              properties: {
                ...x.properties,
                configLayerName: this.searchSegmentValue,
              },
            })
          )
      );
      this.datasourceFilterPredicate();
      this.dataSource.paginator = this.paginator;
    } else {
      this.dataSource = new MatTableDataSource([]);
    }
  }

  createGroupsAndSegmentValue() {
    this.groups.length = 0;
    //addresses
    if (this.addressResults.length > 0) {
      this.groups =
        this.addressResults.length > 0
          ? [
            {
              value: 'addresses',
              description: this.translationService.translate(
                'MAP.SEARCH_RESULTS.ADDRESSES'
              ),
            },
          ]
          : [];
      this.displayedColumns = ['addressDisplayName', 'addressCategory'];
      this.displayedColumnsDescription = {
        addressDisplayName: this.translationService.translate(
          'MAP.SEARCH_RESULTS.ADDRESS'
        ),
        addressCategory: this.translationService.translate(
          'MAP.SEARCH_RESULTS.CATEGORY'
        ),
      };
      this.searchSegmentValue = 'addresses';
    } //layer results
    else {
      const layersResultsObjectEntries: [string, []][] = Object.entries(
        this.layersResults
      );

      const hasResults = layersResultsObjectEntries.find(
        (x) => x[1].length > 0
      );

      if (!hasResults) {
        // this.searchSegmentValue = layersResultsObjectEntries[0][0];
        this.groups.length = 0;

        if (layersResultsObjectEntries.length > 0) {
          this.toastService.showToast(
            this.translationService.translate('MAP.SUBHEADER.NO_LAYERS_FOUND')
          );
        }
        return;
      }

      const configLayers = this.layersArray
        .filter((x) => x.properties.queryable && x.properties.displayOnStartup)
        .map((x) => x.properties);

      // if (configLayers.length === 0) {
      //   this.toastService.showToast(
      //     this.translationService.translate('MAP.SUBHEADER.NO_LAYERS_FOUND')
      //   );
      //   return;
      // }

      configLayers.forEach((el) => {
        if (this.layersResults[el.name]?.length > 0) {
          this.groups = [
            ...this.groups,
            { value: el.name, description: el.label },
          ];
        }
      });

      const segmentValueIsOnGroup = this.groups.some(
        (i) => i.value === this.searchSegmentValue
      );

      this.searchSegmentValue = segmentValueIsOnGroup
        ? this.searchSegmentValue
        : null || (this.groups.length > 0 ? this.groups[0].value : null);

      let configLayerFound = configLayers.find(
        (x) => x.name === this.searchSegmentValue
      );

      if (!configLayerFound) {
        this.dispatchActionsHelperService.dispatchSearchResultsSearchCollapsed(
          true
        );
        return;
      }

      //put properties as searchfields in the search results if it doesn't have searchfields
      if (
        (configLayerFound?.url && !configLayerFound.searchFields) ||
        (configLayerFound?.type.toUpperCase() === 'OGREGEOJSON' &&
          !configLayerFound.searchFields)
      ) {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        configLayerFound = { ...configLayerFound, searchFields: [] };
        Object.keys(
          this.layersResults[this.searchSegmentValue][0].properties
        ).forEach((key) => {
          // eslint-disable-next-line @typescript-eslint/dot-notation
          configLayerFound.searchFields.push({ name: key, description: key });
        });
      }

      //fill Displayed columns
      this.displayedColumns = configLayerFound.searchFields
        ? configLayerFound.searchFields.map((x) => x.name)
        : [];

      if (configLayerFound.searchFields) {
        this.displayedColumnsDescription = configLayerFound.searchFields
          .map((x) => {
            const newObject = { value: x.name, description: x.description };
            return newObject;
          })
          .reduce(
            (obj, item) => ({
              ...obj,
              [item.value]: item.description,
            }),
            {}
          );

        //TODO HOOK FOR ADDITIONAL TABS
        // if (configLayerFound.name === 'v_parcels_spatial') {
        //   this.displayedColumns.unshift('action');
        //   // eslint-disable-next-line @typescript-eslint/dot-notation
        //   this.displayedColumnsDescription['action'] = 'my action';
        // }

        if (
          configLayerFound.relation &&
          configLayerFound.relation.filter((x) => x?.position === 'search')
        ) {
          const actionRelations = configLayerFound.relation.filter(
            (x) => x?.position === 'search'
          );

          actionRelations.forEach((x) => {
            this.displayedColumnsIsEvent[x.functionName] = true;
            this.displayedColumns.unshift(x.functionName);
            // eslint-disable-next-line @typescript-eslint/dot-notation
            this.displayedColumnsDescription[x.functionName] = x.description;
          });
        }

        //is external link
        this.displayedColumnsIsLink = configLayerFound.searchFields
          .map((x) => {
            const newObject = {
              value: x.name,
              description: x.description,
              link: x?.link,
            };
            return newObject;
          })
          .reduce(
            (obj, item) => ({
              ...obj,
              [item.value]: !!item?.link,
            }),
            {}
          );
      }
      const layersResultsEntries = Object.entries(this.layersResults);
      //popup on click feature of search results in map
      this.onAddSearchedLayersGroup();

      //add data to table
      layersResultsEntries.forEach((x) => {
        let index = 1;
        const features = x[1] as any[];
        const newArray = features.map((y) => {
          const newObject = {
            ...y,
            searchId: index++,
            properties: { ...y.properties, configLayerName: x[0] },
          };

          return newObject;
        });
        this.layersResults = {
          ...this.layersResults,
          [x[0]]: newArray.length > 0 ? newArray : [],
        };
        x[1] = newArray.length > 0 ? newArray : [];
        let geojsonFeature =
          x[1] as turf.helpers.Feature<turf.helpers.GeometryCollection>;

        //TODO convert geometries from different crs;
        const arrayGeojson: any = this.mapService.deepClone(x[1]);

        //geometry conversion
        if (arrayGeojson.length > 0) {
          arrayGeojson.forEach((feat, index0: number) => {
            const defaultCrs = this.layersArray.find(
              (l) => l.properties.name === feat.properties.configLayerName
            ).properties?.defaultCrs;

            if (defaultCrs) {
              if (
                feat.geometry?.crs &&
                this.mapService.convertAuthorizationCrsToCrs(defaultCrs) ===
                this.mapService.convertAuthorizationCrsToCrs(
                  feat.geometry?.crs?.properties?.name
                )
              ) {
                const feature =
                  feat as turf.helpers.Feature<turf.helpers.Geometry>;
                arrayGeojson[index0] =
                  this.mapService.convertGeojsonFeatureToTargetCrs(
                    feature,
                    this.mapService.convertAuthorizationCrsToCrs(defaultCrs),
                    null
                  );
              } else if (
                feat.geometry?.crs &&
                this.mapService.convertAuthorizationCrsToCrs(defaultCrs) !==
                this.mapService.convertAuthorizationCrsToCrs(
                  feat.geometry?.crs?.properties?.name
                )
              ) {
                const feature =
                  feat as turf.helpers.Feature<turf.helpers.Geometry>;
                arrayGeojson[index0] =
                  this.mapService.convertGeojsonFeatureToTargetCrs(
                    feature,
                    this.mapService.convertAuthorizationCrsToCrs(
                      feat.geometry?.crs?.properties?.name
                    ),
                    null
                  );
              }
            }
          });

          geojsonFeature =
            arrayGeojson as turf.helpers.Feature<turf.helpers.GeometryCollection>;
        }

        this.searchedLayers
          .addData(geojsonFeature)
          .setStyle({ color: 'var(--ion-color-success)', weight: 2 });
      });
    }
  }

  onAddSearchedLayersGroup() {
    this.searchedLayers.on('layeradd', (e: LayerEvent) => {
      e.layer.bindPopup((featureGroup: FeatureGroup) => {
        let popupContent = '';

        const feature = featureGroup.feature as { properties: any };

        const configLayerFound = this.layersArray.find(
          (x) => x.properties.name === feature.properties.configLayerName
        ).properties.searchFields;

        if (configLayerFound) {
          configLayerFound.map((x) => {
            if (!x?.link) {
              popupContent += `
              <div> ${this.translationService.translate(x.description)}: ${feature.properties[x.name]} </div>`;
            } else {
              popupContent += `
              <div> ${this.translationService.translate(x.description)}: <a href="${feature.properties[x.name]
                }"> ${feature.properties[x.name]} </a></div>`;
            }
          });
        } else if (feature.properties) {
          const objectKeys = Object.keys(feature.properties);
          objectKeys.map((x) => {
            popupContent += `
            <div> ${x}: ${feature.properties[x]} </div>
            `;
          });
        }

        this.searchedLayers.off('layeradd');
        return popupContent;
      });
    });
  }

  sortData() {
    const data = this.dataSource.data as IMapServerRequest[];
    let sortData: IMapServerRequest[];

    switch (this.sort.direction) {
      case 'asc':
        sortData = data.sort((a, b) =>
          a.properties[this.sort.active] > b.properties[this.sort.active]
            ? 1
            : b.properties[this.sort.active] > a.properties[this.sort.active]
              ? -1
              : 0
        );
        break;
      case 'desc':
        sortData = data.sort((a, b) =>
          a.properties[this.sort.active] > b.properties[this.sort.active]
            ? -1
            : b.properties[this.sort.active] < a.properties[this.sort.active]
              ? 1
              : 0
        );
        break;

      default:
        sortData = data.sort((a, b) =>
          a.searchId > b.searchId ? 1 : b.searchId > a.searchId ? -1 : 0
        );
        break;
    }

    this.paginator.pageIndex = 0;
    this.dataSource = new MatTableDataSource(sortData);
    this.dataSource.paginator = this.paginator;
    this.datasourceFilterPredicate();
    this.applySearchFilter();
  }

  applySearchFilter(event?: Event) {
    const inputValue = (
      document.getElementById('searchResults') as HTMLInputElement
    ).value;
    const filterValue = event
      ? (event.target as HTMLInputElement).value
      : inputValue;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  zoomToObjectAddress(searchId: number): void {
    this.searchedLayers.clearLayers();

    this.addressResults.forEach((x) => {
      x.clicked = x.searchId === searchId ? x.clicked : false;
    });
    const objectFound = this.addressResults.find(
      (x) => x.searchId === searchId
    );
    objectFound.clicked = !objectFound.clicked;
    const geojsonFeature = turf.geometryCollection([objectFound.geometry], {
      clicked: true,
    });

    const found = this.searchedLayers
      .getLayers()
      // eslint-disable-next-line @typescript-eslint/dot-notation
      .find((x) => x['feature'].properties.clicked);

    if (found) {
      this.map.closePopup();
      this.searchedLayers.removeLayer(found);
    }

    if (objectFound.clicked) {
      this.searchedLayers
        .addData(geojsonFeature)
        .setStyle({ color: 'var(--ion-color-success)', weight: 5 })
        .bindPopup(objectFound.display_name);

      const bbox = turf.bbox(geojsonFeature);

      this.map.flyToBounds([
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]],
      ]);
    }
  }

  zoomToObjectOtherLayers(searchId: number): void {
    this.onAddSearchedLayersGroup();
    this.searchedLayers.clearLayers();

    const layerFound = this.dataSource.data.find(
      (x) => x.searchId === searchId
    ) as unknown;

    this.searchedLayers
      .addData(
        layerFound as turf.helpers.Feature<turf.helpers.GeometryCollection>
      )
      .setStyle({ color: 'var(--ion-color-success)', weight: 5 });

    const bbox = turf.bbox(layerFound);

    this.map.flyToBounds(
      [
        [bbox[1], bbox[0]],
        [bbox[3], bbox[2]],
      ],
      {
        maxZoom:
          this.mapEventsService.configuration?.map?.xyZoomLevel ?? 13,
      }
    );
  }

  searchSegmentChanged(e: unknown): void {
    const event = e as CustomEvent;
    this.searchSegmentValue = event.detail.value;
    this.fetchDatasource();
  }

  async actionsClick(ev: any) {
    const popover = await this.popoverController.create({
      component: ActionsPopoverComponent,
      event: ev,
      componentProps: {
        hideShapefile: this.searchSegmentValue === 'addresses' ? true : false,
      },
    });

    await popover.present();

    const { data, role } = await popover.onDidDismiss<{
      exportType: string;
      crs: string;
    }>();

    if (role === 'selectionClicked') {
      const geojsonObject =
        this.addressResults.length > 0
          ? this.addressResults
          : this.layersResults[this.searchSegmentValue];

      const geojsonCollection = {
        type: 'FeatureCollection',
        features: geojsonObject,
      } as GeoJSON.GeoJsonObject;

      /*
      //convert geojsonObject to data.crs
      const newGeojson = [];
      let newGeojsonCollection;

      // eslint-disable-next-line @typescript-eslint/dot-notation
      if (geojsonCollection['features'].length > 0) {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        geojsonCollection['features'].forEach((feat, index0: number) => {
          const feature = this.mapService.deepClone(
            feat
          ) as turf.helpers.Feature<turf.helpers.Geometry>;
          newGeojson[index0] = this.mapService.convertGeojsonFeatureToTargetCrs(
            feature,
            'EPSG:4326',
            data.crs
          );
        });

        newGeojsonCollection = {
          features: newGeojson,
          crs: {
            type: 'name',
            properties: {
              name: data.crs,
            },
          },
          type: 'featureCollection',
        };
      }
*/
      const newGeojsonCollection =
        this.mapService.convertGeojsonCollectionToTargetCrs(
          geojsonCollection as turf.helpers.Feature<turf.helpers.GeometryCollection>,
          'EPSG:4326',
          data.crs
        );

      this.httpCallsService
        .ogreGetShapefile(
          {
            json: newGeojsonCollection,
          },
          data.exportType.toUpperCase()
        )
        .subscribe(
          (response) => {
            const blob = new Blob([response], { type: 'octet/stream' });
            // const url = window.URL.createObjectURL(blob);
            // window.open(url, '_blank');

            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            // set the name of the file
            link.download = 'ogre.zip';
            if (data.exportType.toUpperCase() === 'CSV') {
              link.download = 'ogre.csv';
            }
            // clicking the anchor element will download the file
            link.click();
          },
          (err) => {
            this.toastService.showToast(err.message);
          }
        );
    }
  }

  //TODO HOOK FOR ADDITIONAL TABS
  customEvent(event, methodName, feature, layer) {
    // console.log('pre custom event');
    // console.log(methodName, feature, layer);
    this.extentionService.customEvent(event, methodName, feature, layer);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
