/* ============================================================================================= */
/*                                       ANGULAR IMPORTS                                         */
/* ============================================================================================= */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';

import { Observable, of, throwError } from 'rxjs';
import { Router } from '@angular/router';

import { switchMap, catchError, map, shareReplay, tap } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

/* ============================================================================================= */
/*                                       THIRD-PARTY IMPORTS                                     */
/* ============================================================================================= */
import { Buffer } from 'buffer';

/* ============================================================================================= */
/*                                       OUR PROJETC IMPORTS                                     */
/* ============================================================================================= */
import { config } from '../../config/config';
import {Util} from '../../config/util';

// Service classes:
import { NotificationService } from '../notification-service/notification.service';


/* ============================================================================================= */
@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private server: string = config.ip;
  private port: string = config.port;
  private allowedLog = true;

  public flagLogged = new Subject<boolean>(); // Boolean


  /* ============================================================================================= */
  /**
   * Classe `AuthService` che implementa il comportamento di un servizio angluar, offrendo ai componenti
   * che lo accettano come parametro privato ignettato al loro interno per la regolazione e la gestione di 
   * operazioni relative allo stato di autenticazione di un utente.
   * 
   * @param http HttpClient
   * @param notificationService NotificationService
   * @param router Router
   */
  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private router: Router) {
    const msg = `[AuthService] constructor()`;
    Util.customLog(this.allowedLog, Util.LogType.INFO, msg, 'running!');
  }

  /* ============================================================================================= */
  /**
   * Il metodo 'login' e' quel metodo del servizio 'auth.service.ts' che viene
   * eseguito quando l'utente dalla pagina di login effettua l'operazione di login,
   * ossia, compila il form per il login e preme il bottone per il submit della richiesta.
   *
   * Il metodo riceve come parametri l'email e la password che l'utente ha fornito, agendo sul form.
   * A questo punto, il metodo login si adopera per inoltrare la richiesta http di tipo post includendo
   * nel body della richiesta le informazioni di email e password che l'utente ha fornito compilando il
   * form di cui sopra.
   *
   * Se il server verificando la corrispondenza fra email e password fornite si accorge che non esiste
   * tale corrispondenza, il client si preoccupa di comunicare all'utente che l'operazione di login e' fallita,
   * altrimenti l'operazione di login avendo successo ottiene il token jwt che verra' memorizzato localmente
   * e impiegato per quelle operazioni che richiedono l'invio di un token jwt prima di poter essere
   * effettivamente compiute.
   *
   * @param email string
   * @param password string
   */
  login(email: string, password: string): Observable<any> {
    const msg = `[AuthService] login()`;
    Util.customLog(this.allowedLog, Util.LogType.INFO, msg, 'running!');

    const endpoint = 'login';
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();
    body.set('email', email);
    body.set('password', password);

    return this.http.post(url, body).pipe(
      tap(
        () => { /*console.log('tap data:', data);*/ },
        () => { /*console.error('tap error:', error);*/ }),
      );
  }

  /* ============================================================================================= */
  /**
   * Il metodo 'setSession' viene invocato (in auth-interceptor.service.ts)
   * quando l'operazione di login termina con successo, quindi quando
   * il client ottiene una risposta positiva che include il token jwt da memorizzare localmente e impiegare
   * per ogni successiva operazione che lato client l'utente richiede di eseguire al server, ma per le quali
   * e' indispensabile fornire anche tra le headers http quella relativa all'autorizzazione tramite token jwt,
   * ovvero Authorization: Bearer token-jwt-ottenuto.
   *
   * Questo metodo oltre a memorizzare il token, si occupa di memorizzare ulteriori informazioni che provengono
   * dal token medesimo che verranno impiegate per le varie verifiche attuate durante successive richieste
   * per quei servizi che richiedono token jwt validi e non scaduti.
   *
   * Tra le informazioni che memoriziamo, troviamo la data in cui il token jwt sara' considerato non piu' valido,
   * di conseguenza non utilizzabile.
   *
   * @param token string
   */
  public setSession(token: string) {
    const msg = 'AuthService: setSession()';
    Util.customLog(this.allowedLog, Util.LogType.INFO, msg, 'running!');

    // - Decode JWT in order to access its fields that we want to save.
    const body = token.split('.')[1];
    const bodyBuff = new Buffer(body, 'base64');
    const jwtBody = JSON.parse(bodyBuff.toString('ascii'));

    // - Set within `data-structure named localStorage`  most useful information extracted from provided JWT.
    localStorage.setItem('token', token);
    localStorage.setItem('email', jwtBody.sub);
    localStorage.setItem('ruolo', jwtBody.roles[0]);
    // localStorage.setItem('expires_at', JSON.stringify(jwtBody.exp * 1000));
    localStorage.setItem('expires_at', `${(jwtBody.exp * 1000)}`);
  }

  /* ============================================================================================= */
  /**
   * Il metodo 'logout' viene impiegato per eseguire l'operazione che consente
   * all'utente di uscire dall'applicazione invalidando il token fino ad ora utilizzato,
   * e cancellandolo localmente.
   * Al termine delle operazioni di login l'utente verrà re-indirizzato verso la pagina web
   * puntata dalla url che che corrisponde all'home-page del sito.
   * @params urlDestinatio: string, default 'home-page'
   */
  logout(urlDestinatio: string = 'home-page') {
    const msg = 'AuthService: logout()';
    Util.customLog(this.allowedLog, Util.LogType.INFO, msg, 'running!');

    let flagError = false;

    try {
      // - Remove explicitly initially set key-value pairs.
      localStorage.removeItem('token');
      localStorage.removeItem('expires_at');
      localStorage.removeItem('ruolo');

      // this.notificationService.signalNotificationLogin(false);
      // this.flagLogged.next(false);

      // - Turns back to home page.
      const homePageUser = urlDestinatio;
      this.router.navigateByUrl(`${homePageUser}`);
      /*this.router.navigateByUrl(`/`, {skipLocationChange: true}).then(() =>
      this.router.navigate([homePageUser]));*/
    } catch (error) {
      // - If any error arose then set `flagError` variable to true, for managing the new exception.
      flagError = true;
      Util.customLog(this.allowedLog, Util.LogType.ERROR, msg, error.toString());
    } finally {
      if (flagError) {
        // - If any error arose then force data-structure localStorage to be cleaned.
        localStorage.clear();
        // - Finally, turns back to home page.
        const homePageUser = 'home-page';
        this.router.navigateByUrl(`${homePageUser}`);
      }
    }
  }

  /* ============================================================================================= */
  /**
   * Il metodo `isLoggedIn` permette di verificare se l'utente e' ancora loggato all'interno dell'applicazione.
   *
   * Per ottenere questa verifica il metodo in questione si serve di un altro metodo dello stesso servizio
   * che viene identificato nel metodo 'getExpiration' con il compito invece di comunicare se il token jwt
   * in possesso dell'utente sia valido e, a seconda del risultato ottenuto dalla verifica del token,
   * il metodo isLoggedIn comunichera' se l'utente e' ancora loggato oppure, non essendo piu' loggato,
   * non potra' usufruire di tutti quei servizi che richiedono uno stato dell'utente pari a loggato.
   *
   * @returns boolean:
   * Restituisce un tipo di dato boolean che ammette come possibili valori solamente true, false:
   *  - `true`: l'utente e' ancora loggato, quindi il token e' considerato valido;
   *  - `false`: l'utente non e' piu' loggato, quindi il token e' considerato valido.
   */
  public isLoggedIn(): boolean {
    const msg = 'AuthService: isLoggedIn():';
    Util.customLog(this.allowedLog, Util.LogType.INFO, msg, 'running!');

    // - We check if there is any `token` aviable from `local-storage`.
    if (this.getExpiration() === null) {
      if (this.router.url !== 'login-form' &&
         !this.router.url.startsWith('registration-form') &&
         !this.router.url.startsWith('sostituzione-password')) {
        this.router.navigateByUrl('home-page');
      }
      console.log('token non presente');
      this.flagLogged.next(false);
      return false;
    }

    // - We check if there the `token` is still valid.
    const nowDate: number = new Date().getTime();
    const res =  nowDate < this.getExpiration();
    console.log(Date.now(), this.getExpiration());
    if (res === false) {
      // window.alert(`Token scaduto: goto login-form | ${Date.now()}, ${this.getExpiration()}`);
      // this.router.navigateByUrl('login-form'); console.log('token scaduto');
      this.notificationService.signalNotificationLogin(false);
      this.logout('/login-form');
      // this.flagLogged.next(false);
      return false;
    }
    // - If the token is valid signal it as valid!
    // this.flagLogged.next(true);
    // window.alert(`Token Non scaduto: continua con le operazioni | ${Date.now()}, ${this.getExpiration()}`);
    return true;
  }

  /* ============================================================================================= */

  /**
   * Il metodo di classe `isLoggedInForLogin` viene impiegato tutte quelle volte in cui l'utente
   * punta con la barra degli indirizzi del browser verso una pagin web del sito a cui non può più accedere se
   * già autenticatosi e in possesso di un token jwt valido.
   *
   * @param url string url verso cui farsi re-indirizzare se un utente già loggato e in possesso di un token jwt valido
   * finisce in una pagina in cui non può accedere se effettivamente già autenticato.
   */
  public isLoggedInForLogin(url: string): boolean {

    // - We check if there is any `token` aviable from `local-storage`.
    if (this.getExpiration() === null) {
      if (url !== '/login-form' &&
        !url.startsWith('/registration-form') &&
        !url.startsWith('/sostituzione-password')) {
        this.router.navigateByUrl('home-page');
      }
      console.log('token non presente');
      // this.flagLogged.next(false);
      return false;
    }

    // - We check if there the `token` is still valid.
    const nowDate: number = new Date().getTime();
    const res =  nowDate < this.getExpiration();
    console.log(Date.now(), this.getExpiration());
    if (res === false) {
      // window.alert(`Token scaduto: goto login-form | ${Date.now()}, ${this.getExpiration()}`);
      // this.router.navigateByUrl('login-form'); console.log('token scaduto');
      this.notificationService.signalNotificationLogin(false);
      // this.logout('/login-form');
      // this.flagLogged.next(false);
      return false;
    }
    // - If the token is valid signal it as valid!
    // his.flagLogged.next(true);
    // window.alert(`Token Non scaduto: continua con le operazioni | ${Date.now()}, ${this.getExpiration()}`);
    return true;
  }


  /* ============================================================================================= */
  /**
   * Il metodo 'isLoggedOut' permette di verificare se l'utente non e' piu' loggato all'interno dell'applicazione.
   * @returns boolean:
   * Restituisce un tipo di dato boolean che ammette come possibili valori solamente true, false:
   *  - `true`: l'utente non e' piu' loggato, quindi il token e' considerato valido;
   *  - `false`: l'utente e' ancora loggato, quindi il token e' considerato valido.
   */
  isLoggedOut(): boolean{
    return !this.isLoggedIn();
  }

  /* ============================================================================================= */
  /**
   * Il metodo 'getExpiration' permette di verificare se l'utente che vuole accedere ad un certo
   * servizio dell'applicazione web e' in possesso di un token jwt valido e non ancora
   * scaduto, quindi effettivamente utilizzabile.
   * 
   * @returns
   * - number: il valore numerico della data in cui il token jwt diventerà non più valido da
   * quel momento in avanti.
   */
  getExpiration(): number {
    const token = localStorage.getItem('token');
    const expiration = localStorage.getItem('expires_at');
    if (token !== null && expiration != null) {
      const expiresAt = parseInt(expiration, 10);
      return expiresAt;
    }
    return null;
  }

  /* ============================================================================================= */
  /**
   * Il metodo 'getToken' viene invocato da tutti quei servizi che hanno bisogno di recuperare una
   * copia memorizzata in locale del token jwt per l'utente richiedente un dato servizio,
   * e poterla utilizzare per formulare una nuova richiesta http, includendo
   * fra gli headers http anche quello Authorization, che verra' valorizzato con il token appena
   * ottenuto.
   *
   * Se l'utente non presenta token memorizzati localmente, oppure quelli in suo possesso
   * sono tutti scaduti, allora esso verra' reindirizzaro alla pagina di login.
   * 
   * @returns
   * - string: il token jwt
   */
  getToken(): string {
    const msg = 'AuthService: getToken():';
    if (this.isLoggedIn()) {
      const token = localStorage.getItem('token');
      console.log(`${msg} token: ${token}`);
      return token;
    } else {
      const homePageUser = 'login-form';
      // this.router.navigateByUrl(`${homePageUser}`);
      return null;
    }
  }

  /* ============================================================================================= */
  private handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.error(
        `Backend returned code ${error.status}, ` +
        `body was: ${error.error}`);
    }
    // return an observable with a user-facing error message
    return throwError(
      'Something bad happened; please try again later.');
  }

  /* ============================================================================================= */
  /**
   * Il metodo di classe `getRuolo` permette di recuperare il ruolo dell'utente che verrà utilizzato
   * come valore nella decisione di quali pulsanti o elementi della grafica mostrare sulla UI sulla base
   * del tipo di utente che si è loggato tramite emal e password.
   * @returns
   * - `string`: ruolo del'utente loggato e in possesso di un jwt token valido
   */
  getRuolo(): string {
    const msg = 'AuthService: getRuolo():';
    return localStorage.getItem('ruolo');
  }

  /* ============================================================================================= */
    /**
   * Il metodo di classe `getEmail` permette di recuperare l'email dell'utente che verrà utilizzata come informazione
   * per consentire ad un utente che interagisce con l'UI di sapere di quale utente registrato è l'account, dato
   * che viene esposta all'interno di ongi pagina del sito interagendo con l'avatar dell'utente.
   * @returns
   * - `string`: email del'utente loggato e in possesso di un jwt token valido
   */
  getEmail(): string {
    const msg = 'AuthService: getEmail():';
    console.log(msg + localStorage.getItem('email'));
    return localStorage.getItem('email');
  }

  /* ============================================================================================= */
  /**
   * Metodo di classe `setNomeCognome` che viene usata per la memorizzazione locale del nome e cognome dell'utente
   * che viene usato per riempire i campi dell'informazione sull'utente destinate alla descrizione dell'avatar dell'utente.
   * @param nomeCognome string
   */
  setNomeCognome(nomeCognome: string): void {
    localStorage.setItem('nomeCognome', nomeCognome);
  }

  /**
   * Metodo di classe `requestCambioPassword` che permette di effettuare una nuova richiesta al server
   * per il cambio password.
   * @param email string
   */
  requestCambioPassword(email: string) {
    const endpoint = `recover`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();
    body.set('email', '' + email);

    return this.http.post<Response>(url, body)
      .pipe(
        tap({
            next: () => { },
            error: (err) => { console.log(err); },
            complete: () => { console.log('requestCambiaPassword - post complete'); },
          }
        )
      );
  }

  /**
   * Metodo di classe `cambioPassword` usato per inviare la nuova password digitata dall'utente per completare il processo
   * di cambio password inizialmente incominciato dall'utente stesso.
   * 
   * @param tokenUUID string: token generato dal server, iviato per mail dal server all'utente che chiede il cambio password, e dovrà
   * essere icluso nella risposta del client destinata al server contente la nuova password aggiornata.
   * @param pw string: nuova password
   * @param confermaPw string password confermata password
   */
  cambioPassword(tokenUUID: string, pw: string, confermaPw: string) {
    const endpoint = `recover/${tokenUUID}`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    const body: FormData = new FormData();
    body.set('password', '' + pw);
    body.set('verificaPassword', '' + confermaPw);

    return this.http.post<Response>(url, body)
      .pipe(
        tap({
            next: (data) => { console.log(data); },
            error: (err) => { console.log(err); },
            complete: () => { console.log('cambiaPassword - post complete'); },
          }
        )
      );
  }

  /**
   * Il metodo di classe  `isLoggedInForUrlsWithDatepicker` permette di eseguire il logout da una pagina
   * in cui è richiesta la condizione e lo stato di utente loggato, per consentire di tornare all'home-page
   * del sito terminando ed eliminando tutti quei componenti dell'interfaccia grafica come i Datepicker
   * che altrimenti non potrebbero essere correttamente chiusi.
   * 
   * @returns
   * - boolean: true l'utente si è attualmente nello stato loggato in una pagina contenente un DatePicker;
   * false l'utente è loggato ma non dentro una pagina contenente un DatePicker, oppure non è loggato.
   */
  isLoggedInForUrlsWithDatepicker(): boolean {
    // const msg = 'AuthService: isLoggedIn():';
    // Util.customLog(this.allowedLog, Util.LogType.INFO, msg, 'running!');

    console.log('========== CHECK SE SEI LOGGATO =================');

    // - We check if there is any `token` aviable from `local-storage`.
    if (this.getExpiration() === null) {
      // this.router.navigateByUrl('home-page'); console.log('token non presente');
      return false;
    }

    // - We check if there the `token` is still valid.
    const nowDate: number = new Date().getTime();
    const res =  nowDate < this.getExpiration();
    console.log(Date.now(), this.getExpiration());
    if (res === false) {
      // window.alert(`Token scaduto: go to login-form | ${Date.now()}, ${this.getExpiration()}`);
      // this.router.navigateByUrl('login-form'); console.log('token scaduto');
      // this.notificationService.signalNotificationLogin(false);
      // this.logout('/login-form');
      // this.flagLogged.next(false);
      return false;
    }
    // - If the token is valid signal it as valid!
    // this.flagLogged.next(true);
    // window.alert(`Token Non scaduto: continua con le operazioni | ${Date.now()}, ${this.getExpiration()}`);
    return true;
  }

  /*ngOnDestroy() {
    // this.logout();
  }*/
}
