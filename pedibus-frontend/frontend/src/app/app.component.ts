/* ============================================================================================= */
/*                                       ANGULAR IMPORTS                                         */
/* ============================================================================================= */
import {Component, ChangeDetectorRef, OnInit, AfterViewInit, OnDestroy} from '@angular/core';
// ViewChild, ViewEncapsulation,

import { Subscription, } from 'rxjs'; // , Observable
import { Router, NavigationStart } from '@angular/router'; //  NavigationEnd,

/* ============================================================================================= */
/*                                       THIRD-PARTY IMPORTS                                     */
/* ============================================================================================= */
import { ToastyService, ToastyConfig} from 'ng2-toasty'; // , ToastOptions, ToastData

/* ============================================================================================= */
/*                                       OUR PROJETC IMPORTS                                     */
/* ============================================================================================= */
// - Services:
import { AuthService } from './services/auth/auth.service';
import { ManagerNavbarService } from './services/manager-navbar/manager-navbar.service';
import { NotificationService } from './services/notification-service/notification.service';
import { NotificationsService } from 'angular2-notifications';
import { WebsocketNotificationService } from './services/websocket-notification/websocket-notification.service';

// - Utils:
import { Util } from './config/util';
import {MatDialog} from '@angular/material';
import {DialogUserComponent} from './dialogs/dialog-user/dialog-user.component';
import {ruoli} from './config/config';

/* ============================================================================================= */
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
// export class AppComponent implements OnInit, AfterViewInit {
export class AppComponent implements OnInit, AfterViewInit, OnDestroy {

  // public homeUrl = false;
  // - Instance's attributes of type Subjects
  private subscriptionGetUpdateNavBar: Subscription = null;
  private subGetNotification: Subscription = null;
  private subGetNotificationLogin: Subscription = null;
  private subGetNotificationsFromServer: Subscription = null;
  private subGetNotificationResetBell: Subscription = null;
  private subscriptionReloadedPage: Subscription = null;

  private navigationSubscription: Subscription = null;

  // - Instance's attributes used as logic flags
  public enableLogout = false;
  public enablePasseggeroActions = false;
  public enableAccompagnatoreActions = false;
  public enableAdminActions = false;
  public enableMasterAdminActions = false;
  public enableSegreteriaActions = false;

  public flagNotification = false;
  private flagBellZeroed = false;

  public flagLoggedIn = false;
  public numberOfNotification = 0;

  // - Private Instance's attributes
  private allowedLog = true;

  /* ============================================================================================= */
  constructor(
    private managerNavBar: ManagerNavbarService,
    private authService: AuthService,
    private router: Router,
    private wsService: WebsocketNotificationService,
    private notificationService: NotificationService,
    // tslint:disable-next-line:variable-name
    private _notificationsService: NotificationsService,
    private toastyService: ToastyService,
    private toastyConfig: ToastyConfig,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    const msg = `[AppComponent] constructor()`;
    Util.customLog(this.allowedLog, Util.LogType.INFO, msg, 'running!');

    // - Init objects for showing push notification.
    this.toastyConfig.theme = 'material';
    this.toastyConfig.position = 'bottom-right';

    this.subscriptionReloadedPage = router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        if (!router.navigated) {
          //   1. Update UI.
          const ruolo = this.authService.getRuolo();
          if (ruolo == null) {
            return;
          }
          this.updateNavBar(ruolo);

          //   2. we enable / disable buttons and divs accordingly to user's role;
          this.enableLogout = true;
          this.flagNotification = false;
          this.flagLoggedIn = true;

          //   3. we subscribe to get notifications from server, if any.
          this.subscribeToResetBell();
          this.subscribeToGetSingleNotification();
          this.subscribeToGetAllNotificationsFromServer();
        }
      }
    });

  }

  /* ============================================================================================= */
  ngOnInit(): void {
    this.cdr.detectChanges();

    // - Here, some necessary subscriptions.
    this.subscribeToKnowingAmILogged();
  }

  /* ============================================================================================= */
  /**
   * Method to know if a user is logged-in, when is visiting a web site page.
   */
  private subscribeToKnowingAmILogged() {
    // const msg = '[AppComponent]: subscribeToKnowingAmILogged()';
    // console.log(`${msg}: running!`);

    // - Subscription for get notification that states if user is logged in or not.
    this.subGetNotificationLogin =
      this.notificationService.getNotificationLogin().subscribe({
        next: (data) => {
          this.flagLoggedIn = data;
          // console.log(`${msg}: getNotificationLogin() : loggin status = ${data}`);

          // - If user is logged:
          if (this.flagLoggedIn === true) {
            //   1. we update navbar accordingly to user's role;
            this.updateNavBar(this.authService.getRuolo());

            //   2. we enable / disable buttons and divs accordingly to user's role;
            this.enableLogout = true;
            this.flagNotification = false;

            //   3. we subscribe to get notifications from server, if any.
            this.subscribeToResetBell();
            this.subscribeToGetSingleNotification();
            this.subscribeToGetAllNotificationsFromServer();
          } else {
            this.enableLogout = false;
            this.flagNotification = false;
          }
        },
        error: () => { },
        complete: () => { }
      });

  }

  /**
   * Method to know if a logged in user receives a new notification.
   */
  private subscribeToGetSingleNotification() {
    // const msg = '[AppComponent]: subscribeToGetSingleNotification()';
    // console.log(`${msg}: running!`);

    // - Subscription for get single or punctual notification from opened and connected WebSocket.
    if (this.subGetNotification != null) {
      this.subGetNotification.unsubscribe();
    }
    this.subGetNotification =
      this.notificationService.getNotification().subscribe({
        next: (data: any) => {
          // console.log(`${msg}: getNotification(): next, data:\n`, data);
          if (data === true) { return; }
          if (data != null && !(data instanceof Boolean) && data !== '') {
            this.flagNotification = true;
            this.numberOfNotification += 1;

            if (this.router.url.endsWith('comunicazioni') === true) {
              this.notificationService.signalNotificationPushNewComunicazione(data);
            }

            const bodyNotificationPush =
              `${new Date(parseInt(data.timestamp, 10)).toLocaleDateString('it-IT')} `
              + ` ${new Date(parseInt(data.timestamp, 10)).toLocaleTimeString('it-IT')}`;
            this._notificationsService.success(
              `${data.topic}`,
              bodyNotificationPush, {
                timeOut: 6000,
                showProgressBar: true,
                pauseOnHover: true,
                clickToClose: false,
                clickIconToClose: true
              });
          }
        },
        error: () => { /*console.log(`${msg}: getNotification(): error:\n`, err);*/ },
        complete: () => { /*console.log(`${msg}: getNotification(): complete`);*/ }
      });
  }

  /**
   * Method know if user has read new notifications in order to clear `notification bell icon`.
   */
  private subscribeToResetBell() {
    // const msg = '[AppComponent]: subscribeToResetBell()';
    // console.log(`${msg}: running!`);
    // Subscription for knowing if it's needed to zero bell's notifications.
    this.subGetNotificationResetBell =
      this.notificationService.getNotificationResetBell().subscribe({
        next: (data) => {
          if (data === true) {
            this.numberOfNotification = 0;
            this.flagNotification = false;
            this.flagBellZeroed = true;
            this.cdr.detectChanges();
            // window.alert('[NotificationServiceService] getNotification()');
          }
          // console.log(`${msg}: getNotificationResetBell() : reset bell = ${data}`);
        },
        error: () => { },
        complete: () => { }
      });

  }

  /**
   * Method to know if `server` has sent new notifications after the `user` has logged in with succes.
   */
  private subscribeToGetAllNotificationsFromServer(): void {
    const msg = '[AppComponent]: getNotification()';
    // console.log(`${msg}: running!`);
    Util.customLog(this.allowedLog, Util.LogType.INFO, `${msg}: running!`);

    // - Ask server if there are any unread notifications,
    if (this.subGetNotificationsFromServer != null) {
      this.subGetNotificationsFromServer.unsubscribe();
    }
    this.subGetNotificationsFromServer =
      this.notificationService.getNotificationFromServer()
        .subscribe({
          next: (data2) => {
            if (this.flagBellZeroed === true) {
              return;
            }
            // console.log(`${msg}: getNotificationFromServer(): data:\n${JSON.stringify(data2)}`);
            this.numberOfNotification = parseInt(data2.comunicazioni_non_lette, 10);
            if (this.numberOfNotification !== 0) {
              this.flagNotification = true;
            }
          },
          error: () => {
            // console.log(`${msg}: getNotificationFromServer(): error:\n${err}`);
          },
          complete: () => {
            // console.log(`${msg}: getNotificationFromServer(): complete`);
          }
        });
  }

  /* ============================================================================================= */
  /**
   * Method to update `nav-bar` and other `UI objects` accordingly to `user's role` when is logged in.
   * @param ruolo string
   */
  private updateNavBar(ruolo: string) {
    if (ruolo === ruoli.genitore) {
      // console.log('update dashboard passeggero');
      this.enablePasseggeroActions = true;
      this.enableAccompagnatoreActions = false;
      this.enableAdminActions = false;
      this.enableMasterAdminActions = false;
      this.enableSegreteriaActions = false;

    } else if (ruolo === ruoli.accompagnatore) {
      // console.log('update dashboard accompagnatore');
      this.enablePasseggeroActions = false;
      this.enableAccompagnatoreActions = true;
      this.enableAdminActions = false;
      this.enableMasterAdminActions = false;
      this.enableSegreteriaActions = false;

    } else if (ruolo === ruoli.amministratore) {
      // console.log('update dashboard amministratore');
      this.enablePasseggeroActions = false;
      this.enableAccompagnatoreActions = false;
      this.enableAdminActions = true;
      this.enableMasterAdminActions = false;
      this.enableSegreteriaActions = false;

    } else if (ruolo === ruoli.amministratoreMaster) {
      // console.log('update dashboard amministratore master');
      this.enablePasseggeroActions = false;
      this.enableAccompagnatoreActions = false;
      this.enableAdminActions = true;
      this.enableMasterAdminActions = true;
      this.enableSegreteriaActions = false;

    } else if (ruolo === ruoli.segreteria) {
      this.enablePasseggeroActions = false;
      this.enableAccompagnatoreActions = false;
      this.enableAdminActions = false;
      this.enableMasterAdminActions = false;
      this.enableSegreteriaActions = true;

    } else {
      this.enablePasseggeroActions = false;
      this.enableAccompagnatoreActions = false;
      this.enableAdminActions = false;
      this.enableMasterAdminActions = false;
      this.enableSegreteriaActions = false;
      this.enableLogout = false;
    }
  }

  /* ============================================================================================= */
  ngAfterViewInit(): void {
    this.cdr.detectChanges();

    // Subscription for getting notification that states if user is logged in or not
    // in ordert to update buttons
    this.subscriptionGetUpdateNavBar = this.managerNavBar.getUpdateNavBar().subscribe({
      next: (ruolo: string) => {
        this.enableLogout = true;
        this.updateNavBar(ruolo);
      },
      error: () => { },
      complete: () => { }
    });

  }

  /* ============================================================================================= */
  /**
   * Lets user navigate from where he actually is toward the site's web-page dedicated to notifications.
   * @param flagNavigateByUrl boolean
   */
  public readNotifications(flagNavigateByUrl: boolean) {
    // const msg = '[AppComponent]: readNotifications()';
    // console.log(`${msg}: running!`);
    this.flagNotification = false;
    this.numberOfNotification = 0;

    if (flagNavigateByUrl === false) {
      // window.alert('[AppComponent]: readNotifications()');
      return;
    }
    const ruolo = this.authService.getRuolo();
    let urlComunicazioni: string = null;
    switch (ruolo) {
      case ruoli.accompagnatore:
        urlComunicazioni = 'accompagnatore/comunicazioni';
        break;
      case ruoli.amministratore:
        urlComunicazioni = 'amministratore/comunicazioni';
        break;
      case ruoli.amministratoreMaster:
        urlComunicazioni = 'amministratore/comunicazioni';
        break;
      case ruoli.genitore:
        urlComunicazioni = 'genitore/comunicazioni';
        break;
      default:
        this.logout();
        break;
    }
    this.router.navigateByUrl(urlComunicazioni);
  }

  /* ============================================================================================= */
  /**
   * Lets user logout from web site, and lets to redirect toward web site's home page, while
   * it reinitializes all attributes both for component's function and for UI.
   */
  public logout() {
    // const msg = '[AppComponent]: logout()';
    // console.log(`${msg}: running!`);

    this.wsService.disconnectWebSocket();

    // - Reset UI toolbar
    this.enableLogout = false;
    this.enablePasseggeroActions = false;
    this.enableAccompagnatoreActions = false;
    this.enableAdminActions = false;
    this.enableMasterAdminActions = false;
    this.enableSegreteriaActions = false;

    // - Reset bell
    this.flagNotification = false;
    this.numberOfNotification = 0;

    // - Reset other remaining flags
    this.flagLoggedIn = false;
    this.flagBellZeroed = false;

    this.closeAllSubscriptionsWhenLogout();
    this.authService.logout();
  }

  /* ============================================================================================= */
  /**
   * Lets the web site disconnect all subscriptions when a logged user decides to logout.
   */
  private closeAllSubscriptionsWhenLogout() {
    if (this.subGetNotification != null) {
      this.subGetNotification.unsubscribe();
    }

    if (this.navigationSubscription != null) {
      this.navigationSubscription.unsubscribe();
    }

    if (this.subGetNotificationsFromServer != null) {
      this.subGetNotificationsFromServer.unsubscribe();
    }

    if (this.subGetNotificationResetBell != null) {
      this.subGetNotificationResetBell.unsubscribe();
    }
  }

  /**
   * Lets the web site disconnect all subscriptions when the user either close the browser
   * or the current navigation window.
   */
  private closeAllSubscriptions() {
    if (this.subscriptionGetUpdateNavBar != null) {
      this.subscriptionGetUpdateNavBar.unsubscribe();
    }

    if (this.subGetNotification != null) {
      this.subGetNotification.unsubscribe();
    }

    if (this.subGetNotificationLogin != null) {
      this.subGetNotificationLogin.unsubscribe();
    }

    if (this.navigationSubscription != null) {
      this.navigationSubscription.unsubscribe();
    }

    if (this.subGetNotificationsFromServer != null) {
      this.subGetNotificationsFromServer.unsubscribe();
    }

    if (this.subGetNotificationResetBell != null) {
      this.subGetNotificationResetBell.unsubscribe();
    }

    if (this.subscriptionReloadedPage != null) {
      this.subscriptionReloadedPage.unsubscribe();
    }
  }

  /* ============================================================================================= */
  /**
   * Methods for retrieving user infos, visualized in the top-right dialog
   */
  getUserEmail(): string {
    return localStorage.getItem('email');
  }
  getUserNomeCognome(): string {
    return localStorage.getItem('nomeCognome');
  }
  getUserInitials(): string {
    const nomeCognome: string = this.getUserNomeCognome();
    const campi = nomeCognome.split(' ');
    const nome = campi[0]; const cognome = campi[1];
    return nome.charAt(0).toUpperCase() + cognome.charAt(0).toUpperCase();
  }

  openUserDialog() {
    const dialogRef = this.dialog.open(DialogUserComponent, {
      panelClass: 'dialog-user',
      position: {top: '0', right: '0'},
      width: '250px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === undefined) { return; }

      // clicked on 'Logout' button
      this.logout();
    });
  }

  /* ============================================================================================= */
  ngOnDestroy() {
    this.closeAllSubscriptions();
  }
}
