// classe per visualizzare le disponibilità nel component Disponibilità

export class DisponibilitaVisual {
  idA: string;
  idR: string;
  date: Date;
  andata: boolean;
  ritorno: boolean;
  modifiedAndata: boolean;
  modifiedRitorno: boolean;
  confermataA: boolean;
  confermataR: boolean;
  // rifiutataA: boolean;
  // rifiutataR: boolean;
  idTurnoA: string;
  idTurnoR: string;
  lineaA: string;
  lineaR: string;
  fermataSalitaTurnoIdA: string;
  oraSalitaA: string;
  fermataSalitaTurnoIdR: string;
  oraSalitaR: string;
  fermataDiscesaTurnoIdA: string;
  oraDiscesaA: string;
  fermataDiscesaTurnoIdR: string;
  oraDiscesaR: string;

  constructor(idA: string, idR: string, date: Date, andata: boolean, ritorno: boolean,
              modifiedA: boolean, modifiedR: boolean,
              confermataA: boolean, confermataR: boolean,
              idTurnoA: string, idTurnoR: string, lineaA: string, lineaR: string,
              fermataSalitaTurnoIdA: string, oraSalitaA: string, fermataSalitaTurnoIdR: string, oraSalitaR: string,
              fermataDiscesaTurnoIdA: string, oraDiscesaA: string, fermataDiscesaTurnoIdR: string,
              oraDiscesaR: string) {
              // rifiutataA: boolean, rifiutataR: boolean,
    this.idA = idA;
    this.idR = idR;
    this.date = date;
    this.andata = andata;
    this.ritorno = ritorno;
    this.modifiedAndata = modifiedA;
    this.modifiedRitorno = modifiedR;
    this.confermataA = confermataA;
    this.confermataR = confermataR;
    // this.rifiutataA = rifiutataA;
    // this.rifiutataR = rifiutataR;
    this.idTurnoA = idTurnoA;
    this.idTurnoR = idTurnoR;
    this.lineaA = lineaA;
    this.lineaR = lineaR;
    this.fermataSalitaTurnoIdA = fermataSalitaTurnoIdA;
    this.oraSalitaA = oraSalitaA;
    this.fermataSalitaTurnoIdR = fermataSalitaTurnoIdR;
    this.oraSalitaR = oraSalitaR;
    this.fermataDiscesaTurnoIdA = fermataDiscesaTurnoIdA;
    this.oraDiscesaA = oraDiscesaA;
    this.fermataDiscesaTurnoIdR = fermataDiscesaTurnoIdR;
    this.oraDiscesaR = oraDiscesaR;
  }
}
