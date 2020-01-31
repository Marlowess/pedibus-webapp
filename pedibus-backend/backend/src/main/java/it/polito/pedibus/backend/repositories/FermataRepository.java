package it.polito.pedibus.backend.repositories;

import it.polito.pedibus.backend.mongoClasses.Fermata;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FermataRepository extends MongoRepository<Fermata, ObjectId> {
}