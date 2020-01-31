import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { switchMap, catchError, tap } from 'rxjs/operators';
import { config } from '../../config/config';
import { Disponibilita } from 'src/app/domain/disponibilita-domain/disponibilita';
import {getMillisecAtMidnight} from '../../config/util';

/** ============= FUNZIONI DI INTERAZIONE COL SERVER PER LE AZIONI DELL'ACCOMPAGNATORE ============ */

@Injectable({
  providedIn: 'root'
})
export class AccompagnatoreService {

  private server: string = config.ip;
  private port: string = config.port;
  private msgLog = 'AccompagnatoreService';

  constructor(private http: HttpClient) { }

  /** =================== FUNZIONI PER LE DISPONIBILITA' =================== */

  addDisponibilita(disponibilita: Disponibilita): Observable<any> {

    const endpoint = `availability/accompagnatore/add`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();
    body.set('date', '' + getMillisecAtMidnight(disponibilita.date));
    body.set('direzione', '' + disponibilita.direzione);
    return this.http.post<Response>(url, body)
      .pipe(
        tap({
          next: (data) => { this.log(JSON.stringify(data)); },
          error: (err) => { this.log(JSON.stringify(err)); },
          complete: () => { this.log('addDisponibilita - post complete'); }
        }),
        switchMap(
          (value: any) => {
            this.log(JSON.stringify(value));
            return of({
              data: value,
              date: disponibilita.date,
              direzione: disponibilita.direzione,
              data_type: 'add',
              error: false
            });
          }
        ),
        catchError(err => {
          // console.log('catchError add');
          return of({
            date: disponibilita.date,
            direzione: disponibilita.direzione,
            http_req: 'post',
            data_type: 'add',
            error: true,
            error_text: err
          });
        })
      );
  }

  deleteDisponibilita(idDisp: string) {
    const endpoint = `availability/accompagnatore/delete/${idDisp}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;
    return this.http.delete(url).pipe(
      switchMap(
        (value: any) => {
          this.log(JSON.stringify(value));
          return of({
            data: value,
            dispID: idDisp,
            data_type: 'delete',
            error: false
          });
        }
      ),
      catchError(err => {
        return of({
          dispID: idDisp,
          http_req: 'delete',
          data_type: 'delete',
          error: true,
          error_text: err
        });
      })
    );
  }

  /** Funzione che richiede al server la lista delle corse che verranno effettuate in 7 giorni
   * lavorativi, a partire dalla data passata come parametro. Ad ogni corsa è associata anche
   * l'informazione relativa alla disponibilità (se per quella corsa e in quella direzione
   * l'utente ha dato disponibilità o no) e all'eventuale presenza di un turno
   */
  getAllCorseAndDisponibilita(date: Date) {
    const endpoint = `availability/accompagnatore/week/${getMillisecAtMidnight(date)}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;
    return this.http.get(url);
  }

  /** Manda al server l'informazione riguardo a ciò che l'accompagnatore ha deciso di fare
   * col turno (con id = idTurno) che gli è stato assegnato, cioè se l'ha confermato o rifiutato
   */
  confermaTurno(idTurno: string, conferma: boolean) {
    const endpoint = `turni/accompagnatore/confermaturno`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();
    body.set('turnoId', '' + idTurno);
    body.set('conferma', '' + conferma);
    return this.http.put<Response>(url, body)
      .pipe(
        tap({
            next: (data) => {
              this.log(JSON.stringify(data));
            },
            error: (err) => {
              this.log(JSON.stringify(err));
            },
            complete: () => {
              this.log('conferma - put complete');
            },
          }
        )
      );
  }

  log(msg: string): void {
    // console.log(`${this.msgLog}: ${msg}`);
  }
}
