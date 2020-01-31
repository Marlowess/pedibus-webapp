// # ============= ANGULAR LIBRARIE IMPORTS ============= #
import {
  Component,
  OnInit,
  AfterViewInit,
  ChangeDetectorRef,
  OnDestroy,
  Input,
  OnChanges,
  SimpleChanges
} from '@angular/core';
import {MatDialog, MatTabChangeEvent} from '@angular/material';
// MatPaginator, PageEvent, MatDialogModule, MatDialogRef, MAT_DIALOG_DATA
import { ViewChild } from '@angular/core';

import { Subscription } from 'rxjs/Subscription';

// # ============= CONFIG IMPORTS ============= #
import { DEFAULT_COORDS } from '../config/config';


// # ============= SERVICE IMPORTS ============= #
import {GenitoreService} from '../services/genitore-service/genitore.service';

// import corse.service for exploiting methods such as: getLinee
import { CorseService } from '../services/corse-service/corse.service';
import { AuthService } from '../services/auth/auth.service';

// # =========== MAP IMPORTS ========== #
// import { } from 'googlemaps'
// import { DialogCreaPrenotazioneComponent } from '../dialog-crea-prenotazione/dialog-crea-prenotazione.component';
// import '../google.maps.js'
import { HttpClient } from '@angular/common/http';
import {MappaMarker} from '../domain/mappa-marker';
import {MapsAPILoader} from '@agm/core';
// import { MappaMarker } from '../domain/mappa-marker';

/** Child component di 'MappaFermate', contiene le mappe dei due percorsi (andata e ritorno)
 * della linea selezionata nel parent component
 */

@Component({
  selector: 'app-visiona-linee-fermate-mappa',
  templateUrl: './visiona-linee-fermate-mappa.component.html',
  styleUrls: ['./visiona-linee-fermate-mappa.component.css']
})
export class VisionaLineeFermateMappaComponent implements OnInit, OnDestroy, AfterViewInit, OnChanges {


  // # ====== Public attributes ====== #
  // public debugMode = false;

  public latA = DEFAULT_COORDS.lat;
  public lngA = DEFAULT_COORDS.lng;
  public latR = DEFAULT_COORDS.lat;
  public lngR = DEFAULT_COORDS.lng;
  public mapZoom = 12;

  // public nomeLinea: any = null;

  public mapMarkerRefA: any = null;
  public mapMarkerRefR: any = null;

  public showAndata: boolean = null;

  @ViewChild('map') mapElement: any;
  @Input() selectedLinea: string;
  // public map: google.maps.Map;

  // Data structures
  // public lines: Array<string> = new Array<string>(); // new Array();
  public fermateAndata: Array<MappaMarker> = new Array<MappaMarker>(); // new Array();
  public fermateRitorno: Array<MappaMarker> = new Array<MappaMarker>(); // new Array();
  public flagRawData = false;

  public subFermate: Subscription = null;

  s = null; o = null; a = null;

  constructor(
    private genitoreService: GenitoreService,
    private corseService: CorseService,
    private authService: AuthService,
    public dialog: MatDialog,
    private http: HttpClient,
    private cdr: ChangeDetectorRef,
    private mapsAPILoader: MapsAPILoader
  ) { }

  ngOnInit() {
    const msg = `[VisionaLineeFermateMappaComponent] -> ngOnInit:`;
    this.updateMap(msg);
  }

  ngAfterViewInit() {
  }

  /** Prende dal component 'MappaFermate' l'informazione sulla linea selezionata */
  ngOnChanges(changes: SimpleChanges) {
    this.selectedLinea = changes.selectedLinea.currentValue;
    const msg = `[VisionaLineeFermateMappaComponent] -> ngOnChanges:`;
    this.updateMap(msg);
    // You can also use selectedLinea.previousValue and
    // selectedLinea.firstChange for comparing old and new values
  }

  /** Richiede le fermate della linea selezionata al server e crea a partire da queste
   * i marker sulla mappa di Google */
  updateMap(msg: string) {
    // console.log(this.selectedLinea);
    this.flagRawData = false;
    this.mapMarkerRefA = null;
    this.mapMarkerRefR = null;

    if (this.subFermate != null) {
      this.subFermate.unsubscribe();
    }
    this.subFermate =
      this.genitoreService.getFermateByLineaForMap(this.selectedLinea).subscribe({
        next: (data) => {
          // console.log(`${msg} getFermateByLinea(), data: ${JSON.stringify(data)}`);
          this.mapsAPILoader.load().then(() => {
            this.s = new google.maps.Size(16, 16);
            this.o = new google.maps.Point(0, 0);
            this.a = new google.maps.Point(8, 8);

            this.fermateAndata = new Array<MappaMarker>();
            for (let i = 0; i < data.andata.length; i++) {
              this.fermateAndata.push(
                new MappaMarker(data.andata[i], i, data.andata.length - 1, this.s , this.o, this.a)
              );
            }
            this.fermateRitorno = new Array<MappaMarker>();
            for (let i = 0; i < data.ritorno.length; i++) {
              this.fermateRitorno.push(
                new MappaMarker(data.ritorno[i], i, data.ritorno.length - 1, this.s, this.o, this.a)
              );
            }

            // this.fermateAndata = data.andata;
            this.mapZoom = 14;
            this.showAndata = true;
            // this.fermateRitorno = data.ritorno;
            this.calculateCoordinate();
            console.log(`${msg} getFermateByLinea(), fermate Andata: ${JSON.stringify(this.fermateAndata)}`);
            console.log(`${msg} getFermateByLinea(), fermate Ritorno: ${JSON.stringify(this.fermateRitorno)}`);
            this.flagRawData = true;
          });
        },
        error: (err) => { console.log(`${msg} getFermateByLinea(), err: ${JSON.stringify(err)}`); },
        complete: () => { console.log(`${msg} getFermateByLinea(), complete!`); }
      });
    this.cdr.detectChanges();
  }

  /** Al click sul marker di una fermata viene aperta una finestra riportante le informazioni
   * su quella fermata e, se presente, viene chiusa la finestra aperta precedentemente
   */
  updateMarkerRef(infoWindow, direzione: number) {
    // console.log(infoWindow);
    if (direzione === 0) {
      if (this.mapMarkerRefA != null) {
        if (this.mapMarkerRefA !== infoWindow) {
          this.mapMarkerRefA.close();
        }
      }
      this.mapMarkerRefA = infoWindow;
    }
    if (direzione === 1) {
      if (this.mapMarkerRefR != null) {
        if (this.mapMarkerRefR !== infoWindow) {
          this.mapMarkerRefR.close();
        }
      }
      this.mapMarkerRefR = infoWindow;
    }
  }

  /** Al cambio di direzione e quindi di tab vengono chiuse le finestre rimaste aperte nella
   * direzione visualizzata precedentemente
   */
  tabChanged(tabChangeEvent: MatTabChangeEvent): void {
    const tabSelected = tabChangeEvent.index;
    if (tabSelected === 0) {
      if (this.mapMarkerRefR != null) {
        this.mapMarkerRefR.close();
        this.mapMarkerRefR = null;
      }
    }
    if (tabSelected === 1) {
      if (this.mapMarkerRefA != null) {
        this.mapMarkerRefA.close();
        this.mapMarkerRefA = null;
      }
    }
  }

  ngOnDestroy() {
    /*if (this.subLines != null) {
      this.subLines.unsubscribe();
    }*/
    if (this.subFermate != null) {
      this.subFermate.unsubscribe();
    }
  }

  /** Calcola le coordinate del punto medio del percorso della linea, in modo da centrare la mappa
   * a seconda della posizione del percorso sulla mappa
   */
  calculateCoordinate() {
    const primaA = this.fermateAndata[0];
    const ultimaA = this.fermateAndata[this.fermateAndata.length - 1];
    // console.log(primaA.descrizione, ultimaA.descrizione);
    this.latA = (primaA.lat + ultimaA.lat) / 2;
    this.lngA = (primaA.lng + ultimaA.lng) / 2;

    const primaR = this.fermateRitorno[0];
    const ultimaR = this.fermateRitorno[this.fermateRitorno.length - 1];
    // console.log(primaR.descrizione, ultimaR.descrizione);
    this.latR = (primaR.lat + ultimaR.lat) / 2;
    this.lngR = (primaR.lng + ultimaR.lng) / 2;
  }

}
