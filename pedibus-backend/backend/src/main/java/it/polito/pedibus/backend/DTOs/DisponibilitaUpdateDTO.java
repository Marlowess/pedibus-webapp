package it.polito.pedibus.backend.DTOs;

import it.polito.pedibus.backend.mongoClasses.User;
import lombok.Data;

@Data
public class DisponibilitaUpdateDTO {
    private String azione;
    private String data;
    private int direzione;
    private User user;
}
