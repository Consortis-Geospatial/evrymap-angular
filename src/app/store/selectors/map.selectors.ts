import { createSelector } from '@ngrx/store';
import * as fromApp from '../app.reducer';

const selectSubheaderState = createSelector(
  fromApp.selectAppState,
  (state: fromApp.AppState) => state.map
);

export const selectMapLayersObject = createSelector(
  selectSubheaderState,
  (state) => state.menuLayers
);

export const selectMapBasemaps = createSelector(
  selectSubheaderState,
  (state) => state.menuLayers.basemaps
);

export const selectMapLayers = createSelector(
  selectSubheaderState,
  (state) => state.menuLayers.layers
);

export const selectSidebarContentId = createSelector(
  selectSubheaderState,
  (state) => state.sidebarContentId
);

export const selectControlScale = createSelector(
  selectSubheaderState,
  (state) => state.controlScale
);

export const selectMapLoading = createSelector(
  selectSubheaderState,
  (state) => state.loading
);
