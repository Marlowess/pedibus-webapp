import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormBuilder, Validators} from '@angular/forms';
import {Subscription} from 'rxjs';
import {AuthService} from '../../services/auth/auth.service';
import {MatDialogRef, MatSnackBar} from '@angular/material';
import {openSnackBar} from '../../config/util';

/**
 * Dialog aperto quando l'utente clicca su 'Passsword dimenticata' nella vista di login.
 */

@Component({
  selector: 'app-dialog-recupera-password',
  templateUrl: './dialog-recupera-password.component.html',
  styleUrls: ['./dialog-recupera-password.component.css']
})
export class DialogRecuperaPasswordComponent implements OnInit, OnDestroy {

  /** Form per inserire l'email da inviare al server, in modo che possa inviare la mail che porta alla
   * vista per la creazione di una nuova password
   */
  recuperaPasswordForm = this.fb.group({
    email: ['', Validators.compose([Validators.required, Validators.email,
                Validators.minLength(5), Validators.maxLength(200)])],
  });

  submitted = false;
  sendEmailSub: Subscription = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private snackbar: MatSnackBar,
    public dialogRef: MatDialogRef<DialogRecuperaPasswordComponent>
  ) { }

  ngOnInit() {
  }

  /** In caso di form valido, chiama la funzione 'sendEmail' */
  onSubmit(event: any, form: any): boolean {
    if (event === null
      || form === null
      || !form.form.valid
      || !form.submitted
      || this.submitted === false) {
      event.preventDefault();
      return false;
    }
    this.sendEmail(this.recuperaPasswordForm.value.email);
    return true;
  }

  /** Manda l'email al server: in caso di esito positivo chiude il dialog, altrimenti visualizza solo l'errore */
  sendEmail(email: string) {
    this.sendEmailSub = this.authService.requestCambioPassword(email).subscribe({
      next: () => {
        openSnackBar('Email inviata con successo', this.snackbar);
        this.dialogRef.close();
      },
      error: err => {
        openSnackBar('Errore: ' + err.error.errore, this.snackbar);
      },
      complete: () => {}
    });
  }

  /** Chiude il dialog senza apportare modifiche */
  annulla() {
    this.dialogRef.close();
  }

  ngOnDestroy(): void {
    if (this.sendEmailSub != null) { this.sendEmailSub.unsubscribe();}
  }

}
