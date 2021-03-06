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
import { websocketDisponibilitaInfo } from '../../../config/websocket-conf';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../notification-service/notification.service';

/* =========================================================================================== */
@Injectable({
  providedIn: 'root'
})
export class WebsocketDisponibilitaService {

  /* Instance's Attributes */
  private stompClient: Stomp.Client = null;
  private subStompClient: Subscription = null;

  /* =========================================================================================== */
  /**
   * Il costruttore si riferisce al servizio identificato nella classe `WebsocketDisponibilitaService`
   * che si occupa delle operazioni di gestione del ciclo di vita del websocket.
   * @param authService AuthService
   * @param notificationService NotificationService
   */
  constructor(private authService: AuthService,
    private notificationService: NotificationService) {
    const msg = `[WebsocketDisponibilitaServiceService] constructor()`;
    // console.log(`${msg}: running!`);
  }

  /* =========================================================================================== */
    /**
   * Metodo publico `openWebSocket` per l'instaurazione di un websocket, per ricevere notifiche in tempo reale
   * dal server
   */
  public openWebSocket() {
    const msg = `[WebsocketDisponibilitaServiceService] openWebSocket()`;
    // console.log(`${msg}: running!`);

    const endpoint = `http://${websocketDisponibilitaInfo.ip}:${websocketDisponibilitaInfo.port}/${websocketDisponibilitaInfo.stompEndpoint}`

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
  public connectWebSocket() {
    const msg = `[WebsocketDisponibilitaServiceService] connectWebSocket()`;
    // console.log(`${msg}: running!`);

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
      this.subscribe(`${websocketDisponibilitaInfo.queueName}`, function (text) {
        // console.log(`${msg}: stompClient receive: ${text.body.toString()}!`);
        // window.alert('signalNotificationTurni from ws!');
        
        tmpNotificationService.signalNotificationTurnoAccompagnatore(JSON.parse(text.body));

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
    const msg = `[WebsocketDisponibilitaService] disconnectWebSocket()`;
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
    const msg = `[WebsocketDisponibilitaService] ngOnDestroy()`;
    // console.log(`${msg}: running!`);

    this.disconnectWebSocket();
  }

  /* =========================================================================================== */
  /*                      Here ends `WebsocketDisponibilitaService` implementation               */
  /* =========================================================================================== */
}
