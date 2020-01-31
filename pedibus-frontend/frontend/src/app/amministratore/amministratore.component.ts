import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {ruoli} from '../config/config';

@Component({
  selector: 'app-amministratore',
  templateUrl: './amministratore.component.html',
  styleUrls: ['./amministratore.component.css']
})
export class AmministratoreComponent implements OnInit {

  /**
   * Smart component per l'amministratore: contiene i bottoni che portano alle viste
   * accessibili agli utenti amministratori semplici e amministratori master
   */

  ruolo = '';
  ruoliValues = ruoli;

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
    this.ruolo = localStorage.getItem('ruolo');
    if (this.router.url.endsWith('amministratore') || this.router.url.endsWith('amministratore/')) {
      this.router.navigateByUrl('home-user');
    }
  }

}
