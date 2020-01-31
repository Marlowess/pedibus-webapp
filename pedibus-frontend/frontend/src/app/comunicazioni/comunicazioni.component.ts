/* ============================================================================================= */
/*                                       ANGULAR IMPORTS                                         */
/* ============================================================================================= */
import { AfterViewInit, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { MatSnackBar } from '@angular/material';
import {forkJoin, Observable, Subscription} from 'rxjs';

/* ============================================================================================= */
/*                                       OUR PROJETC IMPORTS                                     */
/* ============================================================================================= */
// - Services:
import { ComunicazioniService } from '../services/comunicazioni-service/comunicazioni.service';
import { NotificationService } from '../services/notification-service/notification.service';

// - Domain objects:
import { Messaggio } from '../domain/messaggio';

// - Utils:
import {openSnackBar, Util} from '../config/util';

/* ============================================================================================= */
@Component({
  selector: 'app-comunicazioni',
  templateUrl: './comunicazioni.component.html',
  styleUrls: ['./comunicazioni.component.css']
})
export class ComunicazioniComponent implements OnInit, AfterViewInit, OnDestroy {

  /**
   * Component accessibile a tutti i tipi di utente (tranne la segreteria) come child del
   * corrispettivo smart component (genitore/accompagnatore/amministratore), mostra le
   * comunicazioni ricevute dall'utente
   */

  erroreCaricamento = false;
  noComunicazioni = false;

  // Here, instance's attributes of type `Subscription`
  private subGetMessaggi: Subscription = null;
  private subSetAllComunicazioniAsRead: Subscription = null;
  private subDeleteAllComunicazioni: Subscription = null;
  private subDeleteComunicazione: Subscription = null;
  private subGetNotificactionPushNewComunicazione: Subscription = null;
  public deleteListObs: Observable<any>[] = [];
  public deleteListSub: Subscription = null;

  // Here, instance's attributes for doing log
  private allowed = true;
  // private typeLog: string = 'debug';

  // Here, instance's attributes displayed within UI.
  public messaggi: Messaggio[] = [];
  public deleteList: Messaggio[] = [];
  public disableElimina = true;

  /* ============================================================================================= */
  constructor(
    private comunicazioniService: ComunicazioniService,
    private notificationService: NotificationService,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) { }

  /* ============================================================================================= */
  ngOnInit() {
    const msg = `[ComunicazioniComponent] ngOnInit()`;
    Util.customLog(this.allowed, Util.LogType.DEBUG, `${msg}: running!`);

    if (this.subGetMessaggi != null) {
      this.subGetMessaggi.unsubscribe();
    }
    this.subGetMessaggi = this.comunicazioniService.getMessaggi().subscribe({
      next: (data) => {
        if (data != null) {
          Util.customLog(this.allowed, Util.LogType.DEBUG,
            `${msg}: getMessaggi(): next: \n`, JSON.stringify(data));
          this.erroreCaricamento = false;
          if (data.length !== 0) {
            this.messaggi = data;
            this.noComunicazioni = false;
            this.setAllComunicazioniAsRead();
          } else {
            this.noComunicazioni = true;
          }
        } else {
          Util.customLog(this.allowed, Util.LogType.INFO,
            `${msg}: getMessaggi(): next: data is not available`);
          this.noComunicazioni = true;
          this.erroreCaricamento = true;
        }
      },
      error: (err) => {
        Util.customLog(this.allowed, Util.LogType.DEBUG,
          `${msg}: getMessaggi(): error: \n`, JSON.stringify(err));
        this.erroreCaricamento = true;
      },
      complete: () => {
        Util.customLog(this.allowed, Util.LogType.DEBUG, `${msg}: getMessaggi(): complete!`);
      }
    });
  }

  ngAfterViewInit() {
    // this.paginator.pageIndex = 0;
    this.cdr.detectChanges();
    this.notificationService.signalNotificationResetBell();

    this.subGetNotificactionPushNewComunicazione =
      this.notificationService.getNotificationPushNewComunicazione()
        .subscribe({
          next: (data) => {
            // tslint:disable-next-line:no-console
            // console.debug(`${JSON.stringify(data)}`);
            this.messaggi.splice(0, 0, new Messaggio(data));
            this.setAllComunicazioniAsRead();
            if (this.messaggi.length !== 0) { this.noComunicazioni = false; }
          },
          error: (err) => { console.error(`${JSON.stringify(err)}`); },
          complete: () => { console.error(`ngAfterViewInit() complete`); }
        });
  }

  /** Metodo invocato all'apertura della pagina, setta tutte le comunicazioni come lette
   */
  public setAllComunicazioniAsRead() {
    const msg = `[ComunicazioniComponent] setAllComunicazioniAsRead()`;

    if (this.subSetAllComunicazioniAsRead != null) {
      this.subSetAllComunicazioniAsRead.unsubscribe();
    }
    this.subSetAllComunicazioniAsRead = this.comunicazioniService.setAllComunicazioniAsRead()
      .subscribe({
        next: () => {
          this.messaggi.forEach((messaggio: Messaggio) => { messaggio.letta = true; });
        },
        error: (err) => { console.error(`${msg}: error: ${JSON.stringify(err)}`); },
        complete: () => { },
      });
  }

  /* ============================================================================================= */
  /** Metodo che aggiorna la lista di cumunicazioni che l'utente potrà eliminare cliccando il bottone
   * 'Elimina', viene invocato quando l'utente cambia lo stato del checkbox relativo a quella comunicazione
   */
  addOrRemoveToDeleteList(i: number) {
    const msg = `[ComunicazioniComponent] addToDeleteList()`;
    Util.customLog(this.allowed, Util.LogType.DEBUG, `${msg}: running!`);

    const messaggio = new Messaggio(this.messaggi[i]);
    const index = this.deleteList.findIndex(m => m.id === messaggio.id);
    if (index !== -1) {
      this.deleteList.splice(index, 1);
    } else {
      this.deleteList.push(messaggio);
    }

    this.disableElimina = this.deleteList.length === 0;
    console.log('Messaggi da eliminare:', this.deleteList);
  }

  /* ============================================================================================= */
  /** Metodo per eliminare una singola comunicazione, invocato quando si clicca sulla x in alto a destra
   * nella comunicazione
   */
  public deleteComunicazione(messaggio: Messaggio) {
    if (this.subDeleteComunicazione != null) {
      this.subDeleteComunicazione.unsubscribe();
    }
    this.comunicazioniService.deleteComunicazione(messaggio).subscribe({
      next: () => {
        // console.debug(`${msg}: error: ${JSON.stringify(data)}`);
        const indexMsg: number = this.messaggi.findIndex((msg: Messaggio) => msg.id === messaggio.id);
        if (indexMsg === -1) { return; }
        this.messaggi.splice(indexMsg, 1);
        openSnackBar('Messaggio eliminato correttamente', this.snackBar);
        if (this.messaggi.length === 0) { this.noComunicazioni = true; }
      },
      error: () => {
        // console.error(`${msg}: error: ${JSON.stringify(err)}`);
        openSnackBar('Non e\' stato possibile eliminare il messaggio', this.snackBar);
      },
      complete: () => { },
    });
  }

  /**
   * Metodo per eliminare le comunicazioni che sono state inserite nella deleteList, creata col
   * metodo 'addOrRemoveToDeleteList', invocata dal click sul bottone 'Elimina'
   */
  public deleteSelectedComunicazioni() {
    this.deleteListObs = [];
    this.deleteList.forEach((messaggio: Messaggio) => {
      this.deleteListObs.push(this.comunicazioniService.deleteComunicazione(messaggio));
    });

    let snackBarText = ''; let error = false;

    if (this.deleteListSub != null) {
      this.deleteListSub.unsubscribe();
    }
    this.deleteListSub = forkJoin(this.deleteListObs).subscribe({
      next: value => {
        value.forEach(result => {
          if (!result.error) { // richiesta andata a buon fine
            this.messaggi.splice(this.messaggi.findIndex(m => m.id === result.deletedM.id), 1);
          } else { // la richiesta non è andata a buon fine
            console.log(result.error_text);
            error = true;
          }
        });
      },
      error: err => { console.log('forkJoin error:', err); },
      complete: () => {
        console.log('forkJoin complete');
        if (!error) {
          snackBarText = 'Messaggi eliminati correttamente';
          if (this.messaggi.length === 0) { this.noComunicazioni = true; }
        } else {
          snackBarText = 'Errore nell\'eliminazione dei messaggi';
        }
        openSnackBar(snackBarText, this.snackBar);
        this.deleteList = [];
        this.disableElimina = true;
      }
    });

  }

  /**
   * Metodo per svuotare il component da tutte le comunicazioni, invocato dal click sul bottone 'Svuota'
   */
  public deleteAllComunicazioni() {
    if (this.subDeleteAllComunicazioni != null) {
      this.subDeleteAllComunicazioni.unsubscribe();
    }
    this.subDeleteAllComunicazioni = this.comunicazioniService.deleteAllComunicazioni()
      .subscribe({
        next: () => {
          // console.debug(`${msg}: error: ${JSON.stringify(data)}`);
          this.messaggi = [];
          openSnackBar('Tutti i messaggi sono stati correttamente eliminati', this.snackBar);
          this.noComunicazioni = true;
        },
        error: () => {
          // console.error(`${msg}: error: ${JSON.stringify(err)}`);
          openSnackBar('Non e\' stato possibile cancellare tutti i messaggi', this.snackBar);
        },
        complete: () => {
          // console.info(`${msg}: complete`);
        },
      });
  }

  /* ============================================================================================= */
  ngOnDestroy() {
    if (this.subGetMessaggi != null) {
      this.subGetMessaggi.unsubscribe();
    }
    if (this.subSetAllComunicazioniAsRead != null) {
      this.subSetAllComunicazioniAsRead.unsubscribe();
    }
    if (this.subDeleteAllComunicazioni != null) {
      this.subDeleteAllComunicazioni.unsubscribe();
    }
    if (this.subDeleteComunicazione != null) {
      this.subDeleteComunicazione.unsubscribe();
    }
    if (this.subGetNotificactionPushNewComunicazione != null) {
      this.subGetNotificactionPushNewComunicazione.unsubscribe();
    }
  }
}
