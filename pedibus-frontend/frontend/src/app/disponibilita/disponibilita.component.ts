/* =========================================================================================== */
/*                                   ANGULAR IMPORTS                                           */
/* =========================================================================================== */
import {AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core';
import {forkJoin, Observable, Subscription} from 'rxjs'; // config
import {MatDatepickerInputEvent, MatSnackBar} from '@angular/material';
// import {MatPaginator, PageEvent} from '@angular/material';
// - Services:
import {NotificationService} from '../services/notification-service/notification.service';
import {WebsocketDisponibilitaService} from '../services/websocket-services/websocket-disponibilita/websocket-disponibilita.service';
import {WebsocketNotificationService} from '../services/websocket-notification/websocket-notification.service';
// - Config and Utils
import {configDatePicker} from '../config/config';
import {AccompagnatoreService} from '../services/accompagnatore-service/accompagnatore.service';
// - Domain objects:
import {Disponibilita} from '../domain/disponibilita-domain/disponibilita'; // import { Disponibilita } from '../domain/disponibilita';
// import { DisponibilitaVisual } from '../domain/disponibilita-visual';
import {DisponibilitaVisualBackup} from '../domain/disponibilita-domain/disponibilita-visual.backup';
import {compareDays, fromStringToDate} from '../config/util';
// import {Router} from '@angular/router';

/* =========================================================================================== */
/*                                   ANGULAR IMPORTS                                           */
/* =========================================================================================== */
// import { DisponibilitaVisualBackup } from '../domain/disponibilita-visual.backup';
// import {Accompagnatore} from '../domain/accompagnatore';

const enum ACTION_NOTIFICATION {
  ADD = 'add',
  MODIFY = 'modify',
  DELETE = 'delete',
  AVAILABLE = 'available',
  NOT_AVAILABLE = 'not-available',
}

/* =========================================================================================== */
@Component({
  selector: 'app-disponibilita',
  templateUrl: './disponibilita.component.html',
  styleUrls: ['./disponibilita.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DisponibilitaComponent implements OnInit, OnDestroy, AfterViewInit {

  // - Public attributes
  flagRawData = false;
  public listaDisponibilita: Array<DisponibilitaVisualBackup> = [];
  public dispObs: Observable<any>;
  public dispSub: Subscription = null;
  public noCorse = false;

  public showSalva = false;
  public dispAddList: Disponibilita[] = [];
  public dispDeleteList: string[] = [];
  public updateObs: Observable<any>[] = [];
  public updateSub: Subscription = null;

  public confermaSub: Subscription = null;
  public disableConfermaA = false;
  public disableConfermaR = false;

  // - Properties for managing Date and Datepicker:
  date: Date = new Date();
  public minDate: Date = configDatePicker.minDate;
  public maxDate: Date = configDatePicker.maxDate;
  public startDate: Date = new Date();
  dataInizio: Date = null;
  dataFine: Date = null;
  // Public instance's attributes for debbuging:
  // public FLAG_DEBUG_MODE_ACCOMPAGNATORE = false;
  public debugNotificationMessage: any = null;
  public numCorse = 0;

  // - Private attributes
  private subGetNotificationTurnoAccompagnatore: Subscription = null;
  // private msgLog = 'DisponibilitaComponent';

  /* =========================================================================================== */
  constructor(
    private accompagnatoreService: AccompagnatoreService,
    private cdr: ChangeDetectorRef,
    private postResult: MatSnackBar,
    private notificationService: NotificationService,
    private websocketDisponibilitaService: WebsocketDisponibilitaService,
    private websocketNotificationService: WebsocketNotificationService,
    // private router: Router
  ) { }

  /**
   * Metodo `ngOnInit` eseguito ogni volta che l'utente accompagnatore accede alla pagina delle disponibilita' per sottoscriversi tramite l'operazione di 
   * subscription sull'observable ritornato dal metodo `getNotificationTurnoAccompagnatore` del servizio `NotificationService` per poter ricevere
   * in tempo reale le notifiche di turno assegnato, o rimosso dall'utente amministratore di linea nei confronti di un utente accompagnatore.
   */
  ngOnInit() {

    this.cdr.detectChanges();
    const msg = `[DisponibilitaComponent] ngOnInit()`;

    // - Open websocket to receive information / notifications
    //   from channel related to disponibilita-turni management.
    this.websocketDisponibilitaService.openWebSocket();

    // - Subscribe to obtain a new notification when server provided it
    //   related to disponibilita-turni management.
    if (this.subGetNotificationTurnoAccompagnatore != null) {
      this.subGetNotificationTurnoAccompagnatore.unsubscribe();
    }
    this.subGetNotificationTurnoAccompagnatore =
      this.notificationService.getNotificationTurnoAccompagnatore().subscribe(
        {
          next: (notificationMessage: any) => {
            if (notificationMessage === undefined || notificationMessage.azione === undefined) {
              return;
            }
            // Debug reasons...
            this.debugNotificationMessage = notificationMessage;
            // TODO: handle the new notification accordingly, for updating the UI depending on the provided info within the message...
            // tslint:disable-next-line:no-console
            // console.debug(`${msg}: getNotificationTurnoAccompagnatore(): data: ${JSON.stringify(this.debugNotificationMessage)}`);
            // window.alert(`${msg}: getNotificationTurnoAccompagnatore(): data: ${JSON.stringify(this.debugNotificationMessage)}`);
            this.handleNotificationMessageTurnoAccompagnatore(notificationMessage);
          },
          error: (err) => { console.error(`${msg}: getNotificationTurnoAccompagnatore(): err: ${JSON.stringify(err)}`); },
          // tslint:disable-next-line:no-console
          complete: () => { console.info(`${msg}: getNotificationTurnoAccompagnatore(): complete`); }
        }
      );
  }

  /**
   * Metodo di classe privato `handleNotificationMessageTurnoAccompagnatore` permette di eseguire la gestione con eventuali
   * aggiornamenti in seguito alla ricezione di un nuovo messaggio di notifica in cui un utente riceve un nuovo turno
   * rifiuta o si rende disponibile per una certa data.
   * @param message any
   */
  private handleNotificationMessageTurnoAccompagnatore(message: any) {

    const corsa = message.response.corsa;   // corsa : action specified within notification containing some useful information for updating
    //         an existing `DisponibilitaVisualBackup`, if any.
    const action: string = message.azione;  // action : specified within notification to be checked.

    // Prepare fields for creating date to be used for finding a `Turno`, if any.
    const fields = corsa.data.toString().split('-');
    const day = fields[0]; const month = fields[1]; const year = fields[2];

    // Date of a `Turno` that has been assigned, or modified for a given user of type Accompagnatore.
    const date = new Date(Number(year), Number(month) - 1, Number(day));

    // if (action == ACTION_NOTIFICATION.MODIFY
    //   || action == ACTION_NOTIFICATION.ADD) {
    //   this.listaDisponibilita[indexDisponibilita]
    //     .updateOnNotification(message.response);
    //   // window.alert('update on notification: ' + action);
    // }

    // else if (action == ACTION_NOTIFICATION.DELETE) {
    //   this.listaDisponibilita[indexDisponibilita]
    //     .deleteOnNotification(message.response);
    //   // window.alert('delete on notification: ' + action);
    // }
    // If action is not allowed or aviable return immediately and do not update or modify nothing.
    // else {
    //   console.error(`Error, action not allowed: ${action}!`);
    //   return;
    // }

    this.switchHandlingMessage(corsa, date, message, action);
  }

  private findIndexDisponibilita(date: Date, corsa: any): number {
    // Find index of `Turno` if present.
    const indexDisponibilita: number =
      this.listaDisponibilita
        .findIndex((disp: DisponibilitaVisualBackup) => {
          return disp.getDate().getTime() === date.getTime();
        });

    // If `Turno` is not aviable return immediately and do not update or modify nothing.
    if (indexDisponibilita === -1) {
      // tslint:disable-next-line:no-console
      // console.info(`Date not found: ${corsa.data}!`);
      // window.alert(`Date not found: ${corsa.data}!`);
      return -1;
    }
    return indexDisponibilita;
  }

  /**
   * Metodo di classe privato `switchHandlingMessage` usato per eseguire le operazioni di aggiornamento sull'interfaccia grafica e richiedere
   * l'aggioramento dei dati del dominio relativi alle disponbilità di un utente a seguito della ricezione di un nuovo messagio inerente il contesto
   * delle disponibilità degli accompagnatori.
   * @param corsa any
   * @param date Date
   * @param message any
   * @param action string
   */
  private switchHandlingMessage(corsa: any, date: Date, message: any, action: string) {
    let indexDisponibilita = -1;
    switch (action) {
      case ACTION_NOTIFICATION.ADD:
        // window.alert('Add on notification: ' + action);

        indexDisponibilita = this.findIndexDisponibilita(date, corsa);
        this.listaDisponibilita[indexDisponibilita]
          .updateOnNotification(message.response);
        break;
      case ACTION_NOTIFICATION.MODIFY:
        // window.alert('Update on notification: ' + action);

        indexDisponibilita = this.findIndexDisponibilita(date, corsa);
        this.listaDisponibilita[indexDisponibilita]
          .updateOnNotification(message.response);
        break;
      case ACTION_NOTIFICATION.DELETE:
        // window.alert('Delete on notification: ' + action);

        indexDisponibilita = this.findIndexDisponibilita(date, corsa);
        this.listaDisponibilita[indexDisponibilita]
          .deleteOnNotification(message.response);
        break;
      case ACTION_NOTIFICATION.AVAILABLE:
        // window.alert('Available on notification: ' + action);
        break;
      case ACTION_NOTIFICATION.NOT_AVAILABLE:
        // window.alert('Not-available on notification: ' + action);
        break;
      default:
        // console.error(`Error, action not allowed: ${action}!`);
        return;
    }
  }
  /* =========================================================================================== */
  ngAfterViewInit() {
    this.date = new Date();

    // - Get, if any, all Turni organized within a sorted list by date, in order to allow user-accompagnatore to pick a date
    //   to which user-accompagnatore wants allow amministratori-like users to know user-accompagnatore is aviable.
    this.viewAllCorseAndDisp(this.date);
  }

  /* =========================================================================================== */
  /**
   * Metodo publico `viewAllCorseAndDisp` consente di visualizzare le corse dispoibili per una certa
   * data.
   * @param giorno Date
   */
  viewAllCorseAndDisp(giorno: Date) {

    this.listaDisponibilita = [];
    this.showSalva = false;
    this.flagRawData = false;

    this.dispObs = this.accompagnatoreService.getAllCorseAndDisponibilita(giorno);
    if (this.dispSub != null) {
      this.dispSub.unsubscribe();
    }
    this.dispSub = this.dispObs.subscribe({
      next: (resp: any) => {
        this.noCorse = true;
        this.numCorse = 0;

        this.dataInizio = fromStringToDate(resp.data_inizio);
        this.dataFine = fromStringToDate(resp.data_fine);
        // tslint:disable-next-line:forin
        for (const date in resp.disponibilita) { // in this.dispResp
          this.noCorse = false;
          this.numCorse += 1;
          // console.log(`(${this.numCorse}) getAllCorseAndDisponibilita: ` + date, resp.disponibilita[date]);

          // esp.disponibilita[date] è un array di due oggetti: uno per l'andata e uno per il ritorno.
          // ognuno di questi due oggetti è costituito da due campi, le info sulla disponibilità e sul turno
          const andataEOritorno: Array<any> = resp.disponibilita[date];

          const fields = date.toString().split('-');
          const day = fields[0]; const month = fields[1]; const year = fields[2];
          const data = new Date(Number(year), Number(month) - 1, Number(day));
          // console.log('getAllCorseAndDisponibilita: ', data);

          const result = new DisponibilitaVisualBackup(andataEOritorno, data);
          // console.log('getAllCorseAndDisponibilita: ', JSON.stringify(result));
          this.listaDisponibilita.push(
            result
          );

          if (result.getOraSalitaAndata() != null) {
            this.disableConfermaA = false;
          }
          if (result.getOraSalitaRitorno() != null) {
            this.disableConfermaR = false;
          }
        }
        this.flagRawData = true;
      },
      error: err => {
        console.error(err);
        /*if (err.status === 403) {
          this.router.navigateByUrl('accesso-negato');
          // this.router.navigate(['accesso-negato']);
        }*/
      },
      complete: () => { console.log(this.listaDisponibilita); console.log('richiesta disponibilità completata'); }
      // this.dateChanged = false; }
    });
  }

  /**
   * Il metodo publcio `checkChanged` server per controllare se ci sono state modifiche di qualche
   * genere sulla linea dell'andata oppure sulla linea del ritorno per consentire in caso di modifiche
   * di poterle confermare e salvere mandando i nuovi dati aggiornati al server.
   * @param date Date
   * @param direzione number
   */
  checkChanged(date: Date, direzione: number) {
    this.listaDisponibilita.forEach((disp) => {
      if (disp.getDate() === date) {
        if (direzione === 0) { // ho modificato l'andata
          disp.toggleModifiedAndata(); // Either from True toward false, or viceversa
        } else { // ho modificato il ritorno
          disp.toggleModifiedRitorno(); // Either from True toward false, or viceversa
        }
      }
    });

    this.listaDisponibilita.some(disp => {
      if (disp.areAndataOrRitornoModified()) {
        this.showSalva = true;
        return true;
      } else {
        return false;
      }
    });
  }

/**
 * Il metodo publico `updateDisponibilita` viene invocato quando un utente accompagnatore aggiunge, rimuove una disponibilita' oppure
 * rifiuta e non conferma il turno che gli verrebbe assegnato a fronte della nuova disponibilitò.
 */
  updateDisponibilita() {
    this.dispAddList = []; this.dispDeleteList = [];
    // manda al server una nuova disponibilità solo se ho cambiato qualcosa per quella data e direzione
    this.listaDisponibilita.forEach((disp: DisponibilitaVisualBackup) => {
      if (disp.isModifiedAndata()) {
        if (disp.existsAndata() === false) {
          disp.setExistsAndata(true);
          this.dispAddList.push(new Disponibilita(disp.getDate(), 0));
        } else {
          disp.setExistsAndata(false);
          this.dispDeleteList.push(disp.getIdDisponibilitaAndata());
        }
      }
      if (disp.isModifiedRitorno()) {
        if (disp.existsRitorno() === false) {
          disp.setExistsRitorno(true);
          this.dispAddList.push(new Disponibilita(disp.getDate(), 1));
        } else {
          disp.setExistsRitorno(false);
          this.dispDeleteList.push(disp.getIdDisponibilitaRitorno());
        }
      }
    });
    this.updateObs = [];
    this.dispAddList.forEach((disp: Disponibilita) => {
      this.updateObs.push(this.accompagnatoreService.addDisponibilita(disp));
    });
    this.dispDeleteList.forEach((dispID: string) => {
      this.updateObs.push(this.accompagnatoreService.deleteDisponibilita(dispID));
    });

    let snackBarText = '';
    let error = false;
    let errorText = '';

    if (this.updateSub != null) {
      this.updateSub.unsubscribe();
    }
    this.updateSub = forkJoin(this.updateObs).subscribe({
      next: value => {
        value.forEach(result => {
          // console.log('C\'è stato un errore?', result.error);
          this.listaDisponibilita.forEach((disp: DisponibilitaVisualBackup) => {
            const resultUpdate = disp.updateAfterForkJoin(result);
            if (resultUpdate != null) {
              error = resultUpdate.error;
              errorText = resultUpdate.errorText;
            }
          });
        });
      },
      error: err => { console.log('forkJoin error'); console.log(err); },
      complete: () => {
        // console.log('forkJoin complete');
        if (!error) {
          snackBarText = 'Disponibilità aggiornate correttamente';
        }
        if (error) {
          if (errorText ===
            'Impossibile completare la richiesta perchè l\'evento avverrà tra meno di cinque minuti.') {
            snackBarText = 'Impossibile modificare la disponibilità per il giorno corrente';
          } else {
            snackBarText = 'Errore nell\'aggiornamento di una disponibilità';
          }
        }
        this.openSnackBar(snackBarText);
        this.showSalva = false;
      }
    });

  }

  /**
   * Public method `confermaRifiutaTurno` is used when A user logged in as `Accompagnatore`
   * wants to either confirm or deny a new `Turno` to which has been attached by a user of type `Amministratore Linea`.
   * @param i number
   * @param direzione number
   * @param conferma boolean
   */
  confermaRifiutaTurno(i: number, direzione: number, conferma: boolean) {
    let idTurno: string = null;
    // Here, we understand whether user is dealing with a Andata or Ritorno Turno.
    switch (direzione) {
      case 0: {
        idTurno = this.listaDisponibilita[i].getIdTurnoAndata();
        break;
      }
      case 1: {
        idTurno = this.listaDisponibilita[i].getIdTurnoRitorno();
        break;
      }
    }
    let risposta: string = null;
    this.confermaSub = this.accompagnatoreService.confermaTurno(idTurno, conferma).subscribe({
      next: (value: any) => {
        // console.log(value);
        if (direzione === 0) {
          this.disableConfermaA = true;
          this.listaDisponibilita[i].setConfermataAndata(conferma);
          // window.alert(`this.listaDisponibilita[i].setConfermataAndata(conferma) = ${this.listaDisponibilita[i].getConfermataAndata()}`);
          // window.alert(JSON.stringify(this.listaDisponibilita[i]));
          this.listaDisponibilita[i].disponibilitaAndata.confermata = true;
        } else {
          this.disableConfermaR = true;
          this.listaDisponibilita[i].setConfermataRitorno(conferma);
        }
        if (conferma) {
          risposta = 'Turno confermato';
        } else {
          risposta = 'Turno rifiutato';
          this.listaDisponibilita.forEach(disp => {
            if (direzione === 0) {
              if (disp.getIdTurnoAndata() === idTurno) {
                disp.setIdTurnoAndata(null);
              }
            } else {
              if (disp.getIdTurnoRitorno() === idTurno) {
                disp.setIdTurnoRitorno(null);
              }
            }
          });
        }
      },
      error: err => {
        // console.error(err);
        risposta = err;
      },
      complete: () => {
        // console.log('confermaTurno completata');
        this.openSnackBar(risposta);
      }
    });
  }

  /**
   * Public method `isConfermatoOrRifiutato` used to understand if a given `Turno` has been accepted or rejected by
   * a user logged in as `Accompagnatore` when the `Turno` is either at the `Andata` or `Ritorno`.
   * @param i number
   * @param direzione number
   */
  isConfermatoOrRifiutato(i: number, direzione: number) {
    const disponibilita: DisponibilitaVisualBackup = this.listaDisponibilita[i];
    switch (direzione) {
      case 0:
        if (disponibilita.getIdTurnoAndata() != null) {
          if (disponibilita.getConfermataAndata()) {
            return 'turno-confermato';
          } else {
            return 'turno-pendente';
          }
        }
        break;
      case 1:
        if (disponibilita.getIdTurnoRitorno() != null) {
          if (disponibilita.getConfermataRitorno()) {
            return 'turno-confermato';
          } else {
            return 'turno-pendente';
          }
        }
        break;
    }

  }

  /* =========================================================================================== */
  /**
   * Public method `onDateSelect` used to update the UI showing the aviable turni `Proposti` or `Assegnati`
   * to the current user if the user is logged in as `Accompagnatore` once the user has chosen a given date
   * by means of the aviable date-picker that is within the UI.
   * @param type string
   * @param event MatDatepickerInputEvent<Date>
   */
  onDateSelect(type: string, event: MatDatepickerInputEvent<Date>) {
    this.date = new Date(event.value); // this.dateChanged = true;
    this.viewAllCorseAndDisp(this.date);
  }
  /**
   * Open snack-bar to let user knowing that a particular operation has been done with success.
   * @param message string
   */
  openSnackBar(message: string) {
    this.postResult.open(message, 'OK', {
      duration: 2000,
    });
  }

  public showDate(index: number): Date {
    if (this.listaDisponibilita == null) { return; }
    if (this.listaDisponibilita[index] == null) { return; }

    const disponibilita: DisponibilitaVisualBackup = this.listaDisponibilita[index];

    const tmpCheck: any = disponibilita.getDate();
    if (tmpCheck == null) { return; }

    return disponibilita.getDate();
  }

  /* =========================================================================================== */
  /**
   * Metodo per controllare se si sta visualizzando una corsa avvenuta in un giorno passato
   */
  isPastDay(date: Date): boolean {
    // console.log(date, compareDays(this.date, date) === 1);
    return compareDays(new Date(), date) >= 0;
  }

  /* =========================================================================================== */
  log(msg: string): void {
    // console.log(`${this.msgLog}: ${msg}`);
  }

  /* =========================================================================================== */
  ngOnDestroy(): void {
    if (this.dispSub != null) {
      this.dispSub.unsubscribe();
    }
    if (this.updateSub != null) {
      this.updateSub.unsubscribe();
    }
    if (this.confermaSub != null) {
      this.confermaSub.unsubscribe();
    }
    if (this.subGetNotificationTurnoAccompagnatore != null) {
      this.subGetNotificationTurnoAccompagnatore.unsubscribe();
    }
    // this.websocketNotificationService.disconnectWebSocket();
    this.websocketDisponibilitaService.disconnectWebSocket();
  }
}
