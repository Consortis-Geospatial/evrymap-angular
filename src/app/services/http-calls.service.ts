/* eslint-disable @typescript-eslint/naming-convention */
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { IConfigurationLayer } from '../core/interfaces/configuration.interface';
import { IEsriServerRequest } from '../core/interfaces/esri-server-request.interface';
import { IMapServerRequest } from '../core/interfaces/map-server-request.interface';
import { MapService } from './map.service';
import { TranslationService } from './translation.service';
@Injectable({
  providedIn: 'root',
})
export class HttpCallsService {
  private mapServerUrl: string;
  private ogrApi: string;
  constructor(
    private http: HttpClient,
    private mapService: MapService,
    private translationService: TranslationService
  ) {}

  public initialize() {
    // this.mapServerUrl = this.mapService.getConfiguration().map.mapServerExeUrl;
    if (this.mapService.getConfiguration().map.useWrappedMS) {
      this.mapServerUrl =
        window.location.protocol +
        '//' +
        this.mapService.getConfiguration().map.mapserver;
    } else {
      this.mapServerUrl =
        window.location.protocol +
        '//' +
        this.mapService.getConfiguration().map.mapserver +
        '/' +
        this.mapService.getConfiguration().map.mapservexe;
    }
    this.ogrApi = this.mapService.getConfiguration().general.ogrApi;
  }

  getFromMapServer(
    params: IMapServerRequest,
    responseIsXml?: boolean
  ): Observable<any> {
    const { mapfile, url, map, ...newParams } = params;
    // { responseType: 'text' }
    let mapUrl: string;
    if (mapfile || map) {
      if (this.mapService.getConfiguration().map.useWrappedMS) {
        const mymap = !!mapfile !== false ? mapfile : map;
        mapUrl =
          this.mapServerUrl +
          '/' +
          mymap.split('\\')[mymap.split('\\').length - 1].split('.')[0];
      } else {
        mapUrl = `${this.mapServerUrl}?map=${mapfile || map}`;
      }
    } else {
      mapUrl = url;
    }
    if (!mapUrl) {
      const errorMessage = this.translationService.translate(
        'ERRORS.TOOLS.URL_IS_NULL'
      );
      return throwError({ message: errorMessage });
    }
    return this.http.get(mapUrl, {
      params: newParams as HttpParams,
      responseType: responseIsXml ? 'text' : null,
    });
  }

  getFromESRIImageServer(params: IEsriServerRequest): Observable<any> {
    const { url, ...newParams } = params;

    return this.http.get(url + '/identify', {
      params: newParams as HttpParams,
    });
  }

  getFromESRIFeatureServer(params: IEsriServerRequest): Observable<any> {
    const { url, esriLayersID, ...newParams } = params;

    return this.http.get(url + '/' + esriLayersID + '/query', {
      params: newParams as HttpParams,
    });
  }

  getFromESRIServer(
    params: IEsriServerRequest,
    configuration: IConfigurationLayer
  ): Observable<any> {
    if (configuration.type === 'ESRIMAP') {
      return this.getFromESRIImageServer(params);
    } else if (configuration.type === 'ESRIFEATURE') {
      return this.getFromESRIFeatureServer(params);
    }
  }

  postToMapServer(body: {
    mapfile?: string;
    url?: string;
    xmlRequest: string;
  }) {
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/xml',
        'X-Requested-With': 'XMLHttpRequest',
      }),
    };
    let mapurl: string;
    if (body.mapfile != null) {
      let mapServerUrl;

      if (this.mapService.getConfiguration().map.useWrappedMS) {
        mapServerUrl =
          window.location.protocol +
          '//' +
          this.mapService.getConfiguration().map.mapserver;
      } else {
        mapServerUrl =
          window.location.protocol +
          '//' +
          this.mapService.getConfiguration().map.mapserver +
          '/' +
          this.mapService.getConfiguration().map.mapservexe;
      }
      if (this.mapService.getConfiguration().map.useWrappedMS) {
        mapurl =
          mapServerUrl +
          '/' +
          body.mapfile
            .split('\\')
            [body.mapfile.split('\\').length - 1].split('.')[0];
      } else {
        mapurl = `${mapServerUrl}?map=${body.mapfile}`;
      }
    } else {
      mapurl = body.url;
    }

    if (this.mapService.getConfiguration().general?.proxyUrl) {
      mapurl = this.mapService.getConfiguration().general.proxyUrl + mapurl;
    }

    return this.http.post(mapurl, body.xmlRequest, httpOptions);
  }

  searchAddress(searchValue: string, addressMode: string): Observable<any> {
    const country = this.mapService.getConfiguration().map.addressCountrySearch;

    switch (addressMode.toLowerCase()) {
      case 'nominatim':
        return this.http.get(
          `https://nominatim.openstreetmap.org/search/${searchValue}`,
          {
            params: {
              format: 'jsonv2',
              polygon_geojson: 1,
              limit: 50,
              countrycodes: country,
              addressdetails: 1,
            },
          }
        );

      default:
        return this.http.get(
          `https://nominatim.openstreetmap.org/search/${searchValue}`,
          {
            params: {
              format: 'jsonv2',
              polygon_geojson: 1,
              limit: 50,
              countrycodes: country,
              addressdetails: 1,
            },
          }
        );
    }
  }

  validateBingLayer(key: string) {
    return this.http.get(
      'https://dev.virtualearth.net/REST/v1/Imagery/Metadata/AerialWithLabels',
      {
        params: {
          key,
          include: 'ImageryProviders',
          uriScheme: 'https',
          c: 'en-US',
          json: 'jsonp_1637936762535_7753',
        },
      }
    );
  }

  sendWXS(url: string) {
    return this.http.get(url, { params: {}, responseType: 'text' });
  }

  createLegendImageESRI(
    mapServerRequestBaseUrl: string,
    esriLayersID: number[],
    type: string
  ) {
    if (type !== 'ESRIFEATURE') {
      return this.http.get(mapServerRequestBaseUrl + '/legend', {
        params: {
          f: 'json',
          dynamicLayers: esriLayersID,
        },
      });
    } else {
      return this.http.get(mapServerRequestBaseUrl + '/legend', {
        params: {
          f: 'json',
        },
      });
    }
  }

  esriGet(url: string) {
    return this.http.get(url + '?f=json');
  }

  ogreGetGeojson(formData: FormData) {
    const httpOptions = {
      headers: new HttpHeaders({
        // 'Content-Type': 'multipart/form-data',
        Accept: 'application/json',
      }),
    };

    return this.http.post(
      // 'https://ogre.adc4gis.com/convert',
      this.ogrApi + '/convert',
      formData,
      httpOptions
    );
  }

  ogreGetShapefile(geojson: { json: GeoJSON.GeoJsonObject }, format: string) {
    // const newParams = { ...params } as unknown;
    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/x-www-form-urlencoded',
        // 'Content-Disposition': 'attachment; filename="ogre.shz"',
        Accept: '*/*',
      }),
      responseType: 'arraybuffer' as const,
    };
    const body = new URLSearchParams();
    body.set('json', JSON.stringify(geojson.json));
    body.set('forceUTF8', 'true');
    if (format === 'CSV') {
      body.set('format', format);
    }
    //TODO DOESN'T WORK
    return this.http.post(
      // 'https://ogre.adc4gis.com/convertJson',
      this.ogrApi + '/convertJson',
      body,
      httpOptions
    );
  }

  editLayerSave(url: string, data: any) {
    return this.http.post(
      // 'https://ogre.adc4gis.com/convertJson',
      url,
      data
    );
  }

  customLutTable(url: string) {
    return this.http.get(url);
  }
}
