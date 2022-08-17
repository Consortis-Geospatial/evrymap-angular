import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { SelectEditLayerComponent } from './select-edit-layer.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule,
  ],
  declarations: [SelectEditLayerComponent],
  exports: [SelectEditLayerComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SelectEditLayerModule {}
