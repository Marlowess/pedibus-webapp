package it.polito.pedibus.backend.domain;

import lombok.Data;

/**
 * Classe che associa un bambino allo userID del genitore
 * **/
@Data
public class UserIdBambino {
    private String userID;
    private String bambino;

    public UserIdBambino(String userID, String bambino){
        this.userID = userID;
        this.bambino = bambino;
    }
}
