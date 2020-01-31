package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.mongoClasses.Corsa;
import it.polito.pedibus.backend.repositories.CorsaRepository;
import org.bson.types.ObjectId;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servizio per la gestione delle corse del pedibus
 **/
@Service
public class CorsaService {

    // Informazioni sui tempi
    // Una settimana ed un giorno in millisecondi
    private Long milliseconds_in_week = 604800000L;
    //private Long milliseconds_in_day = 86400000L;

    private final CorsaRepository corsaRepository;

    public CorsaService(CorsaRepository corsaRepository) {
        this.corsaRepository = corsaRepository;
    }

    /**
     * Permette di aggiungere una nuova corsa al DB
     **/
    public void aggiungiCorsa(Corsa corsa) {
        corsaRepository.save(corsa);
    }

    /**
     * Elimina tutte le corse in maniera definitiva dal DB
     **/
    public void deleteAll() {
        corsaRepository.deleteAll();
    }

    /**
     * Questo metodo ritorna l'elenco delle date in cui è prevista una corsa
     **/
    List<String> getDataCorse() {

        List<String> dataCorse;

        dataCorse = corsaRepository.findAll()
                .stream()
                .map(c -> {
                    try {
                        return new SimpleDateFormat("dd-MM-yyyy").parse(c.getData()).getTime();
                    } catch (ParseException e) {
                        return null;
                    }
                })
                .distinct()
                .sorted()
                .map(c -> new SimpleDateFormat("dd-MM-yyyy").format(c))
                .collect(Collectors.toList());

        return dataCorse;
    }

    /**
     * Costruisce una mappa contenente le date delle corse per la settimana
     **/
    LinkedHashMap<String, Object> getMapCorseWeek(Long date, String userId) {

        // Costruisco la mappa per il JSON da ritornare al client
        LinkedHashMap<String, Object> map = new LinkedHashMap<>();
        map.put("id_user", userId);
        map.put("data_inizio", new SimpleDateFormat("dd-MM-yyyy").format(date));
        map.put("data_fine", new SimpleDateFormat("dd-MM-yyyy").format(date + milliseconds_in_week));

        return map;
    }

    /**
     * Metodo per verificare che la data passata sia compresa o meno nella settimana richiesta
     **/
    boolean isDataCorsaCompresa(String dataCorsa, Long date) {
        Long dataFine = date + milliseconds_in_week;
        try {
            Long dataCorsaMillisec = new SimpleDateFormat("dd-MM-yyyy").parse(dataCorsa).getTime();
            return dataCorsaMillisec <= dataFine && dataCorsaMillisec >= date;
        } catch (ParseException e) {
            return false;
        }
    }

    /**
     * Ritorna una corsa se esiste oppure solleva un'eccezione
     **/
    Corsa getCorsaInfo(String data, Integer direzione, ObjectId lineaId) throws Exception {
        Corsa corsa = corsaRepository.findByDataAndDirezioneAndLineaId(data, direzione, lineaId);
        if (corsa == null)
            throw new Exception("Corsa non esistente");
        return corsa;
    }

    /**
     * Ritorna l'elenco delle corse in una certa data e per una certa direzione
     **/
    List<Corsa> getCorseByDataAndDirezione(String data, int direzione) {
        return corsaRepository.findByDataAndDirezione(data, direzione);
    }

    /**
     * Ritorna una corsa a partire dalla tripletta data, direzione, linea.
     * Se non esiste solleva un'eccezione
     **/
    Corsa getCorsaByDataDirezioneLinea(String data, int direzione, ObjectId lineaId) throws Exception {
        Corsa corsa = corsaRepository.findByDataAndDirezioneAndLineaId(
                data, direzione, lineaId);
        if (corsa == null)
            throw new Exception("Corsa inesistente");
        return corsa;
    }

    /**
     * Permette di verificare se una corsa esiste a partire dal suo ID.
     * Se esiste la ritorna, altrimenti solleva un'eccezione
     **/
    Corsa verificaEsistenzaCorsaById(ObjectId corsaId) throws Exception {
        Optional<Corsa> corsaOptional = corsaRepository.findById(corsaId);
        if (!corsaOptional.isPresent())
            throw new Exception("Corsa inesistente");
        return corsaOptional.get();
    }
}
