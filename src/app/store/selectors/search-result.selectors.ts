import { createSelector } from '@ngrx/store';
import * as fromApp from '../app.reducer';
import * as fromSearchResultReducer from '../reducers/search-result.reducer';

const selectSearchResultState = createSelector(
  fromApp.selectAppState,
  (state: fromApp.AppState) => state.searchResults
);

export const selectSearchResultEntities = createSelector(
  selectSearchResultState,
  fromSearchResultReducer.selectEntities
);

export const selectAllSearchResults = createSelector(
  selectSearchResultState,
  fromSearchResultReducer.selectAll
);

export const selectSearchResultIsLoading = createSelector(
  selectSearchResultState,
  (state) => state.loading
);

export const selectSearchResultError = createSelector(
  selectSearchResultState,
  (state) => state.error
);

export const selectSearchCollapsed = createSelector(
  selectSearchResultState,
  (state) => state.searchCollapsed
);
