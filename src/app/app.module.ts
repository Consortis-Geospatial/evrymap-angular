/* eslint-disable prefer-arrow/prefer-arrow-functions */
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouteReuseStrategy } from '@angular/router';
import { IonicModule, IonicRouteStrategy } from '@ionic/angular';
import { StoreModule } from '@ngrx/store';
import { StoreDevtoolsModule } from '@ngrx/store-devtools';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { environment } from 'src/environments/environment';
import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import * as fromApp from './store/app.reducer';
import { EffectsModule } from '@ngrx/effects';
import { SearchResultEffects } from './store/effects/search-result.effects';
import { SubheaderEffects } from './store/effects/subheader.effects';
import { LayerEffects } from './store/effects/layer.effects';
import { SelectEditLayerComponent } from './core/components/select-edit-layer/select-edit-layer.component';
import { IConfiguration } from './core/interfaces/configuration.interface';
import { filter, map, take } from 'rxjs/operators';
import { MapService } from './services/map.service';
import { TranslationService } from './services/translation.service';
import { HttpCallsService } from './services/http-calls.service';
import { MapEventsService } from './services/map-events.service';
import { ReactiveFormsModule } from '@angular/forms';

export function languageLoader(http: HttpClient): TranslateHttpLoader {
  return new TranslateHttpLoader(http, 'assets/i18n/', '.json');
}

export function configureJSON(
  mapService: MapService,
  translationService: TranslationService,
  httpCallsService: HttpCallsService
): () => Promise<any> {
  return async () => {
    // console.log('mapService - started');
    const config = await mapService.loadConfiguration();
    translationService.initialize();
    httpCallsService.initialize();
    // mapEventsService.initialize();
    console.log('mapService - completed');
  };
}
@NgModule({
  declarations: [AppComponent],
  entryComponents: [],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    IonicModule.forRoot(),
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    TranslateModule.forRoot({
      defaultLanguage: 'en',
      loader: {
        provide: TranslateLoader,
        useFactory: languageLoader,
        deps: [HttpClient],
      },
      // useDefaultLang: true
    }),
    StoreModule.forRoot(fromApp.appReducer),
    StoreDevtoolsModule.instrument({ logOnly: environment.production }),
    EffectsModule.forRoot([
      SearchResultEffects,
      SubheaderEffects,
      LayerEffects,
    ]),
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: configureJSON,
      multi: true,
      deps: [MapService, TranslationService, HttpCallsService],
    },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
