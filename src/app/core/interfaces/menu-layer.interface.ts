import { IEsriImage } from './esri-image.interface';

export interface IMenuLayer {
  group: string;
  queryable?: boolean;
  hide?: boolean;
  checked?: boolean;
  collapse?: boolean;
  layers: IMenuLayers[];
}

export interface IMenuLayers {
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
  esriImage?: IEsriImage[];
  exportable: boolean;
}
