/* eslint-disable @typescript-eslint/naming-convention */
import { createAction, props } from '@ngrx/store';
import { IError } from 'src/app/core/interfaces/error.interface';
import { SearchResultModel } from 'src/app/core/models/search-result.model';

export enum SubheaderActionTypes {
  SearchResultLoading = '[Subheader] Search Result Loading',
  ReadSearchResults = '[Subheader] Read Search Results',
  SearchResultsRead = '[Subheader] Search Results Read',
  SearchResultActionFail = '[Subheader] Search Result Fail',
  SearchResultsClearError = '[Subheader] Clear Error',
  ClearSearchResults = '[Subheader] Clear Search Results',
  EditClicked = '[Subheader] Edit Clicked',
  DisableHistory = '[Subheader] Disable History',
  RectangleSearchClicked = '[Subheader] Rectangle Search Clicked',
  PointSearchClicked = '[Subheader] Point Search Clicked',
}

export const searchResultLoading = createAction(
  SubheaderActionTypes.SearchResultLoading,
  props<{ payload: { loading: boolean } }>()
);

export const readSearchResults = createAction(
  SubheaderActionTypes.ReadSearchResults,
  props<{
    payload: {
      searchValue: string;
      addressMode: string;
      isEnterPressed: boolean;
    };
  }>()
);

export const searchResultsRead = createAction(
  SubheaderActionTypes.SearchResultsRead,
  props<{ payload: { searchResults: SearchResultModel[] } }>()
);

export const searchResultActionFail = createAction(
  SubheaderActionTypes.SearchResultActionFail,
  props<{ payload: { error: IError } }>()
);

export const clearError = createAction(
  SubheaderActionTypes.SearchResultsClearError
);

export const clearSearchResults = createAction(
  SubheaderActionTypes.ClearSearchResults
);

export const editClicked = createAction(
  SubheaderActionTypes.EditClicked,
  props<{ payload: { editClicked: boolean } }>()
);

export const disableHistory = createAction(
  SubheaderActionTypes.DisableHistory,
  props<{ payload: { disableHistory: { next: boolean; previous: boolean } } }>()
);

export const rectangleSearchClicked = createAction(
  SubheaderActionTypes.RectangleSearchClicked,
  props<{ payload: { rectangleSearchClicked: boolean } }>()
);

export const pointSearchClicked = createAction(
  SubheaderActionTypes.PointSearchClicked,
  props<{ payload: { pointSearchClicked: boolean } }>()
);
