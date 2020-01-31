package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.DTOs.ProfileDTO;
import it.polito.pedibus.backend.DTOs.UserDTO;
import it.polito.pedibus.backend.mongoClasses.Linea;
import it.polito.pedibus.backend.mongoClasses.User;
import it.polito.pedibus.backend.validators.EmailExistsException;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;

public interface IUserService {

    // crea un master admin all'avvio del programma
    void creazioneAdminMaster(UserDTO userDTO);

    // inserisce una mail nel sistema in attesa che l'utente completi la registrazione
    UUID inserimentoNuovoUser(String email, int ruolo) throws Exception, EmailExistsException;

    // data una mail, viene restituito il ruolo dello user
    String getRoleByEmail(String email) throws Exception;

    // metodo invocato quando lo user fornisce le informazioni per completare il profilo
    // deve essere verificato il legame tra email e user ID
    User completaProfilo(UUID uuid, UserDTO userDTO) throws Exception;

    // registra un nuovo user
    // ruolo: {0: "passeggero", 1: "accompagnatore"}
    UUID registrazione(UserDTO userDTO, int ruolo) throws Exception;

    // verifica che il token sia valido e non scaduto. Abilita un utente
    boolean verificaAbilitazione(UUID random);

    // restituisce un token associato alla richiesta di recupero password di un utente
    UUID recuperaPassword(String email) throws Exception;

    // verifica che il token sia valido ed aggiorna la password dell'utente che ne ha fatto richiesta
    void aggiornaPassword(UUID uuid, String nuovaPassword) throws Exception;

    // restituisce l'elenco di tutti gli utenti del sistema
    List<User> getAllUsers();

    // cambia il ruolo di un admin nella gestione di una determinata linea
    // azione: {0: "rimozione gestione linea", 1: "incarico gestione linea"}
    void aggiornaGestioneLinea(String nomeLinea, String email, String userID, int azione) throws Exception;

    // Questo metodo viene invocato al boot del sistema per assegnare una linea ad un admin.
    // Si assume che su file siano correttamente riportati gli indirizzi email di accompagnatori, che verranno
    // qui promossi ad amministratori della linea indicata
    void assegnaGestioneLineaAtBoot(Linea linea) throws Exception;

    // Metodo per aggiungere un nuovo bambino all'elenco dei bambini di questo utente
    void aggiungiBambino(String emailAdmin, List<String> bambino) throws Exception;

    // Metodo per settare le fermate di default dello user
    void updateProfile(String userId, ProfileDTO profileDTO)
            throws Exception;

    // Metodo per verificare le informazioni sull'utente
    User verificaEsistenzaUser(String userId) throws Exception;

    // Metodo per verificare le informazioni sull'utente in base alla email
    User verificaEsistenzaUserByEmail(String userId) throws Exception;

    // Restituisce le informazioni di default (linea e fermata) di uno user
    LinkedHashMap<String, Object> getProfileInfos(String email) throws Exception;

    // Restituisce le informazioni del metodo sopra + l'elenco dei bambini
    LinkedHashMap<String, Object> getProfileInfosBambini(String email) throws Exception;
}
