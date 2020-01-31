package it.polito.pedibus.backend.domain;

import lombok.Data;

/**
 * Rappresenta l'insieme di informazioni di una fermata da inoltrare al client
 * **/
@Data
public class IndirizzoOrario {
    private String fermataID;
    private String indirizzo;
    private String descrizione;
    private String orario;
}
