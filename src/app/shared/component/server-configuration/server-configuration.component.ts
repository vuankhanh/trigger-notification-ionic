import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { NetworkAdress } from '../../interface/server-configuration.interface';
import { IonSelectOption, IonItem, IonLabel, IonButton, IonSelect, IonInput } from "@ionic/angular/standalone";

@Component({
  selector: 'app-server-configuration',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    IonSelectOption,
    IonItem,
    IonLabel,
    IonButton,
    IonSelect,
    IonInput
  ],
  templateUrl: './server-configuration.component.html',
  styleUrls: ['./server-configuration.component.scss'],
})
export class ServerConfigurationComponent  implements OnInit {
  @Input() data?: NetworkAdress;

  @Output() serverAddressChange: EventEmitter<NetworkAdress> = new EventEmitter<NetworkAdress>();

  serverConfigurationGroup!: FormGroup;
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  constructor() { }

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    this.serverConfigurationGroup = this.formBuilder.group({
      protocol: [this.data?.protocol || 'http', Validators.required],
      ipOrDomain: [this.data?.ipOrDomain || '', Validators.required],
      port: [this.data?.port || '', Validators.required],
    });

    this.serverConfigurationGroup.valueChanges.subscribe((value) => {
      console.log(value);
      
    })
  }

  onSubmit() {
    if (this.serverConfigurationGroup.valid) {
      const serverConfiguration = this.serverConfigurationGroup.value;
      console.log(serverConfiguration);
      
      this.serverAddressChange.emit(serverConfiguration);
    }
  }

}
