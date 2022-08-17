export const config = {
  general: {
    /*
    proxyUrl:
      The full url for the proxy e.g. `http://localhost:{proxy_port_number}/proxy/`,

    loadEditMod:
      true ή false (case sensitive) Whether to load the Editor module which allows you to edit layers.

    siteTitle:
      The title to display on the site header e.g "Landify Sample Site"

    sitelogo:
      Relative path for the image to display on the top left of the header e.g. `css/images/evrymap-logo.png"`
      Note: The max height for the image must be 50px

    logoTitle:
      The image alt-title e.g. "Evrymap logo"

    loadHeader:
      boolean. Defaults to true. If false, it hides the header.
     */
    proxyUrl: 'http://localhost:3692/proxy',
    loadEditMod: true,
    siteTitle: '| Sample Site',
    logoTitle: 'EVRYMAP logo',
    siteLogo: 'css/images/EVRIMAP_Color_Negative.png',
    loadHeader: true,
  },
  layout: {
    /**
      navigation:
        true / false. Whether to show the left toolbar with the navigation buttons (zoom in / out etc)
      quickSearch:
        true / false. Whether the search box will appear at the top right
      print:
        true / false. Whether the print button appears
      legendControl:
        true / false. Whether to show legend control button from the bottom toolbar,
      measureTools:
        true / false. ,
      saveView:
        true / false. Whether to show save view button from the bottom toolbar,
     */
    navigation: true,
    quickSearch: true,
    print: true,
    legendControl: true,
    measureTools: true,
    saveView: true,
  },
  map: {
    /*
      mapServer:
        Mandatory. The root url where the mapserver is installed (e.g. 192.168.0.33)
      mapServExe:
        Mandatory if useWrappedMS is set to false. Contains the string for the rest of the mapserver URL
      useWrappedMS:
        Optional. Boolean. If set to true, then the "mapserver" option will be expected to contain the full mapserver
        url including the mapfile. Useful when the webserver mapserver have rewrite rules to 'hide' the path to the
        mapfile (for example, instead of `cgi-bin/mapserv?map=/home/www/mapserverstuff/mymapfile.map&mode=map` rewrite
        to: `wmsmap?mode=map`For more details see https://mapserver.org/ogc/wms_server.html#changing-the-online-resource-url
      mCenter:
        Mandatory. The center (x, y) of the map that will appear
      defaultProjectionCode:
        Mandatory. The EPSG code
      projDescr:
        Mandatory. Defines the map projection system in Well-known text (WKT). Needed because Openlayers does not contain all
        of the codes
      mapExtent:
        Mandatory. Should be set to the projection extent
      xyZoomLevel:
        Optional. The zoom level when zooming to a point feature.  Defaults to "13" if not defined.
      initZoomLevel:
        Optional. The initial zoom level for the map. Defaults to "2" if not defined.
    */
    mapServer: 'localhost',
    mapServExe: 'mapserver/mapserv',
    initZoomLevel: 10,
    mCenter: '2565586,4978438',
    defaultProjectionCode: 'EPSG:3857',
    projDescr:
      '+proj=merc +a=6378137 +b=6378137 +lat_ts=0.0 +lon_0=0.0 +x_0=0.0 +y_0=0 +k=1.0 +units=m +nadgrids=@null +wktext  +no_defs',
    mapExtent:
      '-20037508.342789244,-20037508.342789244,20037508.342789244,20037508.342789244',
    xyZoomLevel: '10',
    addressCountry: 'gr', // TODO ti einai
  },
  layers: [
    {
      type: 'Velocity',
      mapId: 'velocityMapId',
      label: 'Wind Velocity',
      name: 'Wind Velocity',
      serverLocation: 'http://localhost:1062',
      serverPort: '7000',
      displayOnStartup: false,
      exportable: false,
      // timeSettings: {
      //   dateSeparator: '/',
      //   format: 'DD/MM/YYYY',
      //   unit: 'HOUR',
      //   step: 6,
      //   days: 3,
      // },
    },
    {
      name: 'OSM',
      type: 'OSM',
      label: 'Χάρτης OSM',
      displayOnStartup: true,
    },
    {
      name: 'kallikratis',
      type: 'WMS',
      mapfile:
        'C:\\Consortis Projects\\evrymap\\public\\sample_data\\sample.map',
      label: 'Admin Boundaries',
      displayOnStartup: true,
      queryable: true,
      tableName: 'kallikratis',
      searchFields: { name: 'NAME', description: 'Municipal Unit Name' },
      identifyFields: { name: 'NAME', description: 'Municipal Unit Name' },
    },
    {
      name: 'Coastline_Segmentation_Types',
      type: 'WMS',
      projection: 'EPSG:2100',
      mapfile: 'C:\\Consortis\\mapfiles\\diavrosi-cartographic.map',
      label: 'Κατάτμηση Ακτογραμμής',
      displayOnStartup: false,
      queryable: false,
      tableName: 'Coastline_Segmentation_Types',
      searchFields: { name: 'Τύπος', description: 'Τύπος Ακτογραμμής' },
      identifyFields: { name: 'Τύπος', description: 'Τύπος Ακτογραμμής' },
      group: 'Ακτογραμμές',
    },
    {
      name: 'Coastline2018',
      type: 'WMS',
      projection: 'EPSG:2100',
      mapfile: 'C:\\Consortis\\mapfiles\\diavrosi-cartographic.map',
      label: 'Όρια ακτογραμμής SENTINEL-1 για το έτος 2018',
      displayOnStartup: false,
      queryable: false,
      tableName: 'Coastline2018',
      group: 'Ακτογραμμές',
    },
    {
      name: 'BOUY',
      type: 'GeoJSON',
      projection: 'EPSG:4326',
      tiled: false,
      label: 'Πλωτήρας Bouy Μακρύγιαλου',
      mapfile: 'C:\\Consortis\\mapfiles\\diavrosi-buoys-Copy.map',
      displayOnStartup: false,
      queryable: true,
      exportable: false,
      searchFields: { name: 'STATION', description: 'Σημείο Πλωτήρα' },
      identifyFields: { name: 'STATION', description: 'Σημείο Πλωτήρα' },
      tableName: 'BOUY',
      color: '#32a852',
      editPrimaryKey: 'STATION',
    },
  ],
};
