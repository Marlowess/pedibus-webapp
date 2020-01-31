package it.polito.pedibus.backend.repositories;

import it.polito.pedibus.backend.mongoClasses.Disponibilita;
import it.polito.pedibus.backend.mongoClasses.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DisponibilitaRepository extends MongoRepository<Disponibilita, ObjectId> {
    Disponibilita findByDataAndDirezioneAndUser(String date, int direzione, User user);
    List<Disponibilita> findByDataAndDirezione(String date, int direzione);
    List<Disponibilita> findByUser(User user);
    void deleteByUser(User user);
}
