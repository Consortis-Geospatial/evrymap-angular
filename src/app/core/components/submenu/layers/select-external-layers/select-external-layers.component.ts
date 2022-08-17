import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-select-external-layers',
  templateUrl: './select-external-layers.component.html',
  styleUrls: ['./select-external-layers.component.scss'],
})
export class SelectExternalLayersComponent implements OnInit {
  @Input() layers: any[];
  @Input() selectedLayers: number[];

  searchString = '';

  constructor(public popoverController: PopoverController) {}

  ngOnInit() {}

  toggleSelected(index: number) {
    const indexOfindex = this.selectedLayers.indexOf(index);
    if (this.selectedLayers.includes(index)) {
      this.selectedLayers.splice(indexOfindex, 1);
    } else {
      this.selectedLayers.push(index);
    }
  }

  dismiss(data = null) {
    this.popoverController.dismiss(data);
  }

  search(val: string) {
    this.searchString = val;
  }
}
