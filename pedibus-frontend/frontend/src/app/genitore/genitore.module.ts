import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import { GenitoreRoutingModule } from './genitore-routing.module';
import {GenitoreService} from '../services/genitore-service/genitore.service';
import {GenitoreComponent} from './genitore.component';
import {PrenotazioniComponent} from '../prenotazioni/prenotazioni.component';
import {ComunicazioniComponent} from '../comunicazioni/comunicazioni.component';
import {
  MatCardModule,
  MatCheckboxModule,
  MatFormFieldModule,
  MatIconModule,
  MatListModule,
  MatPaginatorModule, MatSelectModule,
  MatTabsModule
} from '@angular/material';
import {FlexLayoutModule} from '@angular/flex-layout';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {MaterialModule} from '../../material-module';
import {HttpClientModule} from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,

    GenitoreRoutingModule,

    MatCheckboxModule,
    MatListModule,
    MatIconModule,
    FlexLayoutModule,
    MatPaginatorModule,
    MatTabsModule,
    MatFormFieldModule,
    BrowserAnimationsModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MaterialModule,
    HttpClientModule
  ],
  exports: [
    GenitoreComponent
  ],
  declarations: [
    GenitoreComponent,
    PrenotazioniComponent,
    ComunicazioniComponent
  ],
  providers: [
    GenitoreService
  ]
})
export class HomeUserGenitoreModule { }
