/* eslint-disable no-underscore-dangle */
import {
  animate,
  AUTO_STYLE,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import {
  Component,
  ElementRef,
  EventEmitter,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { ItemReorderEventDetail } from '@ionic/core';
import { Subscription } from 'rxjs';
import { IMapServerRequest } from 'src/app/core/interfaces/map-server-request.interface';
import { IMenuLayer } from 'src/app/core/interfaces/menu-layer.interface';
import { LayerModel } from 'src/app/core/models/layer.model';
import { DispatchActionsHelperService } from 'src/app/services/dispatch-actions-helper.service';
import { MapEventsService } from 'src/app/services/map-events.service';
import { MapService } from 'src/app/services/map.service';
import { SelectorsHelperService } from 'src/app/services/selectors-helper.service';
import { ToastService } from 'src/app/services/toast.service';
import { TranslationService } from 'src/app/services/translation.service';
import { IConfiguration } from '../../../interfaces/configuration.interface';
import { ExportPopoverComponent } from './export-popover/export-popover.component';
import * as esri from 'esri-leaflet';
import { SelectExternalLayersComponent } from './select-external-layers/select-external-layers.component';
import { HttpCallsService } from 'src/app/services/http-calls.service';
import * as geojson from 'geojson';
import { ICapabilities } from 'src/app/core/interfaces/wms-capabilities.interface';
import * as turf from '@turf/turf';
import { ActionsPopoverComponent } from '../../search-results/actions-popover/actions-popover.component';
import { cloneDeep } from 'lodash';

const DEFAULT_DURATION = 300;

@Component({
  selector: 'app-layers',
  templateUrl: './layers.component.html',
  styleUrls: ['./layers.component.scss'],
  animations: [
    trigger('cardContentCollapsed', [
      state('false', style({ height: AUTO_STYLE, visibility: AUTO_STYLE })),
      state('true', style({ height: '0', visibility: 'hidden' })),
      transition('false => true', animate(DEFAULT_DURATION + 'ms ease-in')),
      transition('true => false', animate(DEFAULT_DURATION + 'ms ease-out')),
    ]),
  ],
})
export class LayersComponent implements OnInit, OnDestroy {
  @Output() loadViewEvent = new EventEmitter<IConfiguration>();
  @ViewChild('ogreFileInput') ogreFileInput: ElementRef;
  // @ViewChild('wxsCRSselect') wxsCRSselect: IonSelect;

  public layersArray: LayerModel[] = [];
  public layerSegmentValue = 'layers';
  public saveViewName: string;
  public savedViewsList: IConfiguration[] = [];
  public collapseViewCards = {
    addLayer: false,
    mapViews: false,
    addShapefile: false,
  };
  public menuLayers: IMenuLayer[];
  public configuration;

  public serviceUrl: string;
  public connectedServiceUrl: string;
  public serviceType = 'WMS'; //'WMS' or 'WFS'
  public connectedServiceType;
  public wxsJson = null;
  public wxsLayers = [];
  public wxsSelectedLayers = [];
  public wxsSelectedLayersText = [];
  // public wxsCRS: string[] = [];
  // public selectedWxsCRS: string;
  public selectedWfsOutputFormat: string;
  public wfsColor = '#000';
  public wfsFillColor = '#ff5500';
  public wfsWeight = 1;
  public wfsRadius = 10;
  public wfsFillOpacity = 0.8;

  public ogreSourceSrs: string;
  public ogreFile: File;
  public ogreColor = '#000';
  public ogreFillColor = '#ff5500';
  public ogreWeight = 1;
  public ogreRadius = 10;
  public ogreFillOpacity = 0.8;
  public isExternalOrOgreGeojson = {};

  private map: L.Map;
  // subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    private mapEventsService: MapEventsService,
    private mapService: MapService,
    private selectorsHelperService: SelectorsHelperService,
    private dispatchActionsHelperService: DispatchActionsHelperService,
    private toastService: ToastService,
    private translationService: TranslationService,
    public popoverController: PopoverController,
    private httpCallsService: HttpCallsService
  ) {}

  ngOnInit() {
    this.configuration = this.mapService.getConfiguration();
    this.subscriptions.add(
      this.mapEventsService.getMap().subscribe((map) => {
        this.map = map;
        this.readViews();
      })
    );

    this.subscriptions.add(
      this.selectorsHelperService.getLayers().subscribe(() => {
        this.layersArray = this.mapService.getLayersArray();
        //flag layers as external for remove layer
        this.layersArray.forEach((l) => {
          if (l.properties._external || l.properties.ogreGeoJSON) {
            this.isExternalOrOgreGeojson[l.properties.layerId] = true;
          } else {
            this.isExternalOrOgreGeojson[l.properties.layerId] = false;
          }
        });
      })
    );

    this.subscriptions.add(
      this.selectorsHelperService.getWXSjson().subscribe(
        (res) => {
          // console.log(res);
          this.wxsJson = this.mapService.deepClone(res);
          if (res?.WMS_Capabilities?.Capability?.Layer?.Layer) {
            if (
              res?.WMS_Capabilities?.Capability?.Request?.GetFeatureInfo?.Format
            ) {
              res?.WMS_Capabilities?.Capability?.Request?.GetFeatureInfo?.Format.forEach(
                (format: string) => {
                  if (format.includes('json')) {
                    this.selectedWfsOutputFormat = format;
                  }
                }
              );
            }

            if (Array.isArray(res.WMS_Capabilities.Capability.Layer.Layer)) {
              this.wxsLayers = res.WMS_Capabilities.Capability.Layer.Layer;
            } else if (
              Array.isArray(res.WMS_Capabilities.Capability.Layer.Layer.Layer)
            ) {
              this.wxsLayers =
                res.WMS_Capabilities.Capability.Layer.Layer.Layer;
            }
            // if (res.WMS_Capabilities.Capability.Layer.CRS) {
            //   if (Array.isArray(res.WMS_Capabilities.Capability.Layer.CRS)) {
            //     this.wxsCRS = res.WMS_Capabilities.Capability.Layer.CRS;
            //   } else {
            //     this.wxsCRS.push(res.WMS_Capabilities.Capability.Layer.CRS);
            //   }
            // }
            // if (res.WMS_Capabilities.Capability.Layer.SRS) {
            //   if (Array.isArray(res.WMS_Capabilities.Capability.Layer.SRS)) {
            //     res.WMS_Capabilities.Capability.Layer.SRS.forEach(
            //       (srs: string) => {
            //         if (!this.wxsCRS.includes(srs)) {
            //           this.wxsCRS.push(srs);
            //         }
            //       }
            //     );
            //   } else {
            //     if (
            //       !this.wxsCRS.includes(
            //         res.WMS_Capabilities.Capability.Layer.SRS
            //       )
            //     ) {
            //       this.wxsCRS.push(res.WMS_Capabilities.Capability.Layer.SRS);
            //     }
            //   }
            // }
            // eslint-disable-next-line @typescript-eslint/naming-convention
            // if (Array.isArray(this.wxsLayers)) {
            //   this.wxsLayers.forEach((lyr) => {
            //     if (lyr.CRS) {
            //       if (Array.isArray(lyr.CRS)) {
            //         lyr.CRS.forEach((srs: string) => {
            //           if (!this.wxsCRS.includes(srs)) {
            //             this.wxsCRS.push(srs);
            //           }
            //         });
            //       } else {
            //         if (!this.wxsCRS.includes(lyr.CRS)) {
            //           this.wxsCRS.push(lyr.CRS);
            //         }
            //       }
            //     }
            //     if (lyr.SRS) {
            //       if (Array.isArray(lyr.SRS)) {
            //         lyr.SRS.forEach((srs: string) => {
            //           if (!this.wxsCRS.includes(srs)) {
            //             this.wxsCRS.push(srs);
            //           }
            //         });
            //       } else {
            //         if (!this.wxsCRS.includes(lyr.SRS)) {
            //           this.wxsCRS.push(lyr.SRS);
            //         }
            //       }
            //     }
            //   });
            // }
          } else if (
            res != null &&
            res.hasOwnProperty('wfs:WFS_Capabilities') &&
            res['wfs:WFS_Capabilities']['ows:OperationsMetadata'][
              'ows:Operation'
            ] != null
          ) {
            if (
              Array.isArray(
                res['wfs:WFS_Capabilities']['ows:OperationsMetadata'][
                  'ows:Operation'
                ]
              )
            ) {
              let acceptsJson = false;
              const operations =
                res['wfs:WFS_Capabilities']['ows:OperationsMetadata'][
                  'ows:Operation'
                ];
              operations.forEach((x) => {
                if (x['@attributes'].name === 'GetFeature') {
                  const parameters = x['ows:Parameter'];
                  if (Array.isArray(parameters)) {
                    parameters.forEach((par) => {
                      if (par['@attributes'].name === 'outputFormat') {
                        if (
                          par.hasOwnProperty('ows:AllowedValues') &&
                          par['ows:AllowedValues']['ows:Value'].find(
                            (outputformat: string) =>
                              outputformat.includes('json')
                          )
                        ) {
                          //true
                          this.selectedWfsOutputFormat = par[
                            'ows:AllowedValues'
                          ]['ows:Value'].find((outputformat: string) =>
                            outputformat.includes('json')
                          );
                          acceptsJson = true;
                        } else if (
                          par.hasOwnProperty('ows:Value') &&
                          par['ows:Value'].find((outputformat: string) =>
                            outputformat.includes('json')
                          )
                        ) {
                          //true
                          this.selectedWfsOutputFormat = par['ows:Value'].find(
                            (outputformat: string) =>
                              outputformat.includes('json')
                          );
                          acceptsJson = true;
                        }
                      }
                    });
                  } else if (!!parameters) {
                    if (parameters['@attributes'].name === 'outputFormat') {
                      if (
                        parameters['ows:AllowedValues']['ows:Value'].find(
                          (outputformat: string) =>
                            outputformat.includes('json')
                        )
                      ) {
                        //true
                        this.selectedWfsOutputFormat = parameters[
                          'ows:AllowedValues'
                        ]['ows:Value'].find((outputformat: string) =>
                          outputformat.includes('json')
                        );
                        acceptsJson = true;
                      }
                    }
                  }
                }
              });
              if (!acceptsJson) {
                this.toastService.showToast(
                  this.translationService.translate(
                    'MAP.SIDE_MENU.LAYERS_SUBMENU.DOESNT_ACCEPT_JSON'
                  )
                );
              }
              if (acceptsJson) {
                if (res['wfs:WFS_Capabilities']?.FeatureTypeList?.FeatureType) {
                  const featureTables =
                    res['wfs:WFS_Capabilities']?.FeatureTypeList?.FeatureType;
                  this.wxsLayers = featureTables;
                  // featureTables.forEach((element) => {
                  //   if (element.DefaultCRS) {
                  //     if (Array.isArray(element.DefaultCRS)) {
                  //       if (!this.wxsCRS.includes(element.DefaultCRS)) {
                  //         this.wxsCRS = element.DefaultCRS;
                  //       }
                  //     } else {
                  //       if (!this.wxsCRS.includes(element.DefaultCRS)) {
                  //         this.wxsCRS.push(element.DefaultCRS);
                  //       }
                  //     }
                  //   }
                  //   if (element.DefaultSRS) {
                  //     if (Array.isArray(element.DefaultSRS)) {
                  //       element.DefaultSRS.forEach((el: string) => {
                  //         if (!this.wxsCRS.includes(el)) {
                  //           this.wxsCRS.push(el);
                  //         }
                  //       });
                  //     } else {
                  //       if (!this.wxsCRS.includes(element.DefaultSRS)) {
                  //         this.wxsCRS.push(element.DefaultSRS);
                  //       }
                  //     }
                  //   }
                  //   if (element.OtherSRS) {
                  //     if (Array.isArray(element.OtherSRS)) {
                  //       element.OtherSRS.forEach((el: string) => {
                  //         if (!this.wxsCRS.includes(el)) {
                  //           this.wxsCRS.push(el);
                  //         }
                  //       });
                  //     } else {
                  //       if (!this.wxsCRS.includes(element.OtherSRS)) {
                  //         this.wxsCRS.push(element.OtherSRS);
                  //       }
                  //     }
                  //   }
                  //   if (element.OtherCRS) {
                  //     if (Array.isArray(element.OtherCRS)) {
                  //       element.OtherCRS.forEach((el: string) => {
                  //         if (!this.wxsCRS.includes(el)) {
                  //           this.wxsCRS.push(el);
                  //         }
                  //       });
                  //     } else {
                  //       if (!this.wxsCRS.includes(element.OtherCRS)) {
                  //         this.wxsCRS.push(element.OtherCRS);
                  //       }
                  //     }
                  //   }
                  // });

                  // if (this.wxsCRS.length > 0) {
                  //   this.wxsCRS = this.wxsCRS.map((x) => 'EPSG:' + x.slice(-4));
                  // }
                }
              }
            }
          }
          // if (this.wxsCRS !== []) {
          //   if (this.wxsCRS.includes('EPSG:4326')) {
          //     this.selectedWxsCRS = 'EPSG:4326';
          //   } else {
          //     if (this.wxsCRS.includes('EPSG:2100')) {
          //       this.selectedWxsCRS = 'EPSG:2100';
          //     }
          //   }
          // }
        },
        (err) => {
          console.log(err);
        }
      )
    );

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

  reorderLayers(e: Event): void {
    const event = e as CustomEvent<ItemReorderEventDetail>;
    // console.log('reorderLayers', event);
    event.detail.complete();
  }

  removeLayer(e: any, layerId: number) {
    const layerFound = this.findLayer(layerId);
    this.map.removeLayer(layerFound.layer);

    layerFound.properties = {
      ...layerFound.properties,
      displayOnStartup: false,
    };

    this.menuLayers.forEach((x) => {
      x.layers.forEach((y) => {
        if (y.id === layerId) {
          const layerindex = x.layers.findIndex((l) => l.id === layerId);
          x.layers.splice(layerindex, 1);
        }
      });
    });

    const layerIndex = this.layersArray.findIndex(
      (x) => x.properties.layerId === layerId
    );
    this.layersArray.splice(layerIndex, 1);
    this.dispatchActionsHelperService.dispatchMapMenuLayers(this.menuLayers);
    this.dispatchActionsHelperService.dispatchLayers(this.layersArray);
  }
  showHideLayer(e: any, layerId: number, groupName?: string): void {
    const layerFound = this.findLayer(layerId);

    const isChecked = e.detail.checked as boolean;

    if (!isChecked) {
      this.map.removeLayer(layerFound.layer);
    } else {
      // OLD IMPLEMENTATION
      // this.map.addLayer(layerFound.layer);

      //TODO REORDER LAYERS BRING TO FRONT TO ALL LAYERS IN CORRECT ORDER
      this.layersArray.forEach((l) => {
        //find layer
        // const foundlayer = this.layersArray.find((layer)=> layer.layer === l);
        if (layerFound.layer === l?.layer) {
          this.map.addLayer(layerFound.layer);
        }

        /*
        if (l.properties.type.toLowerCase() === 'wms') {
          (l.layer as L.TileLayer).bringToFront();
        } else if (l.properties.type.toLowerCase() === 'geojson') {
          (l.layer as L.GeoJSON).bringToFront();
        } else if (l.properties.type.toLowerCase() === 'ogregeojson') {
          (l.layer as L.GeoJSON).bringToFront();
        } else if (l.properties.type.toLowerCase() === 'esrimap') {
          if (!l.properties?.tiled) {
            (l.layer as esri.DynamicMapLayer).bringToFront();
          } else {
            (l.layer as esri.TiledMapLayer).bringToFront();
          }
        } else if (l.properties.type.toLowerCase() === 'esrifeature') {
          (l.layer as L.GeoJSON).bringToFront();
        } else {
          (l.layer as L.TileLayer).bringToFront();
        }
        */
      });
    }

    this.layersArray = this.mapService.reorderLayersAccordingToConfig(
      this.layersArray
    );

    layerFound.properties = {
      ...layerFound.properties,
      displayOnStartup: isChecked,
    };

    this.menuLayers.forEach((x) => {
      x.layers.forEach((y) => {
        if (y.id === layerId) {
          y.checked = isChecked ? 'true' : 'false';
        }
      });
    });
    // this.dispatchActionsHelperService.dispatchMapMenuLayers(this.menuLayers);
    this.dispatchActionsHelperService.dispatchLayers(this.layersArray);
  }

  showHideLayers(e: any, groupName: string): void {
    const layerFound = this.layersArray.filter(
      (x) => x.properties.menuLayers.typeGroup === groupName
    );

    this.menuLayers.forEach((x) => {
      if (x.group === groupName) {
        x.checked = x.checked ? !x.checked : true;
      }
    });
    layerFound.forEach((el) => {
      this.showHideLayer(e, el.properties.layerId, groupName);
    });
  }

  queryableLayerClicked(
    layerId: number,
    group?: { name: string; value: boolean }
  ) {
    const layerFound = this.findLayer(layerId);
    const layerQueryable = !group
      ? !layerFound.properties.queryable
      : group.value;

    this.menuLayers.forEach((x) => {
      if (x.group === group?.name) {
        x.queryable = layerQueryable;
      }
      x.layers.forEach((y) => {
        if (y.id === layerId) {
          y.queryable = layerQueryable;
        }
      });
    });

    layerFound.properties = {
      ...layerFound.properties,
      queryable: layerQueryable,
    };

    this.dispatchActionsHelperService.dispatchLayers(this.layersArray);
  }

  async exportLayerClicked(ev: any, layerId: number) {
    const layerFound = this.findLayer(layerId);
    const popover = await this.popoverController.create({
      component: ActionsPopoverComponent,
      event: ev,
    });

    await popover.present();

    const { data, role } = await popover.onDidDismiss<{
      exportType: string;
      crs: string;
    }>();

    if (role === 'selectionClicked') {
      if (
        ['geojson', 'kml', 'xml', 'wms'].includes(
          layerFound.properties.type.toLowerCase()
        )
      ) {
        const layerQueryParams: IMapServerRequest = {
          mapfile: layerFound.properties?.mapfile,
          url: layerFound.properties?.url,
          typename: layerFound.properties.name,
        };
        this.mapService.dowloadShapefile(
          layerQueryParams,
          data.exportType,
          data.crs
        );
      } else if (
        ['ogregeojson'].includes(layerFound.properties.type.toLowerCase())
      ) {
        //TODO convert geojson crs
        const oldGeojson = layerFound.properties.ogreGeoJSON;
        /*
        const geojsonArrayNew: any = [];
        let geojsonCollectionNew =
          {} as turf.helpers.Feature<turf.helpers.GeometryCollection>;
        //convert geojsonObject to data.crs
        // eslint-disable-next-line @typescript-eslint/dot-notation
        if (oldGeojson['features'].length > 0) {
          // eslint-disable-next-line @typescript-eslint/dot-notation
          oldGeojson['features'].forEach((feat, index0: number) => {
            const feature = this.mapService.deepClone(
              feat
            ) as turf.helpers.Feature<turf.helpers.Geometry>;
            geojsonArrayNew[index0] =
              this.mapService.convertGeojsonFeatureToTargetCrs(
                feature,
                'EPSG:4326',
                data.crs
              );
          });

          geojsonCollectionNew = geojsonArrayNew;
        }
        const geojsonObjectNew = {
          features: geojsonCollectionNew as any,
          type: 'FeatureCollection',
          crs: {
            type: 'name',
            properties: {
              name: data.crs,
            },
          },
        } as GeoJSON.GeoJsonObject;
*/

        const geojsonObjectNew =
          this.mapService.convertGeojsonCollectionToTargetCrs(
            oldGeojson as turf.helpers.Feature<turf.helpers.GeometryCollection>,
            'EPSG:4326',
            data.crs
          );

        this.httpCallsService
          .ogreGetShapefile(
            {
              json: geojsonObjectNew,
            },
            data.exportType
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
              if (data.exportType === 'CSV') {
                link.download = 'ogre.csv';
              }
              // clicking the anchor element will download the file
              link.click();
            },
            (err) => {
              this.toastService.showToast(err.message);
            }
          );
      } else {
        this.toastService.showToast('Unsupported functionality');
      }
    }
  }

  queryableGroupClicked(groupName: string, queryable: boolean) {
    const layerFound = this.layersArray.filter(
      (x) => x.properties.menuLayers.typeGroup === groupName
    );

    queryable = !queryable ? !queryable : false;

    layerFound.forEach((el) => {
      this.queryableLayerClicked(el.properties.layerId, {
        name: groupName,
        value: queryable,
      });
    });
  }

  findLayer(layerId: number): LayerModel {
    return this.layersArray.find((x) => x.properties.layerId === layerId);
  }

  zoomLayer(layerId: number) {
    const defaultZoomLevel = this.configuration.map.xyZoomLevel;
    const layerFound = this.findLayer(layerId);

    switch (layerFound.properties.type.toUpperCase()) {
      case 'WMS':
        try {
          const convertBounds = (
            bbox: { maxx: string; maxy: string; minx: string; miny: string },
            crs: string
          ) =>
            [
              this.mapService.convertCoordinates(crs, null, [
                parseFloat(bbox.minx),
                parseFloat(bbox.miny),
              ]),
              this.mapService.convertCoordinates(crs, null, [
                parseFloat(bbox.maxx),
                parseFloat(bbox.maxy),
              ]),
            ] as unknown;

          const queryParams: IMapServerRequest = {
            service: 'WMS',
            request: 'GetCapabilities',
            version: '1.3.0',
            map: layerFound.properties.mapfile,
            url: layerFound.properties.url,
          };

          this.dispatchActionsHelperService.dispatchMapLoading(true);

          this.subscriptions.add(
            this.httpCallsService.getFromMapServer(queryParams, true).subscribe(
              (response) => {
                const res = this.mapService.xmlToJson(
                  response
                ) as ICapabilities;
                // console.log(res);
                let layerFoundFromCapabilities: ICapabilities;

                // eslint-disable-next-line @typescript-eslint/dot-notation
                const layers = res.WMS_Capabilities.Capability.Layer
                  .Layer as ICapabilities;
                if (Array.isArray(layers)) {
                  layerFoundFromCapabilities = layers.find(
                    (x) => x.Name === layerFound.properties.name
                  );
                } else {
                  layerFoundFromCapabilities = layers;
                }

                // eslint-disable-next-line @typescript-eslint/dot-notation
                if (Array.isArray(layerFoundFromCapabilities['BoundingBox'])) {
                  // eslint-disable-next-line @typescript-eslint/dot-notation
                  const bbox = layerFoundFromCapabilities['BoundingBox'][0];
                  const { CRS, ...bboxRest } = bbox['@attributes'];

                  const newCoordinates = convertBounds(bboxRest, CRS);
                  const convertedCoordinates =
                    CRS !== 'EPSG:4326'
                      ? [
                          this.mapService.convertToLatLng(
                            newCoordinates[0] as unknown
                          ),
                          this.mapService.convertToLatLng(
                            newCoordinates[1] as unknown
                          ),
                        ]
                      : newCoordinates;
                  this.map.flyToBounds(
                    convertedCoordinates as L.LatLngBoundsExpression
                  );
                } else {
                  // eslint-disable-next-line @typescript-eslint/dot-notation
                  const bbox = layerFoundFromCapabilities['BoundingBox'];
                  const { CRS, ...bboxRest } = bbox['@attributes'];
                  const newCoordinates = convertBounds(bboxRest, CRS);

                  const convertedCoordinates =
                    CRS !== 'EPSG:4326'
                      ? [
                          this.mapService.convertToLatLng(
                            newCoordinates[0] as unknown
                          ),
                          this.mapService.convertToLatLng(
                            newCoordinates[1] as unknown
                          ),
                        ]
                      : newCoordinates;
                  this.map.flyToBounds(
                    convertedCoordinates as L.LatLngBoundsExpression
                  );
                }
                this.dispatchActionsHelperService.dispatchMapLoading(false);
              },
              (error) => {
                this.toastService.showToast(error.message);
                this.dispatchActionsHelperService.dispatchMapLoading(false);
              }
            )
          );
        } catch (error) {
          this.toastService.showToast(error.message);
        }
        break;
      case 'ESRIMAP':
        const esrimapLayer = layerFound.layer as esri.DynamicMapLayer;
        esrimapLayer.metadata((error, metadata) => {
          if (error) {
            return;
          }
          const bounds: {
            xmin: number;
            ymin: number;
            xmax: number;
            ymax: number;
            spatialReference: { wkid: number; latestWkid: number };
          } = metadata?.fullExtent;
          if (bounds.spatialReference.wkid !== 4326) {
            const convertedCoordinatesMin = this.mapService.convertCoordinates(
              'EPSG:' + bounds.spatialReference.wkid,
              null,
              [bounds.xmin, bounds.ymin]
            );
            const convertedCoordinatesMax = this.mapService.convertCoordinates(
              'EPSG:' + bounds.spatialReference.wkid,
              null,
              [bounds.xmax, bounds.ymax]
            );
            const convertedCoordinates = [
              this.mapService.convertToLatLng(convertedCoordinatesMin),
              this.mapService.convertToLatLng(convertedCoordinatesMax),
            ];
            this.map.flyToBounds(
              convertedCoordinates as L.LatLngBoundsExpression
            );
          } else {
            const convertedCoordinatesMin = [bounds.ymin, bounds.xmin];
            const convertedCoordinatesMax = [bounds.ymax, bounds.xmax];

            this.map.flyToBounds([
              convertedCoordinatesMin,
              convertedCoordinatesMax,
            ] as L.LatLngBoundsExpression);
          }
        });
        break;
      case 'ESRIFEATURE':
        const esriFeatureLayer = layerFound.layer as esri.FeatureLayer;
        esriFeatureLayer.query().bounds((error, latlngbounds) => {
          if (error) {
            // console.log('Error running "Query" operation: ' + error);
            return;
          }
          this.map.flyToBounds(latlngbounds);
        });
        break;
      case 'OGREGEOJSON':
      case 'GEOJSON':
        const geojsonLayer = layerFound.layer as L.GeoJSON;

        this.map.flyToBounds(geojsonLayer.getBounds(), {
          maxZoom: defaultZoomLevel,
        });
        break;

      case 'VELOCITY':
        const velocityLayer = layerFound.layer;
        break;

      case 'ESRIRESTTILE':
        const esriTileLayer = layerFound.layer;
        break;

      case 'GEOIMAGES':
        const geoimagesLayer = layerFound.layer;
        break;

      default:
        break;
    }
  }

  getOpacityByLayerId(layerid: number): number {
    // const layerConf = this.configuration.layers.find((x) => x.name === this.findLayer(layerid).properties.name);
    const layerConf = this.layersArray.find(
      (x) => x.properties.name === this.findLayer(layerid)?.properties.name
    );
    if (layerConf) {
      return layerConf.properties.opacity
        ? 1 - layerConf.properties.opacity
        : 0;
    } else {
      return 0;
    }
  }

  opacityChanged(e: Event, layerId: number) {
    const event = e as CustomEvent;
    const opacity = 1 - parseFloat(event.detail.value);

    const layerFound = this.findLayer(layerId);
    layerFound.properties = { ...layerFound.properties, opacity };

    switch (layerFound.properties.type.toUpperCase()) {
      case 'ESRIMAP':
        const esrimapLayer = layerFound.layer as esri.DynamicMapLayer;
        esrimapLayer.setOpacity(opacity);
        break;
      case 'ESRIFEATURE':
        const esrifeatureLayer = layerFound.layer as esri.FeatureLayer;
        esrifeatureLayer.setStyle({
          opacity,
          fillOpacity:
            layerFound.properties?.geojsonStyle?.fillOpacity !== undefined
              ? layerFound.properties?.geojsonStyle?.fillOpacity * opacity
              : 0.2 * opacity, // 0.2 is default fillopacity
        });
        break;
      case 'WMS':
        const wmsLayer = layerFound.layer as L.TileLayer.WMS;

        wmsLayer.setOpacity(opacity);
        break;

      case 'OGREGEOJSON':
      case 'GEOJSON':
        const geojsonLayer = layerFound.layer as L.GeoJSON;

        geojsonLayer.setStyle({
          opacity,
          fillOpacity:
            layerFound.properties?.geojsonStyle?.fillOpacity !== undefined
              ? layerFound.properties?.geojsonStyle?.fillOpacity * opacity
              : 0.2 * opacity, // 0.2 is default fillopacity
        });

        break;

      case 'VELOCITY':
        const velocityLayer = layerFound.layer;

        // velocityLayer.setOpacity(opacity);
        break;

      case 'ESRIRESTTILE':
        const esriTileLayer = layerFound.layer;

        // esriTileLayer.setOpacity(opacity);
        break;

      case 'GEOIMAGES':
        const geoimagesLayer = layerFound.layer;

        // geoimagesLayer.setOpacity(opacity);
        break;

      default:
        break;
    }
  }

  // actions segment events
  layerSegmentChanged(e: unknown): void {
    const event = e as CustomEvent;
    this.layerSegmentValue = event.detail.value;
  }

  saveViewClicked(isHome: boolean = false): void {
    if (!isHome) {
      if (!this.saveViewName) {
        // this.saveViewName = 'unknown'+ (this.savedViewsList.length+1);
        return;
      }
    } else {
      this.saveViewName = 'Home';
    }

    const view = { ...this.writeView(this.saveViewName) };
    if (this.savedViewsList.find((x) => x.name === this.saveViewName)) {
      const i = this.savedViewsList.indexOf(
        this.savedViewsList.find((x) => x.name === this.saveViewName)
      );
      this.savedViewsList[i] = view;
    } else {
      this.savedViewsList.push(view);
    }
    this.saveViewName = null;
  }

  writeView(myview: string): IConfiguration {
    const viewObj = { savedViews: [] };
    const config = { ...this.mapService.getConfiguration() };
    this.mapService.getLayersArray().forEach((x) => {
      if (!config.layers.find((y) => y.name === x.properties.name)) {
        config.layers.push({ ...x.properties });
      }
    });

    const menucheckedObj = [];
    this.menuLayers.forEach((l) =>
      menucheckedObj.push({
        group: l.group,
        checked: l.checked,
        queryable: l.queryable,
      })
    );
    const result = { ...config, name: myview };
    result.layout = { ...result.layout, menuLayers: menucheckedObj };

    const convertedCoords = this.mapService.convertCoordinates(
      null,
      this.configuration.map.defaultProjectionCode,
      [
        this.map.getCenter().lng,
        this.map.getCenter().lat,
      ] as proj4.TemplateCoordinates
    );
    result.map.center = convertedCoords;
    result.map.initZoomLevel = this.map.getZoom();

    this.layersArray.forEach((x) => {
      let layerOpacity: number;

      switch (x.properties.type.toUpperCase()) {
        case 'WMS':
          const wmsLayer = x.layer as L.TileLayer.WMS;

          layerOpacity = wmsLayer.options.opacity;
          break;
        case 'OGREGEOJSON':
        case 'GEOJSON':
          const geojsonLayer = x.layer as L.GeoJSON;

          // eslint-disable-next-line @typescript-eslint/dot-notation
          layerOpacity = geojsonLayer.getLayers()[0]['options'].opacity;
          // geojsonLayer.getLayers()[0]

          break;
        case 'ESRIMAP':
          const esrimapLayer = x.layer as esri.DynamicMapLayer;
          layerOpacity = esrimapLayer.options.opacity;
          break;
        case 'ESRIFEATURE':
          const esrifeatureLayer = x.layer as esri.FeatureLayer;
          // eslint-disable-next-line @typescript-eslint/dot-notation
          esrifeatureLayer.eachFeature((feat) => {
            layerOpacity = feat.options.opacity;
          });
          break;
      }

      if (result.layers.find((y) => y.name === x.properties.name)) {
        result.layers.find(
          (y) => y.name === x.properties.name
        ).displayOnStartup = x.properties.displayOnStartup;
        result.layers.find((y) => y.name === x.properties.name).queryable =
          x.properties.queryable;
        result.layers.find((y) => y.name === x.properties.name).opacity =
          layerOpacity;
      }
      // TODO να κρατάει το state του basemap
      // this.menuLayers.basemaps.forEach((z) => {
      //   z.layers.forEach(element => {
      //      result.layers.find((y) => y.name === this.layersArray.find(
      //         el => el.properties.layerId === element.id
      //        ).properties.name).displayOnStartup = element.selected;
      //   });

      // });
    });

    if (
      typeof localStorage.getItem('evrymap-ng') === 'undefined' ||
      localStorage.getItem('evrymap-ng') === null
    ) {
      viewObj.savedViews.push(result);
      localStorage.setItem('evrymap-ng', JSON.stringify({ ...viewObj }));
    } else {
      const citiPortalObj: { savedViews: [IConfiguration] } = JSON.parse(
        localStorage.getItem('evrymap-ng')
      );

      if (
        citiPortalObj.savedViews.find((x: IConfiguration) => x.name === myview)
      ) {
        const index = citiPortalObj.savedViews.indexOf(
          citiPortalObj.savedViews.find(
            (x: IConfiguration) => x.name === myview
          )
        );
        citiPortalObj.savedViews[index] = result;
      } else {
        citiPortalObj.savedViews.push(result);
      }
      localStorage.setItem('evrymap-ng', JSON.stringify({ ...citiPortalObj }));
    }
    this.toastService.showToast(
      this.translationService.translate(
        'MAP.SIDE_MENU.LAYERS_SUBMENU.VIEW_SAVED'
      )
    );
    return cloneDeep(result);
  }

  readViews(): void {
    const viewString = localStorage.getItem('evrymap-ng');
    if (viewString != null) {
      const viewObj: { savedViews: [IConfiguration] } = JSON.parse(viewString);
      viewObj?.savedViews.forEach((element: IConfiguration) => {
        this.savedViewsList.push(element);
      });
    }
  }

  goToView(view: IConfiguration): void {
    const convertedCoords = this.mapService.convertCoordinates(
      this.configuration.map.defaultProjectionCode,
      null,
      view.map.center as proj4.TemplateCoordinates
    );
    this.map.flyTo(
      { lng: convertedCoords[0], lat: convertedCoords[1] } as L.LatLng,
      view.map.initZoomLevel
    );
    this.loadViewEvent.emit(view); // TODO να μπει στο state...
  }

  deleteView(index: number) {
    this.savedViewsList.splice(index, 1);
    const citiPortalObj: { savedViews: [IConfiguration] } = JSON.parse(
      localStorage.getItem('evrymap-ng')
    );
    citiPortalObj.savedViews.splice(index, 1);
    localStorage.setItem('evrymap-ng', JSON.stringify(citiPortalObj));
    this.toastService.showToast(
      this.translationService.translate(
        'MAP.SIDE_MENU.LAYERS_SUBMENU.VIEW_DELETED'
      )
    );
  }
  getViewName(viewName: string) {
    if (viewName === 'Home') {
      return this.translationService.translate(
        'MAP.SIDE_MENU.LAYERS_SUBMENU.HOME'
      );
    } else {
      return viewName;
    }
  }

  connectToService() {
    //action ,reducer, effect, selector
    this.dispatchActionsHelperService.dispatchClearLayerError();
    this.wxsJson = null;
    // this.wxsCRS = [];
    this.wxsLayers = [];
    this.wxsSelectedLayers = [];
    this.selectedWfsOutputFormat = null;
    this.connectedServiceUrl = this.serviceUrl;
    this.connectedServiceType = this.serviceType;

    if (this.serviceType === 'WMS' || this.serviceType === 'WFS') {
      const wxsService =
        this.serviceUrl +
        'SERVICE=' +
        this.serviceType +
        '&VERSION=1.3.0&REQUEST=GetCapabilities';
      this.dispatchActionsHelperService.dispatchSendWXS(wxsService);
    } else if (
      this.serviceType === 'ESRIMAP' ||
      this.serviceType === 'ESRIFEATURE'
    ) {
      this.subscriptions.add(
        this.httpCallsService.esriGet(this.serviceUrl).subscribe(
          (response: { layers: any[] }) => {
            this.wxsJson = response;
            this.wxsLayers = response.layers;
          },
          (err) => {
            //err
          }
        )
      );
    }

    this.selectorsHelperService.getWXSjson();
  }

  addWxSLayer(layerIndexes: any[]) {
    const wmsLayer = [];
    layerIndexes.forEach((l) => wmsLayer.push(this.wxsLayers[l]));
    const result = [];
    wmsLayer.forEach((wxsl) => {
      if (this.wxsJson.WMS_Capabilities) {
        result.push({
          name: wxsl.Name,
          _external: true,
          type: 'WMS',
          projection: 'EPSG:4326',
          tiled: false,
          url: this.connectedServiceUrl,
          defaultCrs: wxsl.CRS
            ? Array.isArray(wxsl?.CRS)
              ? wxsl?.CRS[0]
              : wxsl.CRS
            : wxsl.SRS
            ? Array.isArray(wxsl?.SRS)
              ? wxsl?.SRS[0]
              : wxsl.SRS
            : null,
          label: wxsl.Title,
          displayOnStartup: true,
          outputFormat: this.selectedWfsOutputFormat,
          menuLayers: {
            type: 'layer',
            typeGroup: this.wxsJson?.WMS_Capabilities?.Service?.Title
              ? this.wxsJson.WMS_Capabilities.Service.Title
              : 'external',
            image: '',
          },
          queryable: wxsl['@attributes'].queryable === '1' ? true : false,
          group: 'WMS',
        });
      } else if (this.wxsJson['wfs:WFS_Capabilities']) {
        result.push({
          name: wxsl.Name,
          _external: true,
          type: 'GeoJSON',
          projection: 'EPSG:4326', //TODO different projections?
          defaultCrs: wxsl.DefaultCRS
            ? Array.isArray(wxsl?.DefaultCRS)
              ? wxsl?.DefaultCRS[0]
              : wxsl.DefaultCRS
            : wxsl.DefaultSRS
            ? Array.isArray(wxsl?.DefaultSRS)
              ? wxsl?.DefaultSRS[0]
              : wxsl.DefaultSRS
            : null,
          tiled: false,
          url: this.connectedServiceUrl,
          outputFormat: this.selectedWfsOutputFormat,
          label: wxsl.Title,
          displayOnStartup: true,
          geojsonStyle: {
            color: this.wfsColor,
            weight: this.wfsWeight,
            fillColor: this.wfsFillColor,
            opacity: 1,
            fillOpacity: 1.0 - this.wfsFillOpacity,
            radius: this.wfsRadius,
          },
          menuLayers: {
            type: 'layer',
            typeGroup: this.wxsJson['wfs:WFS_Capabilities'][
              'ows:ServiceIdentification'
            ]['ows:Title']
              ? this.wxsJson['wfs:WFS_Capabilities'][
                  'ows:ServiceIdentification'
                ]['ows:Title']
              : 'external',
            image: '',
          },
          queryable: true,
          group: 'WFS',
        });
      } else {
        //ESRI LAYERS
        // const layerIds = this.wxsSelectLayer.value.map(x=> x.id);
        const serviceNameArray = this.connectedServiceUrl.split('/');
        const serviceName = serviceNameArray[serviceNameArray.length - 2];
        result.push({
          name: wxsl.name,
          _external: true,
          type: this.connectedServiceType,
          //projection: this.selectedWxsCRS, //TODO different projections?
          // defaultCrs: Array.isArray(wxsl?.DefaultCRS)
          //   ? wxsl?.DefaultCRS[0]
          //   : wxsl.DefaultCRS, //TODO defaultSRS , CRS or SRS possible?
          // tiled: false,
          url: this.connectedServiceUrl,
          esriLayersID: [wxsl.id],
          label: wxsl.name,
          displayOnStartup: true,
          geojsonStyle: {
            color: this.wfsColor,
            weight: this.wfsWeight,
            fillColor: this.wfsFillColor,
            opacity: 1,
            fillOpacity: 1.0 - this.wfsFillOpacity,
            radius: this.wfsRadius,
          },
          menuLayers: {
            type: 'layer',
            typeGroup: serviceName ? serviceName : 'ESRI external',
            image: '',
          },
          queryable: true,
          // group: 'WFS',
        });
      }
    });

    this.dispatchActionsHelperService.dispatchAddWMSLayer(result);
    this.wxsSelectedLayers = [];
    this.wxsSelectedLayersText = [];
  }

  async openSelectLayers(ev: any) {
    const popover = await this.popoverController.create({
      component: SelectExternalLayersComponent,
      event: ev,
      componentProps: {
        layers: this.wxsLayers,
        selectedLayers: this.wxsSelectedLayers,
      },
      // backdropDismiss: false,
      cssClass: 'selectExternalLayer',
    });

    await popover.present();

    const { role, data } = await popover.onDidDismiss();

    if (this.wxsSelectedLayers != null) {
      // this.wxsSelectedLayers = data;
      this.wxsSelectedLayersText = [];
      this.wxsSelectedLayers.forEach((x) => {
        if (this.wxsLayers[x]?.Title) {
          this.wxsSelectedLayersText.push(this.wxsLayers[x].Title);
        } else {
          this.wxsSelectedLayersText.push(this.wxsLayers[x]?.name);
        }
      });
    }
  }

  onFilePicked(event) {
    this.ogreFile = event.target.files[0];
    if (!this.ogreFile) {
      return;
    }
  }

  getOgreGeojson() {
    const formData: FormData = new FormData();
    formData.append('upload', this.ogreFile, this.ogreFile.name);

    if (this.ogreSourceSrs) {
      formData.append('sourceSrs', this.ogreSourceSrs);
    }
    formData.append('targetSrs', 'EPSG:4326');

    this.dispatchActionsHelperService.dispatchMapLoading(true);
    this.subscriptions.add(
      this.httpCallsService.ogreGetGeojson(formData).subscribe(
        (data: turf.helpers.FeatureCollection) => {
          this.dispatchActionsHelperService.dispatchMapLoading(false);
          if (data.features.length > 0) {
            this.addOgreGeojson(data);
          } else {
            this.toastService.showToast(
              this.translationService.translate('ERRORS.MAP.LOAD_LAYER', {
                layer: this.ogreFile.name,
              }),
              null,
              'danger',
              5000
            );
          }
        },
        (error) => {
          //error
          this.dispatchActionsHelperService.dispatchMapLoading(false);
          this.toastService.showToast(
            this.translationService.translate('ERRORS.MAP.LOAD_LAYER', {
              layer: this.ogreFile.name,
            }),
            null,
            'danger',
            5000
          );
        }
      )
    );
  }

  addOgreGeojson(data: geojson.GeoJsonObject) {
    const result = [];
    result.push({
      name: this.ogreFile.name,
      type: 'OgreGeoJSON',
      projection: 'EPSG:4326',
      tiled: false,
      url: this.connectedServiceUrl,
      label: this.ogreFile.name,
      displayOnStartup: true,
      // ogreFile: this.ogreFile, // TODO remove or keep
      ogreSourceSrs: !!this.ogreSourceSrs ? this.ogreSourceSrs : 'EPSG:4326',
      ogreGeoJSON: data, // TODO remove or keep
      geojsonStyle: {
        color: this.ogreColor,
        weight: this.ogreWeight,
        fillColor: this.ogreFillColor,
        opacity: 1,
        fillOpacity: 1.0 - this.ogreFillOpacity,
        radius: this.ogreRadius,
      },
      menuLayers: {
        type: 'layer',
        typeGroup: this.ogreFile.name,
        image: '',
      },
      queryable: true,
      exportable: true,
      group: 'WFS',
    });

    this.dispatchActionsHelperService.dispatchAddWMSLayer(result);
    this.ogreFile = null;
    this.ogreSourceSrs = null;
    this.ogreFileInput.nativeElement.value = null;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
