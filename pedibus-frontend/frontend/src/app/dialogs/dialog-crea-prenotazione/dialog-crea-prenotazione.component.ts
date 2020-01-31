/* ============================================================================================= */
/*                                       ANGULAR IMPORTS                                         */
/* ============================================================================================= */
import {Component, OnInit, Inject, OnDestroy} from '@angular/core'; // , Output, EventEmitter
import {MatDatepickerInputEvent, MatSnackBar, MatTabChangeEvent} from '@angular/material';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog'; // MatDialog
import { Subscription } from 'rxjs';

/* ============================================================================================= */
/*                                       OUR PROJETC IMPORTS                                     */
/* ============================================================================================= */
// - Services:
import { CorseService } from '../../services/corse-service/corse.service';
import { PrenotazioniService } from '../../services/prenotazioni-service/prenotazioni.service';

// - Domain objects:
import { Prenotazione } from '../../domain/prenotazioni-domain/prenotazione';

// - Utils:
import {compareDays, openSnackBar, Util} from '../../config/util';
import {configDatePicker} from '../../config/config';
import {Fermata} from '../../domain/prenotazioni-domain/fermata';
import {Moment} from 'moment';


/* ============================================================================================= */
@Component({
  selector: 'app-dialog-crea-prenotazione',
  templateUrl: './dialog-crea-prenotazione.component.html',
  styleUrls: ['./dialog-crea-prenotazione.component.css']
})
export class DialogCreaPrenotazioneComponent implements OnInit, OnDestroy {

  // - Here, `DialogCreaPrenotazioneComponent` public attributes:
  public nomeLinea: string;
  public listaLinee: Array<string>;
  public subLinee: Subscription = null;
  public flagLinee = false;

  public flagFermateAndata = true;
  public listaFermateAndata: Array<Fermata>;
  public subFermateAndata: Subscription = null;

  public subPrenotazioneAndata: Subscription = null;
  public subPrenotazioneRitorno: Subscription = null;
  public subUpdatePrenotazione: Subscription = null;

  public flagFermateRitorno = true;
  public listaFermateRitorno: Array<Fermata>;
  public subFermateRitorno: Subscription = null;

  public salitaDiscesa = true;

  // - Here, private variables for date-picker
  public minDate = configDatePicker.minDate;
  public maxDate = configDatePicker.maxDate;
  public startDate = new Date();

  public disabledSelectorAndata = true;
  public disabledSelectorRitorno = true;

  public disabledSalvaPrenotazioneAndata = true;
  public disabledSalvaPrenotazioneRitorno = true;
  // public disabledSalvaPrenotazione = true;

  public flagCreaPrenotazione = false;

  // - Here, `DialogCreaPrenotazioneComponent` private attributes:
  private allowLog = true;

  private flagDirezione = true;

  private dateSelectedA = false;
  private dateSelectedR = false;
  private fermataSelectedA = false;
  private fermataSelectedR = false;
  private dateA: Date = null;
  private dateR: Date = null;

  private scuolaAndata: Fermata;
  private scuolaRitorno: Fermata;

  private tabSelected: any = 0;

  private preAndata: Prenotazione = new Prenotazione();
  private preRitorno: Prenotazione = new Prenotazione();

  dataInizio: Date = null;
  dataFine: Date = null;

  /**
   * Filtro per settare le date al di fuori della settimana e quelle già
   * con una prenotazione come non selezionabili
   */
  dateFilter: (date: Moment | null) => boolean = (date: Moment | null) => {
    // console.log(date);
    const data: Date = date.toDate();
    // console.log(data);
    let nonPrenotata = true;
    if (this.tabSelected === 0) {
      if (this.dialogData.dateA.length !== 0) {
        this.dialogData.dateA.forEach((d: Date) => {
          if (compareDays(d, data) === 0) {
              nonPrenotata = false;
            }
        });
      }
    } else {
      if (this.dialogData.dateR.length !== 0) {
        this.dialogData.dateR.forEach((d: Date) => {
          if (compareDays(d, data) === 0) {
            nonPrenotata = false;
          }
        });
      }
    }

    /*let nellaSettimana = false;
    if (compareDays(date, this.data.dataInizio) >= 0 && compareDays(date, this.data.dataFine) <= 0) {
      nellaSettimana = true;
    }*/
    const day = data.getDay();
    return day !== 0 && day !== 6 && nonPrenotata; // && nellaSettimana
    // 0 means sunday
    // 6 means saturday
  }

  /* ============================================================================================= */
  constructor(
    public dialogRef: MatDialogRef<DialogCreaPrenotazioneComponent>,
    private corseService: CorseService,
    private prenotazioniService: PrenotazioniService,
    private snackbar: MatSnackBar,
    // private snackBarService: NotificationSnackBarService,
    @Inject(MAT_DIALOG_DATA) public dialogData: any) {
    const msg = `[DialogCreaPrenotazioneComponent] constructor()`;
    Util.customLog(this.allowLog, Util.LogType.INFO, msg, `running.`);
  }

  /* ============================================================================================= */
  ngOnInit(): void {
    const msg = `[DialogCreaPrenotazioneComponent] ngOnInit()`;
    Util.customLog(this.allowLog, Util.LogType.INFO, msg, `running.`);

    // console.log(`${msg} dialog data: ${JSON.stringify(this.data)}`);
    Util.customLog(this.allowLog, Util.LogType.INFO, `${msg} dialog data: ${JSON.stringify(this.dialogData)}`);

    if (this.dialogData.flagCreaPrenotazione === true) {
      // crea nuova prenotazione
      this.flagCreaPrenotazione = true;
      this.dataInizio = this.dialogData.dataInizio;
      this.dataFine = this.dialogData.dataFine;
    } else {
      // modifica prenotazione esistente
      this.flagCreaPrenotazione = false;
      /*console.log(this.data.prenotazioneAndata);
      console.log(this.data.prenotazioneRitorno);*/
      if (this.dialogData.prenotazioneAndata !== 'empty-prenotazione') {
        this.preAndata = Prenotazione.creaPrenotazioneFrom(this.dialogData.prenotazioneAndata);
      }
      if (this.dialogData.prenotazioneRitorno !== 'empty-prenotazione') {
        this.preRitorno = Prenotazione.creaPrenotazioneFrom(this.dialogData.prenotazioneRitorno);
      }
      this.flagDirezione = this.dialogData.direzione;
    }

    // - Subscribe to get `linee` from server
    this.subLinee = this.corseService.getLinee().subscribe({
      next: (data) => {
        Util.customLog(this.allowLog, Util.LogType.INFO, `${msg} next: ${JSON.stringify(this.dialogData)}`);
        this.listaLinee = data;
        this.flagLinee = true;
      },
      error: (err) => {
        // console.log(err);
        Util.customLog(this.allowLog, Util.LogType.INFO, `${msg} err: ${JSON.stringify(err)}`);
      },
      complete: () => {
        // console.log(`${msg} getLinee : complete!`);
        Util.customLog(this.allowLog, Util.LogType.INFO, `${msg} complete`);
      }
    });
  }

  /* ============================================================================================= */
  /** Invocato alla selezione di una data dal datepicker, data per la prenotazione
   */
  onDateSelect(type: string, event: MatDatepickerInputEvent<Date>) {

    if (this.tabSelected === 0) {
      this.dateSelectedA = true;
      this.dateA = new Date(event.value);
      if (this.fermataSelectedA) {
        this.disabledSalvaPrenotazioneAndata = false;
      }
    } else {
      this.dateSelectedR = true;
      this.dateR = new Date(event.value);
      if (this.fermataSelectedR) {
        this.disabledSalvaPrenotazioneRitorno = false;
      }
    }
  }

  /* ============================================================================================= */
  /** Selezione della linea su cui prenotarsi
   */
  onSelectLinea(nomeLinea: string) {
    const msg = '[DialogCreaPrenotazioneComponent] onSelectLinea()';
    Util.customLog(this.allowLog, Util.LogType.INFO, msg, `running.`);

    this.nomeLinea = nomeLinea;
    console.log(this.nomeLinea);
    let direzione: boolean = this.tabSelected === 0;

    if (this.flagDirezione === false) {
      this.tabSelected = 1;
      direzione = this.flagDirezione;
    }

    console.log('DIREZIONE:', this.tabSelected, this.flagDirezione);
    if ((this.flagCreaPrenotazione &&  this.tabSelected === 0) ||
        (!this.flagCreaPrenotazione && this.flagDirezione)) {
      // Andata
      this.subFermateAndata = this.prenotazioniService.getFermateByLineaAndDirezione(nomeLinea, direzione)
        .subscribe({
          next: (data) => {
            console.log(data);
            this.listaFermateAndata = data.fermate;
            this.scuolaAndata = data.scuola;
            Util.customLog(this.allowLog, Util.LogType.INFO, msg, `next: data obtained for Andata.`);

            this.flagFermateAndata = true;
            this.disabledSelectorAndata = false;
            this.disabledSelectorRitorno = true;
          },
          error: (err) => {
            Util.customLog(this.allowLog, Util.LogType.INFO, msg, `error: ${err}.`);
          },
          complete: () => {
            Util.customLog(this.allowLog, Util.LogType.INFO, msg, `complete`);
          }
        });
    } else {
      // Ritorno
      this.subFermateRitorno = this.prenotazioniService
        .getFermateByLineaAndDirezione(nomeLinea, direzione).subscribe({
          next: (data) => {
            this.listaFermateRitorno = data.fermate;
            this.scuolaRitorno = data.scuola;
            Util.customLog(this.allowLog, Util.LogType.INFO, msg,
              `getFermateByLineaAndDirezione() next: data obtained for Ritorno.`);

            this.flagFermateRitorno = true;
            this.disabledSelectorAndata = true;
            this.disabledSelectorRitorno = false;
          },
          error: () => {
            Util.customLog(this.allowLog, Util.LogType.INFO, msg,
              `getFermateByLineaAndDirezione() error Ritorno.`);
          },
          complete: () => {
            Util.customLog(this.allowLog, Util.LogType.INFO, msg,
              `getFermateByLineaAndDirezione() complete Ritorno.`);
          }
        }
      );
    }

  }

  /* ============================================================================================= */
  /**
   * Selezione della fermata di salita, per la creazione o modifica di prenotazioni all'andata
   * @param fermata :Fermata
   * @param salitaDiscesa :string
   */
  onSelectFermataAndata(fermata: Fermata, salitaDiscesa: boolean) {
    const msg = '[DialogCreaPrenotazioneComponent] onSelectFermataAndata()';
    Util.customLog(this.allowLog, Util.LogType.INFO, msg, `running.`);

    this.fermataSelectedA = true;
    if (!this.flagCreaPrenotazione || this.dateSelectedA) {
      this.disabledSalvaPrenotazioneAndata = false;
    }

    this.preAndata.fermataSalita = Fermata.creaFermataFrom(fermata);
    this.preAndata.fermataDiscesa = Fermata.creaFermataFrom(this.scuolaAndata);

    this.preAndata.nomeLinea = this.nomeLinea;
  }

  /* ============================================================================================= */
  /**
   *
   * @param fermata Fermata
   * @param salitaDiscesa string
   */
  onSelectFermataRitorno(fermata: Fermata, salitaDiscesa: boolean) {
    const msg = '[DialogCreaPrenotazioneComponent] onSelectFermataRitorno()';
    Util.customLog(this.allowLog, Util.LogType.INFO, msg, `running.`);

    this.fermataSelectedR = true;
    if (!this.flagCreaPrenotazione || this.dateSelectedR) {
      this.disabledSalvaPrenotazioneRitorno = false;
    }

    this.preRitorno.fermataSalita = Fermata.creaFermataFrom(this.scuolaRitorno);
    this.preRitorno.fermataDiscesa = Fermata.creaFermataFrom(fermata);
    this.preRitorno.nomeLinea = this.nomeLinea;
  }

  /* ============================================================================================= */
  /**
   * Metodo invocato ogni volta che si cambia la tab, da andata (tab 0) a ritorno (tab 1)
   * @param tabChangeEvent MatTabChangeEvent
   */
  tabChanged(tabChangeEvent: MatTabChangeEvent): void {
    const msg = '[DialogCreaPrenotazioneComponent] tabChanged()';
    Util.customLog(this.allowLog, Util.LogType.INFO, msg, `running.`);

    this.tabSelected = tabChangeEvent.index;
    if (this.nomeLinea != null) {
      this.onSelectLinea(this.nomeLinea);
    }
  }

  /* ============================================================================================= */
  /**
   * Metodo che effettua la subscribe al metodo del servizio che si occupa di mandare al server la
   * nuova prenotazione: in caso di esito positivo il dialog manda la prenotazione e il nuovo id
   * a questa associato al component 'Prenotazione' e si chiude, altrimenti visualizza solo uno
   * snackbar che indica l'errore avvenuto
   */
  private sendNewPrenotazione() {
    const msg = '[DialogCreaPrenotazioneComponent] sendNewPrenotazione()';

    // Andata
    if (this.tabSelected === 0) {

      /*console.log('VISUALIZZO I METADATI DA CUI ESTRAPOLO LE INFORMAZIONI');
      console.log(this.dialogData);
      console.log('VISUALIZZO LA PRENOT ANDATA');
      console.log(this.preAndata);*/

      // this.preAndata.userId = this.data.userId;
      this.preAndata.nomeBambino = this.dialogData.nomeBambino;
      this.preAndata.direzione = this.tabSelected;
      this.preAndata.data = this.dateA;
      // this.preAndata.userId = this.data.userId;

      if (this.subPrenotazioneAndata != null) {
        this.subPrenotazioneAndata.unsubscribe();
      }
      this.subPrenotazioneAndata = this.prenotazioniService.sendPrenotazione(this.preAndata)
        .subscribe({
          next: (data) => {
            /*console.log('[DEBUG] NEXT risposta nuova prenotazione');
            console.log('Nuova prenotazione in data', this.preAndata.data);*/

            const result = {
              prenId: data.prenotazione.id,
              prenotazione: this.preAndata
            };

            console.log(result);
            this.dialogRef.close(result);
          },
          error: (err) => {
            console.log('[DEBUG] ERROR risposta nuova prenotazione');
            Util.customLog(this.allowLog, Util.LogType.INFO, msg,
              `sendPrenotazione() error: Andata - ${JSON.stringify(err)}.`);
            // this.openSnackBar('Errore nell\'aggiunta della nuova prenotazione');
            if (err.error.errore === 'Impossibile completare la richiesta perchè ' +
                                     'l\'evento avverrà tra meno di cinque minuti.') {
              openSnackBar('La corsa è già stata effettuata', this.snackbar);
            } else if (err.error.errore === 'Prenotazione riferita ad una corsa non valida') {
              openSnackBar('Nella data e direzione selezionate non sono previste corse', this.snackbar);
            } else {
              openSnackBar(err.error.errore, this.snackbar);
            }
          },
          complete: () => {
            console.log('[DEBUG] COMPLETE risposta nuova prenotazione');
            Util.customLog(this.allowLog, Util.LogType.INFO, msg, `sendPrenotazione() complete: Andata.`);
          }
        }
      );
    } else {
      // this.modifiedRitorno = true;
      // this.preRitorno.userId = this.data.userId;
      this.preRitorno.nomeBambino = this.dialogData.nomeBambino;
      this.preRitorno.direzione = this.tabSelected;
      this.preRitorno.data = this.dateR;
      // this.preRitorno.userId = this.data.userId;

      if (this.subPrenotazioneRitorno != null) {
        this.subPrenotazioneRitorno.unsubscribe();
      }

      this.subPrenotazioneRitorno = this.prenotazioniService.sendPrenotazione(this.preRitorno)
        .subscribe({
          next: (data) => {
            /*console.log('[DEBUG] NEXT risposta nuova prenotazione');
            console.log('Nuova prenotazione in data', this.preRitorno.data);*/

            const result = {
              prenId: data.prenotazione.id,
              prenotazione: this.preRitorno
            };

            console.log(result);
            this.dialogRef.close(result);
          },
          error: (err) => {
            Util.customLog(this.allowLog, Util.LogType.INFO, msg,
              `sendPrenotazione() error: Ritorno - ${JSON.stringify(err)}.`);
            if (err.error.errore === 'Impossibile completare la richiesta perchè ' +
              'l\'evento avverrà tra meno di cinque minuti.') {
              openSnackBar('La corsa è già stata effettuata', this.snackbar);
            } else if (err.error.errore === 'Prenotazione riferita ad una corsa non valida') {
              openSnackBar('Nella data e direzione selezionate non sono previste corse', this.snackbar);
            } else {
              openSnackBar(err.error.errore, this.snackbar);
            }
          },
          complete: () => { Util.customLog(this.allowLog, Util.LogType.INFO, msg,
            `sendPrenotazione() complete: Ritorno.`);
          }
        });
    }
  }

  /**
   * Metodo che effettua la subscribe al metodo del servizio che si occupa di mandare al server una
   * prenotazione modificata: in caso di esito positivo il dialog manda la prenotazione modificata
   * al component 'Prenotazione' e si chiude, altrimenti visualizza solo uno
   * snackbar che indica l'errore avvenuto
   */
  private updatePrenotazione() {
    let prenotazione = new Prenotazione();

    if (this.flagDirezione) {
      prenotazione = Prenotazione.creaPrenotazioneFrom(this.preAndata);
    } else {
      prenotazione = Prenotazione.creaPrenotazioneFrom(this.preRitorno);
    }

    if (this.subUpdatePrenotazione != null) {
      this.subUpdatePrenotazione.unsubscribe();
    }
    this.subUpdatePrenotazione = this.prenotazioniService.updatePrenotazione(prenotazione).subscribe({
      next: () => {
        this.dialogRef.close(prenotazione);
      },
      error: () => {
        openSnackBar('Errore nella modifica della prenotazione', this.snackbar);
      },
      complete: () => { }
    });
  }

  /**
   * Metodo invocato al click sul bottone 'Salva prenotazione...', esegue uno dei due metodi
   * 'sendNewPrenotazione' e 'updatePrenotazione', il primo in caso di nuova prenotazione,
   * il secondo in caso di modifica di una prenotazione già esistente
   * @param direzione boolean
   */
  onClickSalva(direzione: boolean) {
    const msg = '[DialogCreaPrenotazioneComponent] onClickSalva()';
    Util.customLog(this.allowLog, Util.LogType.INFO, msg, `running.`);

    if (this.flagCreaPrenotazione === true) {
      this.sendNewPrenotazione();
    } else {
      this.updatePrenotazione();
    }

  }

  /* ============================================================================================= */
  ngOnDestroy() {
    if (this.subLinee != null) {
      this.subLinee.unsubscribe();
    }
    if (this.subFermateAndata != null) {
      this.subFermateAndata.unsubscribe();
    }
    if (this.subFermateRitorno != null) {
      this.subFermateRitorno.unsubscribe();
    }
  }

}
