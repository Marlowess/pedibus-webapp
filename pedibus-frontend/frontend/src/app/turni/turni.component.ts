import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewEncapsulation, ViewChild} from '@angular/core';
import {forkJoin, Observable, Subscription} from 'rxjs';
import {MatDialog, MatSnackBar, MatTabGroup} from '@angular/material';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';
import { DialogTurnoComponent } from '../dialogs/dialog-turno/dialog-turno.component';
import { AccompagnatoreConTurni } from '../domain/turno-domain/accompagnatore-con-turni';
import { AmministratoreService } from '../services/amministratore-service/amministratore.service';
import { CorsaConTurni2 } from '../domain/turno-domain/corsa-con-turni2';
import { FermataConAccompagnatori2 } from '../domain/turno-domain/fermata-con-accompagnatori2';
import { Turno2 } from '../domain/turno-domain/turno2';
import { NotificationService } from '../services/notification-service/notification.service';
import { WebsocketTurniService } from '../services/websocket-services/websocket-turni/websocket-turni.service';
import { configDatePicker } from '../config/config';
import {compareDays, getRuolo, openSnackBar} from '../config/util';
import {Router} from '@angular/router';
import {AuthService} from '../services/auth/auth.service';

@Component({
  selector: 'app-turni',
  templateUrl: './turni.component.html',
  styleUrls: ['./turni.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class TurniComponent implements OnInit, OnDestroy {

  constructor(
    private amministratoreService: AmministratoreService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog,
    private snackbar: MatSnackBar,
    private websocketTurniService: WebsocketTurniService,
    private notificationService: NotificationService,
    private router: Router,
    private authService: AuthService
  ) { }

  @ViewChild('tabGroup') tabGroup: MatTabGroup;
  @ViewChild('dpTurni') dpTurni: any;

  // - Public Debug variables:
  public DEBUG_MODE_TURNI_COMPONENT = false;

  public debugTypeLineaNew: any = null;
  public debugTypeLineaCurr: any = null;

  public debugTypeDateNew: any = null;
  public debugTypeDateCurr: any = null;

  public dataTurnoUpdate: Date;
  public nomeLineaTurnoUpdate: any;

  public debugDataFromNotificationTurni: any = null;

  public debugCounterNotifications: any = 0;
  public notificationMessage: any = null;

  // - Public instance attributes:
  public date: Date;
  public linee: string[];
  public selectedLinea: string;

  // Public variables used for managing datepicker function:
  public minDate: Date = configDatePicker.minDate;
  public maxDate: Date = configDatePicker.maxDate;
  public startDate: Date = new Date();

  // Public flag-like variables:
  public noCorse = false;
  public showDirettiva = false;
  public showConsolidaTurno = false;
  public tooLateAndata = false;
  public tooLateRitorno = false;

  // Public string variables used to access correctly diverse data structures:
  public fermate: string;
  public turno: string;
  public turnoBackup: string;
  public stato: string;

  // Attribute used to get zeroed an existing reference of type Turno2
  public noTurno = new Turno2(null, null, null, null, null,
    null, null, null);

  // Attribute used to get zeroed an existing reference of type CorsaConTurni2
  corsa: CorsaConTurni2 = new CorsaConTurni2(
    null, null, new Array<FermataConAccompagnatori2>(), new Array<FermataConAccompagnatori2>());

  // List of pairs observable-subscription's:
  turniAdd: Turno2[];
  turniEdit: Map<Turno2, Turno2>;
  turniDelete: Map<Turno2, Turno2>;
  turniObs: Observable<any>[];

  turnoAddSub: Subscription = null;
  turnoModifySub: Subscription = null;
  turnoDeleteSub: Subscription = null;

  lineeObs: Observable<any>;
  lineeSub: Subscription = null;

  corsaTurniObs: Observable<any>;
  corsaTurniSub: Subscription = null;

  // Public attributes used to store or save pieces of information used by the Component for displaying them to the user
  public accompagnatoriTurni: AccompagnatoreConTurni[] = [];
  public tempAccompagnatoriTurni: AccompagnatoreConTurni[] = [];

  // - Private attributes:
  private subGetNotificationTurno: Subscription = null;

  dpIsOpen = false;

  /* =========================================================================================== */
  /*                                  Utility Functions Varie                                    */
  /* =========================================================================================== */
  /**
   * This static class method, `newTurnoFrom`, is invoked for get easier to create a copy of an existing
   * instance of type `Turno2`
   * @param turno Turno2
   * @returns Turno2
   */
  static newTurnoFrom(turno: Turno2): Turno2 {
    return new Turno2(turno.id, turno.nomeLinea, turno.data, turno.direzione, turno.userId,
      turno.fermataPartenzaId, turno.fermataArrivoId, turno.confermato);
  }

  /* =========================================================================================== */
  /**
   * This static class method, `AccompagnatoreConTurni`, is invoked for get easier to create a copy of an existing
   * instance of type `AccompagnatoreConTurni`
   * @returns Turno2
   */
  static newAccompagnatoreFrom(a: AccompagnatoreConTurni): AccompagnatoreConTurni {
    return new AccompagnatoreConTurni(a.id, a.nome, a.cognome, a.email,
      this.newTurnoFrom(a.turnoAndata), this.newTurnoFrom(a.turnoAndata),
      this.newTurnoFrom(a.turnoAndataVecchio), this.newTurnoFrom(a.turnoRitornoVecchio));
  }

  /* =========================================================================================== */
  ngOnInit() {
    if (getRuolo() !== 'amministratore' && getRuolo() !== 'amministratore master') {
      this.router.navigateByUrl('accesso-negato');
    }
    this.cdr.detectChanges();
    this.websocketTurniService.openWebSocket();

    const msg = `[TurniComponent] ngOnInit()`;
    console.log(`${msg}: running()`);

    // - Initiate variables.
    this.turniAdd = []; this.turniObs = [];

    this.turniEdit = new Map<Turno2, Turno2>();
    this.turniDelete = new Map<Turno2, Turno2>();

    this.date = new Date();

    this.lineeObs = this.amministratoreService.getLineeAdmin();
    this.lineeSub = this.lineeObs.subscribe({
      next: (linee) => {
        this.linee = linee;
        this.selectedLinea = this.linee[0];
        this.viewCorsaConTurni(this.selectedLinea, this.date);
      },
      error: err => { console.log(err); },
      complete: () => { console.log('lineeObs completato'); }
    });

    // - Subscribe to obtain notification about a objetct Turno that might be created / updated / deleted.
    this.subGetNotificationTurno = this.notificationService.getNotificationTurni().subscribe({
      next: (resultJson) => {
        console.log(`getNotificationTurni(): next: ${resultJson}`);
        this.debugDataFromNotificationTurni = resultJson;
        // Ingnore keep-alive or whatever the websocket produces that does not car for us.

        if (resultJson === undefined || resultJson.azione === undefined) {
          return;
        }

        this.debugCounterNotifications += 1;
        this.notificationMessage = resultJson;
        // window.alert(`${resultJson.azione} |${resultJson.direzione} | ${this.debugCounterNotifications}`);

        let fields = null;
        // tslint:disable-next-line:variable-name
        let _response = null;
        // If: add new accompagnatore or delete an existing accompagnatore.
        if (resultJson.azione === 'add_disponibilita' || resultJson.azione === 'delete_disponibilita') {
          _response = resultJson;

          // Prepare fields for creating a new date
          fields = resultJson.data.split('-');
          const day = fields[0]; const month = fields[1]; const year = fields[2];
          // Values to compare to know if we have to update or not the UI
          this.dataTurnoUpdate = new Date(Number(year), Number(month) - 1, Number(day));

          if (this.dataTurnoUpdate.getTime() !== this.corsa.data.getTime()) {
            this.debugTypeDateNew = typeof this.dataTurnoUpdate;
            this.debugTypeDateCurr = typeof this.corsa.data;
            // window.alert(`First date new: ${this.debugTypeDateNew} | date old: ${this.debugTypeDateCurr}`);
            return;
          }
        } else if (resultJson.azione === 'add' || resultJson.azione === 'delete'
          || resultJson.azione === 'modify') {
          _response = resultJson.response;

          fields = resultJson.response.corsa.data.split('-');
          this.nomeLineaTurnoUpdate = resultJson.response.nomeLinea;
          // - Prepare fields for creating a new date
          const day = fields[0]; const month = fields[1]; const year = fields[2];
          // - Values to compare to know if we have to update or not the UI
          this.dataTurnoUpdate = new Date(Number(year), Number(month) - 1, Number(day));

          // - Return if we are looking at a different date
          // if (resultJson.azione != 'add_disponibilita' && this.dataTurnoUpdate.getTime() !== this.corsa.data.getTime()) {
          if (this.dataTurnoUpdate.getTime() !== this.corsa.data.getTime()) {
            this.debugTypeDateNew = typeof this.dataTurnoUpdate;
            this.debugTypeDateCurr = typeof this.corsa.data;
            // window.alert(`First date new: ${this.debugTypeDateNew} | date old: ${this.debugTypeDateCurr}`);
            return;
          }

          // - Return if we are looking at different linea
          // if (resultJson.azione != 'add_disponibilita'
          // && this.nomeLineaTurnoUpdate != this.corsa.nomeLinea) {
          if (this.nomeLineaTurnoUpdate !== this.corsa.nomeLinea) {

            this.debugTypeLineaNew = typeof this.nomeLineaTurnoUpdate;
            this.debugTypeLineaCurr = typeof this.corsa.nomeLinea;
            // window.alert(`nome linea(${this.nomeLineaTurnoUpdate}):
            // ${this.debugTypeLineaNew} | nome linea old(${this.corsa.nomeLinea}):
            // ${this.debugTypeLineaCurr}`);
            return;
          }
        } else if (resultJson.azione === 'available' || resultJson.azione === 'not_available') {
          /*window.alert(`${resultJson.azione} allowed!`);
          // window.alert(`${JSON.stringify(resultJson.response)}`);*/
          _response = resultJson.response;

          // Prepare fields for creating a new date
          fields = _response.corsa.data.split('-');
          const day = fields[0]; const month = fields[1]; const year = fields[2];
          // Values to compare to know if we have to update or not the UI
          this.dataTurnoUpdate = new Date(Number(year), Number(month) - 1, Number(day));

          if (this.dataTurnoUpdate.getTime() !== this.corsa.data.getTime()) {
            this.debugTypeDateNew = typeof this.dataTurnoUpdate;
            this.debugTypeDateCurr = typeof this.corsa.data;
            // window.alert(`First date new: ${this.debugTypeDateNew} | date old: ${this.debugTypeDateCurr}`);
            return;
          }
        } else {
          // window.alert(`${resultJson.azione} not allowed!`);
        }

        // - Update UI if it matters.
        // const confermato: boolean = resultJson.confermato != null ? resultJson.confermato : null;
        const confermato: boolean = resultJson.confermato;
        this.switchUpdateOnNotificationTurniUI(resultJson.azione, _response, confermato);
      },
      error: (err) => { console.log(`getNotificationTurni(): error: ${err}`); },
      complete: () => { console.log(`getNotificationTurni(): complete`); }
    });
  }

  /* =========================================================================================== */
  /* Funzioni di aggiornamento Strutture Dati a seguito di comunicazioni avvenute con notifiche  */
  /* =========================================================================================== */

  /**
   * The public method `updateAfterAdd` is used to update accompagnatori list that is part of the model
   * about the UI that is managed by `TurniComponent`.
   * @param turnoAggiunto Turno2
   * @param accompagnatore AccompagnatoreConTurni
   * @param accompagnatori AccompagnatoreConTurni[]
   */
  updateAfterAdd(turnoAggiunto: Turno2, accompagnatore: AccompagnatoreConTurni,
                 accompagnatori: AccompagnatoreConTurni[]) {

    this.getTurnoFermate(turnoAggiunto.direzione);

    const accompIndex = accompagnatori.findIndex(a => a.id === accompagnatore.id); // turnoAggiunto.user.id
    if (accompIndex === -1) {
      accompagnatore[this.turno] = turnoAggiunto;
      accompagnatori.push(accompagnatore);
    } else {
      accompagnatori[accompIndex][this.turno] = turnoAggiunto;
    }
    // this.printTurniBeforeAndAfter();
  }


  /**
   * The public instance's method `updateAfterModify` is used to update UI after having completed
   * all the operation referred to update model's objects.
   * @param turnoModificato Turno2
   * @param accompagnatori AccompagnatoreConTurni[]
   */
  updateAfterModify(turnoModificato: Turno2, accompagnatori: AccompagnatoreConTurni[]) {
    this.getTurnoFermate(turnoModificato.direzione);
    // window.alert('updateAfterModify()');
    accompagnatori.forEach(a => {
      // window.alert(`${JSON.stringify(a)}`);
      if (a.id === turnoModificato.userId) {
        a[this.turno].fermataPartenzaId = turnoModificato.fermataPartenzaId;
        a[this.turno].fermataArrivoId = turnoModificato.fermataArrivoId;
        a[this.turno].confermato = false; // a.assegnato = true;
      }
    });

    // this.printTurniBeforeAndAfter();
  }

  /**
   * The public instance's method `updateAfterDelete` is used to update after deleating an existing
   * Turno assigned to a specific accompagnatore, the dedicated model's objects.
   * @param accompagnatoreID string
   * @param direzione number
   * @param accompagnatori AccompagnatoreConTurni[]
   * @param temp boolean
   */
  updateAfterDelete(accompagnatoreID: string, direzione: number, accompagnatori: AccompagnatoreConTurni[],
                    temp: boolean) {
    this.getTurnoFermate(direzione);
    const accompIndex = accompagnatori.findIndex(a => a.id === accompagnatoreID);
    if (temp) {
      accompagnatori[accompIndex][this.turno].fermataPartenzaId = null;
      accompagnatori[accompIndex][this.turno].fermataArrivoId = null;
      accompagnatori[accompIndex][this.turno].confermato = null;
    } else {
      accompagnatori[accompIndex][this.turno] = TurniComponent.newTurnoFrom(this.noTurno);
    }

    if (accompagnatori[accompIndex].turnoAndata.fermataPartenzaId === null &&
      accompagnatori[accompIndex].turnoRitorno.fermataPartenzaId === null) {
      accompagnatori.splice(accompIndex, 1);
    }

    this.printTurniBeforeAndAfter();
  }

  /**
   * The public instance's method `updateView` is used to update the UI.
   * @param action string
   * @param error boolean
   * @param turno Turno2
   * @param direzione number
   */
  updateView(action: string, error: boolean, turno: Turno2, direzione: number) {
    this.getTurnoFermate(direzione);
    // - Zeroed some variables.
    let foundPartenza = false; let foundArrivo = false;

    this.corsa[this.fermate].forEach(fermata => {
      fermata.accompagnatori.forEach(accompagnatore => {
        if (accompagnatore.id === turno.userId) {
          if (((action === 'add') && error) || ((action === 'delete') && !error)) {
            accompagnatore[this.turno] = TurniComponent.newTurnoFrom(this.noTurno);
            // console.log(accompagnatore[this.turno].id);
          } else {
            if (fermata.id === turno.fermataPartenzaId) {
              foundPartenza = true;
            }
            if (foundPartenza && !foundArrivo) {
              if (((action === 'add') && !error) || ((action === 'modify') && !error)) {
                accompagnatore[this.turno] = TurniComponent.newTurnoFrom(turno);
                // accompagnatore[this.turno].confermato = false;
              } else if (((action === 'modify') && error) || ((action === 'delete') && error)) {
                accompagnatore[this.turno] = TurniComponent.newTurnoFrom(turno); // gli ho passato il turnoBackup
                // accompagnatore[this.turno].confermato = wasConfirmed;
              }
            } else {
              accompagnatore[this.turno] = TurniComponent.newTurnoFrom(this.noTurno);
              // window.alert(`Nuovo utente non ha il turno assegnato nella
              // ${fermata.nome} fermata: ${accompagnatore.nome}: ${accompagnatore.id}`);
            }
            if (fermata.id === turno.fermataArrivoId) { // turno.fermataArrivoId
              foundArrivo = true;
            }
          }
        }
      });
    });
  }

  /* ============================================================================================ */
  /* Sezione con metodi di aggiornamento UI basandosi su informazioni provenienti dalle notifiche */
  /* ============================================================================================ */
  /**
   * The private instance's method `addOnNotificationTurniUI` is invoked when a new Turno is added
   * by another user of type `Linea Amministrator` in order to let others knowing about this new fact.
   * @param result any
   */
  private addOnNotificationTurniUI(result: any) {
    const turnoAggiunto = result;

    // - Create a new instance of type Turno2.
    const nuovoTurno = new Turno2(
      turnoAggiunto.id, this.corsa.nomeLinea, this.corsa.data, turnoAggiunto.corsa.direzione,
      turnoAggiunto.user.id, turnoAggiunto.fermataPartenza.id, turnoAggiunto.fermataArrivo.id,
      false
    );
    // - Create a new instance of type AccompagnatoreConTurni.
    const accompagnatore = new AccompagnatoreConTurni(
      turnoAggiunto.user.id, turnoAggiunto.user.nome, turnoAggiunto.user.cognome, turnoAggiunto.user.email,
      TurniComponent.newTurnoFrom(this.noTurno), TurniComponent.newTurnoFrom(this.noTurno),
      TurniComponent.newTurnoFrom(this.noTurno), TurniComponent.newTurnoFrom(this.noTurno)
    );
    // - Update data structures belonging to the model
    this.updateAfterAdd(nuovoTurno, accompagnatore, this.accompagnatoriTurni);
    // - Then, update the UI itself.
    this.updateView('add', false, nuovoTurno, nuovoTurno.direzione);
  }

  /**
   * Updates the graphic interface when another admin gives or removes a 'turno' to an 'accompagnatore'
   * in the same day and 'corsa' the user is viewing
   * @param result any
   */
  private updateOnNotificationTurniUI(result: any) {

    const turno = new Turno2(
      result.id, this.corsa.nomeLinea, this.corsa.data, result.corsa.direzione,
      result.user.id, result.fermataPartenza.id, result.fermataArrivo.id,
      false
    );

    // window.alert(`fermataPartenza: ${result.fermataPartenza.id}, fermataArrivo: ${result.fermataArrivo.id}`);

    this.updateAfterModify(turno, this.accompagnatoriTurni);
    this.accompagnatoriTurni.forEach(element => {
      console.log(JSON.stringify(element));
    });
    this.updateView('modify', false, turno, turno.direzione);

    // window.alert(
    //   JSON.stringify(
    //     this.accompagnatoriTurni.filter((acc: AccompagnatoreConTurni) => {
    //       return (acc.id == turno.userId);
    //     }))
    // );
  }

  /**
   * Updates the graphic interface when an 'accompagnatore' confirmes his 'turno'
   * in the same day 'corsa' the user is viewing
   * @param result any
   */
  private confirmedOnNotificationTurniUI(result: any) {
    const turno = new Turno2(
      result.id, this.corsa.nomeLinea, this.corsa.data, result.corsa.direzione,
      result.user.id, result.fermataPartenza.id, result.fermataArrivo.id,
      true
    );

    this.getTurnoFermate(turno.direzione);
    this.accompagnatoriTurni.forEach(a => {
      if (a.id === turno.userId) {
        a[this.turno].confermato = true;
      }
    });

    this.updateView('modify', false, turno, turno.direzione);
  }

  /**
   * Updates the graphic interface when an 'accompagnatore' rejects the 'turno'
   * in the same day 'corsa' the user is viewing
   * @param result any
   */
  private deleteOnNotificationTurniUI(result: any) {
    const turno = new Turno2(
      result.id, this.corsa.nomeLinea, this.corsa.data, result.corsa.direzione,
      result.user.id, result.fermataPartenza.id, result.fermataArrivo.id,
      false
    );
    this.updateAfterDelete(turno.userId, turno.direzione, this.accompagnatoriTurni, false);
    this.updateView('delete', false, turno, turno.direzione);
    this.updateAfterDelete(turno.userId, turno.direzione, this.tempAccompagnatoriTurni, true);
  }

  /**
   * Updates the graphic interface when an 'accompagnatore' gives his 'disponibilità'
   * in the same day 'corsa' the user is viewing
   * @param result any
   */
  private addDisponabilitaOnNotificationTurniUI(result: any) {
    this.getTurnoFermate(result.direzione);
    const accompagnatore = new AccompagnatoreConTurni(
      result.user.id, result.user.nome, result.user.cognome, result.user.email,
      TurniComponent.newTurnoFrom(this.noTurno), TurniComponent.newTurnoFrom(this.noTurno),
      TurniComponent.newTurnoFrom(this.noTurno), TurniComponent.newTurnoFrom(this.noTurno)
    );
    this.corsa[this.fermate].forEach((fermata: FermataConAccompagnatori2) => {
      const filterResult = fermata.accompagnatori.filter(a => {
        return (a.id === accompagnatore.id);
      });
      if (filterResult.length === 0) {
        fermata.accompagnatori.push(TurniComponent.newAccompagnatoreFrom(accompagnatore));
      }
    });
  }

  /**
   * Updates the graphic interface when an 'accompagnatore' deletes his the 'disponibilità'
   * in the same day 'corsa' the user is viewing
   * @param result any
   */
  private deleteDisponabilitaOnNotificationTurniUI(result: any) {
    const userId = result.user.id;
    this.getTurnoFermate(result.direzione);

    // elimina dalla corsa:
    this.corsa[this.fermate].forEach(
      (fermata: FermataConAccompagnatori2) => {
        fermata.accompagnatori =
          fermata.accompagnatori.filter((acc: AccompagnatoreConTurni) => {
            return acc.id !== userId;
          });
      });

    // accompagnatori con turni:
    this.accompagnatoriTurni =
      this.accompagnatoriTurni.filter(
        (acc: AccompagnatoreConTurni) => {
          return acc.id !== userId;
        }
      );

    // accompagnatori con turni:
    this.tempAccompagnatoriTurni =
      this.tempAccompagnatoriTurni.filter(
        (acc: AccompagnatoreConTurni) => {
          return acc.id !== userId;
        }
      );
  }

  /** Creates a new available 'accompagnatore' with no 'turno'
   * in the lists of each fermata
   */
  private setAvailableAccompagnatore(acc: any, direction: number) {
    const accompVisual = new AccompagnatoreConTurni(
      acc.id, acc.nome, acc.cognome, acc.email,
      TurniComponent.newTurnoFrom(this.noTurno), TurniComponent.newTurnoFrom(this.noTurno),
      TurniComponent.newTurnoFrom(this.noTurno), TurniComponent.newTurnoFrom(this.noTurno)
    );
    if (direction === 0) {
      this.corsa.fermateConAccAndata.forEach(
        (fermata: FermataConAccompagnatori2) => {
          fermata.accompagnatori.push(accompVisual);
        }
      );
    }
    if (direction === 1) {
      this.corsa.fermateConAccRitorno.forEach(
        (fermata: FermataConAccompagnatori2) => {
          fermata.accompagnatori.push(accompVisual);
        }
      );
    }

  }

  /** Removes a no more available 'accompagnatore' from the lists in eanch 'fermata'
   */
  private setNotAvailableAccompagnatore(acc: any, direction: number) {
    // window.alert(`Set Not Available ${JSON.stringify(acc)}`);

    if (direction === 0) {
      this.corsa.fermateConAccAndata.forEach(
        (fermata: FermataConAccompagnatori2) => {

          const resultIndex = fermata.accompagnatori.findIndex(
            (accInList: AccompagnatoreConTurni) => {
              return acc.id === accInList.id;
            }
          );
          if (resultIndex === -1) { return; }
          fermata.accompagnatori.splice(resultIndex, 1);
        }
      );
    }

    if (direction === 1) {
      this.corsa.fermateConAccRitorno.forEach(
        (fermata: FermataConAccompagnatori2) => {
          const resultIndex: number = fermata.accompagnatori.findIndex(
            (accInList: AccompagnatoreConTurni) => {
              return acc.id === accInList.id;
            }
          );
          if (resultIndex === -1) { return; }
          fermata.accompagnatori.splice(resultIndex, 1);
        }
      );
    }
  }

  /* =========================================================================================== */
  /**
   * This private instance's method, `updateOnNotificationTurniUI`, is used to discriminate between
   * different possible type of notifications that can be received by a logged in user of type `Linea Amministratore`.
   * @param action string
   * @param response any
   * @param confermato boolean
   */
  private switchUpdateOnNotificationTurniUI(action: string, response: any, confermato: boolean) {
    switch (action) {
      case 'add': // add_turno
        this.addOnNotificationTurniUI(response);
        break;
      case 'add_disponibilita':
        this.addDisponabilitaOnNotificationTurniUI(response);
        break;
      case 'delete_disponibilita':
        this.deleteDisponabilitaOnNotificationTurniUI(response);
        break;
      case 'modify':
        if (confermato === true) {
          this.confirmedOnNotificationTurniUI(response);
        } else {
          this.updateOnNotificationTurniUI(response);
        }
        break;
      case 'delete': // delete_turno
        this.deleteOnNotificationTurniUI(response);
        break;
      case 'available':
        if (this.selectedLinea === response.nomeLinea) {
          return;
        }
        this.setAvailableAccompagnatore(response.user, response.corsa.direzione);
        break;
      case 'not_available':
        if (this.selectedLinea === response.nomeLinea) {
          return;
        }
        this.setNotAvailableAccompagnatore(response.user, response.corsa.direzione);
        break;
    }
  }

  /* =========================================================================================== */
  /**
   * The public instance's method `viewCorsaConTurni` is invoked in order to view within the UI some
   * aviable `Turni` within a given `Corsa`.
   * @param linea string
   * @param date Date
   */
  viewCorsaConTurni(linea: string, date: Date) {

    // - Zeroed some data structures.
    this.corsa = new CorsaConTurni2(
      null, null, new Array<FermataConAccompagnatori2>(), new Array<FermataConAccompagnatori2>()
    );
    this.accompagnatoriTurni = [];
    this.tempAccompagnatoriTurni = [];

    this.showConsolidaTurno = false;
    this.showDirettiva = false;

    // - Create a Subscription for let the component get existing `Turni` for a given `Corsa`.
    this.corsaTurniObs = this.amministratoreService.getTurniCorsa(linea, date);
    this.corsaTurniSub = this.corsaTurniObs.subscribe({
      next: (value) => {
        if (value === 'LOGOUT') {
          setTimeout(() => { this.authService.logout('login-form'); }, 100);
          return;
        }
        this.noCorse = false;
        const corsa: any = value;
        this.corsa.nomeLinea = corsa.nome_linea;

        // Create a manageable date object
        const fields = corsa.data.split('-');
        const day = fields[0]; const month = fields[1]; const year = fields[2];
        this.corsa.data = new Date(Number(year), Number(month) - 1, Number(day));

        // tslint:disable-next-line:forin
        for (const key in corsa.andata) {
          const fermataAccompagnatori = corsa.andata[key];
          this.setInfoCorsa(fermataAccompagnatori, 0);
        }
        // tslint:disable-next-line:forin
        for (const key in corsa.ritorno) {
          const fermataAccompagnatori = corsa.ritorno[key];
          this.setInfoCorsa(fermataAccompagnatori, 1);
        }
        console.log('Accompagnatori con un turno: ');
        this.accompagnatoriTurni.forEach(a => {
          console.log(a.nome, 'andata:', a.turnoAndata.id, 'ritorno:', a.turnoRitorno.id);
          this.tempAccompagnatoriTurni.push(new AccompagnatoreConTurni(
            a.id, a.nome, a.cognome, a.email,
            TurniComponent.newTurnoFrom(a.turnoAndata), TurniComponent.newTurnoFrom(a.turnoRitorno),
            TurniComponent.newTurnoFrom(a.turnoAndataVecchio), TurniComponent.newTurnoFrom(a.turnoRitornoVecchio)
          ));
          /*info partenza e arrivo anche negli accompagnatori 'visuali', quelli che clicco*/
          if (a.turnoAndata.id !== null) {
            this.updateView('add', false, a.turnoAndata, 0);
          }
          if (a.turnoRitorno.id !== null) {
            this.updateView('add', false, a.turnoRitorno, 1);
          }
        });
        // setTimeout(() => { this.tabGroup._alignInkBarToSelectedTab(); }, 0);
        /*if (this.tabGroup !== undefined) {
          this.tabGroup.realignInkBar();
        }*/
        if (!this.noCorse && this.corsa !== null) {
          setTimeout(() => { this.tabGroup.realignInkBar(); }, 0);
        }
      },
      error: err => {
        console.log(err);
        if (err.error.errore === 'Corsa non esistente') {
          this.noCorse = true;
        }
      },
      complete: () => {
        console.log('corsaTurniObs completato');
        // console.log('è troppo tardi?');
        this.tooLateAndata = this.isTooLate(0);
        this.tooLateRitorno = this.isTooLate(1);
        console.log(this.tooLateAndata, this.tooLateRitorno);
        this.dpIsOpen = false;
      }
    });
  }

  /* =========================================================================================== */
  /**
   * The public instance's method `setInfoCorsa` is used and invoked to set information about
   * a specific `Corsa`.
   * @param fermataAccompagnatori any
   * @param direzione number
   */
  setInfoCorsa(fermataAccompagnatori: any, direzione: number) {
    this.getTurnoFermate(direzione);

    // prendo le informazioni della fermata
    const fermata = fermataAccompagnatori.fermata;

    // prendo dalla risposta la lista degli accompagnatori nella la fermata
    const acc: Array<any> = fermataAccompagnatori.userInfos;
    if (acc.length !== 0) { this.showDirettiva = true; }

    // lista degli accompagnatori che aggiungerò alla fermata per la grafica
    const accompagnatori: Array<AccompagnatoreConTurni> = [];
    // tslint:disable-next-line:forin
    for (const user in acc) { // scorro la lista degli accompagnatori nella fermata corrente

      // nuovo accompagnatore da aggiungere alla lista di accompagnatori per questa fermata (per la visualizzazione)
      const accompVisual = new AccompagnatoreConTurni(
        acc[user].user.id, acc[user].user.nome, acc[user].user.cognome, acc[user].user.email,
        TurniComponent.newTurnoFrom(this.noTurno), TurniComponent.newTurnoFrom(this.noTurno),
        TurniComponent.newTurnoFrom(this.noTurno), TurniComponent.newTurnoFrom(this.noTurno)
      );
      // nuovo accompagnatore da aggiungere nella lista generale degli accompagnatori con un turno
      const accompLogic = TurniComponent.newAccompagnatoreFrom(accompVisual);

      if (acc[user].assegnato === true) {
        // se l'accompagnatore è assegnato a questa fermata
        // console.log(acc[user].user.nome + ' è assegnato alla fermata ' + fermata.descrizione);

        const turno = new Turno2(
          acc[user].turnoId, this.corsa.nomeLinea, this.corsa.data, direzione,
          accompVisual.id, null, null, acc[user].confermato
        );
        accompVisual[this.turno] = TurniComponent.newTurnoFrom(turno);

        const accompIndex = this.accompagnatoriTurni.findIndex(a => a.id === acc[user].user.id);
        if (accompIndex === -1) { // questa è la fermata di partenza di questo accompagnatore
          /*console.log('1- Fermata di partenza di ' + acc[user].user.nome + ': ' + fermata.descrizione +
            ' id turno: ' + acc[user].turnoId);*/

          accompVisual[this.turno].fermataPartenzaId = fermata.id;

          accompLogic[this.turno] = TurniComponent.newTurnoFrom(turno);
          accompLogic[this.turno].fermataPartenzaId = fermata.id;
          this.accompagnatoriTurni.push(accompLogic);

          /*accompVisual[this.turno] = new Turno2(
            acc[user].turnoId, this.corsa.nomeLinea, this.corsa.data, direzione,
            accompVisual.id, fermata.id, null, acc[user].confermato
          );
          accompLogic[this.turno] = TurniComponent.newTurnoFrom(accompVisual[this.turno]);
          this.accompagnatoriTurni.push(accompLogic);*/

        } else if (this.accompagnatoriTurni[accompIndex][this.turno].id === null) {
          // aveva un turno nell'altra direzione
          /*console.log('2 - Fermata di partenza di ' + this.accompagnatoriTurni[accompIndex].nome + ': ' +
            fermata.descrizione + ' id turno: ' + acc[user].turnoId);*/

          accompVisual[this.turno].fermataPartenzaId = fermata.id;

          /*accompVisual[this.turno] = new Turno2(
            acc[user].turnoId, this.corsa.nomeLinea, this.corsa.data, direzione,
            acc[user].user.id, fermata.id, null, acc[user].confermato
          );*/
          this.accompagnatoriTurni[accompIndex][this.turno] = TurniComponent.newTurnoFrom(accompVisual[this.turno]);

        } else {
          // aggiorna la fermata di arrivo finché non trova l'ultima a cui è assegnato

          this.accompagnatoriTurni[accompIndex][this.turno].fermataArrivoId = fermata.id;
          /*console.log('id turno: ' + this.accompagnatoriTurni[accompIndex][this.turno].id);
          console.log('fermata arrivo: ' + this.accompagnatoriTurni[accompIndex][this.turno].fermataArrivoId);*/

          accompVisual[this.turno].fermataArrivoId = fermata.id;

          /*accompVisual[this.turno] = new Turno2(
            acc[user].turnoId, this.corsa.nomeLinea, this.corsa.data, direzione,
            acc[user].user.id, null, fermata.id, acc[user].confermato
          );*/
        }
      }

      accompagnatori.push(accompVisual);
    }
    // aggiungo alle informazioni della fermata l'array di accompagnatori appena creato
    this.corsa[this.fermate].push(new FermataConAccompagnatori2(
      fermata.id, fermata.descrizione, fermata.indirizzo, fermata.orario, accompagnatori)
    );
  }

  /* =========================================================================================== */
  /**
   * The public instance's method `isAssegnatoOrConfermato` sets the style for the name of the
   * 'accompagnatore' 'j' in the fermata 'i'
   * @param i number
   * @param j number
   * @param direzione number
   */
  isAssegnatoOrConfermato(i: number, j: number, direzione: number) {
    this.getTurnoFermate(direzione);

    const accompagnatore = this.corsa[this.fermate][i].accompagnatori[j];
    if (accompagnatore[this.turno].confermato) { // accompagnatore[this.turno].id !== null &&
      this.stato = 'Ha confermato il turno per questa fermata';
      return 'accompagnatore-item-confirmed';
    } else {
      if (accompagnatore[this.turno].fermataPartenzaId !== null &&
        accompagnatore[this.turno].fermataArrivoId !== null) {
        this.stato = 'Ha un turno per questa fermata';
        return 'accompagnatore-item-assigned';
      } else {
        this.stato = 'Non ha un turno per questa fermata';
        return 'accompagnatore-item';
      }
    }

  }

  /* =========================================================================================== */

  /** Invoked when button 'Consolida Turno' is clicked, sends the information of all the 'turni' added,
   * modified or removed to the server
   */
  consolidaTurno() {
    this.turniAdd = []; this.turniEdit = new Map<Turno2, Turno2>(); this.turniDelete = new Map<Turno2, Turno2>();

    console.log('Accompagnatori che avevano già un turno');
    this.accompagnatoriTurni.forEach(a => {
      console.log(a.nome, 'andata (', a.turnoAndata.id, '): da', a.turnoAndata.fermataPartenzaId,
        'a', a.turnoAndata.fermataArrivoId,
        'ritorno (', a.turnoRitorno.id, '): da', a.turnoRitorno.fermataPartenzaId,
        'a', a.turnoRitorno.fermataArrivoId);
    });
    console.log('Accompagnatori che attualmente hanno un turno');
    this.tempAccompagnatoriTurni.forEach(a => {
      console.log(a.nome, 'andata (', a.turnoAndata.id, '): da', a.turnoAndata.fermataPartenzaId,
        'a', a.turnoAndata.fermataArrivoId,
        'ritorno (', a.turnoRitorno.id, '): da', a.turnoRitorno.fermataPartenzaId,
        'a', a.turnoRitorno.fermataArrivoId);
    });

    this.compareBeforeAndAfter(0, false);
    this.compareBeforeAndAfter(1, false);

    console.log('turni da aggiungere');
    this.turniAdd.forEach(turno => console.log(turno.id, 'di', turno.userId));
    console.log('turni da modificare');
    this.turniEdit.forEach(turno => console.log(turno.id, 'di', turno.userId));
    console.log('turni da eliminare');
    this.turniDelete.forEach(turno => console.log(turno.id, 'di', turno.userId));

    this.turniObs = [];

    this.turniAdd.forEach(turno => {
      this.turniObs.push(this.amministratoreService.sendTurno(turno));
    });
    this.turniEdit.forEach((backupTurno, turno) => {
      this.turniObs.push(this.amministratoreService.modifyTurno(turno.id, turno, backupTurno));
    });
    this.turniDelete.forEach((backupTurno, turno) => {
      this.turniObs.push(this.amministratoreService.deleteTurno(turno.id, turno, backupTurno));
    });
    let snackBarText = ''; let errorAdd = false; let errorEdit = false; let errorDelete = false;
    forkJoin(this.turniObs).subscribe({
      next: value => {
        value.forEach(result => {
          console.log('next del forJoin');
          console.log('C\'è stato un errore?', result.error);
          if (!result.error) { // richiesta andata a buon fine
            if (result.data_type === 'add') {
              const turnoAggiunto = result.data.turno; // const resp: any = value;
              // this.updateAfterAdd(resp.turno, turno.direzione);
              // console.log(result);
              const nuovoTurno = new Turno2(
                turnoAggiunto.id, this.corsa.nomeLinea, this.corsa.data, turnoAggiunto.corsa.direzione,
                turnoAggiunto.user.id, turnoAggiunto.fermataPartenza.id, turnoAggiunto.fermataArrivo.id,
                false
              );
              const accompagnatore = new AccompagnatoreConTurni(
                turnoAggiunto.user.id, turnoAggiunto.user.nome, turnoAggiunto.user.cognome, turnoAggiunto.user.email,
                TurniComponent.newTurnoFrom(this.noTurno), TurniComponent.newTurnoFrom(this.noTurno),
                TurniComponent.newTurnoFrom(this.noTurno), TurniComponent.newTurnoFrom(this.noTurno)
              );
              this.updateAfterAdd(nuovoTurno, accompagnatore, this.accompagnatoriTurni);
              this.updateView('add', false, nuovoTurno, nuovoTurno.direzione);
              // resp.turno.fermataPartenza.id, resp.turno.fermataArrivo.id
            } else if (result.data_type === 'edit') {
              this.updateAfterModify(result.editedTurno, this.accompagnatoriTurni);
              this.updateView('modify', false, result.editedTurno, result.editedTurno.direzione);
            } else if (result.data_type === 'delete') {
              this.updateAfterDelete(result.deletedTurno.userId, result.deletedTurno.direzione,
                this.accompagnatoriTurni, false);
              this.updateView('delete', false, result.deletedTurno, result.deletedTurno.direzione);
            }
          } else { // la richiesta non è andata a buon fine
            console.log(result.data_type);
            if (result.data_type === 'add') {
              this.updateView('add', true, null, result.addedTurno.direzione);
              console.error(result.error_text);
              // console.log('ciao');
              errorAdd = true;
            } else if (result.data_type === 'edit') {
              this.updateView('modify', true, result.backupTurno, result.backupTurno.direzione);
              console.error(result.error_text);
              errorEdit = true;
            } else if (result.data_type === 'delete') {
              this.updateView('delete', true, result.backupTurno, result.backupTurno.direzione);
              console.error(result.error_text);
              errorDelete = true;
            }
          }
        });
      },
      error: err => {
        console.log('forkJoin error');
        console.log(err);
      },
      complete: () => {
        console.log('forkJoin complete');
        if (!errorAdd && !errorEdit && !errorDelete) {
          snackBarText = 'Turni aggiornati correttamente';
        }
        if (errorAdd) {
          snackBarText.concat(`Errore nell\'aggiunta di un nuovo turno `);
          // `Errore nell\'aggiunta di un nuovo turno<br/>`
        }
        if (errorEdit) {
          snackBarText.concat(`Errore nella modifica di un turno `);
        }
        if (errorDelete) {
          snackBarText.concat(`Errore nell\'eliminazione di un turno `);
        }
        openSnackBar(snackBarText, this.snackbar);
        this.showConsolidaTurno = false;
        this.tempAccompagnatoriTurni = [];
        this.accompagnatoriTurni.forEach(a => {
          this.tempAccompagnatoriTurni.push(new AccompagnatoreConTurni(
            a.id, a.nome, a.cognome, a.email,
            TurniComponent.newTurnoFrom(a.turnoAndata), TurniComponent.newTurnoFrom(a.turnoRitorno),
            TurniComponent.newTurnoFrom(a.turnoAndataVecchio), TurniComponent.newTurnoFrom(a.turnoRitornoVecchio)
          ));
        });
      }
    });

  }

  /* =========================================================================================== */
  /**
   * This public instance's method `ordinaAccompagnatori` is used to sort the `AccompagnatoreConTurni[]` array,
   * @param accompagnatori  AccompagnatoreConTurni[]
   */
  ordinaAccompagnatori(accompagnatori: AccompagnatoreConTurni[]) {
    return accompagnatori.sort((a: AccompagnatoreConTurni, b: AccompagnatoreConTurni): number => {
      return a.cognome.toLowerCase().localeCompare(b.cognome.toLowerCase());
    });
  }

  /* =========================================================================================== */
  /**
   * @param direzione: number
   * @param checkOrConsolida: boolean, true = check, guardo se è cambiato qualcosa, per abilitare il bottone
   *                                   false = consolida, preparo le liste di richieste da mandare al server
   */
  compareBeforeAndAfter(direzione: number, checkOrConsolida: boolean) {
    this.getTurnoFermate(direzione);
    let changed = false;

    // se nella lista dei turni vecchia ci sono turni non più presenti in quella nuova
    // devono essere eliminati
    if (this.accompagnatoriTurni.length !== 0) {
      console.log('C\'erano già dei turni');
      this.accompagnatoriTurni.forEach(a => {
        if (a[this.turno].id !== null) {
          console.log(a.nome + ' aveva un ' + this.turno + ': ' + a[this.turno].id);
          if (this.tempAccompagnatoriTurni.find(aTemp => (
            (aTemp[this.turno].id === a[this.turno].id) &&
            (aTemp[this.turno].fermataPartenzaId !== null) &&
            (aTemp[this.turno].fermataArrivoId !== null))) === undefined) {
            if (checkOrConsolida) {
              changed = true;
            } else {
              console.log('Elimina il ' + this.turno + ' da ' + a.turnoAndata.fermataPartenzaId +
                ' a ' + a.turnoAndata.fermataArrivoId);
              this.turniDelete.set(a[this.turno], a[this.turno]);
            }
          }
        }
      });
    }

    // se nella lista dei turni nuova ci sono dei turni che non erano presenti in quella vecchia
    // o che hanno fermate diverse da prima, devono essere aggiunti o modificati
    if (this.tempAccompagnatoriTurni.length !== 0) {
      console.log('Ci sono nuovi turni');
      this.tempAccompagnatoriTurni.forEach(aTemp => {
        const accomp = this.accompagnatoriTurni.find(a => a.id === aTemp.id);
        if (aTemp[this.turno].fermataPartenzaId !== null && aTemp[this.turno].fermataArrivoId !== null) {
          if (accomp === undefined || accomp[this.turno].id === null) {
            if (checkOrConsolida) {
              changed = true;
            } else {
              console.log('Manda il nuovo turno');
              this.turniAdd.push(aTemp[this.turno]);
            }
          } else if (accomp[this.turno].fermataPartenzaId !== aTemp[this.turno].fermataPartenzaId ||
                     accomp[this.turno].fermataArrivoId !== aTemp[this.turno].fermataArrivoId) {
            if (checkOrConsolida) {
              changed = true;
            } else {
              console.log('Modifica il turno di ' + aTemp.id + ', ' + aTemp[this.turno].id);
              this.turniEdit.set(aTemp[this.turno], aTemp[this.turnoBackup]);
            }
          }
        }
      });
    }
    if (checkOrConsolida) {
      return changed;
    }
  }

  /* =========================================================================================== */
  /**
   * This instance's method, `isTooLate` is exploited to understand weather is it too late for
   * changing 'turni' (used to disable graphic objects)
   * @param direzione number
   */
  isTooLate(direzione: number): boolean {
    this.getTurnoFermate(direzione);
    if (this.noCorse || this.corsa[this.fermate][0] === undefined) { return false; }
    const now = new Date();

    const oraPartenza: number = parseInt(this.corsa[this.fermate][0].orario.split(':')[0], 10);
    const minutiPartenza: number = parseInt(this.corsa[this.fermate][0].orario.split(':')[1], 10);
    const currentHours: number = now.getHours();
    const currentMinutes: number = now.getMinutes();
    if (compareDays(this.date, now) < 0) {
      return true;
    } else if (compareDays(this.date, now) === 0) {
      if (oraPartenza < currentHours) {
        return true;
      } else {
        if (oraPartenza === currentHours) {
          if ((minutiPartenza <= currentMinutes + 5) || minutiPartenza === 0) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /* =========================================================================================== */
  /** Used only in debug phase */
  printTurniBeforeAndAfter() {
    console.log('Accompagnatori con turno già da prima: ');
    this.accompagnatoriTurni.forEach(acc => console.log(acc.nome, 'andata:', acc.turnoAndata.id,
      'ritorno:', acc.turnoRitorno.id));
    console.log('Accompagnatori temporaneamente con turno: ');
    this.tempAccompagnatoriTurni.forEach(acc => console.log(acc.nome, 'andata:', acc.turnoAndata.id,
      'ritorno:', acc.turnoRitorno.id));
  }

  /* =========================================================================================== */
  /** Method to get, depending on the direction, the lists of 'fermate' and the 'turno' to modify */
  getTurnoFermate(direzione: number) {
    if (direzione === 0) {
      this.fermate = 'fermateConAccAndata'; this.turno = 'turnoAndata'; this.turnoBackup = 'turnoAndataVecchio';
    } else {
      this.fermate = 'fermateConAccRitorno'; this.turno = 'turnoRitorno'; this.turnoBackup = 'turnoRitornoVecchio';
    }
  }

  /* =========================================================================================== */
  /*               Sezione dedicata all'interazione dell'utente con interfaccia grafica               */
  /* =========================================================================================== */
  onSelectLinea(value: string) {
    this.selectedLinea = value;
    this.viewCorsaConTurni(this.selectedLinea, this.date); // Number(this.date)
  }

  // metodo invocato quando l'utente cambia la data da visualizzare
  onSelectDate(event: MatDatepickerInputEvent<Date>) {
    this.date = new Date(event.value);
    this.viewCorsaConTurni(this.selectedLinea, this.date); // Number(this.date)
  }

  /** Method to open the dialog with which add, modify or delete the 'turno' associated to
   * the 'accompagnatore' on which the user clicked
   */
  openDialog(accompagnatore: AccompagnatoreConTurni, direzione: number, isNew: boolean): void {

    this.getTurnoFermate(direzione);

    const dialogRef = this.dialog.open(DialogTurnoComponent, {
      panelClass: 'dialog', width: '320px',
      data: {
        ferm: this.corsa[this.fermate],
        is_new: isNew,
        accomp: accompagnatore,
        direzione: this.turno
      },
    });

    let fermataPartenzaID: string;
    let fermataArrivoID: string;
    let turnoID: string; let accompagnatoreID: string;

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');

      // nel caso in cui si abbia cliccato fuori dal dialog oppure il bottone 'annulla'
      if (result === undefined) { return; } // result.pick

      fermataPartenzaID = result.fermataSalitaID;
      fermataArrivoID = result.fermataDiscesaID;
      turnoID = result.turnoId;
      accompagnatoreID = result.accompagnatoreId;

      if (turnoID === null) {
        turnoID = 'tempID';
      }
      const nuovoTurno = new Turno2(
        turnoID, this.corsa.nomeLinea, this.corsa.data, direzione, accompagnatoreID,
        fermataPartenzaID, fermataArrivoID, false
      );
      console.log('ID nuovo turno: ' + nuovoTurno.id, 'ID accompagnatore: ' + nuovoTurno.userId,
        'Partenza nuovo turno: ' + nuovoTurno.fermataPartenzaId,
        'Arrivo nuovo turno: ' + nuovoTurno.fermataArrivoId,
        'Confermato (un nuovo turno non può essere confermato): ' + nuovoTurno.confermato);

      if (isNew && nuovoTurno.fermataPartenzaId !== null && nuovoTurno.fermataArrivoId !== null) {
        //  ho aggiunto un nuovo turno
        this.updateAfterAdd(nuovoTurno, accompagnatore, this.tempAccompagnatoriTurni);
        this.updateView('add', false, nuovoTurno, direzione);
      } else if (!isNew && nuovoTurno.fermataPartenzaId !== null && nuovoTurno.fermataArrivoId !== null) {
        // ho modificato un turno esistente
        console.log('controlla: ' + result.fermataDiscesaID);
        this.updateAfterModify(nuovoTurno, this.tempAccompagnatoriTurni);
        this.updateView('modify', false, nuovoTurno, direzione);
      } else { // ho eliminato un turno esistente
        // this.accompagnatoriTurni.forEach(acc => console.log(acc.nome, acc.turnoAndata.id));
        nuovoTurno.nomeLinea = null; nuovoTurno.data = null; nuovoTurno.direzione = null;
        this.updateAfterDelete(accompagnatore.id, direzione, this.tempAccompagnatoriTurni, true);
        this.updateView('delete', false, nuovoTurno, direzione);
      }

      this.showConsolidaTurno = (
        this.compareBeforeAndAfter(0, true) ||
        this.compareBeforeAndAfter(1, true)
      );
      console.log('E\' cambiato qualcosa?', this.showConsolidaTurno);
    });
  }

  /**
   * Evento associato al click del mouse sul nome dell'accompagnatore in posizione j
   * nella fermata in posizione i
   */
  onClick(i: number, j: number, direzione: number) {

    this.getTurnoFermate(direzione);

    if (this.isTooLate(direzione)) {
      if (direzione === 0) {
        openSnackBar('Turni non più modificabili all\'andata', this.snackbar);
      } else {
        openSnackBar('Turni non più modificabili al ritorno', this.snackbar);
      }
      return;
    }

    const accompagnatore = this.corsa[this.fermate][i].accompagnatori[j];
    const accompTemp = this.tempAccompagnatoriTurni.find(a =>
      (a.id === accompagnatore.id) && (a[this.turno].id !== null)
    );

    if (accompTemp === undefined) { // adesso non ha turni in quella direzione, ma potrebbe averne avuti
      console.log('Aggiungi turno');
      accompagnatore[this.turno] = new Turno2(
        null, this.corsa.nomeLinea, this.corsa.data, direzione, accompagnatore.id,
        this.corsa[this.fermate][i].id, null, false
      );
      /*se clicchi sull'ultima fermata ti mette la partenza alla fermata precedente*/
      if (i === (this.corsa[this.fermate].length - 1)) {
        accompagnatore[this.turno].fermataPartenzaId = this.corsa[this.fermate][i - 1].id;
      }

      const accomp = this.accompagnatoriTurni.find(a =>
        (a.id === accompagnatore.id) && (a[this.turno].id !== null)
      );
      if (accomp !== undefined) { // prima aveva già un turno in quella direzione
        accompagnatore[this.turno].id = accomp[this.turno].id;
      }
      this.openDialog(accompagnatore, direzione, true);

    } else { // adesso ha già un turno in quella direzione
      if (accompTemp[this.turno].fermataPartenzaId === null || accompTemp[this.turno].fermataPartenzaId === null) {
        // aveva un turno, ma adesso l'ho eliminato, quindi adesso non ne ha
        console.log('Aggiungi turno');
        accompagnatore[this.turno] = new Turno2(
          accompTemp[this.turno].id, this.corsa.nomeLinea, this.corsa.data, direzione, accompagnatore.id,
          this.corsa[this.fermate][i].id, null, false
        );
        /*se clicchi sull'ultima fermata ti mette alla fermata precedente per partire*/
        if (i === (this.corsa[this.fermate].length - 1)) {
          accompagnatore[this.turno].fermataPartenzaId = this.corsa[this.fermate][i - 1].id;
        }
        this.openDialog(accompagnatore, direzione, true);
      } else {
        // aveva un turno prima e ha un turno anche adesso
        console.log('Modifica o elimina turno');
        console.log('Turno ID: ' + accompTemp[this.turno].id,
          ' da ' + accompTemp[this.turno].fermataPartenzaId,
          ' a ' + accompTemp[this.turno].fermataArrivoId);

        /* salva una copia del turno corrente: in caso di errore nell'operazione di modifica o eliminazione
        *  il turno dell'accompagnatore verrà ripristinato a questa versione */
        accompTemp[this.turnoBackup] = TurniComponent.newTurnoFrom(accompTemp[this.turno]);
        this.tempAccompagnatoriTurni.forEach(a => {
          if (a.id === accompTemp.id) {
            a[this.turnoBackup] = TurniComponent.newTurnoFrom(accompTemp[this.turno]);
          }
        });
        this.accompagnatoriTurni.forEach(a => {
          if (a.id === accompTemp.id) {
            a[this.turnoBackup] = TurniComponent.newTurnoFrom(accompTemp[this.turno]);
          }
        });
        this.openDialog(accompTemp, direzione, false);
      }
    }
  }

  /* =========================================================================================== */
  ngOnDestroy(): void {
    if (this.corsaTurniSub != null) {
      this.corsaTurniSub.unsubscribe();
      if (this.lineeSub != null) {
        this.lineeSub.unsubscribe();
      }
    }
    if (this.turnoAddSub != null) {
      this.turnoAddSub.unsubscribe();
    }
    if (this.turnoModifySub != null) {
      this.turnoModifySub.unsubscribe();
    }
    if (this.turnoDeleteSub != null) {
      this.turnoDeleteSub.unsubscribe();
    }
    if (this.dpTurni.opened) { this.dpTurni.close(); }

    this.websocketTurniService.disconnectWebSocket();
  }

}
