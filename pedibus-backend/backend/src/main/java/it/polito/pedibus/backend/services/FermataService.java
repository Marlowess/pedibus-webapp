package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.mongoClasses.Fermata;
import it.polito.pedibus.backend.repositories.FermataRepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

/**
 * Servizio per la gestione delle fermate di ciascuna linea del pedibus
 * **/
@Service
//@Transactional
public class FermataService {

    private final FermataRepository fermataRepository;

    public FermataService(FermataRepository fermataRepository) {
        this.fermataRepository = fermataRepository;
    }

    /** Metodo per aggiungere una fermata al DB **/
    public Fermata aggiungiFermata(Fermata fermata){
        return fermataRepository.save(fermata);
    }

    public void deleteAll(){
        fermataRepository.deleteAll();
    }

    /** Metodo per controllare che la fermata associata a questo ID esista **/
    Fermata getFermataById(String fermataId) throws Exception{
        // Controllo che questa fermata esista
        Optional<Fermata> fermataOptional = fermataRepository.findById(new ObjectId(fermataId));

        // Se almeno una delle due non esiste devo uscire immediatamente
        if(!fermataOptional.isPresent())
            throw new Exception("Fermata non valida");

        return fermataOptional.get();
    }

    /** Verifica che le fermate siano associate alla linea specificata **/
    void checkLineInfos(Fermata fermataSalita, Fermata fermataDiscesa, String nomeLinea) throws Exception{
        // Verifico che le fermate facciano parte della stessa linea
        if(!fermataSalita.getLinea().getId()//.toHexString()
                .equals(fermataDiscesa.getLinea().getId()))//.toHexString()))
            throw new Exception("Fermate di linee diverse");

        // Verifico che il nome della linea corrisponda
        if(!fermataSalita.getLinea().getNome().equals(nomeLinea))
            throw new Exception("Il nome della linea non è valido");
    }

    /** Ritorna l'orario di passaggio di una fermata secondo l'id della stessa **/
    String getOraPassaggioByFermataId(String fermataId) throws Exception{
        Optional<Fermata> fermataOptional = fermataRepository.findById(new ObjectId(fermataId));
        if(!fermataOptional.isPresent())
            throw new Exception("Una delle fermate è inesistente");
        return fermataOptional.get().getOrario();
    }

}