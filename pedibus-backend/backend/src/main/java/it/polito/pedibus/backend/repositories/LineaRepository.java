package it.polito.pedibus.backend.repositories;

import it.polito.pedibus.backend.mongoClasses.Linea;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface LineaRepository extends MongoRepository<Linea, ObjectId> {
    Optional<Linea> findByNome(String name);
}
