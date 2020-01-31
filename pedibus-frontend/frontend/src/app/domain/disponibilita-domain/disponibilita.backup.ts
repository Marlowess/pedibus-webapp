// classe per mandare al server una nuova disponibilità

export class DisponibilitaBackup {

  // When a `Turno` takes place for, a user of type `ACCOMPAGNATORE` settles his own activity.
  // specifying the direction, forward or bakward after school time.
  public date: Date;
  public direzione: boolean;

  // For whih `Turno` a user of type `ACCOMPAGNATORE` settles his own activity.
  public idTurno: string;
  public linea: string;

  // Where a user of type `ACCOMPAGNATORE` begins his own activity.
  public fermataSalitaTurnoId: string;
  public fermataSalitaTurnoIndirizzo: string;
  public fermataSalitaTurnoDescrizione: string;
  public oraSalita: string;

  // Where a user of type `ACCOMPAGNATORE` ends his own activity.
  public fermataDiscesaTurnoId: string;
  public fermataDiscesaTurnoIndirizzo: string;
  public fermataDiscesaTurnoDescrizione: string;
  public oraDiscesa: string;

  public confermata: boolean;
  public modified: boolean;

  public disponibilitaId: string;

  constructor(
    date: Date,
    direzione: boolean,

    idTurno: string,
    linea: string,

    fermataSalitaTurnoId: string,
    fermataSalitaTurnoIndirizzo: string,
    fermataSalitaTurnoDescrizione: string,
    oraSalita: string,

    fermataDiscesaTurnoId: string,
    fermataDiscesaTurnoIndirizzo: string,
    fermataDiscesaTurnoDescrizione: string,
    oraDiscesa: string,

    confermata: boolean,
    modified: boolean,

    disponibilitaId: string,
    ) {

    this.date = date;
    this.direzione = direzione;

    this.idTurno = idTurno;
    this.linea = linea;

    this.fermataSalitaTurnoId = fermataSalitaTurnoId;
    this.fermataSalitaTurnoIndirizzo = fermataSalitaTurnoIndirizzo;
    this.fermataSalitaTurnoDescrizione = fermataSalitaTurnoDescrizione;
    this.oraSalita = oraSalita;

    this.fermataDiscesaTurnoId = fermataDiscesaTurnoId;
    this.fermataDiscesaTurnoIndirizzo = fermataDiscesaTurnoIndirizzo;
    this.fermataDiscesaTurnoDescrizione = fermataDiscesaTurnoDescrizione;
    this.oraDiscesa = oraDiscesa;

    this.confermata = confermata;
    this.modified = modified;

    this.disponibilitaId = disponibilitaId;
  }

}
