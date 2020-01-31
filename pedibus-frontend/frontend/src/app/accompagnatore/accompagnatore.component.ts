import { Component, OnInit, OnDestroy } from '@angular/core';
import {getRuolo} from '../config/util';
import {Router} from '@angular/router';


@Component({
  selector: 'app-home-user-accompagnatore',
  templateUrl: './accompagnatore.component.html',
  styleUrls: ['./accompagnatore.component.css']
})
export class AccompagnatoreComponent implements OnInit, OnDestroy {

  /**
   * Smart component per l'accompagnatore: contiene i bottoni che portano alle viste
   * accessibili agli utenti accompagnatori
   */

  // Public instance's attributes for debbuging:
  public FLAG_DEBUG_MODE_ACCOMPAGNATORE = true;
  public debugNotificationMessage: any = null;

  public datePickerFLag = false;

  constructor(private router: Router) { }

  ngOnInit() {
    if (getRuolo() !== 'accompagnatore') {
      this.router.navigateByUrl('accesso-negato');
    }
    if (this.router.url.endsWith('accompagnatore') || this.router.url.endsWith('accompagnatore/')) {
      this.router.navigateByUrl('home-user');
    }
  }

  ngOnDestroy() {
  }
}
