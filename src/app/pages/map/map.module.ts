import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MapPage } from './map.page';

import { MapPageRoutingModule } from './map-routing.module';
import { TranslateModule } from '@ngx-translate/core';
import { BasemapsComponent } from 'src/app/core/components/submenu/basemaps/basemaps.component';
import { LayersModule } from 'src/app/core/components/submenu/layers/layers.module';
import { LegendComponent } from 'src/app/core/components/submenu/legend/legend.component';
import { AdvancedSearchModule } from 'src/app/core/components/submenu/advanced-search/advanced-search.module';
import { SettingsComponent } from 'src/app/core/components/submenu/settings/settings.component';
import { ToolsModule } from 'src/app/core/components/submenu/tools/tools.module';
import { SearchResultsModule } from 'src/app/core/components/search-results/search-results.module';
import { SubheaderModule } from 'src/app/core/components/subheader/subheader.module';
import { SelectEditLayerModule } from 'src/app/core/components/select-edit-layer/select-edit-layer.module';
import { LeafletContextMenuComponent } from 'src/app/core/components/leaflet-context-menu/leaflet-context-menu.component';
import { EditLayerModule } from 'src/app/core/components/edit-layer/edit-layer.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    MapPageRoutingModule,
    TranslateModule,
    ToolsModule,
    SearchResultsModule,
    SubheaderModule,
    AdvancedSearchModule,
    LayersModule,
    SelectEditLayerModule,
    EditLayerModule

  ],
  declarations: [
    MapPage,
    BasemapsComponent,
    LegendComponent,
    SettingsComponent,
    LeafletContextMenuComponent
  ],
})
export class MapPageModule { }
