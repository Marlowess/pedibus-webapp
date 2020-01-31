import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {AuthService} from '../services/auth/auth.service';
import {Router} from '@angular/router';
import {FormBuilder, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material';
import {openSnackBar} from '../config/util';

/** Component visualizzato dopo aver cliccato sul link ricevuto via mail, in seguito alla
 * richiesta di una nuova password (click su 'Password dimenticata' in 'LoginForm')
 * Nell'URL contiene il token univoco generato dal server
 */

@Component({
  selector: 'app-nuova-password',
  templateUrl: './nuova-password.component.html',
  styleUrls: ['./nuova-password.component.css']
})
export class NuovaPasswordComponent implements OnInit, OnDestroy {

  /** Form per l'inserimento della nuova password */
  nuovaPasswordForm = this.fb.group({
    password: ['', Validators.compose([
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(20),
      Validators.pattern('.*[A-Z]+.*'),
      Validators.pattern('.*[0-9]+.*')
    ])],
    repeatedPassword: ['', Validators.compose([
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(20),
      Validators.pattern('.*[A-Z]+.*'),
      Validators.pattern('.*[0-9]+.*')
    ])],
  });

  subIsLogged: Subscription = null;
  newPwSub: Subscription = null;
  isLogged = false;
  submitted = false;

  hidePassword = true;
  hidePasswordR = true;

  constructor(
    private authService: AuthService,
    private router: Router,
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
  ) { }

  ngOnInit() {
  }

  /** Se l'utente è loggato viene rimandato alla home page per utenti loggati (HomeUser) */
  isLoggedIn() {
    // this.log(`isLoggedIn() is running...`);
    this.subIsLogged = this.authService.flagLogged.subscribe({
      next: (message) => {
        if (message === true) {
          // this.log(`isLoggedIn(): Yes`);
          if (this.router.url === 'login-form') {
            this.router.navigateByUrl('home-user');
          }
        } else {
          // this.log(`isLoggedIn(): No`);
        }
        this.isLogged = message;
      },
      error: (err) => console.log(err),
      complete: () => console.log('isLoggedIn(): done')
    });
  }

  /** Se il form è valido viene controllata l'uguaglianza fra le due password inserite,
   * se uguali, la nuova password viene mandata al server
   */
  onSubmit(event: any, form: any): boolean {
    if (event === null
      || form === null
      || !form.form.valid
      || !form.submitted
      || this.submitted === false) {
      event.preventDefault();
      return false;
    }

    const password: string = this.nuovaPasswordForm.value.password;
    const repeatedPassword: string = this.nuovaPasswordForm.value.repeatedPassword;

    // check if passwords entered are equals.
    if (password.localeCompare(repeatedPassword) !== 0) {
      this.submitted = false;
      return false;
    }

    const token = this.router.url.split('/')[2];

    this.newPwSub = this.authService.cambioPassword(token, password, repeatedPassword)
      .subscribe({
        next: () => {
          openSnackBar('Password modificata correttamente', this.snackbar);
          this.router.navigateByUrl('login-form');
          return true;
        },
        error: () => {
          openSnackBar('Errore nella modifica della password', this.snackbar);
          return false;
        },
        complete: () => {}
      });
  }

  ngOnDestroy(): void {
    if (this.subIsLogged != null) { this.subIsLogged.unsubscribe(); }
    if (this.newPwSub != null) { this.newPwSub.unsubscribe(); }
  }
}
