package it.polito.pedibus.backend.mongoClasses;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import it.polito.pedibus.backend.utilities.GeoJsonDeserializer;
import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.annotation.Generated;
import java.io.Serializable;

/**
 * Rappresenta una fermata di una certa linea del pedibus
 * **/
@Document(collection = "fermate")
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Generated("org.jsonschema2pojo")
public class Fermata implements Serializable {
    @Id
    private ObjectId id;

    @JsonProperty("direzione")
    private String direzione;

    @JsonProperty("indirizzo")
    private String indirizzo;

    @JsonProperty("descrizione")
    private String descrizione;

    @JsonProperty("orario")
    private String orario;

    @JsonProperty("gps")
    @JsonDeserialize(using = GeoJsonDeserializer.class)
    private GeoJsonPoint geoJsonPoint;

    @JsonIgnore
    private Linea linea;

    public Fermata(){}

    public Fermata(String direzione,
                   String indirizzo,
                   String descrizione,
                   String orario,
                   Linea linea) {
        this.direzione = direzione;
        this.indirizzo = indirizzo;
        this.descrizione = descrizione;
        this.orario = orario;
        this.linea = linea;
    }

    public Fermata(Fermata f) {
        this.direzione = f.getDirezione();
        this.indirizzo = f.getIndirizzo();
        this.descrizione = f.getDescrizione();
        this.orario = f.getOrario();
        this.linea = f.getLinea();
        this.geoJsonPoint = f.getGeoJsonPoint();
    }

    public String getId() {
        return id.toHexString();
    }

    @JsonIgnore
    public ObjectId getId_obj() {
        return id;
    }
}