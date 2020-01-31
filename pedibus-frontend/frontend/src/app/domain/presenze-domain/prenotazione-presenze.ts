// classe per le prenotazioni create da un accompagnatore nella vista delle Presenze

export class PrenotazionePresenze {

    constructor() {
        this.date = null;
    }

    static listProperties = [
        'fermataSalita',
        'fermataDiscesa',
        'reservationId',
        'userId',
        'date',
        'direzione',
        'bambino',
        'linea'
    ];
    // azione: string; - into root json.
    // prenotatoDaGenitore: boolean; - into root json.

    // Prenotazione: - into root json.
    public fermataSalita: string;
    public fermataDiscesa: string;
    public reservationId: string;
    public userId: string;
    public date: Date;
    public direzione: number;
    public bambino: string;
    public linea: string;

    static deserialize(instanceData: any): PrenotazionePresenze {
        // Note this.active will not be listed in keys since it's declared, but not defined
        // const keys = Object.keys(this);
        // window.alert(`PrenotazionePresenze deserialize()`);

        const object = new PrenotazionePresenze();
        object._deserialize(instanceData);

        return object;
    }

    private static newDateFromString(dateString: string) {
        const fields = dateString.toString().split('-');
        const day = fields[0]; const month = fields[1]; const year = fields[2];
        // window.alert(`${day} | ${month} | ${year}`);
        const date = new Date(Number(year), Number(month) - 1, Number(day));
        // window.alert(`${date.toString()}`);
        date.getTimezoneOffset();
        return date;
    }

    private _deserialize(instanceData: any) {
        // window.alert(`PrenotazionePresenze _deserialize()`);

        const objectKeys = PrenotazionePresenze.listProperties;

        // for (const key of keys) {
        for (const key of objectKeys) {
            if (!(key in instanceData)) { continue; }
            // window.alert(`key: ${key}`);
          // tslint:disable-next-line:triple-equals
            if (typeof this[key] == 'number') {
                this[key] = parseInt(instanceData[key], 10);
            } else if (key === 'date') {
                this.date = PrenotazionePresenze.newDateFromString(instanceData[key]);
            } else {
                this[key] = instanceData[key];
            }
        }
    }
}
