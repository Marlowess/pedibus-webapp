/** Classe per rappresentare le informazioni del profilo di un utente genitore, cioè i bambini e le fermate
 * di default per le prenotazioni
 */

import {FermataLogic} from '../fermata-logic';

export class Profilo {
  bambini: Array<string>;
  lineaAndataDefault: string;
  fermataAndataDefault: FermataLogic;
  lineaRitornoDefault: string;
  fermataRitornoDefault: FermataLogic;

  constructor(bambini: Array<string>, lineaAndataDefault: string, fermataAndataDefault: FermataLogic,
              lineaRitornoDefault: string, fermataRitornoDefault: FermataLogic) {
    this.bambini = bambini;
    this.lineaAndataDefault = lineaAndataDefault;
    this.fermataAndataDefault = fermataAndataDefault;
    this.lineaRitornoDefault = lineaRitornoDefault;
    this.fermataRitornoDefault = fermataRitornoDefault;
  }

}
