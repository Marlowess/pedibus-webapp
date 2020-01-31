package it.polito.pedibus.backend.DTOs;

import lombok.Data;

/**
 * Classe che rappresenta l'aggiornamento in tempo reale di una prenotazione.
 * Un'istanza di questa classe viene inviata al client nei seguenti due casi:
 *      - un genitore prenota un bambino e gli accompagnatori in turno vedono la prenotazione comparire in tempo reale
 *      - un accompagnatore prenota al volo un bambino dalla lista dei bambini non prenotati e tutti gli altri
 *          accompagnatori in turno vedono l'aggiornamento
 * **/
@Data
public class PrenotazioneUpdateDTO {

    // NUOVA_PRENOTAZIONE
    private String azione;
    private Boolean prenotatoDaGenitore;
    private String linea;
    private String lineaOld;
    private String date;
    private PrenotazioneDTO prenotazione;
    private PrenotazioneDTO prenotazioneOld;
}
