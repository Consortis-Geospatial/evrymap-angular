import { Action, createReducer, on } from '@ngrx/store';
import { IMenuLayer } from 'src/app/core/interfaces/menu-layer.interface';
import * as MapActions from '../actions/map.actions';

export interface State {
  menuLayers: {
    basemaps: IMenuLayer[];
    layers: IMenuLayer[];
  };
  sidebarContentId: string;
  controlScale: { kilometers: string; miles: string };
  loading: boolean;
}

const initialState: State = {
  menuLayers: {
    basemaps: [],
    layers: [],
  },
  sidebarContentId: null,
  controlScale: { kilometers: null, miles: null },
  loading: false,
};

const reducer = createReducer(
  initialState,
  on(MapActions.menuLayersObject, (state, { payload }) => ({
    ...state,
    menuLayers: payload.menuLayers,
  })),
  on(MapActions.menuBasemaps, (state, { payload }) => ({
    ...state,
    menuLayers: { ...state.menuLayers, basemaps: payload.basemaps },
  })),
  on(MapActions.menuLayers, (state, { payload }) => ({
    ...state,
    menuLayers: { ...state.menuLayers, layers: payload.layers },
  })),
  on(MapActions.sidebarContentId, (state, { payload }) => ({
    ...state,
    sidebarContentId: payload.sidebarContentId,
  })),
  on(MapActions.controlScale, (state, { payload }) => ({
    ...state,
    controlScale: payload.scale,
  })),
  on(MapActions.mapLoading, (state, { payload }) => ({
    ...state,
    loading: payload.loading,
  }))
);

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function mapReducer(state: State | undefined, action: Action): State {
  return reducer(state, action);
}
