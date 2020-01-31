package it.polito.pedibus.backend.DTOs;

import lombok.Data;

/**
 * Classe utilizzata per comunicare in tempo reale al client che un accompagnatore
 * ha segnato una corsa di andata come terminata o una di arrivo come partita
 * **/
@Data
public class PresenzaUpdateStatoCorsaDTO {
    // La data della corsa
    private String data;

    // La linea a cui la corsa si riferisce
    private String linea;

    // La direzione della corsa
    private Integer direzione;

    // L'azione svolta dall'accompagnatore (partita o terminata)
    private String azione;
}
