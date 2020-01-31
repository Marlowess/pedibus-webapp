import { Component, OnInit, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Fermata } from '../../domain/presenze-domain/fermata';

/**
 * Dialog aperto quando l'utente accompagnatore clicca sul nome di un bambino che non era stato prenotato
 * dai genitori in una corsa, all'andata o al ritorno. In questo dialog l'accompagnatore può creare una
 * prenotazione per il bambino, scegliendo, nel caso la direzione sia al ritorno,
 * la fermata di arrivo (il bambino partirà da scuola, quindi la fermata di partenza sarà settata in automatico
 * dal server). Nel caso invece sia all'andata, la fermata di partenza sarà quella in cui il nome del bambino
 * è stato cliccato
 */

export interface DialogData {
  dir: string;
  bambino: string;
  fermata: string;
  fermate: Array<Fermata>;
}

enum DIRECTION_ {
  FORWARD = '0',
  BACKWARD = '1',
}

@Component({
  selector: 'app-dialog-overview-example-dialog',
  templateUrl: './dialog-presenze-nuova-prenotazione.component.html',
  styleUrls: ['./dialog-presenze-nuova-prenotazione.component.css']
})
// tslint:disable-next-line:component-class-suffix
export class DialogPresenzeNuovaPrenotazione implements OnInit {

  public fermataArrivoID: string = null;
  public fermataArrivoNome: string = null;

  public DIRECTION = DIRECTION_;

  constructor(
    public dialogRef: MatDialogRef<DialogPresenzeNuovaPrenotazione>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
  ) { }

  ngOnInit() {
    if (this.data.dir === this.DIRECTION.BACKWARD) {
      this.fermataArrivoID = this.data.fermate[0].fermataID;
      this.fermataArrivoNome = this.data.fermate[0].indirizzo;
    }
  }

  /** Metodo per selezionare la fermata di arrivo */
  onSelectArrivo(fermata: Fermata) {
    this.fermataArrivoID = fermata.fermataID;
    this.fermataArrivoNome = fermata.indirizzo;
  }

  /** Conferma la creazione della nuova prenotazione, innescando nel server l'invio di una comunicazione
   * al genitore del bambino in questione
   */
  conferma() {
    if (this.DIRECTION.BACKWARD === this.data.dir) {
      return {
        pick: true,
        fermataArrivoID: this.fermataArrivoID,
      };
    } else {
      return {
        pick: true,
        fermataArrivoID: null
      };
    }
  }

  /** Chiude il dialog senza apportare modifiche */
  annulla(): void {
    this.dialogRef.close();
  }

}
