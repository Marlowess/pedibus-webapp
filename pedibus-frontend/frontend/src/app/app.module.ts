/* ============================================================================================= */
/*                                      ANGULAR-MATERIAL IMPORTS                                 */
/* ============================================================================================= */
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { BrowserModule } from '@angular/platform-browser';
import { DateAdapter, MAT_DATE_FORMATS, MAT_DATE_LOCALE } from '@angular/material/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { LOCALE_ID, NgModule } from '@angular/core';
import { MatCardModule } from '@angular/material';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material';
import { MatListModule, MatSelectModule } from '@angular/material';
import { MatTabsModule } from '@angular/material/tabs';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MomentDateAdapter } from '@angular/material-moment-adapter';
import { registerLocaleData } from '@angular/common';
import localeIt from '@angular/common/locales/it-VA';

/* ============================================================================================= */
/*                                      THIRD-PARTY IMPORTS                                      */
/* ============================================================================================= */
import { ToastyModule } from 'ng2-toasty';
import { SimpleNotificationsModule } from 'angular2-notifications';
import { AgmCoreModule } from '@agm/core';
import { API_KEY_GOOGLE_MAPS } from './config/config';

/* ============================================================================================= */
/*                                      PROJECT IMPORTS                                         */
/* ============================================================================================= */
// Interceptors
import { AuthInterceptor } from './http-interceptors/http-interceptor-auth/auth-interceptor.service';
import { JwtInterceptorService } from './http-interceptors/http-interceptor-jwt/jwt-interceptor.service';
import { LoggingInterceptorService } from './http-interceptors/http-logging-interceptor/logging-interceptor.service';

// Modules
import { AppRoutingModule } from './app-routing.module';
import { HomeUserGenitoreModule } from './genitore/genitore.module';
import { MaterialModule } from '../material-module';

// Services
import { CorseService } from './services/corse-service/corse.service';

// Components
import { AccompagnatoreComponent } from './accompagnatore/accompagnatore.component';
import { AmministratoreComponent } from './amministratore/amministratore.component';
import { AppComponent } from './app.component';
import { PresenzeComponent } from './presenze/presenze.component';
// tslint:disable-next-line:max-line-length
import { DialogPresenzePartitiArrivatiComponent } from './dialogs/dialog-presenze-partiti-arrivati/dialog-presenze-partiti-arrivati.component';
import { DialogPresenzeNuovaPrenotazione } from './dialogs/dialog-presenze-nuova-prenotazione/dialog-presenze-nuova-prenotazione.component';
import { DialogTurnoComponent } from './dialogs/dialog-turno/dialog-turno.component';
import { DisponibilitaComponent } from './disponibilita/disponibilita.component';
import { GestioneUtentiComponent } from './gestione-utenti/gestione-utenti.component';
import { HomePageComponent } from './home-page/home-page.component';
import { HomeUserComponent } from './home-user/home-user.component';
import { LoginComponent } from './login/login.component';
import { ProfiloComponent } from './profilo/profilo.component';
import { RegistrationFormComponent } from './registration-form/registration-form.component';
import { TurniComponent } from './turni/turni.component';
import { DialogCreaPrenotazioneComponent } from './dialogs/dialog-crea-prenotazione/dialog-crea-prenotazione.component';
import { PromuoviDeclassaComponent } from './promuovi-declassa/promuovi-declassa.component';
import { DialogProfiloComponent } from './dialogs/dialog-profilo/dialog-profilo.component';
import { DialogUserComponent } from './dialogs/dialog-user/dialog-user.component';
import { VisionaLineeFermateMappaComponent } from './visiona-linee-fermate-mappa/visiona-linee-fermate-mappa.component';
import { MappaFermateComponent } from './mappa-fermate/mappa-fermate.component';
import { DialogEsportaPresenzeComponent } from './dialogs/dialog-esporta-presenze/dialog-esporta-presenze.component';
import { AccessoNegatoComponent } from './accesso-negato/accesso-negato.component';
import { SegreteriaComponent } from './segreteria/segreteria.component';
import { NuovaPasswordComponent } from './nuova-password/nuova-password.component';
import { DialogRecuperaPasswordComponent } from './dialogs/dialog-recupera-password/dialog-recupera-password.component';

/* ============================================================================================= */
/*                    Http interceptor providers in outside-in order                             */
/* ============================================================================================= */
export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: LoggingInterceptorService, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptorService, multi: true },
];

// Date formats
export const MY_FORMATS = {
  parse: { dateInput: 'DD/MM/YYYY' },
  display: {
    dateInput: 'DD/MM/YYYY', monthYearLabel: 'MM YYYY', dateA11yLabel: 'DD/MM/YYYY', monthYearA11yLabel: 'MM YYYY',
  },
};
registerLocaleData(localeIt, 'it');

/* ============================================================================================= */
@NgModule({
  declarations: [
    AccompagnatoreComponent,
    AmministratoreComponent,
    AppComponent,
    PresenzeComponent,

    DialogPresenzeNuovaPrenotazione,
    DisponibilitaComponent,
    DialogTurnoComponent,
    DialogPresenzePartitiArrivatiComponent,

    GestioneUtentiComponent,

    HomePageComponent,
    HomeUserComponent,

    LoginComponent,

    RegistrationFormComponent,

    ProfiloComponent,

    TurniComponent,

    DialogCreaPrenotazioneComponent,

    PromuoviDeclassaComponent,

    DialogProfiloComponent,

    DialogUserComponent,

    VisionaLineeFermateMappaComponent,

    MappaFermateComponent,

    DialogEsportaPresenzeComponent,

    AccessoNegatoComponent,

    SegreteriaComponent,

    NuovaPasswordComponent,

    DialogRecuperaPasswordComponent,
  ],
  imports: [
    BrowserModule,

    MatCardModule,
    MatFormFieldModule,
    MatIconModule,
    MatListModule,
    MatTabsModule,
    MatSelectModule,

    HomeUserGenitoreModule,

    FlexLayoutModule,

    MatPaginatorModule,
    BrowserAnimationsModule,

    FormsModule,
    ReactiveFormsModule,
    AppRoutingModule,
    MaterialModule,
    HttpClientModule,

    AgmCoreModule.forRoot({
      apiKey: `${API_KEY_GOOGLE_MAPS}`
    }),

    SimpleNotificationsModule.forRoot(),
    ToastyModule.forRoot(),
  ],
  entryComponents: [
    DialogCreaPrenotazioneComponent,
    DialogPresenzeNuovaPrenotazione,
    DialogPresenzePartitiArrivatiComponent,
    DialogTurnoComponent,
    PromuoviDeclassaComponent,
    DialogProfiloComponent,
    DialogUserComponent,
    DialogEsportaPresenzeComponent,
    DialogRecuperaPasswordComponent
  ],
  providers: [
    httpInterceptorProviders,
    CorseService,
    { provide: MAT_DATE_LOCALE, useValue: 'it-IT' },
    { provide: DateAdapter, useClass: MomentDateAdapter, deps: [MAT_DATE_LOCALE] },
    { provide: MAT_DATE_FORMATS, useValue: MY_FORMATS}, // MAT_MOMENT_DATE_FORMATS
    { provide: LOCALE_ID, useValue: 'it' }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
