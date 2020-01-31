package it.polito.pedibus.backend.repositories;

import it.polito.pedibus.backend.mongoClasses.Prenotazione;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PrenotazioneRepository extends MongoRepository<Prenotazione, ObjectId> {
    Prenotazione findByCorsaIdAndBambino(ObjectId corsaId, String bambino);
    List<Prenotazione> findByCorsaIdInAndBambinoOrderByCorsaId(List<ObjectId> corseIds, String bambino);
    List<Prenotazione> findByCorsaId(ObjectId corsaId);
    List<Prenotazione> findByBambinoIgnoreCase(String bambino);
}
