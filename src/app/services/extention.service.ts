import { Injectable } from '@angular/core';
import { PopoverController } from '@ionic/angular';
import { SelectEditLayerComponent } from '../core/components/select-edit-layer/select-edit-layer.component';

@Injectable({
  providedIn: 'root',
})
export class ExtentionService {
  constructor(public popoverController: PopoverController) {}

  customEvent(event, methodName: string, feature, layer) {
    // console.log('pre custom event: ' + methodName);
    event.stopPropagation();
    event.preventDefault();
    if (this[methodName]) {
      this[methodName](feature, layer);
    }
  }

  async navigateToBuilding(feature, layer) {
    window.parent.postMessage(
      JSON.stringify({
        cmd: 'navigateToBuilding',
        value: {
          id: feature?.properties?.id,
        },
      }),
      '*'
    );
  }

  async navigateToParcel(feature, layer) {
    console.log('nav parcel');
    window.parent.postMessage(
      JSON.stringify({
        cmd: 'navigateToParcel',
        value: {
          id: feature?.properties?.id,
        },
      }),
      '*'
    );
  }

  //TODO HOOK FOR ADDITIONAL TABS EXAMPLE
  // async action(feature, layer) {
  //   console.log('custom event');

  //   const popover = await this.popoverController.create({
  //     component: SelectEditLayerComponent,
  //     // event: e,
  //     cssClass: 'selectEditLayerComponent',
  //     componentProps: {
  //       // editableLayers,
  //     },
  //   });
  //   await popover.present();
  //   const { data, role } = await popover.onDidDismiss<{}>();
  // }
}
