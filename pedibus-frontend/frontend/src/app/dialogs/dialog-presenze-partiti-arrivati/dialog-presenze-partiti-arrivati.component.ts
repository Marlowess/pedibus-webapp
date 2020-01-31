import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';

/** Dialog utilizzato per settare sul server il booleano che indica:
 * - all'andata che tutti i bambini sono arrivati a scuola, cioè che la corsa di andata è stata completata.
 * - al ritorno che si è partiti da scuola
 */

@Component({
  selector: 'app-dialog-presenze2',
  templateUrl: './dialog-presenze-partiti-arrivati.component.html',
  styleUrls: ['./dialog-presenze-partiti-arrivati.component.css']
})
export class DialogPresenzePartitiArrivatiComponent implements OnInit {

  direzione: number;

  constructor(
    public dialogRef: MatDialogRef<DialogPresenzePartitiArrivatiComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) { }

  ngOnInit() {
    this.direzione = this.data.dir;
  }

  conferma() {
    return {
      pick: true
    };
  }

  /** Chiude il dialog senza apportare modifiche */
  annulla() {
    this.dialogRef.close();
  }

}
