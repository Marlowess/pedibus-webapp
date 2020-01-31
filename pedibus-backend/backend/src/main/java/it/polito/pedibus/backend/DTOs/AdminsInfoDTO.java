package it.polito.pedibus.backend.DTOs;

import lombok.Data;

/**
 * Questa classe astrae le informazioni di accompagnatori ed admin con riferimento alla linea che amministrano
 * **/
@Data
public class AdminsInfoDTO {
    private String nome;
    private String cognome;
    private String id;
    private String linea;
}
