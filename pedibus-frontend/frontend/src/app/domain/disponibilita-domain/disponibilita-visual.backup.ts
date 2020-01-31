// classe per visualizzare le disponibilità nel component Disponibilità
import { BuilderDisponibilita } from './builder-disponibilita';
import { Disponibilita } from './disponibilita';
import { DisponibilitaBackup } from './disponibilita.backup';
import { forwardRef } from '@angular/core';

const enum DIRECTION {
  FORWARD = 0,
  BACKWARD
}

export class DisponibilitaVisualBackup {

  static builder: BuilderDisponibilita = BuilderDisponibilita.getBuilder();
  public disponibilitaAndata: DisponibilitaBackup = null;
  public disponibilitaRitorno: DisponibilitaBackup = null;

  /* ========================================================================================= */
  /**
   * Constructor for building a object `DisponibilitaVisualBackup`
   * @param andataEOritorno Array<any>
   * @param date Date
   */
  constructor(andataEOritorno: Array<any>, date: Date) {

    // Check if constructing Disponibilita' for 'Andata'
    // otherwise the ritorno-object will be set to default obeject
    this.disponibilitaAndata = DisponibilitaVisualBackup.builder.build();
    this.disponibilitaAndata.date = date;
    this.disponibilitaAndata.direzione = false;
    this.disponibilitaAndata.confermata = false;

    this.disponibilitaRitorno = DisponibilitaVisualBackup.builder.build();
    this.disponibilitaRitorno.date = date;
    this.disponibilitaRitorno.direzione = false;
    this.disponibilitaRitorno.confermata = false;

    if (andataEOritorno[0].disponibilitaInfos !== null) {
      const disponibilitaIdA = andataEOritorno[0].disponibilitaInfos.id;
      const existsA = true;
      if (andataEOritorno[0].turno !== null) {
        this.buildDisponibilita(
          andataEOritorno[0],
          date,
          existsA,
          disponibilitaIdA,
          DIRECTION.FORWARD);
      } else {
        this.disponibilitaAndata = DisponibilitaVisualBackup.builder.build();
        this.disponibilitaAndata.date = date;
        this.disponibilitaAndata.direzione = existsA;
        this.disponibilitaAndata.disponibilitaId = disponibilitaIdA;
        this.disponibilitaAndata.confermata = false;
      }

    }

    // Check if constructing Disponibilita' for 'Ritorno'
    // otherwise the ritorno-object will be set to default obeject
    if (andataEOritorno[1].disponibilitaInfos !== null) {
      const disponibilitaIdR = andataEOritorno[1].disponibilitaInfos.id;
      const existsR = true;
      if (andataEOritorno[1].turno !== null) {

        this.buildDisponibilita(
          andataEOritorno[1],
          date,
          existsR,
          disponibilitaIdR,
          DIRECTION.BACKWARD);
      } else {
        this.disponibilitaRitorno = DisponibilitaVisualBackup.builder.build();
        this.disponibilitaRitorno.date = date;
        this.disponibilitaRitorno.direzione = existsR;
        this.disponibilitaRitorno.disponibilitaId = disponibilitaIdR;
        this.disponibilitaRitorno.confermata = false;
      }

    }

  } // Here, ends constructor method!

  /* ========================================================================================= */
  /**
   * Builds a new `DisponibilitaBackup` object by means of static object `builder` provided
   * exactly for that purpose.
   *
   * @param infoBuilding any
   * @param date Date
   * @param exists: boolean
   * @param direzione boolean
   * @param disponibilitaId DIRECTION
   */
  private buildDisponibilita(infoBuilding: any, date: Date, exists: boolean, disponibilitaId: string, direzione: DIRECTION) {
    // Reset builder, redundantely.
    DisponibilitaVisualBackup.builder.reset();

    // Create disponibilita using builder.
    const disponibilita =
      DisponibilitaVisualBackup.builder
        .linea(infoBuilding.nomeLinea)
        .direzione(exists)
        .idTurno(infoBuilding.turno.id)
        .confermata(infoBuilding.turno.confermato)
        .fermataSalitaTurnoId(infoBuilding.turno.partenza.id)
        .fermataDiscesaTurnoId(infoBuilding.turno.arrivo.id)
        .fermataSalitaTurnoIndirizzo(infoBuilding.turno.partenza.indirizzo)
        .fermataDiscesaTurnoIndirizzo(infoBuilding.turno.arrivo.indirizzo)
        .fermataSalitaTurnoDescrizione(infoBuilding.turno.partenza.descrizione)
        .fermataDiscesaTurnoDescrizione(infoBuilding.turno.arrivo.descrizione)
        .oraSalita(infoBuilding.turno.partenza.orario)
        .oraDiscesa(infoBuilding.turno.arrivo.orario)
        .date(date)
        .disponibilitaId(disponibilitaId)
        .build();

    // Check direction then assign the new disponibilita' to proper object representing a disponibilita' along that direction.
    if (direzione === DIRECTION.FORWARD) {
      this.disponibilitaAndata = disponibilita;
    } else {
      this.disponibilitaRitorno = disponibilita;
    }
  }

  /* ========================================================================================= */
  /*                                         HANDLING FORKJOIN                                 */
  /* ========================================================================================= */
  private updateBecauseOfSucces(result: any) {
    if (result.data_type === 'add') {
      const id = result.data.disponibilita.id;
      if (this.getDate() === result.date) {
        if (result.direzione === 0) {
          this.disponibilitaAndata.disponibilitaId = id;
          this.disponibilitaAndata.direzione = true;
          this.disponibilitaAndata.modified = false;
        } else {
          this.disponibilitaRitorno.disponibilitaId = id;
          this.disponibilitaRitorno.direzione = true;
          this.disponibilitaRitorno.modified = false;
        }
      }
    } else if (result.data_type === 'delete') {
      if (this.disponibilitaAndata.disponibilitaId === result.dispID) {
        this.disponibilitaAndata.direzione = false;
        this.disponibilitaAndata.modified = false;
      } else {
        if (this.disponibilitaRitorno.disponibilitaId === result.dispID) {
          this.disponibilitaRitorno.direzione = false;
          this.disponibilitaRitorno.modified = false;
        }
      }
    }
  }

  private updateBecauseOfError(result: any) {
    // const id = result.data.disponibilita.id;
    if (result.data_type === 'add') {
      if (this.getDate() === result.date) {
        if (result.direzione === 0) {
          // this.disponibilitaAndata.disponibilitaId = id;
          this.disponibilitaAndata.direzione = false;
          this.disponibilitaAndata.modified = false;
        } else {
          // this.disponibilitaRitorno.disponibilitaId = id;
          this.disponibilitaRitorno.direzione = false;
          this.disponibilitaRitorno.modified = false;
        }
      }
    } else if (result.data_type === 'delete') {
      if (this.disponibilitaAndata.disponibilitaId === result.dispID) {
        this.disponibilitaAndata.direzione = true;
        this.disponibilitaAndata.modified = false;
      } else {
        if (this.disponibilitaRitorno.disponibilitaId === result.dispID) {
          this.disponibilitaRitorno.direzione = true;
          this.disponibilitaRitorno.modified = false;
        }
      }
    }
  }

  public updateAfterForkJoin(result: any): any {
    if (!result.error) {
      this.updateBecauseOfSucces(result);
      return null;
    } else {
      this.updateBecauseOfError(result);
      return {
        error: true,
        errorText: result.error_text.error.errore
      };
    }
  }

  /* ========================================================================================= */
  /*                                               SETTERS                                     */
  /* ========================================================================================= */

  public setExistsAndata(exists: boolean): boolean {
    return this.disponibilitaAndata.direzione = exists;
  }

  public setExistsRitorno(exists: boolean): boolean {
    return this.disponibilitaRitorno.direzione = exists;
  }

  /* ========================================================================================= */
  public setConfermataAndata(conferma: boolean) {
    this.disponibilitaAndata.confermata = conferma;
  }

  public setConfermataRitorno(conferma: boolean) {
    this.disponibilitaRitorno.confermata = conferma;
  }

  /* ========================================================================================= */
  public setIdTurnoAndata(idTurno: string) {
    this.disponibilitaAndata.idTurno = idTurno;
  }

  public setIdTurnoRitorno(idTurno: string) {
    this.disponibilitaRitorno.idTurno = idTurno;
  }

  /* ========================================================================================= */
  public toggleModifiedAndata() {
    this.disponibilitaAndata.modified = !this.disponibilitaAndata.modified;
  }

  public toggleModifiedRitorno() {
    this.disponibilitaRitorno.modified = !this.disponibilitaRitorno.modified;
  }

  /* ========================================================================================= */
  /*                                               GETTERS                                     */
  /* ========================================================================================= */

  /* ========================================================================================= */
  public getSalitaIdAndata(): string {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.fermataSalitaTurnoId;
  }
  public getSalitaIndirizzoAndata(): string {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.fermataSalitaTurnoIndirizzo;
  }
  public getSalitaDescrizioneAndata(): string {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.fermataSalitaTurnoDescrizione;
  }

  public getDiscesaIdAndata(): string {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.fermataDiscesaTurnoId;
  }
  public getDiscesaIndirizzoAndata(): string {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.fermataDiscesaTurnoIndirizzo;
  }
  public getDiscesaDescrizioneAndata(): string {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.fermataDiscesaTurnoDescrizione;
  }

  public getSalitaIdRitorno(): string {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.fermataSalitaTurnoId;
  }
  public getSalitaIndirizzoRitorno(): string {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.fermataSalitaTurnoIndirizzo;
  }
  public getSalitaDescrizioneRitorno(): string {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.fermataSalitaTurnoDescrizione;
  }

  public getDiscesaIdRitorno(): string {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.fermataDiscesaTurnoId;
  }
  public getDiscesaIndirizzoRitorno(): string {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.fermataDiscesaTurnoIndirizzo;
  }
  public getDiscesaDescrizioneRitorno(): string {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.fermataDiscesaTurnoDescrizione;
  }

  /* ========================================================================================= */

  public getLineaAndata(): string {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.linea;
  }

  public getLineaRitorno(): string {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.linea;
  }

  /* ========================================================================================= */

  public getIdTurnoAndata(): string {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.idTurno;
  }

  public getIdTurnoRitorno(): string {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.idTurno;
  }

  /* ========================================================================================= */
  public getIdDisponibilitaAndata(): string {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.disponibilitaId;
  }

  public getIdDisponibilitaRitorno(): string {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.disponibilitaId;
  }

  /* ========================================================================================= */

  public getDate(): Date {
    const dateAndata = this.getDateAndata();
    const dateRitorno = this.getDateAndata();
    return dateAndata != null ? dateAndata : dateRitorno;
  }
  public getDateAndata(): Date {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.date;
  }

  public getDateRitorno(): Date {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.date;
  }

  /* ========================================================================================= */
  public areAndataOrRitornoModified(): boolean {
    return this.isModifiedAndata() || this.isModifiedRitorno();
  }

  /* ========================================================================================= */
  public isModifiedAndata(): boolean {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.modified;
  }

  public isModifiedRitorno(): boolean {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.modified;
  }

  /* ========================================================================================= */
  public existsAndata(): boolean {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.direzione;
  }

  public existsRitorno(): boolean {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.direzione;
  }

  /* ========================================================================================= */
  public getConfermataAndata(): boolean {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.confermata;
  }

  public getConfermataRitorno(): boolean {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.confermata;
  }

  /* ========================================================================================= */

  public getOraSalitaAndata(): string {
    // const dateRitorno: Date = this.getDateRitorno();
    // if (dateRitorno == null) return null;
    // return dateRitorno.getHours().toString();
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.oraSalita;
  }

  public getOraDiscesaAndata(): string {
    if (this.disponibilitaAndata == null) { return null; }
    return this.disponibilitaAndata.oraDiscesa;
  }

  public getOraSalitaRitorno(): string {
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.oraSalita;
  }

  public getOraDiscesaRitorno(): string {
    // const dateRitorno: Date = this.getDateRitorno();
    // if (dateRitorno == null) return null;
    // return dateRitorno.getHours().toString();
    if (this.disponibilitaRitorno == null) { return null; }
    return this.disponibilitaRitorno.oraDiscesa;
  }

  /* ========================================================================================= */
  /*                                         HANDLING NOTIFICATION                             */
  /* ========================================================================================= */

  /**
   * Public method `updateOnNotification` used when a new notification is received from server
   * about a `Turno` is either `add` or `modify`.
   * @param responseNotification any
   */
  public updateOnNotification(responseNotification: any) {
    const direzione: number = responseNotification.corsa.direzione;
    const nomeLinea: string = responseNotification.nomeLinea;

    const fermataPartenza: any = responseNotification.fermataPartenza;
    const fermataArrivo: any = responseNotification.fermataArrivo;
    const idTurno: string = responseNotification.id;

    if (direzione === DIRECTION.FORWARD) {
      // console.info(``);
      this.disponibilitaAndata.idTurno = idTurno;
      this.disponibilitaAndata.linea = nomeLinea;

      this.disponibilitaAndata.oraSalita = fermataPartenza.orario;
      this.disponibilitaAndata.fermataSalitaTurnoId = fermataPartenza.id;
      this.disponibilitaAndata.fermataSalitaTurnoIndirizzo = fermataPartenza.indirizzo;
      this.disponibilitaAndata.fermataSalitaTurnoDescrizione = fermataPartenza.descrizione;

      this.disponibilitaAndata.oraDiscesa = fermataArrivo.orario;
      this.disponibilitaAndata.fermataDiscesaTurnoId = fermataArrivo.id;
      this.disponibilitaAndata.fermataDiscesaTurnoIndirizzo = fermataArrivo.indirizzo;
      this.disponibilitaAndata.fermataDiscesaTurnoDescrizione = fermataArrivo.descrizione;
      this.disponibilitaAndata.confermata = false;

    } else if (direzione === DIRECTION.BACKWARD) {
      // console.info(``);
      this.disponibilitaRitorno.idTurno = idTurno;
      this.disponibilitaRitorno.linea = nomeLinea;

      this.disponibilitaRitorno.oraSalita = fermataPartenza.orario;
      this.disponibilitaRitorno.fermataSalitaTurnoId = fermataPartenza.id;
      this.disponibilitaRitorno.fermataSalitaTurnoIndirizzo = fermataPartenza.indirizzo;
      this.disponibilitaRitorno.fermataSalitaTurnoDescrizione = fermataPartenza.descrizione;

      this.disponibilitaRitorno.oraDiscesa = fermataArrivo.orario;
      this.disponibilitaRitorno.fermataDiscesaTurnoId = fermataArrivo.id;
      this.disponibilitaRitorno.fermataDiscesaTurnoIndirizzo = fermataArrivo.indirizzo;
      this.disponibilitaRitorno.fermataDiscesaTurnoDescrizione = fermataArrivo.descrizione;
      this.disponibilitaRitorno.confermata = false;
    } else {
      // Do nothing if direction is not allowed, and return immediately.
      // console.warn(`Error direzione value nont allowed: ${direzione}`);
      return;
    }
  }

  /* ========================================================================================= */
  /**
   * Public method `deleteOnNotification` used when a new notification is received from server
   * about a `Turno` is either be `delete`.
   * @param responseNotification any
   */
  public deleteOnNotification(responseNotification: any) {
    const direzione: number = responseNotification.corsa.direzione;

    if (direzione === DIRECTION.FORWARD) {
      // console.info(``);
      this.disponibilitaAndata.idTurno = null;
      this.disponibilitaAndata.linea = null;

      this.disponibilitaAndata.oraSalita = null;
      this.disponibilitaAndata.fermataSalitaTurnoId = null;

      this.disponibilitaAndata.oraDiscesa = null;
      this.disponibilitaAndata.fermataDiscesaTurnoId = null;
      this.disponibilitaAndata.confermata = false;

    } else if (direzione === DIRECTION.BACKWARD) {
      // console.info(``);
      this.disponibilitaRitorno.idTurno = null;
      this.disponibilitaRitorno.linea = null;

      this.disponibilitaRitorno.oraSalita = null;
      this.disponibilitaRitorno.fermataSalitaTurnoId = null;

      this.disponibilitaRitorno.oraDiscesa = null;
      this.disponibilitaRitorno.fermataDiscesaTurnoId = null;
      this.disponibilitaRitorno.confermata = false;

    } else {
      // Do nothing if direction is not allowed, and return immediately.
      // console.warn(`Error direzione value non allowed: ${direzione}`);
      return;
    }
  }

}
