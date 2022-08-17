import { Component, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { ModalController, PopoverController } from '@ionic/angular';
import * as geojson from 'geojson';
import { Map } from 'leaflet';
import { Subscription } from 'rxjs';
import { HttpCallsService } from 'src/app/services/http-calls.service';
import { MapEventsService } from 'src/app/services/map-events.service';
import { ToastService } from 'src/app/services/toast.service';
import { TranslationService } from 'src/app/services/translation.service';
import { IConfigurationLayer } from '../../interfaces/configuration.interface';

@Component({
  selector: 'app-edit-layer',
  templateUrl: './edit-layer.component.html',
  styleUrls: ['./edit-layer.component.scss'],
})
export class EditLayerComponent implements OnInit {
  @Input() feature: geojson.Feature;
  @Input() config: IConfigurationLayer;
  @Input() map: Map;

  fields = [];
  numberOfRows: number;
  rowsArray: number[] = null;
  myform: FormGroup = null;
  formCreated = false;
  lutTables = {};
  saveSubscription: Subscription;

  constructor(
    fb: FormBuilder,
    public httpCallsService: HttpCallsService,
    public mapEventsService: MapEventsService,
    public toastService: ToastService,
    public popOverController: PopoverController,
    public translationService: TranslationService
  ) {}

  ngOnInit() {
    if (this.config?.edit?.fields) {
      this.fields = this.config.edit.fields;

      // eslint-disable-next-line prefer-const
      for (let field of this.fields) {
        if (field?.type === 'dropdown') {
          this.httpCallsService
            .customLutTable(field?.dropdownService)
            .subscribe(
              (data) => {
                this.lutTables[field.name] = data;
              },
              (err) => {
                this.toastService.showToast(
                  this.translationService.translate('ERRORS.HTTP', {
                    url: field?.dropdownService,
                  }),
                  null,
                  'danger',
                  5000
                );
              }
            );
        }
      }
      // this.numberOfRows = Math.ceil(this.fields.length / 3);
      // this.rowsArray = [];
      // for (let row = 0; row < this.numberOfRows; row++) {
      //   this.rowsArray.push(row);
      // }
    }

    this.createForm();
  }

  createForm() {
    this.myform = new FormGroup({});
    // eslint-disable-next-line prefer-const
    for (let f of this.fields) {
      // formObject[field.name] = this.feature.properties[field.name];
      const validatorsArray = [];
      if (f?.required) {
        validatorsArray.push(Validators.required);
      }
      if (f?.maxLength) {
        validatorsArray.push(Validators.maxLength(f.maxLength));
      }

      // if (!f?.readOnly)
      {
        const control = new FormControl(
          this.feature ? this.feature.properties[f?.name] : null,
          validatorsArray
        );
        this.myform.addControl(f?.name, control);
      }
    }

    const geomControl = new FormControl(
      JSON.stringify(this.mapEventsService.lastGeometryChanged.geom)
    );
    this.myform.addControl(this.config?.edit?.geometryColumn, geomControl);
    this.formCreated = true;
  }

  onSubmit() {
    // console.log(this.myform.value);

    if (this.saveSubscription) {
      this.saveSubscription.unsubscribe();
    }

    let newForm = {};
    if (this.config.edit?.primaryKey) {
      newForm = {
        ...this.myform.value,
        [this.config.edit?.primaryKey]: this.feature
          ? this.feature.properties[this.config.edit?.primaryKey]
          : null,
      };
    } else {
      newForm = {
        ...this.myform.value,
        // eslint-disable-next-line @typescript-eslint/dot-notation
        id: this.feature ? this.feature.properties['id'] : null,
      };
    }
    this.saveSubscription = this.httpCallsService
      .editLayerSave(this.config?.edit?.serviceUrl, newForm)
      .subscribe(
        () => {
          //RELOAD LAYER AND REPLACE

          this.mapEventsService.replaceWmsWithGeojson(
            this.map,
            'GeoJSON',
            this.mapEventsService.selectedLayerConfigToEdit
          );
          this.toastService.showToast(
            this.translationService.translate('MAP.EDIT.SAVE_SUCESS')
          );
          this.popOverController.dismiss();
        },
        (err) => {
          this.toastService.showToast(
            this.translationService.translate('ERRORS.HTTP.LOAD_LAYER', {
              url: this.config?.edit?.serviceUrl,
            }),
            null,
            'danger',
            5000
          );
        }
      );
  }

  cancel() {
    if (this.feature == null) {
      if (this.config) {
        //delete create polygons
        if (this.mapEventsService.layersEditModeCreate) {
          this.mapEventsService.layersEditModeCreate.map((x) => {
            this.map.removeLayer(x);
          });
          this.mapEventsService.layersEditModeCreate = [];
        }
      }
    }

    this.popOverController.dismiss();
  }
}
