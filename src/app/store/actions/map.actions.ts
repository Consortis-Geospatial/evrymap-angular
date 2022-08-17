/* eslint-disable @typescript-eslint/naming-convention */
import { createAction, props } from '@ngrx/store';
import { IMenuLayer } from 'src/app/core/interfaces/menu-layer.interface';

export enum MapActionTypes {
  MenuLayersObject = '[Map] Menu Layers Object',
  MenuBasemaps = '[Map] Menu Basemaps',
  MenuLayers = '[Map] Menu Layers',
  SidebarContentId = '[Map] Sidebar Content Id',
  ControlScale = '[Map] Control Scale',
  MapLoading = '[Map] Loading',
}

export const menuLayersObject = createAction(
  MapActionTypes.MenuLayersObject,
  props<{
    payload: {
      menuLayers: {
        basemaps: IMenuLayer[];
        layers: IMenuLayer[];
      };
    };
  }>()
);

export const menuBasemaps = createAction(
  MapActionTypes.MenuBasemaps,
  props<{ payload: { basemaps: IMenuLayer[] } }>()
);

export const menuLayers = createAction(
  MapActionTypes.MenuLayers,
  props<{ payload: { layers: IMenuLayer[] } }>()
);

export const sidebarContentId = createAction(
  MapActionTypes.SidebarContentId,
  props<{ payload: { sidebarContentId: string } }>()
);

export const controlScale = createAction(
  MapActionTypes.ControlScale,
  props<{ payload: { scale: { kilometers: string; miles: string } } }>()
);

export const mapLoading = createAction(
  MapActionTypes.MapLoading,
  props<{ payload: { loading: boolean } }>()
);
