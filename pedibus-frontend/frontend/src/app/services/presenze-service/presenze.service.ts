/* =========================================================================================== */
/*                      File: `presenze.service.ts` - class implementation                   */
/* =========================================================================================== */

/* =========================================================================================== */
/*                                   ANGULAR IMPORTS                                           */
/* =========================================================================================== */
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { switchMap, catchError, map, tap } from 'rxjs/operators';
// import { RequestOptions, Headers } from '@angular/http';

/* =========================================================================================== */
/*                                       OUR IMPORTS                                           */
/* =========================================================================================== */
// Confign and Utils:
import { config } from '../../config/config';
import { getMillisecAtMidnight } from '../../config/util';

// Services:
import { AuthService } from '../auth/auth.service';

// Domain objects:
import { BambinoNonPrenotatoPresenze } from '../../domain/presenze-domain/bambino-non-prenotato-presenze';
import { BambinoPresenze } from '../../domain/presenze-domain/bambino-presenze';

import { CorsaBuilder } from '../../domain/presenze-domain/corsa-builder';

import { CorsaPresenze } from '../../domain/presenze-domain/corsa';
import { Fermata } from '../../domain/presenze-domain/fermata';


const enum DIRECTION {
  FORWARD = 0,
  BACKWARD = 1,
}

/* =========================================================================================== */
@Injectable({
  providedIn: 'root'
})
export class PresenzeService {

  // Service's Private attributes:
  private server: string = config.ip;
  private port: string = config.port;
  private msgLog = 'PresenzeService';

  public corsa: any;

  public direzione: string;
  public fermataSalitaID: string;

  public prenotazioneID: string;
  public fermataDiscesaID: string;

  public bambino: any;


  // public bambinoNonPrenotato: Observable<any>;
  // public getLineeObservable: Observable<any>;

  /* =========================================================================================== */
  constructor(
    private authSerivce: AuthService,
    private http: HttpClient,
  ) { }

  /* =========================================================================================== */
  /**
   * Il metodo `getLines` del servizio attendance.service ha come obbiettivo quello di recuperare la lista
   * dei nomi delle linee che occorre ritornare all'interfaccia utente rappresentata dalla pagine web in cui
   * l'accompagnatore puo' visionare le corse a cui e' interessato.
   *
   * Il metodo richiede il token memorizzato localmente, se il token di cui e' in possesso non e' piu'
   * valido allora il metodo reindirizza l'utente verso la pagina di login.
   *
   * @returns Observable<Array<string>>: either null if an error arose and is caught by the catch clausole of try..catch statement or
   * a proper initiated and filled object returned as wrapped within an Observable.
   */
  getLines(): Observable<Array<string>> {
    const msg = `[AttendanceService] getLines()`;
    console.debug(msg + ': is running!');

    const endpoint = 'lines';
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    return this.http.get(url)
      .pipe(
        tap( // Log the result or error
          (data) => console.debug(url, data),
          (error) => console.error(url, error)
        ),
        switchMap((respose: any) => {
          // window.alert(JSON.stringify(respose));
          try {
            let linesNameList = new Array<string>();
            respose.forEach((element: any) => {
              // window.alert(element);
              linesNameList.push(element);
            });
            return of(linesNameList)
          } catch (err) {
            return of(null);
          }
        }),
        catchError(this.handleError),
      );
  }

  /* =========================================================================================== */
  /** Aggiorna lo stato di un bambino prenotato, da non presente a presente
   *
   * @param lineName string
   * @param date Date
   * @param salitaDiscesa boolean, indica la direzione: true = salita/andata; false = discesa/ritorno
   * @param state boolean, indica se il bambino è presente (true) o no (false)
   * @param prenotazioneId string
   * @param nomeBambino string
   */
  updateState(lineName: string, date: Date, salitaDiscesa: boolean, state: boolean,
              prenotazioneId: string, nomeBambino: string): Observable<boolean> {

    const dateMillisec = getMillisecAtMidnight(date);

    const endpoint = `reservations/presenze/${lineName}/${dateMillisec}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();

    body.set('bambino', nomeBambino);
    body.set('salitaDiscesa', salitaDiscesa ? '0' : '1'); // 1: salita, 0: discesa // intero
    body.set('azione', state ? '1' : '0'); // 1: presente, 0: non presente // booleano
    body.set('prenotazioneId', prenotazioneId);

    return this.http.post<Response>(url, body)
      .pipe( // retry(3),
        tap( // Log the result or error
          (data) => console.log('No Error Update Blue User:', url, data),
          (error) => console.log('Error Update Blue User:', url, error)
        ),
        map(
          data => true
        ),
        catchError(this.handleError),
      );
  }

  /* =========================================================================================== */
  /*                   Managing request of a Corsa in a given `date` for a `given line`          */
  /* =========================================================================================== */

  /**
   * Private instance's method `buildCorsaWithDirection` used to build array of objects `Fermate` providing
   * as input information list of raw dictionary with details about a fermata, the object `CorsaPresenze` to be
   * updated with the final built array, and the direction to which the `Fermate` belong.
   * @param corsaRaw any
   * @param corsa CorsaPresenze
   * @param direction DIRECTION
   * @throws dict: either after attempting to instantiate a new `Fermata` instance or a new `BambinoPresenze` instance.
   */
  private buildCorsaWithDirection(corsaRaw: any, corsa: CorsaPresenze, direction: DIRECTION) {

    try {
      // Fill corsa instance of type `CorsaPresenze` with a set of instances of type `Fermata`.
      // tslint:disable-next-line:forin
      for (const keyFermata in corsaRaw) {

        const fermataRaw = corsaRaw[keyFermata];
        console.debug('New fermata raw to be processed: ' + JSON.stringify(fermataRaw));

        const fermata = new Fermata(
          fermataRaw.fermataID,
          fermataRaw.orario,

          fermataRaw.indirizzo,
          fermataRaw.descrizione,
          fermataRaw.inTurno
        );

        // Fill `fermata.salita` array.
        // tslint:disable-next-line:forin
        for (const keyBambino in fermataRaw.salita) {
          const bambinoRaw = fermataRaw.salita[keyBambino];
          console.debug('Fill `fermata.salita` array: ' + JSON.stringify(bambinoRaw));

          const bambino = new BambinoPresenze(
            bambinoRaw.prenotazioneID,
            bambinoRaw.bambino,
            bambinoRaw.presente,
            bambinoRaw.prenotatoDaGenitore
          );

          fermata.salita.push(bambino);
        }

        // Fill `fermata.discesa` array.
        // tslint:disable-next-line:forin
        for (const keyBambino in fermataRaw.discesa) {
          const bambinoRaw = fermataRaw.discesa[keyBambino];
          console.debug('Fill `fermata.discesa` array: ' + JSON.stringify(bambinoRaw));

          const bambino = new BambinoPresenze(
            bambinoRaw.prenotazioneID,
            bambinoRaw.bambino,
            bambinoRaw.presente,
            bambinoRaw.prenotatoDaGenitore
          );
          fermata.discesa.push(bambino);
        }

        // Add new Fermata properly initiated and filled
        // either to the Forward direction or Backward one.
        if (direction === DIRECTION.FORWARD) {
          corsa.fermateAndata.push(fermata);
        } else {
          corsa.fermateRitorno.push(fermata);
        }
      }

    } catch (err) {
      console.error(JSON.stringify(err));
      throw err;
    }
  }

  /**
   * Public instance's method `getCorsaByLineNameAndDate` used to get from server a response when
   * sending a `GET`-like request.
   * @param lineName string
   * @param date Date
   * @return Observable<CorsaPresenze>: either `null` or properly initialized object.
   */
  public getCorsaByLineNameAndDate(lineName: string, date: Date): Observable<CorsaPresenze> {

    const msg = `[AttendanceService] getCorsaByLineNameAndDate`;
    console.debug(`${msg}: is running!`);

    // dateMillisec: Conver `date` into milliseconds representation, in order to add this piece of information
    //               when building the entire url, used to communicate with the remote server.
    const dateMillisec = getMillisecAtMidnight(date);

    const endpoint = `reservations/presenze/${lineName}/${dateMillisec}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const msgHttpGet = `${msg}: get`;
    return this.http
      .get<Response>(url)
      .pipe(
        tap( /* Logging reasons */
          (data) => console.debug(`${msgHttpGet}: tap, data: `, url, data),
          (error) => console.error(`${msgHttpGet}: tap, error: `, url, error)
        ),
        switchMap((response: any) => {
          /* Transform raw data coming and provided by server into more suitable and manageable data object */
          // window.alert(JSON.stringify(response));
          let corsa: CorsaPresenze = null;
          // const corsaBuilder: CorsaBuilder = CorsaBuilder.getBuilder();
          try {
            const flagCompletataAndata: boolean = response['corsa-completata-andata'] === undefined
              ? false : response['corsa-completata-andata'];
            console.debug('flagCompletataAndata: ' + flagCompletataAndata);

            const flagCompletataRitorno = false;
            console.debug('flagCompletataRitorno: ' + flagCompletataRitorno);

            const flagPartitiRitorno: boolean = response['corsa-partita-ritorno'] === undefined
              ? false : response['corsa-partita-ritorno'];
            console.debug('flagPartitiRitorno: ' + flagPartitiRitorno);

            if (response.linea === undefined || response.linea == null) {
              throw `Error: Response miss linea name!`;
            }
            const nomeLinea: string = response.linea;
            console.debug(nomeLinea);

            console.debug('Attempting init CorsaPresenze()');
            corsa = new CorsaPresenze(date,
              nomeLinea,
              flagCompletataAndata,
              flagCompletataRitorno,
              flagPartitiRitorno,
              new Array<Fermata>(),
              new Array<Fermata>(),
              new Array<BambinoNonPrenotatoPresenze>(),
              new Array<BambinoNonPrenotatoPresenze>()
            );
            console.debug('new CorsaPresenze(): ok!');

            console.debug('Attempting init buildCorsaWithDirection: andata');
            this.buildCorsaWithDirection(response.andata, corsa, DIRECTION.FORWARD);
            console.debug('buildCorsaWithDirection: andata ok!');

            console.debug('Attempting init buildCorsaWithDirection: ritorno');
            this.buildCorsaWithDirection(response.ritorno, corsa, DIRECTION.BACKWARD);
            console.debug('buildCorsaWithDirection: ritorno ok!');


            if (response['non-prenotati-andata'] !== undefined && response['non-prenotati-andata'] != null) {
              console.debug('Attempting init non-prenotati-andata');
              response['non-prenotati-andata'].forEach((bambinoNonPrenotato: any) => {
                corsa.bambiniNonPrenotatiAndata.push(new BambinoNonPrenotatoPresenze(
                  bambinoNonPrenotato.bambino, bambinoNonPrenotato.userID
                ));
              });
              console.debug('non-prenotati-andata: ok!');
            }

            if (response['non-prenotati-ritorno'] !== undefined && response['non-prenotati-ritorno'] != null) {
              console.debug('Attempting init non-prenotati-ritorno');
              response['non-prenotati-ritorno'].forEach((bambinoNonPrenotato: any) => {
                corsa.bambiniNonPrenotatiRitorno.push(new BambinoNonPrenotatoPresenze(
                  bambinoNonPrenotato.bambino, bambinoNonPrenotato.userID
                ));
              });
              console.debug('non-prenotati-ritorno: ok!');
            }

          } catch (err) {
            console.log(`Caught Error: ${JSON.stringify(err)}`);
            corsa = null;
          }

          console.log(JSON.stringify(corsa));
          return of(corsa);
        })
      )
      ;
  }

  /* =========================================================================================== */
  /** Aggiorna lo stato di un bambino non prenotato quando è l'accompagnatore a creare una prenotazione
   * per lui e segnandolo come presente alla corsa
   *
   * @param lineName
   * @param date
   * @param nomeBambino
   * @param userID
   * @param fermataSalitaDiscesaID
   * @param direzione
   */
  public updateStateNonPrenotato(lineName: string, date: Date, nomeBambino: string, userID: string,
                                 fermataSalitaDiscesaID: string, direzione: string): Observable<Response> {

    const dateMillisec = getMillisecAtMidnight(date);
    const endpoint = `reservations/accompagnatore/${lineName}/${dateMillisec}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    let salita = '';
    let discesa = '';
    if (direzione === '0') {
      salita = fermataSalitaDiscesaID;
    } else {
      discesa = fermataSalitaDiscesaID;
    }

    const body: FormData = new FormData();
    body.set('direzione', direzione);
    body.set('bambino', nomeBambino);
    body.set('userId', userID);
    body.set('fermataSalita', salita);
    body.set('fermataDiscesa', discesa); // fermataDiscesaID console.log(JSON.stringify(body));

    return this.http.post<Response>(url, body)
      .pipe( // retry(3),
        tap( // Log the result or error
          (data) => console.debug('no error:', url, data),
          (error) => console.error('error:', url, error)
        ), // take(1),
        catchError(this.handleError),
      );
  }

  /* =========================================================================================== */
  /**
   * Public instance's method `setArrivatiOrPartiti` allows to communicate to the remote server,
   * by means of `PUT`-like `Http-Request` that a user of type `Accopagnatore` has reached the
   * final destinazion either at the `Andata` or `Ritorno`.
   * @param lineName string
   * @param date Date
   * @param direzione string
   */
  public setArrivatiOrPartiti(lineName: string, date: Date, direzione: string) { // date: string
    const endpoint = `reservations/presenze/consolidacorsa`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();
    body.set('nome_linea', lineName);
    body.set('date', getMillisecAtMidnight(date));
    body.set('direzione', direzione);

    return this.http.put<Response>(url, body).pipe(
      tap( // Log the result or error
        (data) => console.debug('no error:', url, data),
        (error) => console.error('error:', url, error)
      ),
      catchError(this.handleError),
    );
  }

  /* =========================================================================================== */
  /*                      Service's Utility functions                                            */
  /* =========================================================================================== */

  /**
   * Private instance's method `handleError` for service `PresenzeService`
   * used to handling errors that arose when attemping to send a new `Http`-like request.
   * @param error HttpErrorResponse
   */
  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error.errore}`);
    }
    // return an observable with a user-facing error message
    return throwError('Something bad happened; please try again later.');
  }

  /* =========================================================================================== */

  /**
   * Il metodo `setInfoDialog` del servizio attendance.service permette di valorizzare correttamente le variabili che serviranno
   * poi a comporre la dialog in modo tale che sia utilizzabile per selezionare tra le fermate disponibili quella a cui scendera'
   *
   * il passeggero-bambino che non e' stato prenotato dai genitori.
   * @param direzione
   * @param fermataSalitaID
   * @param prenotazioneID
   * @param bambino
   */
  setInfoDialog(direzione, fermataSalitaID, prenotazioneID, bambino) {
    this.direzione = direzione;
    this.fermataSalitaID = fermataSalitaID;
    this.prenotazioneID = prenotazioneID;
    this.bambino = bambino;
  }

  /* =========================================================================================== */
  /*                 Here ends `presenze.service.ts` class implementation                      */
  /* =========================================================================================== */

}
