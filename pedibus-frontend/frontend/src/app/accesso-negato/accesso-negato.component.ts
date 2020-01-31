import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';

/**
 * Component visualizzato quando l'utente prova ad accedere a una pagina per cui non ha
 * i permessi necessari
 */

@Component({
  selector: 'app-accesso-negato',
  templateUrl: './accesso-negato.component.html',
  styleUrls: ['./accesso-negato.component.css']
})
export class AccessoNegatoComponent implements OnInit {

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
  }

  redirectHome() {
    this.router.navigateByUrl('home-user');
  }

}
