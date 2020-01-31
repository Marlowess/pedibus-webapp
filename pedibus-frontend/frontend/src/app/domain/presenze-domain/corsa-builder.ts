import { BambinoNonPrenotatoPresenze } from './bambino-non-prenotato-presenze';
import { CorsaPresenze } from './corsa';
import { Fermata } from './fermata';

interface CorsaBuilderI {
    date(date: any): any;
}

export class CorsaBuilder implements CorsaBuilderI {

    // Static Singletone CorsaBuilder instance.
    static builder: CorsaBuilder = null;

    // instance's private attributes.
    private mapValues: Map<string, any> = null;
    private attributeNamesList: Array<string> = [
        'date',
        'nomeLinea',
        'flagCompletataAndata',
        'flagCompletataRitorno',
        'fermateAndata',
        'fermateRitorno',
        'bambiniNonPrenotatiAndata',
        'bambiniNonPrenotatiRitorno'
    ]

    // Private Constructor.
    private constructor() { }

    /**
     * Static method `getBuilder` allows to obtain a singletone-like instance of `CorsaBuilder` class. 
     * @returns CorsaBuilder
     * @throws dict = {
     *                 code: -1,
     *                 message: 'Error: unable to create a singletone instance of class CorsaBuilder.'
     *                }
     */
    static getBuilder(): CorsaBuilder {
        try {
            if (CorsaBuilder.builder == null) {
                CorsaBuilder.builder = new CorsaBuilder();
            }
            return CorsaBuilder.builder;
        } catch (err) {
            throw {
                code: -1,
                message: 'Error: unable to create a singletone instance of class CorsaBuilder.'
            };
        }
    }
    /**
     * Public instance's method `reset`, used to re-initialize builder singletone instance in order to let it start a new building
     * from scratch.
     */
    public reset() {
        this.attributeNamesList
            .forEach((attributeName: string) => {
                this.mapValues[attributeName] = null;
            })
    }

    /**
     * Private instance's method `getDefaultValue` which retrieve a default hardcode
     * value for the provided attribute-name used later to construct a instance of class `CorsaPresenze`
     * @param attributeName string
     * @returns any
     */
    private getDefaultValue(attributeName: string): any {
        switch (attributeName) {
            case 'date': return null;
            case 'nomeLinea': return null;
            case 'flagPartitiRitorno': return false;
            case 'flagCompletataAndata': return false;
            case 'flagCompletataRitorno': return false;
            case 'fermateAndata': return new Array<Fermata>();
            case 'fermateRitorno': return new Array<Fermata>();
            case 'bambiniNonPrenotatiAndata': return new Array<BambinoNonPrenotatoPresenze>();
            case 'bambiniNonPrenotatiRitorno': return new Array<BambinoNonPrenotatoPresenze>();

        }
    }

    /**
     * Public instance's method `build` of `CorsaBuilder` class, which allows
     * to retrieve a new instance of class `CorsaPresenze`.
     * The method set to default values if some attributes about `CorsaPresenze` class do not
     * have been set to a specific value different to the default one, in order to let the building to success.
     * This method automatically takes care of resetting the builder in order to
     * let the `singletone instance` of such a class to be ready for building another requested instance.
     * @returns CorsaPresenze
     * @throws dict = {
     *                 code: -1,
     *                 message: 'Error: unable to construct a CorsaPresenze new instance.'
     *                }
     */
    public build(): CorsaPresenze {
        try {
            this.attributeNamesList
                .forEach((attributeName: string) => {
                    if (this.mapValues[attributeName] == null) {
                        this.mapValues[attributeName] = this.getDefaultValue(attributeName);
                    }
                });

            let result = new CorsaPresenze(
                this.mapValues['date'],
                this.mapValues['nomeLinea'],

                this.mapValues['flagCompletataAndata'],
                this.mapValues['flagCompletataRitorno'],
                this.mapValues['flagPartitiRitorno'],

                this.mapValues['fermateAndata'],
                this.mapValues['fermateRitorno'],

                this.mapValues['bambiniNonPrenotatiAndata'],
                this.mapValues['bambiniNonPrenotatiRitorno'],
            );

            this.reset();
            return result;
        } catch (err) {
            throw {
                code: -1,
                message: 'Error: unable to construct a CorsaPresenze new instance.'
            };
        }
    }

    /**
    * Public method `date` allows to set value for date attribute.
    * @param date Date
    * @returns CorsaBuilder
    */
    public date(date: Date): CorsaBuilder {
        this.mapValues['date'] = date;
        return CorsaBuilder.builder;
    }

    /**
     * Public method `nomeLinea` allows to set value for nomeLinea attribute.
     * @param nomeLinea string
     * @returns CorsaBuilder
     */
    public nomeLinea(nomeLinea: string) {
        this.mapValues['nomeLinea'] = nomeLinea;
        return CorsaBuilder.builder;
    }

    /**
     * Public method `flagCompletataAndata` allows to set value for flagCompletataAndata attribute.
     * @param flagCompletataAndata boolean
     * @returns CorsaBuilder
     */
    public flagCompletataAndata(flagCompletataAndata: boolean) {
        this.mapValues['flagCompletataAndata'] = flagCompletataAndata;
        return CorsaBuilder.builder;
    }

    /**
     * Public method `flagCompletataRitorno` allows to set value for flagCompletataAndata attribute.
     * @param flagCompletataRitorno boolean
     * @returns CorsaBuilder
     */
    public flagCompletataRitorno(flagCompletataRitorno: boolean) {
        this.mapValues['flagCompletataRitorno'] = flagCompletataRitorno;
        return CorsaBuilder.builder;
    }

    /**
     * Public method `flagPartitiRitorno` allows to set value for flagPartitiRitorno attribute.
     * @param flagCompletataRitorno boolean
     * @returns CorsaBuilder
     */
    public flagPartitiRitorno(flagPartitiRitorno: boolean) {
        this.mapValues['flagPartitiRitorno'] = flagPartitiRitorno;
        return CorsaBuilder.builder;
    }


    /**
    * Public method `fermateAndata` allows to set value for fermateAndata attribute.
    * @param fermateAndata Array<Fermata>
    * @returns CorsaBuilder
    */
    public fermateAndata(fermateAndata: Array<Fermata>) {
        this.mapValues['fermateAndata'] = fermateAndata;
        return CorsaBuilder.builder;
    }

    /**
    * Public method `fermateRitorno` allows to set value for fermateAndata attribute.
    * @param fermateAndata Array<Fermata>
    * @returns CorsaBuilder
    */
    public fermateRitorno(fermateRitorno: Array<Fermata>) {
        this.mapValues['fermateRitorno'] = fermateRitorno;
        return CorsaBuilder.builder;
    }

    /**
    * Public method `bambiniNonPrenotatiAndata` allows to set value for bambiniNonPrenotatiAndata attribute.
    * @param bambiniNonPrenotatiAndata Array<BambinoNonPrenotatoPresenze>
    * @returns CorsaBuilder
    */
    public bambiniNonPrenotatiAndata(bambiniNonPrenotatiAndata: Array<BambinoNonPrenotatoPresenze>) {
        this.mapValues['bambiniNonPrenotatiAndata'] = bambiniNonPrenotatiAndata;
        return CorsaBuilder.builder;
    }

    /**
    * Public method `bambiniNonPrenotatiRitorno` allows to set value for bambiniNonPrenotatiRitorno attribute.
    * @param bambiniNonPrenotatiAndata Array<BambinoNonPrenotatoPresenze>
    * @returns CorsaBuilder
    */
    public bambiniNonPrenotatiRitorno(bambiniNonPrenotatiRitorno: Array<BambinoNonPrenotatoPresenze>) {
        this.mapValues['bambiniNonPrenotatiRitorno'] = bambiniNonPrenotatiRitorno;
        return CorsaBuilder.builder;
    }


}