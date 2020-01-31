package it.polito.pedibus.backend.mongoClasses;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Rappresenta una comunicazione nel DB
 * **/
@Document(collection = "comunicazioni")
@Data
public class Comunicazione {
    @Id private ObjectId id;

    @JsonIgnore
    private ObjectId userId;

    private long timestamp;
    private String topic;
    private String testo;
    private boolean letta;

    @JsonIgnore
    private boolean visualizza;

    @Override
    public String toString() {
        return "Comunicazione{" +
                "id=" + id.toHexString() +
                ", userId=" + userId.toHexString() +
                ", timestamp=" + timestamp +
                ", topic='" + topic + '\'' +
                ", testo='" + testo + '\'' +
                ", letta=" + letta +
                ", visualizza=" + visualizza +
                '}';
    }

    public String getId() {
        return id.toHexString();
    }

    @JsonIgnore
    public ObjectId getId_obj() {
        return id;
    }
}
