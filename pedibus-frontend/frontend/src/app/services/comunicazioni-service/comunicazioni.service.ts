/* ============================================================================================= */
/*                                       ANGULAR IMPORTS                                         */
/* ============================================================================================= */
import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, switchMap, tap} from 'rxjs/operators';
// - Services:
import {AuthService} from '../auth/auth.service';
// - Domain:
import {Messaggio} from '../../domain/messaggio';
// Utils:
import {config} from '../../config/config';
import {Util} from '../../config/util';
/* ============================================================================================= */
/*                                       OUR PROJETC IMPORTS                                     */
/* ============================================================================================= */
// import messaggi from '../../domain/messaggi';

/* ============================================================================================= */
@Injectable({
  providedIn: 'root'
})
export class ComunicazioniService {

  // Here, service's attributes for doing http requests.
  private ip = config.ip;
  private port = config.port;

  // Here, service's attributes for doing log.
  private allowed = true;
  // private typeLog = 'debug';

  // Here, service's attributes for retrieving data, used earlier for dummy tests.
  // public messaggi: Messaggio[] = [];

  /* ============================================================================================= */
  constructor(
    private autService: AuthService,
    private http: HttpClient) {
    const msg = `[ComunicazioniService] constructor()`;
    Util.customLog(this.allowed, Util.LogType.DEBUG, `${msg}: running!`);
  }

  /* ============================================================================================= */
  /** Riceve dal server tutti i messaggi non ancora visualizzati e non eliminatidall'utente */
  getMessaggi(): Observable<any> {
    const msg = `[ComunicazioniService] getMessaggi()`;
    Util.customLog(this.allowed, Util.LogType.DEBUG, `${msg}: running!`);

    const url = `http://${this.ip}:${this.port}/notifications/getall`;
    return this.http.get(url).pipe(
      tap(
        () => {
          // Util.customLog(this.allowed, Util.LogType.DEBUG, `${msg}: tap data:\n`, JSON.stringify(data));
        },
        (error: any) => {

          Util.customLog(this.allowed, Util.LogType.DEBUG, `${msg}: tap error:\n`, error);
        }
      ),
      switchMap(
        (data: any) => {
          const listMessagi: Array<Messaggio> = new Array<Messaggio>();
          Util.customLog(this.allowed, Util.LogType.DEBUG, `Type of data: ${typeof (data)}`);

          try {
            // let rawData = JSON.parse(data);
            const rawData = data;
            // console.log(rawData);
            Util.customLog(this.allowed, Util.LogType.DEBUG, `Type of data: ${typeof (rawData)}`);

            rawData.forEach(element => {
              // let rawElement = JSON.parse(element);
              // console.log(rawData);
              listMessagi.push(new Messaggio(element));
            });
          } catch (error) {
            Util.customLog(this.allowed, Util.LogType.ERROR, `Error: exception raised!\n${error}`);
            return of(null);
          }
          return of(listMessagi);
        }
      )
    );
  }

  /** Chiede al server di eliminare (quindi da non visualizzare più) una specifica comunicazione */
  public deleteComunicazione(messaggio: Messaggio) {
    const msg = `[ComunicazioniService] deleteAllComunicazione()`;
    // console.debug(msg);

    const url = `http://${this.ip}:${this.port}/notifications/cancellacomunicazione`;

    const comunicazioneId: string = messaggio.id;

    const body: FormData = new FormData();

    body.set('comunicazioneId', comunicazioneId);

    return this.http.put(url, body).pipe(
      tap({
          next: () => { },
          error: (err) => { console.log(JSON.stringify(err)); },
          complete: () => { console.log('deleteComunicazione - put complete'); },
        }
      ),
      switchMap(
        () => {
          return of({
            deletedM: messaggio,
            error: false
          });
        }
      ),
      catchError(err => {
        return of({
          deletedM: messaggio,
          error: true,
          error_text: err
        });
      })
    );
  }

  /** Chiede al server di settare come eliminate (quindi da non visualizzare più, sul server rimangono)
   * tutte le comunicazioni
   */
  public deleteAllComunicazioni(): Observable<any> {
    const msg = `[ComunicazioniService] deleteAllComunicazioni()`;
    // console.debug(msg);

    const url = `http://${this.ip}:${this.port}/notifications/cancellatutte`;

    return this.http.put(url, null).pipe(
      tap(
        (data: any) => {
          // console.debug(this.allowed, Util.LogType.DEBUG, `${msg}: tap data:\n`, JSON.stringify(data));
        },
        (error: any) => {
          // console.error(this.allowed, Util.LogType.DEBUG, `${msg}: tap error:\n`, error);
        }
      ),
      switchMap((data) => {
        return of(data);
      })
    );
  }

  /** Chiede al server di settare tutte le comunicazioni come lette (ogni volta che accedo al component
   * 'Comunicazioni')
   */
  public setAllComunicazioniAsRead(): Observable<any> {

    // const msg = `[ComunicazioniService] setAllComunicazioniAsRead()`;
    // console.debug(msg);

    const url = `http://${this.ip}:${this.port}/notifications/segnalette`;

    return this.http.put(url, null).pipe(
      tap(
        (data: any) => {
          // window.alert(JSON.stringify(data));
          // console.debug(this.allowed, Util.LogType.DEBUG, `${msg}: tap data:\n`, JSON.stringify(data));
        },
        (error: any) => {
          // console.error(this.allowed, Util.LogType.DEBUG, `${msg}: tap error:\n`, error);
        }
      ),
      switchMap((data) => {
        return of(data);
      })
    );
  }
}
