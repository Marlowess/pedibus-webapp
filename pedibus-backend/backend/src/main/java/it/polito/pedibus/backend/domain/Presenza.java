package it.polito.pedibus.backend.domain;

import lombok.Data;

/** Questa classe rappresenta l'infomazione che viene inviata al client e che
 *  l'accompagnatore leggerà.
 *
 *  PARAMETRI
 *  bambino è il nome del bambino
 *  presente indica se il bambino è stato segnato perchè già salito/sceso
 *  prenotazioneID è il riferimento alla prenotazione che il client manderà al server per notificare il genitore
 *      quando il bambino sarà stato preso in gestione oppure lasciato alla sua destinazione
 * **/

@Data
public class Presenza {
    private String prenotazioneID;
    private String bambino;
    private boolean presente;
    private boolean prenotatoDaGenitore;

    public Presenza(String bambino, boolean presente, String prenotazioneID, boolean prenotatoDaGenitore){
        this.bambino = bambino;
        this.presente = presente;
        this.prenotazioneID = prenotazioneID;
        this.prenotatoDaGenitore = prenotatoDaGenitore;
    }
}
