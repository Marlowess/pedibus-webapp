import { Injectable } from '@angular/core';
import { CanActivate } from '@angular/router';
import {AuthService} from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class OnlyLoggendInUserGuardService implements CanActivate {

  constructor(private authService: AuthService) { }

  canActivate() {
    return this.authService.isLoggedIn();
  }
}
