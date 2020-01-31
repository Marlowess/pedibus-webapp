/* ============================================================================================= */
/*                                       ANGULAR IMPORTS                                         */
/* ============================================================================================= */
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, Subject, throwError } from 'rxjs';
import { retry, switchMap, catchError, map, shareReplay, tap, take } from 'rxjs/operators';

/* ============================================================================================= */
/*                                       OUR PROJETC IMPORTS                                     */
/* ============================================================================================= */

// - Services
// import { AuthService } from '../auth/auth.service';

// - Utils
import { config } from '../../config/config';

/* ============================================================================================= */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  // - Here, private service's attributes for allowing it to perform any http request.
  private server: string = config.ip;
  private port: string = config.port;

  // - Here, private service's subjects for allowing it to signal when some events happen.
  private subject = new Subject<any>();
  private subjectLogged = new Subject<boolean>();

  private subjectResetNotificationBell = new Subject<any>();
  private subjecTurnoUpdatedNotification = new Subject<any>();

  private subjecTurnoUpdatedNotificationAccompagnatore = new Subject<any>();
  private subjecPresenzeUpdatedNotificationAccompagnatore = new Subject<any>();

  private subjecsignalNotificationDownloadPresenze = new Subject<any>();

  private subjecSignalNotificationPushNewComunicazione = new Subject<any>();

  private subjecSignalNotificationPromozioneOrDeclassamentoAccompagnatore = new Subject<any>();

  /* ============================================================================================= */
  constructor(
    // private authSerivce: AuthService,
    private http: HttpClient,
  ) {
    const msg = `[NotificationService] constructor()`;
    // tslint:disable-next-line:no-console
    console.debug(`${msg}: running!`);
  }

  /* ============================================================================================= */
  /**
   * Lets the `NotificationService` to signal that a new notification has been sent from server.
   * @param bodyNotification any
   */
  public signalNotification(bodyNotification: any): void {
    const msg = `[NotificationService] signalNotification()`;
    console.debug(`${msg}: running!`);

    console.debug(`${msg}: new notification`);
    // window.alert('[NotificationService] signalNotification()');
    this.subject.next(
      bodyNotification
    );
  }

  /**
   * Lets the `caller` to get the notification detail or message to know how to behave later, once
   * having read what the notification is about.
   */
  public getNotification(): Observable<any> {
    const msg = `[NotificationService] getNotification()`;
    console.debug(`${msg}: running!`);
    // window.alert('[NotificationService] getNotification()');

    return this.subject.asObservable();
  }

  /* ============================================================================================= */
  /**
   * Lets the `NotificationService` to signal that user is logged in or not.
   * @param isLogged boolean
   */
  public signalNotificationLogin(isLogged: boolean): void {
    const msg = `[NotificationService] signalNotificationLogin()`;
    console.debug(`${msg}: running!`);

    console.debug(`${msg}: is logged ? Answer: ${isLogged}`);
    this.subjectLogged.next(isLogged);

  }

  /**
   * Lets the `caller` to know if the user visiting a web page is logged or not.
   */
  public getNotificationLogin(): Observable<boolean> {
    const msg = `[NotificationService] getNotificationLogin()`;
    console.debug(`${msg}: running!`);

    return this.subjectLogged.asObservable();
  }

  /* ============================================================================================= */
  /**
   * Lets the `NotificationService` to signal that server has sent a set of unread notifications.
   */
  public getNotificationFromServer(): Observable<any> {
    const msg = `[NotificationService]: getNotificationFromServer()`;
    console.debug(`${msg}: running!`);

    const endpoint = 'notifications/numunread';
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    console.debug(`${msg}: ${url}!`);

    // return of(null);
    return this.http.get(url,
      // httpOptions_
    )
      .pipe(
        tap( // debug the result or error
          (data) => console.debug(`${msg}: ${url} ${data}`),
          (error) => console.debug(`${msg}: ${url} ${error}`)
        ),
        catchError(this.handleError),
      );
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
        `body was: ${error.error.errore}`);
    }
    // return an observable with a user-facing error message
    return throwError('Something bad happened; please try again later.');
  }


  /* ============================================================================================= */
  /**
   * * Lets the `NotificationService` to signal that user logged in has reached the notification web page.
   */
  public signalNotificationResetBell(): void {
    const msg = `[NotificationService] signalNotificationResetBell()`;
    // tslint:disable-next-line:no-console
    console.debug(`${msg}: running!`);

    // tslint:disable-next-line:no-console
    console.debug(`${msg}: set to zero bell's counter.`);
    this.subjectResetNotificationBell.next(
      true
    );
  }

  /**
   * Tells the `caller` that it is allowed to reset bell's counter.
   */
  public getNotificationResetBell(): Observable<boolean> {
    const msg = `[NotificationService] getNotificationResetBell()`;
    // tslint:disable-next-line:no-console
    console.debug(`${msg}: running!`);

    return this.subjectResetNotificationBell.asObservable();
  }

  /* ============================================================================================= */
  /**
   * Lets the `NotificationService` to signal that user `Accompagnatore` has received a notification about a `Turno`
   * that requires to update the UI if the Accompagnatore is dealing with the kind of information for which the notification is about.
   * @param turnoUpdatedInfo: any
   */
  public signalNotificationTurni(turnoUpdatedInfo: any): void {
    const msg = `[NotificationService] signalNotificationTurni()`;
    console.debug(`${msg}: running!`);

    console.debug(`${msg}: set to zero bell's counter.`);
    this.subjecTurnoUpdatedNotification.next(
      turnoUpdatedInfo
    );
  }

  /**
   * Tells the `caller` that it is allowed to try updating UI.
   */
  public getNotificationTurni(): Observable<any> {
    const msg = `[NotificationService] getNotificationResetBell()`;
    console.debug(`${msg}: running!`);

    return this.subjecTurnoUpdatedNotification.asObservable();
  }

  /* ============================================================================================= */
  /**
   * The public instance's method `signalNotificationTurnoAccompagnatore` sends to a user logged in as
   * `Accompagnatore` that a new notification that is related to `Turni` is aviable to that user.
   * @param turnoUpdatedInfoAccompagnatore string
   */
  public signalNotificationTurnoAccompagnatore(turnoUpdatedInfoAccompagnatore: string) {
    const msg = `[NotificationService] signalNotificationTurnoAccompagnatore()`;
    console.debug(`${msg}: running!`);
    // window.alert(msg);

    console.debug(`${msg}: sending: ${JSON.stringify(turnoUpdatedInfoAccompagnatore)}.`);
    this.subjecTurnoUpdatedNotificationAccompagnatore.next(
      turnoUpdatedInfoAccompagnatore
    );
  }

  /**
   * The public instance's method `getNotificationTurnoAccompagnatore` let a user logged in as
   * `Accompagnatore` to read a new notification that is related to `Turni` in order to decide if the
   * component has to update the UI.
   * @returns  Observable<any>
   */
  public getNotificationTurnoAccompagnatore(): Observable<any> {
    const msg = `[NotificationService] getNotificationTurnoAccompagnatore()`;
    console.debug(`${msg}: running!`);
    // window.alert(msg);

    return this.subjecTurnoUpdatedNotificationAccompagnatore.asObservable();
  }

  /* ============================================================================================= */
  /**
   * The public instance's method `signalNotificationTurnoAccompagnatore` sends to a user logged in as
   * `Accompagnatore` that a new notification that is related to `Turni` is aviable to that user.
   * @param presenzeUpdatedInfoAccompagnatore any
   */
  public signalNotificationPresenzeAccompagnatore(presenzeUpdatedInfoAccompagnatore: any) {
    const msg = `[NotificationService] signalNotificationPresenzeAccompagnatore()`;
    console.debug(`${msg}: running!`);
    // window.alert(msg);

    console.debug(`${msg}: sending: ${JSON.stringify(presenzeUpdatedInfoAccompagnatore)}.`);
    this.subjecPresenzeUpdatedNotificationAccompagnatore.next(
      presenzeUpdatedInfoAccompagnatore
    );
  }

  /**
   * The public instance's method `getNotificationTurnoAccompagnatore` let a user logged in as
   * `Accompagnatore` to read a new notification that is related to `Turni` in order to decide if the
   * component has to update the UI.
   * @returns  Observable<any>
   */
  public getNotificationPresenzeAccompagnatore(): Observable<any> {
    const msg = `[NotificationService] getNotificationPresenzeAccompagnatore()`;
    console.debug(`${msg}: running!`);
    // window.alert(msg);

    return this.subjecPresenzeUpdatedNotificationAccompagnatore.asObservable();
  }

  /* ============================================================================================= */

  public signalNotificationDownloadPresenze(formatExport: string) {
    const msg = `[NotificationService] signalNotificationDownloadPresenze()`;
    console.debug(`${msg}: running!`);
    // window.alert(msg);

    console.debug(`${msg}: sending: ${JSON.stringify(formatExport)}.`);
    this.subjecsignalNotificationDownloadPresenze.next(
      formatExport
    );
  }

  public getNotificationDownloadPresenze(formatExport: string) {
    const msg = `[NotificationService] getNotificationDownloadPresenze()`;
    console.debug(`${msg}: running!`);
    // window.alert(msg);

    return this.subjecsignalNotificationDownloadPresenze.asObservable();
  }

  /* ============================================================================================= */
  public signalNotificationPromozioneOrDeclassamentoAccompagnatore(messagePromozioneOrDeclassamento: any) {
    const msg = `[NotificationService] signalNotificationPromozioneOrDeclassamentoAccompagnatore()`;
    console.debug(`${msg}: running!`);
    // window.alert(msg);

    console.debug(`${msg}: sending: ${JSON.stringify(messagePromozioneOrDeclassamento)}.`);
    this.subjecSignalNotificationPromozioneOrDeclassamentoAccompagnatore.next(
      messagePromozioneOrDeclassamento
    );
  }

  public getNotificationPromozioneOrDeclassamentoAccompagnatore() {
    const msg = `[NotificationService] getNotificationPromozioneOrDeclassamentoAccompagnatore()`;
    console.debug(`${msg}: running!`);
    // window.alert(msg);

    return this.subjecSignalNotificationPromozioneOrDeclassamentoAccompagnatore.asObservable();
  }

  /* ============================================================================================= */
  public signalNotificationPushNewComunicazione(comunicazione: any) {
    const msg = `[NotificationService] signalNotificationPushNewComunicazione()`;
    console.debug(`${msg}: running!`);
    this.subjecSignalNotificationPushNewComunicazione.next(comunicazione);
  }

  public getNotificationPushNewComunicazione() {
    const msg = `[NotificationService] getNotificationPushNewComunicazione()`;
    console.debug(`${msg}: running!`);
    // window.alert(msg);

    return this.subjecSignalNotificationPushNewComunicazione.asObservable();
  }

  /* ============================================================================================= */
  /*                               Here ends `NotificationService` class                           */
  /* ============================================================================================= */
}
