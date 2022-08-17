import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, on } from '@ngrx/store';
import { IError } from 'src/app/core/interfaces/error.interface';
import { SearchResultModel } from 'src/app/core/models/search-result.model';
import * as SubheaderActions from '../actions/subheader.actions';

export interface State extends EntityState<SearchResultModel> {
  loading: boolean;
  error: IError;
  editClicked: boolean;
  disableHistory: { next: boolean; previous: boolean };
  rectangleSearchClicked: boolean;
  pointSearchClicked: boolean;
}

export const adapter: EntityAdapter<SearchResultModel> =
  createEntityAdapter<SearchResultModel>();

const initialState: State = adapter.getInitialState({
  loading: false,
  error: null,
  editClicked: false,
  disableHistory: { next: true, previous: true },
  rectangleSearchClicked: false,
  pointSearchClicked: false,
});

const reducer = createReducer(
  initialState,
  on(SubheaderActions.searchResultLoading, (state, { payload }) => ({
    ...state,
    loading: payload.loading,
  })),
  on(SubheaderActions.searchResultActionFail, (state, { payload }) => ({
    ...state,
    error: payload.error,
    loading: false,
  })),
  on(SubheaderActions.clearError, (state) => ({ ...state, error: null })),
  on(SubheaderActions.readSearchResults, (state) => ({ ...state })),
  on(SubheaderActions.searchResultsRead, (state, { payload }) =>
    adapter.setAll(payload.searchResults, state)
  ),
  on(SubheaderActions.clearSearchResults, (state) => adapter.setAll([], state)),

  on(SubheaderActions.editClicked, (state, { payload }) => ({
    ...state,
    editClicked: payload.editClicked,
  })),
  on(SubheaderActions.disableHistory, (state, { payload }) => ({
    ...state,
    disableHistory: payload.disableHistory,
  })),
  on(SubheaderActions.rectangleSearchClicked, (state, { payload }) => ({
    ...state,
    rectangleSearchClicked: payload.rectangleSearchClicked,
  })),
  on(SubheaderActions.pointSearchClicked, (state, { payload }) => ({
    ...state,
    pointSearchClicked: payload.pointSearchClicked,
  }))
);

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function subheaderReducer(
  state: State | undefined,
  action: Action
): State {
  return reducer(state, action);
}

export const { selectAll, selectEntities, selectIds, selectTotal } =
  adapter.getSelectors();
