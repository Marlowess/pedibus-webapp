/** Classe che rappresenta un utente accompagnatore o amministratore */

export class AccompOrAdmin {
  id: string;
  nome: string;
  cognome: string;
  linea: string;
  selezionato: boolean;

  constructor(id: string, nome: string, cognome: string, linea: string, selezionato: boolean) {
    this.id = id;
    this.nome = nome;
    this.cognome = cognome;
    this.linea = linea;
    this.selezionato = selezionato;
  }

}
