/* eslint-disable @typescript-eslint/naming-convention */
/* eslint-disable @typescript-eslint/dot-notation */
import { HostListener, Injectable } from '@angular/core';
import { ModalController, PopoverController } from '@ionic/angular';
import * as turf from '@turf/turf';
import L, {
  FeatureGroup,
  LatLng,
  LatLngBoundsExpression,
  LatLngExpression,
  Map,
} from 'leaflet';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { ILayer } from 'src/app/core/models/layer.model';
import { EditLayerComponent } from '../core/components/edit-layer/edit-layer.component';
import { SelectEditLayerComponent } from '../core/components/select-edit-layer/select-edit-layer.component';
import {
  IConfiguration,
  IConfigurationLayer,
} from '../core/interfaces/configuration.interface';
import { DispatchActionsHelperService } from './dispatch-actions-helper.service';
import { MapViewHistoryService } from './map-view-history.service';
import { MapService } from './map.service';
import { ToastService } from './toast.service';
import { TranslationService } from './translation.service';
import * as geojson from 'geojson';
@Injectable({
  providedIn: 'root',
})
export class MapEventsService {
  public editingMode = false; //ONLY STANDALONE MODE
  public previousEditedFeature;
  public previousEditedLayer;
  public previousStyle;
  public lastGeometryChanged;

  public selectedLayerConfigToEdit: IConfigurationLayer; //NOT iframe, only standalone mode
  public drawButtonPushed;
  public addPartButtonPushed;
  public iframeLayerConfigToEdit: IConfigurationLayer; //ONLY IFRAME
  public iframeModeOn = false;
  public iframeCreate = false;
  public iframeEdit = false;

  public innerPolygon: L.Polygon;
  public circleMarker: L.CircleMarker;

  public layersEditModeCreate: L.Layer[] = [];
  public layersEditModePart: L.Layer[] = [];

  public $map = new Subject<L.Map>();

  public configuration;

  private mouseCoordinates: { x: number; y: number } = { x: null, y: null };

  private layersDrawned: L.Layer[] = [];

  private popups: L.Popup[] = [];
  private mapTooltip = new L.Tooltip();
  private layersArray: ILayer[] = [];
  private disableHistoryFlag = false;

  private selectedLayerCallback;
  // private subjects



  private $createdLayerLatLng = new Subject<L.LatLng>();
  private $createdLayer = new Subject<{ layer: L.Layer; popup: L.Popup }>();
  private $mouseCoordinates = new BehaviorSubject(this.mouseCoordinates);

  constructor(
    private mapService: MapService,
    private mapViewHistoryService: MapViewHistoryService,
    private translationSevice: TranslationService,
    private dispatchActionsHelperService: DispatchActionsHelperService,
    public popoverController: PopoverController,
    public toastService: ToastService,
    public translationService: TranslationService
  ) { }

  public initialize() {
    this.configuration = this.mapService.getConfiguration();
  }

  initiateControlsPerGeometry(
    map: L.Map,
    geometryType: string,
    editModeFoundFeature: boolean = true
  ) {
    // map.pm.Toolbar.setButtonDisabled('AddPart'+geoType, true);
    const openDraw =
      this.selectedLayerConfigToEdit ||
      this.iframeCreate ||
      !editModeFoundFeature ||
      this.iframeLayerConfigToEdit?.edit?.multi;
    map.pm.addControls({
      position: 'topright',
      oneBlock: false,
      drawMarker:
        openDraw && geometryType.toLocaleLowerCase() === 'marker'
          ? true
          : false,
      drawPolyline:
        openDraw && geometryType.toLocaleLowerCase() === 'line' ? true : false,
      drawRectangle: false,
      drawCircleMarker:
        openDraw && geometryType.toLocaleLowerCase() === 'point' ? true : false,
      drawCircle: false,
      dragMode: false,
      removalMode: true,
      rotateMode: false,
      cutPolygon:
        geometryType.toLocaleLowerCase() === 'polygon' &&
          (this.selectedLayerConfigToEdit?.edit?.multi ||
            this.iframeLayerConfigToEdit?.edit?.multi)
          ? true
          : false,
      drawPolygon:
        openDraw && geometryType.toLocaleLowerCase() === 'polygon'
          ? true
          : false,
      customControls:
        this.selectedLayerConfigToEdit &&
          this.selectedLayerConfigToEdit.edit.multi
          ? true
          : false,
    });

    if (
      this.selectedLayerConfigToEdit != null &&
      this.selectedLayerConfigToEdit.edit.multi
    ) {
      const parentElement =
        document.getElementsByClassName('leaflet-pm-custom');
      (parentElement[0].children[0] as HTMLElement).style.display = 'none';
      (parentElement[0].children[1] as HTMLElement).style.display = 'none';
      (parentElement[0].children[2] as HTMLElement).style.display = 'none';
      (parentElement[0].children[3] as HTMLElement).style.display = 'none';
      (parentElement[0].children[4] as HTMLElement).style.display = 'none';
      (parentElement[0].children[5] as HTMLElement).style.display = 'none';
    }
  }

  showPartButton(geometryType: string) {
    if (
      this.selectedLayerConfigToEdit &&
      this.selectedLayerConfigToEdit.edit.multi
    ) {
      let geoType;
      if (geometryType.toLocaleLowerCase() === 'line') {
        geoType = 'Line';
      } else if (geometryType.toLocaleLowerCase() === 'polygon') {
        geoType = 'Polygon';
      } else if (geometryType.toLocaleLowerCase() === 'point') {
        geoType = 'CircleMarker';
      } else if (geometryType.toLocaleLowerCase() === 'marker') {
        geoType = 'Marker';
      }

      const parentElement =
        document.getElementsByClassName('leaflet-pm-custom');
      if (geoType.toLowerCase() === 'line') {
        (parentElement[0].children[0] as HTMLElement).style.display = 'none';
        (parentElement[0].children[1] as HTMLElement).style.display = 'block';
        (parentElement[0].children[2] as HTMLElement).style.display = 'none';
        (parentElement[0].children[3] as HTMLElement).style.display = 'none';
      }
      if (geoType.toLowerCase() === 'polygon') {
        (parentElement[0].children[0] as HTMLElement).style.display = 'block';
        (parentElement[0].children[1] as HTMLElement).style.display = 'none';
        (parentElement[0].children[2] as HTMLElement).style.display = 'none';
        (parentElement[0].children[3] as HTMLElement).style.display = 'none';
      }
      if (geoType.toLowerCase() === 'circlemarker') {
        (parentElement[0].children[0] as HTMLElement).style.display = 'none';
        (parentElement[0].children[1] as HTMLElement).style.display = 'none';
        (parentElement[0].children[2] as HTMLElement).style.display = 'block';
        (parentElement[0].children[3] as HTMLElement).style.display = 'none';
      }
      if (geoType.toLowerCase() === 'marker') {
        (parentElement[0].children[0] as HTMLElement).style.display = 'none';
        (parentElement[0].children[1] as HTMLElement).style.display = 'none';
        (parentElement[0].children[2] as HTMLElement).style.display = 'none';
        (parentElement[0].children[3] as HTMLElement).style.display = 'block';
      }
    }
  }

  hidePartButton() {
    if (
      this.selectedLayerConfigToEdit &&
      this.selectedLayerConfigToEdit.edit?.multi
    ) {
      const parentElement =
        document.getElementsByClassName('leaflet-pm-custom');
      (parentElement[0].children[0] as HTMLElement).style.display = 'none';
      (parentElement[0].children[1] as HTMLElement).style.display = 'none';
      (parentElement[0].children[2] as HTMLElement).style.display = 'none';
      (parentElement[0].children[3] as HTMLElement).style.display = 'none';
    }
  }

  openSnap(configLayer: IConfigurationLayer) {
    // this.map.eachLayer((layer) => {});
    const layerForSnap = this.mapService
      .getLayersArray()
      .find((x) => x.properties.name === configLayer.name);
    configLayer = layerForSnap.properties;

    this.configuration.layers.forEach((l) => {
      //open snap
      if (configLayer.name === l.name) {
        if (configLayer.type.toUpperCase() === 'GEOJSON') {
          configLayer?.edit.snappingLayers.forEach((snappingLayer: string) => {
            //find layer and open snapIgnore
            const layerFound = this.mapService
              .getLayersArray()
              .find((x) => x.properties.name === snappingLayer);
            const geojsonLayer = layerFound.layer as L.GeoJSON;
            geojsonLayer.eachLayer((featLayer) => {
              (featLayer as L.GeoJSON).options.snapIgnore = false;
              L.PM.reInitLayer(featLayer);
            });
          });
        }
      } //close snap
      else {
        if (l.type.toUpperCase() === 'GEOJSON') {
          //find layer and open snapIgnore
          const layerFound = this.mapService
            .getLayersArray()
            .find((x) => x.properties.name === l.name);
          if (layerFound) {
            const geojsonLayer = layerFound.layer as L.GeoJSON;
            geojsonLayer.eachLayer((featLayer) => {
              (featLayer as L.GeoJSON).options.snapIgnore = true;
              L.PM.reInitLayer(featLayer);
            });
          }
        }
      }
    });
  }

  createLayerFeatureMode(map: L.Map, layerName: string) {
    const configLayer = this.configuration.layers.find(
      (l) => l.name === layerName
    );
    this.iframeLayerConfigToEdit = configLayer;
    this.drawButtonPushed = true;
    this.addPartButtonPushed = false;

    const tooltipsOn = this.configuration.layout?.tooltips ? this.configuration.layout?.tooltips : false;
    if (!!configLayer) {
      this.openSnap(configLayer);
      if (configLayer.edit.geometryType.toLowerCase() === 'polygon') {
        map.pm.enableDraw('Polygon', { snappable: true, tooltips: tooltipsOn, snapDistance: 20 });
      } else if (configLayer.edit.geometryType.toLowerCase() === 'line') {
        map.pm.enableDraw('Line', { snappable: true, tooltips: tooltipsOn, snapDistance: 20 });
      } else if (configLayer.edit.geometryType.toLowerCase() === 'point') {
        map.pm.enableDraw('CircleMarker', {
          snappable: true,
          tooltips: tooltipsOn,
          snapDistance: 20,
        });
      } else if (configLayer.edit.geometryType.toLowerCase() === 'marker') {
        map.pm.enableDraw('Marker', { snappable: true, tooltips: tooltipsOn, snapDistance: 20 });
      }
      this.onPolygonCreate(map);
      // map.pm.toggleControls();
      this.initiateControlsPerGeometry(map, configLayer.edit.geometryType);
    }
  }

  editLayerFeatureMode(map: L.Map, layerName: string, featureId: number) {
    // this.onPolygonCreate(map);
    this.drawButtonPushed = false;
    this.addPartButtonPushed = true;
    const configLayer: IConfigurationLayer = this.configuration.layers.find(
      (l) => l.name === layerName
    );
    this.iframeLayerConfigToEdit = configLayer;
    if (!!configLayer) {
      this.openSnap(configLayer);
      map.pm.enableGlobalEditMode();
      this.onPolygonCreate(map);
      // map.pm.toggleControls();

      const foundLayerId = this.mapService
        .getLayersArray()
        .find((x) => x.properties.name === layerName)?.properties.layerId;
      const layer = this.mapService
        .getLayersArray()
        .find((x) => x.properties.layerId === foundLayerId)?.layer;

      let foundAFeature = false;
      (layer as L.GeoJSON).eachLayer((feat) => {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        const primaryKey = configLayer.edit.primaryKey
          ? configLayer.edit.primaryKey
          : 'id';
        // eslint-disable-next-line @typescript-eslint/dot-notation
        if (feat['feature'].properties[primaryKey] === featureId) {
          foundAFeature = true;
          try {
            (feat as L.GeoJSON).setStyle({ pmIgnore: false });
          } catch (err) {
            console.error('Only geojson can change style.(Not Markers)');
          }
          if (!feat.hasOwnProperty('_layers')) {
            (feat as L.GeoJSON).options.pmIgnore = false;
          } else {
            //added this for multipoint markers only. MUST WORK FOR ALL MULTI GEoMETRY LAYERS
            // eslint-disable-next-line prefer-const
            for (let key of Object.keys(feat['_layers'])) {
              (feat['_layers'][key] as L.GeoJSON).options.pmIgnore = false;
            }
          }

          //selects edited feature
          this.previousEditedFeature = feat;

          L.PM.reInitLayer(feat);
          map.pm.enableGlobalEditMode();
          if (configLayer.edit.geometryType.toLowerCase() === 'polygon') {
            map.flyToBounds((feat as L.Polygon).getBounds());
          } else if (configLayer.edit.geometryType.toLowerCase() === 'line') {
            map.flyToBounds((feat as L.Polyline).getBounds(), {
              maxZoom: this.configuration.general.xyZoomLevel ?? 13,
            });
          } else if (
            configLayer.edit.geometryType.toLowerCase() === 'point' ||
            configLayer.edit.geometryType.toLowerCase() === 'marker'
          ) {
            try {
              //if is multipoint
              if (feat.hasOwnProperty('_layers')) {
                map.flyToBounds(
                  (feat as L.FeatureGroup<L.CircleMarker>).getBounds(),
                  { maxZoom: this.configuration.general.xyZoomLevel ?? 13 }
                );
              } //if is point
              else {
                map.flyToBounds(
                  (feat as L.CircleMarker).getLatLng().toBounds(1000),
                  { maxZoom: this.configuration.general.xyZoomLevel ?? 13 }
                );
              }
            } catch { }
          }
        }
      });
      this.initiateControlsPerGeometry(
        map,
        configLayer.edit.geometryType,
        foundAFeature
      );
    }
  }

  // getters
  getMap(): Subject<L.Map> {
    return this.$map;
  }

  addMapEvents(map: L.Map): void {
    this.$map.next(map);
    // this.onDefaultDoubleClickEvent(map);
    this.defaultMouseMoveEvent(map);

    map.on('mouseout', () => {
      this.mouseCoordinates = { x: null, y: null };
      this.$mouseCoordinates.next(this.mouseCoordinates);
    });

    // event for history view buttons
    map.on('moveend', () => {
      this.disableHistoryFlag = false;
      // handle history
      this.mapViewHistoryService.handleHistory(map, this.mouseCoordinates.x);
    });

    // event for history view buttons
    map.on('move', () => {
      if (!this.disableHistoryFlag) {
        this.dispatchActionsHelperService.dispatchSubheaderDisableHistory({
          next: true,
          previous: true,
        });
        this.disableHistoryFlag = true;
      }
    });

    // event for history view buttons
    map.on('zoomstart', () => {
      if (!this.disableHistoryFlag) {
        this.dispatchActionsHelperService.dispatchSubheaderDisableHistory({
          next: true,
          previous: true,
        });
      }
      this.disableHistoryFlag = true;
    });
  }

  defaultMouseMoveEvent(map: L.Map): void {
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const convertedCoords = this.mapService.convertCoordinates(
        null,
        this.configuration.map.defaultProjectionCode,
        [e.latlng.lng, e.latlng.lat] as proj4.TemplateCoordinates
      );
      this.mouseCoordinates = { x: convertedCoords[0], y: convertedCoords[1] };
      this.$mouseCoordinates.next(this.mouseCoordinates);
    });
  }

  defaultClickEvent(map: L.Map, searchedLayers: L.GeoJSON) {
    map.on('click', () => {
      searchedLayers?.clearLayers();
    });
  }

  onZoomStartEvent(map: L.Map, scaleControl: L.Control) {
    map.on('zoomend', () => {
      const scaleArray = scaleControl.getContainer().innerText.split('\n');
      const scale = {
        kilometers: scaleArray[0],
        miles: scaleArray[1],
      };
      this.dispatchActionsHelperService.dispatchControlScale(scale);
    });
  }

  onToolbarButton(map: L.Map) {
    map.off('pm:buttonclick');
    map.on('pm:buttonclick', (e) => {
      if (this.iframeLayerConfigToEdit) {
        this.openSnap(this.iframeLayerConfigToEdit);
      } else if (this.selectedLayerConfigToEdit) {
        this.openSnap(this.selectedLayerConfigToEdit);
      }

      map.off('pm:drawstart');
      map.off('pm:drawend');
      this.dispatchActionsHelperService.dispatchMeasureLinePolygon(false);
      this.offAddMarkerFromTools(map);
      this.dispatchActionsHelperService.dispatchRectangleSearchClicked(false);
      this.offRectangeSearch(map);
      this.dispatchActionsHelperService.dispatchPointSearchClicked(false);
      this.offSearchPointClickEvent(map, null);
      // this.addPartOn = false; //closes add part flag
      this.defaultMouseMoveEvent(map);

      if (this.innerPolygon) {
        map.removeLayer(this.innerPolygon);
        this.innerPolygon = null;
      }
      if (this.circleMarker) {
        map.removeLayer(this.circleMarker);
      }

      this.popups.map((x) => {
        map.removeLayer(x);
      });

      this.layersDrawned.map((x) => {
        map.removeLayer(x);
      });

      this.onPolygonCreate(map);

      if (
        (this.iframeLayerConfigToEdit &&
          !this.iframeLayerConfigToEdit.edit?.multi &&
          e.btnName.startsWith('draw')) ||
        (this.selectedLayerConfigToEdit &&
          !this.selectedLayerConfigToEdit.edit?.multi &&
          e.btnName.startsWith('draw'))
      ) {
        //delete create polygons
        if (this.layersEditModeCreate) {
          this.layersEditModeCreate.map((x) => {
            map.removeLayer(x);
          });
          this.layersEditModeCreate = [];
        }
      }

      if (this.selectedLayerConfigToEdit) {
        //if create polygon
        if (e.btnName.startsWith('draw')) {
          //createMode
          this.drawButtonPushed = true;
          this.addPartButtonPushed = false;
          //if is standalone mode
          if (this.selectedLayerConfigToEdit) {
            //delete add part polygons
            if (this.layersEditModePart) {
              this.layersEditModePart.map((x) => {
                map.removeLayer(x);
              });
              this.layersEditModePart = [];
            }

            //delete create polygons
            if (
              this.selectedLayerConfigToEdit.edit.multi &&
              this.layersEditModeCreate
            ) {
              this.layersEditModeCreate.map((x) => {
                map.removeLayer(x);
              });
              this.layersEditModeCreate = [];
            }
          }
          //remove selected polygon because it doesn't know if you edit selected or new polygon
          if (this.previousEditedFeature) {
            try {
              (this.previousEditedFeature as L.GeoJSON).setStyle(
                this.previousStyle
              );
              (this.previousEditedFeature as L.GeoJSON).setStyle({
                pmIgnore: true,
              });
            } catch (err) {
              console.error('Only geojson can change style.(Not Markers)');
            }
            (this.previousEditedFeature as L.GeoJSON).options.pmIgnore = true;
            L.PM.reInitLayer(this.previousEditedFeature);
            this.previousEditedFeature = null;

            this.hidePartButton();
          }
        }
        //if add part
        else if (e.btnName.startsWith('AddPart')) {
          //add part
          this.drawButtonPushed = false;
          this.addPartButtonPushed = true;
          //if is standalone mode
          if (this.selectedLayerConfigToEdit) {
            //delete create polygons
            if (this.layersEditModeCreate) {
              this.layersEditModeCreate.map((x) => {
                map.removeLayer(x);
              });
              this.layersEditModeCreate = [];
            }
          }
        }
        // else if(e.btnName.startsWith('removal')){
        //   this.drawButtonPushed = false;
        //   this.addPartButtonPushed = true;
        // }
      }
    });
  }

  onSearchPointClickEvent(map: L.Map, searchedLayers: L.GeoJSON) {
    map.off('pm:drawstart');
    map.off('pm:drawend');
    this.dispatchActionsHelperService.dispatchMeasureLinePolygon(false);
    // this.addPartOn = false; //closes add part flag
    this.defaultMouseMoveEvent(map);

    if (this.innerPolygon) {
      map.removeLayer(this.innerPolygon);
      this.innerPolygon = null;
    }
    if (this.circleMarker) {
      map.removeLayer(this.circleMarker);
    }

    // this.addPartOn = false; //closes add part flag
    const mapElement = document.getElementById('map');
    const mapClasses = mapElement.classList.toString() + ' custom-map-pointer';
    mapElement.className = mapClasses;


    L.DomUtil.addClass(map.getContainer(), 'custom-cursor-pointer');

    map.off('click');

    map.on('click', (e: L.LeafletMouseEvent) => {

      this.layersArray = this.mapService.getLayersArray();
      const searchRadius = 1000;
      const bounds = L.latLng(e.latlng.lat, e.latlng.lng).toBounds(
        searchRadius
      );

      const bbox = [
        bounds.getSouthWest().lat,
        bounds.getSouthWest().lng,
        bounds.getNorthEast().lat,
        bounds.getNorthEast().lng,
      ];

      const configLayers = this.layersArray
        .map((x) => x.properties)
        .filter((x) => x.queryable && x.displayOnStartup);

      const queryParameters = {
        service: 'WMS',
        version: '1.3.0',
        request: 'GetFeatureInfo',
        format: 'image/png',
        transparent: 'true',
        crs: 'EPSG:4326',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        info_format: 'GEOJSON',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        feature_count: '100',
        i: '50',
        j: '50',
        width: '101',
        height: '101',
        bbox: bbox.toString(),
      };

      this.dispatchActionsHelperService.dispatchSearchResults(
        configLayers,
        bbox,
        queryParameters,
        'point'
      );
    });

    const tooltipContent = this.translationSevice.translate('COMMON.CLICK', {
      value: this.translationSevice.translate(
        'MAP.SUBHEADER.POINT_SEARCH_VALUE'
      ),
    });
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      const tooltipsOn = this.configuration.layout?.tooltips ? this.configuration.layout?.tooltips : false;
      if (tooltipsOn) {
        this.mapTooltip
          .setContent(tooltipContent)
          .setLatLng(e.latlng)
          .openTooltip()
          .addTo(map);
      }


    });

  }

  offSearchPointClickEvent(map: L.Map, searchedLayers: L.GeoJSON) {
    const mapElement = document.getElementById('map');
    const mapClasses = mapElement.classList
      .toString()
      .replace('custom-map-pointer', '');
    mapElement.className = mapClasses;
    map.off('click');
    this.defaultClickEvent(map, searchedLayers);
    map.off('mousemove');
    map.removeLayer(this.mapTooltip);

    this.defaultMouseMoveEvent(map);

    L.DomUtil.removeClass(map.getContainer(), 'custom-cursor-pointer');
  }

  onMeasureLineEvents(
    map: L.Map
  ): Observable<{ layer: L.Layer; popup: L.Popup }> {
    let measureLineCoordinates: turf.Position[] = [];

    const createPopup = (
      drawLayer: L.Layer,
      markerLatLng: L.LatLng,
      popup?: L.Popup
    ) => {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const workingLayerLatsLngs: L.LatLng[] = drawLayer['_latlngs'];

      measureLineCoordinates = workingLayerLatsLngs.map((x) => {
        const lnglat = this.mapService.latlngTolnglat(x);
        return lnglat;
      });
      // create line and get the length
      const { length, unit } = !popup
        ? this.mapService.createLineAndGetLength([
          ...measureLineCoordinates,
          this.mapService.latlngTolnglat(markerLatLng),
        ])
        : this.mapService.createLineAndGetLength(measureLineCoordinates);

      // create popup, add to map, open it and take the reference
      if (popup) {
        popup
          .setLatLng(markerLatLng)
          .setContent(
            `${this.translationSevice.translate(
              'MAP.SIDE_MENU.TOOLS_SUBMENU.DISTANCE.POPUP_DISTANCE'
            )} ${length} ${unit}`
          )
          .openOn(map);

        // gather all popups
        this.popups.push(popup);
      } else {
        drawLayer
          .bindPopup(
            `${this.translationSevice.translate(
              'MAP.SIDE_MENU.TOOLS_SUBMENU.DISTANCE.POPUP_DISTANCE'
            )} ${length} ${unit}`
          )
          .addTo(map);
        drawLayer.openPopup(markerLatLng);
      }
    };

    map.on('pm:drawstart', ({ workingLayer }) => {
      workingLayer.on('pm:vertexadded', () => {
        workingLayer.on('pm:snapdrag', ({ layer, marker }) => {
          createPopup(layer, marker.getLatLng());
        });
      });
    });
    const tooltipsOn = this.configuration.layout?.tooltips ? this.configuration.layout?.tooltips : false;
    map.pm.enableDraw('MeasureLine', { snappable: true, tooltips: tooltipsOn, snapDistance: 20 });

    map.on('pm:drawend', () => {
      measureLineCoordinates.length = 0;
      // this.layersDrawned = map.pm.getGeomanDrawLayers() as L.Layer[];
      const layerCreated = this.layersDrawned[this.layersDrawned.length - 1];

      if (layerCreated) {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        layerCreated['_latlngs'].map((x: L.LatLng) => {
          measureLineCoordinates.push(this.mapService.latlngTolnglat(x));
        });

        const popup = L.popup({
          autoClose: false,
          closeButton: false,
          closeOnClick: false,
        });

        createPopup(
          layerCreated,
          this.mapService.lnglatTolatlng(
            measureLineCoordinates[measureLineCoordinates.length - 1]
          ),
          popup
        );

        map.off('pm:snapdrag');
        map.pm.enableDraw('MeasureLine', { snappable: true, tooltips: tooltipsOn, snapDistance: 20 });
        measureLineCoordinates.length = 0;

        this.$createdLayer.next({ layer: layerCreated, popup });
      }
    });
    return this.$createdLayer.asObservable();
  }

  offMeasureLineEvents(map: L.Map): void {
    // this.dispatchActionsHelperService.dispatchRectangleSearchClicked(false);
    // this.offRectangeSearch(map);
    // this.dispatchActionsHelperService.dispatchPointSearchClicked(false);
    // this.offSearchPointClickEvent(map , null);

    map.off('pm:drawstart');
    map.off('pm:drawend');
    // this.addPartOn = false; //closes add part flag

    this.popups.map((x) => {
      map.removeLayer(x);
    });

    this.layersDrawned.map((x) => {
      map.removeLayer(x);
    });
  }

  onMeasurePolygonEvents(
    map: L.Map
  ): Observable<{ layer: L.Layer; popup: L.Popup }> {
    let measureLineCoordinates: turf.Position[] = [];

    const createInnerPolygonAndPopup = (
      drawLayer: L.Layer,
      markerLatLng?: L.LatLng,
      popup?: L.Popup
    ) => {
      const workingLayerLatsLngs: L.LatLng[] =
        // eslint-disable-next-line @typescript-eslint/dot-notation
        drawLayer['_latlngs'][0] instanceof Array
          ? // eslint-disable-next-line @typescript-eslint/dot-notation
          drawLayer['_latlngs'][0]
          : // eslint-disable-next-line @typescript-eslint/dot-notation
          drawLayer['_latlngs'];

      measureLineCoordinates = workingLayerLatsLngs.map((x) => {
        const lnglat = this.mapService.latlngTolnglat(x);
        return lnglat;
      });

      if (this.innerPolygon) {
        map.removeLayer(this.innerPolygon);
        this.innerPolygon = null;
      }

      // create polygon and get area center and unit
      const { area, coordinates, unit, center } = markerLatLng
        ? this.mapService.createPolygonAndGetArea([
          ...measureLineCoordinates,
          this.mapService.latlngTolnglat(markerLatLng),
        ])
        : this.mapService.createPolygonAndGetArea(measureLineCoordinates);

      if (coordinates) {
        this.innerPolygon = L.polygon(coordinates, {
          stroke: false,
          snapIgnore: true,
        }).addTo(map);
      }

      // create popup, add to map, open it and take the reference
      if (popup) {
        popup
          .setLatLng(center)
          .setContent(
            `${this.translationSevice.translate(
              'MAP.SIDE_MENU.TOOLS_SUBMENU.AREA.POPUP_AREA'
            )} ${area} ${unit}`
          )
          .openOn(map);

        // gather all popups
        this.popups.push(popup);
      } else {
        drawLayer
          .bindPopup(
            `${this.translationSevice.translate(
              'MAP.SIDE_MENU.TOOLS_SUBMENU.AREA.POPUP_AREA'
            )} ${area} ${unit}`
          )
          .addTo(map);
        drawLayer.openPopup(markerLatLng);
      }
    };

    const addSnapDragEventOnMap = (workingLayer: L.Layer) => {
      workingLayer.on('pm:snapdrag', ({ layer, marker }) => {
        createInnerPolygonAndPopup(layer, marker.getLatLng());
      });
    };

    map.on('pm:drawstart', ({ workingLayer }) => {
      workingLayer.on('pm:vertexadded', () => {
        addSnapDragEventOnMap(workingLayer);
        workingLayer.on('pm:snap', ({ layer, snapLatLng }) => {
          workingLayer.off('pm:snapdrag');
          createInnerPolygonAndPopup(layer, snapLatLng);
        });
        workingLayer.on('pm:unsnap', ({ layer, marker }) => {
          createInnerPolygonAndPopup(layer, marker.getLatLng());
          addSnapDragEventOnMap(layer);
        });
      });
    });
    const tooltipsOn = this.configuration.layout?.tooltips ? this.configuration.layout?.tooltips : false;
    map.pm.enableDraw('MeasurePolygon', { snappable: true, tooltips: tooltipsOn, snapDistance: 20 });
    // map.pm.enableDraw('Polygon', { snapDistance: 5 });

    map.on('pm:drawend', () => {
      measureLineCoordinates.length = 0;

      // this.layersDrawned = map.pm.getGeomanDrawLayers() as L.Layer[];
      const layerCreated = this.layersDrawned[this.layersDrawned.length - 1];

      if (layerCreated) {
        // eslint-disable-next-line @typescript-eslint/dot-notation
        layerCreated['_latlngs'][0].map((x: L.LatLng) => {
          measureLineCoordinates.push(this.mapService.latlngTolnglat(x));
        });

        const popup = L.popup({
          autoClose: false,
          closeButton: false,
          closeOnClick: false,
          className: 'custom-popup',
        });

        createInnerPolygonAndPopup(layerCreated, null, popup);

        map.off('pm:snapdrag');
        map.pm.enableDraw('MeasurePolygon', {
          snappable: true,
          tooltips: tooltipsOn,
          snapDistance: 20,
        });
        this.defaultMouseMoveEvent(map);
        measureLineCoordinates.length = 0;

        this.$createdLayer.next({ layer: layerCreated, popup });
        map.removeLayer(this.innerPolygon);
        this.innerPolygon = null;
      }
    });
    return this.$createdLayer.asObservable();
  }

  offMeasurePolygonEvents(map: L.Map): void {
    // this.dispatchActionsHelperService.dispatchRectangleSearchClicked(false);
    // this.offRectangeSearch(map);

    // this.dispatchActionsHelperService.dispatchPointSearchClicked(false);
    // this.offSearchPointClickEvent(map , null);
    map.off('pm:drawstart');
    map.off('pm:drawend');
    // this.addPartOn = false; //closes add part flag
    this.defaultMouseMoveEvent(map);

    this.popups.map((x) => {
      map.removeLayer(x);
    });

    this.layersDrawned.map((x) => {
      map.removeLayer(x);
    });

    if (this.innerPolygon) {
      map.removeLayer(this.innerPolygon);
      this.innerPolygon = null;
    }
  }

  onAddMarkerFromTools(map: L.Map): Observable<L.LatLng> {
    map.on('mousemove', (e: L.LeafletMouseEvent) => {
      if (this.circleMarker) {
        map.removeLayer(this.circleMarker);
      }

      this.circleMarker = L.circleMarker(e.latlng)
        .bindTooltip(
          this.translationSevice.translate(
            'MAP.SIDE_MENU.TOOLS_SUBMENU.ZOOM_TO_XY.DOUBLE_CLICK_MAP'
          )
        )
        .addTo(map);
    });
    map.on('dblclick', (e: L.LeafletMouseEvent) => {
      map.removeLayer(this.circleMarker);
      this.$createdLayerLatLng.next(e.latlng);
    });

    return this.$createdLayerLatLng.asObservable();
  }

  offAddMarkerFromTools(map: L.Map): void {
    map.off('dblclick');
    map.off('mousemove');
    this.defaultMouseMoveEvent(map);
  }

  onRectangeSearch(map: L.Map) {
    // this.offMeasurePolygonEvents(map);
    // this.offMeasureLineEvents(map);
    map.off('pm:create');
    map.off('pm:drawstart');
    map.off('pm:drawend');
    this.dispatchActionsHelperService.dispatchMeasureLinePolygon(false);
    // this.addPartOn = false; //closes add part flag
    this.defaultMouseMoveEvent(map);

    if (this.innerPolygon) {
      map.removeLayer(this.innerPolygon);
      this.innerPolygon = null;
    }
    if (this.circleMarker) {
      map.removeLayer(this.circleMarker);
    }
    this.popups.map((x) => {
      map.removeLayer(x);
    });

    this.layersDrawned.map((x) => {
      map.removeLayer(x);
    });

    const tooltipsOn = this.configuration.layout?.tooltips ? this.configuration.layout?.tooltips : false;
    map.pm.enableDraw('Rectangle', { snappable: false, tooltips: tooltipsOn, });
    // this.addPartOn = false;
    map.on('pm:create', (e) => {
      console.log('pm:create rectangle');
      this.layersArray = this.mapService.getLayersArray();
      const rectangle = e.layer as L.Polygon;

      this.layersDrawned.push(rectangle);

      const bounds = rectangle.getBounds();

      const bbox = [
        bounds.getSouthWest().lat,
        bounds.getSouthWest().lng,
        bounds.getNorthEast().lat,
        bounds.getNorthEast().lng,
      ];

      const configLayers = this.layersArray
        .map((x) => x.properties)
        .filter((x) => x.queryable && x.displayOnStartup);

      const queryParameters = {
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        crs: 'EPSG:4326',
        srsName: 'EPSG:4326',
        outputFormat: 'GEOJSON',
        bbox: bbox.toString(),
      };

      this.dispatchActionsHelperService.dispatchSearchResults(
        configLayers,
        bbox,
        queryParameters,
        'rectangle'
      );
    });
  }

  offRectangeSearch(map: L.Map): void {
    map.off('pm:create');
    map.off('pm:drawend');
    map.pm.disableDraw('Rectangle');
    this.layersDrawned.map((layer) => {
      map.removeLayer(layer);
    });
    this.layersDrawned.length = 0;
    this.dispatchActionsHelperService.dispatchRectangleSearchClicked(false);
  }

  // onPolygonSearch(map: L.Map): void {
  //   map.on('pm:create', (e) => {
  //     console.log('onPolygonSearch');
  //     const newLayerFeature = new FeatureGroup([e.layer]);
  //     const createdLayer = newLayerFeature.toGeoJSON();
  //   });
  // }

  // offPolygonSearch(map: L.Map): void {
  //   map.off('pm:create');
  // }

  onPolygonCreate(map: L.Map): void {
    map.off('pm:create');
    map.on('pm:create', (e) => {
      // if(this.addPartOn) {
      //   this.addPartOn= false;
      // }

      try {
        (e.layer as L.GeoJSON).setStyle({ pmIgnore: false, color: '#3388ff' });
      } catch (err) {
        console.error('Only geojson can change style.(Not Markers)');
      }
      (e.layer as L.GeoJSON).options.pmIgnore = false;

      L.PM.reInitLayer(e.layer);
      // map.addLayer(e.layer as L.GeoJSON);
      if (this.drawButtonPushed) {
        // console.log('drawn new');
        this.layersEditModeCreate.push(e.layer);
        this.onGeoJSONEdit(map, e.layer as L.GeoJSON, true, false);

        if (
          this.configuration.general.loadEditMod &&
          this.selectedLayerConfigToEdit
        ) {
          this.openEditModal(null, this.selectedLayerConfigToEdit, map);
        }

        this.sendCreateMessage();
      } else {
        this.layersEditModePart.push(e.layer);
        // console.log('drawn part');
        this.onGeoJSONEdit(map, e.layer as L.GeoJSON, true, true);
        this.sendEditMessage();
      }

      if (this.iframeEdit) {
        this.initiateControlsPerGeometry(
          map,
          this.iframeLayerConfigToEdit.edit.geometryType
        );
      }

      map.pm.disableDraw('Polygon');
      map.pm.disableDraw('Line');
      map.pm.disableDraw('Marker');
      map.pm.disableDraw('CircleMarker');
    });
    // map.on('pm:globaleditmodetoggled', (e) => {
    //   console.log(e);
    // });
  }

  sendCreateMessage() {
    // const newLayerFeature = new FeatureGroup(this.layersEditModeCreate);
    let feature = null;
    if (this.layersEditModeCreate.length > 0) {
      const toSend = this.layersToGeojson(this.layersEditModeCreate);
      feature = toSend as turf.helpers.Feature<turf.helpers.Geometry>;
    }
    let area = 0;
    let perimeter = 0;
    //calculate area and perimeter
    if (feature) {
      if (feature.geometry.type.toLowerCase() === 'polygon') {
        if (
          feature.geometry.coordinates.length > 0 &&
          feature.geometry.coordinates[0] &&
          feature.geometry.coordinates[0][0]
        ) {
          const line = turf.lineString(feature.geometry.coordinates[0] as any);
          perimeter = turf.length(line, { units: 'kilometers' }) * 1000;
        } else {
          perimeter = 0;
        }
        area = turf.area(feature);
      } else if (feature.geometry.type.toLowerCase() === 'multipolygon') {
        feature.geometry.coordinates.forEach((polygon) => {
          if (
            feature.geometry.coordinates.length > 0 &&
            feature.geometry.coordinates[0]
          ) {
            const line = turf.lineString(polygon[0] as any);
            perimeter += turf.length(line, { units: 'kilometers' }) * 1000;
          } else {
            perimeter += 0;
          }
        });
        area = turf.area(feature);
      }
    } else {
      area = 0;
      perimeter = 0;
    }
    //convert to defaultProjection code
    if (
      feature &&
      this.configuration.map.defaultProjectionCode !== 'EPSG:4326'
    ) {
      feature = this.mapService.convertGeojsonFeatureToTargetCrs(
        feature,
        null,
        this.configuration.map.defaultProjectionCode
      );

      feature.geometry['crs'] = {
        type: 'name',
        properties: {
          name: this.configuration.map.defaultProjectionCode,
        },
      };
    }
    // send created layer to iframe
    window.parent.postMessage(
      JSON.stringify({
        cmd: 'editXY',
        value: {
          geom: feature?.geometry,
          area,
          perimeter,
        },
      }),
      '*'
    );

    this.lastGeometryChanged = {
      geom: feature?.geometry,
      area,
      perimeter: perimeter ? perimeter : 0,
    };

    // console.log('created layer sent to parent window', feature);
    // console.log('area', area);
    // console.log('perimeter', perimeter);
  }

  layersToGeojson(layers: L.Layer[]) {
    let geoType = null;
    let myConfig;
    if (this.selectedLayerConfigToEdit) {
      geoType = this.selectedLayerConfigToEdit.edit.geometryType;
      myConfig = this.selectedLayerConfigToEdit;
    } else if (this.iframeLayerConfigToEdit) {
      geoType = this.iframeLayerConfigToEdit.edit.geometryType;
      myConfig = this.iframeLayerConfigToEdit;
    }

    let coords = [];
    let tosend = null;
    if (geoType.toLowerCase() === 'polygon') {
      if (myConfig.edit.multi) {
        layers.forEach((l) => {
          //if polygon is simple geometry
          if ((l as L.Polygon)['_latlngs'][0][0].hasOwnProperty('lat')) {
            coords.push((l as L.Polygon)['_latlngs']);
          }
          //if polygon is multi geometry
          else {
            (l as L.Polygon)['_latlngs'].forEach((part) => {
              coords.push(part);
            });
          }
          // coords.push((l as L.Polygon)['_latlngs']);
        });
        return (tosend = new L.Polygon(coords).toGeoJSON());
      } else {
        layers.forEach((l) => {
          coords = (l as L.Polygon)['_latlngs'];
        });
        return (tosend = new L.Polygon(coords).toGeoJSON());
      }
    } else if (geoType.toLowerCase() === 'line') {
      //ToDO EDIT IFRAME MULTI GEOMETRY
      if (myConfig.edit.multi) {
        layers.forEach((l) => {
          coords.push((l as L.Polyline)['_latlngs']);
        });
        return (tosend = new L.Polyline(coords).toGeoJSON());
      } else {
        layers.forEach((l) => {
          coords = (l as L.Polyline)['_latlngs'];
        });
        return (tosend = new L.Polyline(coords).toGeoJSON());
      }
    } else if (geoType.toLowerCase() === 'point') {
      if (myConfig.edit.multi) {
        layers.forEach((l) => {
          //if is point
          if (l.hasOwnProperty('_latlng')) {
            coords.push((l as L.CircleMarker)['_latlng']);
          } //if is multipoint
          else {
            // eslint-disable-next-line prefer-const
            for (let key of Object.keys(l['_layers'])) {
              coords.push(l['_layers'][key]['_latlng']);
            }
          }
        });
        // return tosend = new L.CircleMarker(coords[0]).toGeoJSON();
        return (tosend = turf.multiPoint(coords));
      } else {
        layers.forEach((l) => {
          coords = (l as L.CircleMarker)['_latlng'];
        });
        return (tosend = new L.CircleMarker(
          coords as unknown as LatLng
        ).toGeoJSON());
      }
    } else if (geoType.toLowerCase() === 'marker') {
      if (myConfig.edit.multi) {
        layers.forEach((l) => {
          //if is point
          if (l.hasOwnProperty('_latlng')) {
            coords.push((l as L.Marker)['_latlng']);
          } //if is multipoint
          else {
            // eslint-disable-next-line prefer-const
            for (let key of Object.keys(l['_layers'])) {
              coords.push(l['_layers'][key]['_latlng']);
            }
          }
        });
        // return tosend = new L.Marker(coords[0]).toGeoJSON();
        return (tosend = turf.multiPoint(coords));
      } else {
        layers.forEach((l) => {
          coords = (l as L.Marker)['_latlng'];
        });
        return (tosend = new L.Marker(coords as unknown as LatLng).toGeoJSON());
      }
    }
  }

  sendEditMessage() {
    let newLayerFeature;
    if (this.previousEditedFeature != null) {
      // newLayerFeature = new FeatureGroup([...this.layersEditModePart,this.previousEditedFeature ]);
      // console.log(this.layersEditModePart);
      // console.log(this.previousEditedFeature);
      newLayerFeature = this.layersToGeojson([
        ...this.layersEditModePart,
        this.previousEditedFeature,
      ]);
    } else {
      if (this.addPartButtonPushed) {
        if (this.layersEditModePart.length > 0) {
          // newLayerFeature = new FeatureGroup([...this.layersEditModePart ]);
          newLayerFeature = this.layersToGeojson([...this.layersEditModePart]);
        } else {
          newLayerFeature = null;
        }
      } //no button or edit of created polygon in standalone mode
      else {
        if (this.layersEditModePart.length > 0) {
          // newLayerFeature = new FeatureGroup([...this.layersEditModeCreate ]);
          newLayerFeature = this.layersToGeojson([
            ...this.layersEditModeCreate,
          ]);
        } else {
          newLayerFeature = null;
        }
      }
    }
    let feature = newLayerFeature
      ? (newLayerFeature as turf.helpers.Feature<turf.helpers.Geometry>)
      : null;

    let area = 0;
    let perimeter = 0;
    //calculate area and perimeter
    if (feature) {
      if (feature.geometry.type.toLowerCase() === 'polygon') {
        if (
          feature.geometry.coordinates.length > 0 &&
          feature.geometry.coordinates[0] &&
          feature.geometry.coordinates[0][0]
        ) {
          const line = turf.lineString(feature.geometry.coordinates[0] as any);
          perimeter = turf.length(line, { units: 'kilometers' }) * 1000;
        } else {
          perimeter = 0;
        }
        area = turf.area(feature);
      } else if (feature.geometry.type.toLowerCase() === 'multipolygon') {
        feature.geometry.coordinates.forEach((polygon) => {
          if (
            feature.geometry.coordinates.length > 0 &&
            feature.geometry.coordinates[0]
          ) {
            const line = turf.lineString(polygon[0] as any);
            perimeter += turf.length(line, { units: 'kilometers' }) * 1000;
          } else {
            perimeter += 0;
          }
        });
        area = turf.area(feature);
      }
    } else {
      area = 0;
      perimeter = 0;
    }

    //convert to default projection code
    if (
      feature &&
      this.configuration.map.defaultProjectionCode !== 'EPSG:4326'
    ) {
      feature = this.mapService.convertGeojsonFeatureToTargetCrs(
        feature,
        null,
        this.configuration.map.defaultProjectionCode
      );

      feature.geometry['crs'] = {
        type: 'name',
        properties: {
          name: this.configuration.map.defaultProjectionCode,
        },
      };
    }

    window.parent.postMessage(
      JSON.stringify({
        cmd: 'editXY',
        value: {
          geom: feature?.geometry,
          area,
          perimeter: perimeter ? perimeter : 0,
        },
      }),
      '*'
    );

    this.lastGeometryChanged = {
      geom: feature?.geometry,
      area,
      perimeter: perimeter ? perimeter : 0,
    };

    // console.log('created layer sent to parent window', feature);
    // console.log('area', area);
  }

  onPolygonCreateMeasurements(map: L.Map): void {
    map.on('pm:create', (e) => {
      // console.log('pm:create measurement');
      const newLayerFeature = new FeatureGroup([e.layer]);
      const createdLayer = newLayerFeature.toGeoJSON();
      (e.layer as L.GeoJSON).setStyle({ pmIgnore: false, color: '#3388ff' });
      (e.layer as L.GeoJSON).options.pmIgnore = false;
      this.layersDrawned.push(e.layer);
      L.PM.reInitLayer(e.layer);
    });
  }

  // //TODO DELETE
  // onPolygonCreateIframe(map: L.Map): void {
  //   map.on('pm:create', (e) => {
  //     console.log('pm:create polygon iframe');
  //     const newLayerFeature = new FeatureGroup([e.layer]);
  //     const createdLayer = newLayerFeature.toGeoJSON();
  //     this.onGeoJSONEdit(e.layer as L.GeoJSON, true);
  //     (e.layer as L.GeoJSON).setStyle({ pmIgnore: false });
  //     (e.layer as L.GeoJSON).options.pmIgnore = false;
  //     L.PM.reInitLayer(e.layer);

  //     // send created layer to iframe

  //     window.parent.postMessage(
  //       { feature: createdLayer, layerType: 'create' },
  //       '*'
  //     );
  //     console.log('created layer sent to parent window');
  //   });
  //   // map.on('pm:globaleditmodetoggled', (e) => {
  //   //   console.log(e);
  //   // });
  // }

  offPolygonCreate(map: L.Map): void {
    map.off('pm:create');
  }

  onGeoJSONEdit(
    map: L.Map,
    layer: L.GeoJSON,
    isTemp: boolean = false,
    isPart: boolean = false
  ) {
    layer.on('pm:cut', (e) => {
      if (!isTemp) {
        this.previousEditedLayer = layer;

        this.previousEditedFeature = e.layer;
      }
      this.onGeoJSONEdit(map, e.layer as L.GeoJSON, isTemp, isPart);
      //re place new polygon in temp polygons
      if (isTemp) {
        if (!isPart) {
          this.layersEditModeCreate.push(e.layer);
          const originalLayerIndex = this.layersEditModeCreate.indexOf(
            e.originalLayer
          );
          if (originalLayerIndex >= 0) {
            this.layersEditModeCreate.splice(originalLayerIndex, 1);
          }
        } else {
          this.layersEditModePart.push(e.layer);
          const originalLayerIndex = this.layersEditModePart.indexOf(
            e.originalLayer
          );
          if (originalLayerIndex >= 0) {
            this.layersEditModePart.splice(originalLayerIndex, 1);
          }
        }
      } else {
        try {
          (e.layer as L.GeoJSON).setStyle({ pmIgnore: false, color: '#ff0' });
          L.PM.reInitLayer(layer);
        } catch (err) {
          console.error('Only geojson can change style.(Not Markers)');
        }
      }
      // console.log('pm cut', this.previousEditedFeature);
      // const newLayerFeature = new FeatureGroup([e.layer]);
      // const createdLayer = newLayerFeature.toGeoJSON();
    });

    layer.on('pm:edit', (e) => {
      // this.previousEditedLayer = layer;
      // this.previousEditedFeature = e.layer;
      // console.log('pm edit');
      if (this.drawButtonPushed) {
        this.sendCreateMessage();
      } else {
        this.sendEditMessage();
      }
      // const newLayerFeature = new FeatureGroup([e.layer]);
      // const createdLayer = newLayerFeature.toGeoJSON();
    });

    layer.on('pm:remove', (e) => {
      // this.previousEditedLayer = layer;
      // this.previousEditedFeature = e.layer;

      if (this.iframeEdit) {
        this.initiateControlsPerGeometry(
          map,
          this.iframeLayerConfigToEdit.edit.geometryType,
          false
        );
      }

      console.log('pm remove');
      if (this.drawButtonPushed) {
        const removedIndex = this.layersEditModeCreate.indexOf(e.layer);
        this.layersEditModeCreate.splice(removedIndex, 1);
        this.sendCreateMessage();
      } else {
        const removedIndex = this.layersEditModePart.indexOf(e.layer);
        if (removedIndex >= 0) {
          this.layersEditModePart.splice(removedIndex, 1);
        } //he removed the main feature
        else {
          if (e.layer === this.previousEditedFeature) {
            this.previousEditedFeature = null;
          }
        }
        this.sendEditMessage();
      }
      // const newLayerFeature = new FeatureGroup([e.layer]);
      // const createdLayer = newLayerFeature.toGeoJSON();
    });
  }

  onGlobalEdit(map: L.Map): void {
    map.on('pm:globalcutmodetoggled', async (e) => {
      if (e.enabled) {
        if (!!this.previousEditedFeature) {
          (this.previousEditedFeature as L.GeoJSON).setStyle({
            color: '#ff0',
            // fillColor: '#00f',
            // fillOpacity: 0.2,
            pmIgnore: false,
          });

          //L.PM.reInitLayer(this.previousEditedFeature);
        }
      } else {
        if (!!this.previousEditedLayer) {
          //do sth?
        }
      }
    });

    map.on('pm:globaleditmodetoggled', async (e) => {
      if (e.enabled) {
        this.editingMode = true;

        // console.log('globaleditmodetoggledON', e);
        // //make a list of editable geojson layers
        // //console.log(L.PM.Utils.findLayers(map));
        // console.log('closed edit', this.previousEditedFeature);
      }
      if (!e.enabled) {
        // console.log('globaleditmodetoggledOFF', e);
        // this.selectedLayerConfigToEdit = null;
        // map.off('click', this.selectedLayerCallback);
        this.editingMode = false;
        //TODO SAVE
        // console.log('closed edit', this.previousEditedFeature);
      }
    });
  }

  async selectlayerToEdit(map: L.Map) {
    const editableLayers = [];
    const layersConfig = this.mapService.getConfiguration().layers;
    layersConfig.forEach((l) => {
      if (l?.edit) {
        editableLayers.push(l);
      }
    });
    if (editableLayers.length > 0) {
      const popover = await this.popoverController.create({
        component: SelectEditLayerComponent,
        // event: e,
        cssClass: 'selectEditLayerComponent',
        componentProps: {
          editableLayers,
        },
      });
      await popover.present();
      const { data, role } = await popover.onDidDismiss<{
        exportLayer: IConfigurationLayer;
      }>();
      if (data?.exportLayer) {
        // map.pm.toggleControls();
        this.selectedLayerConfigToEdit = data?.exportLayer;
        this.initiateControlsPerGeometry(
          map,
          data?.exportLayer.edit.geometryType
        );
        // console.log('export layer', data?.exportLayer);
        //todo editable layer wms to geojson
        //remove layer

        this.replaceWmsWithGeojson(
          map,
          'GeoJSON',
          this.selectedLayerConfigToEdit
        );
      } else {
        //close config
        this.selectedLayerConfigToEdit = null;
        this.dispatchActionsHelperService.dispatchSubheaderEditClicked(true);
        // map.pm.toggleControls();
        map.pm.setPathOptions(
          { color: 'var(--ion-color-primary)', fillColor: '#3388ff' },
          {
            ignoreShapes: ['Rectangle'],
          }
        );
        map.pm.disableGlobalEditMode();
        map.pm.disableGlobalCutMode();
        this.offPolygonCreate(map);
      }
    } else {
      this.toastService.showToast(
        this.translationService.translate('MAP.EDIT.NO_LAYERS')
      );
    }
  }

  replaceWmsWithGeojson(
    map: L.Map,
    newType: string,
    oldLayerConfig: IConfigurationLayer
  ): void {
    if (this.selectedLayerConfigToEdit != null) {
      this.layersArray = this.mapService.getLayersArray();
      const oldLayer = this.layersArray.find(
        (x) => x.properties.name === this.selectedLayerConfigToEdit.name
      );
      map.removeLayer(oldLayer.layer);
      const newLayerConfig = { ...oldLayerConfig, type: newType };
      const result = [];
      result.push(newLayerConfig);
      this.dispatchActionsHelperService.dispatchAddWMSLayer(result);
    }
  }

  replaceWmsWithGeojsonStartup(
    map: L.Map,
    newType: string,
    oldLayerConfig: IConfigurationLayer
  ): void {
    this.layersArray = this.mapService.getLayersArray();
    const oldLayer = this.layersArray.find(
      (x) => x.properties.name === oldLayerConfig.name
    );
    map.removeLayer(oldLayer.layer);
    const newLayerConfig = { ...oldLayerConfig, type: newType };
    const result = [];
    result.push(newLayerConfig);
    this.dispatchActionsHelperService.dispatchAddWMSLayer(result);
  }

  selectFeatureToEdit(e): void {
    // console.log('select feature', e, this.selectedLayerConfigToEdit);
    //if layer is polygon,point or line do spatial query and open edit
  }
  getMouseCoordinates(): BehaviorSubject<{ x: number; y: number }> {
    return this.$mouseCoordinates;
  }

  // side menu events
  sideMenuOnContent(sideMenu: L.Control.Sidebar) {
    sideMenu.on('content', (e: unknown) => {
      const event = e as { id: string };
      this.dispatchActionsHelperService.dispatchSidebarContentId(event.id);
    });
  }

  unsubscribeSubjects(): void {
    this.$mouseCoordinates.unsubscribe();
  }

  async openEditModal(
    feat: geojson.Feature,
    configLayer: IConfigurationLayer,
    map: Map
  ) {
    const popover = await this.popoverController.create({
      component: EditLayerComponent,
      // event: e,
      cssClass: 'EditLayerComponent',
      componentProps: {
        feature: feat,
        config: configLayer,
        map,
      },
      backdropDismiss: false,
      showBackdrop: false,
    });
    await popover.present();
    // const { data, role } = await popover.onDidDismiss<{}>();
  }
}
