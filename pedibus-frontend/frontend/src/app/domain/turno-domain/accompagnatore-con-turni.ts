// classe per ricevere dal server i dati sull'accompagnatore, fra cui gli eventuali turni all'andata e al ritorno

import {Turno2} from './turno2';

export class AccompagnatoreConTurni {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  // assegnatoAndata: boolean;
  turnoAndata: Turno2;
  // assegnatoRitorno: boolean;
  turnoRitorno: Turno2;
  turnoAndataVecchio: Turno2;
  turnoRitornoVecchio: Turno2;

  constructor(id: string, nome: string, cognome: string, email: string, turnoAndata: Turno2, turnoRitorno: Turno2,
              turnoAndataVecchio: Turno2, turnoRitornoVecchio: Turno2) {
    this.id = id;
    this.nome = nome;
    this.cognome = cognome;
    this.email = email;
    this.turnoAndata = turnoAndata;
    this.turnoRitorno = turnoRitorno;
    this.turnoAndataVecchio = turnoAndataVecchio;
    this.turnoRitornoVecchio = turnoRitornoVecchio;
  }

}
