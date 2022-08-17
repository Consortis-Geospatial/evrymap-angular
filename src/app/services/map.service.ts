import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import L from 'leaflet';
import { NgxXml2jsonService } from 'ngx-xml2json';
import proj4 from 'proj4';
import { environment } from 'src/environments/environment';
import {
  IConfiguration,
  IConfigurationLayer,
} from '../core/interfaces/configuration.interface';
import { IMapServerRequest } from '../core/interfaces/map-server-request.interface';
import { IMenuLayer } from '../core/interfaces/menu-layer.interface';
import { ILayer, LayerModel } from '../core/models/layer.model';
import * as esri from 'esri-leaflet';
@Injectable({
  providedIn: 'root',
})
export class MapService {
  public layersArray: ILayer[] = [];

  private configuration: IConfiguration;

  constructor(
    private ngxXml2jsonService: NgxXml2jsonService,
    public httpClient: HttpClient
  ) {
    // this.configuration = environment.configuration;
  }

  public async loadConfiguration(): Promise<any> {
    const config = await this.httpClient
      .get<IConfiguration>('./assets/config/configuration.json')
      .toPromise();
    Object.assign(this, config);
    this.configuration = config;

    const projections = this.configuration.map.projections.map((x) => {
      const returnedObject = [x.code, x.description];
      return returnedObject;
    });

    proj4.defs(projections);

    // osm tile server https://wiki.openstreetmap.org/wiki/Tile_servers
    this.configuration.layers.unshift({
      name: 'OSM_stamen_toner',
      type: 'OSM',
      label: 'Stamen Toner',
      displayOnStartup: false,
      url: 'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
      menuLayers: {
        type: 'basemap',
        typeGroup: 'OSM',
        image: 'https://stamen-tiles.a.ssl.fastly.net/toner/10/577/385.png',
      },
    });

    this.configuration.layers.unshift({
      name: 'OSM_stamen_terrain',
      type: 'OSM',
      label: 'Stamen Terrain',
      displayOnStartup: false,
      url: 'https://stamen-tiles.a.ssl.fastly.net/terrain/{z}/{x}/{y}.jpg',
      menuLayers: {
        type: 'basemap',
        typeGroup: 'OSM',
        image: 'https://stamen-tiles.a.ssl.fastly.net/terrain/10/577/385.png',
      },
    });

    this.configuration.layers.unshift({
      name: 'OSM_standard',
      type: 'OSM',
      label: 'Standard',
      displayOnStartup: true,
      menuLayers: {
        type: 'basemap',
        typeGroup: 'OSM',
        image: 'https://c.tile.openstreetmap.org/10/577/385.png',
      },
    });

    return config;
  }

  // getters
  getConfiguration(): IConfiguration {
    return { ...this.configuration };
  }

  getLayersArray(): ILayer[] {
    return this.layersArray;
  }

  // setters
  setLayersArray(layersArray: ILayer[]) {
    this.layersArray = layersArray;
  }

  // converts
  convertToLatLng(coordinates: unknown) {
    const ret = [coordinates[1], coordinates[0]];
    return ret;
  }

  convertCoordinates(
    fromCrs: string,
    toCrs: string,
    coordinates: proj4.TemplateCoordinates
  ): proj4.TemplateCoordinates {
    try {
      return proj4(fromCrs || 'EPSG:4326', toCrs || 'EPSG:4326', coordinates);
    } catch (error) {
      return null;
    }
  }

  // turf methods
  latlngTolnglat(latlng: L.LatLng): turf.Position {
    return [latlng.lng, latlng.lat];
  }

  lnglatTolatlng(lnglat: turf.Position): L.LatLng {
    return { lng: lnglat[0], lat: lnglat[1] } as L.LatLng;
  }

  createLineAndGetLength(measureLineCoordinates: turf.Position[]): {
    length: number;
    unit: string;
  } {
    const linestring = turf.lineString(measureLineCoordinates);
    const lengthInKm = turf.length(linestring);

    return lengthInKm < 1
      ? { length: parseFloat((lengthInKm * 1000).toFixed(2)), unit: 'm' }
      : { length: parseFloat(lengthInKm.toFixed(2)), unit: 'km' };
  }

  reorderLayersAccordingToConfig(
    layers: LayerModel[] | ILayer[]
  ): LayerModel[] | ILayer[] {
    const newLayersArray = [];
    this.configuration.layers.forEach((l) => {
      const layerToFind = layers.find((l2) => l2.properties.name === l.name);
      if (layerToFind) {
        newLayersArray.push(layerToFind);
      }
    });
    //push rest layers |  bing osm layers to front and external layers to end
    layers.forEach((l) => {
      if (!newLayersArray.find((newL) => l.id === newL.id)) {
        if (
          l.properties.type.toLowerCase() === 'osm' ||
          l.properties.type.toLowerCase() === 'bing'
        ) {
          newLayersArray.unshift(l);
        } else {
          newLayersArray.push(l);
        }
      }
    });

    newLayersArray.forEach((l) => {
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
    });
    return newLayersArray;
  }

  // other methods
  createPolygonAndGetArea(measureLineCoordinates: turf.Position[]): {
    area: number;
    center: L.LatLng;
    coordinates: L.LatLng[];
    unit: string;
  } {
    if (measureLineCoordinates.length <= 2) {
      return { area: 0, center: null, coordinates: null, unit: 'm²' };
    }
    const polygon = turf.polygon([
      [...measureLineCoordinates, measureLineCoordinates[0]],
    ]);
    const areaInSquareMeters = parseFloat(turf.area(polygon).toFixed(2));
    const centerPointGeojson = turf.center(polygon) as turf.Feature<turf.Point>;
    const center = centerPointGeojson.geometry.coordinates;

    const latlngCoordinates = measureLineCoordinates.map((x) => {
      const convertedCoordinates = this.lnglatTolatlng(x);
      return convertedCoordinates;
    });

    return {
      area:
        parseFloat(areaInSquareMeters.toFixed(2)) > 10000
          ? parseFloat((areaInSquareMeters / 1000000).toFixed(2))
          : parseFloat(areaInSquareMeters.toFixed(2)),
      center: { lat: center[1], lng: center[0] } as L.LatLng,
      coordinates: [...latlngCoordinates, latlngCoordinates[0]],
      unit: areaInSquareMeters > 10000 ? 'km²' : 'm²',
    };
  }

  manipulateEnabledToolButton(toolEnabled: string, type: string): string {
    return !toolEnabled ? type : toolEnabled === type ? null : type;
  }

  createDefaultBasemapLayers(groupName: string): IMenuLayer {
    const initiateLayers = [
      { name: '1', url: 'https://tile.openstreetmap.org/${z}/${x}/${y}.png' },
      { name: '2', url: 'http://a.tile.stamen.com/toner/${z}/${x}/${y}.png' },
      {
        name: '3',
        url: 'https://maptiles.p.rapidapi.com/en/map/v1/{z}/{x}/{y}.png',
      },
    ];

    const layers: {
      id?: number;
      icon: string;
      description: string;
      groupName?: string;
      queryable: boolean;
      checked?: string;
      selected?: boolean;
      hide?: boolean;
      hasError?: boolean;
      image?: string;
      exportable: boolean;
    }[] = initiateLayers.map((x, i) => ({
      id: ++i,
      image: 'assets/icon/OSM.png',
      description: x.name,
      groupName,
      queryable: false,
      checked: i === 0 ? 'true' : 'false',
      selected: i === 0 ? true : false,
      exportable: false,
      hasError: false,
      icon: null as string,
    }));
    return {
      group: groupName,
      collapse: false,
      queryable: false,
      layers,
    };
  }

  createLegendImage(mapServerRequestBaseUrl: string, layer: string): string {
    const legendUrl = `${mapServerRequestBaseUrl}&service=WMS&request=GetLegendGraphic&layer=${layer}&format=image%2Fpng&version=1.1.1`;
    return legendUrl;
  }

  deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  dowloadShapefile(
    params: IMapServerRequest,
    outputFormat: string,
    crs: string
  ) {
    let mapurl;
    const mapServerUrl =
      window.location.protocol +
      '//' +
      this.configuration.map.mapserver +
      '/' +
      this.configuration.map.mapservexe;
    if (params.mapfile) {
      if (this.configuration.map.useWrappedMS) {
        mapurl =
          window.location.protocol +
          '//' +
          this.configuration.map.mapserver +
          '/' +
          params.mapfile
            .split('\\')
            [params.mapfile.split('\\').length - 1].split('.')[0];
      } else {
        mapurl = mapServerUrl + '?map=' + params.mapfile;
      }
    } else {
      mapurl = params.url;
    }

    const defaultProjection = this.configuration.map.defaultProjectionCode;

    // const mapurl = params.mapfile
    //   ? mapServerUrl + '?map=' + params.mapfile
    //   : params.url;

    const url =
      mapurl +
      '&service=wfs&SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&TYPENAME=' +
      params.typename +
      '&outputFormat=' +
      outputFormat +
      '&outfile=nf.zip&SRSname=' +
      crs;

    // console.log(url);
    window.open(url, '_blank');
  }

  getBboxBasedOnPixels(
    bbox: string[],
    mymap: L.Map,
    tolerance: number = 10
  ): string[] {
    // const tolerance = 10; //in pixels
    const bboxCenterX: number = (parseFloat(bbox[0]) + parseFloat(bbox[2])) / 2;
    const bboxCenterY: number = (parseFloat(bbox[1]) + parseFloat(bbox[3])) / 2;
    const mapHeight = mymap.getSize().y; //in pixels
    const mapBounds =
      mymap.getBounds().getNorth() - mymap.getBounds().getSouth(); //in length coordinates
    const toleranceInCoords = (tolerance / mapHeight) * mapBounds;
    const newBboxLeftX = bboxCenterX - toleranceInCoords;
    const newBboxLeftY = bboxCenterY - toleranceInCoords;
    const newBboxRightX = bboxCenterX + toleranceInCoords;
    const newBboxRightY = bboxCenterY + toleranceInCoords;

    const result = [
      newBboxLeftX + '',
      newBboxLeftY + '',
      newBboxRightX + '',
      newBboxRightY + '',
    ];
    if (bbox.length === 5) {
      result.push(bbox[4]);
    }
    return result;
  }

  convertGeojsonFeatureToTargetCrs(
    geojsonFeature: turf.helpers.Feature<turf.helpers.Geometry>,
    defaultCrs: string,
    targetCrs: string
  ): turf.helpers.Feature<turf.helpers.Geometry> {
    const geojsonObj = geojsonFeature as any;
    geojsonObj.geometry.coordinates.forEach((coord1, index1) => {
      //is coordinate pair
      if (
        Array.isArray(coord1) &&
        coord1.length === 2 &&
        typeof coord1[0] === 'number'
      ) {
        geojsonObj.geometry.coordinates[index1] = this.convertCoordinates(
          defaultCrs,
          targetCrs,
          coord1
        );
      } else if (Array.isArray(coord1)) {
        coord1.forEach((coord2, index2) => {
          if (
            Array.isArray(coord2) &&
            coord2.length === 2 &&
            typeof coord2[0] === 'number'
          ) {
            geojsonObj.geometry.coordinates[index1][index2] =
              this.convertCoordinates(defaultCrs, targetCrs, coord2);
          } else if (Array.isArray(coord2)) {
            coord2.forEach((coord3, index3) => {
              if (
                Array.isArray(coord3) &&
                coord3.length === 2 &&
                typeof coord3[0] === 'number'
              ) {
                geojsonObj.geometry.coordinates[index1][index2][index3] =
                  this.convertCoordinates(defaultCrs, targetCrs, coord3);
              }
            });
          }
        });
      }
    });

    if (
      Array.isArray(geojsonObj.geometry.coordinates) &&
      geojsonObj.geometry.coordinates.length === 2 &&
      typeof geojsonObj.geometry.coordinates[0] === 'number'
    ) {
      geojsonObj.geometry.coordinates = this.convertCoordinates(
        defaultCrs,
        targetCrs,
        geojsonObj.geometry.coordinates
      );
    }

    return geojsonObj as turf.helpers.Feature<turf.helpers.Geometry>;
  }

  convertGeojsonCollectionToTargetCrs(
    geojsonCollection: turf.helpers.Feature<turf.helpers.GeometryCollection>,
    defaultCrs: string,
    targetCrs: string
  ): turf.helpers.Feature<turf.helpers.GeometryCollection> {
    //TODO

    //convert geojsonObject to data.crs
    const newGeojson = [];
    let newGeojsonCollection;
    // eslint-disable-next-line @typescript-eslint/dot-notation
    if (geojsonCollection['features'].length > 0) {
      // eslint-disable-next-line @typescript-eslint/dot-notation
      geojsonCollection['features'].forEach((feat, index0: number) => {
        const feature = this.deepClone(
          feat
        ) as turf.helpers.Feature<turf.helpers.Geometry>;
        newGeojson[index0] = this.convertGeojsonFeatureToTargetCrs(
          feature,
          defaultCrs,
          targetCrs
        );
      });
      // console.log('beforechange', newGeojson);
      newGeojsonCollection = {
        features: newGeojson,
        crs: {
          type: 'name',
          properties: {
            name: targetCrs,
          },
        },
        type: 'featureCollection',
      };
    }
    return newGeojsonCollection;
  }

  convertAuthorizationCrsToCrs(crs: string) {
    if (crs.split(':').length === 2) {
      return crs;
    } else if (crs.split(':').length > 2) {
      const crsArray = crs.split(':');
      return (
        crsArray[crsArray.length - 2] + ':' + crsArray[crsArray.length - 1]
      );
    } else {
      return crs;
    }
  }

  xmlToJson(xml: string) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    return this.ngxXml2jsonService.xmlToJson(doc);
  }

  editLayerFeatureMode(featureId: number, layerName: string): void {}
}
