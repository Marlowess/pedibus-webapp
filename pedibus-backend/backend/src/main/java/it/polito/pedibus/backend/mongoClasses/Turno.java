package it.polito.pedibus.backend.mongoClasses;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

/**
 * Questa classe permette di salvare le informazioni riguardanti i turni assegnati agli
 * accompagnatori. Un turno è legato ad una corsa (data, linea, direzione) ed a due fermate:
 * una di partenza ed una di arrivo per l'accompagnatore. L'attributo user è legato all'accompagnatore,
 * che sarà notificato quando un turno verrà lui assegnato
 * **/
@Document(collection = "turni")
@Data
public class Turno {

    @Id
    private ObjectId id;

    // Corsa riferita a questo turno: essa contiene informazioni sulla data, sulla linea
    // e sulla direzione
    private Corsa corsa;

    // Fermata di partenza assegnata all'accompagnatore
    private Fermata partenza;

    // Fermata di arrivo assegnata all'accompagnatore
    private Fermata arrivo;

    // Informazioni dell'accompagnatore a cui è stato assegnato questo turno
    private User user;

    // Indica se l'accompagnatore ha confermato la presa visione del turno a lui assegnato
    private boolean confermato;

    public String getId() {
        return id.toHexString();
    }

    @JsonIgnore
    @SuppressWarnings("unused")
    public ObjectId getId_obj() {
        return id;
    }
}
