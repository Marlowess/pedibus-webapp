// import { Disponibilita } from './disponibilita';
import { DisponibilitaBackup } from './disponibilita.backup';
/**
 * The Builder interface specifies methods for creating the different parts of
 * the Disponibilita' objects.
 */
interface BuilderDisponibilitaI {
  date(date: any): any;
  direzione(direzione: any): any;

  idTurno(idTurno: any): any;
  linea(linea: any): any;

  fermataSalitaTurnoId(fermataSalitaTurnoId: any): any;
  fermataSalitaTurnoIndirizzo(fermataSalitaTurnoIndirizzo: any): any;
  fermataSalitaTurnoDescrizione(fermataSalitaDescrizione: any): any;
  oraSalita(oraSalita: any): any;

  fermataDiscesaTurnoId(fermataDiscesaTurnoId: any): any;
  fermataDiscesaTurnoIndirizzo(fermataDiscesaTurnoIndirizzo: any): any;
  fermataDiscesaTurnoDescrizione(fermataDiscesaDescrizione: any): any;
  oraDiscesa(oraDiscesa: any): any;

  confermata(confermata: any): any;
  modified(modified: any): any;
  disponibilitaId(disponibilitaId: any): any;
}

export class BuilderDisponibilita implements BuilderDisponibilitaI {

  /**
   * A fresh builder instance should contain a blank product object, which is
   * used in further assembly.
   */
  private constructor() {
    this.reset();
  }
  static builder: BuilderDisponibilita = null;

  //  Class's attributes:
  static keysList: Array<string> = [
    'date',
    'direzione',
    'idTurno',
    'linea',
    'fermataSalitaTurnoId',
    'fermataSalitaTurnoIndirizzo',
    'fermataSalitaTurnoDescrizione',
    'oraSalita',
    'fermataDiscesaTurnoId',
    'fermataDiscesaIndirizzo',
    'fermataDiscesaTurnoDescrizione',
    'oraDiscesa',
    'confermata',
    'modified',
    'disponibilitaId',
  ];

  // Private instance's attributes:
  // private disponibilita: DisponibilitaBackup;
  private product: Map<string, any> = null;

  static getBuilder() {
    if (BuilderDisponibilita.builder == null) {
      BuilderDisponibilita.builder = new BuilderDisponibilita();
    }
    return BuilderDisponibilita.builder;
  }
  /**
   * Reset the builder instance before starting a new building procedure.
   */
  public reset(): void {
    this.product = new Map<string, string>();
    // this.disponibilita = null;

    // Fill with null value.
    BuilderDisponibilita.keysList
      .forEach((key: string) => {
        this.product.set(key, null);
      });
  }

  /**
   * Build a new `Object`, after that, all attributes exploited are zeroed for let
   * the `builder` be ready for a new building request.
   *
   * @returns DisponibilitaBackup
   */
  public build(): DisponibilitaBackup {
    const modified = this.product.get('modified') != null ? (this.product.get('modified') === 'true') : false;

    // this.disponibilita = new DisponibilitaBackup(
    const result = new DisponibilitaBackup(
      this.product.get('date'),
      this.product.get('direzione'),

      this.product.get('idTurno'),
      this.product.get('linea'),

      this.product.get('fermataSalitaTurnoId'),
      this.product.get('fermataSalitaTurnoIndirizzo'),
      this.product.get('fermataSalitaTurnoDescrizione'),
      this.product.get('oraSalita'),

      this.product.get('fermataDiscesaTurnoId'),
      this.product.get('fermataDiscesaTurnoIndirizzo'),
      this.product.get('fermataDiscesaTurnoDescrizione'),
      this.product.get('oraDiscesa'),

      this.product.get('confermata'),
      modified,
      this.product.get('disponibilitaId'),
    );
    // const result = this.disponibilita;
    this.reset();
    return result;
  }

  public date(date: Date): BuilderDisponibilita {
    this.product.set('date', date);
    return this;
  }

  public direzione(direzione: boolean): BuilderDisponibilita {
    this.product.set('direzione', direzione);
    return this;
  }

  public idTurno(idTurno: string): BuilderDisponibilita {
    this.product.set('idTurno', idTurno);
    return this;
  }

  public linea(linea: string): BuilderDisponibilita {
    this.product.set('linea', linea);
    return this;
  }

  public fermataSalitaTurnoId(fermataSalitaTurnoId: string): BuilderDisponibilita {
    this.product.set('fermataSalitaTurnoId', fermataSalitaTurnoId);
    return this;
  }
  public fermataSalitaTurnoIndirizzo(fermataSalitaTurnoIndirizzo: string): BuilderDisponibilita {
    this.product.set('fermataSalitaTurnoIndirizzo', fermataSalitaTurnoIndirizzo);
    return this;
  }
  public fermataSalitaTurnoDescrizione(fermataSalitaTurnoDescrizione: string): BuilderDisponibilita {
    this.product.set('fermataSalitaTurnoDescrizione', fermataSalitaTurnoDescrizione);
    return this;
  }
  public oraSalita(oraSalita: string): BuilderDisponibilita {
    this.product.set('oraSalita', oraSalita.toString());
    return this;
  }

  public fermataDiscesaTurnoId(fermataDiscesaTurnoId: string): BuilderDisponibilita {
    this.product.set('fermataDiscesaTurnoId', fermataDiscesaTurnoId.toString());
    return this;
  }
  public fermataDiscesaTurnoIndirizzo(fermataDiscesaTurnoIndirizzo: string): BuilderDisponibilita {
    this.product.set('fermataDiscesaTurnoIndirizzo', fermataDiscesaTurnoIndirizzo.toString());
    return this;
  }
  public fermataDiscesaTurnoDescrizione(fermataDiscesaTurnoDescrizione: string): BuilderDisponibilita {
    this.product.set('fermataDiscesaTurnoDescrizione', fermataDiscesaTurnoDescrizione.toString());
    return this;
  }
  public oraDiscesa(oraDiscesa: string): BuilderDisponibilita {
    this.product.set('oraDiscesa', oraDiscesa.toString());
    return this;
  }

  public confermata(confermata: boolean): BuilderDisponibilita {
    this.product.set('confermata', confermata);
    return this;
  }
  public modified(modified: boolean): BuilderDisponibilita {
    this.product.set('confermata', modified);
    return this;
  }

  disponibilitaId(disponibilitaId: string): BuilderDisponibilita {
    this.product.set('disponibilitaId', disponibilitaId);
    return this;
  }
}
