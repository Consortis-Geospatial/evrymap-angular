import { Injectable, OnDestroy } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { MapEventsService } from './map-events.service';
import { MapService } from './map.service';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  constructor(
    private translateService: TranslateService,
    private mapService: MapService,
  ) {
    // *the lang to use, if the lang isn't available, it will use the current loader to get them
    // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
  }

  public initialize(): void {
    let language = this.mapService.getConfiguration().general.language;
    if (localStorage.getItem('evrymap-ng-lang')) {
      language = localStorage.getItem('evrymap-ng-lang');
    }
    this.translateService.setDefaultLang('en');
    this.translateService.use(language);


  }
  /**
   * get current language
   *
   * @returns string
   */
  getLanguage(): string {
    return this.translateService.currentLang;
  }

  /**
   *
   * set a language
   *
   *
   * @param {string} lang  language to set
   */
  setLanguage(lang: string): void {
    if (lang) {
      this.translateService.use(lang);
      localStorage.setItem('evrymap-ng-lang', lang);
    }
  }

  /**
   * translations
   *
   * @param key translation key
   * @param params interpolate parameters
   * @returns
   */
  translate(key: string, params?: unknown): string {
    return this.translateService.instant(key, params) as string;
  }

  translateNoAccents(key: string, params?: unknown): string {
    return (this.translateService.instant(key, params) as string)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }


}
