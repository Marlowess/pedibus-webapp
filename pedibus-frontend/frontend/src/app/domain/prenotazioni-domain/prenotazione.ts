import {Fermata} from './fermata';

export class Prenotazione {
  public id: string; // id prenotazione
  public nomeBambino: string;
  public data: Date;
  public direzione: number;
  public nomeLinea: string;
  public fermataSalita: Fermata;
  public fermataDiscesa: Fermata;

  public static creaPrenotazioneFrom(prenotazione: any) {
    const newP = new Prenotazione();
    newP.data = prenotazione.data;
    // newP.userId = prenotazione.userId;
    newP.id = prenotazione.id;
    newP.direzione = prenotazione.direzione;
    newP.fermataSalita = Fermata.creaFermataFrom(prenotazione.fermataSalita);
    newP.fermataDiscesa = Fermata.creaFermataFrom(prenotazione.fermataDiscesa);
    newP.nomeBambino = prenotazione.nomeBambino;
    newP.nomeLinea = prenotazione.nomeLinea;
    // newP.descrizione = prenotazione.descrizione;
    // newP.dataPrenotazione = prenotazione.dataPrenotazione;
    return newP;
  }

  public isEmpty(): boolean {
    return this.data == null && this.direzione == null
      && this.fermataSalita == null && this.fermataDiscesa == null
      && this.nomeBambino == null && this.nomeLinea == null;
  }

  public serialize() {
    return {
      data: this.data,
      // userId: this.userId,
      direzione: this.direzione,
      fermataSalita: this.fermataSalita,
      fermataDiscesa: this.fermataSalita,
      nomeBambino: this.nomeBambino,
      nomeLinea: this.nomeLinea,
    };
  }

  public craPrenotazioneBodyPost() {
    return {
      // userId: this.userId,
      direzione: this.direzione,
      fermataSalita: this.fermataSalita,
      fermataDiscesa: this.fermataDiscesa,
      bambino: this.nomeBambino,
    };
  }

  private serialize_v2() {
    const result = new Map<string, string>();
    const keys = Object.keys(this);

    for (const key of keys) {
      result[key] = this[key];
    }
    return result;
  }
}
