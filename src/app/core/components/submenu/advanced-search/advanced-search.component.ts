import { Component, Input, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { FeatureCollection } from '@turf/helpers';
import { Subscription } from 'rxjs';
import { ILayer } from 'src/app/core/models/layer.model';
import { AdvancedSearchService } from 'src/app/services/advanced-search.service';
import { DispatchActionsHelperService } from 'src/app/services/dispatch-actions-helper.service';
import { SelectorsHelperService } from 'src/app/services/selectors-helper.service';
import { ToastService } from 'src/app/services/toast.service';
import { TranslationService } from 'src/app/services/translation.service';
import * as geojson from 'geojson';
@Component({
  selector: 'app-advanced-search',
  templateUrl: './advanced-search.component.html',
  styleUrls: ['./advanced-search.component.scss'],
})
export class AdvancedSearchComponent implements OnInit {
  @Input() searchedLayers: L.GeoJSON;
  public searchForm: FormGroup;
  public layersForSearch: ILayer[] = [];
  public layerFields = [];
  public filtersOperators: {
    value: string;
    description: string;
  }[] = [];
  public filtersSpatialSearchOperators: {
    value: string;
    description: string;
  }[] = [];
  public filtersAreFilled = false;
  public filters: { field: string; operator: string; value: string }[] = [
    { field: null, operator: '=', value: null },
  ];
  public searchedLayersSelect: {
    description: string;
    layerName: string;
    count: number;
  }[] = [];
  public spatialOperator: string;
  public spatialLayer: string;
  public distance: number;

  private layersArray: ILayer[] = [];
  // subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    public formBuilder: FormBuilder,
    private translationService: TranslationService,
    private toastSearvice: ToastService,
    private selectorsHelperService: SelectorsHelperService,
    private dispatchActionsHelperService: DispatchActionsHelperService,
    private advancedSearchService: AdvancedSearchService
  ) {
    this.filtersOperators = this.advancedSearchService.getFiltrersOperators();
    this.filtersSpatialSearchOperators =
      this.advancedSearchService.getFiltrersSpatialSearchOperators();

    this.subscriptions.add(
      this.selectorsHelperService
        .getLayers()
        .subscribe((layers) => (this.layersArray = layers))
    );
  }

  get f(): { [key: string]: AbstractControl } {
    return this.searchForm.controls;
  }

  ngOnInit() {
    this.searchForm = this.formBuilder.group({
      layer: [null, Validators.required],
      spatialSearch: false,
      operator: 'and',
    });
  }

  searchOnSubmit() {
    // TODO να ενσωματώσω στη λίστα όλα τα φίλτρα
    const formFields = this.searchForm.value as {
      layer: string;
      spatialSearch: boolean;
      operator: string;
    };
    this.checkFilters();

    if (!formFields.spatialSearch) {
      if (!this.filtersAreFilled || this.filters.length === 0) {
        this.toastSearvice.showToast(
          this.translationService.translate(
            'MAP.SIDE_MENU.SEARCH_SUBMENU.FILTERS_NOT_FILLED_OUT'
          )
        );
        return;
      }
    } else {
      if (!this.spatialOperator || !this.spatialLayer) {
        this.toastSearvice.showToast(
          this.translationService.translate(
            'MAP.SIDE_MENU.SEARCH_SUBMENU.SPATIAL_FILTERS_NOT_FILLED_OUT'
          )
        );
        return;
      }
    }

    const filtersWithValue = this.filters.filter((x) => x.value);

    let xmlRequest = '';

    const filter =
      this.advancedSearchService.createFilterProperty(filtersWithValue);

    const layerForSearch = this.layersArray.find(
      (x) => x.properties.name === formFields.layer
    ).properties;

    const hasMoreThanOneFilter = this.filters.length > 1 ? true : false;
    const spatialXmlString =
      this.spatialLayer && this.spatialOperator
        ? this.advancedSearchService.createSpatialFilterXml(
            this.searchedLayers,
            this.searchedLayersSelect.find(
              (x) => x?.layerName === this.spatialLayer
            ),
            this.spatialOperator,
            this.distance
          )
        : null;

    if (filtersWithValue.length) {
      if (!formFields.spatialSearch) {
        xmlRequest = !hasMoreThanOneFilter
          ? `${filter}`
          : `<${formFields.operator}>${filter}</${formFields.operator}>`;
      } else {
        const featuresToSearch = this.searchedLayers
          .getLayers()
          .filter((x: L.GeoJSON) => {
            const feature = x.feature as geojson.Feature;
            const layer = this.searchedLayersSelect.find(
              (a) => a?.layerName === this.spatialLayer
            );
            return feature.properties.configLayerName === layer.layerName;
          });

        xmlRequest = '<AND>' + filter;

        xmlRequest +=
          featuresToSearch.length > 1
            ? '<OR>' + spatialXmlString + '</OR>'
            : spatialXmlString;

        xmlRequest += '</AND>';
      }
    } else {
      xmlRequest = spatialXmlString;
    }

    xmlRequest =
      '<?xml version="1.0" encoding="UTF-8"?><wfs:GetFeature service="WFS" version="1.0.0" outputFormat="geojson">' +
      '<wfs:Query typeName="sf:' +
      layerForSearch.name +
      '"><Filter>' +
      xmlRequest +
      '</Filter></wfs:Query>' +
      '</wfs:GetFeature>';

    const postBody = {
      mapfile: layerForSearch?.mapfile,
      url: layerForSearch?.url,
      xmlRequest,
    };
    this.spatialLayer = null;
    this.dispatchActionsHelperService.dispatchAdvancedSearchResults(postBody);
  }

  selectLayerOnFocus() {
    this.layersForSearch = this.layersArray.filter(
      (x) =>
        x.properties.displayOnStartup &&
        x.properties.queryable &&
        !x.properties.type.startsWith('ESRI')
    );
  }

  selectLayerOnChange() {
    const layerFound = this.layersForSearch
      .map((x) => x.properties)
      .find((x) => x.name === this.searchForm.value.layer);

    this.layerFields = layerFound.searchFields;
  }

  createNewFilter() {
    this.filters.push({ field: null, operator: '=', value: null });
  }

  deleteFilter(index: number) {
    this.filters = this.filters.filter((x, i) => i !== index);
  }

  checkFilters() {
    this.filtersAreFilled = this.filters.find(
      (x) => !x.field || !x.operator || !x.value
    )
      ? false
      : true;
  }

  selectSelectedLayerOnFocus() {
    this.searchedLayersSelect = [];

    const layers = this.searchedLayers.toGeoJSON() as FeatureCollection;
    const layersObject = {};

    layers.features.map((x) => {
      const layerDescription = this.layersArray.find(
        (y) => y.properties.name === x.properties.configLayerName
      );
      layersObject[x.properties.configLayerName] =
        layerDescription.properties.label;
    });

    let layersObjectKeys = Object.entries(layersObject);
    layersObjectKeys = layersObjectKeys.filter(
      (lobj) =>
        !this.layersArray
          .find((l) => l.properties.name === lobj[0])
          .properties.type.startsWith('ESRI')
    );
    layersObjectKeys.map((x: [string, string]) => {
      this.searchedLayersSelect.push({
        description: x[1],
        layerName: x[0],
        count: layers.features.filter(
          (y) => x[0] === y.properties.configLayerName
        ).length,
      });
    });
  }
}
