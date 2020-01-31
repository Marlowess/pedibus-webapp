/** Classe che rappresenta un bambino prenotato dal genitore nel component 'Presenze' */

export class BambinoPresenze {
    public prenotazioneID: string;
    public nome: string;
    public presente: boolean;
    public prenotatoDaGenitore: boolean;

    constructor(
        prenotazioneID: string,
        nome: string,
        presente: boolean,
        prenotatoDaGenitore: boolean,
    ) {
        this.prenotazioneID = prenotazioneID;
        this.nome = nome;
        this.prenotatoDaGenitore = prenotatoDaGenitore;
        this.presente = presente;
    }

    static getHeadersForCsvExport(): Array<string> {
        return [
            'prenotazioneID',
            'nome',
            'presente',
            'prenotatoDaGenitore',
        ]; // .forEach((item: string) => item[0].toUpperCase() + item.substr(1, item.length));
    }

    public serializeByProperties(properties: Array<string>, sale: boolean, scende: boolean) {
        let record: string = null;
        for (const key in properties) {
            if (this[properties[key]] == undefined) continue;
            if (record == null)
                record = this[properties[key]].toString();
            else
                record += ',' + this[properties[key]].toString();
        }
        return record + ',' + sale + ',' + scende;
    }

    public getDictBambinoPresenze(sale: boolean, scende: boolean): any {
        let properties: Array<string> = BambinoPresenze.getHeadersForCsvExport();

        // let record = new Map();
        let record = Object.create(null);

        for (const key in properties) {
            let property = properties[key];
            if(this[property] == undefined) continue;

            // record.set(properties[key], this[properties[key]].toString());
            record[property] = this[property];
        }
        // record.set('sale', sale  == true ? 'true': 'false');
        // record.set('scende', scende == true ? 'true': 'false');
        
        record['sale'] = sale;
        record['scende'] = scende;

        return record;
    }
}
