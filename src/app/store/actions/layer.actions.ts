/* eslint-disable @typescript-eslint/naming-convention */
import { createAction, props } from '@ngrx/store';
import { IError } from 'src/app/core/interfaces/error.interface';
import { LayerModel } from 'src/app/core/models/layer.model';

export enum LayerActionTypes {
  LayerLoading = '[Layers] Layer Loading',
  ReadLayers = '[Layers] Read Layers',
  LayersRead = '[Layers] Layers Read',
  LayerActionFail = '[Layers] Layer Fail',
  LayerClearError = '[Layers] Clear Error',
  ClearLayers = '[Layers] Clear Layers',
  WXSsend = '[Layers] Send WXS',
  WXSsendComplete = '[Layers] Send WXS Complete',
  addWMSlayer = '[Layers] Add Wms Layer',
}

export const layerLoading = createAction(
  LayerActionTypes.LayerLoading,
  props<{ payload: { loading: boolean } }>()
);

export const readLayers = createAction(
  LayerActionTypes.ReadLayers,
  props<{ payload: { description: string } }>()
);

export const layersRead = createAction(
  LayerActionTypes.LayersRead,
  props<{ payload: { layers: LayerModel[] } }>()
);

export const layerActionFail = createAction(
  LayerActionTypes.LayerActionFail,
  props<{ payload: { error: IError } }>()
);

export const wxsSend = createAction(
  LayerActionTypes.WXSsend,
  props<{ payload: { url: string } }>()
);

export const wxsSendComplete = createAction(
  LayerActionTypes.WXSsendComplete,
  props<{ payload: { xml: any } }>()
);

export const addWmsLayer = createAction(
  LayerActionTypes.addWMSlayer,
  props<{ payload: { addWMSlayer: boolean; wmsLayer: any[] } }>()
);

export const clearError = createAction(LayerActionTypes.LayerClearError);

export const clearLayers = createAction(LayerActionTypes.ClearLayers);
