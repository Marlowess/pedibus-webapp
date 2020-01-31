import { Injectable } from '@angular/core';
import {config} from '../../config/config';
import {HttpClient} from '@angular/common/http';
import {catchError, switchMap, tap} from 'rxjs/operators';
import {Turno2} from '../../domain/turno-domain/turno2';
import {of} from 'rxjs';
import {getMillisecAtMidnight} from '../../config/util';
import {AuthService} from '../auth/auth.service';

/** ============= FUNZIONI DI INTERAZIONE COL SERVER PER LE AZIONI DELL'AMMINISTRATORE ============ */

@Injectable({
  providedIn: 'root'
})
export class AmministratoreService {

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) { }

  private server: string = config.ip;
  private port: string = config.port;
  private msgLog = 'AmministratoreService';

  /**
   * Metodo per richiedere al server la lista delle linee amministrate dall'utente
   */
  getLineeAdmin() {
    const endpoint = `lines/adminlinea/summary`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;
    return this.http.get(url);
  }

  /** =================== FUNZIONI PER I TURNI =================== */

  /**
   * Metodo che richiede al server la lista delle disponibilità e dei turni degli accompagnatori
   * per la corsa di una linea effettuata in una determinata data
   */
  getTurniCorsa(linea: string, date: Date) {
    if (!this.authService.isLoggedInForUrlsWithDatepicker()) {
      return of('LOGOUT');
    }

    const endpoint = `turni/summary/${linea}/${getMillisecAtMidnight(date)}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    return this.http.get(url).pipe(
      tap({
        next: value => console.log('[Amministratore Service] getTurniCorsa(): next returned', value),
        error: err => console.log('[Amministratore Service] getTurniCorsa(): error returned', err),
        complete: () => console.log('[Amministratore Service] getTurniCorsa() completed')
      })
    );
  }

  /**
   * Metodo per l'invio di un nuovo turno
   */
  sendTurno(turno: Turno2) {
    const endpoint = `turni/new`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();

    body.set('nome_linea', '' + turno.nomeLinea);
    body.set('data', '' + getMillisecAtMidnight(turno.data));
    body.set('direzione', '' + turno.direzione);
    body.set('userId', '' + turno.userId);
    body.set('fermataPartenzaId', '' + turno.fermataPartenzaId);
    body.set('fermataArrivoId', '' + turno.fermataArrivoId);
    return this.http.post<Response>(url, body)
      .pipe(
        tap({
            next: (data) => {
              this.log(JSON.stringify(data));
            },
            error: (err) => {
              this.log(JSON.stringify(err));
            },
            complete: () => {
              this.log('sendTurno - post complete');
            },
          }
        ),
        switchMap(
          (value: any) => {
            this.log(JSON.stringify(value));
            return of({
              data: value,
              data_type: 'add',
              addedTurno: turno,
              error: false
            });
          }
        ),
        catchError(err => {
          // console.log('catchError add');
          return of({
            http_req: 'post',
            data_type: 'add',
            addedTurno: turno,
            error: true,
            error_text: err
          });
        })
      );
  }

  /**
   * Metodo per mandare al server un turno già presente ma modificato
   * (modifica delle fermate di partenza e arrivo)
   */
  modifyTurno(idTurno: string, turno: Turno2, turnoBackup: Turno2) {
    const endpoint = `turni/edit`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();
    body.set('turnoId', '' + idTurno);
    body.set('nome_linea', '' + turno.nomeLinea);
    body.set('direzione', '' + turno.direzione);
    body.set('userId', '' + turno.userId);
    body.set('fermataPartenzaId', '' + turno.fermataPartenzaId);
    body.set('fermataArrivoId', '' + turno.fermataArrivoId);
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
              this.log('sendTurno - post complete');
            },
          }
        ),
        switchMap(
          (value: any) => {
            this.log(JSON.stringify(value));
            return of({
              data: value,
              data_type: 'edit',
              editedTurno: turno,
              error: false
            });
          }
        ),
        catchError(err => {
          return of({
            http_req: 'put',
            data_type: 'edit',
            backupTurno: turnoBackup,
            error: true,
            error_text: err
          });
        })
      );
  }

  deleteTurno(idTurno: string, turno: Turno2, turnoBackup: Turno2) {
    const endpoint = `turni/delete/${idTurno}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;
    return this.http.delete(url)
      .pipe(
        switchMap(
          (value: any) => {
            this.log(JSON.stringify(value));
            return of({
              data: value,
              data_type: 'delete',
              deletedTurno: turno,
              error: false
            });
          }
        ),
        catchError(err => {
          return of({
            http_req: 'delete',
            data_type: 'delete',
            backupTurno: turnoBackup,
            error: true,
            error_text: err
          });
        })
      );
  }

  /** =================== FUNZIONI PER LA PROMOZIONE E IL DECLASSAMENTO ===================
   *                      DI ACCOMPAGNATORI E AMMINISTRATORI
   * =================== (SOLO PER AMMINISTRATORI MASTER) =================================
   */

  /**
   * Metodo per ricevere dal server la lista degli accompagnatori e degli amministratori
   * (solo gli amministratori della linea amministrata dall'utente, che è admin master)
   */
  getListePromuoviDeclassa() {
    const endpoint = `users/summary`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;
    return this.http.get(url);
  }

  /** Metodo per promuovere o declassare l'utente con id = id per la linea passata come parametro */
  promuoviDeclassa(id: string, linea: string, azione: number) {
    const endpoint = `users/${id}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();
    body.set('nomeLinea', '' + linea);
    body.set('action', '' + azione);
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
              this.log('sendTurno - post complete');
            },
          }
        ),
        switchMap(
          (value: any) => {
            this.log(JSON.stringify(value));
            return of({
              data: value,
              action: azione,
              userId: id,
              error: false
            });
          }
        ),
        catchError(err => {
          // console.log('catchError add');
          return of({
            error_text: err,
            action: azione,
            userId: id,
            error: true
          });
        })
      );
  }

  log(msg: string): void {
    // console.log(`${this.msgLog}: ${msg}`);
  }
}
