/** Classe per mandare al server le informazioni su un nuovo utente da registrare nel servizio */

export class Utente {
  indirizzoEmail: string;
  ruolo: string;

  constructor(indirizzoEmail: string, ruolo: string) {
    this.indirizzoEmail = indirizzoEmail;
    this.ruolo = ruolo;
  }

}
