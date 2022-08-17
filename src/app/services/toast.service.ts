import { Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular';

@Injectable({ providedIn: 'root' })
export class ToastService {
  constructor(private toastController: ToastController) {}

  async showToast(
    message: string,
    header?: string,
    color?: string,
    duration?: number
  ): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: !duration ? 2000 : duration,
      color,
      header,
    });
    void toast.present();
  }
}
