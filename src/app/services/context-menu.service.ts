import {
  ApplicationRef,
  ComponentFactoryResolver,
  ComponentRef,
  Injectable,
  Injector,
} from '@angular/core';
import { LatLng } from 'leaflet';
import { LeafletContextMenuComponent } from '../core/components/leaflet-context-menu/leaflet-context-menu.component';
import { IConfigurationLayer } from '../core/interfaces/configuration.interface';
import lodash from 'lodash';
import { TranslationService } from './translation.service';

@Injectable({
  providedIn: 'root',
})
export class ContextMenuService {
  private popupComponentRef: ComponentRef<LeafletContextMenuComponent>;

  constructor(
    private componentFactoryResolver: ComponentFactoryResolver,
    private translationService: TranslationService,
    public injector: Injector,
    public applicationRef: ApplicationRef
  ) { }

  bindPopup(configLayer: IConfigurationLayer, coords: LatLng, feature) {
    if (this.popupComponentRef) {
      this.popupComponentRef.destroy();
    }

    // Create element
    const popup = document.createElement('event-popup-component');

    // Create the component and wire it up with the element
    const factory = this.componentFactoryResolver.resolveComponentFactory(
      LeafletContextMenuComponent
    );
    this.popupComponentRef = factory.create(this.injector, [], popup);

    // Attach to the view so that the change detector knows to run
    this.applicationRef.attachView(this.popupComponentRef.hostView);

    const newConfig = lodash.cloneDeep(configLayer);
    newConfig.contextMenu.forEach((l) => {
      l.image = 'link-outline';
      if (l.googleMaps) {
        l.image = 'locate-outline';
        l.hyperlink =
          'http://maps.google.com/maps?q=' + coords.lat + ',' + coords.lng;
      }
      if (l.googleStreetView) {
        l.image = 'navigate-circle-outline';
        l.hyperlink =
          'http://maps.google.com/maps?q=&layer=c&cbll=' +
          coords.lat +
          ',' +
          coords.lng +
          '&cbp=11,0,0,0,0';
      }
      if (l.fieldName && !l?.hyperlinkField) {
        if (feature.properties.hasOwnProperty(l.fieldName)) {
          l.text = this.translationService.translate(l.fieldDescription) + ' : ' + feature.properties[l.fieldName];
        } else {
          l.text = 'error in fieldName';
        }
      }
      if (l.fieldName && l.hyperlinkField) {
        if (feature.properties.hasOwnProperty(l.fieldName)) {
          l.hyperlink = feature.properties[l.fieldName];
        } else {
          l.text = 'error in fieldName';
        }
      }
    });

    //TODO HOOK FOR ADDITIONAL TABS

    if (newConfig.relation && newConfig.relation.filter((x) => x?.position === 'context')) {
      const actionRelations = newConfig.relation.filter((x) => x?.position === 'context');

      actionRelations.forEach((x) => {
        newConfig.contextMenu.push({ text: x.description, callback: x.functionName });
      });
    }

    // if (newConfig.name === 'v_parcels_spatial' && newConfig.relation) {
    //   newConfig.contextMenu.push({ text: 'my action', callback: 'action' });
    // }

    this.popupComponentRef.instance.feature = feature;
    // this.popupComponentRef.instance.layer = layer;
    this.popupComponentRef.instance.configLayer = newConfig;
    this.popupComponentRef.instance.coords = coords;
    document.body.appendChild(popup);
    return popup;
  }
}
