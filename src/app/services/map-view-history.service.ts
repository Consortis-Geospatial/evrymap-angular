import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';
import { DispatchActionsHelperService } from './dispatch-actions-helper.service';
import { SelectorsHelperService } from './selectors-helper.service';

@Injectable({
  providedIn: 'root',
})
export class MapViewHistoryService {
  private history: {
    center: L.LatLng;
    zoom: number;
  }[] = [];
  private currentHistoryPosition = 0;
  private disableHistory: { next: boolean; previous: boolean };
  // subscriptions
  private subscriptions: Subscription = new Subscription();

  constructor(
    private selectorsHelperService: SelectorsHelperService,
    private dispatchActionsHelperService: DispatchActionsHelperService
  ) {
    this.subscriptions.add(
      this.selectorsHelperService
        .getSubheaderDisableHistory()
        .subscribe((disableHistory) => {
          this.disableHistory = disableHistory;
        })
    );
  }

  // getters
  getHistory() {
    return {
      history: this.history,
      currentPosition: this.currentHistoryPosition,
    };
  }

  //setters
  setCurrentHistoryPosition(value: number): void {
    this.currentHistoryPosition = value;
  }

  initiateHistory(map: L.Map): void {
    this.addViewOnHistory(map);
    this.handleHistory(map);
  }

  handleHistory(map: L.Map, mouseCoordinateX?: number) {
    const mapChangedByMouse = mouseCoordinateX ? true : false;
    if (this.currentHistoryPosition === this.history.length) {
      if (mapChangedByMouse) {
        this.addViewOnHistory(map);
      }
    } else {
      if (mapChangedByMouse) {
        this.history = this.history.filter(
          (x, i) => i < this.currentHistoryPosition
        );
        this.addViewOnHistory(map);
      }
    }

    this.disableHistory = {
      previous: this.currentHistoryPosition === 1 ? true : false,
      next: this.currentHistoryPosition === this.history.length ? true : false,
    };

    this.dispatchActionsHelperService.dispatchSubheaderDisableHistory(
      this.disableHistory
    );
  }

  addViewOnHistory(map: L.Map) {
    this.history.push({
      center: map.getCenter(),
      zoom: map.getZoom(),
    });
    this.currentHistoryPosition = this.history.length;
  }

  unsubscribeSubjects(): void {
    this.subscriptions.unsubscribe();
  }
}
