import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {GenitoreComponent} from './genitore.component';
import {PrenotazioniComponent} from '../prenotazioni/prenotazioni.component';
import {ComunicazioniComponent} from '../comunicazioni/comunicazioni.component';

const genitoreRoutes: Routes = [
  { path: 'genitore', component: GenitoreComponent,
    children: [
      { path: 'prenotazioni', component: PrenotazioniComponent },
      { path: 'comunicazioni', component: ComunicazioniComponent}
    ],
  },
];

@NgModule({
  imports: [ RouterModule.forChild(genitoreRoutes) ],
  exports: [ RouterModule ]
})
export class GenitoreRoutingModule { }
