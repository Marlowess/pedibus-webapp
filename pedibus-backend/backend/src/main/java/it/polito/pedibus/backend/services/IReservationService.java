package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.DTOs.PrenotazioneDTO;
import it.polito.pedibus.backend.mongoClasses.Prenotazione;

import java.util.Date;
import java.util.LinkedHashMap;

public interface IReservationService {

//    GET /reservations/{nome_linea}/{data}
//    restituisce un oggetto JSON contenente due liste,
//    riportanti, per ogni fermata di andata e ritorno, l’elenco delle persone che devono essere
//    prese in carico / lasciate in corrispondenza della fermata
    LinkedHashMap<String, Object> getUsersByReservationDateAndLine(String nomeLinea, Date date) throws Exception;


//    POST /reservations/{nome_linea}/{data} – invia un oggetto JSON contenente il nome
//    dell’alunno da trasportare, l’identificatore della fermata a cui sale/scende e il verso di
//    percorrenza (andata/ritorno); restituisce un identificatore univoco della prenotazione
//    creata
    Prenotazione addReservation(PrenotazioneDTO prenotazioneDTO,
                                String nomeLinea,
                                boolean prenotatoDaGenitore,
                                String loggedUserId) throws Exception;


//    PUT /reservations/{nome_linea}/{data}/{reservation_id} – invia un oggetto JSON che
//    permette di aggiornare i dati relativi alla prenotazione indicata
    void updateReservation(PrenotazioneDTO prenotazioneDTO, String nomeLinea) throws Exception;


//    DELETE /reservations/{nome_linea}/{data}/{reservation_id}
//    permette di cancellare una prenotazione
    void deleteReservation(String reservation_id, String userId) throws Exception;


//    GET /reservations/{nome_linea}/{data}/{reservation_id}
//    restituisce la prenotazione
    LinkedHashMap<String, Object> getReservation(String nome_linea, long date, String reservation_id) throws Exception;

    // Restituisce tutte le prenotazioni associate ad una specifica linea, ad uno specifico bambino e per la durata
    // di una settimana
    LinkedHashMap<String, Object> getReservationByLineaBambinoWeek(String email,
                                                                   Long date,
                                                                   String bambino) throws Exception;
}
