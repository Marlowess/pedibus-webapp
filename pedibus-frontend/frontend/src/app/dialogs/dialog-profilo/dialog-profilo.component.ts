import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {MatDialogRef} from '@angular/material';

/**
 * Dialog per l'aggiunta di un nuovo bambino nella vista 'Profilo' del genitore
 */

@Component({
  selector: 'app-dialog-profilo',
  templateUrl: './dialog-profilo.component.html',
  styleUrls: ['./dialog-profilo.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class DialogProfiloComponent implements OnInit {

  /** Form per inserire il nome e il cognome del bambino da aggiungere */
  bambinoForm = this.fb.group({
    nome: ['', Validators.compose([
      Validators.required, Validators.minLength(2), Validators.maxLength(20)])],
    cognome: ['', Validators.compose([
      Validators.required, Validators.minLength(2), Validators.maxLength(20)])]
  });

  bambino = '';
  submitted = false;

  constructor(
    public dialogRef: MatDialogRef<DialogProfiloComponent>,
    private fb: FormBuilder,
  ) { }

  ngOnInit() {
  }

  /** In caso di form valido, concatena il nome e il cognome del bambino in un'unica stringa,
   * che manda in chiusura al component 'Profilo'
   */
  onSubmit(event: any, form: any): boolean {
    // console.log('submit');

    if (event === null
      || form === null
      || !form.form.valid
      || !form.submitted
      || this.submitted === false) { // || this.submitted === false
      event.preventDefault();
      return false;
    }

    // console.log(this.bambinoForm.value.nome + ' ' + this.bambinoForm.value.cognome);
    this.bambino = this.bambinoForm.value.nome + ' ' + this.bambinoForm.value.cognome;
    this.dialogRef.close(this.bambino);
    // this.aggiungi();
    return true;
  }

  /*aggiungi() {
    // this.dialogRef.close();
    return {
      pick: true,
      bambino: this.bambino
    };
  }*/

  /** Chiude il dialog senza apportare modifiche */
  annulla() {
    this.dialogRef.close();
  }

}
