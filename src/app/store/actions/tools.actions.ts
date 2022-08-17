/* eslint-disable @typescript-eslint/naming-convention */
import { createAction, props } from '@ngrx/store';
import { IError } from 'src/app/core/interfaces/error.interface';
import { LayerModel } from 'src/app/core/models/layer.model';

export enum ToolActionTypes {
  MeasureLinePolygon = '[Tools] Measure Line Polygon',
}

export const measureLinePolygon = createAction(
  ToolActionTypes.MeasureLinePolygon,
  props<{ payload: { measureLinePolygonOn: boolean } }>()
);

