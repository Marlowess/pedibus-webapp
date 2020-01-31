import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { Validators } from '@angular/forms';
import { RegistrationService } from '../services/registration-service/registration.service';
import { Subscription } from 'rxjs'; // Observable

import { Router } from '@angular/router';
import {AuthService} from '../services/auth/auth.service';

@Component({
  selector: 'app-registration-form',
  templateUrl: './registration-form.component.html',
  styleUrls: ['./registration-form.component.css']
})
export class RegistrationFormComponent implements OnInit, OnDestroy {

  // public parameter for storing registration info.
  registrationModel: any = null;

  public registrationFailed = false;

  // boolean flag used during debug mode, mainly.
  submitted = false;

  // boolean flags for checking if show passwords or
  // not while compiling them.
  hidePassword = true;
  // tslint:disable-next-line:variable-name
  hidePasswordR = true;

  private data: any;
  private error: any;

  private subIsLogged: Subscription = null;
  private resHttpPost: Subscription = null;

  // public variable exploited for building a form with validation
  // automatically embedded within it.
  profileForm = this.fb.group({
    firstName: ['', Validators.compose([
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(20)
    ])],
    lastName: ['', Validators.compose([
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(20)
    ])],
    email: ['', Validators.compose([
      Validators.required,
      Validators.email,
      Validators.minLength(5),
      Validators.maxLength(200)
    ])],
    acceptedConditions: [false, Validators.required],
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

  constructor(
    private fb: FormBuilder,
    private registrationService: RegistrationService,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // this.log(`ngOnInit() is running...`);
  }

  // ======================================================================================================= //
  /**
   * Il metodo 'isLoggedIn' viene interrogato per scoprire se l'utente che visita la pagina di login e' gia'
   * autenticato oppure no.   *
   * Nel primo caso verra' rediretto verso la schermata di home dell'utente, altrimenti l'utente rimarra'
   * all'interno della pagina per proseguire nella compilazione del form da sottomettere se intenzionato
   * a registrarsi.
   */
  isLoggedIn() {
    this.subIsLogged = this.authService.flagLogged.subscribe({
      next: (message) => {
        if (message === true) {
          this.router.navigateByUrl('home-user');
        }
      },
      error: (err) => console.log(err),
      complete: () => console.log('isLoggedIn(): done')
    });
  }

  /**
   * The main target of onSubmit() function is to verify if
   * user correctly entered all the form's fields required
   * to enables the browser to send out a well structured form submission.
   *
   * @param event : event triggerend when user handles form fields;
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

    this.registrationModel = this.profileForm.value;

    const password: string = this.registrationModel.password;
    const repeatedPassword: string = this.registrationModel.repeatedPassword;

    // check if passwords entered are equals.
    if (password.localeCompare(repeatedPassword) !== 0) {
      // this.log(`onSubmit() - message: differnet passwords ${password} != ${repeatedPassword}`);
      this.submitted = false;
      return false;
    }

    const token = this.router.url.split('/')[2];

    this.resHttpPost = this.registrationService.submmitFormRegistration(this.registrationModel, token)
      .subscribe({
        next: (response: any) => {

          if (response.error !== undefined && response.error === true) {
            this.registrationFailed = true;
          } else {
            this.data = response;
            this.registrationFailed = false;

            const homePageUser = 'login-form';
            this.router.navigateByUrl(`${homePageUser}`);
          }
        },
        error: () => {
          this.registrationFailed = true;
        },
        complete: () => this.error = 'error',
      });
    return false;
    // return true;
  }

  // ========================================================================================================= //

  /**
   * The purpose of getErrorMessage() function is to control
   * if the input inserted by user within a form field matches
   * the validation constraints initially established when
   * creating and initializing form group variable.
   */
  getErrorMessage(): string {
    // this.log(`getErrorMessageEmail() is running...`);

    let res: string = null;

    Object.keys(this.profileForm.controls).forEach(key => {
      // this.profileForm.controls[key].markAsDirty();

      if (this.profileForm.get(key).hasError('require') && this.profileForm.get(key).touched) {
        res = 'You must enter a value';
      }

      if (this.profileForm.get(key).hasError('email') && this.profileForm.get(key).touched) {
        res = 'Not a valid email';
      }
    });

    // if (this.profileForm.controls['email'].hasError('require') && this.profileForm.controls['email'].touched)
    //   return 'You must enter a value';

    // if (this.profileForm.controls['email'].hasError('email') && this.profileForm.controls['email'].touched)
    //   return 'Not a valid email';
    // this.log(`getErrorMessageEmail(): answer = ${res}`);
    return res;
  }

  // ====================================================================================================================== //

  /**
   * log function: main usage for tracking class operations,
   * it receives a string parameter as input argument called
   * msg, that stands for a messagge we what show by means
   * of console.log built-in JS function, on the console log.
   *
   * @param msg : string parameter;
   */
  log(msg: string): void {
    // console.log(`>  Pedibus Register Form: ${msg}`);
  }

  // get diagnostic() { return JSON.stringify(this.registrationModel); }

  // get diagnosticHttpPostAnswer() {
  // return JSON.stringify(this.resHttpPost);
  // return JSON.stringify(this.registrationService.getDataError());

  // }

  ngOnDestroy() {
    // console.log('destroy registration component');
    if (this.resHttpPost != null) {
      this.resHttpPost.unsubscribe();
    }
    if (this.subIsLogged != null) {
      this.subIsLogged.unsubscribe();
    }
  }

}
