package it.polito.pedibus.backend.domain;

import it.polito.pedibus.backend.mongoClasses.Fermata;
import it.polito.pedibus.backend.mongoClasses.User;
import lombok.Data;

import java.util.ArrayList;
import java.util.List;

/**
 * Questa classe contiene informazioni sugli utenti che si sono resti disponibili ed eventualmente a cui sono stati
 * assegnati dei turni
 * **/
@Data
public class TurnoInfo {

    // Informazioni sulla fermata
    private Fermata fermata;

    // Elenco di utenti che sono disponibili od assegnati per questa fermata
    private List<UserInfo> userInfos;

    // Aggiungi uno user a questo oggetto per il JSON finale
    public void addUser(User user, boolean assegnato, boolean confermato, String turnoId){
        UserInfo userInfo = new UserInfo(user, assegnato, confermato, turnoId);
        this.userInfos.add(userInfo);
    }

    public TurnoInfo(Fermata fermata) {
        this.fermata = fermata;
        this.userInfos = new ArrayList<>();
    }

    /**
     * Classe privata che contiene le informazioni del singolo user
     * **/
    @Data
    private class UserInfo {
        // Informazioni sull'utente del turno o sulla sua disponibilità
        private User user;

        // Indica se questo utente è già stato assegnato ad un turno
        private boolean assegnato;

        // Indica se l'utente ha confermato il suo impegno per coprire il turno
        private boolean confermato;

        // Se lo user è stato assegnato ad un turno qui deve comparire il relativo ID
        private String turnoId;

        UserInfo(User user, boolean assegnato, boolean confermato, String turnoId) {
            this.user = user;
            this.assegnato = assegnato;
            this.confermato = confermato;
            this.turnoId = turnoId;
        }
    }
}
