package it.polito.pedibus.backend.mongoClasses;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Rappresenta una prenotazione di un genitore per il proprio figlio
 * **/
@Document(collection = "prenotazioni")
@Data
public class Prenotazione {

    @Id private ObjectId id;

    @JsonIgnore
    private ObjectId corsaId;

    private Fermata fermataSalita;
    private Fermata fermataDiscesa;

    @JsonIgnore
    private ObjectId userId;

    private String bambino;
    private boolean salito;
    private boolean sceso;
    private boolean prenotatoDaGenitore;

    public String getId() {
        return id.toHexString();
    }

    @JsonIgnore
    public ObjectId getId_obj() {
        return id;
    }

}
