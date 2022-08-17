/* eslint-disable @typescript-eslint/naming-convention */
import * as turf from '@turf/turf';

export interface IAddressSearch {
  place_id: number;
  licence: string;
  osm_type: string;
  osm_id: number;
  boundingbox: [string, string, string, string];
  lat: string;
  lon: string;
  display_name: string;
  place_rank: number;
  category: string;
  type: string;
  importance: number;
  icon: string;
  geojson:
    | turf.Point
    | turf.LineString
    | turf.Polygon
    | turf.MultiPoint
    | turf.MultiLineString
    | turf.MultiPolygon;
  address?: {
    city: string;
    state_district: string;
    postcode: string;
    country: string;
  };
  searchId: number;
  clicked: boolean;

  // other layer properties
  geometry?:
    | turf.Point
    | turf.LineString
    | turf.Polygon
    | turf.MultiPoint
    | turf.MultiLineString
    | turf.MultiPolygon;
}
