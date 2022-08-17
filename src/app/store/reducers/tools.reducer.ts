import { Action, createReducer, on } from '@ngrx/store';
import { IMenuLayer } from 'src/app/core/interfaces/menu-layer.interface';
import * as ToolsActions from '../actions/tools.actions';

export interface State {
  measureLinePolygonOn: boolean;
}

const initialState: State = {
  measureLinePolygonOn: null,
};

const reducer = createReducer(
  initialState,
  on(ToolsActions.measureLinePolygon, (state, { payload }) => ({
    ...state,
    measureLinePolygonOn: payload.measureLinePolygonOn,
  })),

);

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function toolsReducer(
  state: State | undefined,
  action: Action
): State {
  return reducer(state, action);
}
