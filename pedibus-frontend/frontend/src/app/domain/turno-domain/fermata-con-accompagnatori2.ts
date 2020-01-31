// classe per ricevere dal server la fermata con tutti gli accompagnatori disponibili per quella corsa

import {AccompagnatoreConTurni} from './accompagnatore-con-turni';

export class FermataConAccompagnatori2 {
  id: string;
  nome: string;
  indirizzo: string;
  orario: string;
  accompagnatori: Array<AccompagnatoreConTurni>;

  constructor(id: string, nome: string, indirizzo: string, orario: string,
              accompagnatori: Array<AccompagnatoreConTurni>) {
    this.id = id ;
    this.nome = nome;
    this.indirizzo = indirizzo;
    this.orario = orario;
    this.accompagnatori = accompagnatori;
  }

}
