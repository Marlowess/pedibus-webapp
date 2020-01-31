/* ============================================================================================= */
/*                                       ANGULAR IMPORTS                                         */
/* ============================================================================================= */
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http'; // HttpEvent
import 'rxjs/add/operator/do';

/* ============================================================================================= */
/*                                       OUR PROJETC IMPORTS                                     */
/* ============================================================================================= */
// - Services:
import { AuthService } from '../../services/auth/auth.service';

// - Utils:
// import { config } from '../../config';
import { ENDPOINTS_JWT } from './endpoints-jwt';
import { Util } from '../../config/util';

import {EMPTY, NEVER, Observable, of} from 'rxjs';
import {config} from '../../config/config';

/* ============================================================================================= */
@Injectable({
  providedIn: 'root'
})
export class JwtInterceptorService implements HttpInterceptor {

  // Here, `JwtInterceptorService` service instance's attributes:
  private allowedLog = true;
  private endpoints: string[] = null;
  // private fileName = '../../conf/endpoints.txt';

  /* ============================================================================================= */
  constructor(private authService: AuthService) {
    const msg = 'JwtInterceptorService: constructor()';
    // Util.customLog( this.allowedLog, Util.LogType.DEBUG, msg, `running!` );
    this.endpoints = ENDPOINTS_JWT;
  }

  /* ============================================================================================= */
  /**
   * Lets `JwtInterceptorService` service instance to catch or intercept either a `http request` or
   * a `http response` in order to verify and test if the request or response needs to get or own, respectively,
   * a `jwt token` before it can go ahead.
   * @param req HttpRequest<any>
   * @param next HttpHandler
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {

    console.log('============== INTERCEPT HTTP REQUEST ================');
    console.log(req.url);
    const urlsWithDatePicker: Array<string> = [
      'http://' + config.ip + ':' + config.port + '/turni/summary/',
    ];
    const msg = 'JwtInterceptorService: intercept():';
    if (urlsWithDatePicker.filter(x => req.url.startsWith(x)).length !== 0) {
      // Util.customLog(this.allowedLog, Util.LogType.DEBUG, `${msg} URL ${req.url} ha il `);
      // return next.handle(req);
      console.log('================ SEI IN UNA URL CON UN DATEPICKER ================');
      /*if (!this.authService.isLoggedInForUrlsWithDatepicker()) {
        console.log('============== NON SEI PIU\' LOGGATO: ritorna EMPTY ===============');
        return EMPTY;
      }*/
    } else {
      // Util.customLog(this.allowedLog, Util.LogType.DEBUG, `${msg} URL ${req.url} does require jwt token`);
    }

    // Util.customLog(this.allowedLog, Util.LogType.DEBUG, msg, `running!`);
    // Util.customLog(this.allowedLog, Util.LogType.DEBUG, msg, ' url intercepted: ', req.url);

    // if (!req.url.startsWith(endpoint)) {
    if (this.endpoints.filter(x => req.url.startsWith(x)).length === 0) {
      // Util.customLog(this.allowedLog, Util.LogType.DEBUG, `${msg} URL ${req.url} does not require jwt token`);
      return next.handle(req);
    } else {
      // Util.customLog(this.allowedLog, Util.LogType.DEBUG, `${msg} URL ${req.url} does require jwt token`);
    }

    const token: string = this.authService.getToken();
    if (token) {
      this.authService.isLoggedIn();
      // console.debug(`${msg} set for ${req.url} header Authorization: Bearer ${token}`);
      // Util.customLog(this.allowedLog, Util.LogType.DEBUG, `${msg} set for ${req.url} header Authorization: Bearer ${token}`);

      const headers = { Authorization: `Bearer ${token}` };
      const clone = req.clone({ setHeaders: headers });
      return next.handle(clone).do(evt => {
        if (evt instanceof HttpResponse) {
          // console.log(evt.status); // console.log(req.url + '<---');
        } else if (evt instanceof HttpRequest) { /*non ci vai mai*/
          // console.log(req.url + '--->'); // console.log(JSON.stringify(req.headers));
        } else {
          // console.log(req.url + '<--->'); // console.log(typeof evt);
        }
      });
    } else {
      // console.debug(`${msg} error ${req.url} header Authorization: Bearer ${token}`);
      // Util.customLog(this.allowedLog, Util.LogType.DEBUG, `${msg} error ${req.url} header Authorization: Bearer ${token}`);
    }

    return next.handle(req);
  }

}
