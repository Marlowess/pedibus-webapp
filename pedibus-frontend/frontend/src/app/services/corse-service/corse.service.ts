/* ============================================================================================= */
/*                                       ANGULAR IMPORTS                                         */
/* ============================================================================================= */
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/* ============================================================================================= */
/*                                       OUR PROJECT IMPORTS                                     */
/* ============================================================================================= */

// - Utils:
import { config } from '../../config/config';
import { Util } from '../../config/util';

/* ============================================================================================= */
@Injectable()
export class CorseService {

  private allowLog = true;

  private server: string = config.ip;
  private port: string = config.port;

  public linee: number[] = [];

  /* ============================================================================================= */
  constructor(private http: HttpClient) {
    const msg = `[CorseService] constructor()`;
    Util.customLog(this.allowLog, Util.LogType.INFO, `${msg} running()`);
  }

  /* ============================================================================================= */
  /**
   * Public method `getLinee` used to retrieve from server available `linee`.
   */
  getLinee(): Observable<any> {
    const msg = `[CorseService] getLinee()`;
    Util.customLog(this.allowLog, Util.LogType.INFO, `${msg} running()`);

    const endpoint = `lines`;
    const url = `http://${this.server}:${this.port}/${endpoint}`;

    return this.http.get(url).pipe(
      tap(
        data => {
          Util.customLog(this.allowLog, Util.LogType.DEBUG, `${msg} tap data: ${JSON.stringify(data)}`);
        },
        error => {
          Util.customLog(this.allowLog, Util.LogType.DEBUG, `${msg} tap data: ${JSON.stringify(error)}`);
        }
      ),
    );
  }

}
