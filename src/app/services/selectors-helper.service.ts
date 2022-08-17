import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromApp from 'src/app/store/app.reducer';
import * as LayerSelectors from 'src/app/store/selectors/layer.selectors';
import * as SearchResutlSelectors from 'src/app/store/selectors/search-result.selectors';
import * as SubheaderSelectors from 'src/app/store/selectors/subheader.selectors';
import * as MapSelectors from 'src/app/store/selectors/map.selectors';
import * as ToolsSelectors from 'src/app/store/selectors/tools.selector';
@Injectable({
  providedIn: 'root',
})
export class SelectorsHelperService {
  constructor(private store: Store<fromApp.AppState>) {}

  // layers state object
  getLayers() {
    return this.store.select(LayerSelectors.selectAllLayers);
  }

  getLayersLoading() {
    return this.store.select(LayerSelectors.selectLayerIsLoading);
  }

  getWXSjson() {
    return this.store.select(LayerSelectors.selectWXSresult);
  }

  getWMSlayer() {
    return this.store.select(LayerSelectors.selectWMSLayer);
  }

  // searchResults state object
  getSearchResults() {
    return this.store.select(SearchResutlSelectors.selectAllSearchResults);
  }

  getSearchResultsSearchCollapsed() {
    return this.store.select(SearchResutlSelectors.selectSearchCollapsed);
  }

  getSearchResultsLoading() {
    return this.store.select(SearchResutlSelectors.selectSearchResultIsLoading);
  }

  // subheader state object
  getSubheaderSearchResults() {
    return this.store.select(SubheaderSelectors.selectAllSearchResults);
  }

  getSubheaderEditClicked() {
    return this.store.select(SubheaderSelectors.selectEditClicked);
  }

  getSubheaderDisableHistory() {
    return this.store.select(SubheaderSelectors.selectDisableHistory);
  }

  getSubheaderRectangleSearchClicked() {
    return this.store.select(SubheaderSelectors.selectRectangleSearchClicked);
  }

  getSubheaderPointSearchClicked() {
    return this.store.select(SubheaderSelectors.selectPointSearchClicked);
  }

  getSubheaderLoading() {
    return this.store.select(SubheaderSelectors.selectSearchResultIsLoading);
  }

  // map state object
  getMapMenuLayersObject() {
    return this.store.select(MapSelectors.selectMapLayersObject);
  }

  getMapMenuBasemaps() {
    return this.store.select(MapSelectors.selectMapBasemaps);
  }

  getMapMenuLayers() {
    return this.store.select(MapSelectors.selectMapLayers);
  }

  getMapSidebarContentId() {
    return this.store.select(MapSelectors.selectSidebarContentId);
  }

  getMapControlScale() {
    return this.store.select(MapSelectors.selectControlScale);
  }

  getMapLoading() {
    return this.store.select(MapSelectors.selectMapLoading);
  }

  getMeasureLinePolygon() {
    return this.store.select(ToolsSelectors.selectMeasureLinePolygon);
  }

}
