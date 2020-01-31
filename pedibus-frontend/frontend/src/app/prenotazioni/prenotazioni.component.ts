/* ============================================================================================= */
/*                                       ANGULAR IMPORTS                                         */
/* ============================================================================================= */

import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild,
  ViewEncapsulation} from '@angular/core';
import {MatDialog, MatPaginator, MatSnackBar} from '@angular/material';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import {Subscription} from 'rxjs/Subscription';
/* ============================================================================================= */
/*                                       OUR PROJECT IMPORTS                                     */
/* ============================================================================================= */
// Services:
import {AuthService} from '../services/auth/auth.service';
import {CorseService} from '../services/corse-service/corse.service';
import {PrenotazioniService} from '../services/prenotazioni-service/prenotazioni.service';
// - Domain objects:
// import {Corsa} from '../domain/corsa';
// - Components:
import {DialogCreaPrenotazioneComponent} from '../dialogs/dialog-crea-prenotazione/dialog-crea-prenotazione.component';
// Utils:
import {Prenotazione} from '../domain/prenotazioni-domain/prenotazione';
// import {Fermata} from '../domain/prenotazioni-domain/fermata';
import {configDatePicker} from '../config/config';
import {compareDays, openSnackBar} from '../config/util';
// import {Router} from '@angular/router';

/* ============================================================================================= */
/*                                   PrenotazioniComponent                                       */
/* ============================================================================================= */
@Component({
  selector: 'app-prenotazioni',
  templateUrl: './prenotazioni.component.html',
  styleUrls: ['./prenotazioni.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class PrenotazioniComponent implements OnInit, AfterViewInit, OnDestroy {

  // @ViewChild(MatPaginator) paginator: MatPaginator;

  // - Here, `PrenotazioniComponent` public attributes:
  // public corse: Corsa[];
  public linee: number[];

  minDate: Date = configDatePicker.minDate;
  maxDate: Date = configDatePicker.maxDate;
  selectedDate: Date = null;

  dataInizio: Date = null;
  dataFine: Date = null;

  selectedBambino: string = null;

  public flagRawData = false;
  public flagLinee = false;
  public flagDefaultMessage = true;

  listaPrenotazioni: Array<any> = new Array<any>();
  listaPrenotazioniA: Array<any> = new Array<any>();
  listaPrenotazioniR: Array<any> = new Array<any>();

  thisDirectionPrenList: Array<any> = new Array<any>();
  otherDirectionPrenList: Array<any> = new Array<any>();

  flagDirectionIsEmpty = false;

  noBambini = false;
  noPrenotazioni = false;

  listaBambini: Array<string> = new Array<string>();

  public subDataBambini: Subscription = null;
  // public subCorse: Subscription = null;
  public subLinee: Subscription = null;
  public subPrenotazioniBambino: Subscription = null;

  // - Here, `PrenotazioniComponent` private attributes:
  private rawData: any;

  /* ============================================================================================= */
  constructor(
    private prenotazioniService: PrenotazioniService,
    private corseService: CorseService,
    private authService: AuthService,
    public dialog: MatDialog,
    private snackbar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {  }

  /* ============================================================================================= */
  /** Richiedo la lista delle linee al server */
  ngOnInit(): void {
    const msg = `[PrenotazioniComponent] ngOnInit()`;
    this.cdr.detectChanges();

    this.selectedDate = new Date();

    if (this.subLinee != null) { this.subLinee.unsubscribe(); }
    this.subLinee = this.corseService.getLinee().subscribe({
      next: (data) => {
        console.log(`${msg} getLinee(), data: ${JSON.stringify(data)}`);
        this.linee = data;
        this.flagLinee = true;
      },
      error: (err) => {
        console.log(`${msg} getLinee(), err: ${JSON.stringify(err)}`);
        // this.flagRawData = false;
      },
      complete: () => { console.log(`${msg} getLinee(), complete!`); }
    });
  }

  ngAfterViewInit() {
    this.cdr.detectChanges();
    const msg = `[PrenotazioniComponent] ngAfterViewInit()`;

    if (this.subDataBambini != null) { this.subDataBambini.unsubscribe(); }
    this.subDataBambini =
      this.prenotazioniService.getProfileAndInfoBambini().subscribe(
        {
          next: (data) => {
            console.log(`${msg} getProfileAndInfoBambini(), data: ${JSON.stringify(data)}`);

            this.rawData = data;
            this.listaBambini = data.bambini;
            if (this.listaBambini.length !== 0) {
              this.selectedBambino = this.listaBambini[0];
              this.getPrenotazioni(this.selectedBambino, this.selectedDate);
            } else {
              this.noBambini = true;
            }
            // this.flagRawData = true;
          },
          error: (err) => {
            console.log(`${msg} getProfileAndInfoBambini(), err: ${JSON.stringify(err)}`);
            // this.flagRawData = false;
          },
          complete: () => { console.log(`${msg} getProfileAndInfoBambini(), complete!`); }
        }
      );
  }

  /** Dato il bambino e la data chiede al server la lista di prenotazioni per quel bambino
   * nel giorno selezionato e nei successivi 6 giorni lavorativi (visualizza una settimana)
   */
  getPrenotazioni(selectedBambino: string, selectedDate: Date) {

    const msg = `[PrenotazioniComponent] -> getPrenotazioni:`;

    if (this.subPrenotazioniBambino != null) {
      this.subPrenotazioniBambino.unsubscribe();
    }
    this.subPrenotazioniBambino =
      this.prenotazioniService.getPrenotazioniByBambino(selectedBambino, selectedDate)
        .subscribe({
          next: (data) => {
            console.log('GGG');
            console.log(`${msg} data: ${JSON.stringify(data)}`);

            this.flagDefaultMessage = false;

            this.listaPrenotazioniA = new Array<any>();
            this.listaPrenotazioniR = new Array<any>();
            this.listaPrenotazioni = new Array<any>();

            this.listaPrenotazioniA = data.andata;
            this.listaPrenotazioniR = data.ritorno;
            this.dataInizio = data.dataInizio;
            this.dataFine = data.dataFine;

            for (let i = 0; i < this.listaPrenotazioniA.length; i++) {

              if (this.listaPrenotazioniA[i] === 'empty-prenotazione' &&
                this.listaPrenotazioniR[i] === 'empty-prenotazione') {
                this.listaPrenotazioniA.splice(i, 1);
                this.listaPrenotazioniR.splice(i, 1);
                i--;
              } else {
                this.listaPrenotazioni.push({
                  andata: this.listaPrenotazioniA[i],
                  ritorno: this.listaPrenotazioniR[i],
                });
              }
            }
            console.log('LISTA DELLE PRENOTAZIONI:', this.listaPrenotazioni);
            console.log('ANDATA:', this.listaPrenotazioniA);
            console.log('RITORNO:', this.listaPrenotazioniR);
            this.noPrenotazioni = this.listaPrenotazioni.length === 0;
            this.flagRawData = true;
          },
          error: (err) => {
            console.log(`${msg} err: ${JSON.stringify(err)}`);
            this.flagRawData = false;
          },
          complete: () => {
            console.log(`${msg} complete!`);
          }
        });
  }

  /* ============================================================================================= */
  /** Selezione della data */
  onSelectDate(event: MatDatepickerInputEvent<Date>) {
    this.selectedDate = new Date(event.value);
    this.getPrenotazioni(this.selectedBambino, this.selectedDate);
  }

  /**
   * Selezione del bambino
   */
  onSelectBambino(nomeBambino: string) {
    this.cdr.detectChanges();
    this.selectedBambino = nomeBambino;
    this.getPrenotazioni(this.selectedBambino, this.selectedDate);
  }

  /* ============================================================================================= */
  /**
   * Crea il dialog per la creazione o la modifica di una prenotazione.
   * Alla chiusura del dialog (quindi esito positivo dal server all'invio della prenotazione nuova o modificata)
   * la lista delle prenotazioni viene aggiornata di conseguenza
   *
   * @param index number: in caso di modifica indica la prenotazione da modificare fra quelle visualizzate
   * @param flagDirezione boolean: in caso di modifica indica la direzione della prenotazione (andata o ritorno)
   */
  openDialogCreaPrenotazione(index: number = null, flagDirezione: boolean = null) {
    const msg = `[PrenotazioniComponent] openDialogCreaPrenotazione()`;
    console.log(`${msg} running...`);

    // - Object to provide to the opening dialog for either creating or modifing a `Prenotazione`
    let data = null;

    if (index == null) {
      // Sto creando una nuova prenotazione

      const datePrenotateA: Array<Date> = new Array<Date>();
      const datePrenotateR: Array<Date> = new Array<Date>();
      this.listaPrenotazioniA.forEach(p => {
        if (p !== 'empty-prenotazione') {
          datePrenotateA.push(p.data);
        }
      });
      this.listaPrenotazioniR.forEach(p => {
        if (p !== 'empty-prenotazione') {
          datePrenotateR.push(p.data);
        }
      });

      data = {
        flagCreaPrenotazione: true,
        nomeBambino: this.selectedBambino,
        dateA: datePrenotateA,
        dateR: datePrenotateR,
        dataInizio: this.dataInizio,
        dataFine: this.dataFine
      };
    } else {
      // Sto modificando una prenotazione già esistente
      data = {
        flagCreaPrenotazione: false,
        nomeBambino: this.selectedBambino,
        prenotazioneAndata: this.listaPrenotazioniA[index],
        prenotazioneRitorno: this.listaPrenotazioniR[index],
        direzione: flagDirezione
      };
    }

    const dialogRef = this.dialog.open(DialogCreaPrenotazioneComponent, {
      panelClass: 'dialog',
      width: '380px',
      data
    });
    dialogRef.afterClosed().subscribe({
      next: (result) => {
        console.log('Alla chiusura del dialog:', this.listaPrenotazioni);

        // this.prenotazioniService.triggerOnNoClick();
        console.log(msg, 'afterClosed(): next', result);

        if (index == null) { // Creo una nuova prenotazione
          if (result === undefined || result.prenId === undefined) {
            console.log(`afterClosed(): no modifying / creating anything!`);
            return;
          } else {
            const nuovaPren = Prenotazione.creaPrenotazioneFrom(result.prenotazione);
            nuovaPren.id = result.prenId;
            this.insertNewPrenotazioneMethod(nuovaPren);
            openSnackBar('Prenotazione aggiunta correttamente', this.snackbar);
          }
        } else {
          // Modifico o cancello una prenotazione già esistente
          if (result === undefined)  {
            console.log(`afterClosed(): no modifying / creating anything!`);
            return;
          }

          if (flagDirezione) {
            // Andata
            this.listaPrenotazioniA[index] = Prenotazione.creaPrenotazioneFrom(result);
          } else {
            // Ritorno
            this.listaPrenotazioniR[index] = Prenotazione.creaPrenotazioneFrom(result);
          }
          this.listaPrenotazioni = new Array<any>();
          for (let i = 0; i < this.listaPrenotazioniA.length; i++) {
            this.listaPrenotazioni.push({
              andata: this.listaPrenotazioniA[i],
              ritorno: this.listaPrenotazioniR[i],
            });
          }
          openSnackBar('Prenotazione modificata correttamente', this.snackbar);
        }
        console.log('Prenotazioni alla chiusura del dialog:', this.listaPrenotazioni);
        /*if (this.listaPrenotazioni.length !== 0) {
          this.noPrenotazioni = false;
        }*/
      },
      error: (err) => { console.log(msg, 'afterClosed(): error', err); },
      complete: () => { console.log(msg, 'afterClosed(): complete'); }
    });
  }

  /** Metodo chiamato alla chiusura del dialog (quando la nuova prenotazione è stata correttamente
   * aggiunta dal server) per aggiornare la lista delle prenotazioni visualizzate
   */
  insertNewPrenotazioneMethod(prenotazione: Prenotazione) {

    let indexVariable = -1;
    this.flagDirectionIsEmpty = false;
    this.getListaPrenByDirection(prenotazione.direzione);

    // Se son riuscito a inserirla e la data compare già nel ritorno,
    // allora l'andata è sicuramente 'empty-prenotazione'
    for ( let i = 0; (i < this.otherDirectionPrenList.length) && !this.flagDirectionIsEmpty; i++ ) {
      if (this.otherDirectionPrenList[i] !== 'empty-prenotazione' &&
        compareDays(this.otherDirectionPrenList[i].data, prenotazione.data) === 0) {
        // c'è già una prenotazione al ritorno in quella data
        console.log('c\'è già una prenotazione al ritorno in quella data');
        this.flagDirectionIsEmpty = true;
        this.thisDirectionPrenList[i] = Prenotazione.creaPrenotazioneFrom(prenotazione);
      }
    }

    if (this.flagDirectionIsEmpty === false) {
      // non c'è ancora una prenotazione al ritorno in quella data
      let localFlag = false;

      for (let i = 0; i < this.thisDirectionPrenList.length && !localFlag; i++) {
        indexVariable = i;
        console.log('INDEX VARIABLE DENTRO FOR:', indexVariable);

        if (this.thisDirectionPrenList[i] !== 'empty-prenotazione') {
          console.log('DATE:', prenotazione.data, this.thisDirectionPrenList[i].data);
          if (compareDays(prenotazione.data, this.thisDirectionPrenList[i].data) === -1) {
            console.log('i:', i);
            localFlag = true;
          }
        } else {
          // L'andata è empty-prenotazione
          if (this.otherDirectionPrenList[i] !== 'empty-prenotazione') {
            console.log('DATE:', prenotazione.data, this.otherDirectionPrenList[i].data);
            if (compareDays(prenotazione.data, this.otherDirectionPrenList[i].data) === -1) {
              console.log('i:', i);
              localFlag = true;
            }
          }
        }
      }

      console.log('INDEX VARIABLE FUORI DAL FOR:', indexVariable);

      if (this.thisDirectionPrenList.length === 0) {
        // Primo elemento che inserisco nell'array
        console.log('Primo elemento che inserisco nell\'array');
        this.thisDirectionPrenList.push(prenotazione);
        this.otherDirectionPrenList.push('empty-prenotazione');

      } else {
        // L'array esiste già
        if (localFlag) {
          // Elemento da inserire in mezzo all'array
          console.log('Elemento da inserire in mezzo all\'array');
          this.thisDirectionPrenList.splice(indexVariable, 0, prenotazione);
          this.otherDirectionPrenList.splice(indexVariable, 0, 'empty-prenotazione');
        } else {
          // Elemento da aggiungere al fondo dell'array
          console.log('Elemento da aggiungere al fondo dell\'array');
          this.thisDirectionPrenList.push(prenotazione);
          this.otherDirectionPrenList.push('empty-prenotazione');
        }
        console.log('CONTROLLO VETTORE GIA\' PIENO:', this.thisDirectionPrenList);
        console.log('ALTRA DIREZIONE:', this.otherDirectionPrenList);
      }

    }

    this.listaPrenotazioni = new Array<any>();
    for (let i = 0; i < this.listaPrenotazioniA.length; i++) {
      this.listaPrenotazioni.push({
        andata: this.listaPrenotazioniA[i],
        ritorno: this.listaPrenotazioniR[i],
      });
    }
    console.log('GLOBALI:', this.listaPrenotazioni);
    if (this.listaPrenotazioni.length !== 0) {
      this.noPrenotazioni = false;
    }
  }

  /* ============================================================================================= */
  /**
   * Metodo invocato al click sul pulsante 'Elimina' della prenotazione
   *
   * @param key number: indica la prenotazione nella lista
   * @param direzione boolean : direzione della prenotazione
   */
  deletePrenotazione(key: number = null, direzione: boolean) {
    console.log('Entered inside prenotazioni.component -> deletePrenotazioni');

    this.getListaPrenByDirection(direzione);

    this.prenotazioniService.deletePrenotazione(this.thisDirectionPrenList[key].id).subscribe({
      next: () => {
        this.thisDirectionPrenList.splice(key, 1, 'empty-prenotazione');
        this.listaPrenotazioni = new Array<any>();

        for (let i = 0; i < this.thisDirectionPrenList.length; i++) {
          if (this.thisDirectionPrenList[i] === 'empty-prenotazione' &&
              this.otherDirectionPrenList[i] === 'empty-prenotazione') {
            this.thisDirectionPrenList.splice(i, 1);
            this.otherDirectionPrenList.splice(i, 1);
            i--;
          } else {
            this.listaPrenotazioni.push({
              andata: this.listaPrenotazioniA[i],
              ritorno: this.listaPrenotazioniR[i],
            });
          }
        }
        if (this.listaPrenotazioni.length === 0) {
          this.noPrenotazioni = true;
        }
        openSnackBar('Prenotazione eliminata correttamente', this.snackbar);
      },
      error: (err) => {
        console.log(`ENTRATO IN ERR deletePrenot(): ${err}`);
        openSnackBar('Impossibile eliminare la prenotazione', this.snackbar);
      },
      complete: () => {
        console.log('ENTRATO IN COMPLETE deletePrenot(): complete');
        console.log('PRENOTAZIONI:', this.listaPrenotazioni);
      }
    });
  }

  /* ============================================================================================= */
  /** Metodo invocato dai metodi precedenti per settare la lista di prenotazioni su cui operare
   * (quella di andata o quella di ritorno)
   */
  getListaPrenByDirection(direzione: any) {
    if ((typeof direzione === 'number' && direzione === 0) ||
        (typeof direzione === 'boolean' && direzione === true)) {
      this.thisDirectionPrenList = this.listaPrenotazioniA;
      this.otherDirectionPrenList = this.listaPrenotazioniR;
    } else {
      this.thisDirectionPrenList = this.listaPrenotazioniR;
      this.otherDirectionPrenList = this.listaPrenotazioniA;
    }
  }

  /* ============================================================================================= */
  /** Metodo per disabilitare la modifica delle prenotazioni se è passato il tempo utile per farlo,
   * cioè prima del passaggio del pedibus per la fermata di partenza
   */
  isTooLate(prenotazione: any): boolean {
    if (prenotazione === 'empty-prenotazione') { return false; }

    const oraPartenza: number = parseInt(prenotazione.fermataSalita.orario.split(':')[0], 10);
    const minutiPartenza: number = parseInt(prenotazione.fermataSalita.orario.split(':')[1], 10);
    const now = new Date();
    const oraCorrente: number = now.getHours();
    const minutiCorrenti: number = now.getMinutes();
    if (compareDays(prenotazione.data, now) < 0) {
      return true;
    } else if (compareDays(prenotazione.data, now) === 0) {
      if (oraPartenza < oraCorrente) {
        return true;
      } else {
        if (oraPartenza === oraCorrente) {
          if (minutiPartenza <= minutiCorrenti) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /* ============================================================================================= */
  ngOnDestroy() {
    const msg = `[PrenotazioniComponent] ngOnDestroy()`;
    console.log(`${msg} running.`);

    if (this.subDataBambini != null) {
      this.subDataBambini.unsubscribe();
    }

    if (this.subPrenotazioniBambino != null) {
      this.subPrenotazioniBambino.unsubscribe();
    }
  }
}
