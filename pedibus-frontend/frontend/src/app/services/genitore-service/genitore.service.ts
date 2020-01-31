import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { retry, switchMap, catchError, map, shareReplay, tap, take } from 'rxjs/operators';
import { config } from '../../config/config';

/** ============= FUNZIONI DI INTERAZIONE COL SERVER PER LE AZIONI DEL GENITORE ============ */

@Injectable({
  providedIn: 'root'
})
export class GenitoreService {

  private server: string = config.ip;
  private port: string = config.port;
  private msgLog = 'GenitoreService';

  constructor(private http: HttpClient) { }

  /** =================== FUNZIONI PER IL PROFILO =================== */

  /**
   * Richiede al server le fermate di salita e discesa di default per le prenotazioni
   * associate ai bambini dell'utente
   */
  getSalitaDiscesaBambiniDefault(): Observable <any> {
    const endpoint = 'profile';
    const url = `http://${this.server}:${this.port}/${endpoint}`;
    return this.http.get(url);
  }

  getAllLinee(): Observable <any> {
    const endpoint = 'lines';
    const url = `http://${this.server}:${this.port}/${endpoint}`;
    return this.http.get(url);
  }

  getFermate(nomeLinea: string): Observable <any> {
    const endpoint = `lines/${nomeLinea}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;
    return this.http.get(url);
  }

  /**
   * Manda al server nuove informazioni del profilo dell'utente, cioè la lista dei bambini
   * e le fermate di salita e discesa di default
   */
  sendInfoProfilo(bambini: string[], fermataAndataID: string, // linea: string,
                  fermataRitornoID: string): Observable <any> {
    const endpoint = `profile/update`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();
    body.set('bambini', '' + bambini);
    body.set('fermata_salita_id', '' + fermataAndataID);
    body.set('fermata_discesa_id', '' + fermataRitornoID);

    return this.http.post<Response>(url, body).pipe(
      tap({
          next: (data) => { this.log(JSON.stringify(data)); },
          error: (err) => { this.log(JSON.stringify(err)); },
          complete: () => { this.log('sendInfoProfilo - post complete'); },
        }
      )
    );

  }


  /** =================== FUNZIONI PER LE MAPPE =================== */

  /** Richiede al server le informazioni delle fermate da visualizzare nelle mappe (coordinate gps) */
  getFermateByLineaForMap(linea: string): Observable<any> {
    const msg = `[PrenotazioniService] -> getFermateByLinea:`;
    const endpoint = `lines/${linea}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    return this.http.get(url).pipe(
      tap(
        data => { console.log(`${msg} getFermateByLinea(), tap data: ${JSON.stringify(data)}`); },
        error => { console.log(`${msg} getFermateByLinea(), tap error: ${JSON.stringify(error)}`); }
      )
    );
  }

  log(msg: string): void {
    console.log(`${this.msgLog}: ${msg}`);
  }
}
