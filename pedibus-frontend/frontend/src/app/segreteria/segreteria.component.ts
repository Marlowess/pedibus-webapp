import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';

/**
 * Smart component per la segreteria: contiene solo il bottone che porta alla vista
 * per la registrazione di nuovi utenti nel sistema, 'GestioneUtenti'
 */

@Component({
  selector: 'app-segreteria',
  templateUrl: './segreteria.component.html',
  styleUrls: ['./segreteria.component.css']
})
export class SegreteriaComponent implements OnInit {

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
    if (this.router.url.endsWith('segreteria') || this.router.url.endsWith('segreteria/')) {
      this.router.navigateByUrl('home-user');
    }
  }

}
