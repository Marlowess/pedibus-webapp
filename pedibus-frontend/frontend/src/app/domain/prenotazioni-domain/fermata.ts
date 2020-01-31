export class Fermata {
  id: string;
  indirizzo: string;
  descrizione: string;
  orario: string;

  public static creaFermataFrom(fermata: any): Fermata {
    const newF = new Fermata();
    newF.id = fermata.id;
    newF.indirizzo = fermata.indirizzo;
    newF.descrizione = fermata.descrizione;
    newF.orario = fermata.orario;
    return newF;
  }
}
