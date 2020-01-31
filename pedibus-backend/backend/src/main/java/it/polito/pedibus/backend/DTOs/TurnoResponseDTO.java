package it.polito.pedibus.backend.DTOs;

import it.polito.pedibus.backend.mongoClasses.Corsa;
import it.polito.pedibus.backend.mongoClasses.Turno;
import it.polito.pedibus.backend.mongoClasses.User;
import lombok.Data;

/**
 * Questa classe DTO permette al service di comunicare al controller la struttura
 * del turno così come deve essere inoltrato al client
 * **/
@Data
public class TurnoResponseDTO {
    private String id;
    private CorsaResponseDTO corsa;
    private String nomeLinea;
    private User user;
    private FermataDTO fermataPartenza;
    private FermataDTO fermataArrivo;


    public TurnoResponseDTO(Turno turno, String nomeLinea){
        this.id = turno.getId();
        this.corsa = new CorsaResponseDTO(turno.getCorsa());
        this.user = turno.getUser();
        this.fermataPartenza = new FermataDTO(turno.getPartenza());
        this.fermataArrivo = new FermataDTO(turno.getArrivo());
        this.nomeLinea = nomeLinea;
    }

    public TurnoResponseDTO(){}

    public void setCorsa(Corsa corsa){
        this.corsa = new CorsaResponseDTO(corsa);
    }
}
