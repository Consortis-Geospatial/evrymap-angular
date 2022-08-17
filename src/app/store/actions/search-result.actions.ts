/* eslint-disable @typescript-eslint/naming-convention */
import { createAction, props } from '@ngrx/store';
import { IConfigurationLayer } from 'src/app/core/interfaces/configuration.interface';
import { IError } from 'src/app/core/interfaces/error.interface';
import { IMapServerRequest } from 'src/app/core/interfaces/map-server-request.interface';
import { SearchResultModel } from 'src/app/core/models/search-result.model';

export enum SearchResultActionTypes {
  SearchResultLoading = '[Search Results] Search Result Loading',
  GetLayersForSearch = '[Search Results] Search Results Get Layers For Search',
  ReadSearchResults = '[Search Results] Read Search Results',
  ReadAdvancedSearchResults = '[Search Results] Read Advanced Search Results',
  SearchResultsRead = '[Search Results] Search Results Read',
  ReadSearchResultsESRI = '[Search Results] Read Search Results ESRI',
  ReadSearchResultsOGRE = '[Search Results] Read Search Results OGRE',
  SearchResultActionFail = '[Search Results] Search Result Fail',
  SearchResultClearError = '[Search Results] Clear Error',
  ClearSearchResults = '[Search Results] Clear Search Results',
  SearchCollapsed = '[Search Results] Search Collapsed',
}

export const searchResultLoading = createAction(
  SearchResultActionTypes.SearchResultLoading,
  props<{ payload: { loading: boolean } }>()
);

export const getLayersForSearch = createAction(
  SearchResultActionTypes.GetLayersForSearch,
  props<{
    payload: {
      configuration: IConfigurationLayer[];
      bbox: number[];
      queryParameters: IMapServerRequest;
      queryType: string;
    };
  }>()
);

export const readSearchResults = createAction(
  SearchResultActionTypes.ReadSearchResults,
  props<{
    payload: {
      configuration: IConfigurationLayer;
      bbox: number[];
      counter: number;
    };
  }>()
);

export const readSearchResultsESRI = createAction(
  SearchResultActionTypes.ReadSearchResultsESRI,
  props<{
    payload: {
      configuration: IConfigurationLayer;
      bbox: number[];
      counter: number;
      type: string;
    };
  }>()
);

export const readSearchResultsOGRE = createAction(
  SearchResultActionTypes.ReadSearchResultsOGRE,
  props<{
    payload: {
      configuration: IConfigurationLayer;
      bbox: number[];
      counter: number;
      type: string;
    };
  }>()
);

export const readAdvancedSearchResults = createAction(
  SearchResultActionTypes.ReadAdvancedSearchResults,
  props<{
    payload: {
      body: { mapfile?: string; url?: string; xmlRequest: string };
    };
  }>()
);

export const searchResultsRead = createAction(
  SearchResultActionTypes.SearchResultsRead,
  props<{ payload: { searchResults: SearchResultModel[] } }>()
);

export const searchResultActionFail = createAction(
  SearchResultActionTypes.SearchResultActionFail,
  props<{ payload: { error: IError } }>()
);

export const clearError = createAction(
  SearchResultActionTypes.SearchResultClearError
);

export const clearSearchResults = createAction(
  SearchResultActionTypes.ClearSearchResults
);

export const searchCollapsed = createAction(
  SearchResultActionTypes.SearchCollapsed,
  props<{ payload: { searchCollapsed: boolean } }>()
);
