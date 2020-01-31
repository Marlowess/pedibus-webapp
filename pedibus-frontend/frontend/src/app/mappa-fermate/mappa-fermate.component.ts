// # ============= ANGULAR LIBRERIE IMPORTS ============= #
import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core'; // ChangeDetectorRef
import { Subscription } from 'rxjs/Subscription';

// # ============= SERVICE IMPORTS ============= #
import { CorseService } from '../services/corse-service/corse.service';

/** Component per la vista delle mappe, visualizzabile dai genitori, contiene il child component
 * 'VisionaLineeFermateMappa' */

@Component({
  selector: 'app-mappa-fermate',
  templateUrl: './mappa-fermate.component.html',
  styleUrls: ['./mappa-fermate.component.css']
})
export class MappaFermateComponent implements OnInit, OnDestroy, AfterViewInit {

  // # ====== Public attributes ====== #
  public subLines: Subscription = null;

  linee: Array<string> = null;
  linea = '';

  constructor(
    private corseService: CorseService,
  ) { }

  /** Richiede al server la lista delle linee */
  ngOnInit() {
    const msg = `[MappaFermateComponent] -> ngOnInit:`;

    this.subLines =
      this.corseService.getLinee().subscribe({
          next: (data) => {
            console.log(`${msg} getLinee(), data: ${JSON.stringify(data)}`);
            this.linee = data;
            this.linea = this.linee[0];
            // this.flagLinesAviable = true;
          },
          error: (err) => {
            console.log(`${msg} getLinee(), err: ${JSON.stringify(err)}`);
          },
          complete: () => {
            console.log(`${msg} getLinee(), complete!`);
            console.log(this.linea);
          }
        }
      );
  }

  ngAfterViewInit() { }

  /** Seleziona la linea */
  onSelectLinea(linea: string) {
    this.linea = linea;
    console.log(this.linea);
  }

  ngOnDestroy() {
    if (this.subLines != null) {
      this.subLines.unsubscribe();
    }
  }

}
