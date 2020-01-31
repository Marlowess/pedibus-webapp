// classe per ricevere dal server tutte le informazioni sui turni di una corsa

import {FermataConAccompagnatori2} from './fermata-con-accompagnatori2';

export class CorsaConTurni2 {
  nomeLinea: string;
  data: Date;
  fermateConAccAndata: Array<FermataConAccompagnatori2>;
  fermateConAccRitorno: Array<FermataConAccompagnatori2>;

  constructor(nomeLinea: string, data: Date,
              fermateConAccAndata: Array<FermataConAccompagnatori2>,
              fermateConAccRitorno: Array<FermataConAccompagnatori2>) {
    this.nomeLinea = nomeLinea ;
    this.data = data;
    this.fermateConAccAndata = fermateConAccAndata;
    this.fermateConAccRitorno = fermateConAccRitorno;
  }

}
