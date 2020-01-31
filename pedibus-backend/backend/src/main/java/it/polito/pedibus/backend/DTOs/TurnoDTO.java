package it.polito.pedibus.backend.DTOs;

import lombok.Data;

import javax.validation.constraints.NotNull;

/**
 * Classe DTO utilizzata per gestire i dati entranti riguardanti i turni delle corse del pedibus
 * **/
@Data
public class TurnoDTO {

    // Nome della linea del turno
    @NotNull
    private String nome_linea;

    // Data della corsa
    private String data;

    // Direzione della corsa
    @NotNull
    private Integer direzione;

    // ID dell'utente accompagnatore a cui si assegna il turno
    @NotNull
    private String userId;

    // ID della fermata di partenza dell'accompagnatore
    @NotNull
    private String fermataPartenzaId;

    // ID della fermata di arrivo dell'accompagnatore
    @NotNull
    private String fermataArrivoId;

    // Questo attributo viene valorizzato solo in quei casi in cui si voglia effettuare una modifica al turno.
    // In tale caso il service dovrà verificare che il campo non sia nullo. Nei casi di creazione di un turno
    // questo campo viene semplicemente ignorato
    private String turnoId;
}
