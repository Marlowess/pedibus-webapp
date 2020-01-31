/** Classe che rappresenta solo le informazioni principali di una fermata,
 * usata nel profilo del genitore (component 'Profilo') e nel dialog dei turni ('DialogTurni')
 */

export class FermataLogic {
  idFermata: string;
  nome: string;

  constructor(id: string, nome: string) {
    this.idFermata = id;
    this.nome = nome;
  }
}
