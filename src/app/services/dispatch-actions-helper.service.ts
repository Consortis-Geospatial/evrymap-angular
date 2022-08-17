import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as LayerActions from 'src/app/store/actions/layer.actions';
import * as SearchResultActions from 'src/app/store/actions/search-result.actions';
import * as SubheaderActions from 'src/app/store/actions/subheader.actions';
import * as MapActions from 'src/app/store/actions/map.actions';
import * as ToolsActions from 'src/app/store/actions/tools.actions';
import { AppState } from 'src/app/store/app.reducer';
import { IConfigurationLayer } from '../core/interfaces/configuration.interface';
import { IMapServerRequest } from '../core/interfaces/map-server-request.interface';
import { ILayer } from '../core/models/layer.model';
import { IMenuLayer } from '../core/interfaces/menu-layer.interface';

@Injectable({
  providedIn: 'root',
})
export class DispatchActionsHelperService {
  constructor(private store: Store<AppState>) {}

  // layers state object
  dispatchLayers(layersArray: ILayer[]) {
    const newLayersArray = layersArray.map((x) => {
      const { properties, selected, id } = x;
      return { properties, selected, id };
    });

    this.store.dispatch(
      LayerActions.layersRead({ payload: { layers: newLayersArray } })
    );
  }

  dispatchSendWXS(url: string) {
    this.store.dispatch(LayerActions.wxsSend({ payload: { url } }));
  }

  dispatchAddWMSLayer(layer: any[]) {
    this.store.dispatch(
      LayerActions.addWmsLayer({
        payload: { addWMSlayer: true, wmsLayer: layer },
      })
    );
  }

  dispatchClearAddWMSLayer() {
    this.store.dispatch(
      LayerActions.addWmsLayer({
        payload: { addWMSlayer: false, wmsLayer: null },
      })
    );
  }

  dispatchClearLayerError() {
    this.store.dispatch(LayerActions.clearError());
  }

  // searchResults state object
  dispatchSearchResults(
    configuration: IConfigurationLayer[],
    bbox: number[],
    queryParameters: IMapServerRequest,
    queryType: string
  ) {
    this.store.dispatch(
      SearchResultActions.getLayersForSearch({
        payload: {
          configuration,
          bbox,
          queryParameters,
          queryType,
        },
      })
    );
  }

  dispatchAdvancedSearchResults(body: {
    mapfile?: string;
    url?: string;
    xmlRequest: string;
  }) {
    this.store.dispatch(
      SearchResultActions.readAdvancedSearchResults({
        payload: {
          body,
        },
      })
    );
  }

  dispatchSearchResultsSearchCollapsed(searchCollapsed: boolean) {
    this.store.dispatch(
      SearchResultActions.searchCollapsed({
        payload: { searchCollapsed },
      })
    );
  }

  // subheader state object
  dispatchSubheaderAddressSearchResults(
    searchValue: string,
    addressMode: string,
    isEnterPressed: boolean
  ) {
    this.store.dispatch(
      SubheaderActions.readSearchResults({
        payload: {
          searchValue,
          addressMode,
          isEnterPressed,
        },
      })
    );
  }

  dispatchSubheaderEditClicked(editClicked: boolean) {
    this.store.dispatch(
      SubheaderActions.editClicked({
        payload: { editClicked: !editClicked },
      })
    );
  }

  dispatchSubheaderDisableHistory(disableHistory: {
    next: boolean;
    previous: boolean;
  }) {
    this.store.dispatch(
      SubheaderActions.disableHistory({ payload: { disableHistory } })
    );
  }

  dispatchRectangleSearchClicked(rectangleSearchClicked: boolean) {
    this.store.dispatch(
      SubheaderActions.rectangleSearchClicked({
        payload: { rectangleSearchClicked },
      })
    );
  }

  dispatchPointSearchClicked(pointSearchClicked: boolean) {
    this.store.dispatch(
      SubheaderActions.pointSearchClicked({
        payload: { pointSearchClicked },
      })
    );
  }

  // map state object
  dispatchMapMenuLayersObject(menuLayers: {
    basemaps: IMenuLayer[];
    layers: IMenuLayer[];
  }) {
    this.store.dispatch(
      MapActions.menuLayersObject({ payload: { menuLayers } })
    );
  }

  dispatchMapMenuBasemaps(basemaps: IMenuLayer[]) {
    this.store.dispatch(MapActions.menuBasemaps({ payload: { basemaps } }));
  }

  dispatchMapMenuLayers(layers: IMenuLayer[]) {
    this.store.dispatch(MapActions.menuLayers({ payload: { layers } }));
  }

  dispatchSidebarContentId(sidebarContentId: string) {
    this.store.dispatch(
      MapActions.sidebarContentId({ payload: { sidebarContentId } })
    );
  }

  dispatchControlScale(scale: { kilometers: string; miles: string }) {
    this.store.dispatch(MapActions.controlScale({ payload: { scale } }));
  }

  dispatchMapLoading(loading: boolean) {
    this.store.dispatch(MapActions.mapLoading({ payload: { loading } }));
  }

  dispatchMeasureLinePolygon(measureLinePolygonOn: boolean) {
    this.store.dispatch(
      ToolsActions.measureLinePolygon({ payload: { measureLinePolygonOn } })
    );
  }
}
