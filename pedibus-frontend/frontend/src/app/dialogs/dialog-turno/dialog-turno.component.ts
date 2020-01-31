import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material';
import { AccompagnatoreConTurni } from '../../domain/turno-domain/accompagnatore-con-turni';
import { Turno2 } from '../../domain/turno-domain/turno2';
import { FermataLogic } from '../../domain/fermata-logic';

/** Dialog per la creazione, modifica o eliminazione di un turno di un accompagnatore */

@Component({
  selector: 'app-dialog-turno',
  templateUrl: './dialog-turno.component.html',
  styleUrls: ['./dialog-turno.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DialogTurnoComponent implements OnInit {

  constructor(
    public dialogRef: MatDialogRef<DialogTurnoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) { }

  new = false;
  accompagnatore: AccompagnatoreConTurni;
  idTurno: string; idAccomp: string;
  nomeCognome: string;
  turno: Turno2;
  turnoDirezione: string;

  // tutte le possibili fermate fra cui posso scegliere
  fermatePartenza: FermataLogic[];
  fermateArrivo: FermataLogic[];

  fermataPartenzaID: string;
  fermataPartenzaNome: string;
  fermataArrivoID: string;
  fermataArrivoNome: string;

  disableOK: boolean;

  /** Assegno i dati passati dal component 'Turni' alle variabili locali del dialog */
  ngOnInit() {
    // aggiungi nuova prenotazione (new === true) oppure modificane o eliminane una (new === false)
    this.new = this.data.is_new;
    this.turnoDirezione = this.data.direzione;
    this.accompagnatore = this.data.accomp;
    this.nomeCognome = this.accompagnatore.nome + ' ' + this.accompagnatore.cognome;
    this.turno = this.accompagnatore[this.turnoDirezione];
    // console.log(this.turno.id);
    if (this.new) {
      // this.accompagnatore[this.turnoDirezione].id = 'tempID';
      this.turno.userId = this.accompagnatore.id;
      this.disableOK = false;
    } else {
      this.disableOK = true;
    }
    this.turno.confermato = false;
    this.idTurno = this.turno.id;
    this.idAccomp = this.turno.userId;

    this.resetFermatePartenza(); this.resetFermateArrivo();

    // if (this.turno.fermataPartenzaId !== null) {
    this.fermataPartenzaID = this.turno.fermataPartenzaId;
    this.fermataPartenzaNome = this.fermatePartenza.find(fermata =>
      fermata.idFermata === this.turno.fermataPartenzaId).nome;
    /*} else {
      this.fermataPartenzaID = this.fermatePartenza[0].idFermata;
      this.fermataPartenzaNome = this.fermatePartenza[0].nome;
    }*/

    if (this.turno.fermataArrivoId !== null) {
      this.fermataArrivoID = this.turno.fermataArrivoId; console.log(this.fermataArrivoID);
      this.fermataArrivoNome = this.fermateArrivo.find(fermata =>
        fermata.idFermata === this.turno.fermataArrivoId).nome;
    } else {
      const fermataArrivo = this.fermateArrivo[this.fermatePartenza.findIndex(
        fermata => fermata.idFermata === this.fermataPartenzaID)];
      this.fermataArrivoID = fermataArrivo.idFermata;
      this.fermataArrivoNome = fermataArrivo.nome;
    }

    this.fermateArrivo = this.fermateArrivo.slice(
      this.fermatePartenza.findIndex(f => f.idFermata === this.fermataPartenzaID), this.fermateArrivo.length
    );
    this.fermatePartenza = this.fermatePartenza.slice(0, this.fermatePartenza.length);
  }

  /** Selezione della fermata di partenza del turno: cambia anche le fermate di arrivo selezionabili */
  onSelectPartenza(fermata: FermataLogic) {
    if (fermata.idFermata !== this.fermataPartenzaID) {
      this.disableOK = false;
    }
    this.fermataPartenzaID = fermata.idFermata;
    this.fermataPartenzaNome = fermata.nome;

    this.resetFermateArrivo();
    const indiceSalita = this.fermateArrivo.findIndex(f => f.idFermata === this.fermataPartenzaID);
    if (indiceSalita !== -1) {
      // console.log('cambia fermate di arrivo');
      this.fermateArrivo = this.fermateArrivo.slice(indiceSalita + 1, this.fermateArrivo.length);

      if (this.fermataPartenzaID >= this.fermataArrivoID) {
        /*se scelgo come salita una fermata successiva a quella di discesa
        correggo in automatico quella di discesa mettendola a quella successiva*/
        // const discesa = this.fermateD[indiceSalita];
        // console.log('slitta');
        this.fermataArrivoID = this.fermateArrivo[0].idFermata; // fermateD
        this.fermataArrivoNome = this.fermateArrivo[0].nome; // fermateD
        // console.log('nuova discesa slittata: ' + this.fermataArrivoNome);
      }
    }
    /*console.log('nuove possibili fermate di arrivo: ');
    this.fermateArrivo.forEach(f => console.log(f.nome, f.idFermata));*/
  }

  /** Selezione della fermata di arrivo del turno: cambia anche le fermate di partenza selezionabili */
  onSelectArrivo(fermata: FermataLogic) {
    if (fermata.idFermata !== this.fermataArrivoID) {
      this.disableOK = false;
    }
    this.fermataArrivoID = fermata.idFermata;
    this.fermataArrivoNome = fermata.nome;

    this.resetFermatePartenza();
    const indiceDiscesa = this.fermatePartenza.findIndex(f => f.idFermata === this.fermataArrivoID);
    // console.log(indiceDiscesa);
    if (indiceDiscesa !== -1) {
      // console.log('cambia fermate di partenza');
      this.fermatePartenza = this.fermatePartenza.slice(0, indiceDiscesa); // fermateS
      if (this.fermataArrivoID <= this.fermataPartenzaID) {
        /*se scelgo come discesa una fermata precedente a quella di salita
        correggo in automatico quella di salita mettendola a quella precedente*/
        // console.log('slitta');
        this.fermataPartenzaID = this.fermatePartenza[this.fermatePartenza.length - 1].idFermata; // fermateS
        this.fermataPartenzaNome = this.fermatePartenza[this.fermatePartenza.length - 1].nome; // fermateS
        // console.log('nuova salita slittata: ' + this.fermataPartenzaNome);
      }
    }
    /*console.log('nuove possibili fermate di partenza:');
    this.fermatePartenza.forEach(f => console.log(f.nome, f.idFermata));*/
  }

  /** Manda in chiusuta il nuovo turno o il turno modificato al server */
  ok() {
    return {
      pick: true,
      fermataSalitaID: this.fermataPartenzaID,
      fermataDiscesaID: this.fermataArrivoID,
      // nuovoTurno: this.accompagnatore[this.turnoDirezione]
      turnoId: this.idTurno,
      accompagnatoreId: this.idAccomp
    };
  }

  /** Chiude il dialog senza apportare modifiche */
  annulla(): void {
    this.dialogRef.close();
  }

  /** Indica al server, in chiusura, che ha eliminato il turno con id = turnoId, settando gli id delle
   * fermate di salita e discesa a null
   */
  elimina() { // turno eliminato
    /*this.accompagnatore[this.turnoDirezione] = new Turno2(
      null, null, null, null, null,
      null, null, null
    );*/
    return {
      pick: true,
      fermataSalitaID: null,
      fermataDiscesaID: null,
      // nuovoTurno: this.accompagnatore[this.turnoDirezione]
      turnoId: this.idTurno, // null
      accompagnatoreId: this.idAccomp
    };
  }

  /** Funzioni per resettare le fermate di partenza e di arrivo selezionabili */

  resetFermatePartenza() {
    this.fermatePartenza = [];
    this.data.ferm.forEach(fermata => {
      this.fermatePartenza.push(new FermataLogic(fermata.id, fermata.nome));
    });
    this.fermatePartenza = this.fermatePartenza.slice(0, this.fermatePartenza.length - 1);
    /*console.log('possibili fermate di partenza (reset): ');
    this.fermatePartenza.forEach(f => console.log(f.nome, f.idFermata));*/
  }

  resetFermateArrivo() {
    this.fermateArrivo = [];
    this.data.ferm.forEach(fermata => {
      this.fermateArrivo.push(new FermataLogic(fermata.id, fermata.nome));
    });
    this.fermateArrivo = this.fermateArrivo.slice(1, this.fermateArrivo.length);
    /*console.log('possibili fermate di arrivo (reset): ');
    this.fermateArrivo.forEach(f => console.log(f.nome, f.idFermata));*/
  }

}
