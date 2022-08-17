import { Injectable } from '@angular/core';
import { AlertController, AlertInput } from '@ionic/angular';
import { environment } from '../../environments/environment';
import { IError } from '../core/interfaces/error.interface';
import { TranslationService } from './translation.service';

@Injectable({ providedIn: 'root' })
export class DialogService {
  constructor(
    private alertController: AlertController,
    private translationService: TranslationService
  ) {}

  createSystemErrorAlert(error: IError): Promise<HTMLIonAlertElement> {
    return this.alertController.create({
      header: 'Error',
      subHeader: environment.production ? null : error.name,
      message: environment.production
        ? error.messageToUser
        : `message: ${error.message}<br><br>messageToUser: ${error.messageToUser}<br><br>stack: ${error.stack}`,
      buttons: ['OK'],
    });
  }

  createAlert(
    header: string,
    subHeader: string,
    message: string
  ): Promise<HTMLIonAlertElement> {
    return this.alertController.create({
      header,
      subHeader,
      message,
      buttons: ['OK'],
    });
  }

  infoAlert(
    message: string,
    header?: 'Information' | 'Error',
    subHeader?: string
  ): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header: header || 'Information',
        subHeader,
        message,
        buttons: [
          {
            text: 'Ok',
            cssClass: 'danger',
            handler: () => resolve(true),
          },
        ],
      });

      void alert.present();
    });
  }

  async confirmationAlert(message: string, header?: string): Promise<boolean> {
    let resolveFunction: (confirm: boolean) => void;

    const promise = new Promise<boolean>((resolve) => {
      resolveFunction = resolve;
    });

    const alert = await this.alertController.create({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      header:
        header || this.translationService.translate('DIALOGS.CONFIRMATION'),
      message,
      // backdropDismiss: false,
      buttons: [
        {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          text: this.translationService.translateNoAccents('DIALOGS.CANCEL'),
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => resolveFunction(false),
        },
        {
          text: 'Ok',
          cssClass: 'danger',
          handler: () => resolveFunction(true),
        },
      ],
    });
    await alert.present();
    return promise;
  }

  async presentConfirm(
    header: string,
    message: string,
    cancelText: string,
    okText: string
  ): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return new Promise(async (resolve) => {
      const alert = await this.alertController.create({
        header,
        message,
        buttons: [
          {
            text: cancelText,
            role: 'cancel',
            cssClass: 'secondary',
            handler: () => {
              resolve('cancel');
            },
          },
          {
            text: okText,
            handler: () => {
              resolve('ok');
            },
          },
        ],
      });
      void alert.present();
    });
  }

  async customAlertInputs(
    message: string,
    header?: string,
    okButton?: string,
    cancelButton?: string,
    inputs?: AlertInput[]
  ): Promise<{ isSubmitted: boolean; data: any }> {
    let resolveFunction: (confirm: {
      isSubmitted: boolean;
      data: unknown;
    }) => void;
    const resolvedData = {
      isSubmitted: null,
      data: null,
    };

    const promise = new Promise<{ isSubmitted: boolean; data: unknown }>(
      (resolve) => {
        resolveFunction = resolve;
      }
    );

    const alert = await this.alertController.create({
      header:
        header || this.translationService.translate('DIALOGS.CONFIRMATION'),
      message,
      inputs,
      buttons: [
        {
          text: cancelButton,
          role: 'cancel',
          cssClass: 'secondary',
          handler: () => {
            resolvedData.isSubmitted = false;
            resolveFunction(resolvedData);
          },
        },
        {
          text: okButton,
          cssClass: 'danger',
          handler: (inputsData) => {
            // ToDo how to validate inputs...
            resolvedData.data = inputsData;
            resolvedData.isSubmitted = true;
            resolveFunction(resolvedData);
          },
        },
      ],
    });

    await alert.present();

    return promise;
  }
}
