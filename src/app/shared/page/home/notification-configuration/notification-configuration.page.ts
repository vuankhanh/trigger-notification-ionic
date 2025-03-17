import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ModalController, IonInput, IonHeader, IonToolbar, IonButtons, IonButton, IonTitle, IonContent, IonList, IonItem } from "@ionic/angular/standalone";

import { INotificatonConfiguration } from 'src/app/shared/interface/notificaton-configuration.interface';

@Component({
  selector: 'app-notification-configuration',
  templateUrl: './notification-configuration.page.html',
  styleUrls: ['./notification-configuration.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    
    IonItem,
    IonList,
    IonContent,
    IonTitle,
    IonButton,
    IonButtons,
    IonToolbar,
    IonHeader,
    IonInput
  ]
})
export class NotificationConfigurationPage implements OnInit {
  @Input() data?: INotificatonConfiguration;
  private readonly modalCtrl: ModalController = inject(ModalController);

  notificationPackageForm!: FormGroup;
  formBuilder: FormBuilder = inject(FormBuilder);
  constructor() { }

  ngOnInit() {
    this.initForm();
  }

  private initForm(){
    this.notificationPackageForm = this.formBuilder.group({
      packageName: [this.data?.packageName || '']
    });
  }

  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }

  confirm() {
    const formGroupValue: INotificatonConfiguration = this.notificationPackageForm.value;

    return this.modalCtrl.dismiss(formGroupValue, 'confirm');
  }

}
