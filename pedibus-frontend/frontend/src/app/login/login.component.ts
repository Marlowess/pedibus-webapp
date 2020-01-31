/* ============================================================================================= */
/*                                       ANGULAR IMPORTS                                         */
/* ============================================================================================= */
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs/Subscription';
import { Validators } from '@angular/forms';


/* ============================================================================================= */
/*                                       OUR PROJETC IMPORTS                                     */
/* ============================================================================================= */
// - Services:
import { AuthService } from '../services/auth/auth.service';
// import { LoginService } from '../services/login-service/login.service';
import { NotificationService } from '../services/notification-service/notification.service';
import { WebsocketNotificationService } from '../services/websocket-notification/websocket-notification.service';

// - Utils:
import { Util } from '../config/util';
import {MatDialog} from '@angular/material';
import {DialogRecuperaPasswordComponent} from '../dialogs/dialog-recupera-password/dialog-recupera-password.component';

/* ============================================================================================= */
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {

  // - Here, private component's attributes
  private allowedLog = true;

  // - Here, public component's attributes
  public response: any = null;
  public loginFailed = false;
  public loginModel: any = null;

  // boolean flag used during debug mode, mainly.
  public submitted = false;

  // boolean flags for checking if show passwords or
  // not while compiling them.
  public hidePassword = true;

  requestCambioPW: Subscription = null;

  public subIsLogged: Subscription = null;
  public isLogged: Boolean = false;

  // public variable exploited for building a form with validation
  // automatically embedded within it.
  profileForm = this.fb.group({
    email: ['', Validators.compose([
      Validators.required,
      Validators.email,
      Validators.minLength(5),
      Validators.maxLength(200)
    ])],
    password: ['', Validators.compose([
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(20),
      Validators.pattern('.*[A-Z]+.*'),
      Validators.pattern('.*[0-9]+.*')
    ])]
  });

  /* ============================================================================================= */
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    // private loginService: LoginService,
    private wsService: WebsocketNotificationService,
    private notificationService: NotificationService,
    private dialog: MatDialog
  ) {
    const msg = `[LoginComponent] constructor()`;
    Util.customLog(this.allowedLog, Util.LogType.INFO, msg, 'running!');
  }

  /* ============================================================================================= */
  ngOnInit() {
    const msg = `[LoginComponent] ngOnInit()`;
    Util.customLog(this.allowedLog, Util.LogType.INFO, msg, 'running!');
    const res = this.authService.isLoggedInForLogin(this.router.url);
    // window.alert(res);
    if (res) {
      console.log('============================');
      this.router.navigateByUrl('home-user');
    }
  }

  /* ============================================================================================= */
  /**
   * The main target of onSubmit() function is to verify if
   * user correctly entered all the form's fields required
   * to enable the browser to send out a well structured form submission.
   *
   * @param event : event triggered when user handles form fields;
   * @param form : parameter representing form model object;
   */
  onSubmit(event: any, form: any): boolean {
    // this.log(`onSubmit() is running...`);
    // if submission has not been done return false.
    if (event === null
      || form === null
      || !form.form.valid
      || !form.submitted
      || this.submitted === false) {
      event.preventDefault();
      return false;
    }
    this.loginModel = this.profileForm.value;
    const password: string = this.loginModel.password;
    this.doLogin();
    return true;
  }

  /* ============================================================================================= */
  /**
   * The purpose of getErrorMessage() function is to control
   * if the input inserted by user within a form field matches
   * the validation constraints initially established when
   * creating and initializing form group variable.
   */
  getErrorMessage(): string {
    // //this.log(`getErrorMessageEmail() is running...`);
    let res: string = null;
    Object.keys(this.profileForm.controls).forEach(key => {
      // this.profileForm.controls[key].markAsDirty();
      if (this.profileForm.get(key).hasError('require') && this.profileForm.get(key).touched) {
        res = 'Inserire un valore';
      }
      if (this.profileForm.get(key).hasError('email') && this.profileForm.get(key).touched) {
        res = 'Email non valida';
      }
    });
    return res;
  }

  /* ============================================================================================= */
  /**
   * log function: main usage for tracking class operations,
   * it receives a string parameter as input argument called
   * msg, that stands for a messagge we what show by means
   * of console.log built-in JS function, on the console log.
   *
   * @param msg : string parameter;
   */
  log(msg: string): void {
    // console.log(`->  Pedibus Login Form: ${msg}`);
  }

  // get diagnostic() { return JSON.stringify(this.loginModel); }

  /* ============================================================================================= */
  /**
   * Il metodo login del componente login.component viene invocata dal metodo della medisima classe chiamato
   * 'onSubmit' per procedere con la chiamata al metodo 'login' del serivizio di autenticazione AuthService
   * affinche' l'utente possa eseguire con successo il login all'interno dell'applicazione.
   *
   * In particolare, il metodo utilizza i dati presenti all'interno dell'attributo del componente,
   * chiamata loginModel, per passarli come parametri al metodo 'login' del servizio di autenticazione,
   * contestualmente si sottoscrivera' per attendere la risposta che comunica l'esito della fase di login
   * che potra' terminare con successo, se i dati sono corretti e quindi la password fornita e' correttamente
   * associata all'indirizzo email indicato, oppure con insuccesso se i dati forniti non corrispondono lato server.
   */
  doLogin() {
    // this.log('login() is running...');
    const val = this.loginModel;

    if (val.email && val.password) {
      // this.authService.login(val.email, val.password)
      this.authService.login(val.email, val.password)
        .subscribe({
          next: (data) => {
            // console.log('risposta:', data);
            // console.log(data);
            if (data === null) {
              // console.log('User is not logged in');
              this.loginFailed = true;
              this.notificationService.signalNotificationLogin(false);
            } else {
              this.loginFailed = false;
              this.response = data;
              this.wsService.openWebSocket();
              // this.authService.setSession(data.token);
              this.notificationService.signalNotificationLogin(true);
            }
          },
          error: () => {
            // console.log('Error Login Component: login()', err);
            this.loginFailed = true;
          },
          complete: () => {
            // console.log('login(): done');
            if (!this.loginFailed) {
              this.redirectUserToHome();
            }
          }
        });
    }
  }

  /* ============================================================================================= */
  /**
   * Il metodo 'isLoggedIn' viene interrogato per scoprire se l'utente che visita la pagina di login e' gia'
   * autenticato oppure no.
   *
   * Nel primo caso verra' rediretto verso la schermata di home dell'utente, altrimenti l'utente rimarra'
   * all'interno della pagina di login per proseguire nella compilazione del form da sottomettere se intenzionato
   * a loggarsi.
   */
  isLoggedIn() {
    // this.log(`isLoggedIn() is running...`);
    this.subIsLogged = this.authService.flagLogged.subscribe({
      next: (message) => {
        if (message === true) {
          // this.log(`isLoggedIn(): Yes`);
          if (this.router.url === 'login-form') {
            this.redirectUserToHome();
          }
        } else {
          // this.log(`isLoggedIn(): No`);
        }
        this.isLogged = message;
      },
      error: (err) => console.log(err),
      complete: () => console.log('isLoggedIn(): done')
    });
    // return this.authService.isLoggedIn();
  }

  /* ============================================================================================= */
  isNotLogged() {
    // this.log(`isLoggedIn() is running...`);
    this.subIsLogged = this.authService.flagLogged.subscribe({
      next: (message) => {
        if (message === true) {
          // this.log(`isLoggedIn(): Yes`);
          // this.redirectUserToHome();
        } else {
          // this.log(`isLoggedIn(): No`);
          this.redirectUserToLogin();
        }
        this.isLogged = message;
      },
      error: (err) => console.log(err),
      complete: () => console.log('isLoggedIn(): done')
    });
    // return this.authService.isLoggedIn();
  }

  /** Invocato al click sulla label 'Password dimenticata', apre il dialog per l'invio dell'email
   * al server, che invierà una mail contenente l'URL (con token) che rimanda al form per la creazione
   * di una nuova password per l'utente
   */
  openDialogPwDimenticata() {
    this.dialog.open(DialogRecuperaPasswordComponent, {
      panelClass: 'dialog',
      width: '350px'
    });
  }


  /* ================================================================================================ */
  /* Funzioni per la redirezione dell'utente alla home o al login in base al suo stato (loggato o no) */
  /* ================================================================================================ */
  redirectUserToHome() {
    this.router.navigateByUrl('home-user');
  }
  redirectUserToLogin() {
    const homePageUser = 'login-form';
    this.router.navigateByUrl(`${homePageUser}`);
  }

  /* ============================================================================================= */
  ngOnDestroy() {
    // console.log('destroy login component');
    if (this.subIsLogged != null) {
      this.subIsLogged.unsubscribe();
    }
  }
}
