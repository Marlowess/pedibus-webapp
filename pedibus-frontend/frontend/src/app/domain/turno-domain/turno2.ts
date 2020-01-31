export class Turno2 {
  /**
   * Class implemented to send a new object of type `Turno2` to the server:
   */
  public id: string;
  public nomeLinea: string;
  public data: Date;
  public direzione: number;
  public userId: string;
  public fermataPartenzaId: string;
  public fermataArrivoId: string;
  public confermato: boolean;

  constructor(
    id: string,
    nomeLinea: string,
    data: Date,
    direzione: number,
    userId: string,
    fermataPartenzaId: string,
    fermataArrivoId: string,
    confermato: boolean
  ) {

    this.id = id;
    this.nomeLinea = nomeLinea;
    this.data = data;
    this.direzione = direzione;
    this.userId = userId;
    this.fermataPartenzaId = fermataPartenzaId;
    this.fermataArrivoId = fermataArrivoId;
    this.confermato = confermato;
  }

  /* =========================================================================================== */
  /**
   * This static class method, `newTurnoFrom`, is invoked for get easier to create a copy of an existing
   * instance of type `Turno2`
   * @param turno Turno2
   * @returns Turno2
   */
  static newTurnoFrom(turno: Turno2): Turno2 {
    if (turno == null) {
      return null;
    }
    return new Turno2(turno.id, turno.nomeLinea, turno.data, turno.direzione, turno.userId,
      turno.fermataPartenzaId, turno.fermataArrivoId, turno.confermato);
  }

}
