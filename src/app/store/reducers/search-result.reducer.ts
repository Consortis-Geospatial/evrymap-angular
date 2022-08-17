import { createEntityAdapter, EntityAdapter, EntityState } from '@ngrx/entity';
import { Action, createReducer, on } from '@ngrx/store';
import { IError } from 'src/app/core/interfaces/error.interface';
import { SearchResultModel } from 'src/app/core/models/search-result.model';
import * as SearchResultActions from '../actions/search-result.actions';

export interface State extends EntityState<SearchResultModel> {
  searchCollapsed: boolean;
  loading: boolean;
  error: IError;
}

export const adapter: EntityAdapter<SearchResultModel> =
  createEntityAdapter<SearchResultModel>();

const initialState: State = adapter.getInitialState({
  searchCollapsed: true,
  loading: false,
  error: null,
});

const reducer = createReducer(
  initialState,
  on(SearchResultActions.searchResultLoading, (state, { payload }) => ({
    ...state,
    loading: payload.loading,
  })),
  on(SearchResultActions.searchResultActionFail, (state, { payload }) => ({
    ...state,
    error: payload.error,
    loading: false,
  })),
  on(SearchResultActions.clearError, (state) => ({ ...state, error: null })),
  on(SearchResultActions.readSearchResults, (state) => ({ ...state })),
  on(SearchResultActions.readSearchResultsESRI, (state) => ({ ...state })),
  on(SearchResultActions.readSearchResultsOGRE, (state) => ({ ...state })),
  on(SearchResultActions.readAdvancedSearchResults, (state) => ({ ...state })),
  on(SearchResultActions.searchResultsRead, (state, { payload }) =>
    adapter.setAll(payload.searchResults, state)
  ),
  on(SearchResultActions.clearSearchResults, (state) =>
    adapter.setAll([], state)
  ),
  on(SearchResultActions.searchCollapsed, (state, { payload }) => ({
    ...state,
    searchCollapsed: payload.searchCollapsed,
  }))
);

// eslint-disable-next-line prefer-arrow/prefer-arrow-functions
export function searchResultReducer(
  state: State | undefined,
  action: Action
): State {
  return reducer(state, action);
}

export const { selectAll, selectEntities, selectIds, selectTotal } =
  adapter.getSelectors();
