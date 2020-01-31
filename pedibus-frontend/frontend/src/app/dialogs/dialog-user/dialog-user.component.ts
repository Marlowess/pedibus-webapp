import {Component, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {getRuolo} from '../../config/util';

/**
 * Dialog che compare cliccando sul bottone in alto a destra (con le iniziali dell'utente): mostra
 * il nome, il cognome, l'email e il ruolo dell'utente e il bottone 'Logout' per sloggarsi
 */

@Component({
  selector: 'app-dialog-user',
  templateUrl: './dialog-user.component.html',
  styleUrls: ['./dialog-user.component.css']
})
export class DialogUserComponent implements OnInit, OnDestroy {

  requestCambioPW: Subscription = null;
  nomeCognome = '';
  ruolo = '';
  email = '';

  constructor(
    // private dialog: MatDialog,
    // private authService: AuthService
  ) { }

  ngOnInit() {
    this.nomeCognome = localStorage.getItem('nomeCognome');
    this.email = localStorage.getItem('email');
    const r = getRuolo();
    this.ruolo = r.charAt(0).toUpperCase() + r.slice(1);
  }

  /** Ritorna al component 'AppComponent' true per innescare la funzione di logout */
  logout() {
    return {
      pick: true
    };
  }

  ngOnDestroy(): void {
    if (this.requestCambioPW !== null) {
      this.requestCambioPW.unsubscribe();
    }
  }

}
