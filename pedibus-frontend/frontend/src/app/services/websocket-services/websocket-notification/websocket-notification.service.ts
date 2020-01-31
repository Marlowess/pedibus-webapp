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
import { websocketInfo } from '../../../config/websocket-conf';
import { Subscription } from 'rxjs';
import { NotificationService } from '../../notification-service/notification.service';

/* =========================================================================================== */
@Injectable({
  providedIn: 'root'
})
export class WebsocketNotificationService implements OnDestroy {

  /* Instance's Attributes */
  private stompClient: Stomp.Client = null;
  private subStompClient: Subscription = null;

  /* =========================================================================================== */
  constructor(private authService: AuthService,
    private notificationService: NotificationService) {
    const msg = `[WebsocketNotificationService] constructor()`;
    // console.log(`${msg}: running!`);
  }

  /* =========================================================================================== */
  public openWebSocket() {
    const msg = `[WebsocketNotificationService] openWebSocket()`;
    // console.log(`${msg}: running!`);

    const endpoint = `http://${websocketInfo.ip}:${websocketInfo.port}/${websocketInfo.stompEndpoint}`

    if (this.stompClient != null && this.stompClient.connected) {
      return;
    }

    var socket = SockJs(endpoint);
    this.stompClient = Stomp.over(socket);

    let stompClient_ = this.stompClient;

    this.stompClient.ws.onerror = function (event: Event) {
      stompClient_.disconnect(function () {
        // console.log('stompClient is doing disconnect!');
      });
    };

    // const token = this.authService.getToken();
    // const tmpNotificationService = this.notificationService;

    // this.stompClient.ws.onclose = function (event: CloseEvent) {
    //   // console.log('Trying reopening stompClient!');
    //   if (event.code == 1011) {
    //     stompClient_ = Stomp.over(socket);
    //   }
    //   stompClient_.connect({ 'Authorization': `${token}` }, function (frame) {
    //     // // console.log('Connected: ' + frame);
    //     try {
    //       this.subscribe(`${websocketInfo.queueName}`, function (text) {
    //         // console.log(`${msg}: stompClient receive: ${text.body.toString()}!`);
    //         tmpNotificationService.signalNotification(JSON.parse(text.body));
    //       });
    //     } catch (err) {
    //       // console.error(`${msg}: stompClient error arose: ${err}!`);
    //     }
    //   });
    // };

    this.connectWebSocket();
  }

  /* =========================================================================================== */
  public connectWebSocket() {
    const msg = `[WebsocketNotificationService] connectWebSocket()`;
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
      try {
        this.subscribe(`${websocketInfo.queueName}`, function (text) {
          // console.log(`${msg}: stompClient receive: ${text.body.toString()}!`);
          tmpNotificationService.signalNotification(JSON.parse(text.body));
        });
      } catch (err) {
        // console.error(`${msg}: stompClient error arose: ${err}!`);
      }
    });

  }

  /* =========================================================================================== */
  public disconnectWebSocket() {
    const msg = `[WebsocketNotificationService] disconnectWebSocket()`;
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
    const msg = `[WebsocketNotificationService] ngOnDestroy()`;
    // console.log(`${msg}: running!`);

    this.disconnectWebSocket();
  }
}
