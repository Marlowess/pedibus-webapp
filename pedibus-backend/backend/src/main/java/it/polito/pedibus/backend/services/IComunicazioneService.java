package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.mongoClasses.Comunicazione;

import java.util.HashMap;
import java.util.LinkedList;
import java.util.List;

/**
 * Interfaccia contenente tutti i metodi esposti dal servizio che gestisce le comunicazioni agli utenti
 * **/
public interface IComunicazioneService {

    // Permette la creazione e l'aggiunta di una nuova comunicazione per un determinato utente.
    void nuovaComunicazione(String userId, String testo, String topic) throws Exception;

    // Permette di inviare un aggiornamento in tempo reale ad un utente in modo che veda i dati
    // appena aggiornati da altri user
    void nuovaComunicazioneRealTime(String userId, Object testo, String queue) throws Exception;

    HashMap<String, Integer> getNumeroComunicazioniNonLette(String userId) throws Exception;

    // Segna tutte le comunicazioni dello user invocante come lette
    void segnaTutteLette(String email) throws Exception;

    // Permette di segnare una comunicazione come letta o non letta a seconda dello stato attuale della stessa
    void segnaComunicazione(String email, String comunicazioneId, boolean stato) throws Exception;

    // Permette di ottenere la lista delle comunicazioni indirizzate ad uno specifico utente
    List<Comunicazione> getAllComunicazioniByUser(String email) throws Exception;

    // Permette di ottenere la lista delle comunicazioni indirizzate ad uno specifico utente e che soddisfino
    // il criterio di lettura
    List<Comunicazione> getComunicazioniByUserAndByStatus(String email, boolean letta) throws Exception;

    // Tutte le comunicazioni di questo utente vengono cancellate, nel senso che lui non le visualizzerà più
    // una volta aggiornata la pagina. Esse rimarranno comunque salvate all'interno della base dati
    void deleteAllComunicazioni(String email) throws Exception;

    // Esegue lo stesso task del metodo precedente ma su una comunicazione specifica
    void deleteComunicazione(String email, String comunicazioneId) throws Exception;

}
