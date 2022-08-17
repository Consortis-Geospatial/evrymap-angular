import { createSelector } from '@ngrx/store';
import * as fromApp from '../app.reducer';
import * as fromSubheaderReducer from '../reducers/subheader.reducer';

const selectSubheaderState = createSelector(
  fromApp.selectAppState,
  (state: fromApp.AppState) => state.subheader
);

export const selectSearchResultEntities = createSelector(
  selectSubheaderState,
  fromSubheaderReducer.selectEntities
);

export const selectAllSearchResults = createSelector(
  selectSubheaderState,
  fromSubheaderReducer.selectAll
);

export const selectSearchResultIsLoading = createSelector(
  selectSubheaderState,
  (state) => state.loading
);

export const selectSearchResultError = createSelector(
  selectSubheaderState,
  (state) => state.error
);

export const selectEditClicked = createSelector(
  selectSubheaderState,
  (state) => state.editClicked
);

export const selectDisableHistory = createSelector(
  selectSubheaderState,
  (state) => state.disableHistory
);

export const selectRectangleSearchClicked = createSelector(
  selectSubheaderState,
  (state) => state.rectangleSearchClicked
);

export const selectPointSearchClicked = createSelector(
  selectSubheaderState,
  (state) => state.pointSearchClicked
);
