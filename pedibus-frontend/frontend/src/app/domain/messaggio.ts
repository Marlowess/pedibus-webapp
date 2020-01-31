/** Classe per il messaggio per il component 'Comunicazioni' */

export class Messaggio {
  public id: string;
  public topic: string;
  public testo: string;
  public letta: boolean;
  public timestamp: any;

  constructor(messaggio: any) {
    this.id = messaggio.id;
    this.topic = messaggio.topic;
    this.testo = messaggio.testo;
    this.letta = messaggio.letta;
    this.timestamp = messaggio.timestamp;
  }
}
