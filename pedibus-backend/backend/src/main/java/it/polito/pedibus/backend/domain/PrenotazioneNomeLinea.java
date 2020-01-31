package it.polito.pedibus.backend.domain;

import it.polito.pedibus.backend.mongoClasses.Prenotazione;
import lombok.Data;

/**
 * Classe che incapsula le informazioni di una prenotazione e del nome della linea associata ad essa
 * **/
@Data
public class PrenotazioneNomeLinea {
    private Prenotazione prenotazione_dettaglio;
    private String nome_linea;
}
