/* =========================================================================================== */
/*                                   ANGULAR IMPORTS                                           */
/* =========================================================================================== */
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ViewEncapsulation,
  ViewChild
} from '@angular/core';
import { FormControl } from '@angular/forms';
import {MatDatepickerInputEvent, MatIconRegistry, MatSnackBar, MatTabGroup} from '@angular/material';
import { MatDialog } from '@angular/material/dialog';
// MatDialogModule, MatDialog, MatDialogRef, MAT_DIALOG_DATA
import { Subscription, Observable } from 'rxjs';

/* =========================================================================================== */
/*                                       OUR IMPORTS                                           */
/* =========================================================================================== */
// Service classes:
import { PresenzeService } from '../services/presenze-service/presenze.service';
import { AuthService } from '../services/auth/auth.service';
import { WebsocketPresenzeService } from '../services/websocket-services/websocket-presenze/websocket-presenze.service';
// import { DownloadPresenzeService } from '../services/download-presenze/download-presenze.service';

// Config and Utils:
import {configDatePicker} from '../config/config';
import {compareDays, openSnackBar} from '../config/util';

// Component classes:
import { NotificationService } from '../services/notification-service/notification.service';
import { CorsaPresenze } from '../domain/presenze-domain/corsa';
import { Fermata } from '../domain/presenze-domain/fermata';
import { BambinoPresenze } from '../domain/presenze-domain/bambino-presenze';
import { BambinoNonPrenotatoPresenze } from '../domain/presenze-domain/bambino-non-prenotato-presenze';
import { MessageBetweenAccompagnatori } from '../domain/presenze-domain/message-between-accompagnatori';
import { PrenotazionePresenze } from '../domain/presenze-domain/prenotazione-presenze';
import {DialogEsportaPresenzeComponent} from '../dialogs/dialog-esporta-presenze/dialog-esporta-presenze.component';
import {DialogPresenzeNuovaPrenotazione} from '../dialogs/dialog-presenze-nuova-prenotazione/dialog-presenze-nuova-prenotazione.component';
// tslint:disable-next-line:max-line-length
import {DialogPresenzePartitiArrivatiComponent} from '../dialogs/dialog-presenze-partiti-arrivati/dialog-presenze-partiti-arrivati.component';
import {DomSanitizer} from '@angular/platform-browser';
// import { mdiMapMarkerOff } from '@mdi/js';


/* =========================================================================================== */

enum DIRECTION_ {
  FORWARD = '0',
  BACKWARD = '1',
}

enum STATO_BAMBINO_STYLE {
  NON_PRENOTATO_NON_PRESO = 0,
  PRENOTATO_GENITORE,
  PRENOTATO_ACCOMPAGNATORE,
  PRENOTATO_GENITORE_PRESO,
  PRENOTATO_ACCOMPAGNATORE_PRESO,
}

@Component({
  selector: 'app-presenze',
  templateUrl: './presenze.component.html',
  styleUrls: ['./presenze.component.css'],
  encapsulation: ViewEncapsulation.None // per sovrascrivere il css del mat-tab
})
export class PresenzeComponent implements OnInit, AfterViewInit, OnDestroy { // AfterViewChecked

  @ViewChild('tabGroup') tabGroup: MatTabGroup;

  public DEBUG_MODE_ATTENDANCE_COMPONENT = false;
  public debugMessageNotification: any = null;

  /* =========================================================================================== */
  // Public attributes:
  public DIRECTION = DIRECTION_;

  // attributes used as boolean flags:
  // public debugMode = true;
  public submitted = true;
  public linesFlag = false;
  public flagRawData = false;

  public noAndata = false;
  public noRitorno = false;
  public noCorsa = false;

  // public corsaFlag = false; // public lineSelected = true;
  // public flagNoCorsa = false; // public dateSelected = false;

  public linesNames: string[] = null;
  public selectedLinea = '';

  public corsa: CorsaPresenze = null;

  // private msgLog = '-> PresenzeComponent';

  public fermataDiscesaID: string = null;
  public stato = '';

  // public typeFormatExportData = 'xml';

  public date: Date = null;
  public minDate = configDatePicker.minDate;
  public maxDate = configDatePicker.maxDate;
  public startDate: Date = new Date();

  public position = new FormControl();

  /* =========================================================================================== */
  // Private attributes:

  // Subscription / Observable attributes:
  private updateStateObs: Observable<any> = null;
  private subUpdateState: Subscription = null;
  private subUpdateState2: Subscription = null;
  private observableLines: Subscription = null;
  private arrivatiOrPartitiSub: Subscription = null;
  private realtimeNotificationSub: Subscription = null;

  /* =========================================================================================== */
  constructor(
    private presenzeService: PresenzeService,
    private authService: AuthService,
    public dialog: MatDialog,
    private websocketPresenzeService: WebsocketPresenzeService,
    private notificationService: NotificationService,
    private snackBar: MatSnackBar,
    private matIconRegistry: MatIconRegistry,
    private domSanitizer: DomSanitizer,
    // private cdr: ChangeDetectorRef
    // private downloadPresenzeService: DownloadPresenzeService,
  ) {
    this.matIconRegistry.addSvgIcon(
      'fermata_no_turno',
      this.domSanitizer.bypassSecurityTrustResourceUrl('../assets/location_with_bar.svg')
    );
  }
  // @ViewChild('tabGroup') tabGroup: MatTabGroup;

  /**
   * Nel metodo di classe `ngOnInit` apriamo il websocket con il server e recuperiamo l'elenco
   * delle linee disponibili.
   */
  ngOnInit() {
    const msg = `[AttendanceComponent] ngOnInit()`;
    // tslint:disable-next-line:no-console
    console.debug(`${msg} is running!`);

    // check if user is still logged in, otherwise redirect him to loggin page.
    this.authService.isLoggedIn();

    // Zeroed position value for indicating which line has been selected.
    this.position.setValue('');

    // Initiate date attribute to current date.
    this.date = new Date();

    // Negotiation for opening a websocket in order to obtain notifications from server
    // about a user-accompagnatore updates when he interact with application modifying
    // attendance.component data objects.
    this.websocketPresenzeService.openWebSocket();

    const msgGetLines = `${msg} getLines()`;
    this.observableLines = this.presenzeService.getLines().subscribe({
      next: (response: any) => {
        // if response is null or undefined return immediately, do not update anything about UI.
        if (response == null) { //  || response === undefined
          console.warn(`${msgGetLines}: next: response is null, gotten from server`);
          return;
        } else {
          // tslint:disable-next-line:no-console
          console.info(`${msgGetLines}: next:\n${JSON.stringify(response)}`);
          this.linesNames = response;
          this.linesFlag = true;
          this.selectedLinea = this.linesNames[0];
          this.viewCorsaConPresenze(this.selectedLinea, this.date);
        }
      },
      error: (err: any) => console.error(`${msgGetLines}: error:\n${JSON.stringify(err)}`),
      // tslint:disable-next-line:no-console
      complete: () => console.info(`${msgGetLines}: complete`)
    });
  }

  /* =========================================================================================== */
  /*                        Handling a notification coming from server                           */
  /* =========================================================================================== */
  /** Gestisce le diverse possibili notifiche in arrivo, causate da operazioni effettuate da un altro
   * utente accompagnatore (cambiamenti sullo stato della corsa o sulla presenza dei bambini) o da
   * un utente genitore (creazioni, modifiche o eliminazioni di prenotazioni)
   *
   * @param notificationMessage any
   */
  private switchRealtimeNotification(notificationMessage: any) {

    const action: string = notificationMessage.azione.toUpperCase();

    let messageOldPrenotazione: PrenotazionePresenze = null;

    switch (action) {
      case 'CORSA_PARTITA_RITORNO':
        this.corsa.setPartitiRitorno(true);
        break;

      case 'CORSA_COMPLETATA_ANDATA':
        this.corsa.setCompletataAndata(true);
        break;
      case 'SELEZIONATO':
        const messageSelezionato: MessageBetweenAccompagnatori =
          MessageBetweenAccompagnatori.deserialize(notificationMessage);

        this.corsa.updateBambinoSalito(messageSelezionato);
        break;
      case 'DESELEZIONATO':
        const messageDeselezionato: MessageBetweenAccompagnatori =
          MessageBetweenAccompagnatori.deserialize(notificationMessage);

        this.corsa.updateBambinoSceso(messageDeselezionato);
        break;
      case 'NUOVA_PRENOTAZIONE':
        notificationMessage.prenotazione.date = notificationMessage.date;
        const messageNuovaPrenotazione: PrenotazionePresenze =
          PrenotazionePresenze.deserialize(notificationMessage.prenotazione);
        this.corsa.updateBambinoByNuovaPrenotazione(
          notificationMessage.prenotatoDaGenitore,
          notificationMessage.linea,
          messageNuovaPrenotazione);
        break;
      case 'DELETE_PRENOTAZIONE':
        notificationMessage.prenotazione.date = notificationMessage.date;
        messageOldPrenotazione = PrenotazionePresenze.deserialize(notificationMessage.prenotazione);
        this.corsa.deleteBambinoByExistingPrenotazione(
          notificationMessage.prenotatoDaGenitore,
          notificationMessage.linea,
          messageOldPrenotazione);
        break;
      case 'UPDATE_PRENOTAZIONE':
        // Before remove
        notificationMessage.prenotazioneOld.date = notificationMessage.date;
        messageOldPrenotazione = PrenotazionePresenze.deserialize(notificationMessage.prenotazioneOld);
        this.corsa.deleteBambinoByExistingPrenotazione(
          notificationMessage.prenotatoDaGenitore,
          notificationMessage.lineaOld,
          messageOldPrenotazione);
        // Then insert new prenotazione

        notificationMessage.prenotazione.date = notificationMessage.date;
        const messageNuovaPrenotazioneUpdate = PrenotazionePresenze.deserialize(notificationMessage.prenotazione);
        this.corsa.updateBambinoByNuovaPrenotazione(
          notificationMessage.prenotatoDaGenitore,
          notificationMessage.linea,
          messageNuovaPrenotazioneUpdate);
        break;
      case 'AVAILABLE':
        notificationMessage.prenotazione.date = notificationMessage.date;
        this.corsa.setAvailableBambino(notificationMessage);
        break;
      case 'NOT_AVAILABLE':
        notificationMessage.prenotazione.date = notificationMessage.date;
        this.corsa.setNotAvailableBambino(notificationMessage);
        break;
      default:
        // window.alert(`Realtime Notification not valid!`);
        break;
    }
  }

  ngAfterViewInit() {
    const msg = `[AttendanceComponent] ngAfterViewInit()`;
    // console.debug(`${msg} is running!`);

    const msgRealtimeNotificationSub = `${msg}: getNotificationPresenzeAccompagnatore()`;

    this.realtimeNotificationSub =
      this.notificationService.getNotificationPresenzeAccompagnatore()
        .subscribe(
          {
            next: (notificationMessage: any) => {
              // console.debug(`${msgRealtimeNotificationSub}: next: ${JSON.stringify(notificationMessage)}`);
              // window.alert(`${msgRealtimeNotificationSub}: next: ${JSON.stringify(notificationMessage)}`);

              if (notificationMessage !== undefined
                && notificationMessage !== null) {
                // window.alert(`${msgRealtimeNotificationSub}: next: message not null`);
                this.debugMessageNotification = notificationMessage;
                this.switchRealtimeNotification(notificationMessage);
              } else {
                // window.alert(`${msgRealtimeNotificationSub}: next: Null or Undefined message`);
                // console.debug(`${msgRealtimeNotificationSub}: next: Null or Undefined message`);
              }
            },
            error: () => {
              console.error(`${msgRealtimeNotificationSub}: error: ${JSON.stringify(msgRealtimeNotificationSub)}`);
            },
            // tslint:disable-next-line:no-console
            complete: () => { console.info(`${msgRealtimeNotificationSub}: complete!`); }
          }
        );
  }

  /* =========================================================================================== */
  /**
   * Prende dal server le informazioni sulla corsa del giorno e della linea passati come parametri
   * @param nomeLinea string
   * @param date Date
   */
  public viewCorsaConPresenze(nomeLinea: string, date: Date) {

    const msg = `[AttendanceComponent] viewCorsaConPresenze()`;
    // console.debug(`${msg}: running!`);
    this.flagRawData = false;

    // Get observable.
    const msgGetCorsaByLineNameAndDate = `${msg}: getCorsaByLineNameAndDate()`;
    this.updateStateObs = this.presenzeService.getCorsaByLineNameAndDate(nomeLinea, date);

    // Subscribe using the observable from above.
    if (this.subUpdateState != null) {
      this.subUpdateState.unsubscribe();
    }
    this.subUpdateState = this.updateStateObs.subscribe({
      next: (data: any) => {
        if (data != null) {
          // console.debug(`${msgGetCorsaByLineNameAndDate}: next: ${JSON.stringify(data)}`);
          this.corsa = data;

          // this.noAndata = this.corsa.andata === null; this.noRitorno = this.corsa.ritorno === null;
          this.noAndata = !this.corsa.getExistsAndata();
          this.noRitorno = !this.corsa.getExistsRitorno();
          // tslint:disable-next-line:no-console
          console.debug('Non hai la corsa di andata?', this.noAndata);
          // tslint:disable-next-line:no-console
          console.debug('Non hai la corsa di ritorno?', this.noRitorno);

          if (this.noAndata === true && this.noRitorno === true) {
            this.noCorsa = true;
            this.corsa = null;
          } else {
            this.noCorsa = false;
            // this.tabGroup.realignInkBar();
          }
        } else {
          // tslint:disable-next-line:no-console
          console.debug(`${msgGetCorsaByLineNameAndDate}: next: ${JSON.stringify(data)}`);
          this.corsa = null;
          this.noCorsa = true;
        }
        this.flagRawData = true;
      },
      error: () => {
        // console.error(`${msgGetCorsaByLineNameAndDate}: error: ${JSON.stringify(err)}`);
        this.corsa = null; this.noCorsa = true;
      },
      complete: () => {
        // tslint:disable-next-line:no-console
        console.info(`${msgGetCorsaByLineNameAndDate}: complete`);
        if (!this.noCorsa) {
          setTimeout(() => { this.tabGroup.realignInkBar(); }, 0);
        }
      }
    });
  }

  /* =========================================================================================== */
  /*                  Utilities for interacting with GUI                                         */
  /* =========================================================================================== */

  /**
   * Il metodo 'onDateSelect' permette di recuperare la data selezionata dall'utente
   * accompagnatore, che vuole recuperare l'eventuale corsa in programma in quella data.
   *
   * @param type :string;
   * @param event :MatDatepickerInputEvent<Date>;
   */
  onDateSelect(type: string, event: MatDatepickerInputEvent<Date>) {
    this.date = new Date(event.value);
    this.viewCorsaConPresenze(this.selectedLinea, this.date);
  }

  /** Invocato quando l'utente cambia la linea da visualizzare */
  onSelectLinea(value: string) {
    this.selectedLinea = value;
    this.viewCorsaConPresenze(this.selectedLinea, this.date); // Number(this.date)
  }


  /* =========================================================================================== */
  /*                                Managing `aggiornaStato`                                     */
  /* =========================================================================================== */

  /** Invocato al click effettuato sul nome di un bambino prenotato (passato come parametro), setta
   * la proprietà 'presenza' del bambino
   *
   * @param bambino: BambinoPresenze
   * @param salitaDiscesa: boolean
   */
  private aggiornaStatoBambinoPrenotato(bambino: BambinoPresenze, salitaDiscesa: boolean) {

    const nomeLinea = this.corsa.nomeLinea;
    const state: boolean = !bambino.presente;

    /* può essere true o false: se è false vuol dire che il bambino non era stato prenotato dal genitore,
       ma è stato prenotato dall'accompagnatore, che l'ha segnato come presente */
    this.subUpdateState = this.presenzeService
      .updateState(nomeLinea, this.date, salitaDiscesa, state,
        bambino.prenotazioneID, bambino.nome)
      .subscribe({
          next: (message) => {
            if (message === true) {
              bambino.presente = !bambino.presente;
              // this.notificationService.signalNotificationPresenzeAccompagnatore({
              //   lineName: nomeLinea,
              //   date: this.date,
              //   salitaDiscesa: salitaDiscesa,
              //   state: state,
              //   prenotazioneID: bambino.prenotazioneID,
              //   bambino: bambino.nome,
              //   direzione: null,
              // });
              this.log(`aggiornaStato(): Update Ok`);
            } else {
              openSnackBar('Non puoi deselezionare il bambino se e\' gia\' arrivato a destinazione',
                this.snackBar);
              this.log(`aggiornaStato(): Update failed`);
            }
          },

          error: (err) => {
            openSnackBar('Errore nella selezione di un bambino prenotato', this.snackBar);
            console.error(err);
          },
          // tslint:disable-next-line:no-console
          complete: () => { console.info('aggiornaStato(): done'); }
        }
      );
  }

  /** Invocato al click effettuato sul nome di un bambino non ancora prenotato (passato come parametro),
   * apre un dialog per confermare la creazione di una nuova prenotazione per il bambino e il conseguente
   * invio di una comunicazione al genitore (nel caso di prenotazione al ritorno è necessario scegliere
   * anche la fermata di arrivo)
   *
   * @param bambino: bambino non prenotato
   * @param salitaDiscesa: indica se è una salita o una discesa
   * @param fermataSalitaDiscesa: salita se è all'andata, discesa se è al ritorno
   * @param direzione: andata o ritorno
   */
  private aggiornaStatoBambinoNonPrenotato(bambino: BambinoNonPrenotatoPresenze, salitaDiscesa: boolean,
                                           fermataSalitaDiscesa: any, direzione: any) {

    const msg = `[AttendanceComponent] aggiornaStatoBambinoNonPrenotato()`;
    // tslint:disable-next-line:no-console
    console.debug(msg + ': running!');

    const nomeLinea = this.corsa.nomeLinea;

    const dialogData = {
      dir: direzione,
      bambino: bambino.nome,
      fermata: fermataSalitaDiscesa.indirizzo,
      fermate: null,
    };

    // se sto prenotando il bambino al ritorno devo scegliere anche la fermata di arrivo
    if (direzione === this.DIRECTION.BACKWARD) {
      dialogData.fermate = new Array<Fermata>();
      this.corsa.fermateRitorno.forEach(fermata => {
        if (fermata.descrizione !== 'Scuola') {
          dialogData.fermate.push(fermata);
        }
      });
    }
    // tslint:disable-next-line:no-console
    console.debug(bambino.nome, 'non è stato prenotato dai genitori');
    const dialogRef = this.dialog.open(DialogPresenzeNuovaPrenotazione, {
      panelClass: 'dialog',
      width: '350px',
      data: dialogData
    });

    dialogRef.afterClosed().subscribe(result => {
      // se ho chiuso il dialog o cliccato su 'annulla'
      if (result === undefined) { return; }

      if (this.DIRECTION.BACKWARD === direzione) {
        fermataSalitaDiscesa.fermataID = result.fermataArrivoID;
      }

      const msgUpdateStateNonPrenotato = `${msg}: updateStateNonPrenotato()`;
      this.subUpdateState = this.presenzeService
        .updateStateNonPrenotato(nomeLinea, this.date, bambino.nome,
          bambino.genitoreId, fermataSalitaDiscesa.fermataID, direzione)
        .subscribe({
          next: (message: any) => {
            const presente: boolean = direzione.toString() === this.DIRECTION.FORWARD;

            // tslint:disable-next-line:no-console
            console.debug(`${msgUpdateStateNonPrenotato}: next: ${JSON.stringify(message)}`);
            const bambinoPresenze: BambinoPresenze = new BambinoPresenze(
              message.prenotazione.id,
              message.prenotazione.bambino,
              presente,
              false
            );
            this.updateCorsa(fermataSalitaDiscesa.fermataID, bambinoPresenze, direzione, message.token);

            // this.notificationService.signalNotificationPresenzeAccompagnatore({
            //   lineName: nomeLinea,
            //   date: this.date,
            //   fermataSalita: message,
            //   fermataDiscesa: message,
            //   fermataID: fermataSalitaDiscesa.fermataID,
            //   bambino: bambino.nome,
            //   direzione: direzione,
            // });

          },
          error: (err) => console.error(`${msgUpdateStateNonPrenotato}: error: ${JSON.stringify(err)}`),
          // tslint:disable-next-line:no-console
          complete: () => console.info(`${msgUpdateStateNonPrenotato}: complete`)
        });
    });
  }

  /**
   * Il metodo `aggiornaStato` permette, selezionando dall'interfaccia grafica un bambino
   * che sale o scende ad una certa fermata, di poterlo registrare come bambino effettivamente salito
   * (all'andata) o sceso (al ritorno) presso la fermata (passata come parametro) della corsa attualemente
   * visualizzata.
   * Se il bambino-passeggero e' uno di quelli che e' stato prenotato dal genitore, allora parte la richiesta
   * http per consentire all'accompagnatore di registrare che il bambino e' salito o sceso.   *
   * Se, invece, il bambino non e' uno di quelli che e' stato prenotato dal genitore, il metodo in esame
   * invoca un altro metodo della medesima classe che coincide con il metodo 'openDialog', che permette
   * all'accompagnatore di creare una nuova prenotazione per il bambino.
   */
  aggiornaStato(bambino: any, salitaDiscesa: boolean, fermataSalitaDiscesa: any,
                direzione: string, index: number = 0) {

    /*const msg = `[PresenzeComponent] aggiornaStato()`;
    // tslint:disable-next-line:no-console
    console.debug(msg + ': running!');

    const nomeLinea = this.corsa.nomeLinea;
    const state: boolean = !bambino.presente;*/

    if (direzione === this.DIRECTION.BACKWARD && index !== 0) {
      if (this.corsa.getPartitiRitorno() === false) {
        openSnackBar('Impossibile aggiornare stato bambino.\nLa corsa di ritorno non è ancora partita',
          this.snackBar);
        return;
      }
    }

    if (bambino.prenotatoDaGenitore !== undefined) {
      this.aggiornaStatoBambinoPrenotato(bambino, salitaDiscesa);
    } else {
      this.aggiornaStatoBambinoNonPrenotato(bambino, salitaDiscesa, fermataSalitaDiscesa, direzione);
    }

  }

  /* =========================================================================================== */
  /**
   * Il metodo updateCorsa viene invocato per aggiornare la lista della salita per la fermata di salita,
   * se un bambino non prenotato dai genitori è stato segnato come presente dall'accompagnatore, che
   * lo prenota in automatico per quella fermata
   *
   * @param fermataSalitaDiscesaID :string
   * @param bambino :BambinoPresenze
   * @param direzione :string
   * @param message :any
   */
  updateCorsa(fermataSalitaDiscesaID: string, bambino: BambinoPresenze, direzione: string, message: any) {
    //  fermataDiscesaID,
    let fermate: Array<Fermata> = null;

    if (direzione === '0') {
      fermate = this.corsa.fermateAndata;
      // window.alert('Eliminazione bambino non prenotato da Lista Andata');
      this.corsa.bambiniNonPrenotatiAndata = this.corsa.bambiniNonPrenotatiAndata
        .filter((nonPrenotato: BambinoNonPrenotatoPresenze) => {
          return nonPrenotato.nome !== bambino.nome;
        });
    } else {
      fermate = this.corsa.fermateRitorno;
      // window.alert('Eliminazione bambino non prenotato da Lista Ritorno');
      this.corsa.bambiniNonPrenotatiRitorno = this.corsa.bambiniNonPrenotatiRitorno
        .filter((nonPrenotato: BambinoNonPrenotatoPresenze) => {
          return nonPrenotato.nome !== bambino.nome;
        });
    }

    fermate = fermate.map((fermata: Fermata) => {
      if (fermata.fermataID === fermataSalitaDiscesaID) {
        if (direzione === '0') {
          fermata.salita.push(bambino);
        } else {
          fermata.discesa.push(bambino);
        }
      }
      return fermata;
    });

  }

  /* =========================================================================================== */
  /** Invocato al click dell'utente sul bottone 'Partiti' o sul bottone 'Arrivati', apre un dialog
   * per la conferma dell'operazione (o per l'annullamento), che porterà all'invio della relativa
   * comunicazione ai genitori dei bambini presenti alla corsa
   *
   * @param direzione: DIRECTION_
   */
  openDialogPartitiOrArrivati(direzione: DIRECTION_) {

    const msg = `[AttendanceComponent] openDialogPartitiOrArrivati()`;

    const dialogRef = this.dialog.open(DialogPresenzePartitiArrivatiComponent, {
      panelClass: 'dialog',
      width: '300px',
      data: {
        dir: parseInt(direzione.toString(), 10)
      },
    });

    const msgAfterClosed = `${msg} afterClosed()`;
    dialogRef.afterClosed().subscribe(result => {

      // se ho chiuso il dialog o cliccato su 'annulla'
      if (result === undefined) {
        // tslint:disable-next-line:no-console
        console.debug(`${msgAfterClosed}: closed dialog: se ho chiuso il dialog o cliccato su 'annulla'`);
        return;
      }
      // se ho cliccato su 'conferma'
      // tslint:disable-next-line:no-console
      console.debug(`${msgAfterClosed}: closed dialog: se ho chiuso il dialog con confermato!`);

      let snackBarText = '';
      const msgSetArrivatiOrPartiti = `${msg} setArrivatiOrPartiti()`;
      if (this.arrivatiOrPartitiSub != null) {
        this.arrivatiOrPartitiSub.unsubscribe();
      }
      this.arrivatiOrPartitiSub = this.presenzeService.setArrivatiOrPartiti(
        this.selectedLinea, this.date, direzione.toString()).subscribe({
        next: (value: any) => {
          // tslint:disable-next-line:no-console
          console.debug(`${msgSetArrivatiOrPartiti}: next: ${JSON.stringify(value)}`);
          if (direzione === this.DIRECTION.FORWARD) {
            this.corsa.setCompletataAndata(true);
          } else {
            // this.showPartiti = false;
            // this.corsa.setCompletataRitorno(true);
            this.corsa.setPartitiRitorno(true);
          }
          snackBarText = 'Genitori avvisati correttamente';
        },
        error: err => {
          console.error(`${msgSetArrivatiOrPartiti}: error: ${JSON.stringify(err)}`);
          if (direzione === this.DIRECTION.FORWARD) {
            // this.showArrivati = false;
            this.corsa.setCompletataAndata(false);
          } else {
            // this.showPartiti = false;
            this.corsa.setPartitiRitorno(false);
          }
          snackBarText = 'Errore nell\' invio della comunicazione ai genitori';
        },
        complete: () => {
          // tslint:disable-next-line:no-console
          console.info(`${msgSetArrivatiOrPartiti}: complete!`);
          openSnackBar(snackBarText, this.snackBar);
        }
      });
    });
  }


  /* =========================================================================================== */
  /*                                  GUI Utilities                                              */
  /* =========================================================================================== */

  /** Metodo per controllare se si sta visualizzando una corsa avvenuta in un giorno passato */
  isPastDay(): boolean {
    if (this.noCorsa) { return false; }
    return compareDays(new Date(), this.date) === 1;
  }

  /**
   * Il metodo 'ordinaPasseggeriAlfabeticamente' consente la visualizzazione dei passeggeri che
   * salgono o scendono ad una data fermata in ordine alfabetico.
   *
   * Di preciso, il metodo effettua la concatenazione tra le due liste di utenti
   * prenotati e non prenotati, successivamente alla concatenazione parte l'operazione
   * di ordinamento alfabetico utilizzando come chiave di ordinamento il nome del passeggero, ossia il bambino.
   * @param prenotati : Array<any>
   * @param nonPrenotati : Array<any>
   */
  ordinaPasseggeriAlfabeticamente(prenotati: Array<any>, nonPrenotati: Array<any>) { // descrFermata: string,

    if (nonPrenotati != null) {
      prenotati = prenotati.concat(nonPrenotati);
    }

    return prenotati.sort((a: any, b: any): number => {
      // vec.sort(function (a: any, b: any): number {
      const bambinoA: string = a.nome.toLowerCase();
      const bambinoB: string = b.nome.toLowerCase();
      return bambinoA.localeCompare(bambinoB);
    });
  }

  /* =========================================================================================== */
  /**
   * Il metodo `getClass` e' un metodo invocato per selezionare lo stile css
   * con cui rappresentare visivamente lo stato corrente di un bambino
   * per quella corsa.
   * @param passeggero :any
   * @param prenotato :boolean
   */
  getClass(passeggero: any, prenotato: boolean) {
    let statoBambinoStyle: STATO_BAMBINO_STYLE = null;

    if (passeggero.prenotatoDaGenitore === undefined) {
      statoBambinoStyle = STATO_BAMBINO_STYLE.NON_PRENOTATO_NON_PRESO;
    } else {
      // Tratta passeggero da `BambinoPresenze`:
      // tslint:disable-next-line:variable-name
      const passeggero_: BambinoPresenze = passeggero;
      if (passeggero_.prenotatoDaGenitore === true) {
        if (passeggero_.presente === true) {
          statoBambinoStyle = STATO_BAMBINO_STYLE.PRENOTATO_GENITORE_PRESO;
        } else {
          statoBambinoStyle = STATO_BAMBINO_STYLE.PRENOTATO_GENITORE;
        }
      } else {
        if (passeggero_.presente === true) {
          statoBambinoStyle = STATO_BAMBINO_STYLE.PRENOTATO_ACCOMPAGNATORE_PRESO;
        } else {
          statoBambinoStyle = STATO_BAMBINO_STYLE.PRENOTATO_ACCOMPAGNATORE;
        }
      }
    }

    switch (statoBambinoStyle) {
      case STATO_BAMBINO_STYLE.NON_PRENOTATO_NON_PRESO:
        this.stato = 'Non prenotato';
        return 'bambino non-prenotato';

      case STATO_BAMBINO_STYLE.PRENOTATO_GENITORE:
        this.stato = 'Prenotato dal genitore';
        return 'bambino prenotato-genitore';

      case STATO_BAMBINO_STYLE.PRENOTATO_GENITORE_PRESO:
        this.stato = 'Prenotato dal genitore e preso in carico';
        return 'bambino prenotato-genitore-preso';

      case STATO_BAMBINO_STYLE.PRENOTATO_ACCOMPAGNATORE:
        this.stato = 'Prenotato da un accompagnatore';
        return 'bambino prenotato-accompagnatore';

      case STATO_BAMBINO_STYLE.PRENOTATO_ACCOMPAGNATORE_PRESO:
        this.stato = 'Prenotato da un accompagnatore e preso in carico';
        return 'bambino prenotato-accompagnatore-preso';
    }
  }

  /* =========================================================================================== */
  /** Metodo per settare lo stile della card relativa alla fermata passata come parametro,
   * per permettere o no all'utente di interagire con i suoi elementi
   */
  getCardFermataStyle(fermata: Fermata): string {
    if (fermata.inTurno && !this.isPastDay()) {
      return 'card-active';
    } else {
      return 'card-inactive';
    }
  }

  /* =========================================================================================== */

  /**
   * Il metodo 'log' viene impiegato per rendere piu' semplice la registrazione
   * delle azioni svolte dal componente 'attendace.component' con fini di debug.
   * @param msg string
   */
  log(msg: string): void {}

  /* =========================================================================================== */
  /**
   * Il metodo `ngOnDestroy` permette di liberare le risorse che il componente attendance.component ha ottenuto
   * facendone richiesta, in particolare le risorse verranno liberate solo nella condizione in cui effettivamente
   * il component in questione e' arrivato a richiederle.
   */
  ngOnDestroy() {
    // console.log('destroy attendance component');
    if (this.subUpdateState != null) {
      this.subUpdateState.unsubscribe();
      if (this.observableLines != null) {
        this.observableLines.unsubscribe();
      }
    }
    if (this.subUpdateState2 != null) {
      this.subUpdateState2.unsubscribe();
    }
    if (this.arrivatiOrPartitiSub != null) {
      this.arrivatiOrPartitiSub.unsubscribe();
    }

    if (this.realtimeNotificationSub != null) {
      this.realtimeNotificationSub.unsubscribe();
    }

    this.websocketPresenzeService.disconnectWebSocket();
  }

  /* =========================================================================================== */
  /*                                  MatTooltip Utilities                                       */
  /* =========================================================================================== */

  /** Metodo per settare il tooltip delle diverse fermate della corsa */
  cardTooltip(fermata: Fermata, direzione: number): string {
    if (this.isPastDay() || (direzione === 0 && this.corsa.getCompletataAndata())) {
      return 'Corsa terminata';
    }
    if (!fermata.inTurno) {
      return 'Non hai un turno in questa fermata';
    }
  }

  /** Tooltip per il bottone 'Partiti' */
  public getMessagePartiti(): string {
    if (this.corsa.getPartitiRitorno() === true) {
      return 'La corsa di ritorno è già partita';
    } else {
      return 'Avvisa i genitori che siete partiti da scuola';
    }
  }

  /** Tooltip per il bottone 'Arrivati' */
  public getMessageArrivati(): string {
    if (!this.corsa.getCompletataAndata()) {
      if (this.corsa.atLeastOneBambinoSalito()) {
        return 'Avvisa i genitori che siete arrivati a scuola';
      } else {
        return 'Non è ancora stato preso in carico nessun bambino';
      }
    } else {
      return 'La corsa di andata si è già completata';
    }
  }

  /* =========================================================================================== */

  /** Invocato al click sul bottone 'Esporta', apre un dialog in cui è possibile scegliere
   * il formato con cui esportare le presenze della corsa visualizzata
   */
  openDialogEsporta() {
    const dialogRef = this.dialog.open(DialogEsportaPresenzeComponent, {
      panelClass: 'dialog',
      width: '300px',
      data: {
        corsa: this.corsa
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // se ho chiuso il dialog o cliccato su 'annulla'
      if (result === undefined) { return; }
    });
  }

}
