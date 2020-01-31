/* =========================================================================================== */
/*                                   ANGULAR IMPORTS                                           */
/* =========================================================================================== */
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

/* =========================================================================================== */
/*                                       OUR IMPORTS                                           */
/* =========================================================================================== */
import { AccompagnatoreComponent } from './accompagnatore/accompagnatore.component';
import { AmministratoreComponent } from './amministratore/amministratore.component';
import { PresenzeComponent } from './presenze/presenze.component';
import { ComunicazioniComponent } from './comunicazioni/comunicazioni.component';
import { DisponibilitaComponent } from './disponibilita/disponibilita.component';
import { GenitoreComponent } from './genitore/genitore.component';
import { GestioneUtentiComponent } from './gestione-utenti/gestione-utenti.component';
import { HomeUserComponent } from './home-user/home-user.component';
import { HomePageComponent } from './home-page/home-page.component';
import { LoginComponent } from './login/login.component';
import { PrenotazioniComponent } from './prenotazioni/prenotazioni.component';
import { ProfiloComponent } from './profilo/profilo.component';
import { RegistrationFormComponent } from './registration-form/registration-form.component';
import { TurniComponent } from './turni/turni.component';
import { PromuoviDeclassaComponent } from './promuovi-declassa/promuovi-declassa.component';
import { OnlyLoggendInUserGuardService } from 'src/app/services/only-loggend-in-user-guard/only-loggend-in-user-guard.service';
import { MappaFermateComponent } from './mappa-fermate/mappa-fermate.component';
import {AccessoNegatoComponent} from './accesso-negato/accesso-negato.component';
import {SegreteriaComponent} from './segreteria/segreteria.component';
import {NuovaPasswordComponent} from './nuova-password/nuova-password.component';

const routes: Routes = [
  { path: 'home-page', component: HomePageComponent },
  { path: 'home-user', component: HomeUserComponent, canActivate: [OnlyLoggendInUserGuardService] },

  { path: 'registration-form/:token',  component: RegistrationFormComponent },
  { path: 'sostituzione-password/:token',  component: NuovaPasswordComponent },
  { path: 'login-form', component: LoginComponent },

  {
    path: 'accesso-negato', component: AccessoNegatoComponent,
    canActivate: [OnlyLoggendInUserGuardService],
  },
  {
    path: 'accompagnatore', component: AccompagnatoreComponent,
    canActivate: [OnlyLoggendInUserGuardService],
    children: [
      { path: 'presenze', component: PresenzeComponent },
      { path: 'disponibilita', component: DisponibilitaComponent },
      { path: 'comunicazioni', component: ComunicazioniComponent }
    ]
  },
  {
    path: 'genitore', component: GenitoreComponent,
    canActivate: [OnlyLoggendInUserGuardService],
    children: [
      { path: 'prenotazioni', component: PrenotazioniComponent },
      { path: 'profilo', component: ProfiloComponent },
      { path: 'comunicazioni', component: ComunicazioniComponent },
      { path: 'mappa-fermate', component: MappaFermateComponent}
    ],
  },
  {
    path: 'amministratore', component: AmministratoreComponent,
    canActivate: [OnlyLoggendInUserGuardService],
    children: [
      { path: 'turni', component: TurniComponent },
      { path: 'promuovi-declassa', component: PromuoviDeclassaComponent},
      { path: 'comunicazioni', component: ComunicazioniComponent },
    ]
  },

  {
    path: 'segreteria', component: SegreteriaComponent,
    canActivate: [OnlyLoggendInUserGuardService],
    children: [
      { path: 'registrazione-utenti', component: GestioneUtentiComponent },
    ]
  },

  { path: '', redirectTo: 'home-page', pathMatch: 'full' },
  { path: '**', redirectTo: 'home-page' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
