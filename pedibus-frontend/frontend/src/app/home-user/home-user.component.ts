import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';
import {ruoli} from '../config/config';

/** Home page per gli utenti loggati */

@Component({
  selector: 'app-home-user',
  templateUrl: './home-user.component.html',
  styleUrls: ['./home-user.component.css']
})
export class HomeUserComponent implements OnInit, OnDestroy {

  public userEmail: string = null;
  public ruolo: string = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit() {
    this.userEmail = this.authService.getToken();
    this.ruolo = this.authService.getRuolo();
  }

  /** === Funzioni per visualizzare bottoni per viste diverse in base al ruolo dell'utente loggato === */

  isGenitore() {
    return this.ruolo === ruoli.genitore;
  }

  isAccompagnatore() {
    return this.ruolo === ruoli.accompagnatore;
  }

  isAmministratore() {
    return this.ruolo === ruoli.amministratore;
  }

  isAmministratoreMaster() {
    return this.ruolo === ruoli.amministratoreMaster;
  }

  isSegreteria() {
    return this.ruolo === ruoli.segreteria;
  }

  /** === Funzioni invocate al click sulle card 'azioni', rimandano alle viste corrispondenti === */

  RedirectPresenze() {
    this.router.navigateByUrl('accompagnatore/presenze');
  }

  RedirectDisponibilita() {
    this.router.navigateByUrl('accompagnatore/disponibilita');
  }

  RedirectPrenotazioni() {
    const redirectPrenotazioni = 'genitore/prenotazioni';
    this.router.navigateByUrl(`${redirectPrenotazioni}`);
  }

  RedirectProfilo() {
    const redirectProfilo = 'genitore/profilo';
    this.router.navigateByUrl(`${redirectProfilo}`);
  }

  RedirectMappa() {
    this.router.navigateByUrl('genitore/mappa-fermate');
  }

  RedirectTurni() {
    this.router.navigateByUrl('amministratore/turni');
  }

  RedirectPromuoviDeclassa() {
    this.router.navigateByUrl('amministratore/promuovi-declassa');
  }

  RedirectRegistraUtente() {
    this.router.navigateByUrl('segreteria/registrazione-utenti');
  }

  RedirectComunicazioni() {
    let redirectComunicazioni;
    if (this.isAccompagnatore()) {
      redirectComunicazioni  = 'accompagnatore/comunicazioni';
    } else if (this.isAmministratore() || this.isAmministratoreMaster()) {
      redirectComunicazioni = 'amministratore/comunicazioni';
    } else if (this.isGenitore()) {
      redirectComunicazioni = 'genitore/comunicazioni';
    }
    this.router.navigateByUrl(`${redirectComunicazioni}`);
  }

  ngOnDestroy() {
  }

}
