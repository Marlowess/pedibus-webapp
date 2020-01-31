/* ============================================================================================= */
/*                                       ANGULAR IMPORTS                                         */
/* ============================================================================================= */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; // , HttpHeaders, HttpErrorResponse
import { Observable, of } from 'rxjs'; // throwError
import { switchMap, tap } from 'rxjs/operators'; // catchError, map, shareReplay

/* ============================================================================================= */
/*                                       OUR PROJETC IMPORTS                                     */
/* ============================================================================================= */
// - Services:
import { AuthService } from '../auth/auth.service';
// import { EventEmitter } from '@angular/core';
// import { Subscription } from 'rxjs/internal/Subscription';

// - Utils:
import { config } from '../../config/config';

// - Domain objects:
import { Prenotazione } from '../../domain/prenotazioni-domain/prenotazione';
import {fromStringToDate, getMillisecAtMidnight, Util} from 'src/app/config/util';
import {Fermata} from '../../domain/prenotazioni-domain/fermata';
// import {MappaMarker} from '../../domain/mappa-marker';

/* ============================================================================================= */
@Injectable({
  providedIn: 'root'
})
export class PrenotazioniService {

  // Here, `PrenotazioniService` private attributes:
  private server: string = config.ip;
  private port: string = config.port;

  private allowedLog = true;

  constructor(
    private autService: AuthService,
    private http: HttpClient
  ) {
    const msg = `[PrenotazioniService] constructor()`;
    Util.customLog(this.allowedLog, Util.LogType.INFO, msg, 'running!');
  }

  /* ============================================================================================= */
  /**
   * Public method `getFermateByLineaAndDirezione` used to get a `list of fermate` from server
   * depending on information
   * as `linea nome` and `direzione`.
   * @param linea string
   * @param direzione boolean
   */
  getFermateByLineaAndDirezione(linea: string, direzione: boolean): Observable<any> {

    const msg = `[PrenotazioniService] getFermateByLineaAndDirezione()`;
    Util.customLog(this.allowedLog, Util.LogType.INFO, msg, 'running!');

    const endpoint = `lines/${linea}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    return this.http.get(url).pipe(
      tap(
        data => {
          Util.customLog(this.allowedLog, Util.LogType.DEBUG,
            `${msg} sendPrenotazione(), tap data: ${JSON.stringify(data)}`);
        },
        error => { Util.customLog(this.allowedLog, Util.LogType.DEBUG,
          `${msg} sendPrenotazione(), tap error: ${JSON.stringify(error)}`); }
      ),
      switchMap((data: any) => {
        // @ts-ignore
        const res: { fermate: Array<Fermata>; scuola: Fermata; } = {
          fermate: new Array<any>(), scuola: new Fermata() };
        if (direzione === true) {
          for (const fermata of data.andata) {
            if (fermata.descrizione !== 'Scuola') {
              res.fermate.push(Fermata.creaFermataFrom(fermata));
            } else {
              res.scuola = fermata;
            }
          }
        } else {
          for (const fermata of data.ritorno) {
            if (fermata.descrizione !== 'Scuola') {
              res.fermate.push(Fermata.creaFermataFrom(fermata));
            } else {
              res.scuola = fermata;
            }
          }
        }
        return of(res);
      })
    );
  }

  /* ============================================================================================= */
  /**
   * Public method `getProfileAndInfoBambini` used to get from server all information
   * about the `bambini` owned by the current, logged in user as `genitore`.
   */
  getProfileAndInfoBambini(): Observable<any> {

    const msg = `[PrenotazioniService] getProfileAndInfoBambini()`;
    Util.customLog(this.allowedLog, Util.LogType.DEBUG, msg, 'running');

    const endpoint = 'profile/';
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    return this.http.get(url).pipe(
      tap(
        data => {
          Util.customLog(this.allowedLog, Util.LogType.DEBUG,
            `${msg} sendPrenotazione(), tap data: ${JSON.stringify(data)}`);
        },
        error => {
          Util.customLog(this.allowedLog, Util.LogType.DEBUG,
            `${msg} sendPrenotazione(), tap error: ${JSON.stringify(error)}`);
        }
      ),
    );

  }

  /**
   * Public method `updatePrenotazione` used to send toward the server a http request for edit
   * an already existing `Prenotazione`,
   * which has been done and requested by a user logged in as `genitore`
   * @param prenotazione Prenotazione
   */
  updatePrenotazione(prenotazione: Prenotazione): Observable<any> {
    const msg = `[PrenotazioniService] updatePrenotazione()`;
    Util.customLog(this.allowedLog, Util.LogType.DEBUG, msg, 'running');

    const endpoint = `reservations/${prenotazione.nomeLinea}/${prenotazione.id}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();

    body.set('fermataSalita', prenotazione.fermataSalita.id);
    body.set('fermataDiscesa', prenotazione.fermataDiscesa.id);
    body.set('bambino', prenotazione.nomeBambino);
    body.set('direzione', prenotazione.direzione.toString());

    return this.http.put(url, body).pipe(
      tap(
        (value) => {
          Util.customLog(this.allowedLog, Util.LogType.DEBUG,
            `${msg}: tap data: ${JSON.stringify(value)}`);
        },
        error => {
          Util.customLog(this.allowedLog, Util.LogType.DEBUG,
            `${msg}: tap error: ${JSON.stringify(error)}`);
        }
      ),
    );
  }

  /* ============================================================================================= */
  /**
   * Public method `sendPrenotazione` used to send toward the server a http request for adding
   * a new `Prenotazione`,
   * which has been done and requested by a user logged in as `genitore`
   * @param nuovaP Prenotazione
   */
  sendPrenotazione(nuovaP: Prenotazione): Observable<any> {
    console.log('-----------------------------');

    const msg = `[PrenotazioniService] sendPrenotazione()`;
    Util.customLog(this.allowedLog, Util.LogType.DEBUG, msg, 'running');

    const endpoint = `reservations/${nuovaP.nomeLinea}/${getMillisecAtMidnight(nuovaP.data)}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();
    body.set('fermataSalita', nuovaP.fermataSalita.id);
    body.set('fermataDiscesa', nuovaP.fermataDiscesa.id);
    body.set('bambino', nuovaP.nomeBambino);
    body.set('direzione', nuovaP.direzione.toString());

    return this.http.post(url, body).pipe(
      tap(value => {
          console.log('**********************');
          Util.customLog(this.allowedLog, Util.LogType.DEBUG,
            `${msg} sendPrenotazione(), tap data: ${JSON.stringify(value)}`);
          console.log('**********************');
        },
        error => {
          Util.customLog(this.allowedLog, Util.LogType.DEBUG,
            `${msg} sendPrenotazione(), tap error: ${JSON.stringify(error)}`);
        }
      ),
    );
  }

  /* ============================================================================================= */
  /**
   * Public method `getPrenotazioniByBambino` used to obtain from server all the `Prenotazioni` about
   * a given `Bambino` providing the `Bambino name` and a `specific date`.
   * @param nomeBambino string
   * @param dateOfTheYear string
   *
   * @returns Observable<any>
   */
  getPrenotazioniByBambino(nomeBambino: string, dateOfTheYear: Date): Observable<any> {
    const msg = `[PrenotazioniService] getPrenotazioniByBambino()`;

    const endpoint = `reservations/week/${nomeBambino}/${getMillisecAtMidnight(dateOfTheYear)}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    return this.http.get(url).pipe(
      tap(
        () => { },
        error => {
          Util.customLog(this.allowedLog, Util.LogType.ERROR, msg, `tap error: ${JSON.stringify(error)}`);
        }
      ),
      switchMap((dataResponse: any) => {

        const obj = dataResponse;
        console.log('WHERE IT ALL BEGAN');
        console.log(dataResponse);

        const datePrenotazioni = Object.keys(obj.prenotazioni);
        console.log(datePrenotazioni);

        const dataInizio: Date = fromStringToDate(obj.data_inizio);
        const dataFine: Date = fromStringToDate(obj.data_fine);

        const arrayTmpA = [];
        const arrayTmpR = [];
        let cnt = 0;
        for (const dataPrenotazione of datePrenotazioni) {
          /*tmp: array contenente 2 oggetti, andata e ritorno*/
          const tmp: Array<any> = obj.prenotazioni[dataPrenotazione];
          if (tmp != null) {
            // tslint:disable-next-line:forin
            for (const pos in tmp) {
              cnt++;
              let x = null;
              /*tmp[pos]: oggetto 'andata' o oggetto 'ritorno*/
              if (tmp[pos] != null && tmp[pos] !== 'empty-prenotazione') {
                x = Prenotazione.creaPrenotazioneFrom(tmp[pos].prenotazione_dettaglio);
                x.data = fromStringToDate(dataPrenotazione);
                x.direzione = parseInt(pos, 10);
                x.nomeBambino = tmp[pos].prenotazione_dettaglio.bambino;
                x.nomeLinea = tmp[pos].nome_linea;
                x.dataPrenotazione = dataPrenotazione;
              } else {
                x = 'empty-prenotazione';
              }

              if (pos === '0') {
                arrayTmpA.push(x);
              } else {
                arrayTmpR.push(x);
              }

            }
          }
        }
        delete obj.prenotazioni;
        obj.andata = arrayTmpA;
        obj.ritorno = arrayTmpR;
        obj.dataInizio = dataInizio;
        obj.dataFine = dataFine;
        return of(obj);
      })
    );
  }

  /* ================================================================================================== */
  /**
   * Public method `deletePrenot` used to send a http request toward the server asking to delete
   * some already existing `Prenotazioni`
   * @param prenotazione :any
   */
  deletePrenotazione(prenotazione: any): Observable<any> {
    const msg = `[PrenotazioniService] deletePrenot()`;
    Util.customLog(this.allowedLog, Util.LogType.DEBUG, msg, 'running');

    const endpoint = `reservations/${prenotazione}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    return this.http.delete(url).pipe(
      tap(
        data => {
          Util.customLog(this.allowedLog, Util.LogType.DEBUG, msg, `tap data: ${JSON.stringify(data)}`);
        },
        error => {
          Util.customLog(this.allowedLog, Util.LogType.DEBUG, msg, `tap error: ${JSON.stringify(error)}`);
        }
      ),
      switchMap((dataResponse: any) => {
        return of(dataResponse);
      })
    );
  }

}
