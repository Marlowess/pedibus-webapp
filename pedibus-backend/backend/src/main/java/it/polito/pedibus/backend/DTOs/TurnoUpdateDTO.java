package it.polito.pedibus.backend.DTOs;

import lombok.Data;

/**
 * Classe che astrae l'aggiornamento ad un turno da parte di un admin di linea.
 * Contiene ciò che l'admin riceverà lato client per l'aggiornamento della grafica
 * **/
@Data
public class TurnoUpdateDTO {
    private String azione;
    private Boolean confermato;
    private TurnoResponseDTO response;
}
