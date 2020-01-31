/* ============================================================================================= */
/*                                       ANGULAR IMPORTS                                         */
/* ============================================================================================= */
import { finalize, tap } from 'rxjs/operators';
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest, HttpEvent, HttpResponse } from '@angular/common/http';

/* ============================================================================================= */
/*                                       OUR PROJETC IMPORTS                                     */
/* ============================================================================================= */
// - Services:
import {AuthService} from '../../services/auth/auth.service';
// - Utils:
import { Util } from '../../config/util';

@Injectable({
  providedIn: 'root'
})
export class LoggingInterceptorService implements HttpInterceptor {

  // - Here, `LoggingInterceptorService` service-instance's attributes:
  private allowedLog: boolean = true;

  /* ============================================================================================= */
  constructor(
    private authService: AuthService,
  ) {
    const msg = 'LoggingInterceptorService: constructor()';
    // Util.customLog(this.allowedLog, Util.LogType.DEBUG, `${msg}: running!`);
  }

  /* ============================================================================================= */
  /**
   * Lets `LoggingInterceptorService` service-instance to catch or intercept a new http request or response,
   * logging some useful information.
   * @param req HttpRequest<any>
   * @param next HttpHandler
   */
  intercept(req: HttpRequest<any>, next: HttpHandler) {
    const msg = 'LoggingInterceptorService: intercept():';
    // Util.customLog(this.allowedLog, Util.LogType.DEBUG, `${msg}: running!`);
    const started = Date.now();
    let ok: string;

    // extend server response observable with logging
    return next.handle(req)
      .pipe(
        tap(
          // Succeeds when there is a response; ignore other events
          event => ok = event instanceof HttpResponse ? 'succeeded' : '',
          // Operation failed; error is an HttpErrorResponse
          error => ok = 'failed'
        ),
        // Log when response observable either completes or errors
        finalize(() => {
          const elapsed = Date.now() - started;
          const msgFinalize = `${req.method} "${req.urlWithParams}"
             ${ok} in ${elapsed} ms.`;
          // this.messenger.add(msg);
          const msg = 'LoggingInterceptorService: constructor()';
          // Util.customLog(this.allowedLog, Util.LogType.DEBUG, msg + ':' + msgFinalize);
        })
      )
      ;
  }

}
