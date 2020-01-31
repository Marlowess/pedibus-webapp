// classe per gestire le notifiche in arrivo quando si è nella vista delle Presenze

export class MessageBetweenAccompagnatori {

    public data: Date;
    public linea: string;
    public direzione: number; // 0 andata, 1 ritorno.
    public bambino: string;
    public prenotatoDaGenitore: boolean;
    public salitoSceso: number;
    public fermataId: string;

    static listProperties = [
        'data',
        'linea',
        'direzione',
        'bambino',
        'prenotatoDaGenitore',
        'salitoSceso',
        'fermataId'
    ];

    constructor() {
        this.data = new Date();
    }

    private newDateFromString(dateString: string) {
        const fields = dateString.toString().split('-');
        const day = fields[0]; const month = fields[1]; const year = fields[2];

        const date = new Date(Number(year), Number(month) - 1, Number(day));
        return date;
    }

    private _deserialize(instanceData: any) {
        // window.alert(`MessageBetweenAccompagnatori _deserialize()`);
        // let objectKeys = Object.getOwnPropertyNames(MessageBetweenAccompagnatori);

        let objectKeys = MessageBetweenAccompagnatori.listProperties;

        // for (const key of keys) {
        for (const key of objectKeys) {
            if (!(key in instanceData)) continue;
            // window.alert(`key: ${key}`);
            if (typeof this[key] == "number") {
                this[key] = parseInt(instanceData[key]);
            }
            else if (typeof this[key] == "boolean") {
                this[key] = (instanceData[key] == 'true') ? true : false;
            }
            else if (this[key] instanceof Date) {
                this[key] = this.newDateFromString(instanceData[key]);
            }
            else {
                this[key] = instanceData[key];
            }
        }
    }

    static deserialize(instanceData: any): MessageBetweenAccompagnatori {
        // Note this.active will not be listed in keys since it's declared, but not defined
        // const keys = Object.keys(this);
        // window.alert(`MessageBetweenAccompagnatori deserialize()`);
        let object = new MessageBetweenAccompagnatori();
        object._deserialize(instanceData);
        return object;
    }
}
