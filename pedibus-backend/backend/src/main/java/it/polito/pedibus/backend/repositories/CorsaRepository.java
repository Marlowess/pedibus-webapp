package it.polito.pedibus.backend.repositories;

import it.polito.pedibus.backend.mongoClasses.Corsa;
import org.bson.types.ObjectId;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CorsaRepository extends MongoRepository<Corsa, ObjectId> {
    Corsa findByDataAndDirezioneAndLineaId(String data, int direzione, ObjectId LineaId);
    List<Corsa> findByDataAndDirezione(String data, int direzione);
    List<Corsa> findByLineaIdAndData(ObjectId lineaId, String data);
    List<Corsa> findByLineaIdAndDataIsBetweenOrderByDataAsc(ObjectId lineaId, String dataStart, String dataEnd);

    // Ritorna tutte le corse per una certa linea a partire dalla data passata
    List<Corsa> findByLineaId(ObjectId lineaId);
}


