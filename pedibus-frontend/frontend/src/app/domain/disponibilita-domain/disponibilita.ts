// classe per mandare al server una nuova disponibilità

export class Disponibilita {

  // When a `Turno` takes place for, a user of type `ACCOMPAGNATORE` settles his own activity.
  // specifying the direction, forward or bakward after school time.
  public date: Date;
  public direzione: number;


  constructor(
    date: Date,
    direzione: number,
    ) {

    this.date = date;
    this.direzione = direzione;
  }

}
