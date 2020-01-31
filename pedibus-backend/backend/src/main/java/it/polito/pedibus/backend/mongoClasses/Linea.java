package it.polito.pedibus.backend.mongoClasses;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import javax.annotation.Generated;
import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;

/**
 * Rappresenta una linea del pedibus
 * **/
@Document(collection = "linee")
@Data
@JsonInclude(JsonInclude.Include.NON_NULL)
@Generated("org.jsonschema2pojo")
public class Linea implements Serializable {

    @Id
    private ObjectId id;

    @JsonProperty("nome")
    private String nome;

    @JsonProperty("admin_email")
    @JsonIgnore
    private List<String> admin_email;

    @JsonProperty("fermate_andata")
    private List<Fermata> fermate_andata;

    @JsonProperty("fermate_ritorno")
    private List<Fermata> fermate_ritorno;

    public Linea(){}

    public Linea(String nome, List<String> admin_email) {
        this.nome = nome;
        this.fermate_andata = new ArrayList<>();
        this.fermate_ritorno = new ArrayList<>();
        this.admin_email = admin_email;
    }

    @Override
    public String toString() {
        return String.format(
                "Linea[id=%d, nome='%s', admin=%s, fermate_andata=%s, fermate_ritorno=%s]",
                id.toHexString(), nome, admin_email, fermate_andata.toString(), fermate_ritorno.toString());
    }

    public String getId() {
        return id.toHexString();
    }

    @JsonIgnore
    public ObjectId getId_obj() {
        return id;
    }
}
