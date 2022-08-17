import { IEsriImage } from './esri-image.interface';
import * as geojson from 'geojson';
import { IMenuLayer, IMenuLayers } from './menu-layer.interface';

export interface IConfiguration {
  name?: string; //view name
  general: {
    proxyUrl?: string;
    loadEditMod?: boolean;
    siteTitle: string;
    logoTitle: string;
    siteLogo: string;
    loadHeader?: boolean;
    language?: string;
    searchAddressMode?: string;
    ogrApi?: string;
    helpUrl?: string;
  };
  layout?: {
    navigation?: boolean;
    quickSearch?: boolean;
    print?: boolean;
    legendControl?: boolean;
    measureTools?: boolean;
    saveView?: boolean;
    advancedFilters?: boolean;
    menuLayers?: IMenuLayer[];
    footerLink: { text: string; url: string };
    tooltips: boolean;
  };
  map: {
    mapserver: string;
    mapservexe: string;
    useWrappedMS: boolean;
    // mapServerExeUrl: string;
    initZoomLevel: number;
    center: unknown;
    projections: {
      code: string;
      description: string;
    }[];
    defaultProjectionCode: string;
    mapExtent: number[][];
    xyZoomLevel: number;
    addressCountrySearch: string;
  };
  layers: IConfigurationLayer[];
}
export interface IConfigurationLayer {
  opacity?: number; //for view
  layerId?: number;
  name: string;
  type: string;
  label?: string;
  displayOnStartup?: boolean;
  esriLayersID?: number[];
  menuLayers: {
    type: string;
    typeGroup: string;
    image?: string;
    esriImage?: IEsriImage[];
  };
  bingKey?: string;
  bingStyle?: string;
  group?: string;
  url?: string;
  geojsonStyle?: {
    weight: number;
    color: string;
    fillColor: string;
    opacity?: number;
    fillOpacity?: number;
    radius: number;
  };
  _external?: boolean;
  ogreFile?: File;
  ogreGeoJSON?: geojson.GeoJsonObject;
  ogreSourceSrs?: string;
  outputFormat?: string;
  defaultCrs?: string; //for use with getFeature and external layers
  projection?: string;
  mapfile?: string;
  queryable?: boolean;
  searchFields?: { name?: string; description?: string; link?: boolean }[];
  identifyFields?: { name?: string; description?: string }[];
  tiled?: boolean;
  groupLegendImg?: string;
  exportable?: boolean;
  relation?: {
    localField?: string;
    getRelatedFn?: string;
    editRelatedFn?: string;
    serviceUrl?: string;
    functionName?: string;
    description?: string;
    position?: string;
  }[];

  customRecordAction?: {
    tooltip: string;
    action: string;
    glyphicon: string;
  };
  timeSettings?: {
    unit: string;
    format: string;
    dateSeparator: string;
    min: string;
    max: string;
    step: number;
  };
  legendImage?: string;
  legendWidthHeight?: { width: number; height: number };
  color?: string;
  lineWidth?: number;
  allowHover?: boolean;
  contextMenu?: {
    text: string;
    classname?: string;
    image?: string;
    hyperlink?: string;
    callback?: string;
    googleMaps?: boolean;
    googleStreetView?: boolean;
    hyperlinkField?: boolean;
    fieldName?: string;
    fieldDescription?: string;
  }[];
  edit?: {
    primaryKey?: string;
    geometryColumn?: string;
    geometryType?: string; // polygon, line, point, marker
    multi?: boolean;
    fields?: {
      name?: string;
      type?: string;
      label?: string;
      required?: boolean;
      maxLength?: number;
      readOnly?: boolean;
      dropdown?: boolean;
      dropdownValueField: string;
      dropdownDescriptionField: string;
      dropdownService?: string;

      readOnlyOnEdit?: boolean;
      control?: string;
      serviceUrl?: string;
      values?: string[];
    }[];
    snappingLayers?: string[];
    serviceUrl?: string;
  };
}
