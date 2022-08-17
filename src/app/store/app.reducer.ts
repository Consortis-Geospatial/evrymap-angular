import { ActionReducerMap } from '@ngrx/store';
import * as fromLayer from './reducers/layer.reducer';
import * as fromSearchResult from './reducers/search-result.reducer';
import * as fromSubheader from './reducers/subheader.reducer';
import * as fromMap from './reducers/map.reducer';
import * as fromTools from './reducers/tools.reducer';

export interface AppState {
  layers: fromLayer.State;
  searchResults: fromSearchResult.State;
  subheader: fromSubheader.State;
  map: fromMap.State;
  tools: fromTools.State;
}

export const appReducer: ActionReducerMap<AppState> = {
  layers: fromLayer.layerReducer,
  searchResults: fromSearchResult.searchResultReducer,
  subheader: fromSubheader.subheaderReducer,
  map: fromMap.mapReducer,
  tools: fromTools.toolsReducer,
};

export const selectAppState = (state: AppState): AppState => state;
