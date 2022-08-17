import { createSelector } from '@ngrx/store';
import * as fromApp from '../app.reducer';
import * as fromToolsReducer from '../reducers/tools.reducer';

const selectToolsState = createSelector(
  fromApp.selectAppState,
  (state: fromApp.AppState) => state.tools
);

export const selectMeasureLinePolygon = createSelector(
  selectToolsState,
  (state) => state.measureLinePolygonOn
);

