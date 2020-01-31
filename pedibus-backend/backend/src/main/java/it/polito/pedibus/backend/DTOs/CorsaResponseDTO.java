package it.polito.pedibus.backend.DTOs;

import it.polito.pedibus.backend.mongoClasses.Corsa;
import lombok.Data;

/**
 * Classe DTO per inoltrare al client la giusta struttura di una corsa
 * **/
@Data
class CorsaResponseDTO {
    private String data;
    private int direzione;
    private String lineaId;

    CorsaResponseDTO(Corsa corsa){
        this.data = corsa.getData();
        this.direzione = corsa.getDirezione();
        this.lineaId = corsa.getLineaId();
    }
}
