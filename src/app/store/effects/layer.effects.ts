/* eslint-disable space-before-function-paren */
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { catchError, mergeMap, switchMap } from 'rxjs/operators';
import { HttpCallsService } from 'src/app/services/http-calls.service';
import { MapService } from 'src/app/services/map.service';
import * as LayerActions from '../actions/layer.actions';
import { AppState } from '../app.reducer';

@Injectable()
export class LayerEffects {
  getWXSxml$ = createEffect(() =>
    this.actions$.pipe(
      ofType(LayerActions.wxsSend),
      switchMap(({ payload }) => {
        this.store.dispatch(
          LayerActions.layerLoading({
            payload: { loading: true },
          })
        );

        return this.httpCallsService.sendWXS(payload.url).pipe(
          mergeMap((response) => {
            const res = this.mapService.xmlToJson(response);

            this.store.dispatch(
              LayerActions.wxsSendComplete({
                payload: {
                  xml: res,
                },
              })
            );
            return of(
              LayerActions.layerLoading({
                payload: { loading: false },
              })
            );
          }),
          catchError((error) =>
            of(
              LayerActions.layerActionFail({
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
    private httpCallsService: HttpCallsService,
    private mapService: MapService
  ) {}
}
