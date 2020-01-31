import { Component, OnInit } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService } from '../services/auth/auth.service';

import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    // se l'utente è già loggato viene rimandado alla home page con i bottoni per le varie viste
    if (this.authService.isLoggedInForLogin(this.router.url)) {
      this.router.navigateByUrl('home-user');
    }
  }

}
