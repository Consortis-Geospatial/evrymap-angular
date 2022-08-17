export interface IEsriServerRequest {
  url?: string;
  f?: string;
  tolerance?: number;
  layers?: string;
  mapExtent?: string;
  geometryType?: string;
  geometry?: string;
  imageDisplay?: string;
  outSR?: number;
  inSR?: number;
  esriLayersID?: string;
  sr?: number;
}
