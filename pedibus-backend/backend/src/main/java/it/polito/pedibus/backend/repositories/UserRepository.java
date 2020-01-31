package it.polito.pedibus.backend.repositories;


import it.polito.pedibus.backend.mongoClasses.User;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserRepository extends MongoRepository<User, ObjectId> {
    User findByEmail(String email);
    User findByToken(UUID random);
    List<User> findByRuoliContains(String ruolo);
}