import { Component, OnInit } from '@angular/core';
import { PopoverController } from '@ionic/angular';

@Component({
  selector: 'app-export-popover',
  templateUrl: './export-popover.component.html',
  styleUrls: ['./export-popover.component.scss'],
})
export class ExportPopoverComponent implements OnInit {
  constructor(public popoverController: PopoverController) {}

  ngOnInit() {}

  dismissPopover(exportType: string) {
    this.popoverController.dismiss({ exportType }, 'selectionClicked');
  }
}
