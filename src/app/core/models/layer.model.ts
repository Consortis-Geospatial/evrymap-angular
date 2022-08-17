import { IConfigurationLayer } from 'src/app/core/interfaces/configuration.interface';

export interface ILayer {
  layer?: L.Layer;
  properties: IConfigurationLayer;
  selected?: boolean;
  id?: number;
}

export class LayerModel implements ILayer {
  layer?: L.Layer;
  properties: IConfigurationLayer;
  selected?: boolean;
  id?: number;

  constructor(value?: ILayer) {
    if (value) {
      Object.assign(this, value);
    }
  }
}
