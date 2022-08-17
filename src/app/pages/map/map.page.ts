/* eslint-disable @typescript-eslint/dot-notation */
import { Component, HostListener } from '@angular/core';
import { MapService } from '../../services/map.service';
import * as L from 'leaflet';
import 'leaflet-bing-layer';
import '@geoman-io/leaflet-geoman-free';
import 'leaflet-easybutton';
import 'leaflet-sidebar-v2';
// import 'node_modules/leaflet.context-menu/dist/leaflet.contextmenu.min.js';
import 'node_modules/leaflet.browser.print/dist/leaflet.browser.print.min.js';
import 'node_modules/leaflet-compass/dist/leaflet-compass.min.js';
import * as geojson from 'geojson';
import { MapEventsService } from 'src/app/services/map-events.service';
import {
  IConfiguration,
  IConfigurationLayer,
} from 'src/app/core/interfaces/configuration.interface';
import { TranslationService } from 'src/app/services/translation.service';
import {
  AUTO_STYLE,
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { MapViewHistoryService } from 'src/app/services/map-view-history.service';
import {
  IMenuLayer,
  IMenuLayers,
} from 'src/app/core/interfaces/menu-layer.interface';
import { Subscription } from 'rxjs';
import { ToastService } from 'src/app/services/toast.service';
import { ILayer } from 'src/app/core/models/layer.model';
import { HttpCallsService } from 'src/app/services/http-calls.service';
import { IMapServerRequest } from 'src/app/core/interfaces/map-server-request.interface';
import { SelectorsHelperService } from 'src/app/services/selectors-helper.service';
import { DispatchActionsHelperService } from 'src/app/services/dispatch-actions-helper.service';
import { filter } from 'rxjs/operators';
import * as esri from 'esri-leaflet';
import { IEsriImage } from 'src/app/core/interfaces/esri-image.interface';
import lodash from 'lodash';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { ContextMenuService } from 'src/app/services/context-menu.service';
import { icon, Marker } from 'leaflet';

const iconRetinaUrl = 'assets/marker-icon-2x.png';
const iconUrl = 'assets/marker-icon.png';
const shadowUrl = 'assets/marker-shadow.png';
const iconDefault = L.icon({
  iconRetinaUrl,
  iconUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = iconDefault;

const DEFAULT_DURATION = 300;

@Component({
  selector: 'app-map',
  templateUrl: 'map.page.html',
  styleUrls: ['map.page.scss'],
  animations: [
    trigger('headerCollapse', [
      state('false', style({ height: AUTO_STYLE, visibility: AUTO_STYLE })),
      state('true', style({ height: '0', visibility: 'hidden' })),
      transition('false => true', animate(DEFAULT_DURATION + 'ms ease-in')),
      transition('true => false', animate(DEFAULT_DURATION + 'ms ease-out')),
    ]),
    trigger('searchCollapse', [
      state('false', style({ height: AUTO_STYLE, visibility: AUTO_STYLE })),
      state('true', style({ height: '0' })),
      transition('false => true', animate(DEFAULT_DURATION + 'ms ease-in')),
      transition('true => false', animate(DEFAULT_DURATION + 'ms ease-out')),
    ]),
  ],
})
export class MapPage {
  public currentYear = new Date().getFullYear();
  public map: L.Map;
  public configuration = this.mapService.getConfiguration();
  public mouseCoordinates: { x: number; y: number };
  public menuLayersObject: {
    basemaps: IMenuLayer[];
    layers: IMenuLayer[];
  };
  public polygonSearchClicked = false;
  public toolEnabled: string;
  public measureLineClicked = false;
  public measurePolygonClicked = false;
  public zoomToXYClicked = false;
  public printMapClicked = false;
  public headerCollapsed = false;
  public searchCollapsed = true;
  public layersArray: ILayer[] = [];
  public sideMenu: L.Control.Sidebar;
  public searchedLayers = new L.GeoJSON(null, {
    pointToLayer: (feature, latlng) => L.circleMarker(latlng, null),
  });
  public isLoading = false;

  public lastCustomLayerId: number;
  public lastIndex: number;

  private layers: ILayer[] = [];
  // subscriptions
  private subscriptions: Subscription = new Subscription();

  private errorOnLoadLayer = false;

  //when view is loaded on start
  private isView = false;

  private mode: string;
  private createModeLayer: string;
  private createModeFeature: number;
  private wmsReplaced;
  private iframeModeOn;

  constructor(
    private mapService: MapService,
    public mapEventsService: MapEventsService,
    private httpCallService: HttpCallsService,
    private mapViewHistoryService: MapViewHistoryService,
    public translationService: TranslationService,
    private toastService: ToastService,
    public dispatchActionsHelperService: DispatchActionsHelperService,
    private selectorsHelperService: SelectorsHelperService,
    private route: ActivatedRoute,
    private contextMenuService: ContextMenuService
  ) {
    this.subscriptions.add(
      this.mapEventsService
        .getMouseCoordinates()
        .subscribe((mouseCoords) => (this.mouseCoordinates = mouseCoords))
    );

    this.subscriptions.add(
      this.selectorsHelperService.getLayers().subscribe((layers) => {
        this.layersArray = layers.map((x) => {
          const layerFound = this.layers.find((y) => x.id === y.id);
          return {
            id: x.id,
            properties: x.properties,
            layer: layerFound.layer,
            selected: x.selected,
          };
        });

        //replace displayonstartup from layers. its the only that gets updated from layerscomponent for showhide / checked
        //you can dispatch the menulayers from layerscomponent in show/hide also but it refreshes the whole component

        this.layers.map((x) => {
          x.properties = {
            ...x.properties,
            displayOnStartup: this.layersArray.find((y) => x.id === y.id)
              ? this.layersArray.find((y) => x.id === y.id).properties
                .displayOnStartup
              : true,
          };

          const typeGroupfound = this.menuLayersObject.layers.findIndex(
            (t) => t.group === x.properties.menuLayers.typeGroup
          );
          if (typeGroupfound !== -1) {
            const menuLayer = this.menuLayersObject.layers[
              typeGroupfound
            ].layers.find((ll) => ll.id === x.properties.layerId);
            if (menuLayer) {
              menuLayer.checked = x.properties.displayOnStartup + '';
            }
          }
        });

        this.mapService.setLayersArray(this.layersArray);

        //check inserted layer for edit/create mode replacement for wms;
        //has to pass one time
        if (
          ((this.mode === 'edit' &&
            this.createModeLayer != null &&
            this.createModeFeature != null) ||
            (this.mode === 'create' && this.createModeLayer != null)) &&
          this.layersArray.find(
            (layer) => layer.properties.name === this.createModeLayer
          ) &&
          this.layersArray
            .find((layer) => layer.properties.name === this.createModeLayer)
            .properties.type.toLowerCase() === 'wms' &&
          !this.wmsReplaced
        ) {
          this.wmsReplaced = true;
          this.mapEventsService.replaceWmsWithGeojsonStartup(
            this.map,
            'GeoJSON',
            this.configuration.layers.find(
              (l) => l.name === this.createModeLayer
            )
          );
        }

        //check edit/create mode
        if (
          ((this.mode === 'edit' &&
            this.createModeLayer != null &&
            this.createModeFeature != null) ||
            (this.mode === 'create' && this.createModeLayer != null)) &&
          this.layersArray.find(
            (layer) => layer.properties.name === this.createModeLayer
          ) &&
          this.layersArray
            .find((layer) => layer.properties.name === this.createModeLayer)
            .properties.type.toLowerCase() === 'geojson' &&
          !this.iframeModeOn
        ) {
          this.iframeModeOn = true;
          this.mapEventsService.iframeModeOn = true;

          this.checkCreateMode(this.map);
          this.checkEditMode(this.map);
        }
      })
    );

    this.subscriptions.add(
      this.selectorsHelperService
        .getMapMenuLayersObject()
        .subscribe((menuLayersObject) => {
          this.menuLayersObject = this.mapService.deepClone(menuLayersObject);

          let layer: IMenuLayers;
          this.menuLayersObject.basemaps.map((x) => {
            const found = x.layers.find((y) => y.selected);
            layer = found ? found : layer;
          });

          const basemapFound = this.layersArray.find(
            (x) => x.selected && x.properties.menuLayers.type === 'basemap'
          );

          if (!basemapFound) {
            return;
          }

          if (basemapFound.properties.layerId === layer.id) {
            return;
          }

          this.map.removeLayer(basemapFound.layer);
          basemapFound.selected = false;

          const layersArrayFounded = this.layersArray.find(
            (x) => layer.id === x.properties.layerId
          );
          layersArrayFounded.selected = true;

          const leafletLayer = layersArrayFounded.layer as L.TileLayer;
          this.map.addLayer(leafletLayer);
          leafletLayer.bringToBack();

          this.dispatchActionsHelperService.dispatchLayers(this.layersArray);
        })
    );

    this.subscriptions.add(
      this.selectorsHelperService
        .getSearchResultsSearchCollapsed()
        .subscribe(
          (searchCollapsed) => (this.searchCollapsed = searchCollapsed)
        )
    );

    this.subscriptions.add(
      this.selectorsHelperService.getSearchResults().subscribe((results) => {
        if (!results.length) {
          return;
        }
        const newResults = results.find((x) => x.id === 1);

        const layersResultsObjectEntries: [][] = Object.values(
          newResults.layers
        );

        if (
          newResults.address.length === 0 &&
          layersResultsObjectEntries.length === 0
        ) {
          this.dispatchActionsHelperService.dispatchSearchResultsSearchCollapsed(
            true
          );
        } else {
          const layersHasValues =
            layersResultsObjectEntries
              .map((x) => x.length > 0)
              .find((x) => x) || false;

          this.dispatchActionsHelperService.dispatchSearchResultsSearchCollapsed(
            layersResultsObjectEntries.length > 0 ? !layersHasValues : false
          );
        }
      })
    );

    this.subscriptions.add(
      this.selectorsHelperService
        .getWMSlayer()
        .pipe(filter((layer) => layer != null))
        .subscribe((wmsLayer) => {
          this.addWMSlayer(wmsLayer);
          this.dispatchActionsHelperService.dispatchClearAddWMSLayer();
        })
    );
    this.loadingSubscriptions();
    this.mapEventsService.initialize();
  }

  @HostListener('window:message', ['$event']) onPostMessage(event) {
    // console.log('window:message', event);
  }

  loadingSubscriptions() {
    this.subscriptions.add(
      this.selectorsHelperService
        .getLayersLoading()
        .subscribe((loading) => (this.isLoading = loading))
    );
    this.subscriptions.add(
      this.selectorsHelperService
        .getSubheaderLoading()
        .subscribe((loading) => (this.isLoading = loading))
    );
    this.subscriptions.add(
      this.selectorsHelperService
        .getSearchResultsLoading()
        .subscribe((loading) => (this.isLoading = loading))
    );
    this.subscriptions.add(
      this.selectorsHelperService
        .getMapLoading()
        .subscribe((loading) => (this.isLoading = loading))
    );
  }

  ionViewWillEnter(): void {
    //if there is a Home view load config from view
    // this.paramMode = this.route.snapshot.params['mode'];

    if (this.configuration.layout?.saveView) {
      const citiPortalObj: { savedViews: IConfiguration[] } = JSON.parse(
        localStorage.getItem('evrymap-ng')
      );
      if (citiPortalObj != null) {
        if (citiPortalObj.savedViews.find((x) => x.name === 'Home')) {
          this.isView = true;
          this.configuration = citiPortalObj.savedViews.find(
            (x) => x.name === 'Home'
          );
        }
      }
    }
    this.initiateMap();

    this.mapViewHistoryService.initiateHistory(this.map);

    // if edit mode is enabled
    // if (this.configuration.general.loadEditMod) {
    this.initiateControls();
    // }
    this.route.queryParams.subscribe((params) => {
      this.mode = params['mode'];
      this.createModeLayer = params['layer'];
      this.createModeFeature = params['feature'];
    });

    this.initiateLayers();
    this.mapEventsService.addMapEvents(this.map);
    this.mapEventsService.defaultClickEvent(this.map, this.searchedLayers);
  }

  checkEditMode(map: L.Map): void {
    if (
      this.mode === 'edit' &&
      this.createModeLayer != null &&
      this.createModeFeature != null
    ) {
      this.mapEventsService.iframeEdit = true;
      this.mapEventsService.editLayerFeatureMode(
        map,
        this.createModeLayer,
        this.createModeFeature
      );
    }
  }

  checkCreateMode(map: L.Map): void {
    if (this.mode === 'create' && this.createModeLayer != null) {
      this.mapEventsService.iframeCreate = true;
      this.mapEventsService.createLayerFeatureMode(map, this.createModeLayer);
    }
  }

  initiateMap(): void {
    const convertedCoords = this.mapService.convertCoordinates(
      this.configuration.map.defaultProjectionCode,
      null,
      this.configuration.map.center as proj4.TemplateCoordinates
    );

    this.map = new L.Map('map', {
      zoomControl: false,
      center: this.mapService.convertToLatLng(
        convertedCoords
      ) as L.LatLngExpression,
      zoom: this.configuration.map.initZoomLevel
        ? this.configuration.map.initZoomLevel
        : 2,
      zoomSnap: 0,
      zoomDelta: 0.5,
      doubleClickZoom: false,
    });

    L.PM.setOptIn(true);

    // add to map layers that have been searched
    this.map.addLayer(this.searchedLayers);
  }

  initiateControls(): void {
    // se language for control
    // this.map.pm.enableGlobalEditMode();
    this.map.pm.setLang(this.translationService.getLanguage() as 'en' | 'el');

    this.mapEventsService.onGlobalEdit(this.map);

    // add a new custom control

    this.map.pm.Toolbar.copyDrawControl('Polygon', {
      name: 'AddPartPolygon',
      block: 'custom',
      title: this.translationService.translate('MAP.SUBHEADER.ADD_PART'),
      // onClick: () => {
      //   this.mapEventsService.addPartOn = !this.mapEventsService.addPartOn;
      //   console.log('add part', this.mapEventsService.addPartOn);
      // },
      // actions: actions,
    });
    this.map.pm.Toolbar.copyDrawControl('Line', {
      name: 'AddPartLine',
      block: 'custom',
      title: this.translationService.translate('MAP.SUBHEADER.ADD_PART'),
      // onClick: () => {
      //   this.mapEventsService.addPartOn = !this.mapEventsService.addPartOn;
      // },
      // actions: actions,
    });
    this.map.pm.Toolbar.copyDrawControl('CircleMarker', {
      name: 'AddPartCircle',
      block: 'custom',
      title: this.translationService.translate('MAP.SUBHEADER.ADD_PART'),
      // onClick: () => {
      //   this.mapEventsService.addPartOn = !this.mapEventsService.addPartOn;
      // },
      // actions: actions,
    });
    this.map.pm.Toolbar.copyDrawControl('Marker', {
      name: 'AddPartMarker',
      block: 'custom',
      title: this.translationService.translate('MAP.SUBHEADER.ADD_PART'),
      // onClick: () => {
      //   this.mapEventsService.addPartOn = !this.mapEventsService.addPartOn;
      // },
      // actions: actions,
    });

    this.map.pm.Toolbar.copyDrawControl('Polygon', {
      name: 'MeasurePolygon',
      block: 'custom',
      // title: this.translationService.translate('MAP.SUBHEADER.ADD_PART'),
      // onClick: () => {
      //   this.mapEventsService.addPartOn = !this.mapEventsService.addPartOn;
      //   console.log('add part', this.mapEventsService.addPartOn);
      // },
      // actions: actions,
    });
    this.map.pm.Toolbar.copyDrawControl('Line', {
      name: 'MeasureLine',
      block: 'custom',
      // title: this.translationService.translate('MAP.SUBHEADER.ADD_PART'),
      // onClick: () => {
      //   this.mapEventsService.addPartOn = !this.mapEventsService.addPartOn;
      // },
      // actions: actions,
    });

    this.map.pm.addControls({
      position: 'topright',
      oneBlock: false,
      drawMarker: false,
      drawPolyline: true,
      drawRectangle: false,
      drawCircleMarker: true,
      drawCircle: false,
      dragMode: false,
      removalMode: false,
      rotateMode: false,
      drawPolygon: true,
      customControls: true,
    });
    // this.map.pm.Toolbar.setButtonDisabled('AddPartLine',  true );
    // this.map.pm.Toolbar.setButtonDisabled('AddPartPolygon',  true);
    // this.map.pm.Toolbar.setButtonDisabled('AddPartCircle', true);
    this.map.pm.toggleControls();

    this.sideMenu = L.control.sidebar({ container: 'sidebar' }).addTo(this.map);
    const scaleControl = L.control.scale().addTo(this.map);
    const scaleArray = scaleControl.getContainer().innerText.split('\n');
    const scale = {
      kilometers: scaleArray[0],
      miles: scaleArray[1],
    };

    this.dispatchActionsHelperService.dispatchControlScale(scale);

    this.mapEventsService.onZoomStartEvent(this.map, scaleControl);

    this.mapEventsService.sideMenuOnContent(this.sideMenu);

    this.mapEventsService.onToolbarButton(this.map);
  }

  initiateLayers(): void {
    // create grid layer extend for print
    L.GridLayer['CustomGrid'] = L.GridLayer.extend({
      createTile: () => {
        const tile = document.createElement('div');

        tile.style.outline = '1px solid red';
        return tile;
      },
    });

    const layers = this.configuration.layers;
    // const mapServerUrl = `${this.configuration.map.mapServerExeUrl}`;
    // const mapServerUrl = window.location.protocol + '//'
    //   + this.mapService.getConfiguration().map.mapserver + '/'
    //   + this.mapService.getConfiguration().map.mapservexe;

    let mapServerUrl;
    if (this.configuration.map.useWrappedMS) {
      mapServerUrl =
        window.location.protocol + '//' + this.configuration.map.mapserver;
    } else {
      mapServerUrl =
        window.location.protocol +
        '//' +
        this.configuration.map.mapserver +
        '/' +
        this.configuration.map.mapservexe;
    }
    let customLayerId = 3;

    let index = 0;
    layers.map((configLayer) => {
      // const mapServerRequestBaseUrl = configLayer.mapfile
      //   ? `${mapServerUrl}?map=${configLayer.mapfile}`
      //   : configLayer.url;
      let mapServerRequestBaseUrl: string;
      if (configLayer.mapfile) {
        if (this.configuration.map.useWrappedMS) {
          mapServerRequestBaseUrl =
            mapServerUrl +
            '/' +
            configLayer.mapfile
              .split('\\')
            [configLayer.mapfile.split('\\').length - 1].split('.')[0];
        } else {
          mapServerRequestBaseUrl = `${mapServerUrl}?map=${configLayer.mapfile}`;
        }
      } else {
        mapServerRequestBaseUrl = configLayer.url;
      }
      if (
        configLayer.mapfile ||
        (configLayer.url &&
          (configLayer.type === 'WMS' ||
            configLayer.type.toLowerCase() === 'geojson'))
      ) {
        const legendImage = this.mapService.createLegendImage(
          mapServerRequestBaseUrl,
          configLayer.name
        );
        // configLayer.menuLayers.image = legendImage;
        configLayer.menuLayers = {
          ...configLayer.menuLayers,
          image: legendImage,
        };
      } else if (
        //if it is a dynamicmap
        (configLayer.type === 'ESRIMAP' &&
          configLayer.menuLayers.type !== 'basemap' &&
          !configLayer?.tiled) ||
        configLayer.type === 'ESRIFEATURE'
      ) {
        this.createEsriLegend(mapServerRequestBaseUrl, configLayer);
      }

      switch (configLayer.type.toUpperCase()) {
        case 'OSM':
          const osmUrl = configLayer.url
            ? configLayer.url
            : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';

          const osmBasemap = L.tileLayer(osmUrl, {
            attribution:
              '<a target="_blank" href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors.',
            maxNativeZoom: 19, // Tilelayer max available zoom is at 19.
            maxZoom: 22, // Match the map maxZoom, or leave map.options.maxZoom undefined.
          });

          this.layers.push({
            layer: osmBasemap,
            properties: { ...configLayer, layerId: ++customLayerId },
            selected: configLayer.displayOnStartup,
            id: index,
          });

          this.createMenuLayersArray(configLayer, customLayerId, 'basemaps');

          // check if display this layer on start of application
          if (configLayer.displayOnStartup) {
            this.map.addLayer(osmBasemap);
          }

          this.dispatchLayer(layers.length, ++index);
          break;

        case 'BING':
          const errorFunction = (error: string) => {
            this.toastService.showToast(
              error,
              this.translationService.translate('ERRORS.MAP.LOAD_LAYER', {
                layer: 'Bing: ' + configLayer.label,
              }),
              'danger',
              5000
            );
            console.warn(error);
          };

          this.httpCallService.validateBingLayer(configLayer.bingKey).subscribe(
            () => {
              try {
                const options = {
                  bingMapsKey: configLayer.bingKey,
                  imagerySet: configLayer.bingStyle,
                  culture: 'el',
                  attribution:
                    '<a class="ol-attribution-bing-tos" href="https://www.microsoft.com/maps/product/terms.html">Terms of Use</a>',
                  maxNativeZoom: 19, // Tilelayer max available zoom is at 19.
                  maxZoom: 22, // Match the map maxZoom, or leave map.options.maxZoom undefined.
                };

                const bingBasemap = L.tileLayer.bing(options);

                L.Control['BrowserPrint'].Utils.registerLayer(
                  L.TileLayer['Bing'],
                  `L.TileLayer.Bing`,
                  // eslint-disable-next-line no-underscore-dangle
                  (layer: { options: any }) =>
                    new L.TileLayer['Bing'](layer.options)
                );

                this.layers.push({
                  layer: bingBasemap,
                  properties: { ...configLayer, layerId: ++customLayerId },
                  selected: configLayer.displayOnStartup,
                  id: index,
                });

                this.createMenuLayersArray(
                  configLayer,
                  customLayerId,
                  'basemaps'
                );

                // check if display this layer on start of application
                if (configLayer.displayOnStartup) {
                  this.map.addLayer(bingBasemap);
                }
              } catch (error) {
                errorFunction(error.message);
              } finally {
                this.dispatchLayer(layers.length, ++index);
                if (index > this.lastIndex) {
                  this.lastIndex = index;
                }
                if (customLayerId > this.lastCustomLayerId) {
                  this.lastCustomLayerId = customLayerId;
                }
              }
            },
            (error: HttpErrorResponse) => {
              this.dispatchLayer(layers.length, ++index);
              errorFunction(
                error.error?.errorDetails
                  ? error.error?.errorDetails[0]
                  : error.message
              );
            }
          );

          break;
        case 'ESRIMAP':
          const esrimapLayer = configLayer?.tiled
            ? esri.tiledMapLayer({
              url: mapServerRequestBaseUrl,
              useCors: false,
              zIndex: index,
              pane: 'tilePane',
            })
            : esri.dynamicMapLayer({
              url: mapServerRequestBaseUrl,
              useCors: false,
              layers: configLayer?.esriLayersID,
              zIndex: index,
              pane: 'tilePane',
            });
          if (configLayer.displayOnStartup) {
            esrimapLayer.addTo(this.map);
          }
          this.layers.push({
            layer: esrimapLayer,
            properties: { ...configLayer, layerId: ++customLayerId },
            selected: configLayer.displayOnStartup,
            id: index,
          });

          this.createMenuLayersArray(
            configLayer,
            customLayerId,
            configLayer.menuLayers.type === 'basemap' ? 'basemaps' : 'layers'
          );

          // if (configLayer.displayOnStartup) {
          //   this.map.addLayer(esrimapLayer);
          // }
          this.checkEsriError(esrimapLayer, configLayer);
          this.dispatchLayer(layers.length, ++index);
          break;
        case 'ESRIFEATURE':
          const reqOptions = {
            url: configLayer.esriLayersID
              ? mapServerRequestBaseUrl + '/' + configLayer.esriLayersID[0]
              : mapServerRequestBaseUrl,
            useCors: false,
            fetchAllFeatures: true,
            pointToLayer: (feature, latlng) =>
              configLayer.geojsonStyle
                ? L.circleMarker(latlng, configLayer.geojsonStyle)
                : new L.Marker(latlng),
          };
          if (configLayer.searchFields) {
            // eslint-disable-next-line @typescript-eslint/dot-notation
            reqOptions['fields'] = configLayer?.searchFields.map((x) => x.name);
          }
          const esrifeatureLayer = esri.featureLayer(reqOptions);
          if (configLayer.displayOnStartup) {
            esrifeatureLayer.addTo(this.map);
          }
          this.layers.push({
            layer: esrifeatureLayer,
            properties: { ...configLayer, layerId: ++customLayerId },
            selected: configLayer.displayOnStartup,
            id: index,
          });

          this.createMenuLayersArray(
            configLayer,
            customLayerId,
            configLayer.menuLayers.type === 'basemap' ? 'basemaps' : 'layers'
          );

          // if (configLayer.displayOnStartup) {
          //   this.map.addLayer(esrimapLayer);
          // }
          this.checkEsriError(esrifeatureLayer, configLayer);
          this.dispatchLayer(layers.length, ++index);
          break;
        case 'WMS':
          const wmsLayer = L.tileLayer.wms(mapServerRequestBaseUrl, {
            layers: configLayer.name,
            format: 'image/png',
            transparent: true,
            crs: L.CRS.EPSG4326,
            maxNativeZoom: 19, // Tilelayer max available zoom is at 19.
            maxZoom: 22, // Match the map maxZoom, or leave map.options.maxZoom undefined.
            zIndex: index,
          });

          this.layers.push({
            layer: wmsLayer,
            properties: { ...configLayer, layerId: ++customLayerId },
            selected: configLayer.displayOnStartup,
            id: index,
          });

          this.createMenuLayersArray(
            configLayer,
            customLayerId,
            configLayer.menuLayers.type === 'basemap' ? 'basemaps' : 'layers'
          );
          wmsLayer.on('loading', (wmsloading) => {
            this.dispatchActionsHelperService.dispatchMapLoading(true);
          });
          wmsLayer.on('load', (wmsloading) => {
            this.dispatchActionsHelperService.dispatchMapLoading(false);
          });
          wmsLayer.on('tileerror', (error) => {
            this.dispatchActionsHelperService.dispatchMapLoading(false);
            if (!this.errorOnLoadLayer) {
              const findLayer = this.layers.find(
                (x) => x.layer === error.target
              );

              const menuLayerType =
                findLayer.properties.menuLayers.type === 'basemap'
                  ? 'basemaps'
                  : 'layers';

              const menuLayerGroupName =
                findLayer.properties.menuLayers.typeGroup;
              if (menuLayerType !== 'basemaps') {
                const menuLayerData = this.menuLayersObject[menuLayerType].find(
                  (x) => x.group === menuLayerGroupName
                );
                const menuLayer = menuLayerData.layers.find(
                  (y) => y.id === findLayer.properties.layerId
                );

                menuLayer.hasError = true;
                findLayer.properties.queryable = false;
                this.dispatchActionsHelperService.dispatchMapMenuLayers(
                  this.menuLayersObject[menuLayerType]
                );
              }
              this.toastService.showToast(
                this.translationService.translate('ERRORS.MAP.LOAD_LAYER', {
                  layer: findLayer.properties.label,
                }),
                null,
                'danger',
                5000
              );
              this.errorOnLoadLayer = true;
            }
          });

          // check if display this layer on start of application
          if (configLayer.displayOnStartup) {
            this.map.addLayer(wmsLayer);
          }

          this.dispatchLayer(layers.length, ++index);
          break;

        case 'GEOJSON':
          // get layer
          const layerQueryParams: IMapServerRequest = {
            service: 'WFS',
            request: 'GetFeature',
            outputFormat: configLayer.outputFormat
              ? configLayer.outputFormat
              : 'geojson',
            version: '1.1.0',
            mapfile: configLayer.mapfile,
            typename: configLayer.name,
            url: configLayer?.url,
            srsName: 'EPSG:4326', //TODO different projections??
          };
          this.dispatchActionsHelperService.dispatchMapLoading(true);
          this.subscriptions.add(
            this.httpCallService.getFromMapServer(layerQueryParams).subscribe(
              (data: geojson.GeoJsonObject) => {
                const geojonLayer = L.geoJSON(data, {
                  pointToLayer: (feature, latlng) =>
                    configLayer.geojsonStyle
                      ? L.circleMarker(latlng, configLayer.geojsonStyle)
                      : new L.Marker(latlng),
                  style: configLayer.geojsonStyle,
                  onEachFeature: (feature, layer) => {
                    //edit
                    // console.log('oneachfeature');
                    //on right click show context menu
                    layer.on('contextmenu', (e) => {
                      if (configLayer?.contextMenu) {
                        const popup = L.popup({
                          autoClose: true,
                          className: 'contextMenu-wrapper',
                        })
                          .setLatLng(e['latlng'])
                          .setContent(
                            this.contextMenuService.bindPopup(
                              configLayer,
                              e['latlng'],
                              e.target.feature
                            )
                          )
                          .openOn(this.map);
                      }
                    });
                    if (configLayer.edit != null) {

                      //left click
                      layer.on('click', (e) => {
                        // console.log('oneachfeature click');
                        //STANDALONE EDIT MODE
                        //show part button and open snap
                        if (
                          this.mapEventsService.editingMode &&
                          this.mapEventsService.selectedLayerConfigToEdit ===
                          configLayer
                        ) {
                          this.mapEventsService.showPartButton(
                            configLayer.edit.geometryType
                          );
                          this.mapEventsService.openSnap(configLayer);
                          this.map.pm.enableGlobalEditMode();

                          //delete created new polygons
                          if (this.mapEventsService.layersEditModeCreate) {
                            this.mapEventsService.layersEditModeCreate.map(
                              (x) => {
                                this.map.removeLayer(x);
                              }
                            );
                            this.mapEventsService.layersEditModeCreate = [];
                          }
                          //delete parts
                          if (this.mapEventsService.layersEditModePart) {
                            this.mapEventsService.layersEditModePart.map(
                              (x) => {
                                this.map.removeLayer(x);
                              }
                            );
                            this.mapEventsService.layersEditModePart = [];
                          }
                          //set style selected
                          if (!!this.mapEventsService.previousEditedFeature) {
                            this.map.pm.disableGlobalEditMode();
                            // console.log('previous');
                            (
                              this.mapEventsService
                                .previousEditedFeature as L.GeoJSON
                            ).resetStyle();

                            (
                              this.mapEventsService
                                .previousEditedFeature as L.GeoJSON
                            ).setStyle(this.mapEventsService.previousStyle);
                            (
                              this.mapEventsService
                                .previousEditedFeature as L.GeoJSON
                            ).setStyle({
                              pmIgnore: true,
                            });
                            (
                              this.mapEventsService
                                .previousEditedFeature as L.GeoJSON
                            ).options.pmIgnore = true;
                            L.PM.reInitLayer(
                              this.mapEventsService.previousEditedFeature
                            );
                            // this.map.pm.disableGlobalEditMode();
                            // this.map.pm.enableGlobalEditMode();
                          }
                          //open next
                          this.mapEventsService.previousEditedFeature = layer;
                          this.mapEventsService.previousEditedLayer =
                            geojonLayer;
                          this.mapEventsService.previousStyle = (
                            geojonLayer as L.GeoJSON
                          ).options.style;
                          // console.log('open edit for feature');

                          this.mapEventsService.openEditModal(
                            feature,
                            configLayer,
                            this.map
                          );
                          this.mapEventsService.sendEditMessage();
                          (layer as L.GeoJSON).setStyle({
                            pmIgnore: false,
                            color: '#ff0',
                          });
                          (layer as L.GeoJSON).options.pmIgnore = false;
                          L.PM.reInitLayer(layer);
                          this.map.pm.enableGlobalEditMode();
                        }
                      });
                    }
                  },
                });

                this.layers.push({
                  layer: geojonLayer,
                  properties: { ...configLayer, layerId: ++customLayerId },
                  id: index,
                });

                this.createMenuLayersArray(
                  configLayer,
                  customLayerId,
                  'layers'
                );

                this.mapEventsService.onGeoJSONEdit(this.map, geojonLayer);

                // check if display this layer on start of application
                if (configLayer.displayOnStartup) {
                  this.map.addLayer(geojonLayer);
                }

                this.setOpacityView(configLayer);
                this.dispatchLayer(layers.length, ++index);

                if (index > this.lastIndex) {
                  this.lastIndex = index;
                }
                if (customLayerId > this.lastCustomLayerId) {
                  this.lastCustomLayerId = customLayerId;
                }
                this.checkViewGroup();
                this.dispatchActionsHelperService.dispatchMapLoading(false);
                // //check edit/create mode
                // if(configLayer.name === this.createModeLayer ) {
                //   this.checkCreateMode(this.map );
                //   this.checkEditMode(this.map);
                // }
              },
              (error) => {
                // console.log('error in geojson');
                this.dispatchActionsHelperService.dispatchMapLoading(false);
                this.layers.push({
                  // layer: {},
                  properties: { ...configLayer, layerId: ++customLayerId },
                  id: index,
                });

                this.createMenuLayersArray(
                  configLayer,
                  customLayerId,
                  'layers'
                );
                const foundid = this.layers.find(
                  (l) => l.properties.name === configLayer.name
                ).properties.layerId;
                const foundLayer = this.layers.find(
                  (x) => x.properties.layerId === foundid
                );
                foundLayer.properties = { ...configLayer };
                const typeGroupfound = this.menuLayersObject.layers.findIndex(
                  (t) => t.group === foundLayer.properties.menuLayers.typeGroup
                );
                this.menuLayersObject.layers[typeGroupfound].layers.find(
                  (ll) => ll.id === foundid
                ).hasError = true;
                foundLayer.properties.queryable = false;
                this.dispatchLayer(layers.length, ++index);

                this.toastService.showToast(
                  this.translationService.translate('ERRORS.MAP.LOAD_LAYER', {
                    layer: foundLayer.properties.label,
                  }),
                  null,
                  'danger',
                  5000
                );

                if (index > this.lastIndex) {
                  this.lastIndex = index;
                }
                if (customLayerId > this.lastCustomLayerId) {
                  this.lastCustomLayerId = customLayerId;
                }
              }
            )
          );
          break;
        case 'OGREGEOJSON':
          //this.addOgreGeojson(configLayer);
          const ogregeojonLayer = L.geoJSON(configLayer.ogreGeoJSON, {
            pointToLayer: (feature, latlng) =>
              L.circleMarker(latlng, configLayer.geojsonStyle),
            style: configLayer.geojsonStyle,
          });

          this.layers.push({
            layer: ogregeojonLayer,
            properties: { ...configLayer, layerId: ++customLayerId },
            id: index,
          });

          this.createMenuLayersArray(configLayer, customLayerId, 'layers');

          // geojonLayer.on('pm:edit', (e) => {
          //   console.log(e);
          // });

          // check if display this layer on start of application
          if (configLayer.displayOnStartup) {
            this.map.addLayer(ogregeojonLayer);
          }
          // this.setOpacityView(configLayer);
          this.dispatchLayer(layers.length, ++index);
          break;
        case 'VELOCITY':
          ++index;
          break;

        case 'ESRIRESTTILE':
          ++index;
          break;

        case 'GEOIMAGES':
          ++index;
          break;

        default:
          break;
      }

      this.setOpacityView(configLayer);
      //check edit/create mode
    });
    this.lastIndex = index;
    this.lastCustomLayerId = customLayerId;

    //load group checked if view
    this.checkViewGroup();
  }

  checkViewGroup() {
    if (this.isView) {
      this.configuration.layout.menuLayers.forEach((l) => {
        const menuLayer = this.menuLayersObject.layers.find(
          (x) => x.group === l.group
        );
        if (menuLayer) {
          menuLayer.checked = l?.checked;
          menuLayer.queryable = l?.queryable;
        }
      });
      this.dispatchActionsHelperService.dispatchMapMenuLayersObject(
        this.menuLayersObject
      );
    }
  }

  dispatchLayer(arrayLength: number, index: number) {
    if (arrayLength === index) {
      const reOrderedLayers = this.mapService.reorderLayersAccordingToConfig(
        this.layers
      );

      const newLayersArray = reOrderedLayers.map((x) => {
        const { properties, selected, id } = x;
        return { properties, selected, id };
      });

      this.dispatchActionsHelperService.dispatchLayers(newLayersArray);
      this.dispatchActionsHelperService.dispatchMapMenuLayersObject(
        this.menuLayersObject
      );
    }
  }

  setOpacityView(configLayer: IConfigurationLayer) {
    //set opacity
    if (this.isView) {
      const layerFound = this.layers.find(
        (x) => x.properties.name === configLayer.name
      );
      if (layerFound != null) {
        switch (configLayer.type.toUpperCase()) {
          case 'OSM':
            const osmLayer = layerFound.layer as L.TileLayer;

            osmLayer.setOpacity(configLayer.opacity);
            break;

          case 'BING':
            const bingLayer = layerFound.layer as L.TileLayer;

            bingLayer.setOpacity(configLayer.opacity);
            break;

          case 'WMS':
            const wmsLayer = layerFound.layer as L.TileLayer.WMS;

            wmsLayer.setOpacity(configLayer.opacity);
            break;

          case 'OGREGEOJSON':
          case 'GEOJSON':
            const geojsonLayer = layerFound.layer as L.GeoJSON;

            const ddd = geojsonLayer.getLayers();

            const sss = ddd[0];

            // ddd.forEach((x)=> {x['options'].opacity = configLayer.opacity;});
            geojsonLayer.setStyle({
              opacity: configLayer.opacity,
              fillOpacity:
                layerFound.properties?.geojsonStyle?.fillOpacity !== undefined
                  ? layerFound.properties?.geojsonStyle?.fillOpacity *
                  configLayer.opacity
                  : 0.2 * configLayer.opacity,
            });

            // wmsLayer.setOpacity(opacity);
            break;
          case 'ESRIMAP':
            const esrimapLayer = layerFound.layer as esri.DynamicMapLayer;
            esrimapLayer.setOpacity(configLayer.opacity);
            break;
          case 'ESRIFEATURE':
            const esrifeatureLayer = layerFound.layer as esri.FeatureLayer;
            esrifeatureLayer.setStyle({
              opacity: configLayer.opacity,
              fillOpacity:
                layerFound.properties?.geojsonStyle?.fillOpacity !== undefined
                  ? layerFound.properties?.geojsonStyle?.fillOpacity *
                  configLayer.opacity
                  : 0.2 * configLayer.opacity, // 0.2 is default fillopacity
            });
            break;
        }
      }
    }
  }

  createMenuLayersArray(
    configLayer: IConfigurationLayer,
    layerId: number,
    type: string
  ): void {
    if (
      this.menuLayersObject[type].some(
        (i: IMenuLayer) => i.group === configLayer.menuLayers.typeGroup
      )
    ) {
      const groupFound = this.menuLayersObject[type].filter(
        (x: IMenuLayer) => x.group === configLayer.menuLayers.typeGroup
      );
      groupFound[0].layers.push({
        id: layerId,
        image: configLayer.legendImage || configLayer.menuLayers.image,
        esriImage: configLayer.menuLayers?.esriImage,
        description: configLayer.label,
        groupName: configLayer.menuLayers.typeGroup,
        queryable: configLayer.queryable || false,
        checked: configLayer.displayOnStartup,
        selected: configLayer.displayOnStartup,
        exportable: configLayer.exportable,
        hasError: false,
      });
    } else {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      this.menuLayersObject[type].push({
        group: configLayer.menuLayers.typeGroup,
        queryable: false,
        collapse: false,
        layers: [
          {
            id: layerId,
            image: configLayer.legendImage || configLayer.menuLayers.image,
            esriImage: configLayer.menuLayers?.esriImage,
            description: configLayer.label,
            groupName: configLayer.menuLayers.typeGroup,
            queryable: configLayer.queryable || false,
            checked: configLayer.displayOnStartup,
            selected: configLayer.displayOnStartup,
            exportable: configLayer.exportable,
            hasError: false,
          },
        ],
      });
    }
  }

  // side menu basemaps methods
  basemapChanged(layerId: number): void {
    const basemapFound = this.layersArray.find(
      (x) => x.selected && x.properties.menuLayers.type === 'basemap'
    );

    this.map.removeLayer(basemapFound.layer);
    this.layersArray
      .filter((x) => x.properties.menuLayers.type === 'basemap')
      .forEach((el) => {
        el.selected = false;
      });

    const founded = this.layersArray.find(
      (x) => x.properties.layerId === layerId
    );

    founded.selected = true;
    const layer = founded.layer as L.TileLayer;
    this.map.addLayer(layer);
    layer.bringToBack();
  }

  ionViewWillLeave(): void {
    this.mapEventsService.unsubscribeSubjects();
    this.mapViewHistoryService.unsubscribeSubjects();
    this.subscriptions.unsubscribe();
  }

  loadViewMapConfig(event) {
    this.isView = true;
    this.map.eachLayer((mylayer) => {
      this.map.removeLayer(mylayer);
    });
    this.configuration = event;
    // this.initiateMap();
    this.layersArray = [];
    this.menuLayersObject.basemaps = [];
    this.menuLayersObject.layers = [];
    this.layers = [];
    this.initiateLayers();
  }

  addWMSlayer(myConfigWmsArray: IConfigurationLayer[]) {
    myConfigWmsArray.forEach((myConfigWms) => {
      if (myConfigWms.type === 'WMS') {
        const configwms = { ...myConfigWms };
        const layerExists = this.layers.find(
          (x) => x.properties.name === configwms.name
        );

        if (!layerExists) {
          const legendImage = this.mapService.createLegendImage(
            configwms.url,
            configwms.name
          );
          configwms.menuLayers = {
            ...configwms.menuLayers,
            image: legendImage,
          };
        }
        // const mapServerUrl = `${this.configuration.map.mapServerExeUrl}`;
        const mapServerUrl =
          window.location.protocol +
          '//' +
          this.configuration.map.mapserver +
          '/' +
          this.configuration.map.mapservexe;
        // const mapServerRequestBaseUrl = configwms.mapfile
        //   ? `${mapServerUrl}?map=${configwms.mapfile}`
        //   : configwms.url;
        let mapServerRequestBaseUrl: string;
        if (configwms.mapfile) {
          if (this.configuration.map.useWrappedMS) {
            mapServerRequestBaseUrl =
              mapServerUrl +
              '/' +
              configwms.mapfile
                .split('\\')
              [configwms.mapfile.split('\\').length - 1].split('.')[0];
          } else {
            mapServerRequestBaseUrl = `${mapServerUrl}?map=${configwms.mapfile}`;
          }
        } else {
          mapServerRequestBaseUrl = configwms.url;
        }

        const wmsLayer = L.tileLayer.wms(mapServerRequestBaseUrl, {
          layers: configwms.name,
          format: 'image/png',
          transparent: true,
          crs: L.CRS.EPSG4326,
          maxNativeZoom: 19, // Tilelayer max available zoom is at 19.
          maxZoom: 22, // Match the map maxZoom, or leave map.options.maxZoom undefined.
        });
        //if layer exists replace

        if (layerExists) {
          const foundILayer = this.layers.find(
            (x) => x.properties.name === configwms.name
          );
          foundILayer.layer = wmsLayer;
          foundILayer.properties.type = configwms.type;
        } else {
          this.layers.push({
            layer: wmsLayer,
            properties: { ...configwms, layerId: ++this.lastCustomLayerId },
            selected: configwms.displayOnStartup,
            id: this.lastIndex,
          });
          this.createMenuLayersArray(
            configwms,
            this.lastCustomLayerId,
            configwms.menuLayers.type === 'basemap' ? 'basemaps' : 'layers'
          );
        }
        wmsLayer.on('loading', (wmsloading) => {
          this.dispatchActionsHelperService.dispatchMapLoading(true);
        });
        wmsLayer.on('load', (wmsloading) => {
          this.dispatchActionsHelperService.dispatchMapLoading(false);
        });
        wmsLayer.on('tileerror', (error) => {
          this.dispatchActionsHelperService.dispatchMapLoading(false);
          if (!this.errorOnLoadLayer) {
            const findLayer = this.layers.find((x) => x.layer === error.target);

            const menuLayerType =
              findLayer.properties.menuLayers.type === 'basemap'
                ? 'basemaps'
                : 'layers';

            const menuLayerGroupName =
              findLayer.properties.menuLayers.typeGroup;

            const menuLayerData = this.menuLayersObject[menuLayerType].find(
              (x) => x.group === menuLayerGroupName
            );
            const menuLayer = menuLayerData.layers.find(
              (y) => y.id === findLayer.properties.layerId
            );

            menuLayer.hasError = true;
            findLayer.properties.queryable = false;
            this.toastService.showToast(
              this.translationService.translate('ERRORS.MAP.LOAD_LAYER', {
                layer: findLayer.properties.label,
              }),
              null,
              'danger',
              5000
            );
            this.errorOnLoadLayer = true;

            this.dispatchLayer(this.lastIndex, this.lastIndex);
          }
        });

        // check if display this layer on start of application
        if ((configwms.displayOnStartup && !layerExists) || layerExists) {
          this.map.addLayer(wmsLayer);
          // this.printMap.addLayer(wmsLayer);
        }
        if (!layerExists) {
          this.lastIndex = this.lastIndex + 1;
        }
        this.dispatchLayer(this.lastIndex, this.lastIndex);
      } else if (myConfigWms.type.toLowerCase() === 'geojson') {
        const configwms = { ...myConfigWms };
        const layerExists = this.layers.find(
          (x) => x.properties.name === configwms.name
        );

        if (!!layerExists) {
          const legendImage = this.mapService.createLegendImage(
            configwms.url,
            configwms.name
          );
          configwms.menuLayers = {
            ...configwms.menuLayers,
            image: legendImage,
          };
        }
        const layerQueryParams: IMapServerRequest = {
          service: 'WFS',
          request: 'GetFeature',
          outputFormat: configwms.outputFormat
            ? configwms.outputFormat
            : 'geojson',
          version: '1.1.0',
          mapfile: configwms.mapfile,
          typename: configwms.name,
          url: configwms?.url,
          srsName: 'EPSG:4326', //TODO different projections??
        };
        this.dispatchActionsHelperService.dispatchMapLoading(true);
        this.subscriptions.add(
          this.httpCallService.getFromMapServer(layerQueryParams).subscribe(
            (data: geojson.GeoJsonObject) => {
              const geojonLayer = L.geoJSON(data, {
                pointToLayer: (feature, latlng) =>
                  configwms.geojsonStyle
                    ? L.circleMarker(latlng, configwms.geojsonStyle)
                    : new L.Marker(latlng),
                style: configwms.geojsonStyle,
                onEachFeature: (feature, layer) => {
                  //edit
                  // console.log('oneachfeature x');
                  if (configwms.edit != null) {
                    layer.on('click', (e) => {
                      //STANDALONE EDIT MODE
                      // console.log('oneachfeature click x');
                      //close previous
                      if (
                        this.mapEventsService.editingMode &&
                        this.mapEventsService.selectedLayerConfigToEdit
                          ?.name === configwms.name
                      ) {
                        this.mapEventsService.showPartButton(
                          configwms.edit.geometryType
                        );
                        this.mapEventsService.drawButtonPushed = false;
                        this.mapEventsService.addPartButtonPushed = true;
                        this.mapEventsService.openSnap(configwms);
                        this.map.pm.enableGlobalEditMode();
                        //delete created new polygons
                        if (this.mapEventsService.layersEditModeCreate) {
                          this.mapEventsService.layersEditModeCreate.map(
                            (x) => {
                              this.map.removeLayer(x);
                            }
                          );
                          this.mapEventsService.layersEditModeCreate = [];
                        }
                        //delete parts
                        if (this.mapEventsService.layersEditModePart) {
                          this.mapEventsService.layersEditModePart.map((x) => {
                            this.map.removeLayer(x);
                          });
                          this.mapEventsService.layersEditModePart = [];
                        }
                        //set style
                        if (!!this.mapEventsService.previousEditedFeature) {
                          this.map.pm.disableGlobalEditMode();
                          // console.log('previous');
                          // (this.mapEventsService
                          //   .previousEditedFeature as L.GeoJSON).resetStyle();

                          try {
                            (
                              this.mapEventsService
                                .previousEditedFeature as L.GeoJSON
                            ).setStyle(this.mapEventsService.previousStyle);
                            (
                              this.mapEventsService
                                .previousEditedFeature as L.GeoJSON
                            ).setStyle({
                              pmIgnore: true,
                            });
                          } catch (err) {
                            console.error(
                              'Only geojson can change style.(Not Markers)'
                            );
                          }
                          (
                            this.mapEventsService
                              .previousEditedFeature as L.GeoJSON
                          ).options.pmIgnore = true;
                          L.PM.reInitLayer(
                            this.mapEventsService.previousEditedFeature
                          );
                          // this.map.pm.disableGlobalEditMode();
                          // this.map.pm.enableGlobalEditMode();
                        }
                        //open next
                        this.mapEventsService.previousEditedFeature = layer;
                        this.mapEventsService.previousEditedLayer = geojonLayer;

                        this.mapEventsService.previousStyle = (
                          geojonLayer as L.GeoJSON
                        ).options.style;
                        // console.log('open edit for feature');

                        this.mapEventsService.openEditModal(
                          feature,
                          configwms,
                          this.map
                        );
                        this.mapEventsService.sendEditMessage();
                        //doesn't work in markers
                        try {
                          (layer as L.GeoJSON).setStyle({
                            pmIgnore: false,
                            color: '#ff0',
                          });
                        } catch (err) {
                          console.error(
                            'Only geojson can change style.(Not Markers)'
                          );
                        }
                        (layer as L.GeoJSON).options.pmIgnore = false;
                        L.PM.reInitLayer(layer);
                        this.map.pm.enableGlobalEditMode();
                      }
                    });
                  }
                },
              });

              if (layerExists) {
                const foundILayer = this.layers.find(
                  (x) => x.properties.name === configwms.name
                );
                foundILayer.layer = geojonLayer;
                foundILayer.properties.type = configwms.type;
              } else {
                this.layers.push({
                  layer: geojonLayer,
                  properties: {
                    ...configwms,
                    layerId: ++this.lastCustomLayerId,
                  },
                  id: this.lastIndex,
                });

                this.createMenuLayersArray(
                  configwms,
                  this.lastCustomLayerId,
                  'layers'
                );
              }
              // geojonLayer.on('pm:edit', (e) => {
              //   console.log(e);
              // });
              this.mapEventsService.onGeoJSONEdit(this.map, geojonLayer);
              // check if display this layer on start of application
              if ((configwms.displayOnStartup && !layerExists) || layerExists) {
                this.map.addLayer(geojonLayer);
              }

              if (!layerExists) {
                this.lastIndex = this.lastIndex + 1;
              }
              this.dispatchLayer(this.lastIndex, this.lastIndex);

              // //check edit/create mode
              // if(configwms.name === this.createModeLayer ) {
              //   this.checkCreateMode(this.map );
              //   this.checkEditMode(this.map);
              // }
              this.dispatchActionsHelperService.dispatchMapLoading(false);
            },
            (error) => {
              // console.log('error in geojson');
              this.dispatchActionsHelperService.dispatchMapLoading(false);
              this.layers.push({
                // layer: {},
                properties: { ...configwms, layerId: ++this.lastCustomLayerId },
                id: this.lastIndex,
              });

              this.createMenuLayersArray(
                configwms,
                this.lastCustomLayerId,
                'layers'
              );
              const foundid = this.layers.find(
                (l) => l.properties.name === configwms.name
              ).properties.layerId;
              const foundLayer = this.layers.find(
                (x) => x.properties.layerId === foundid
              );
              foundLayer.properties = { ...configwms };
              const typeGroupfound = this.menuLayersObject.layers.findIndex(
                (t) => t.group === foundLayer.properties.menuLayers.typeGroup
              );
              this.menuLayersObject.layers[typeGroupfound].layers.find(
                (ll) => ll.id === foundid
              ).hasError = true;
              foundLayer.properties.queryable = false;
              this.lastIndex = this.lastIndex + 1;
              this.dispatchLayer(this.lastIndex, this.lastIndex);

              this.toastService.showToast(
                this.translationService.translate('ERRORS.MAP.LOAD_LAYER', {
                  layer: foundLayer.properties.label,
                }),
                null,
                'danger',
                5000
              );
            }
          )
        );
      } else if (myConfigWms.type === 'ESRIMAP') {
        this.createEsriLegend(myConfigWms.url, myConfigWms);
        const esrimapLayer = esri.dynamicMapLayer({
          url: myConfigWms.url,
          useCors: false,
          layers: myConfigWms?.esriLayersID,
          pane: 'tilePane',
        });

        this.layers.push({
          layer: esrimapLayer,
          properties: { ...myConfigWms, layerId: ++this.lastCustomLayerId },
          selected: myConfigWms.displayOnStartup,
          id: this.lastIndex,
        });

        this.createMenuLayersArray(
          myConfigWms,
          this.lastCustomLayerId,
          myConfigWms.menuLayers.type === 'basemap' ? 'basemaps' : 'layers'
        );

        this.map.addLayer(esrimapLayer);
        this.lastIndex = this.lastIndex + 1;
        this.checkEsriError(esrimapLayer, myConfigWms);
        this.dispatchLayer(this.lastIndex, this.lastIndex);
      } else if (myConfigWms.type === 'ESRIFEATURE') {
        this.createEsriLegend(myConfigWms.url, myConfigWms);
        const esrimapLayer = esri.featureLayer({
          url: myConfigWms.url + '/' + myConfigWms.esriLayersID[0],
          useCors: false,
          pointToLayer: (feature, latlng) =>
            myConfigWms.geojsonStyle
              ? L.circleMarker(latlng, myConfigWms.geojsonStyle)
              : new L.Marker(latlng),
        });

        this.layers.push({
          layer: esrimapLayer,
          properties: { ...myConfigWms, layerId: ++this.lastCustomLayerId },
          selected: myConfigWms.displayOnStartup,
          id: this.lastIndex,
        });

        this.createMenuLayersArray(
          myConfigWms,
          this.lastCustomLayerId,
          myConfigWms.menuLayers.type === 'basemap' ? 'basemaps' : 'layers'
        );
        this.lastIndex = this.lastIndex + 1;
        this.map.addLayer(esrimapLayer);
        this.checkEsriError(esrimapLayer, myConfigWms);
        this.dispatchLayer(this.lastIndex, this.lastIndex);
      } else if (myConfigWms.type === 'OgreGeoJSON') {
        this.addOgreGeojson(myConfigWms);
      }
    });
  }

  addOgreGeojson(config: IConfigurationLayer) {
    const geojonLayer = L.geoJSON(config.ogreGeoJSON, {
      pointToLayer: (feature, latlng) =>
        L.circleMarker(latlng, config.geojsonStyle),
      style: config.geojsonStyle,
    });
    this.layers.push({
      layer: geojonLayer,
      properties: { ...config, layerId: ++this.lastCustomLayerId },
      id: this.lastIndex,
    });

    this.createMenuLayersArray(config, this.lastCustomLayerId, 'layers');

    // geojonLayer.on('pm:edit', (e) => {
    //   console.log(e);
    // });

    // check if display this layer on start of application
    if (config.displayOnStartup) {
      this.map.addLayer(geojonLayer);
    }

    this.lastIndex = this.lastIndex + 1;
    this.dispatchLayer(this.lastIndex, this.lastIndex);
  }

  createEsriLegend(
    mapServerRequestBaseUrl: string,
    configLayer: IConfigurationLayer
  ) {
    const legendImage: IEsriImage[] = [];
    this.subscriptions.add(
      this.httpCallService
        .createLegendImageESRI(
          mapServerRequestBaseUrl,
          configLayer?.esriLayersID,
          configLayer.type
        )
        .pipe(filter((data) => data != null))
        .subscribe(
          (data: { layers }) => {
            data?.layers?.forEach((element) => {
              if (configLayer.esriLayersID) {
                if (
                  Array.isArray(configLayer.esriLayersID) &&
                  configLayer.esriLayersID.includes(element.layerId)
                ) {
                  data.layers[element.layerId].legend?.forEach((imgclass) => {
                    legendImage.push({
                      url:
                        mapServerRequestBaseUrl +
                        '/' +
                        element.layerId +
                        '/images/' +
                        imgclass.url,
                      layerName: element.layerName,
                      label: imgclass.label,
                    });
                  });
                }
              } else {
                data.layers[element.layerId].legend?.forEach((imgclass) => {
                  legendImage.push({
                    url:
                      mapServerRequestBaseUrl +
                      '/' +
                      element.layerId +
                      '/images/' +
                      imgclass.url,
                    layerName: element.layerName,
                    label: imgclass.label,
                  });
                });
              }
            });

            const newLayersArray: ILayer[] = lodash.cloneDeep(this.layers);
            const foundid = newLayersArray.find(
              (l) => l.properties.name === configLayer.name
            ).properties.layerId;
            const foundLayer = newLayersArray.find(
              (x) => x.properties.layerId === foundid
            );
            foundLayer.properties.menuLayers = {
              ...foundLayer.properties.menuLayers,
              esriImage: legendImage,
            };
            const typeGroupfound = this.menuLayersObject.layers.findIndex(
              (t) => t.group === foundLayer.properties.menuLayers.typeGroup
            );
            this.menuLayersObject.layers[typeGroupfound].layers.find(
              (ll) => ll.id === foundid
            ).esriImage = legendImage;
            // this.dispatchLayer(layers.length, layers.length);
            this.dispatchActionsHelperService.dispatchLayers(newLayersArray);
            this.dispatchActionsHelperService.dispatchMapMenuLayersObject(
              this.menuLayersObject
            );
          },
          (error) => {
            // console.log('error');
          }
        )
    );
  }

  checkEsriError(
    esriLayer: esri.FeatureLayer | esri.DynamicMapLayer | esri.TiledMapLayer,
    configLayer: IConfigurationLayer
  ) {
    esriLayer.metadata((err, response) => {
      if (err) {
        const foundid = this.layers.find(
          (l) => l.properties.name === configLayer.name
        ).properties.layerId;
        const foundLayer = this.layers.find(
          (x) => x.properties.layerId === foundid
        );
        foundLayer.properties = { ...configLayer };
        const typeGroupfound = this.menuLayersObject.layers.findIndex(
          (t) => t.group === foundLayer.properties.menuLayers.typeGroup
        );
        const menuLayer = this.menuLayersObject.layers[
          typeGroupfound
        ].layers.find((ll) => ll.id === foundid);
        foundLayer.properties.queryable = false;
        if (menuLayer) {
          menuLayer.hasError = true;
        }

        this.dispatchLayer(this.lastIndex, this.lastIndex);
        this.toastService.showToast(
          this.translationService.translate('ERRORS.MAP.LOAD_LAYER', {
            layer: foundLayer.properties.label,
          }),
          null,
          'danger',
          5000
        );
      }
    });
  }

  openHelpWindow() {
    if (this.configuration.general?.helpUrl) {
      window.open(this.configuration.general.helpUrl, '_blank');
    }
  }
}
