package it.polito.pedibus.backend.domain;

import it.polito.pedibus.backend.mongoClasses.Fermata;
import it.polito.pedibus.backend.mongoClasses.Turno;
import lombok.Data;

/**
 * Classe che rappresenta una coppia di fermate partenza/arrivo
 * **/
@Data
public class FermataPartenzaArrivo {
    private Fermata partenza;
    private Fermata arrivo;

    /**
     * Verifica se una data fermata è tra quelle coperte dal turno indicato
     * **/
    public boolean verificaFermataIntervallo(Fermata fermata){
        return fermata.getId().compareTo(this.partenza.getId()) >= 0
                && fermata.getId().compareTo(this.arrivo.getId()) <= 0;
    }
}
