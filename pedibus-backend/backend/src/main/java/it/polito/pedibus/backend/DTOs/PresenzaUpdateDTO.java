package it.polito.pedibus.backend.DTOs;

import lombok.Data;

/**
 * Classe DTO che rappresenta l'aggiornamento di una presenza in tempo reale.
 * Un'istanza di tale classe sarà inviata al client, il quale vedrà aggiornarsi la grafica relativa
 * ad una certa corsa.
 * **/
@Data
public class PresenzaUpdateDTO {

//    String data
//    String linea
//    Integer direzione
//    String bambino
//    boolean prenotatoDaGenitore
//    Integer salitoSceso
//    String azione: BAMBINO_SALITO / BAMBINO_SCESO

    // Data della corsa a cui questa segnalazione si riferisce
    private String data;

    // Linea associata alla corsa
    private String linea;

    // Direzione della corsa
    private Integer direzione;

    // Indica il tipo di segnalazione: 0=salito, 1=sceso
    private Integer salitoSceso;

    // Segnalato oppure de-segnalato dall'accompagnatore
    private String azione;

    // Nome del bambino oggetto della modifica della presenza
    private String bambino;

    // Indica se il bambino è stato prenotato in anticipo da un genitore oppure al volo da un accompagnatore
    private Boolean prenotatoDaGenitore;

    // Indica l'identificativo della fermata su cui è stata fatta la modifica
    private String fermataId;
}
