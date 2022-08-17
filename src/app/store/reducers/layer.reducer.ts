import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, on } from '@ngrx/store';
import { IError } from 'src/app/core/interfaces/error.interface';
import { LayerModel } from 'src/app/core/models/layer.model';
import * as LayerActions from '../actions/layer.actions';

export interface State extends EntityState<LayerModel> {
  loading: boolean;
  error: IError;
  wxsXML: any;
  addWMSlayer: boolean;
  wmsLayer: any[];
}

export const adapter: EntityAdapter<LayerModel> =
  createEntityAdapter<LayerModel>();

const initialState: State = adapter.getInitialState({
  loading: false,
  error: null,
  wxsXML: null,
  addWMSlayer: null,
  wmsLayer: null,
});

const reducer = createReducer(
  initialState,
  on(LayerActions.layerLoading, (state, { payload }) => ({
    ...state,
    loading: payload.loading,
  })),
  on(LayerActions.layerActionFail, (state, { payload }) => ({
    ...state,
    error: payload.error,
    loading: false,
  })),
  on(LayerActions.clearError, (state) => ({ ...state, error: null })),
  on(LayerActions.readLayers, (state) => ({ ...state })),
  on(LayerActions.layersRead, (state, { payload }) =>
    adapter.setAll(payload.layers, state)
  ),
  on(LayerActions.clearLayers, (state) => adapter.setAll([], state)),
  on(LayerActions.wxsSend, (state, {}) => ({
    ...state,
  })),
  on(LayerActions.wxsSendComplete, (state, { payload }) => ({
    ...state,
    wxsXML: payload.xml,
  })),
  on(LayerActions.addWmsLayer, (state, { payload }) => ({
    ...state,
    addWMSlayer: payload.addWMSlayer,
    wmsLayer: payload.wmsLayer,
  }))
);

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function layerReducer(state: State | undefined, action: Action): State {
  return reducer(state, action);
}

export const { selectAll, selectEntities, selectIds, selectTotal } =
  adapter.getSelectors();
