import { Injectable } from '@angular/core';
import * as turf from '@turf/turf';
import * as geojson from 'geojson';

@Injectable({
  providedIn: 'root',
})
export class AdvancedSearchService {
  private filtersOperators: {
    value: string;
    description: string;
  }[];
  private filtersSpatialSearchOperators: {
    value: string;
    description: string;
  }[];

  constructor() {
    this.fillOutFiltersOperator();
    this.fillOutSpatialSearchOperator();
  }

  // getters
  getFiltrersOperators() {
    return this.filtersOperators;
  }

  getFiltrersSpatialSearchOperators() {
    return this.filtersSpatialSearchOperators;
  }

  fillOutFiltersOperator() {
    this.filtersOperators = [
      {
        value: '=',
        description: 'EQUAL',
      },
      {
        value: '<>',
        description: 'NOT_EQUAL',
      },
      {
        value: '>',
        description: 'GREATER_THAN',
      },
      {
        value: '<',
        description: 'LESS_THAN',
      },
      {
        value: '>=',
        description: 'GREATER_OR_EQUAL',
      },
      {
        value: '<=',
        description: 'LESS_OR_EQUAL',
      },
      {
        value: 'like',
        description: 'IS_LIKE',
      },
      {
        value: 'startsWith',
        description: 'STARTS_WITH',
      },
      {
        value: 'endsWith',
        description: 'END_WITH',
      },
    ];
  }

  fillOutSpatialSearchOperator() {
    this.filtersSpatialSearchOperators = [
      {
        value: 'INTERSECTS',
        description: 'INTERSECTS',
      },
      {
        value: 'CONTAINS',
        description: 'CONTAINS',
      },
      {
        value: 'WITHIN',
        description: 'WITHIN',
      },
      {
        value: 'DWITHIN',
        description: 'WITHIN_DISTANCE',
      },
      {
        value: 'CROSSES',
        description: 'CROSSES',
      },
      {
        value: 'OVERLAPS',
        description: 'OVERLAPS',
      },
      {
        value: 'TOUCHES',
        description: 'TOUCHES',
      },
    ];
  }

  createFilterProperty(
    filters: {
      field: string;
      operator: string;
      value: string;
    }[]
  ): string {
    let queryString = '';

    filters.map((x) => {
      const wildcardStart = ['like', 'endsWith'].includes(x.operator)
        ? '*'
        : '';

      const wildcardEnd = ['like', 'startsWith'].includes(x.operator)
        ? '*'
        : '';

      const propertyNameSearchQuery =
        '<PropertyName>' +
        x.field +
        '</PropertyName>' +
        '<Literal>' +
        wildcardStart +
        x.value +
        wildcardEnd +
        '</Literal>';

      switch (x.operator) {
        case '=':
          queryString +=
            `<PropertyIsEqualTo matchCase='false'>` +
            propertyNameSearchQuery +
            '</PropertyIsEqualTo>';
          break;

        case '<>':
          queryString +=
            `<PropertyIsNotEqualTo matchCase='false'>` +
            propertyNameSearchQuery +
            '</PropertyIsNotEqualTo>';
          break;

        case '>':
          queryString +=
            '<PropertyIsGreaterThan>' +
            propertyNameSearchQuery +
            '</PropertyIsGreaterThan>';
          break;

        case '<':
          queryString +=
            'PropertyIsLessThan>' +
            propertyNameSearchQuery +
            '</PropertyIsLessThan>';
          break;

        case '>=':
          queryString +=
            '<PropertyIsGreaterOrEqualTo>' +
            propertyNameSearchQuery +
            '</PropertyIsGreaterOrEqualTo>';
          break;

        case '<=':
          queryString +=
            '<PropertyIsLessOrEqualTo>' +
            propertyNameSearchQuery +
            '</PropertyIsLessOrEqualTo>';
          break;

        default:
          queryString +=
            `<PropertyIsLike wildcard='*' singleChar='.' escape='!' matchCase='false'>` +
            propertyNameSearchQuery +
            '</PropertyIsLike>';
          break;
      }
    });
    return queryString;
  }

  createSpatialFilterXml(
    searchedLayers: L.GeoJSON<any>,
    layer: {
      description: string;
      layerName: string;
      count: number;
    },
    spatialOperator: string,
    distance: number
  ) {
    const geojsonLayers = searchedLayers.getLayers().filter((x: L.GeoJSON) => {
      const feature = x.feature as geojson.Feature;
      return feature.properties.configLayerName === layer.layerName;
    });

    let geometryXml = '';

    geojsonLayers.map((x: L.GeoJSON) => {
      const feature = x.feature as geojson.Feature;
      const geometries = feature.geometry as geojson.MultiPolygon;
      let aaa = '';

      geometries.coordinates.map((y, index) => {
        // console.log(index, y.toString());
        const exteriorOrInterior = index === 0 ? 'exterior' : 'interior';
        aaa +=
          '<' +
          exteriorOrInterior +
          '><linearring srsname="EPSG:4326"><poslist srsdimension="2">' +
          y.toString() +
          '</poslist></linearring></' +
          exteriorOrInterior +
          '>';
      });

      const distanceElement =
        spatialOperator === 'DWITHIN'
          ? // eslint-disable-next-line @typescript-eslint/quotes
          "<Distance units='m'>" + distance + '</Distance>'
          : '';
      //wfs filters dont work for multipolygon in mapserver
      const updatedGeometryType =
        feature.geometry.type === 'MultiPolygon'
          ? 'Polygon'
          : feature.geometry.type;
      geometryXml +=
        '<' +
        spatialOperator +
        '><PropertyName>msGeometry</PropertyName><' +
        updatedGeometryType +
        ' srsname="EPSG:4326">' +
        aaa +
        '</' +
        updatedGeometryType +
        '>' +
        distanceElement +
        '</' +
        spatialOperator +
        '>';
    });

    return geometryXml;
  }
}
