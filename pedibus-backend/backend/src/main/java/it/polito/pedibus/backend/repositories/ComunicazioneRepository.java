package it.polito.pedibus.backend.repositories;

import it.polito.pedibus.backend.mongoClasses.Comunicazione;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ComunicazioneRepository extends MongoRepository<Comunicazione, ObjectId> {

    // Ritorna tutte le comunicazioni associate ad uno specifico user
    List<Comunicazione> findByUserId(ObjectId userId);

    // Ritorna la lista delle comunicazioni non ancora lette da uno specifico user
    List<Comunicazione> findByUserIdAndLetta(ObjectId userId, boolean letta);
}
