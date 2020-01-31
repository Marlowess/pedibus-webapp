package it.polito.pedibus.backend.DTOs;

import lombok.Data;

/** Classe DTO utilizzata per il binding delle richieste fatte dagli accompagnatori
 *  quando devono segnare un bambino come presente ad una fermata
 * **/
@Data
public class PresenzaDTO {
    private String bambino;
    private String prenotazioneId;
    private int salitaDiscesa;
    private boolean azione;
}
