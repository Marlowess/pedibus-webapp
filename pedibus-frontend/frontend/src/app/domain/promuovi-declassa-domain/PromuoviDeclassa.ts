/** Classe contenente la lista di accompagnatori promuovibili ad amministratore e la lista di
 * amministratori declassabili ad accompagnatori
 */

import {AccompOrAdmin} from './accomp-or-admin';

export class PromuoviDeclassa {

  accompagnatori: Array<AccompOrAdmin>;
  amministratori: Array<AccompOrAdmin>;

  constructor(accompagnatori: Array<AccompOrAdmin>, amministratori: Array<AccompOrAdmin>) {
    this.accompagnatori = accompagnatori;
    this.amministratori = amministratori;
  }

}
