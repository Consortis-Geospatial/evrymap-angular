import { createSelector } from '@ngrx/store';
import * as fromApp from '../app.reducer';
import * as fromLayerReducer from '../reducers/layer.reducer';

const selectLayerState = createSelector(
  fromApp.selectAppState,
  (state: fromApp.AppState) => state.layers
);

export const selectLayerEntities = createSelector(
  selectLayerState,
  fromLayerReducer.selectEntities
);

export const selectAllLayers = createSelector(
  selectLayerState,
  fromLayerReducer.selectAll
);

export const selectLayerIsLoading = createSelector(
  selectLayerState,
  (state) => state.loading
);

export const selectLayerError = createSelector(
  selectLayerState,
  (state) => state.error
);

export const selectWXSresult = createSelector(
  selectLayerState,
  (state) => state.wxsXML
);

export const selectAddWMSLayer = createSelector(
  selectLayerState,
  (state) => state.addWMSlayer
);

export const selectWMSLayer = createSelector(
  selectLayerState,
  (state) => state.wmsLayer
);
