/* =========================================================================================== */
/*                                   ANGULAR IMPORTS                                           */
/* =========================================================================================== */
import { OnDestroy } from '@angular/core';

import { Injectable } from '@angular/core';
/* =========================================================================================== */
/*                                   OTHERS IMPORTS                                            */
/* =========================================================================================== */
import * as SockJs from 'sockjs-client';
import * as Stomp from 'stompjs';

/* =========================================================================================== */
/*                                       OUR IMPORTS                                           */
/* =========================================================================================== */
import { AuthService } from '../../auth/auth.service';
import { websocketPromuoviDeclassaAccompagnatore } from '../../../config/websocket-conf';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../notification-service/notification.service';

@Injectable({
  providedIn: 'root'
})
export class WebsocketPromozioneDeclassamentoAccompagnatoriService {

  /* Instance's Attributes */
  private stompClient: Stomp.Client = null;
  private subStompClient: Subscription = null;

  /* =========================================================================================== */
    /**
   * Il costruttore si riferisce al servizio identificato nella classe `WebsocketPromozioneDeclassamentoAccompagnatoriService`
   * che si occupa delle operazioni di gestione del ciclo di vita del websocket.
   * @param authService AuthService
   * @param notificationService NotificationService
   */  
  constructor(private authService: AuthService,
    private notificationService: NotificationService) {
    const msg = `[WebsocketPromozioneDeclassamentoAccompagnatoriService] constructor()`;
    // console.debug(`${msg}: running!`);
  }

  /* =========================================================================================== */
  /**
   * Metodo publico `openWebSocket` per l'instaurazione di un websocket, per ricevere notifiche in tempo reale
   * dal server
   */
  public openWebSocket() {
    const msg = `[WebsocketPromozioneDeclassamentoAccompagnatoriService] openWebSocket()`;
    // console.debug(`${msg}: running!`);

    const endpoint = `http://${websocketPromuoviDeclassaAccompagnatore.ip}:${websocketPromuoviDeclassaAccompagnatore.port}/${websocketPromuoviDeclassaAccompagnatore.stompEndpoint}`

    if (this.stompClient != null && this.stompClient.connected) {
      return;
    }

    var socket = SockJs(endpoint);
    this.stompClient = Stomp.over(socket);

    this.connectWebSocket();
  }

  /* =========================================================================================== */
  /**
   * Metodo publico `connectWebSocket` effettua la connesione vera e propria e stabilisce la logica
   * di controllo all'arrivo di una nuova notifca.
   */  
  private connectWebSocket() {
    const msg = `[WebsocketPromozioneDeclassamentoAccompagnatoriService] connectWebSocket()`;
    // console.debug(`${msg}: running!`);

    if (this.stompClient == null) {
      // console.warn(`${msg}: No stompClient has been created before!`);
      return;
    }

    if (this.stompClient.connected == true) {
      // console.info(`${msg}: stompClient is already connected!`);
      return;
    }

    const token = this.authService.getToken()
    // console.log(`${msg}: ${token}`);

    const tmpNotificationService = this.notificationService;
    this.stompClient.connect({ 'Authorization': `${token}` }, function (frame) {
      // // console.log('Connected: ' + frame);
      this.subscribe(`${websocketPromuoviDeclassaAccompagnatore.queueName}`, function (text) {
        // console.log(`${msg}: stompClient receive: ${text.body.toString()}!`);

        tmpNotificationService.signalNotificationPromozioneOrDeclassamentoAccompagnatore(JSON.parse(text.body));

      });
    });

  }

  /* =========================================================================================== */
  /**
   * Metodo pubblico `disconnectWebSocket` esegue la chiusura del websocket quando il componente
   * all'interno del quale viene instanziato smette di essere utilizzato e viene distrutto perché 
   * l'utente effettua un operazione di logout oppure di cambio della pagina web da visitare nel sito.
   */
  public disconnectWebSocket() {
    const msg = `[WebsocketPromozioneDeclassamentoAccompagnatoriService] disconnectWebSocket()`;
    // console.log(`${msg}: running!`);

    if (this.stompClient == null) {
      // console.warn(`${msg}: No stompClient has been created & connected before!`);
      return;
    }
    if (this.stompClient.connected == true) {
      this.stompClient.disconnect(function () {
        // console.log('stompClient is doing disconnect!');
      });
    }
  }


  /* =========================================================================================== */
  public ngOnDestroy() {
    const msg = `[WebsocketPromozioneDeclassamentoAccompagnatoriService] ngOnDestroy()`;
    // console.log(`${msg}: running!`);

    this.disconnectWebSocket();
  }
}
