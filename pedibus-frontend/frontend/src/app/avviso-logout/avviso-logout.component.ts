import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';

@Component({
  selector: 'app-avviso-logout',
  templateUrl: './avviso-logout.component.html',
  styleUrls: ['./avviso-logout.component.css']
})
export class AvvisoLogoutComponent implements OnInit {

  constructor(
    private router: Router
  ) { }

  ngOnInit() {
  }

  redirectLogin() {
    this.router.navigateByUrl('login-form');
  }

}
