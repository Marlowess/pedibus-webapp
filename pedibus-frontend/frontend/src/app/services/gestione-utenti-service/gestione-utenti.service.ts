import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { config } from '../../config/config';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class GestioneUtentiService {

  private server: string = config.ip;
  private port: string = config.port;
  // private msgLog = 'GestioneUtentiService';

  constructor(private http: HttpClient) { }

  /** Richiede al server il ruolo di un utente, data l'email, per sapere se è già registrato */
  getUtente(indirizzoEmail: string) {
    const endpoint = `user/${indirizzoEmail}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;
    return this.http.get(url);
  }

  /** Registra un nuovo utente nel sistema (solo il ruolo, password e nome vengono registrati
   * dopo dall'utente stesso)
   */
  addUtente(email: string, ruolo: number): Observable<any> {
    const endpoint = `register`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();
    body.set('email', '' + email);
    body.set('ruolo', '' + ruolo);
    return this.http.post<Response>(url, body)
      .pipe(
        tap({
          next: (data) => { this.log(JSON.stringify(data)); },
          error: (err) => { this.log(JSON.stringify(err)); },
          complete: () => { this.log('addUtente - post complete'); },
        })
      );
  }

  log(msg: string): void {
    // console.log(`${this.msgLog}: ${msg}`);
  }
}
