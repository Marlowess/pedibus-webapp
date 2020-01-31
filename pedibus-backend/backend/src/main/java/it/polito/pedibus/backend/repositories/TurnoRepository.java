package it.polito.pedibus.backend.repositories;

import it.polito.pedibus.backend.mongoClasses.Corsa;
import it.polito.pedibus.backend.mongoClasses.Turno;
import it.polito.pedibus.backend.mongoClasses.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Repository per gestire i turni sullo stato di persistenza.
 * Questi metodi saranno invocati solamente dal gestore della linea che sta assegnando
 * o revocando i turni agli altri accompagnatori.
 * **/
@Repository
public interface TurnoRepository extends MongoRepository<Turno, ObjectId> {
    List<Turno> findByCorsa(Corsa corsa);
    Optional<Turno> findByCorsaAndUser(Corsa corsa, User user);
    List<Turno> findByUser(User user);
}
