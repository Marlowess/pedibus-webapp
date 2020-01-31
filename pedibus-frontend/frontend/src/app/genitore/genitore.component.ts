import { Component, OnInit } from '@angular/core';
import {getRuolo} from '../config/util';
import {Router} from '@angular/router';

@Component({
  selector: 'app-home-user-genitore',
  templateUrl: './genitore.component.html',
  styleUrls: ['./genitore.component.css']
})
export class GenitoreComponent implements OnInit {

  /**
   * Smart component per il genitore: contiene i bottoni che portano alle viste
   * accessibili agli utenti genitore
   */

  constructor(private router: Router) { }

  ngOnInit() {
    if (getRuolo() !== 'genitore') {
      this.router.navigateByUrl('accesso-negato');
    }
    if (this.router.url.endsWith('genitore') || this.router.url.endsWith('genitore/')) {
      this.router.navigateByUrl('home-user');
    }
  }

}
