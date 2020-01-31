import {Component, OnDestroy, OnInit, ViewEncapsulation} from '@angular/core'; // ChangeDetectorRef,
import {GenitoreService} from '../services/genitore-service/genitore.service';
import {FermataLogic} from '../domain/fermata-logic';
import {Observable, Subscription} from 'rxjs';
import {Profilo} from '../domain/profilo-domain/profilo';
import {MatDialog, MatSnackBar} from '@angular/material';
import {DialogProfiloComponent} from '../dialogs/dialog-profilo/dialog-profilo.component';
import {openSnackBar} from '../config/util';

/** Component per il profilo del genitore (in cui inserire bambini e fermate di default per le prenotazioni) */

@Component({
  selector: 'app-profilo',
  templateUrl: './profilo.component.html',
  styleUrls: ['./profilo.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class ProfiloComponent implements OnInit, OnDestroy {

  profilo: Profilo;
  profiloBackup: Profilo;

  // inputName: string;

  linee: string[];
  fermateAndata: Array<FermataLogic> = [];
  fermateRitorno: Array<FermataLogic> = [];

  lineeObs: Observable<any>;
  fermateAndataObs: Observable<any>;
  fermateRitornoObs: Observable<any>;
  fermateDefaultBambiniObs: Observable<any>;
  fermateAndataNuoveObs: Observable<any>;
  fermateRitornoNuoveObs: Observable<any>;
  lineeSub: Subscription = null;
  fermateDefaultBambiniSub: Subscription = null;
  fermateAndataSub: Subscription = null;
  fermateRitornoSub: Subscription = null;

  constructor(
    private genitoreService: GenitoreService,
    private snackbar: MatSnackBar,
    private dialog: MatDialog,
  ) { }

  /** funzioni per copiare oggetti */

  static newFermatafromFermata(fermata: FermataLogic): FermataLogic {
    return new FermataLogic(fermata.idFermata, fermata.nome);
  }

  static newListaBambiniFromListaBambini(bambini: Array<string>): Array<string> {
    const newBambini: Array<string> = [];
    bambini.forEach(bambino => newBambini.push(bambino));
    return newBambini;
  }

  static newProfiloFromProfilo(profilo: Profilo): Profilo {
    return new Profilo(
      this.newListaBambiniFromListaBambini(profilo.bambini),
      profilo.lineaAndataDefault, this.newFermatafromFermata(profilo.fermataAndataDefault),
      profilo.lineaRitornoDefault, this.newFermatafromFermata(profilo.fermataRitornoDefault)
    );
  }

  /** Inizializzazione delle strutture dati: Si richiede al server la lista di linee e le liste delle fermate */
  ngOnInit() {

    let bambini: Array<string> = [];
    let lineaAndataDefault = '';
    let fermataAndataDefault: FermataLogic = new FermataLogic(null, null);
    let lineaRitornoDefault = '';
    let fermataRitornoDefault: FermataLogic = new FermataLogic(null, null);

    this.lineeObs = this.genitoreService.getAllLinee();
    this.fermateDefaultBambiniObs = this.genitoreService.getSalitaDiscesaBambiniDefault();
    this.fermateAndataObs = this.genitoreService.getFermate(lineaAndataDefault);
    this.fermateRitornoObs = this.genitoreService.getFermate(lineaRitornoDefault);

    // chiedo tutte le linee
    this.lineeSub = this.lineeObs.subscribe({
        next: linee => {
          this.linee = linee;
          console.log(linee);

          // verifico se esistono delle fermate di default messe dall'utente
          this.fermateDefaultBambiniSub = this.fermateDefaultBambiniObs.subscribe({
            next: data => {
              bambini = data.bambini;
              lineaAndataDefault = data.nome_linea_andata;
              if (data.fermata_salita_default !== null) {
                fermataAndataDefault = new FermataLogic(
                  data.fermata_salita_default.id, data.fermata_salita_default.descrizione);
              } else {
                fermataAndataDefault = new FermataLogic(null, null);
              }
              lineaRitornoDefault = data.nome_linea_ritorno;
              if (data.fermata_salita_default !== null) {
                fermataRitornoDefault = new FermataLogic(
                  data.fermata_discesa_default.id, data.fermata_discesa_default.descrizione);
              } else {
                fermataRitornoDefault = new FermataLogic(null, null);
              }

              /* se il genitore non ha ancora settato linea e fermate di default,
                 uso come linea di default la prima e come fermate di default le
                 prime della prima linea
              */
              if (lineaAndataDefault == null || lineaRitornoDefault == null) {
                lineaAndataDefault = linee[0]; lineaRitornoDefault = linee[0];
              }
              // chiedo tutte le fermate della linea di default, ordinate per andata e ritorno
              this.fermateAndataObs = this.genitoreService.getFermate(lineaAndataDefault);
              this.fermateRitornoObs = this.genitoreService.getFermate(lineaRitornoDefault);

              this.fermateAndataSub = this.fermateAndataObs.subscribe({
                next: (fermate) => {
                  fermate.andata.forEach(fermata =>
                    this.fermateAndata.push(new FermataLogic(fermata.id, fermata.descrizione)));
                  const indexScuola = this.fermateAndata.findIndex(fermata => fermata.nome === 'Scuola');
                  this.fermateAndata.splice(indexScuola, 1);
                  // ProfiloComponent.updateListaFermate(fermate.andata, this.fermateAndata);

                  this.fermateRitornoSub = this.fermateRitornoObs.subscribe({
                    next: (fermateR) => {
                      fermateR.ritorno.forEach(fermata =>
                        this.fermateRitorno.push(new FermataLogic(fermata.id, fermata.descrizione)));
                      const indexScuolaR = this.fermateRitorno.findIndex(fermata => fermata.nome === 'Scuola');
                      this.fermateRitorno.splice(indexScuolaR, 1);
                      // ProfiloComponent.updateListaFermate(fermate.ritorno, this.fermateRitorno);

                      // se non esistono fermate di default, scelgo le prime (della prima linea)
                      if (fermataAndataDefault.nome == null || fermataRitornoDefault.nome == null) {
                        fermataAndataDefault = ProfiloComponent.newFermatafromFermata(this.fermateAndata[0]);
                        fermataRitornoDefault = ProfiloComponent.newFermatafromFermata(this.fermateRitorno[0]);
                      }

                      this.profilo = new Profilo(
                        bambini, lineaAndataDefault, fermataAndataDefault,
                        lineaRitornoDefault, fermataRitornoDefault
                      );
                      this.profiloBackup = ProfiloComponent.newProfiloFromProfilo(this.profilo);
                    },
                    error: error2 => console.error(error2),
                    complete: () => console.log('fermateRitornoObs completato')
                  });
                },
                error: error2 => console.error(error2),
                complete: () => console.log('fermateAndataObs completato')
              });
            },
            error: error1 => console.error(error1),
            complete: () => console.log('fermateDefaultObs completato')
          });
        },
        error: err => console.error(err),
        complete: () => console.log('lineeObs completato')
      }
    );

  }

  ngOnDestroy() {
    if (this.fermateAndataSub != null && this.fermateRitornoSub) {
      this.fermateAndataSub.unsubscribe();
      this.fermateRitornoSub.unsubscribe();
      if (this.fermateDefaultBambiniSub != null) {
        this.fermateDefaultBambiniSub.unsubscribe();
        if (this.lineeSub != null) {
          this.lineeSub.unsubscribe();
        }
      }
    }
  }

  aggiungiBambino() {
    const dialogRef = this.dialog.open(DialogProfiloComponent, {
      panelClass: 'dialog',
      width: '300px',
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result === undefined) { return; }
      this.profilo.bambini.push(result);
      console.log(this.profilo.bambini, this.profiloBackup.bambini);
    });

  }

  rimuoviBambino(nome: string) { // , index: number
    const indexBambino = this.profilo.bambini.findIndex(bambino => bambino === nome);
    this.profilo.bambini.splice(indexBambino, 1);
    console.log(this.profilo.bambini, this.profiloBackup.bambini);
  }

  onSelectLineaAndata(value: string) {
    this.fermateAndataNuoveObs = this.genitoreService.getFermate(value);
    this.fermateAndata = [];
    this.fermateAndataNuoveObs.subscribe({
      next: (fermate) => {
        fermate.andata.forEach(fermata =>
          this.fermateAndata.push(new FermataLogic(fermata.id, fermata.descrizione)));
        const indexScuola = this.fermateAndata.findIndex(fermata => fermata.nome === 'Scuola');
        this.fermateAndata.splice(indexScuola, 1);
        // ProfiloComponent.updateListaFermate(fermate.andata, this.fermateAndata);

        this.profilo.lineaAndataDefault = value;
        this.profilo.fermataAndataDefault = ProfiloComponent.newFermatafromFermata(this.fermateAndata[0]);
      },
      error: error => console.error(error),
      complete: () => console.log('fermateAndataNuoveObs completato')
    });
  }

  onSelectLineaRitorno(value: string) {
    this.fermateRitornoNuoveObs = this.genitoreService.getFermate(value);
    this.fermateRitorno = [];
    this.fermateRitornoNuoveObs.subscribe({
      next: (fermate) => {
        fermate.ritorno.forEach(fermata =>
          this.fermateRitorno.push(new FermataLogic(fermata.id, fermata.descrizione)));
        const indexScuola = this.fermateRitorno.findIndex(fermata => fermata.nome === 'Scuola');
        this.fermateRitorno.splice(indexScuola, 1);
        // ProfiloComponent.updateListaFermate(fermate.ritorno, this.fermateRitorno);
        this.profilo.lineaRitornoDefault = value;
        this.profilo.fermataRitornoDefault = ProfiloComponent.newFermatafromFermata(this.fermateRitorno[0]);
      },
      error: error => console.error(error),
      complete: () => console.log('fermateRitornoNuoveObs completato')
    });
  }

  onSelectFermataAndata(nome: string) {
    const id = this.fermateAndata.find(fermata => fermata.nome === nome).idFermata;
    this.profilo.fermataAndataDefault = new FermataLogic(id, nome);
  }

  onSelectFermataRitorno(nome: string) {
    const id = this.fermateRitorno.find(fermata => fermata.nome === nome).idFermata;
    this.profilo.fermataRitornoDefault = new FermataLogic(id, nome);
  }

  /** Metodo per mandare al server le nuove informazioni da salvare */
  updateProfilo() {
    this.genitoreService.sendInfoProfilo(
      this.profilo.bambini, this.profilo.fermataAndataDefault.idFermata,
      this.profilo.fermataRitornoDefault.idFermata)
      .subscribe({
        next: (data) => {
          console.log(data);
          this.profilo = new Profilo(
            data.bambini, data.nome_linea_andata,
            new FermataLogic(data.fermata_salita_default.id, data.fermata_salita_default.descrizione),
            data.nome_linea_ritorno,
            new FermataLogic(data.fermata_discesa_default.id, data.fermata_discesa_default.descrizione)
          );
          this.profiloBackup = ProfiloComponent.newProfiloFromProfilo(this.profilo);
          openSnackBar('Informazioni aggiornate correttamente', this.snackbar);
        },
        error: (err) => {
          console.log('Error Profilo Component: sendInfoProfilo()', err);
          this.profilo = ProfiloComponent.newProfiloFromProfilo(this.profiloBackup);
          openSnackBar('Errore nell\'aggiornamento delle informazioni', this.snackbar);
        },
        complete: () =>  console.log('sendInfoProfilo(): done')
      });
  }

  /** Funzione che disabilita il bottone 'Salva' se non sono state apportate modifiche alle informazioni
   * già esistenti, confrontando le variabili 'profilo' e 'profiloBackup'
   */
  disableSalva(): boolean {
    let uguali = true;
    this.profilo.bambini.forEach(bambino => {
      if (!this.profiloBackup.bambini.includes(bambino)) {
        uguali = false;
      }
    });
    this.profiloBackup.bambini.forEach(bambino => {
      if (!this.profilo.bambini.includes(bambino)) {
        uguali = false;
      }
    });
    if (uguali === true) {
      return !(this.profilo.fermataAndataDefault.idFermata !== this.profiloBackup.fermataAndataDefault.idFermata
        || this.profilo.fermataRitornoDefault.idFermata !== this.profiloBackup.fermataRitornoDefault.idFermata);
    } else {
      return uguali;
    }
  }

  getUserNomeCognome(): string {
    return localStorage.getItem('nomeCognome');
  }
}
