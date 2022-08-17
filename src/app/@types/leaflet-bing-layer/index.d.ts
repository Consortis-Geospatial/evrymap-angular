/// <reference types="leaflet" />

declare namespace L.tileLayer {
  interface Bing extends L.TileLayer {
    getMetaData(latlng, zoom);
  }
  function bing(options?: any): Bing;
}
