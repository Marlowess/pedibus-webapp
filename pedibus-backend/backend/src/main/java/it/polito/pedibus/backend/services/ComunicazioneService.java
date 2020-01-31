package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.DTOs.ComunicazioneDTO;
import it.polito.pedibus.backend.mongoClasses.Comunicazione;
import it.polito.pedibus.backend.mongoClasses.User;
import it.polito.pedibus.backend.repositories.ComunicazioneRepository;
import org.bson.types.ObjectId;
import org.springframework.context.annotation.Lazy;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servizio per l'invio delle comunicazioni agli utenti. Queste comunicazioni sono da intendersi sia come
 * notifiche push all'interno dell'applicazione che come aggiornamenti ai dati in tempo reale per l'aggiornamento
 * dell'interfaccia grafica
 * **/
@Service
public class ComunicazioneService implements IComunicazioneService {

    private SimpMessagingTemplate template;

    private final ComunicazioneRepository comunicazioneRepository;
    private final UserService userService;

    public ComunicazioneService(ComunicazioneRepository comunicazioneRepository,
                                @Lazy UserService userService,
                                SimpMessagingTemplate template) {
        this.comunicazioneRepository = comunicazioneRepository;
        this.userService = userService;
        this.template = template;
    }

    /**
     * Permette la creazione e l'invio di una nuova notifica push ad uno user
     * **/
    @Override
    public void nuovaComunicazione(String userId, String testo, String topic){
        Comunicazione comunicazione = new Comunicazione();
        comunicazione.setUserId(new ObjectId(userId));
        comunicazione.setTesto(testo);
        comunicazione.setTopic(topic);
        comunicazione.setTimestamp(System.currentTimeMillis());
        comunicazione.setLetta(false);
        comunicazione.setVisualizza(true);

        // Salvo nel DB
        comunicazioneRepository.save(comunicazione);

        // Invio una notifica allo user specificato
        this.template.convertAndSendToUser(userId, "/queue/notification", new ComunicazioneDTO(comunicazione));
    }

    /**
     * Invia aggiornamenti in real time a tutti gli utenti la cui grafica dovrà essere aggiornata
     * **/
    @Override
    public void nuovaComunicazioneRealTime(String userId, Object json, String queue){
        this.template.convertAndSendToUser(userId, "/queue/" + queue, json);
    }


    /** Ritorna il numero di comunicazioni non lette destinate allo user loggato **/
    @Override
    public HashMap<String, Integer> getNumeroComunicazioniNonLette(String userId) throws Exception {
        User user = userService.verificaEsistenzaUser(userId);
        Integer unread = comunicazioneRepository.findByUserIdAndLetta(user.getId_obj(), false).size();
        HashMap<String, Integer> map = new HashMap<>();
        map.put("comunicazioni_non_lette", unread);

        return map;
    }

    /**
     * Permette di marcare tutte le comunicazioni di un utente come già lette
     * **/
    @Override
    public void segnaTutteLette(String userId) throws Exception {

        // Verifico se lo user esiste
        User user = userService.verificaEsistenzaUser(userId);

        // Estraggo tutte le comunicazioni associate a questo utente (che non siano già state lette)
        List<Comunicazione> comunicazioni = comunicazioneRepository.findByUserIdAndLetta(user.getId_obj(), false);

        for(Comunicazione c : comunicazioni){
            c.setLetta(true);
            comunicazioneRepository.save(c);
        }
    }

    /**
     * Permette di segnare una comunicazione come letta a partire dal suo identificativo.
     * **/
    @Override
    public void segnaComunicazione(String userId, String comunicazioneId, boolean stato) throws Exception {
        User user = userService.verificaEsistenzaUser(userId);
        Comunicazione comunicazione = verificaComunicazioneById(comunicazioneId);

        // Verifico che questa comunicazione sia riferita allo user che sta facendo la richiesta
        compareComunicazioneAndUserId(comunicazione.getUserId().toHexString(), user.getId());

        // Segno la comunicazione come letta o come non letta a seconda dell'azione
        comunicazione.setLetta(stato);

        // Salvo nel DB
        comunicazioneRepository.save(comunicazione);

    }

    /**
     * Ritorna tutte le comunicazioni associate allo user indicato
     * **/
    @Override
    public List<Comunicazione> getAllComunicazioniByUser(String userId) throws Exception {
        User user = userService.verificaEsistenzaUser(userId);
        return comunicazioneRepository.findByUserId(user.getId_obj())
                .stream()
                .filter(Comunicazione::isVisualizza)
                .sorted(Comparator.comparingLong(Comunicazione::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Ritorna tutte le comunicazioni associate allo user indicato e che siano nello stato
     * letto/non letto
     * **/
    @Override
    public List<Comunicazione> getComunicazioniByUserAndByStatus(String userId, boolean letta) throws Exception {
        User user = userService.verificaEsistenzaUser(userId);
        return comunicazioneRepository.findByUserIdAndLetta(user.getId_obj(), letta)
                .stream()
                .sorted(Comparator.comparingLong(Comunicazione::getTimestamp).reversed())
                .collect(Collectors.toList());
    }

    /**
     * Permette la cancellazione di tutte le comunicazioni associate allo user indicato.
     * Con cancellazione si intende l'operazione per cui il dato utente non vedrà più
     * tali comunicazioni a schermo. Esse rimarranno comunque nel database come dato storico
     * **/
    @Override
    public void deleteAllComunicazioni(String userId) throws Exception {
        User user = userService.verificaEsistenzaUser(userId);
        for(Comunicazione c : comunicazioneRepository.findByUserId(user.getId_obj())){
            c.setVisualizza(false);
            comunicazioneRepository.save(c);
        }
    }

    /**
     * Permette la cancellazione (intesa come per il metodo precedente) di una comunicazione a partire
     * dall'ID della comunicazione e per uno specifico utente
     * **/
    @Override
    public void deleteComunicazione(String userId, String comunicazioneId) throws Exception {
        User user = userService.verificaEsistenzaUser(userId);
        Comunicazione comunicazione = verificaComunicazioneById(comunicazioneId);
        compareComunicazioneAndUserId(comunicazione.getUserId().toHexString(), user.getId());
        comunicazione.setVisualizza(false);
        comunicazioneRepository.save(comunicazione);
    }

    /** Verifica l'esistenza di una comunicazione con l'ID fornito **/
    private Comunicazione verificaComunicazioneById(String id) throws Exception{
        Optional<Comunicazione> comunicazioneOptional = comunicazioneRepository.findById(new ObjectId(id));
        if(!comunicazioneOptional.isPresent())
            throw new Exception("Comunicazione inesistente");
        return comunicazioneOptional.get();
    }

    /** Confronta l'ID dello user richiedente e di quello associato alla comunicazione **/
    private void compareComunicazioneAndUserId(String comunicazioneUserId, String userId) throws Exception{
        if(!userId.equals(comunicazioneUserId))
            throw new Exception("Comunicazione non riferita all'utente loggato");
    }

    /**
     * Cancella in maniera definitiva tutte le comunicazioni dal DB
     * **/
    public void deleteAll(){
        comunicazioneRepository.deleteAll();
    }
}
