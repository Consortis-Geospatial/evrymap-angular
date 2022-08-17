import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, mergeMap, switchMap, tap } from 'rxjs/operators';
import { IConfigurationLayer } from 'src/app/core/interfaces/configuration.interface';
import { IMapServerRequest } from 'src/app/core/interfaces/map-server-request.interface';
import { HttpCallsService } from 'src/app/services/http-calls.service';
import { MapEventsService } from 'src/app/services/map-events.service';
import * as SearchResultActions from '../actions/search-result.actions';
import { AppState } from '../app.reducer';
import * as geojson from 'geojson';
import { MapService } from 'src/app/services/map.service';
import * as esri from 'esri-leaflet';
import { arcgisToGeoJSON } from '@terraformer/arcgis';
import { IEsriServerRequest } from 'src/app/core/interfaces/esri-server-request.interface';
import * as turf from '@turf/turf';
import booleanIntersects from '@turf/boolean-intersects';
import { Geometry } from '@turf/turf';
import { TranslationService } from 'src/app/services/translation.service';
import { ToastService } from 'src/app/services/toast.service';

@Injectable()
export class SearchResultEffects {
  getLayersForSearch$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SearchResultActions.getLayersForSearch),
        tap((values) => {
          this.store.dispatch(
            SearchResultActions.searchResultLoading({
              payload: { loading: true },
            })
          );

          this.store.dispatch(SearchResultActions.clearSearchResults());

          this.queryParameters = values.payload.queryParameters;
          this.queryType = values.payload.queryType;
          this.layersForSearch = values.payload.configuration;
          this.bbox = values.payload.bbox;
          if (values.payload.configuration.length > 0) {
            this.$layerCounter.next(0);
          } else {
            this.store.dispatch(
              SearchResultActions.searchResultLoading({
                payload: { loading: false },
              })
            );
            this.toastService.showToast(
              this.translationService.translate('MAP.SUBHEADER.NO_LAYERS_FOUND')
            );
            this.$layerCounter.next(-2);
          }
        })
      ),
    { dispatch: false }
  );

  getSearchResults$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchResultActions.readSearchResults),
      switchMap(({ payload }) => {
        this.store.dispatch(
          SearchResultActions.searchResultLoading({
            payload: { loading: true },
          })
        );
        this.queryParameters = this.configureQueryParameters(
          this.queryType,
          payload.configuration
        );
        return this.httpCallsService
          .getFromMapServer(this.queryParameters)
          .pipe(
            mergeMap(
              (response: { name: string; features: geojson.Feature[] }) => {
                if (response != null) {
                  this.layerSearchResults[payload.configuration.name] =
                    response.features;
                } else {
                  this.layerSearchResults[payload.configuration.name] = [];
                }

                let isLoading: boolean;
                if (payload.counter < this.layersForSearch.length - 1) {
                  const newCount = payload.counter + 1;
                  isLoading = true;
                  this.store.dispatch(
                    SearchResultActions.searchResultLoading({
                      payload: { loading: isLoading },
                    })
                  );
                  this.$layerCounter.next(newCount);
                } else {
                  isLoading = false;

                  this.store.dispatch(
                    SearchResultActions.searchResultsRead({
                      payload: {
                        searchResults: [
                          {
                            id: 1,
                            layers: this.layerSearchResults,
                            address: [],
                          },
                        ],
                      },
                    })
                  );
                  this.layerSearchResults = {};
                  this.$layerCounter.next(-2);
                  return of(
                    SearchResultActions.searchResultLoading({
                      payload: { loading: isLoading },
                    })
                  );
                }
              }
            ),
            catchError((error) => {
              if (this.$layerCounter.value !== -2) {
                if (payload.counter < this.layersForSearch.length - 1) {
                  const newCount = payload.counter + 1;
                  this.$layerCounter.next(newCount);
                } else {
                  this.$layerCounter.next(-2);
                }
              }
              return of(
                SearchResultActions.searchResultActionFail({
                  payload: { error },
                })
              );
            })
          );
      })
    )
  );

  getSearchResultsESRI$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchResultActions.readSearchResultsESRI),
      switchMap(({ payload }) => {
        this.store.dispatch(
          SearchResultActions.searchResultLoading({
            payload: { loading: true },
          })
        );
        const newqueryParameters = this.configureQueryParametersESRI(
          this.queryType,
          payload.configuration
        );
        return this.httpCallsService
          .getFromESRIServer(newqueryParameters, payload.configuration)
          .pipe(
            mergeMap(
              (response: {
                results?: any[];
                name?: string;
                features?: any[];
              }) => {
                if (payload.configuration.type === 'ESRIMAP') {
                  if (response == null || !response.results) {
                    this.layerSearchResults[payload.configuration.name] = [];
                  } else {
                    const arcGeojson = [];
                    response.results.forEach((element) => {
                      arcGeojson.push(arcgisToGeoJSON(element));
                    });
                    this.layerSearchResults[payload.configuration.name] =
                      arcGeojson;
                  }
                } else {
                  if (response == null || !response.features) {
                    this.layerSearchResults[payload.configuration.name] = [];
                  } else {
                    const arcGeojson = [];
                    response.features.forEach((element) => {
                      arcGeojson.push(arcgisToGeoJSON(element));
                    });
                    this.layerSearchResults[payload.configuration.name] =
                      arcGeojson;
                  }
                }
                let isLoading: boolean;
                if (payload.counter < this.layersForSearch.length - 1) {
                  const newCount = payload.counter + 1;
                  isLoading = true;
                  this.store.dispatch(
                    SearchResultActions.searchResultLoading({
                      payload: { loading: isLoading },
                    })
                  );
                  this.$layerCounter.next(newCount);
                } else {
                  isLoading = false;

                  this.store.dispatch(
                    SearchResultActions.searchResultsRead({
                      payload: {
                        searchResults: [
                          {
                            id: 1,
                            layers: this.layerSearchResults,
                            address: [],
                          },
                        ],
                      },
                    })
                  );
                  this.layerSearchResults = {};
                  this.$layerCounter.next(-2);
                  return of(
                    SearchResultActions.searchResultLoading({
                      payload: { loading: isLoading },
                    })
                  );
                }
              }
            ),
            catchError((error) =>
              of(
                SearchResultActions.searchResultActionFail({
                  payload: { error },
                })
              )
            )
          );
      })
    )
  );

  getSearchResultsOgre$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(SearchResultActions.readSearchResultsOGRE),
        switchMap((payload) => {
          const flippedBbox = [
            this.bbox[1],
            this.bbox[0],
            this.bbox[3],
            this.bbox[2],
          ];
          const poly = turf.bboxPolygon(flippedBbox as turf.BBox);
          const ogreLayer = this.layersForSearch[payload.payload.counter];
          const layerFound = this.mapService
            .getLayersArray()
            .find((x) => x.properties.layerId === ogreLayer.layerId);
          const geojsonLayer = layerFound.layer as L.GeoJSON;

          const geojsonArray = [];
          switch (this.queryType) {
            case 'rectangle':
              geojsonLayer.eachLayer((x) => {
                // eslint-disable-next-line @typescript-eslint/dot-notation
                // console.log(x['feature']);
                if (
                  turf.booleanContains(
                    poly as turf.helpers.Feature,
                    // eslint-disable-next-line @typescript-eslint/dot-notation
                    x['feature'] as turf.helpers.Feature<Geometry>
                  ) ||
                  booleanIntersects(
                    poly as turf.helpers.Feature,
                    // eslint-disable-next-line @typescript-eslint/dot-notation
                    x['feature'] as turf.helpers.Feature<Geometry>
                  )
                ) {
                  // eslint-disable-next-line @typescript-eslint/dot-notation
                  geojsonArray.push(x['feature']);
                }
              });
              break;
            case 'point':
              //get small bbox
              const flippedBboxString = flippedBbox.map((x) => x + '');
              const smallBbox = this.mapService.getBboxBasedOnPixels(
                flippedBboxString,
                this.map
              );
              const smallBboxNumber = smallBbox.map((x) => parseFloat(x));
              const polySmallBbox = turf.bboxPolygon(
                smallBboxNumber as turf.BBox
              );
              //check geometry of features with small bbox
              geojsonLayer.eachLayer((x) => {
                // eslint-disable-next-line @typescript-eslint/dot-notation
                // console.log(x['feature']);
                if (
                  turf.booleanContains(
                    polySmallBbox as turf.helpers.Feature,
                    // eslint-disable-next-line @typescript-eslint/dot-notation
                    x['feature'] as turf.helpers.Feature<Geometry>
                  ) ||
                  booleanIntersects(
                    polySmallBbox as turf.helpers.Feature,
                    // eslint-disable-next-line @typescript-eslint/dot-notation
                    x['feature'] as turf.helpers.Feature<Geometry>
                  )
                ) {
                  // eslint-disable-next-line @typescript-eslint/dot-notation
                  geojsonArray.push(x['feature']);
                }
              });
              break;
            default:
              break;
          }

          this.layerSearchResults[ogreLayer.name] = geojsonArray;

          let isLoading: boolean;
          if (payload.payload.counter < this.layersForSearch.length - 1) {
            const newCount = payload.payload.counter + 1;
            isLoading = true;
            this.store.dispatch(
              SearchResultActions.searchResultLoading({
                payload: { loading: isLoading },
              })
            );
            this.$layerCounter.next(newCount);
          } else {
            isLoading = false;

            this.store.dispatch(
              SearchResultActions.searchResultsRead({
                payload: {
                  searchResults: [
                    {
                      id: 1,
                      layers: this.layerSearchResults,
                      address: [],
                    },
                  ],
                },
              })
            );
            this.layerSearchResults = {};
            this.$layerCounter.next(-2);
            return of(
              SearchResultActions.searchResultLoading({
                payload: { loading: isLoading },
              })
            );
          }
        })
      )
    // { dispatch: false }
  );

  getAdvancedSearchResults$ = createEffect(() =>
    this.actions$.pipe(
      ofType(SearchResultActions.readAdvancedSearchResults),
      switchMap(({ payload }) => {
        this.store.dispatch(
          SearchResultActions.searchResultLoading({
            payload: { loading: true },
          })
        );

        return this.httpCallsService.postToMapServer(payload.body).pipe(
          mergeMap(
            (response: { name: string; features: geojson.Feature[] }) => {
              this.layerSearchResults[response.name] = response.features;

              this.store.dispatch(
                SearchResultActions.searchResultsRead({
                  payload: {
                    searchResults: [
                      { id: 1, layers: this.layerSearchResults, address: [] },
                    ],
                  },
                })
              );
              this.layerSearchResults = {};

              return of(
                SearchResultActions.searchResultLoading({
                  payload: { loading: false },
                })
              );
            }
          ),
          catchError((error) =>
            of(
              SearchResultActions.searchResultActionFail({
                payload: { error },
              })
            )
          )
        );
      })
    )
  );

  private layersForSearch: IConfigurationLayer[];
  private bbox: number[];
  private layerSearchResults = {};
  private queryParameters: IMapServerRequest = {};
  private queryType: string;
  private map: L.Map;
  // subjects
  private $layerCounter = new BehaviorSubject(-1);

  constructor(
    private actions$: Actions,
    private store: Store<AppState>,
    private httpCallsService: HttpCallsService,
    private mapEventsService: MapEventsService,
    private mapService: MapService,
    private translationService: TranslationService,
    private toastService: ToastService
  ) {
    this.$layerCounter.subscribe((counter) => {
      if (counter >= 0) {
        //WMS GEOJSON
        if (
          !this.layersForSearch[counter].type.startsWith('ESRI') &&
          !this.layersForSearch[counter].type.toUpperCase().startsWith('OGRE')
        ) {
          this.store.dispatch(
            SearchResultActions.readSearchResults({
              payload: {
                configuration: this.layersForSearch[counter],
                bbox: this.bbox,
                counter,
              },
            })
          );
        } //ESRI LAYERS
        else if (this.layersForSearch[counter].type.startsWith('ESRI')) {
          this.store.dispatch(
            SearchResultActions.readSearchResultsESRI({
              payload: {
                configuration: this.layersForSearch[counter],
                bbox: this.bbox,
                counter,
                type: this.layersForSearch[counter].type,
              },
            })
          );
        } //OGREGEOJSON SHAPEFILE LAYER / NOT A REQUEST
        else {
          this.store.dispatch(
            SearchResultActions.readSearchResultsOGRE({
              payload: {
                configuration: this.layersForSearch[counter],
                bbox: this.bbox,
                counter,
                type: this.layersForSearch[counter].type,
              },
            })
          );
        }
      } else {
        if (counter === -2) {
          this.mapEventsService.offRectangeSearch(this.map);
        }
      }
    });

    this.mapEventsService.getMap().subscribe((map) => {
      this.map = map;
    });
  }

  configureQueryParameters(action: string, configuration: IConfigurationLayer) {
    let objectToReturn = {};
    let newBbox = this.bbox.join(','); //pass old bbox
    // if (action === 'point') {
    //   newBbox = this.mapService
    //     .getBboxBasedOnPixels(newBbox.split(','), this.map, 100)
    //     .join(',');
    // }
    //if defaultCRS for external layers
    if (configuration.defaultCrs) {
      const defaultCRSbbox = newBbox.split(',');
      let convertedCoords = [
        this.mapService.convertCoordinates(
          'EPSG:4326',
          this.mapService.convertAuthorizationCrsToCrs(
            configuration.defaultCrs
          ),
          [+defaultCRSbbox[1], +defaultCRSbbox[0]] as proj4.TemplateCoordinates
        ),
        this.mapService.convertCoordinates(
          'EPSG:4326',
          this.mapService.convertAuthorizationCrsToCrs(
            configuration.defaultCrs
          ),
          [+defaultCRSbbox[3], +defaultCRSbbox[2]] as proj4.TemplateCoordinates
        ),
      ];
      convertedCoords = [
        convertedCoords[0][0],
        convertedCoords[0][1],
        convertedCoords[1][0],
        convertedCoords[1][1],
      ];
      if (
        this.mapService.convertAuthorizationCrsToCrs(
          configuration.defaultCrs
        ) === 'EPSG:4326'
      ) {
        convertedCoords = [
          convertedCoords[1],
          convertedCoords[0],
          convertedCoords[3],
          convertedCoords[2],
        ];
      }
      newBbox = convertedCoords.join(',') + ',' + configuration.defaultCrs;
    }

    switch (action) {
      case 'point':
        objectToReturn = {
          ...this.queryParameters,
          bbox:
            this.queryParameters.request === 'GetFeatureInfo'
              ? this.bbox.join(',')
              : newBbox,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          info_format: configuration.outputFormat
            ? configuration.outputFormat
            : 'GEOJSON',
          mapfile: configuration.mapfile,
          url: configuration?.url,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          query_layers: configuration.name,
          layers: configuration.name,
        };
        break;

      case 'rectangle':
        objectToReturn = {
          ...this.queryParameters,
          bbox: newBbox,
          outputFormat: configuration.outputFormat
            ? configuration.outputFormat
            : 'geojson',
          mapfile: configuration.mapfile,
          url: configuration?.url,
          typename: configuration.name,
        };
        break;
      default:
        break;
    }
    return objectToReturn;
  }

  configureQueryParametersESRI(
    action: string,
    configuration: IConfigurationLayer
  ) {
    let objectToReturn: IEsriServerRequest = {};
    const newBbox = this.bbox.join(','); //pass old bbox
    const bbox = newBbox.split(',');
    const bboxString = bbox[1] + ',' + bbox[0] + ',' + bbox[3] + ',' + bbox[2];
    const bboxPointString =
      (parseFloat(bbox[1]) + parseFloat(bbox[3])) / 2 +
      ',' +
      (parseFloat(bbox[0]) + parseFloat(bbox[2])) / 2;
    const mapExtentLatLong = this.map.getBounds();
    const mapExtent = [
      mapExtentLatLong.getSouthWest().lng,
      mapExtentLatLong.getSouthWest().lat,
      mapExtentLatLong.getNorthEast().lng,
      mapExtentLatLong.getNorthEast().lat,
    ];
    if (configuration.type === 'ESRIMAP') {
      switch (action) {
        case 'point':
          objectToReturn = {
            url: configuration?.url,
            f: 'json',
            tolerance: 1,
            layers: 'all:' + configuration.esriLayersID[0],
            mapExtent: mapExtent.join(','),
            geometryType: 'esriGeometryPoint',
            geometry: bboxPointString,
            imageDisplay: '500,500,96',
            sr: 4326,
          };
          break;

        case 'rectangle':
          objectToReturn = {
            url: configuration?.url,
            f: 'json',
            tolerance: 100,
            layers: 'all:' + configuration.esriLayersID[0],
            mapExtent: mapExtent.join(','),
            geometryType: 'esriGeometryEnvelope',
            geometry: bboxString,
            imageDisplay: '500,500,96',
            sr: 4326,
          };
          break;
        default:
          break;
      }
    } else {
      switch (action) {
        case 'point':
          objectToReturn = {
            url: configuration?.url,
            f: 'json',
            geometryType: 'esriGeometryEnvelope',
            geometry: this.mapService
              .getBboxBasedOnPixels(bboxString.split(','), this.map)
              .join(','),
            outSR: 4326,
            inSR: 4326,
            esriLayersID: configuration.esriLayersID.join(','),
          };
          break;
        case 'rectangle':
          objectToReturn = {
            url: configuration?.url,
            f: 'json',
            geometryType: 'esriGeometryEnvelope',
            geometry: bboxString,
            outSR: 4326,
            inSR: 4326,
            esriLayersID: configuration.esriLayersID[0] + '',
          };
          break;
        default:
          break;
      }
    }
    return objectToReturn;
  }
}
