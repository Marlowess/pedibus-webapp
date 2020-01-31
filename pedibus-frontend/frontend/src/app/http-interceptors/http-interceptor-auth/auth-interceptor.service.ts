/* ============================================================================================= */
/*                                       ANGULAR IMPORTS                                         */
/* ============================================================================================= */
import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/operator/do';

/* ============================================================================================= */
/*                                       OUR PROJETC IMPORTS                                     */
/* ============================================================================================= */
// - Services:
import { AuthService } from './../../services/auth/auth.service';
import { ManagerNavbarService } from './../../services/manager-navbar/manager-navbar.service';

// Utils:
import { config } from '../../config/config';
import { Util } from '../../config/util';


/* ============================================================================================= */
@Injectable({
  providedIn: 'root'
})
export class AuthInterceptor implements HttpInterceptor {

  // - Here, private interceptor's attributes:
  private allowedLog = true;

  /* ============================================================================================= */
  constructor(
    private authService: AuthService,
    private managerNavbar: ManagerNavbarService) {
    const msg = 'AuthInterceptor: construct() - Ok!';
    // Util.customLog(this.allowedLog, Util.LogType.INFO, msg, 'running!');
  }

  /* ============================================================================================= */
  /**
   * Lets the `AuthInterceptor` service instance to catch or intercept a http request and validate.
   * @param req HttpRequest<any>
   * @param next HttpHandler
   */
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const msg = 'AuthInterceptor: intercept()';
    // Util.customLog(this.allowedLog, Util.LogType.INFO, msg, 'running!');

    if (req.body) {
      // Util.customLog(this.allowedLog, Util.LogType.INFO, msg + ' body:', JSON.stringify(req.body));
    }

    return next.handle(req).do(evt => {
      if (evt instanceof HttpResponse) {
        // Util.customLog(this.allowedLog, Util.LogType.INFO, msg + ' status:', evt.status);
        // console.log(msg + ' filter:', req.params.get('filter'));

        const endpoint: string[] =
          [
            `http://${config.ip}:${config.port}/login`,
          ];

        if (endpoint.filter(x => req.url.startsWith(x)).length !== 0) {
          const token = evt.headers.get('Authorization');
          if (token == null || token === '') {
            // Util.customLog(this.allowedLog, Util.LogType.INFO, msg + ' body:', evt.body, 'end body');
            // let body = JSON.parse(evt.body);
            if (evt.body != null && evt.body.token != null) {
              // Memorizza localmente il token jwt per la nuova sessione di lavoro, all'atto del login.
              this.authService.setSession(evt.body.token);
              this.authService.setNomeCognome(evt.body.nome_visualizzato);

              // Aggiorna navbar nel file html app.component.html in modo concorde
              // al tipo di ruolo dell'utente che si e' loggato.
              const ruolo = this.authService.getRuolo();
              // Util.customLog(this.allowedLog, Util.LogType.INFO, msg + 'Ruolo:', ruolo);

              this.managerNavbar.emitUpdateNavBar(ruolo);
            }
          }
        }
      } else if (evt instanceof HttpRequest) {
        // Util.customLog(this.allowedLog, Util.LogType.INFO, msg + ' filter:', req.params.get('filter'));
      }
    });
  }

}
