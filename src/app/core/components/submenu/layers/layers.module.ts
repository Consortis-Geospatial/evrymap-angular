import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { LayersComponent } from './layers.component';
import { ExportPopoverComponent } from './export-popover/export-popover.component';
import { SelectExternalLayersComponent } from './select-external-layers/select-external-layers.component';
import { MatTooltipModule } from '@angular/material/tooltip';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule,
    MatTooltipModule
  ],
  declarations: [LayersComponent, ExportPopoverComponent, SelectExternalLayersComponent],
  exports: [LayersComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class LayersModule { }
