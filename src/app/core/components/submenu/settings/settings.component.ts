import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { MapEventsService } from 'src/app/services/map-events.service';
import { TranslationService } from 'src/app/services/translation.service';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
})
export class SettingsComponent implements OnInit, OnDestroy {
  @Input() language: string;


  map: L.Map;
  mapSubscription: Subscription;

  constructor(public translationService: TranslationService, public mapEventsService: MapEventsService) { }

  ngOnInit() {
    this.mapSubscription = this.mapEventsService.getMap().subscribe((map: L.Map) => (this.map = map));
  }

  changeLang(lang: string) {
    this.translationService.setLanguage(lang);
    this.map.pm.setLang(lang as 'el' | 'en');
  }

  ngOnDestroy() {
    if (this.mapSubscription) {
      this.mapSubscription.unsubscribe();
    }
  }
}
