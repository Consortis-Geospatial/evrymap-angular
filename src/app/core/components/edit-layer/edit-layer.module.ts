import { CommonModule } from '@angular/common';
import { CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { EditLayerComponent } from './edit-layer.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        IonicModule,
        TranslateModule,
        IonicModule,
    ],
    declarations: [EditLayerComponent],
    exports: [EditLayerComponent],
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class EditLayerModule { }
