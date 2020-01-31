import {Component, OnDestroy, OnInit} from '@angular/core';
import {Utente} from '../domain/gestione-utenti-domain/utente';
import {Subscription} from 'rxjs';
import {GestioneUtentiService} from '../services/gestione-utenti-service/gestione-utenti.service';
import {FormBuilder, Validators} from '@angular/forms';
import {MatSnackBar} from '@angular/material';
import {getRuolo, openSnackBar} from '../config/util';
import {Router} from '@angular/router';

/** Component utilizzato dalla segreteria per registrare nuovi utenti al sistema */

@Component({
  selector: 'app-gestione-utenti',
  templateUrl: './gestione-utenti.component.html',
  styleUrls: ['./gestione-utenti.component.css']
})
export class GestioneUtentiComponent implements OnInit, OnDestroy {

  // emailInserita = false;
  submitted = false;
  utenteInserito = false;
  nuovoUtente = false;
  utente: Utente = new Utente(null, null);
  ruoli = ['Genitore', 'Accompagnatore', 'Amministratore', 'Amministratore Master'];
  ruoloPlaceholder: string = null;
  // ruoloBackup: string = null;
  ruoloChanged = false;
  cercaUtenteSub: Subscription = null;
  utenteSub: Subscription = null;

  /** Form per aggiungere l'email dell'utente che si vuole registrare */
  profileForm = this.fb.group({
    email: ['', [Validators.required, Validators.email,
                 Validators.minLength(5), Validators.maxLength(200)]],
  });
  utenteAggiunto = false;

  constructor(
    private gestioneUtentiService: GestioneUtentiService,
    private fb: FormBuilder,
    private snackbar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit() {
    if (getRuolo() !== 'segreteria') {
      this.router.navigateByUrl('accesso-negato');
    }
  }

  ngOnDestroy(): void {
    if (this.utenteSub != null) {
      this.utenteSub.unsubscribe();
    }
    if (this.cercaUtenteSub != null) {
      this.cercaUtenteSub.unsubscribe();
    }
  }

  /*checkEmailInserita(email: string) {
    this.emailInserita = email !== '';
  }*/

  /** Se il form è valido si iscrive all'observable del servizio che si occupa di chiedere al server
   * il ruolo di quell'utente: in caso di esito positivo restituisce il ruolo dell'utente, ciò indica che
   * l'utente è già stato registrato, altrimenti restituisce un errore, cioè che l'utente non ha ancora
   * un ruolo e può essere registrato
   */
  cercaOppureAggiungi(event: any, form: any): boolean {
    // (email: string)
    // if (email !== '') {
    if (event === null
      || form === null
      || !form.form.valid
      || !form.submitted
      || this.submitted === false) {
      event.preventDefault();
      return false;
    }
    const email: string = this.profileForm.value.email;
    // console.log(email);
    this.cercaUtenteSub = this.gestioneUtentiService.getUtente(email).subscribe({
      next: (value: any) => {
        // utente già registrato
        this.nuovoUtente = false;
        const r = getRuolo(value.ruolo);
        this.utente = new Utente(email, r.charAt(0).toUpperCase() + r.slice(1));
        this.utenteInserito = true;
        this.profileForm.reset();
        return true;
      },
      error: () => {
        // utente nuovo: 400 bad request
        // console.log(err);
        this.nuovoUtente = true;
        this.ruoloPlaceholder = this.ruoli[0];
        this.utente = new Utente(email, this.ruoloPlaceholder);
        this.utenteInserito = true;
        this.profileForm.reset();
        return true;
      },
      complete: () => {
        // console.log('cercaUtente completato');
      }
    });
  }

  onSelectRuolo(ruolo: string) {
    this.utente.ruolo = ruolo;
    this.ruoloChanged = true;
  }

  /** Manda al server le informazioni sull'utente da registrare (email e password)
   * In caso di esito positivo setta il booleano 'utenteAggiunto' che cambia l'aspetto
   * della vista (non c'è più la possibilità di selezionare un ruolo)
   */
  salvaUtente() {
    if (this.nuovoUtente === true) {
      this.utenteSub = this.gestioneUtentiService.addUtente(
        this.utente.indirizzoEmail, this.ruoli.indexOf(this.utente.ruolo))
        .subscribe({
          next: () => {
            this.utenteAggiunto = true;
            openSnackBar('Utente aggiunto correttamente', this.snackbar);
          },
          error: () => {
            // console.log(err);
            openSnackBar('Errore nell\'aggiunta dell\'utente', this.snackbar);
          },
          complete: () => { console.log('utenteObs completato'); }
        });
    }
  }

  /** Resetta i booleani che gestiscono la vista */
  reset() {
    this.utente = new Utente(null, null);
    this.nuovoUtente = false;
    this.utenteInserito = false;
    this.submitted = false;
    this.ruoloChanged = false;
    this.utenteAggiunto = false;
  }

  /** Messaggi di errore se il form non è valido */
  getErrorMessage(): string {
    let res: string = null;
    Object.keys(this.profileForm.controls).forEach(key => {
      if (this.profileForm.get(key).hasError('require') && this.profileForm.get(key).touched) {
        res = 'Inserire una email';
      }
      if (this.profileForm.get(key).hasError('email') && this.profileForm.get(key).touched) {
        res = 'Email non valida';
      }
    });
    return res;
  }


}
