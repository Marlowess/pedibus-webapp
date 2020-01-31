import { Injectable } from '@angular/core';
import { of } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { fromFetch } from 'rxjs/fetch';
import { config } from '../../config/config';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

  private server: string = config.ip;
  private port: string = config.port;

  constructor() { }

  /**
   * Il metodo 'submmitFormRegistration' viene invocato quando l'utente clicca
   * sul bottone submit presente all'interno della pagina web in cui e' possibile registrarsi.
   *
   * submmitFormRegistration ha il compito di inviare al server una richiesta http di tipo post
   * in cui viene aggiunto come parte del body l'oggetto formFilelds che contiene le credenziali
   * necessarie per verificare, validare la registrazione per il nuovo utente.
   *
   * @param formFields : any
   * @param token : string
   */
  submmitFormRegistration(formFields: any, token: string): any {
    console.log('TOKEN ' + token);

    const endPoint = 'confirm';
    const url = `http://${this.server}:${this.port}/${endPoint}/${token}`;

    const body: FormData = new FormData();
    body.set('ruolo', '1');
    body.set('nome', formFields.firstName);
    body.set('cognome', formFields.lastName);
    body.set('password', formFields.password);
    body.set('matchingPassword', formFields.repeatedPassword);
    body.set('email', formFields.email);

    return this.fromFetch(url, body);
  }

  // ================================================================================================= //

  /**
   * Il metodo 'fromFetch' permette di eseguire l'invio della richiesta http al server per
   * fare richiesta di creare un nuovo utente con i dati e le credenziali d'accesso
   * incluse nel body della richiesta.
   *
   * @param url :string
   * @param requestBody :FormData
   */
  fromFetch(url: string, requestBody: FormData): any {
    return fromFetch(url,
      { method: 'PUT', body: requestBody })
      .pipe(
        switchMap(response => {
          if (response.ok) {
            // OK return data
            return response.json();
          } else {
            // console.log('bad - status not 200 ok');
            // Server is returning a status requiring the client to try something else.
            return of({ error: true, message: `Error ${response.status}` });
          }
        }),
        catchError(err => {
          // Network or other error, handle appropriately
          return of({ error: true, message: err.message });
        })
      );
  }

}
