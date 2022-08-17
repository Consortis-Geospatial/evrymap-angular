import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, mergeMap, switchMap } from 'rxjs/operators';
import { HttpCallsService } from 'src/app/services/http-calls.service';
import * as SubheaderActions from '../actions/subheader.actions';
import * as SearchResultActions from '../actions/search-result.actions';
import { AppState } from '../app.reducer';

@Injectable()
export class SubheaderEffects {
  getAddressSearchResults$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SubheaderActions.readSearchResults),
      switchMap(({ payload }) => {
        this.store.dispatch(
          SubheaderActions.searchResultLoading({
            payload: { loading: true },
          })
        );

        return this.httpCallsService
          .searchAddress(payload.searchValue, payload.addressMode)
          .pipe(
            mergeMap((response) => {
              this.store.dispatch(
                SubheaderActions.searchResultsRead({
                  payload: {
                    searchResults: [{ id: 1, layers: [], address: response }],
                  },
                })
              );

              if (payload.isEnterPressed) {
                this.store.dispatch(
                  SearchResultActions.searchResultsRead({
                    payload: {
                      searchResults: [{ id: 1, layers: [], address: response }],
                    },
                  })
                );
              }
              return of(
                SubheaderActions.searchResultLoading({
                  payload: { loading: false },
                })
              );
            }),
            catchError((error) =>
              of(
                SubheaderActions.searchResultActionFail({
                  payload: { error },
                })
              )
            )
          );
      })
    )
  );

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private httpCallsService: HttpCallsService
  ) {}
}
