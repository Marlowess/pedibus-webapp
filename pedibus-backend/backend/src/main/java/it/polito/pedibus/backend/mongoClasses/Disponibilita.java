package it.polito.pedibus.backend.mongoClasses;

import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Rappresenta le disponibilità concesse dagli accompagnatori
 * **/
@Document(collection = "disponibilita")
@Data
public class Disponibilita {

    @Id
    private ObjectId id;
    private String data;
    private int direzione;
    private User user;

    public Disponibilita(String data, int direzione, User user) {
        this.data = data;
        this.direzione = direzione;
        this.user = user;
    }

    public String getId() {
        return id.toHexString();
    }
}
