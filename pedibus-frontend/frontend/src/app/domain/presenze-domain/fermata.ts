/** Classe che rappresenta un bambino nel component 'Presenze', con le informazioni relative alla sua
 * prenotazione alla corsa e il campo 'inTurno', che indica se è in una fermata compresa nel turno
 * dell'utente accompagnatore
 */

import { BambinoPresenze } from './bambino-presenze';

export class Fermata {

    public fermataID: string = null;
    public indirizzo: string = null;
    public orario: string = null;
    public descrizione: string = null;
    public salita: Array<BambinoPresenze> = null;
    public discesa: Array<BambinoPresenze> = null;
    public inTurno: boolean = null;

    constructor(fermataID: string, orario: string, indirizzo: string, descrizione: string, inTurno: boolean) {
        this.fermataID = fermataID;
        this.orario = orario;

        this.indirizzo = indirizzo;
        this.descrizione = descrizione;

        this.salita = new  Array<BambinoPresenze>();
        this.discesa = new  Array<BambinoPresenze>();
        this.inTurno = inTurno;
    }

    static getHeadersForCsvExport(): Array<string> {
        return [
            'fermataID',
            'indirizzo',
            'orario',
            'descrizione',
        ]; // .forEach((item: string) => item[0].toUpperCase() + item.substr(1, item.length));
    }

    public serializeByProperties(properties: Array<string>, direction: string): string {
        let record: string = null;
        for (const key in properties) {
            if (this[properties[key]] === undefined) { continue; }
            if (record == null) {
                record = this[properties[key]].toString();
            } else {
                record += ',' + this[properties[key]].toString();
            }
        }
        return record + ',' + direction;
    }

    public getDictFermata(direction: string): any  {
        const properties: Array<string> = Fermata.getHeadersForCsvExport();

        // let record = new Map();
        const record = Object.create(null);

      // tslint:disable-next-line:forin
        for (const key in properties) {
            const property = properties[key];
            if (this[property] === undefined) { continue; }

            // record.set(properties[key], this[properties[key]].toString());
            record[property] = this[property];
        }
        // record.set('direction', direction);
        record.direction = direction;
        return record;
    }
}
