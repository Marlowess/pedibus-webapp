package it.polito.pedibus.backend.DTOs;

import it.polito.pedibus.backend.mongoClasses.Comunicazione;
import lombok.Data;

@Data
public class ComunicazioneDTO {
    private String id; // identificativo della comunicazione
    private long timestamp; // timestamp del verificarsi dell'evento associato alla notifica
    private String topic; // argomento della notifica
    private String testo; // messaggio che l'utente visualizza
    private boolean letta; // indica se la comunicazione è stata segnata come letta dall'utente (diversa grafica)

    public ComunicazioneDTO(Comunicazione comunicazione){
        this.id = comunicazione.getId();
        this.timestamp = comunicazione.getTimestamp();
        this.testo = comunicazione.getTesto();
        this.letta = comunicazione.isLetta();
        this.topic = comunicazione.getTopic();
    }
}
