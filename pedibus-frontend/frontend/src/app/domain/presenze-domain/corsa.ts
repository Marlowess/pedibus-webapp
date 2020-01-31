import {Fermata} from './fermata';
import {BambinoNonPrenotatoPresenze} from './bambino-non-prenotato-presenze';
import {MessageBetweenAccompagnatori} from './message-between-accompagnatori';
import {BambinoPresenze} from './bambino-presenze';
import {PrenotazionePresenze} from './prenotazione-presenze';
import {BambinoPresenzeBuilder} from './builder-bambino-presenze';

// import { WINDOW_CALLBACK_NAME } from 'google-maps';

export class CorsaPresenze {

    public date: Date;
    public nomeLinea: string;
    public fermateAndata: Array<Fermata>;
    public fermateRitorno: Array<Fermata>;

    // null:  corsa
    // true:  corsa completata in quella direzione
    // false: corsa completata in quella direzione.
    public flagCompletataAndata: boolean = null;
    public flagCompletataRitorno: boolean = null;

    public flagPartitiRitorno: boolean = null;

    public bambiniNonPrenotatiAndata: Array<BambinoNonPrenotatoPresenze>;
    public bambiniNonPrenotatiRitorno: Array<BambinoNonPrenotatoPresenze>;

    constructor(date: Date,
                nomeLinea: string,
                flagCompletataAndata: boolean,
                flagCompletataRitorno: boolean,
                flagPartitiRitorno: boolean,
                fermateAndata: Array<Fermata>,
                fermateRitorno: Array<Fermata>,
                bambiniNonPrenotatiAndata: Array<BambinoNonPrenotatoPresenze>,
                bambiniNonPrenotatiRitorno: Array<BambinoNonPrenotatoPresenze>
    ) {
        this.date = date;
        this.nomeLinea = nomeLinea;

        this.flagCompletataAndata = flagCompletataAndata;
        this.flagCompletataRitorno = flagCompletataRitorno;
        this.flagPartitiRitorno = flagPartitiRitorno;

        this.fermateAndata = fermateAndata;   // new Array();
        this.fermateRitorno = fermateRitorno; // new Array();

        this.bambiniNonPrenotatiAndata = bambiniNonPrenotatiAndata;   // new Array();
        this.bambiniNonPrenotatiRitorno = bambiniNonPrenotatiRitorno; // new Array();
    }


    /* ========================================================================================== */
    /*                     Update Corsa Object On the Basis Bambino Salito / Sceso                */
    /* ========================================================================================== */

    private checkSameDateAndSameLine(date: Date, lineName: string): boolean {
        if (lineName !== this.nomeLinea) {
            // window.alert(`Different Lines: received: ${lineName} but current: ${this.nomeLinea}`);
            // throw new CorsaAttendanceError('checkSameDateAndSameLine() failed',
            //     CorsaAttendanceError.CODE_CORSA.NO_MATCH_DATES,
            //     CorsaAttendanceError.ACTION_CORSA.ADD);
            return false;

        }
        // if (this.date.getTime() != date.getTime()) {
        //     // window.alert(`Different Date: received: ${date.toString()} but current: ${this.date.toString()}`);
        //     return false;
        // }
        const corsaDate = `${this.date.getFullYear()}-${this.date.getMonth()}-${this.date.getDay()}`;
        const prenotazioneDate = `${date.getFullYear()}-${date.getMonth()}-${date.getDay()}`;
        if (corsaDate !== prenotazioneDate) {
            // window.alert(`Different Date: received: ${date.toString()} but current: ${this.date.toString()}`);
            return false;
        }
        return true;
    }

    private updateBambinoStatus(message: any, status: boolean) { // status: true means sale, false means scende.
        const direzione = message.direzione;
        const fermata = this.getFermataByIdAndDirection(message.fermataId, direzione);
        if (fermata === null) {
            // window.alert(`Fermata: ${message.fermataId} not found`);
            return;
        }

        const bambino = this.getBaminoByNomeAndSalitoOrSceso(fermata, message.bambino, message.salitoSceso);
        if (bambino === null) {
            // window.alert(`Bambino: ${message.bambino} not found`);
            return;
        }

        bambino.presente = status;
        bambino.prenotatoDaGenitore = message.prenotatoDaGenitore;
    }

    private updateBambinoByMessage(message: any, status: boolean) {
        const res = this.checkSameDateAndSameLine(message.data, message.linea);
        if (res === false) { return; }

        this.updateBambinoStatus(message, status);
    }
    /**
     * Public instance's method `updateBambinoSalito` used to check if provided data
     * can be exploited to update `Corsa object`, and to let the UI updates as well, when a new `Bambino` get in or is
     * taken by an user of type `Accompagnatore` before leaving to reach the final destination, so that all other potential
     * users of type `Accompagnatore` can see the new update so the .
     * @param message: MessageBetweenAccompagnatori
     */
    public updateBambinoSalito(message: MessageBetweenAccompagnatori) {
        const sale = true;
        this.updateBambinoByMessage(message, sale);
    }

    public updateBambinoSceso(message: MessageBetweenAccompagnatori) {
        const sale = false;
        this.updateBambinoByMessage(message, sale);
    }

    /* ========================================================================================== */
    /**
     * Private instance's method `removeFromBambiniNonPrenotatiByDirection` used to try removing
     * a `BambinoNonPrenotatoPresenze` when a user of type `Accompagnatore` get in or accepts
     * a bambino that was not signed by his `Genitore`.
     * This method returns false whether the removing operation was not feasible, otherwise
     * return true if the removing operation goes till the end.
     * @param newBambino BambinoPresenze
     * @param userId string
     * @param direction number
     * @returns boolean
     */
    private removeFromBambiniNonPrenotatiByDirection(
      newBambino: BambinoPresenze, userId: string, direction: number): boolean {
        // Local variables for let private method to work.
        let bambinoNonPrenotato: BambinoNonPrenotatoPresenze = null;
        let index = -1;

        let tmpBambiniNonPrenotati: Array<BambinoNonPrenotatoPresenze> = null;

        if (direction === 0) {
            tmpBambiniNonPrenotati = this.bambiniNonPrenotatiAndata;
        } else {
            tmpBambiniNonPrenotati = this.bambiniNonPrenotatiRitorno;
        }

        // Find bambinoNonPrenotato object.
        bambinoNonPrenotato = tmpBambiniNonPrenotati.find((bNonPrenotato: BambinoNonPrenotatoPresenze) => {
            return (bNonPrenotato.nome === newBambino.nome
                && bNonPrenotato.genitoreId === userId);
        });
        if (bambinoNonPrenotato == null) {
            // window.alert(`Bambino not found: ${JSON.stringify(newBambino)}`);
            return false;
        }

        // Find bambinoNonPrenotato object's index within array.
        index = tmpBambiniNonPrenotati.indexOf(bambinoNonPrenotato);
        if (index === -1) {
            // window.alert(`Index(Bambino) not found: ${JSON.stringify(newBambino)}`);
            return false;
        }

        // Remove bambinoNonPrenotato object using index by means splice technique.
        const n = tmpBambiniNonPrenotati.length;
        tmpBambiniNonPrenotati.splice(index, 1);

        // window.alert(`${n} Before | ${tmpBambiniNonPrenotati.length} After`);
        return true;
    }

    /**
     * Public instance's method `updateBambinoByNuovaPrenotazione` used update the list of either `fermateAndata` or
     * `fermateRitorno` depending on the direction specified as one of the parameters to pass in when calling the method
     * in order to let the UI to be updated showing a new `BambinoPresenze` added which means a user of
     * type `Accompagnatore` accepts and get in a new bambino passeggero.
     * @param prenotatoDaGenitore boolean
     * @param linea string
     * @param messageNuovaPrenotazione PrenotazionePresenze
     */
    public updateBambinoByNuovaPrenotazione(prenotatoDaGenitore: boolean, linea: string, messageNuovaPrenotazione: PrenotazionePresenze) {
        const res = this.checkSameDateAndSameLine(messageNuovaPrenotazione.date, linea);
        if (res === false) { return; }

        const builderBambino = BambinoPresenzeBuilder.getBuilder();
        let fermataId: string = null;
        let presente = false;

        if (messageNuovaPrenotazione.direzione === 0) {
            presente = prenotatoDaGenitore === false ? true : false;
            fermataId = messageNuovaPrenotazione.fermataSalita;
        } else {
            presente = false;
            fermataId = messageNuovaPrenotazione.fermataDiscesa;
        }

        const newBambino: BambinoPresenze =
            builderBambino
                .nome(messageNuovaPrenotazione.bambino)
                .prenotatoDaGenitore(prenotatoDaGenitore)
                .prenotazioneID(messageNuovaPrenotazione.reservationId)
                .presente(presente) // prenotatoDaGenitore == false means bambino Prenotato by accompagnatore.
                .build();

        const direction: number = messageNuovaPrenotazione.direzione;
        const userId: string = messageNuovaPrenotazione.userId;

        const fermata: Fermata = this.getFermataByIdAndDirection(fermataId, direction);
        if (fermata == null) {
            // window.alert(`getFermataByIdAndDirection() -> FAILED: fermata = null`);
            return;
        }

        const resRemotion: boolean = this.removeFromBambiniNonPrenotatiByDirection(newBambino, userId, direction);
        if (resRemotion === false) {
            // window.alert(`removeFromBambiniNonPrenotatiByDirection() -> FAILED: resRemotion = ${resRemotion}`);
            return;
        }

        let tmpFermata: Array<BambinoPresenze> = null;
        if (direction === 0) {
            tmpFermata = fermata.salita;
        } else {
            tmpFermata = fermata.discesa;
        } // .push(newBambino);

        const someBambinoRes: boolean = tmpFermata.some((bambinoPresenze: BambinoPresenze) => {
            return (bambinoPresenze.prenotazioneID === newBambino.prenotazioneID
                && bambinoPresenze.nome === newBambino.nome);
        });
        if (someBambinoRes === true) { return; }

        tmpFermata.push(newBambino);

    }

    /* ========================================================================================== */
    /*                     Update Corsa Object On the Basis Bambino Salito / Sceso                */
    /* ========================================================================================== */

    private addBambinoNonPrenotato(fermata: Fermata, bambino: BambinoPresenze, direction: number, genitoreId: string) {
        try {
            let tmpBambiniNonPrenotati: Array<BambinoNonPrenotatoPresenze> = null;
            // Depending on direction value update Andata or Ritorno list of BaminiPresenze,
            // which are Bambini with a prenotazione.

            // 0: Andata, 1: Ritorno.
            if (direction === 0) {
                tmpBambiniNonPrenotati = this.bambiniNonPrenotatiAndata;
            } else {
                tmpBambiniNonPrenotati = this.bambiniNonPrenotatiRitorno;
            }

            if (tmpBambiniNonPrenotati == null) {
                const directioList = direction === 0 ? 'bambiniNonPrenotatiAndata' : 'bambiniNonPrenotatiRitorno';
                throw new Error(`Error something went wront when dealing with ${directioList} list`);
            }

            const newBambinoNonPrenotato = new BambinoNonPrenotatoPresenze(
                bambino.nome,
                genitoreId
            );
            tmpBambiniNonPrenotati.push(newBambinoNonPrenotato);
        } catch (err) {
            // window.alert(`Error: ${JSON.stringify(err)}`);
            // console.error(`Error: ${JSON.stringify(err)}`);
        }

    }
    /**
     *
     * @param fermata Fermata
     * @param bambino BambinoPresenze
     * @param direction number
     */
    private deleteBambinoFromFermataByDirectionAndBambinoPresenze(fermata: Fermata, bambino: BambinoPresenze, direction: number): boolean {
        try {
            // Local variables, used for let the method to function.
            let tmpBamniniPrenotati: Array<BambinoPresenze> = null;

            // Depending on direction value update Andata or Ritorno list of BaminiPresenze,
            // which are Bambini with a prenotazione.

            // 0: Andata, 1: Ritorno.
            if (direction === 0) {
                tmpBamniniPrenotati = fermata.salita;
            } else {
                tmpBamniniPrenotati = fermata.discesa;
            }

            tmpBamniniPrenotati.forEach(
                (bambinoPrenotato: BambinoPresenze) => {
                    // window.alert(JSON.stringify(bambinoPrenotato));
                }
            );

            const bambinoResult: BambinoPresenze = tmpBamniniPrenotati.find((bambinoPrenotato: BambinoPresenze) => {
                // window.alert(`${bambinoPrenotato.nome} | to find: ${bambino.nome}
                // and ${bambinoPrenotato.prenotazioneID} | to find: ${bambino.prenotazioneID}`);
                return (bambinoPrenotato.nome === bambino.nome
                    && bambinoPrenotato.prenotazioneID === bambino.prenotazioneID);
            });

            // If BambinoPrenotato not present return immediately and do not update UI.
            if (bambinoResult == null) {
                // window.alert(`deleteBambinoFromFermataByDirectionAndBambinoPresenze() ->
                // FAILED: bambinoResult = null | direction = ${direction}`);
                return;
            }
            const index: number = tmpBamniniPrenotati.findIndex((bambinoPrenotato: BambinoPresenze) => {
                return (bambinoPrenotato.nome === bambinoResult.nome
                    && bambinoPrenotato.prenotazioneID === bambinoResult.prenotazioneID);
            });

            // If BambinoPrenotato not present return immediately and do not update UI.
            if (index === -1) { return; }
            tmpBamniniPrenotati.splice(index, 1);

            return true;
        } catch (err) {
            // window.alert(`Error: ${JSON.stringify(err)}`);
            // console.error(`Error: ${JSON.stringify(err)}`);
            return false;
        }
    }

    /**
     *
     * @param prenotatoDaGenitore boolean
     * @param linea string
     * @param messageDeletePrenotazione PrenotazionePresenze
     */
    public deleteBambinoByExistingPrenotazione(prenotatoDaGenitore: boolean, linea: string,
                                               messageDeletePrenotazione: PrenotazionePresenze) {

        // Local variables, used for let the method to function.
        const direction: number = messageDeletePrenotazione.direzione;
        let fermataId: string = null;
        const userId: string = messageDeletePrenotazione.userId; // Wait, why here is present but never used ?

        // Check Date and Linea Informations, if them own the same value of current displayed Turno
        // then go ahead, trying update model for let UI to update as weel.

        // Otherwise return immediately, and do not update UI.
        const res = this.checkSameDateAndSameLine(messageDeletePrenotazione.date, linea);
        if (res === false) { return; }

        if (direction === 0) {
            fermataId = messageDeletePrenotazione.fermataSalita;
        } else {
            fermataId = messageDeletePrenotazione.fermataDiscesa;
        }
        // Try grab Fermata instance that should be update.
        // If not available, return immediately, and do not update UI.
        const fermata: Fermata = this.getFermataByIdAndDirection(fermataId, direction);
        if (fermata == null) {
            // window.alert(`getFermataByIdAndDirection() -> FAILED: fermata = null | direction = ${direction}`);
            return;
        } else {
            // window.alert(JSON.stringify(fermata.indirizzo + ' ' + fermata.descrizione));
        }

        const builderBambino = BambinoPresenzeBuilder.getBuilder();

        const oldBambino: BambinoPresenze =
            builderBambino
                .nome(messageDeletePrenotazione.bambino)
                .prenotatoDaGenitore(prenotatoDaGenitore)
                .prenotazioneID(messageDeletePrenotazione.reservationId)
                .presente(false)
                .build();

        // window.alert(JSON.stringify(oldBambino));

        // Try update model related to Fermata that should be modified.
        // If not feasible, return immediately, and do not update UI.
        const bambinoPrenotatoRemoved: boolean = this.deleteBambinoFromFermataByDirectionAndBambinoPresenze(fermata, oldBambino, direction);

        if (bambinoPrenotatoRemoved === false) { return; }

        this.addBambinoNonPrenotato(fermata, oldBambino, direction, userId);
    }

    public atLeastOneBambinoSalito(): boolean {
        if (this.fermateAndata == null) { return false; }

        return this.fermateAndata.some((fermata: Fermata) => {
            if (fermata.salita == null) { return false; }

            return fermata.salita.some((bambino: BambinoPresenze) => {
                return bambino.presente === true;
            });
        });
    }
    /* ========================================================================================== */
    /*                                  GETTERS                                                   */
    /* ========================================================================================== */

    /* ========================================================================================== */

    private getBaminoByNomeAndSalitoOrSceso(fermata: Fermata, baminoNome: string, salitoSceso: number): BambinoPresenze {
        // const startIndex = 0;
        if (salitoSceso === 0) {
            return fermata.salita.find((bambino: BambinoPresenze, startIndex: number) => {
                return bambino.nome === baminoNome;
            });
        } else {
            return fermata.discesa.find((bambino: BambinoPresenze, startIndex: number) => {
                return bambino.nome === baminoNome;
            });
        }
    }

    private getFermataByIdAndDirection(fermataId: string, direction: number): Fermata {
        // const startIndex = 0;
        if (direction === 0) {
            // if (!this.getExistsAndata()) return null;
            if (this.fermateAndata === null) { return null; }
            const fermata = this.fermateAndata.find((f: Fermata, startIndex: number) => {
                return f.fermataID === fermataId;
            });
            return fermata;
        } else {
            // if (!this.getExistsRitorno()) return null;
            if (this.fermateRitorno === null) { return null; }
            const fermata = this.fermateRitorno.find((f: Fermata, startIndex: number) => {
                return f.fermataID === fermataId;
            });
            return fermata;
        }
    }

    /* ========================================================================================== */

    public getExistsAndata(): boolean {
      if (this.fermateAndata === undefined) { return false; }
      if (this.fermateAndata == null) { return false; }
      // return this.fermateAndata != null; // && this.fermateAndata.length != 0;
      return this.fermateAndata.length !== 0;
    }
    public getExistsRitorno(): boolean {
      if (this.fermateRitorno === undefined) { return false; }
      if (this.fermateRitorno == null) { return false; }
      // return this.fermateRitorno != null; // && this.fermateRitorno.length != 0;
      return this.fermateRitorno.length !== 0;
    }

    /* ========================================================================================== */

    getCompletataAndata(): boolean {
        return this.flagCompletataAndata;
    }

    getCompletataRitorno(): boolean {
        return this.flagCompletataRitorno;
    }

    getPartitiRitorno(): boolean {
        return this.flagPartitiRitorno;
    }

    /* ========================================================================================== */
    /*                                  SETTERS                                                   */
    /* ========================================================================================== */


    /* ========================================================================================= */

    private newDateFromString(dateString: string) {
        const fields = dateString.toString().split('-');
        const day = fields[0]; const month = fields[1]; const year = fields[2];

        const date = new Date(Number(year), Number(month) - 1, Number(day));
        return date;
    }

    public setAvailableBambino(message: any) {
        const dateStr: string = message.date;
        const date: Date = this.newDateFromString(dateStr);

        if (this.date.getTime() !== date.getTime()) {
            // window.alert(`different dates: ${this.date.getTime()} vs ${date.getTime()}`);
            return;
        }
        if (this.nomeLinea === message.linea) {
            // window.alert(`different lines: ${this.nomeLinea} vs ${message.linea}`);
            return;
        }

        const prenotazione: any = message.prenotazione;
        const bambino: BambinoNonPrenotatoPresenze =
            new BambinoNonPrenotatoPresenze(
                prenotazione.bambino,
                prenotazione.userId
            );

        if (prenotazione.direzione === 0) {
            this.bambiniNonPrenotatiAndata.push(bambino);
        } else if (prenotazione.direzione === 1) {
            this.bambiniNonPrenotatiRitorno.push(bambino);
             } else {
            // window.alert(`Nothing updated!`);
             }
    }

    public setNotAvailableBambino(message: any) {
        const dateStr: string = message.date;
        const date = this.newDateFromString(dateStr);

        if (this.date.getTime() !== date.getTime()) {
            // window.alert(`different dates: ${this.date.getTime()} vs ${date.getTime()}`);
            return;
        }
        if (this.nomeLinea === message.linea) {
            // window.alert(`different lines: ${this.nomeLinea} vs ${message.linea}`);
            return;
        }

        const prenotazione: any = message.prenotazione;
        const bambino: BambinoNonPrenotatoPresenze =
            new BambinoNonPrenotatoPresenze(
                prenotazione.bambino,
                prenotazione.userId
            );
        if (prenotazione.direzione === 0) {
            this.bambiniNonPrenotatiAndata =
                this.bambiniNonPrenotatiAndata
                    .filter((bambinoInList: BambinoNonPrenotatoPresenze) => {
                        return bambinoInList.genitoreId !== bambino.genitoreId;
                    });
        } else {
            this.bambiniNonPrenotatiRitorno =
                this.bambiniNonPrenotatiRitorno
                    .filter((bambinoInList: BambinoNonPrenotatoPresenze) => {
                        return bambinoInList.genitoreId !== bambino.genitoreId;
                    });
        }

    }

    setCompletataAndata(flag: boolean) {
        this.flagCompletataAndata = flag;
    }

    setCompletataRitorno(flag: boolean) {
        this.flagCompletataRitorno = flag;
    }

    setPartitiRitorno(flag: boolean) {
        this.flagPartitiRitorno = flag;
    }

    /* ========================================================================================== */
    /*                                   Handling Csv Dump                                        */
    /* ========================================================================================== */
    public getHeadersCorsa(): Array<string> {
        return ['nomeLinea', 'data'];
    }
    public getHeadersFermata(): Array<string> {
        return Fermata.getHeadersForCsvExport();
    }

    public getHeadersBambinoPasseggero(): Array<string> {
        return BambinoPresenze.getHeadersForCsvExport();
    }

    public dumpFermateCsvByDirection(fermate: Array<Fermata>, direction: string): Array<any> {

        const corsaCsv = `${this.nomeLinea},${this.date.toDateString()}`;
        // window.alert('Corsa piece info: ' + corsaCsv);
        const dumpCsv: Array<any> = Array<any>();

        const headersFermata = this.getHeadersFermata().concat(['direzione']);
        const headersBambinoPasseggero = this.getHeadersBambinoPasseggero().concat(['sale', 'scende']);

        fermate.forEach((fermata: Fermata) => {
            const fermataCsv = fermata.serializeByProperties(headersFermata, direction);
            // window.alert('Fermata piece info: ' + fermataCsv);
            const dumpBambini: Array<string> = Array<string>();

            fermata.salita.forEach((bambinoPresenze: BambinoPresenze) => {
                const bambinoCsv =
                  bambinoPresenze.serializeByProperties(headersBambinoPasseggero, true, false);
                // properties list, sale, scende
                dumpBambini.push(bambinoCsv);
            });

            fermata.discesa.forEach((bambinoPresenze: BambinoPresenze) => {
                const bambinoCsv =
                  bambinoPresenze.serializeByProperties(headersBambinoPasseggero, false, true);
                // properties list, sale, scende
                dumpBambini.push(bambinoCsv);
            });
            dumpCsv.push({ corsaCsv, fermataCsv, dumpBambini });
        });

        return dumpCsv;
    }
    private dumpFermateByDirectionJSON(listFermate: Array<Fermata>, direction: string): any {
        const listDumpFermate: Array<any> = Array<any>();
        listFermate.forEach((fermata: Fermata) => {
            const dictFermata = fermata.getDictFermata(direction);

            // dictFermata.set('salita', new Array<any>());
            // dictFermata.set('discesa', new Array<any>());

            const salita = new Array<any>(); const discesa = new Array<any>();

            fermata.salita.forEach((bambino: BambinoPresenze) => {
                const dictBambino = bambino.getDictBambinoPresenze(true, false);
                // window.alert(JSON.stringify(this.strMapToObj(dictBambino)));
                salita.push(dictBambino);
                // window.alert(dictFermata.get('salita').length);

            });

            fermata.discesa.forEach((bambino: BambinoPresenze) => {
                const dictBambino = bambino.getDictBambinoPresenze(false, true);
                // dictFermata.get('discesa').push(dictBambino);
                discesa.push(dictBambino);
            });

            dictFermata.salita = salita;
            dictFermata.discesa = discesa;

            listDumpFermate.push(dictFermata);
            // window.alert(JSON.stringify(this.strMapToObj(dictFermata)));
        });
        // return JSON.stringify(listDumpFermate);
        return listDumpFermate;
    }
    private preparareJSON() {
        // window.alert('preparareJSON()');
        // let dumpJSON = new Map();
        const dumpJSON = Object.create(null);

        if (this.getExistsAndata() && this.fermateAndata.length !== 0) {
            const resA = this.dumpFermateByDirectionJSON(this.fermateAndata, 'Andata');
            if (resA != null) {
                // dumpJSON.set('andata', resA);
                dumpJSON.andata = resA;
            } else {
                // dumpJSON.set('andata', null);
                dumpJSON.andata = null;
            }
        }

        if (this.getExistsRitorno() && this.fermateRitorno.length !== 0) {
            const resR = this.dumpFermateByDirectionJSON(this.fermateRitorno, 'Ritorno');
            if (resR != null) {
                // dumpJSON.set('ritorno', resR);
                dumpJSON.ritorno = resR;
            } else {
                // dumpJSON.set('ritorno', null);
                dumpJSON.ritorno = null;
            }
        }

        // if (dumpJSON.get('andata') == null && dumpJSON.get('ritorno') == null) {
        if (dumpJSON.andata == null && dumpJSON.ritorno == null) {
            // window.alert('Empty Dump since length is zero');
            return null;
        }

        // const headersCorsa: string[] = this.getHeadersCorsa();
        // const headersFermata: string[] = this.getHeadersFermata().concat(['direzione']);
        // const headersBambino: string[] = this.getHeadersBambinoPasseggero().concat(['sale', 'scende']);

        // let result: Array<any> = dumpJSON.reduce(function (prev: Array<Map<string, string>>, curr: any, pos: number) {
        //     try {
        //         // window.alert('reduce()');
        //         let res: Array<any> = new Array<any>();
        //         let corsaFermataDict = new Map();

        //         let corsaPieces: string[] = curr.corsaCsv.split(',');
        //         // window.alert(JSON.stringify(corsaPieces));
        //         for (let i = 0; i < corsaPieces.length; i++) {
        //             // window.alert(`${headersCorsa[i]} | ${corsaPieces[i]}`);
        //             corsaFermataDict.set(headersCorsa[i], corsaPieces[i]);
        //             // window.alert(corsaFermataDict.get(headersCorsa[i]));
        //         }
        //         // window.alert(JSON.stringify(corsaFermataDict.keys()));
        //         // corsaFermataDict.forEach(function (v, k, m) {
        //         //     // window.alert(`k = ${k} / v = ${v}`);
        //         // })

        //         let fermataPieces: string[] = curr.fermataCsv.split(',')
        //         // window.alert(JSON.stringify(fermataPieces));
        //         for (let i = 0; i < fermataPieces.length; i++) {
        //             // window.alert(`${headersFermata[i]} | ${fermataPieces[i]}`);
        //             corsaFermataDict.set(headersFermata[i], fermataPieces[i]);
        //         }
        //         // corsaFermataDict.forEach(function (v, k, m) {
        //         //     // window.alert(`k = ${k} / v = ${v}`);
        //         // })

        //         if (curr.dumpBambini == null) return prev;
        //         curr.dumpBambini.forEach((bambino: string) => {

        //             let bambinoDict = new Map();
        //             let bambinoPieces = bambino.split(',');

        //             for (let key in corsaFermataDict.keys()) {
        //                 bambinoDict.set(key, corsaFermataDict.get(key));
        //             }
        //             for (let i = 0; i < bambinoPieces.length; i++) {
        //                 bambinoDict.set(headersBambino[i], bambinoPieces[i]);
        //             }
        //             res.push(bambinoDict);
        //         });
        //         return prev.concat(res);
        //     } catch (err) {
        //         // window.alert(`corsaFermata: Error Occur`);
        //         return prev;
        //     }
        // },
        //     new Array<any>() /* Initial value for REDUCE technique */);

        // return result;
        return dumpJSON;
    }
    public getDataExportedXML(): any {
        return this.preparareJSON();
    }

    public getDataExportedJSON(): any {
        // window.alert('getDataExportedJSON()');
      return this.preparareJSON();
    }

    public getDataExportedCsv(): string {
        let dumpCsv: Array<any> = Array<any>();

        if (this.getExistsAndata() && this.fermateAndata.length !== 0) {
            const resA = this.dumpFermateCsvByDirection(this.fermateAndata, 'Andata');
            if (resA != null) {
                dumpCsv = dumpCsv.concat(resA);
            }
        }

        if (this.getExistsRitorno() && this.fermateRitorno.length !== 0) {
            const resR = this.dumpFermateCsvByDirection(this.fermateRitorno, 'Ritorno');
            if (resR != null) {
                dumpCsv = dumpCsv.concat(resR);
            }
        }

        if (dumpCsv.length === 0) {
            // window.alert('Empty Dump since length is zero');
            return null;
        }

      // tslint:disable-next-line:only-arrow-functions
        const result = dumpCsv.reduce(function(prev: string, curr: any, pos: number) {
            try {
                let res: string = null;
                // window.alert(`corsaFermata: ${JSON.stringify(curr)}`);
                const corsaFermata: string = curr.corsaCsv + ',' + curr.fermataCsv;
                // window.alert(`corsaFermata: ${corsaFermata}`);
                if (curr.dumpBambini == null) { return prev; }
                curr.dumpBambini.forEach((bambino: string) => {
                    if (res == null) {
                        res = corsaFermata + ',' + bambino;
                    } else {
                        res += '\n' + corsaFermata + ',' + bambino;
                    }
                });
                if (prev == null) {
                    return res;
                } else {
                    return prev + '\n' + res;
                }
            } catch (err) {
                // window.alert(`corsaFermata: Error Occur`);
                return prev;
            }
        },
            null /* Initial value for REDUCE technique */);

        return result;
    }

    private strMapToObj(strMap: any) {
        const obj = Object.create(null);
        strMap.forEach(function(v, k, map) {
            // We don’t escape the key '__proto__'
            // which can cause problems on older engines
            if (v instanceof Map) {
                obj[k] = this.strMapToObj(v);
            } else if (v instanceof Array) {
                obj[k] = new Array();
                for (const i in v) {
                    if (v[i] instanceof Map) {
                        obj[k].push(this.strMapToObj(v[i]));
                    } else {
                        obj[k].push(v[i]);
                    }
                }
            } else {
                obj[k] = v;
                   }
        });
        return obj;
    }

    /* ========================================================================================== */
    /* ========================================================================================== */
}
