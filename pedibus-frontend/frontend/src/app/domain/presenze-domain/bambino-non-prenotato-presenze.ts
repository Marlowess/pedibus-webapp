/** Classe che rappresenta un bambino non prenotato dal genitore ma prenotabile dall'utente accompagnatore
 * nel component 'Presenze' */

export class BambinoNonPrenotatoPresenze {
    public nome: string;
    public genitoreId: string;

    constructor(nome: string, genitoreId: string) {
        this.nome = nome;
        this.genitoreId = genitoreId;
    }
}
