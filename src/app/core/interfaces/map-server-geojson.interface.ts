export interface IMapServerRequest {
  type: string;
  properties: any;
  geometry: { coordinates: number[][]; type: string };
  searchId?: number;
}
