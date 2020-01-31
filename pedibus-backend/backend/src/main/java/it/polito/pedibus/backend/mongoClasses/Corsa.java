package it.polito.pedibus.backend.mongoClasses;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Rappresenta una corsa del pedibus
 * **/
@Document(collection = "corse")
@Data
public class Corsa {

    @Id private ObjectId id;
    private String data;
    private int direzione;
    private ObjectId lineaId;
    private boolean statoCorsa;

    public Corsa(ObjectId lineaId, String data, int direzione, boolean statoCorsa){
        this.lineaId = lineaId;
        this.data = data;
        this.direzione = direzione;
        this.statoCorsa = statoCorsa;
    }

    public Corsa(){}

    public String getLineaId() {
        return lineaId.toHexString();
    }

    public String getId() {
        return id.toHexString();
    }

    @JsonIgnore
    public ObjectId getId_obj() {
        return id;
    }

    @Override
    public String toString() {
        return "Corsa{" +
                "id=" + id.toHexString() +
                ", data='" + data + '\'' +
                ", direzione=" + direzione +
                ", lineaId=" + lineaId.toHexString() +
                ", statoCorsa=" + statoCorsa +
                '}';
    }
}
