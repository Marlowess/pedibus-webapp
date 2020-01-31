import { Turno2 } from './turno2';
/**
 * The Builder interface specifies methods for creating the different parts of
 * the Disponibilita' objects.
 */
interface BuilderTurno2I {
    id(id: any): any;
    nomeLinea(nomeLinea: any): any;

    data(data: any): any;
    direzione(direzione: any): any;

    userId(userId: any): any;
    confermato(confermato: any): any;

    fermataPartenzaId(fermataPartenzaId: any): any;
    fermataArrivoId(fermataArrivoId: any): any;
    build(): any;
}

export class BuilderTurno2 implements BuilderTurno2I {

    static builder: BuilderTurno2 = null;

    private product: Map<string, any> = null;
    //  Class's attributes:
    static keysList: Array<string> = [
        'id',
        'nomeLinea',

        'data',
        'direzione',

        'userId',
        'confermato',

        'fermataPartenzaId',
        'fermataArrivoId',
    ];

    /**
    * A fresh builder instance should contain a blank product object, which is
    * used in further assembly.
    */
    private constructor() {
        this.reset();
    }

    static getBuilder(): BuilderTurno2 {
        if (BuilderTurno2.builder == null) {
            BuilderTurno2.builder = new BuilderTurno2();
        }
        return BuilderTurno2.builder;
    }
    /**
     * Reset the builder instance before starting a new building procedure.
     */
    public reset(): void {
        this.product = new Map<string, string>();
        // this.disponibilita = null;

        // Fill with null value.
        BuilderTurno2.keysList
            .forEach((key: string) => {
                this.product.set(key, null);
            });
    }

    /**
    * Build a new `Object`, after that, all attributes exploited are zeroed for let
    * the `builder` be ready for a new building request.
    * 
    * @returns DisponibilitaBackup
    */
    public build(): Turno2 {

        let result = new Turno2(
            this.product.get('id'),
            this.product.get('nomeLinea'),

            this.product.get('data'),
            this.product.get('direzione'),

            this.product.get('userId'),
            this.product.get('fermataPartenzaId'),

            this.product.get('fermataArrivoId'),
            this.product.get('confermato'),
        );
        // const result = this.disponibilita;
        this.reset();
        return result;
    }

    id(id: string): BuilderTurno2 {
        this.product['id'] = id;
        return this;
    }

    nomeLinea(nomeLinea: string): BuilderTurno2 {
        this.product['nomeLinea'] = nomeLinea;
        return this;
    }

    data(data: Date): BuilderTurno2 {
        this.product['data'] = data;
        return this;
    }
    direzione(direzione: number): BuilderTurno2 {
        this.product['direzione'] = direzione;
        return this;
    }

    userId(userId: string): BuilderTurno2 {
        this.product['userId'] = userId;
        return this;
    }
    confermato(confermato: boolean): BuilderTurno2 {
        this.product['confermato'] = confermato;
        return this;
    }

    fermataPartenzaId(fermataPartenzaId: string): BuilderTurno2 {
        this.product['fermataPartenzaId'] = fermataPartenzaId;
        return this;
    }
    fermataArrivoId(fermataArrivoId: string): BuilderTurno2 {
        this.product['fermataArrivoId'] = fermataArrivoId;
        return this;
    }
}