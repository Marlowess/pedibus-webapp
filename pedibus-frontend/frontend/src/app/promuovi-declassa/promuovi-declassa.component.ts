import { Component, OnDestroy, OnInit } from '@angular/core';
import { PromuoviDeclassa } from '../domain/promuovi-declassa-domain/PromuoviDeclassa';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { AccompOrAdmin } from '../domain/promuovi-declassa-domain/accomp-or-admin';
import { MatSnackBar } from '@angular/material';

/** Component visualizzabile solo dagli amministratori master per la modifica del ruolo
 * degli utenti accompagnatori e amministratori semplici (promozione e declassamento)
 */

/* ============================================================================================= */
// Service classes:
import { AmministratoreService } from '../services/amministratore-service/amministratore.service';
import { NotificationService } from '../services/notification-service/notification.service';
// tslint:disable-next-line:max-line-length
import { WebsocketPromozioneDeclassamentoAccompagnatoriService } from '../services/websocket-services/websocket-promozione-declassamento-accompagnatori/websocket-promozione-declassamento-accompagnatori.service';
import {Router} from '@angular/router';
import {getRuolo, openSnackBar} from '../config/util';

enum ACTION_MESSAGE {
  PROMOSSO = 'PROMOSSO',
  DECLASSATO = 'DECLASSATO'
}

@Component({
  selector: 'app-promuovi-declassa',
  templateUrl: './promuovi-declassa.component.html',
  styleUrls: ['./promuovi-declassa.component.css']
})
export class PromuoviDeclassaComponent implements OnInit, OnDestroy {

  promuoviDeclassa: PromuoviDeclassa = new PromuoviDeclassa(
    new Array<AccompOrAdmin>(), new Array<AccompOrAdmin>());
  /*linee: Array<string> = [];
  selectedLinea = '';*/
  linea = '';

  listaPromuovi: Array<AccompOrAdmin> = [];
  listaDeclassa: Array<AccompOrAdmin> = [];

  // promuoviDeclassaObs: Observable<any> = null;
  promuoviDeclassaSub: Subscription = null;
  promuoviObs: Observable<any>[] = [];
  promuoviSub: Subscription = null;
  declassaObs: Observable<any>[] = [];
  declassaSub: Subscription = null;
  /*lineeObs: Observable<any> = null;
  lineeSub: Subscription = null;*/

  private subHandlePromuoviDeclassaMessage: Subscription = null;

  constructor(
    private amministratoreService: AmministratoreService,
    private snackbar: MatSnackBar,
    private notificationService: NotificationService,
    private websocketPromozioneDeclassamentoAccompagnatoriService: WebsocketPromozioneDeclassamentoAccompagnatoriService,
    private router: Router
  ) { }

  /** richiede al server la lista delle linee amministrate dall'utente e la liste degli accompagnatori
   * e degli amministratori
   */
  ngOnInit() {
    if (getRuolo() !== 'amministratore master') {
      this.router.navigateByUrl('accesso-negato');
    }
    this.promuoviDeclassaSub = this.amministratoreService.getListePromuoviDeclassa()
      .subscribe({
        next: (data: any) => {
          /*this.linee =  data.linee_amministrate;
          this.selectedLinea = this.linee[0];*/
          this.linea = data.linee_amministrate;

          // tslint:disable-next-line:forin
          for (const key in data.accompagnatori) {
            const user = data.accompagnatori[key];
            this.promuoviDeclassa.accompagnatori.push(
              new AccompOrAdmin(user.id, user.nome, user.cognome, null, false) // user.linea
            );
          }
          // tslint:disable-next-line:forin
          for (const key in data.amministratori) {
            const user = data.amministratori[key];
            this.promuoviDeclassa.amministratori.push(
              new AccompOrAdmin(user.id, user.nome, user.cognome, this.linea, false) // user.linea
            );
          }
        },
        error: err => console.log(err),
        complete: () => {
          console.log('getListePromuoviDeclassa() completed');
          console.log('accompagnatori:', this.promuoviDeclassa.accompagnatori);
          console.log('amministratori:', this.promuoviDeclassa.amministratori);
        }
      });

    this.websocketPromozioneDeclassamentoAccompagnatoriService.openWebSocket();
    this.handlePromuoviOrDeclassaMessage();
  }

  /** Metodo che gestisce l'arrivo di una notifica riguardo alla promozione o al declassamento
   * di uno degli utenti nelle liste effettuato da un altro amministratore master
   */
  private handleActionMessage(messageData: any) {
    let index = -1;
    switch (messageData.action) {
      case ACTION_MESSAGE.PROMOSSO:
        // window.alert(`${messageData.action}`);
        // if (messageData.nomeLinea == this.linea) {
        index = this.promuoviDeclassa.accompagnatori.findIndex(a => a.id === messageData.id);
        if (index === -1) { return; }

        // const accom = this.promuoviDeclassa.accompagnatori[index];
        this.promuoviDeclassa.accompagnatori.splice(index, 1);

        break;
      case ACTION_MESSAGE.DECLASSATO:
        // window.alert(`${messageData.action}`);
        // if (messageData.nomeLinea == this.linea) {
        this.promuoviDeclassa.accompagnatori.push(new AccompOrAdmin(
          messageData.id, messageData.nome.split(' ')[0], messageData.nome.split(' ')[1], null, false
        ));
        // this.promuoviDeclassa.amministratori.splice(index, 1);
        // }
        break;
      default:
        return;
    }
  }

  /** Metodo in cui ci si iscrive alla coda di messaggi per ricevere notifiche riguardo a
   * operazioni effettuate da altri utenti sulla pagina visualizzata
   */
  private handlePromuoviOrDeclassaMessage() {
    this.subHandlePromuoviDeclassaMessage =
      this.notificationService.getNotificationPromozioneOrDeclassamentoAccompagnatore()
        .subscribe({
          next: (data) => {
            // console.debug(`${JSON.stringify(data)}`);
            if (data == null || data === undefined) { return; }

            this.handleActionMessage(data);
          },
          error: (err) => { console.error(`${JSON.stringify(err)}`); },
          // tslint:disable-next-line:no-console
          complete: () => { console.info(`complete`); }
        });
  }

  /** Invocata al click su un checkbox: aggiorna le liste di accompagnatori da promuovere
   * in base allo stato del checkbox relativo all'utente con id = id
   */
  promuoviCheckChanged(id: string) {
    const accompagnatore = this.promuoviDeclassa.accompagnatori.find(a => a.id === id);
    accompagnatore.selezionato = !accompagnatore.selezionato;
    if (accompagnatore.selezionato) {
      this.listaPromuovi.push(accompagnatore);
    } else {
      const i = this.listaPromuovi.findIndex(a => a.id === accompagnatore.id);
      this.listaPromuovi.splice(i, 1);
    }
    console.log('lista da promuovere:', this.listaPromuovi);
    console.log('accompagnatori:', this.promuoviDeclassa.accompagnatori);
    console.log('amministratori:', this.promuoviDeclassa.amministratori);
  }

  /** Invocata al click su un checkbox: aggiorna le liste di amministratori da declassare
   * in base allo stato del checkbox relativo all'utente con id = id
   */
  declassaCheckChanged(id: string) {
    const amministratore = this.promuoviDeclassa.amministratori.find(a => a.id === id);
    amministratore.selezionato = !amministratore.selezionato;
    if (amministratore.selezionato) {
      this.listaDeclassa.push(amministratore);
    } else {
      const i = this.listaDeclassa.findIndex(a => a.id === amministratore.id);
      this.listaDeclassa.splice(i, 1);
    }
    /*console.log('lista da declassare:', this.listaDeclassa);
    console.log('accompagnatori:', this.promuoviDeclassa.accompagnatori);
    console.log('amministratori:', this.promuoviDeclassa.amministratori);*/
  }

  /*onSelectLinea(linea: string, index: number) { }*/

  /** Invocata al click sul bottone 'Promuovi', per ogni acompagnatore nella lista da promuovere
   * manda al server il suo id, il nome della linea che dovrà amministrare e l'azione '1' (promuovi)
   */
  promuovi() {
    this.promuoviObs = [];
    this.listaPromuovi.forEach((accompagnatore: AccompOrAdmin) => {
      this.promuoviObs.push(this.amministratoreService.promuoviDeclassa(
        accompagnatore.id, this.linea, 1
      ));
    });

    let error = false;
    this.promuoviSub = forkJoin(this.promuoviObs).subscribe({
      next: value => {
        value.forEach(result => {
          if (result.error) {
            error = true;
            const accom = this.promuoviDeclassa.accompagnatori.find(a => a.id === result.userId);
            if (accom !== undefined) {
              accom.selezionato = false;
            } else {
              console.log('Utente non presente nella lista accompagnatori');
            }
          } else {
            const index = this.promuoviDeclassa.accompagnatori.findIndex(a => a.id === result.userId);
            const accom = this.promuoviDeclassa.accompagnatori[index];
            this.promuoviDeclassa.amministratori.push(new AccompOrAdmin(
              accom.id, accom.nome, accom.cognome, this.linea, false
            ));
            this.promuoviDeclassa.accompagnatori.splice(index, 1);
          }
        });
      },
      error: () => {
        // console.log('forkJoin error:', err);
      },
      complete: () => {
        // console.log('forkJoin complete');
        if (!error) {
          openSnackBar('Accompagnatori promossi correttamente', this.snackbar);
        } else {
          openSnackBar('Errore nella promozione di uno o più accompagnatori: ' +
            'elimina eventuali turni prima di promuovere ad admin', this.snackbar);
        }
        this.listaPromuovi = [];
        console.log('accompagnatori:', this.promuoviDeclassa.accompagnatori);
        console.log('amministratori:', this.promuoviDeclassa.amministratori);
      }
    });
  }

  /** Invocata al click sul bottone 'Declassa', per ogni amministratore nella lista da declassare
   * manda al server il suo id, il nome della linea che amministrava e lo stato '0' (declassa)
   */
  declassa() {
    this.declassaObs = [];
    this.listaDeclassa.forEach((admin: AccompOrAdmin) => {
      this.declassaObs.push(this.amministratoreService.promuoviDeclassa(
        admin.id, this.linea, 0
      ));
    });

    let error = false;
    this.declassaSub = forkJoin(this.declassaObs).subscribe({
      next: value => {
        value.forEach(result => {
          // console.log('C\'è stato un errore?', result.error);
          if (result.error) {
            error = true;
            const admin = this.promuoviDeclassa.amministratori.find(a => a.id === result.userId);
            if (admin !== undefined) {
              admin.selezionato = false;
            } else {
              console.log('Non c\'è nella lista admin');
            }
          } else {
            const index = this.promuoviDeclassa.amministratori.findIndex(a => a.id === result.userId);
            const admin = this.promuoviDeclassa.amministratori[index];
            this.promuoviDeclassa.accompagnatori.push(new AccompOrAdmin(
              admin.id, admin.nome, admin.cognome, null, false
            ));
            this.promuoviDeclassa.amministratori.splice(index, 1);
          }
        });
      },
      error: () => {
        // console.log('forkJoin error:', err);
      },
      complete: () => {
        if (!error) {
          openSnackBar('Amministratori declassati correttamente', this.snackbar);
        } else {
          openSnackBar('Errore nel declassamento di uno o più amministratori', this.snackbar);
        }
        this.listaDeclassa = [];
        /*console.log('lista da declassare:', this.listaDeclassa);
        console.log('accompagnatori:', this.promuoviDeclassa.accompagnatori);
        console.log('amministratori:', this.promuoviDeclassa.amministratori);*/
      }
    });
  }

  /** Metodo per disabilitare il bottone se lo stato degli accompagnatori non è cambiato */
  disablePromuovi(): boolean {
    let changed = false;
    this.promuoviDeclassa.accompagnatori.forEach(a => {
      if (a.selezionato) {
        changed = true;
      }
    });
    return !changed;
  }

  /** Metodo per disabilitare il bottone se lo stato degli amministratori non è cambiato */
  disableDeclassa() {
    let changed = false;
    this.promuoviDeclassa.amministratori.forEach(a => {
      if (a.selezionato) {
        changed = true;
      }
    });
    return !changed;
  }

  ngOnDestroy(): void {
    if (this.promuoviDeclassaSub != null) {
      this.promuoviDeclassaSub.unsubscribe();
    }
    if (this.promuoviSub != null) {
      this.promuoviSub.unsubscribe();
    }
    if (this.declassaSub != null) {
      this.declassaSub.unsubscribe();
    }
    if (this.subHandlePromuoviDeclassaMessage != null) {
      this.subHandlePromuoviDeclassaMessage.unsubscribe();
    }
    this.websocketPromozioneDeclassamentoAccompagnatoriService.disconnectWebSocket();
  }

}
