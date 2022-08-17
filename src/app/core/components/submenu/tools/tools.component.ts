/* eslint-disable @typescript-eslint/dot-notation */
import {
  animate,
  AUTO_STYLE,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';
import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { LatLng, LatLngExpression } from 'leaflet';
import { Subscription } from 'rxjs';
import { IConfiguration } from 'src/app/core/interfaces/configuration.interface';
import { MapEventsService } from 'src/app/services/map-events.service';
import { MapService } from 'src/app/services/map.service';
import { SelectorsHelperService } from 'src/app/services/selectors-helper.service';
import { ToastService } from 'src/app/services/toast.service';
import { TranslationService } from 'src/app/services/translation.service';
import 'node_modules/leaflet-graticule/Leaflet.Graticule.js';
import { environment } from 'src/environments/environment';
import { DispatchActionsHelperService } from 'src/app/services/dispatch-actions-helper.service';
const DEFAULT_DURATION = 300;

@Component({
  selector: 'app-tools',
  templateUrl: './tools.component.html',
  styleUrls: ['./tools.component.scss'],
  animations: [
    trigger('pinsCollapsed', [
      state('false', style({ height: AUTO_STYLE, visibility: AUTO_STYLE })),
      state('true', style({ height: '0', visibility: 'hidden' })),
      transition('false => true', animate(DEFAULT_DURATION + 'ms ease-in')),
      transition('true => false', animate(DEFAULT_DURATION + 'ms ease-out')),
    ]),
  ],
})
export class ToolsComponent implements OnInit, OnDestroy {
  @Input() toolEnabled: string;

  public mygraticule;

  public configuration: IConfiguration;
  public zoomXYForm: FormGroup;
  public printForm: FormGroup;
  public coordinateSystems: { description: string; value: string }[] = [];
  public pinsAdded: { layer: L.Marker; properties: { name: string } }[] = [];
  public layersAdded: {
    layer: L.Layer;
    popup: L.Popup;
    properties: { id: number };
  }[] = [];
  public getFromMapClicked = false;
  public pinsCollapsed = true;
  public pageSizes = ['A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'Letter'];
  public pageOrientations = [
    { value: 'landscape', description: 'LANDSCAPE' },
    { value: 'portrait', description: 'PORTRAIT' },
    { value: 'custom', description: 'AREA_SELECTION' },
  ];
  public scale: { kilometers: string; miles: string };

  private map: L.Map;
  private previousCoordinateSystem: string;
  private previousSideMenuContentId: string;
  private sideMenuEventsEnabled = false;
  private gridLayerPrint: L.GridLayer;

  private zoomScaleEventFunction: () => void;

  // Subscriptions
  private subscriptions: Subscription = new Subscription();
  private getFromMapClickSubsciption: Subscription;
  private sidebarContentIdSubscription: Subscription;
  private onMeasureEventsSubscription: Subscription;

  constructor(
    private mapService: MapService,
    private mapEventsService: MapEventsService,
    public formBuilder: FormBuilder,
    private toastService: ToastService,
    private translateService: TranslationService,
    private selectorsHelperService: SelectorsHelperService,
    private dispatchActionsHelperService: DispatchActionsHelperService
  ) { }

  get fZoom(): { [key: string]: AbstractControl } {
    return this.zoomXYForm.controls;
  }

  get fPrint(): { [key: string]: AbstractControl } {
    return this.printForm.controls;
  }

  ngOnInit() {
    this.configuration = this.mapService.getConfiguration();
    this.subscriptions.add(
      this.mapEventsService.getMap().subscribe((map) => {
        this.map = map;
      })
    );

    this.subscriptions.add(
      this.selectorsHelperService
        .getMeasureLinePolygon()
        .subscribe((lineOn) => {
          if (lineOn != null) {
            this.toolEnabled = null;
            this.map.off('pm:drawstart');
            this.map.off('pm:drawend');
            this.map.pm.disableDraw('MeasureLine');

            //this.offAllMapEvents();
            this.mapEventsService.offAddMarkerFromTools(this.map);
            this.mapEventsService.offMeasureLineEvents(this.map);
            this.mapEventsService.offMeasurePolygonEvents(this.map);
            this.map.pm.disableDraw();
            this.unsubscribeSubjects();
            this.layersAdded.length = 0;
            this.getFromMapClicked = false;
            if (this.onMeasureEventsSubscription) {
              this.onMeasureEventsSubscription.unsubscribe();
            }
            this.dispatchActionsHelperService.dispatchMeasureLinePolygon(null);
          }
        })
    );

    this.subscriptions.add(
      this.selectorsHelperService.getMapControlScale().subscribe((scale) => {
        this.scale = scale;
      })
    );

    this.coordinateSystems = [
      { description: 'EPSG:4326', value: 'EPSG:4326' },
      { description: 'EPSG:3857', value: 'EPSG:3857' },
    ];

    this.coordinateSystems.push({
      description: this.configuration.map.defaultProjectionCode,
      value: this.configuration.map.defaultProjectionCode,
    });

    this.zoomXYForm = this.formBuilder.group({
      coordinateSystem: [
        this.configuration.map.defaultProjectionCode,
        Validators.required,
      ],
      xCoordinate: [null, Validators.required],
      yCoordinate: [null, Validators.required],
      zoomLevel: [this.configuration.map.xyZoomLevel, Validators.required],
      pinName: null,
    });

    this.printForm = this.formBuilder.group({
      size: [null, Validators.required],
      orientation: [null, Validators.required],
      scale: [null, Validators.required],
      gridScale: null,
      title: null,
      description: null,
    });
  }

  unsubscribeSubjects() {
    if (this.getFromMapClickSubsciption) {
      this.getFromMapClickSubsciption.unsubscribe();
    }
  }

  sideBarEvents(): void {
    if (!this.sidebarContentIdSubscription) {
      // get sidebar menu opened to off map events
      this.sidebarContentIdSubscription = this.selectorsHelperService
        .getMapSidebarContentId()
        .subscribe((contentId) => {
          if (contentId !== 'tools') {
            if (!this.sideMenuEventsEnabled) {
              this.offAllMapEvents();
              this.sideMenuEventsEnabled = true;
            }
          } else {
            if (this.previousSideMenuContentId !== contentId) {
              this.toolEnabled = null;
              this.sideMenuEventsEnabled = false;
            }
          }
          this.previousSideMenuContentId = contentId;
        });
    }
  }

  // measure line methods
  measureLineClick(lineOn: boolean = null): void {
    this.offAllMapEvents();
    this.sideBarEvents();
    if (this.toolEnabled || !lineOn) {
      this.toolEnabled = this.mapService.manipulateEnabledToolButton(
        this.toolEnabled,
        'line'
      );
      this.mapEventsService.offPolygonCreate(this.map);
      this.mapEventsService.onPolygonCreateMeasurements(this.map);
    } else {
      this.map.pm.disableDraw();
      this.toolEnabled = 'line';
      this.mapEventsService.offPolygonCreate(this.map);
      this.mapEventsService.onPolygonCreateMeasurements(this.map);
    }

    if (this.toolEnabled === 'line') {
      this.onMeasureEventsSubscription = this.mapEventsService
        .onMeasureLineEvents(this.map)
        .subscribe((newLayer) => {
          this.layersAdded.push({
            layer: newLayer.layer,
            popup: newLayer.popup,
            properties: { id: this.layersAdded.length + 1 },
          });
        });
    } else {
      this.dispatchActionsHelperService.dispatchRectangleSearchClicked(false);
      this.mapEventsService.offRectangeSearch(this.map);
      this.dispatchActionsHelperService.dispatchPointSearchClicked(false);
      this.mapEventsService.offSearchPointClickEvent(this.map, null);
      this.mapEventsService.offMeasureLineEvents(this.map);
      this.map.pm.disableDraw('MeasureLine');
    }
  }

  // measure polygon methods
  measurePolygonClick(): void {
    this.sideBarEvents();

    if (this.toolEnabled) {
      this.toolEnabled = this.mapService.manipulateEnabledToolButton(
        this.toolEnabled,
        'polygon'
      );
      this.offAllMapEvents();
      this.mapEventsService.offPolygonCreate(this.map);
      this.mapEventsService.onPolygonCreateMeasurements(this.map);
    } else {
      this.dispatchActionsHelperService.dispatchRectangleSearchClicked(false);
      this.mapEventsService.offRectangeSearch(this.map);

      this.dispatchActionsHelperService.dispatchPointSearchClicked(false);
      this.mapEventsService.offSearchPointClickEvent(this.map, null);
      this.mapEventsService.offMeasurePolygonEvents(this.map);
      this.map.pm.disableDraw();
      this.toolEnabled = 'polygon';
      this.mapEventsService.offPolygonCreate(this.map);
      this.mapEventsService.onPolygonCreateMeasurements(this.map);
    }

    if (this.toolEnabled === 'polygon') {
      this.onMeasureEventsSubscription = this.mapEventsService
        .onMeasurePolygonEvents(this.map)
        .subscribe((newLayer) => {
          this.layersAdded.push({
            layer: newLayer.layer,
            popup: newLayer.popup,
            properties: { id: this.layersAdded.length + 1 },
          });
        });
    } else {
      this.dispatchActionsHelperService.dispatchRectangleSearchClicked(false);
      this.mapEventsService.offRectangeSearch(this.map);

      this.dispatchActionsHelperService.dispatchPointSearchClicked(false);
      this.mapEventsService.offSearchPointClickEvent(this.map, null);
      this.mapEventsService.offMeasurePolygonEvents(this.map);
      this.map.pm.disableDraw('MeasurePolygon');
    }
  }

  zoomToLayer(id: number): void {
    const markerFound = this.layersAdded.find((x) => x.properties.id === id);
    const layer = markerFound.layer as L.Polyline;

    this.map.flyToBounds(layer.getBounds());
  }

  removeLayerClick(id: number): void {
    const layerFound = this.layersAdded.find((x) => x.properties.id === id);
    this.map.removeLayer(layerFound.layer);
    this.map.removeLayer(layerFound.popup);
    this.layersAdded = this.layersAdded.filter(
      (x) => x.properties.id !== layerFound.properties.id
    );
  }

  // zoom to xy methods
  zoomToXYClick(): void {
    this.sideBarEvents();
    if (this.toolEnabled) {
      this.toolEnabled = this.mapService.manipulateEnabledToolButton(
        this.toolEnabled,
        'zoomXY'
      );
    } else {
      this.toolEnabled = 'zoomXY';
    }

    this.zoomXYForm.patchValue({
      xCoordinate: this.map.getCenter().lng,
      yCoordinate: this.map.getCenter().lat,
    });

    this.offAllMapEvents();
    this.coordinateSystemChanged();
  }

  removeMarkersClick(): void {
    this.pinsAdded.map((x) => {
      this.map.removeLayer(x.layer);
    });
    this.pinsAdded.length = 0;

    const convertedCoordinates = this.mapService.convertCoordinates(
      null,
      this.zoomXYForm.get('coordinateSystem').value,
      [this.map.getCenter().lng, this.map.getCenter().lat]
    );

    this.zoomXYForm.patchValue({
      xCoordinate: convertedCoordinates[0],
      yCoordinate: convertedCoordinates[1],
    });

    this.toastService.showToast(
      this.translateService.translate(
        'MAP.SIDE_MENU.TOOLS_SUBMENU.ZOOM_TO_XY.MARKERS_REMOVED'
      )
    );
  }

  getFromMapClick(): void {
    this.getFromMapClicked = !this.getFromMapClicked;

    if (this.getFromMapClicked) {
      this.getFromMapClickSubsciption = this.mapEventsService
        .onAddMarkerFromTools(this.map)
        .subscribe((latlng) => {
          const coordinates = this.mapService.convertCoordinates(
            null,
            this.zoomXYForm.get('coordinateSystem').value,
            [latlng.lng, latlng.lat]
          );
          const pinsFound = this.pinsAdded.filter((x) =>
            x.properties.name.startsWith(
              this.translateService.translate(
                'MAP.SIDE_MENU.TOOLS_SUBMENU.ZOOM_TO_XY.UNNAMED'
              )
            )
          );
          this.zoomXYForm.patchValue({
            xCoordinate: coordinates[0],
            yCoordinate: coordinates[1],
            pinName: `${this.translateService.translate(
              'MAP.SIDE_MENU.TOOLS_SUBMENU.ZOOM_TO_XY.UNNAMED'
            )} ${pinsFound.length + 1}`,
          });
          this.zoomInClick();
        });
    } else {
      this.unsubscribeSubjects();
      this.mapEventsService.offAddMarkerFromTools(this.map);
    }
  }

  coordinateSystemChanged(): void {
    const currentCoordinateSystem =
      this.zoomXYForm.get('coordinateSystem').value;
    const newCoordinates =
      this.zoomXYForm.get('xCoordinate').value &&
        this.zoomXYForm.get('yCoordinate').value
        ? this.mapService.convertCoordinates(
          this.previousCoordinateSystem,
          currentCoordinateSystem,
          [
            this.zoomXYForm.get('xCoordinate').value,
            this.zoomXYForm.get('yCoordinate').value,
          ]
        )
        : [
          this.zoomXYForm.get('xCoordinate').value,
          this.zoomXYForm.get('yCoordinate').value,
        ];

    this.zoomXYForm.patchValue({
      xCoordinate: newCoordinates[0],
      yCoordinate: newCoordinates[1],
    });

    this.pinsAdded.map((x) => {
      const layerNewCoordinates = this.mapService.convertCoordinates(
        null,
        this.zoomXYForm.get('coordinateSystem').value,
        [x.layer.getLatLng().lng, x.layer.getLatLng().lat]
      );
      x.layer.setPopupContent(
        this.setPopupContent(
          x.properties.name,
          layerNewCoordinates[0],
          layerNewCoordinates[1]
        )
      );
    });

    this.previousCoordinateSystem =
      this.zoomXYForm.get('coordinateSystem').value;
  }

  zoomInClick(): void {
    if (!this.zoomXYForm.valid) {
      this.toastService.showToast(
        this.translateService.translate('COMMON.REQUIRED_FIELDS')
      );
      return;
    }

    if (!this.zoomXYForm.get('pinName').value) {
      const pinsFound = this.pinsAdded.filter((x) =>
        x.properties.name.startsWith(
          this.translateService.translate(
            'MAP.SIDE_MENU.TOOLS_SUBMENU.ZOOM_TO_XY.UNNAMED'
          )
        )
      );
      this.zoomXYForm.patchValue({
        pinName: `${this.translateService.translate(
          'MAP.SIDE_MENU.TOOLS_SUBMENU.ZOOM_TO_XY.UNNAMED'
        )} ${pinsFound.length + 1}`,
      });
    }

    if (
      this.pinsAdded.some(
        (x) => x.properties.name === this.zoomXYForm.get('pinName').value
      )
    ) {
      this.toastService.showToast(
        this.translateService.translate('ERRORS.TOOLS.PIN_WITH_SAME_NAME')
      );
      return;
    }

    this.getFromMapClicked = false;
    this.mapEventsService.offAddMarkerFromTools(this.map);
    this.unsubscribeSubjects();

    const latlng = this.mapService.convertCoordinates(
      this.zoomXYForm.value.coordinateSystem,
      null,
      [
        this.zoomXYForm.get('xCoordinate').value,
        this.zoomXYForm.get('yCoordinate').value,
      ]
    );
    if (!latlng) {
      this.toastService.showToast(
        this.translateService.translate('ERRORS.TOOLS.COORDINATE_CONVERTION')
      );
      return;
    }
    const coordinates = { lat: latlng[1], lng: latlng[0] } as L.LatLng;
    const markerPopup = L.popup().setContent(
      this.setPopupContent(
        this.zoomXYForm.get('pinName').value,
        this.zoomXYForm.get('xCoordinate').value,
        this.zoomXYForm.get('yCoordinate').value
      )
    );
    this.pinsAdded.push({
      layer: L.marker(coordinates)
        .bindPopup(markerPopup)
        .addTo(this.map)
        .openPopup(),
      properties: { name: this.zoomXYForm.get('pinName').value },
    });
    this.map.flyTo(coordinates, this.zoomXYForm.get('zoomLevel').value);
    this.zoomXYForm.patchValue({
      pinName: null,
    });
  }

  setPopupContent(
    pinName: string,
    xCoordinate: string | number,
    yCoordinate: string | number
  ): string {
    return `
    <div id="custom-popup-header">
      <h5>
        <b>${pinName}</b>
      </h5>
      <div id="popup-xcoordinate"> X: ${xCoordinate} </div>
      <div id="popup-ycoordinate"> Y: ${yCoordinate} </div>
    </div>
    `;
  }

  zoomToMarker(name: string): void {
    const markerFound = this.pinsAdded.find((x) => x.properties.name === name);
    this.map.flyTo(
      markerFound.layer.getLatLng(),
      this.zoomXYForm.get('zoomLevel').value
    );
  }

  removeMarkerClick(name: string): void {
    const markerFound = this.pinsAdded.find((x) => x.properties.name === name);
    this.map.removeLayer(markerFound.layer);
    this.pinsAdded = this.pinsAdded.filter(
      (x) => x.properties.name !== markerFound.properties.name
    );
  }

  // zoomScaleChange() {
  //   console.log('zoomend');
  //   this.printForm
  //     .get('scale')
  //     .patchValue(this.getScaleFromMap(), { emitEvent: false });
  // }
  // print map methods
  printMapClick(): void {
    this.sideBarEvents();
    this.offAllMapEvents();

    if (this.toolEnabled !== 'print') {
      this.printForm.get('scale').patchValue(this.getScaleFromMap());
    }

    if (this.toolEnabled) {
      this.toolEnabled = this.mapService.manipulateEnabledToolButton(
        this.toolEnabled,
        'print'
      );
    } else {
      this.toolEnabled = 'print';
      // this.printForm.get('scale').patchValue(this.map.getZoom().toFixed());
      // if (this.zoomScaleEventFunction != null) {
      //   this.map.off('zoomend', this.zoomScaleEventFunction);
      // }
      // this.zoomScaleEventFunction = this.zoomScaleChange.bind(this);
      // this.map.on('zoomend', this.zoomScaleEventFunction);

      // this.printForm.get('scale').patchValue(this.getScaleFromMap());
    }

    L.Control['BrowserPrint'].Utils.registerLayer(
      L.GridLayer['CustomGrid'],
      'L.GridLayer.CustomGrid'
    );

    L.Control['BrowserPrint'].Utils.registerLayer(
      L.latlngGraticule,
      'L.latlngGraticule',
      (options: any) => L.latlngGraticule(options)
    );
    // eslint-disable-next-line space-before-function-paren
  }

  getScaleFromMap(): number {
    //find current scale from map
    const dpi = 96 * window.devicePixelRatio;
    const screenHeight = screen.height; //pixels
    const screenHeightCm = (screenHeight * 2.54) / dpi;

    const mapHeightMeters = this.map.distance(
      this.map.getBounds().getNorthEast(),
      this.map.getBounds().getSouthEast()
    ); //meters
    const mapHeightPixels = this.map.getSize().y;
    const mapHeightInScreenCm = (mapHeightPixels * 2.54) / dpi;

    const value = mapHeightMeters / (mapHeightInScreenCm / 100);
    return value;
  }

  onScaleChange() {
    //this.map.setZoom(this.printForm.get('scale').value);

    const dpi = 96 * window.devicePixelRatio;
    const screenHeight = screen.height; //pixels
    const screenHeightCm = (screenHeight * 2.54) / dpi;

    const mapHeightMeters = this.map.distance(
      this.map.getBounds().getNorthEast(),
      this.map.getBounds().getSouthEast()
    ); //meters
    const mapHeightPixels = this.map.getSize().y;
    const mapHeightInScreenCm = (mapHeightPixels * 2.54) / dpi;

    this.map.fitBounds(
      this.map.getCenter().toBounds(
        mapHeightInScreenCm * (this.printForm.get('scale').value / 100) //meters
      )
    );
  }

  printSubmit() {
    if (this.printForm.get('gridScale').value) {
      // this.gridLayerPrint = new L.GridLayer['CustomGrid']({
      //   tileSize: this.printForm.get('gridScale').value,
      // });
      // this.map.addLayer(this.gridLayerPrint);
    }
    if (this.printForm.get('scale').value) {
      const dpi = 96 * window.devicePixelRatio;
      const mapHeightPixels = this.map.getSize().y;
      const mapHeightInScreenCm = (mapHeightPixels * 2.54) / dpi;
      this.map.fitBounds(
        this.map.getCenter().toBounds(
          mapHeightInScreenCm * (this.printForm.get('scale').value / 100) //meters
        )
      );
    }

    const formSize = this.printForm.get('size').value as string;
    const formOrientation = this.printForm.get('orientation').value as string;

    const pageOrientation = this.pageOrientations.some(
      (e) => e.value === formOrientation.toLowerCase()
    )
      ? formOrientation.toLowerCase()
      : 'landscape';
    const pageSize = this.pageSizes.includes(formSize.toUpperCase())
      ? formSize
      : 'A4';

    const printControl = L.control
      .browserPrint({
        documentTitle: this.printForm.get('title').value
          ? this.printForm.get('title').value
          : 'unnamed',
        closePopupsOnPrint: false,
        printModes: [
          L.control.browserPrint['mode'].landscape(
            '<span id="printLandscape">Landscape View</span>',
            pageSize
          ),
          L.control.browserPrint['mode'].portrait(
            '<span id="printPortrait">Portrait View</span>',
            pageSize
          ),
          L.control.browserPrint['mode'].custom(
            '<span id="printCustom">Custom View</span>',
            pageSize
          ),
        ],
        manualMode: false,
      })
      .addTo(this.map);

    this.map.once('browser-print-start', (e) => {
      L.control.scale().addTo(e['printMap']);
      L.control['compass']({ position: 'topright' }).addTo(e['printMap']);
      if (this.printForm.get('gridScale').value) {
        this.gridLayerPrint = L.latlngGraticule({
          showLabel: true,
          zoomInterval: [
            {
              start: 1,
              end: 20,
              interval: this.printForm.get('gridScale').value,
            },
          ],
        });
        this.gridLayerPrint.addTo(e['printMap']);
      }
    });

    this.map.once('browser-print-end', () => {
      this.map.removeControl(printControl);
      if (this.gridLayerPrint) {
        this.map.removeLayer(this.gridLayerPrint);
        this.gridLayerPrint = null;
      }
    });

    if (pageOrientation === 'landscape') {
      document.getElementById('printLandscape').click();
    } else if (pageOrientation === 'portrait') {
      document.getElementById('printPortrait').click();
    } else {
      document.getElementById('printCustom').click();
    }
  }

  offAllMapEvents(): void {
    this.mapEventsService.offAddMarkerFromTools(this.map);
    this.unsubscribeSubjects();
    this.mapEventsService.offMeasureLineEvents(this.map);
    this.mapEventsService.offMeasurePolygonEvents(this.map);
    this.dispatchActionsHelperService.dispatchRectangleSearchClicked(false);
    this.mapEventsService.offRectangeSearch(this.map);
    this.dispatchActionsHelperService.dispatchPointSearchClicked(false);
    this.mapEventsService.offSearchPointClickEvent(this.map, null);
    this.getFromMapClicked = false;
    this.layersAdded.length = 0;
    this.map.pm.disableDraw();
    this.previousCoordinateSystem = null;

    // unsubscribes
    if (this.onMeasureEventsSubscription) {
      this.onMeasureEventsSubscription.unsubscribe();
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
    this.sidebarContentIdSubscription.unsubscribe();
    this.unsubscribeSubjects();
  }
}
