**A nodeJS map portal**

EVRYMAP allows you to create interactive map portals. It's based on Angular, Leaflet and Ionic.
The default recommended server spatial software is [MapServer](https://mapserver.org/) (although in theory any other map server -like Geoserver- could be used.

However, its much more than a map portal where you can just define a few layers and display them on an interactive map.
It provides create and edit utilites for use in an iframe so that you can include it as a component in an outer application.

# Contents

- [Installation](#installation)
- [Sample Project](#sample-project)
- [Configuration](#configuration)
  - [General](#general)
  - [Layout](#layout)
  - [Map](#map)
  - [Layers](#layers)
    - [Supported Layer Types](#supported-layer-types)
    - [OSM Properties](#osm-properties)
    - [BING Properties](#bing-properties)
    - [WMS Properties](#wms-properties)
    - [GeoJSON Properties(WFS)](#geojson-properties)
    - [ESRI Dynamic Map Properties](#esri-dynamic-map)
    - [ESRI Feature Layer Properties](#esri-feature-layer)
- [IFrame Edit](#iframe-edit)
  - [Create Feature Mode](#create-feature-mode)
  - [Edit Feature Mode](#edit-feature-mode)
- [Edit (Standalone)](#edit-standalone)
- [Extensibility](#extensibility)

# Installation

- Git clone the project or download it.
- Run

  ```
  npm install
  ```

  in a node command prompt

- Edit the configuration.json file in the "/src/assets/config/" folder accordingly.

**proxy**  
If you need the advanced filter tab you have to setup the proxy server from https://github.com/Consortis-Geospatial/resource-proxy-node

- Git clone the project or download it.
- Run

  ```
  npm install
  ```

  in a node command prompt

- Configuration according to https://github.com/Consortis-Geospatial/resource-proxy-node

**ogre Api**  
If you need your own api for gdal operations you have to setup the ogre api from https://github.com/Consortis-Geospatial/ogre-api

- Git clone the project or download it.
- Run

  ```
  npm install
  ```

  in a node command prompt

- Configuration according to readme.md file of the project. See also [General](#general) ogreApi

# Sample Project

In order for the sample project to run you have to change the mapfile path in the configuration.json and set your own app folder path and have mapserver installed.
You have to also change some paths in your mapfile which in this case is assets/sample_data/sample.map and set your own from the mapserver installation

- CONFIG "PROJ_LIB"
- SHAPEPATH
- SYMBOLSET
- FONTSET
- METADATA wfs_onlineresource

# Configuration

The main app configuration is controlled in /src/assets/config/configuration.json which looks like this:

```
{
  "general": {
    "proxyUrl": "http://localhost:3692/",
    "loadEditMod": false,
    "siteTitle": "| Sample Site",
    "logoTitle": "EVRYMAP logo",
    "siteLogo": "assets/icon/EVRYMAP_Color.png",
    "loadHeader": false,
    "language": "el",
    "searchAddressMode": "Nominatim",
    "ogrApi": "http://localhost:3100/api/v1/",
    "helpUrl": "http://google.com"
  },
  "layout": {
    "navigation": true,
    "quickSearch": true,
    "print": true,
    "legendControl": true,
    "measureTools": true,
    "saveView": true
  },
  "map": {
    "mapserver": "localhost",
    "mapservexe": "mapserver/mapserv",
    "useWrappedMS": false,
    "initZoomLevel": 10,
    "center": [411133.78976332943, 4494932.074772691],
    "projections": [
      {
        "code": "EPSG:2100",
        "description": "+title=GGRS87 / Greek Grid +proj=tmerc +lat_0=0 +lon_0=24 +k=0.9996 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=-199.87,74.79,246.62,0,0,0,0 +units=m +no_defs"
      },
      {
        "code": "CRS:84",
        "description": "+proj=longlat +datum=WGS84 +no_defs"
      }
    ],
    "defaultProjectionCode": "EPSG:2100",
    "mapExtent": [
      [420444, 4415215],
      [499926, 4446768]
    ],
    "xyZoomLevel": 13,
    "addressCountrySearch": "gr"
  },
  "layers": [
    {
      "name": "Bing",
      "type": "Bing",
      "label": "Χάρτες Bing",
      "displayOnStartup": false,
      "bingKey": "AjnNDy3ezZEmqp_Im0kGqZMrtft16tE9xe0CRwhATCTLIzNedSGFsYGMZjFZ1RG6",
      "bingStyle": "AerialWithLabels",
      "menuLayers": {
        "type": "basemap",
        "typeGroup": "Bing Χάρτες",
        "image": "https://ecn.t2.tiles.virtualearth.net/tiles/h1221000003.jpeg?g=11493&mkt=en-US"
      }
    }
  ]
}
```

The configuration.json file is a json file that consist of 4 properties-objects.

general  
layout  
map  
layers

## general

- **proxyUrl** - The full url for the proxy e.g. http://localhost:{port_number}, Is needed for advanced search.
- **loadEditMod** - Opens a button to allow edit in some layers. Requires additional configuration of editable layers.
- **siteTitle** - The title to display on the site header e.g "Evrymap Sample Site"
- **siteLogo** - Relative path for the image to display on the top left of the header e.g. "assets/icon/EVRYMAP_Color.png"
- **logoTitle** - The image alt-title e.g. "Evrymap logo"
- **loadHeader** - Boolean. Defaults to true. If false, it hides the header
- **language** - Default App language e.g. "en". Currently, only Greek and English resource files are provided.("en" or "el")
- **searchAddressMode** - The default service for searching address from the top right searchbar. Currently only Nominatim is supported.
- **ogrApi** - The default url for the api for gdal operations, e.g. converting json to shapefiles and importing shapefiles.
  The application works with the "https://ogre.adc4gis.com/" api or an api with the same endpoints . Our api can be used (e.g. "http://localhost:3100/api/v1/").    Read more on https://github.com/Consortis-Geospatial/ogre-api
- **helpUrl** - Optional. An extra url for a help link that appears left in the top bar. e.g. "http://google.com"


<br/>
An example configuration of a general object

```
"general": {
    "proxyUrl": "http://localhost:3692/",
    "loadEditMod": false,
    "siteTitle": "| Sample Site",
    "logoTitle": "EVRYMAP logo",
    "siteLogo": "assets/icon/EVRYMAP_Color.png",
    "loadHeader": false,
    "language": "el",
    "searchAddressMode": "Nominatim",
    "ogrApi": "http://localhost:3100/api/v1/",
    "helpUrl" : "http://google.com"
}
```

## layout

- **navigation** - true / false. Whether to show the navigation buttons (zoom in / out etc)
- **quickSearch** - true / false. Whether to show the search box at the top right
- **print** - true / false. Whether the print button appears
- **legendControl** - true / false. Whether the legend tab appears of the left submenu
- **measureTools** - true / false. Whether the measure tools appears in the tools tab of the left submenu
- **saveView** - true / false. Whether the views tab appears in the layers tab of the left submenu. If false, it disables loading of the saved home view
- **advancedFilters** - true / false. Whether the advanced filters tab appears of the left submenu. Uses proxy and wfs filter requests for results. Supported in WMS and WFS(geojson) layers.
- **tooltips** - true / false.Defaults to false.Shows pointer tooltips in the bbox search, edit functionality and measurements
- **footerLink** - object of type {text:string, url: string}. Provides an extra link (<a href=""></a>) in the footer that you can use.

<br/>
An example configuration of a layout object

```
"layout": {
    "navigation": true,
    "quickSearch": true,
    "print": true,
    "legendControl": true,
    "measureTools": true,
    "saveView": true,
    "advancedFilters": true,
    "tooltips": true,
    "footerLink": {
      "text": "Ask Google",
      "url": "http://google.com"
    }
}
```

## map

- **mapserver** - Mandatory. The host of mapserver which is the root of the url for mapserver (e.g. 192.168.0.33 or localhost)
- **mapserverexe** - Mandatory if useWrappedMS is set to false. Contains the string for the rest of the mapserver URL (e.g. mapserver/mapserv)
- **useWrappedMS** - Optional. Boolean. If set to true, then the "mapserver" option will be expected to contain the full mapserver url including the mapfile. Useful when the webserver mapserver have rewrite rules to 'hide' the path to the mapfile (for example, instead of cgi-bin/mapserv?map=/home/www/mapserverstuff/mymapfile.map&mode=map rewrite to: wmsmap?mode=map.  
  For more details see https://mapserver.org/ogc/wms_server.html#changing-the-online-resource-url
- **initZoomLevel** - Optional. The initial zoom level for the map. Defaults to "2" if not defined.
- **defaultProjectionCode** - Mandatory. The EPSG code. Currently all map layers project to EPSG:4326 which is the default leaflet code but setting this will convert all coordinates for the map to the setted epsg code.
- **center** - Mandatory. The starting center (x, y) of the map. In <i>defaultProjectionCode</i> coordinates
- **projections** - Optional. An array of additional required projection definitions in proj4js format that aren't included in the library.  
  Each projection definition is an object with "code" and "description" properties.  
  The following example is for the Greek Grid (EPSG:2100):

  ```
  "projections": [
        {
          "code": "EPSG:2100",
          "description": "+title=GGRS87 / Greek Grid +proj=tmerc +lat_0=0 +lon_0=24 +k=0.9996 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=-199.87,74.79,246.62,0,0,0,0 +units=m +no_defs"
        }
    ]
  ```

- **mapExtent** - Mandatory. Should be set to the <i>defaultProjectionCode</i> projection extent. Is used currently by the home button in the top toolbar. Array of two array point elements
  e.g.

  ```
  "mapExtent": [
        [420444, 4415215],
        [499926, 4446768]
      ]
  ```

- **xyZoomLevel** - Optional. The default zoom level when zooming to a point feature.
- **addressCountrySearch** - The country code of Nominatim address search.

<br/>
An example configuration of a map object

```
"map": {
    "mapserver": "localhost",
    "mapservexe": "mapserver/mapserv",
    "useWrappedMS": false,
    "initZoomLevel": 10,
    "center": [411133.78976332943, 4494932.074772691],
    "projections": [
      {
        "code": "EPSG:2100",
        "description": "+title=GGRS87 / Greek Grid +proj=tmerc +lat_0=0 +lon_0=24 +k=0.9996 +x_0=500000 +y_0=0 +ellps=GRS80 +towgs84=-199.87,74.79,246.62,0,0,0,0 +units=m +no_defs"
      },
      {
        "code": "CRS:84",
        "description": "+proj=longlat +datum=WGS84 +no_defs"
      }
    ],
    "defaultProjectionCode": "EPSG:2100",
    "mapExtent": [
      [420444, 4415215],
      [499926, 4446768]
    ],
    "xyZoomLevel": 13,
    "addressCountrySearch": "gr"
  }
```

## layers

An array in the following form

```
layers: [
     {layer1},
     {layer2},
     ....
]
```

### Supported Layer Types

5 layer types are currently supported

- OSM
- Bing
- WMS
- GeoJSON (WFS)
- Esri Dynamic Map Layer
- Esri Feature Layer

The "type" property has to change accordingly to support each layer type

- OSM - type: "OSM",
- Bing - type: "BING",
- WMS - type: "WMS",
- GeoJSON (WFS) - type: "GeoJSON",
- Esri Dynamic Map Layer - type: "ESRIMAP",
- Esri Feature Layer - type: "ESRIFEATURE",

Depending on their type they may have different properties.

### OSM Properties

- **name** - Mandatory. Layer name. Note: No special characters or spaces are allowed
- **label** - Mandatory. Layer Label. Spaces and special characters are allowed.
- **type** - "OSM". Mandatory.
- **label** - Optional. Layer name as it will appear in the legend. If missing the "name" value will be used.
- **displayOnStartup** - Boolean. Whether the layer will be visible on startup
- **url** - Mandatory. The OSM url to use. See also OSM Styles
- **menuLayers** - Object with the following properties
  - type - Mandatory. "basemap"
  - typeGroup - Mandatory. "OSM" . The group name to add the layer in.
  - image - url or path for the basemap thumbnail

```
name: 'OSM_stamen_toner',
type: 'OSM',
label: 'Stamen Toner',
displayOnStartup: false,
url: 'https://stamen-tiles.a.ssl.fastly.net/toner/{z}/{x}/{y}.png',
menuLayers: {
  type: 'basemap',
  typeGroup: 'OSM',
  image: 'https://stamen-tiles.a.ssl.fastly.net/toner/10/577/385.png',
},
```

### BING Properties

- **name** - Mandatory. Layer name. Note: No special characters or spaces are allowed
- **type** - Bing. Mandatory.
- **label** - Optional. Layer name as it will appear in the legend. If missing the "name" value will be used.
- **displayOnStartup**- Boolean. Whether the layer will be visible on startup
- **bingKey**: Mandatory. You can register for a key at http://www.bingmapsportal.com/
- **bingStyle**: Mandatory. One of Aerial|AerialWithLabels|Road|RoadOnDemand
- **menuLayers** - Object with the following properties
  - type - Mandatory. "basemap"
  - typeGroup - Mandatory. The group name to add the layer in.
  - image - url or path for the basemap thumbnail

```
{
      "name": "Bing",
      "type": "Bing",
      "label": "Χάρτες Bing",
      "displayOnStartup": false,
      "bingKey": "1234567890",
      "bingStyle": "AerialWithLabels",
      "menuLayers": {
        "type": "basemap",
        "typeGroup": "Bing",
        "image": "https://ecn.t2.tiles.virtualearth.net/tiles/h1221000003.jpeg?g=11493&mkt=en-US"
      }
}
```

### WMS properties

- **name** - Mandatory. Layer name. Note: No special characters or spaces are allowed. It is used for all wms and wfs requests as layer name.
- **type** - "WMS" Mandatory.
- **label** - Optional. Layer name as it will appear in the legend.

- **mapfile** - The path of the mapfile for the WMS requests. Has to be double escaped in windows

  ```
  "mapfile": "C:\\mapfiles\\sample.map",
  ```

- **url** - Optional. If the mapfile option is not set, it replaces the wms/wfs request that consists of the mapfile and mapserver options for the specific layer

- **displayOnStartup** - Boolean. Whether the layer will be visible on startup
- **queryable** : Optional. Boolean. If set to true, layer will be queryable using the identify, select by rectangle tools and will appear in the results of simple and advanced search.
- **exportable** : Optional. Boolean. If set to true, a button will appear next to the layer name with the options to export to a shapefile or CSV. NOTE: The layer should also support WFS requests for this to work
- **searchFields** : Mandatory if the queryable property is set to true. The list of fields on the layer to search on.
  An array of objects with the following properties

  - name - The Name of the field as it appears on your data.
  - description - a Description of the field
  - link - Optional. whether the field will appear as link in the search results

  ```
  "searchFields": [
          {
            "name": "id",
            "description": "id",
            "link": false
          }
  ]
  ```

- **menuLayers** - Object with the following properties

  - type - Mandatory. "layer"
  - typeGroup - Mandatory. The group name to add the layer in

- **legendImage** - Optional. Sets the image for the layer that will appear in the legend. If set it replaces the graphic of the getLegend request.

- **edit** - Object with the following properties

  - geometryType - The geometry type of the layer to edit. point / line / polygon / marker
  - snappingLayers - An array of snapping layer names for the edit functionality to snap to.
  - multi - Boolean. Whether the geometry is multipart or not.
  - primaryKey - Optional. Boolean. Defaults to 'id'. the primaryKey to be used to find features for the edit functionality.
  - serviceUrl - Mandatory for Edit in Standalone Mode. Url to save the feature.
  - geometryColumn - Mandatory for Edit in Standalone Mode. Geometry column field.
  - fields - Optional for Edit in Standalone Mode. Array of objects. The fields to edit in standalone mode. if fields are empty only the geometry field will be open in the edit modal
    Properties of field object
    - name - property name
    - label - a label to show the field
    - type - "string" OR "number" OR "dropdown". The type of the field
    - required - boolean. adds a required validator to the field
    - maxLength - number. maxLength validator for the field with a value of the maximum length
    - readOnly - boolean. show the field as readonly in edit feature. Not readonly in create feature
    - dropdownValueField - must be set if type="dropdown". the value field of the objects that the service returns
    - dropdownDescriptionField - must be set if type="dropdown". the description field of the objects that the service returns
    - dropdownService - must be set if type="dropdown". a string url that returns array of objects with two properties. dropdownValueField and dropdownDescriptionField;

  ```
  "fields": [{
              "name": "kadik",
              "label": "ΚΑΔΗΚ Κτιρίου",
              "type": "string",
              "required": true,
              "maxLength": 20,
              "readOnly": true
            },
            {
              "name": "ota_code",
              "label": "OTA",
              "type": "dropdown",
              "dropdownService":  "http://localhost:3100/api/v1/getOta",
              "dropdownValueField": "ota_code"
              "dropdownDescriptionField": "ota_descr"
            }
            ]
  ```

  **Iframe edit example**

  ```
      "edit": {
        "geometryType": "polygon",
        "snappingLayers": ["v_buildings_spatial"],
        "multi": true
      }
  ```

  **Standalone edit example**

  ```
  "edit": {
          "geometryType": "polygon",
          "snappingLayers": [
            "v_parcels_spatial"
          ],
          "multi": true,
          "serviceUrl": "http://localhost:3100/api/v1/saveParcel",
          "geometryColumn": "ogr_geometry",
          "fields": [
            {
              "name": "kadik",
              "label": "ΚΑΔΗΚ Κτιρίου",
              "type": "string",
              "required": true,
              "maxLength": 20,
              "readOnly": true
            }
          ]
  ```

- **relation** - Connects the features of layers with a function in the extention service and allows extensibility in search results. Array of Objects with the following properties (see [Extensibility](#extensibility))
  - functionName - the name of function to call in extention service.
  - description - string. Description for the callback to set for the button name
  - position - "search" or "context" . The first option allows extention in search results and the second in contextMenu(only in geojson layers)

### GeoJSON properties

Layers with WFS service

- **name** - Mandatory. Layer name. Note: No special characters or spaces are allowed. It is used for all wfs requests as layer name.
- **type** - "GeoJSON" Mandatory.
- **label** - Optional. Layer name as it will appear in the legend.
- **displayOnStartup** - Boolean. Whether the layer will be visible on startup
- **queryable** : Optional. Boolean. If set to true, layer will be queryable using the identify, select by rectangle tools and will appear in the results of simple and advanced search.
- **exportable** : Optional. Boolean. If set to true, a button will appear next to the layer name with the options to export to a shapefile or CSV. NOTE: The layer should also support WFS requests for this to work
- **searchFields** : Mandatory if the queryable property is set to true. The list of fields on the layer to search on.
  An array of objects with the following properties

  - name - The Name of the field as it appears on your data.
  - description - a Description of the field
  - link - Optional. whether the field will appear as link in the search results

  ```
  "searchFields": [
          {
            "name": "id",
            "description": "id",
            "link": false
          }
  ]
  ```

- **mapfile** - The path of the mapfile for the WFS requests. Has to be double escaped in windows

  ```
  "mapfile": "C:\\mapfiles\\sample.map",
  ```

- **url** - Optional. If the mapfile option is not set, it replaces the wms/wfs request that consists of the mapfile and mapserver options for the specific layer

- **menuLayers** - Object with the following properties

  - type - Mandatory. "layer"
  - typeGroup - Mandatory. The group name to add the layer in

- **legendImage** - Optional. Sets the image for the layer that will appear in the legend. If set it replaces the graphic of the getLegend request.

- **edit** - Object with the following properties

  - geometryType - The geometry type of the layer to edit. point / line / polygon / marker
  - snappingLayers - An array of snapping layer names for the edit functionality to snap to.
  - multi - Boolean. Whether the geometry is multipart or not.
  - primaryKey - Optional. Boolean. Defaults to 'id'. the primaryKey to be used to find features for the edit functionality.
  - serviceUrl - Mandatory for Edit in Standalone Mode. Url to save the feature.
  - geometryColumn - Mandatory for Edit in Standalone Mode. Geometry column field.
  - fields - Optional for Edit in Standalone Mode. Array of objects. The fields to edit in standalone mode. if fields are empty only the geometry field will be open in the edit modal
    Properties of field object
    - name - property name
    - label - a label to show the field
    - type - string OR number. The type of the field
    - required - boolean. adds a required validator to the field
    - maxLength - number. maxLength validator for the field with a value of the maximum length
    - readOnly - boolean. show the field as readonly

  ```
  "fields": [{
              "name": "kadik",
              "label": "ΚΑΔΗΚ Κτιρίου",
              "type": "string",
              "required": true,
              "maxLength": 20,
              "readOnly": true
            }]
  ```

  **Iframe edit example**

  ```
      "edit": {
        "geometryType": "polygon",
        "snappingLayers": ["v_buildings_spatial"],
        "multi": true
      }
  ```

  **Standalone edit example**

  ```
  "edit": {
          "geometryType": "polygon",
          "snappingLayers": [
            "v_parcels_spatial"
          ],
          "multi": true,
          "serviceUrl": "http://localhost:3100/api/v1/saveParcel",
          "geometryColumn": "ogr_geometry",
          "fields": [
            {
              "name": "kadik",
              "label": "ΚΑΔΗΚ Κτιρίου",
              "type": "string",
              "required": true,
              "maxLength": 20,
              "readOnly": true
            }
          ]
  ```

- **geojsonStyle** - An object for the style of geojson layers. Supports what is supported by leaflet.

  - weight - Weight of points
  - color - Outer color of geometries
  - fillColor - Inner color of geometries
  - fillOpacity - Opacity of the inner polygon in the geometries
  - radius - Radius of circleMarkers

  ```
  "geojsonStyle": {
          "weight": 1,
          "color": "#000",
          "fillColor": "#ff6600",
          "fillOpacity": 0.5,
          "radius": 10
        },
  ```

- **contectMenu** - If set it enabled right click functionality in geojson layers. Array of objects for the menu popover that appears when you right click the feature. Each object represents a line in the menu.
  Each object supports the following property combinations

  1. - **text** - text

  2. - **text** - text

     - **hyperlink** - converts the text to a hyperlink and opens the link on click e.g. "https://google.com"

  3. - **fieldName** - Shows the value of the geojson field.
  
     - **fieldDescription** - A description for the field name

  4. - **text** - text

     - **googleMaps** - Boolean. Open the point in googleMaps

  5. - **text** - text

     - **googleStreetView** - Boolean. Open the point in googleStreetView

  ```
  "contextMenu": [
          {
            "text": "google",
            "hyperlink": "https://google.com"
          },
          {
            "text": "lorem ipsum"
          },
          {
            "fieldName": "id",
            "fieldDescription": "a/a"
          },
          {
            "text": "googleMaps",
            "googleMaps": true
          },
          {
            "text": "googleStreetView",
            "googleStreetView": true
          }
        ]
  ```

- **relation** - Connects the features of layers with a function in the extention service and allows extensibility in search results. Array of Objects with the following properties (see [Extensibility](#extensibility))
  - functionName - the name of function to call in extention service.
  - description - string. Description for the callback to set for the button name
  - position - "search" or "context" . The first option allows extention in search results and the second in contextMenu(only in geojson layers)

### ESRI Dynamic Map

- **name** - Mandatory. Layer name. Note: No special characters or spaces are allowed
- **type** - "ESRIMAP" Mandatory.
- **label** - Optional. Layer name as it will appear in the legend.
- **displayOnStartup** - Boolean. Whether the layer will be visible on startup
- **queryable** : Optional. Boolean. If set to true, layer will be queryable using the identify, select by rectangle tools and will appear in the results of simple and advanced search.
- **exportable** : Optional. Boolean. If set to true, a button will appear next to the layer name with the options to export to a shapefile or CSV. NOTE: The layer should also support WFS requests for this to work
- **searchFields** : Mandatory if the queryable property is set to true. The list of fields on the layer to search on.
  An array of objects with the following properties

  - name - The Name of the field as it appears on your data.
  - description - a Description of the field
  - link - Optional. whether the field will appear as link in the search results

  ```
  "searchFields": [
          {
            "name": "id",
            "description": "id",
            "link": false
          }
  ]
  ```

- **menuLayers** - Object with the following properties

  - type - Mandatory. "layer"
  - typeGroup - Mandatory. The group name to add the layer in

- **legendImage** - Optional. Sets the image for the layer that will appear in the legend. If set it replaces the graphic of the getLegend request.

- **url** - The url of esri layer e.g."https://sampleserver6.arcgisonline.com/arcgis/rest/services/USA/MapServer",
- **esriLayersID** - An array of the layer ids to render in the esri layer. Only the first id will show in the search results currently so it's better if you define each layer id as a separate layer in the layer config.
  e.g. "esriLayersID": [0, 1],

### ESRI Feature Layer

- **name** - Mandatory. Layer name. Note: No special characters or spaces are allowed
- **type** - "ESRIFEATURE" Mandatory.
- **label** - Optional. Layer name as it will appear in the legend.
- **displayOnStartup** - Boolean. Whether the layer will be visible on startup
- **queryable** : Optional. Boolean. If set to true, layer will be queryable using the identify, select by rectangle tools and will appear in the results of simple and advanced search.
- **exportable** : Optional. Boolean. If set to true, a button will appear next to the layer name with the options to export to a shapefile or CSV. NOTE: The layer should also support WFS requests for this to work
- **searchFields** : Mandatory if the queryable property is set to true. The list of fields on the layer to search on.
  An array of objects with the following properties

  - name - The Name of the field as it appears on your data.
  - description - a Description of the field
  - link - Optional. whether the field will appear as link in the search results

  ```
  "searchFields": [
          {
            "name": "id",
            "description": "id",
            "link": false
          }
  ]
  ```

- **menuLayers** - Object with the following properties

  - type - Mandatory. "layer"
  - typeGroup - Mandatory. The group name to add the layer in

- **legendImage** - Optional. Sets the image for the layer that will appear in the legend. If set it replaces the graphic of the getLegend request.

- **url** - The url of esri layer e.g. "https://sampleserver6.arcgisonline.com/arcgis/rest/services/CommercialDamageAssessment/FeatureServer",
- **esriLayersID** - An array of the layer ids to render in the esri layer. Only the first id will show in the search results currently so it's better if you define each layer id as a separate layer in the layer config.
  e.g. "esriLayersID": [0],

- **geojsonStyle** - An object for the style of geojson layers. Supports what is supported by leaflet.

  - weight - Weight of points
  - color - Outer color of geometries
  - fillColor - Inner color of geometries
  - fillOpacity - Opacity of the inner polygon in the geometries
  - radius - Radius of circleMarkers

  ```
  "geojsonStyle": {
          "weight": 1,
          "color": "#000",
          "fillColor": "#ff6600",
          "fillOpacity": 0.5,
          "radius": 10
        },
  ```

<br/>
An example configuration of a layers object

```
"layers": [
    {
      "name": "Bing",
      "type": "Bing",
      "label": "Bing Maps",
      "displayOnStartup": false,
      "bingKey": "123",
      "bingStyle": "AerialWithLabels",
      "menuLayers": {
        "type": "basemap",
        "typeGroup": "Bing Maps",
        "image": "https://ecn.t2.tiles.virtualearth.net/tiles/h1221000003.jpeg?g=11493&mkt=en-US"
      }
    },
    {
      "name": "USA states",
      "type": "ESRIMAP",
      "esriLayersID": [0, 1],
      "url": "https://testserver.com/arcgis/rest/services/USA/MapServer",
      "label": "esri rest USA states",
      "menuLayers": {
        "type": "layer",
        "typeGroup": "Esri"
      },
      "geojsonStyle": {
        "weight": 1,
        "color": "#000",
        "fillColor": "#ff6600",
        "fillOpacity": 0.5,
        "radius": 5
      },
      "displayOnStartup": false,
      "queryable": true,
      "exportable": true,
    },
    {
      "name": "CDA",
      "type": "ESRIFEATURE",
      "esriLayersID": [0],
      "url": "https://testserver.com/arcgis/rest/services/CommercialDamageAssessment/FeatureServer",
      "label": "esri cda",
      "menuLayers": {
        "type": "layer",
        "typeGroup": "Esri"
      },
      "geojsonStyle": {
        "weight": 1,
        "color": "#000",
        "fillColor": "#ff6600",
        "fillOpacity": 0.5,
        "radius": 5
      },
      "displayOnStartup": false,
      "queryable": true,
      "exportable": true,
    },
    {
      "name": "v_parcels",
      "type": "geojson",
      "mapfile": "C:\\mapfiles\\demo.map",
      "label": "Γεωτεμάχια ανά τύπο",
      "menuLayers": {
        "type": "layer",
        "typeGroup": "Parcels"
      },
      "displayOnStartup": true,
      "queryable": true,
      "exportable": true,
      "searchFields": [
        {
          "name": "no_geot",
          "description": "no Parcel"
        }
      ],
      "geojsonStyle": {
        "weight": 1,
        "color": "#000",
        "fillColor": "#0066ff",
        "fillOpacity": 0.5,
        "radius": 10
      },
      "edit": {
        "geometryType": "polygon",
        "snappingLayers": ["v_parcels"],
        "multi": true
      },
      "contextMenu": [
        {
          "text": "Data",
          "hyperlink": "https://google.com"
        },
        {
          "text": "lorem ipsum"
        },
        {
          "fieldName": "no_geot"
        },
        {
          "text": "googleMaps",
          "googleMaps": true
        },
        {
          "text": "googleStreetView",
          "googleStreetView": true
        }
      ]
    },
    {
      "name": "v_buildings",
      "type": "wms",
      "mapfile": "C:\\mapfiles\\demo.map",
      "label": "Buildings",
      "menuLayers": {
        "type": "layer",
        "typeGroup": "Buildings"
      },
      "displayOnStartup": true,
      "queryable": true,
      "exportable": true,
      "searchFields": [
        {
          "name": "external_code",
          "description": "external code"
        }
      ],
      "edit": {
        "geometryType": "polygon",
        "snappingLayers": ["v_buildings"],
        "multi": true
      }
    }
  ]
```

# IFrame Edit

IFrame create and edit functionality is automatically supported based on url arguments

If you run the application as an iframe inside another app
there are two modes you can use

- create feature mode
- edit feature mode

## Create Feature Mode

If the application runs in the following url  
http://localhost:8100/

you can enter this mode by passing arguments in the end of the url

- **mode** - create
- **layer** - layer name  
  e.g.
  http://localhost:8100/map?mode=create&layer=sample_layer

Setting the edit property for the layer is mandatory for this to work.

This is supported for GeoJSON layers and WMS layers.
If you want to edit a WMS layer you have to support WFS for this layer in your mapserver. It will replace the wms layer with a GeoJSON layer with the same name when in create Mode.

This will open the create functionality for this layer and will send an message in the parent window that you can catch whenever you create a feature or make a change in the created features. You can later use this as you want in your outer application.

The geometry that is sent is in the map defaultProjectionCode EPSG as a GeoJSON.

The message that is sent in the outer application is stringified so you have to parse it with **JSON.parse()**
and is of the following format

```
{
  cmd: 'editXY',
  value: {
    geom,
    area,
    perimeter,
  },
}
```

## Edit Feature Mode

If the application runs in the following url  
http://localhost:8100/

you can enter this mode by passing arguments in the end of the url

- **mode** - edit
- **layer** - layer name
- **feature** - id of feature to find
  e.g.
  http://localhost:8100/map?mode=edit&layer=sample_layer&feature=4

Setting the edit property for the layer is mandatory for this to work.  
This is supported for GeoJSON layers and WMS layers.
If you want to edit a WMS layer you have to support WFS for this layer in your mapserver. It will replace the wms layer with a GeoJSON layer with the same name when in edit Mode.

This will open the edit functionality for this layer and will send an message in the parent window that you can catch whenever you edit the feature. You can later use this as you want in your outer application.

The geometry that is sent is in the map defaultProjectionCode EPSG as a GeoJSON.

The message that is sent in the outer application is stringified so you have to parse it with **JSON.parse()**
and is of the following format

```
{
  cmd: 'editXY',
  value: {
    geom,
    area,
    perimeter,
  },
}
```

# Edit Standalone

(Work in Progress. Isn't ready yet. )

# Extensibility

If you set the relation property in WMS or GeoJSON layer types you can extend the functionality of Evrymap with extra submodules.

Relation is an Array of Objects with the following properties

- functionName - the name of function to call in extention service.
- description - string. Description for the callback to set for the button name
- position - "search" or "context" . The first option allows extention in search results and the second in contextMenu(only in geojson layers)

```
 "relation": [
        {
          "functionName": "action",
          "description": "my action",
          "position": "search"
        },
        {
          "functionName": "action",
          "description": "my action",
          "position": "context"
        }
      ]
```

After you set the relation property in the configuration of the layer you want to extend, according to the "position" property extra functionality appears.

- **position = "search"**  
  an extra column appears in the search results of the specific layer with a button
- **position = "context"**  
  an extra button is set in the context menu

Both of these buttons call a function in the extentionService.js file with the functionName that you set.

So you have to go to the extentionService file to implement that function with the functionName you want. e.g.
You must have as arguments two fields. The first is the feature that you clicked and the second is the layer name.

In the following example we present a popover modal with Ionic
e.g.

```
 async action(feature, layer) {

   const popover = await this.popoverController.create({
     component: MyLayerComponent,
     componentProps: {

     },
   });
   await popover.present();
   const { data, role } = await popover.onDidDismiss<{}>();
}
```

Dont forget to import the component that you want to use in the start of extentionService.js file.
e.g.

```
  import { MyLayerComponent } from '../core/components/submodules/my-layer.component';
```
