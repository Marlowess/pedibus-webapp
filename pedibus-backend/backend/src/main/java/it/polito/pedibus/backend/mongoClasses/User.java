package it.polito.pedibus.backend.mongoClasses;

import com.fasterxml.jackson.annotation.JsonIgnore;
import lombok.Data;
import org.bson.types.ObjectId;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Questa classe astrae il generico utente
 **/
@Document(collection = "utenti")
@Data
public class User implements UserDetails {

    @Id
    private ObjectId id;

    private String nome;
    private String cognome;
    private String email;

    // Fermate di default dei bambini di questo genitore
    private Fermata salitaDefault; // default
    private Fermata discesaDefault;

    @JsonIgnore
    private String password;

    @JsonIgnore
    private List<String> ruoli;

    @JsonIgnore
    private STATO stato;

    @JsonIgnore
    private UUID token;

    @JsonIgnore
    private Long tokenTime;

    @JsonIgnore
    private List<String> lineeAmministrate;

    @JsonIgnore
    private List<String> bambini;

    public enum STATO{
        ATTESA_VERIFICA,
        ABILITATO,
        SCADUTO,
        BLOCCATO
    }

    public User(String email, String nome, String cognome, String password, List<String> ruoli) {
        this.nome = nome;
        this.cognome = cognome;
        this.email = email;
        this.password = password;
        this.ruoli = ruoli;
    }

    public User(){}

    @SuppressWarnings(value = "unused")
    public String getId() {
        return id.toHexString();
    }

    @Override
    @JsonIgnore
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return null;
    }

    @Override
    @JsonIgnore
    public String getUsername() {
        return email;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonExpired() {
        return this.stato != STATO.SCADUTO;
    }

    @Override
    @JsonIgnore
    public boolean isAccountNonLocked() {
        return this.stato != STATO.BLOCCATO;
    }

    @Override
    @JsonIgnore
    public boolean isCredentialsNonExpired() {
        return false;
    }

    @Override
    @JsonIgnore
    public boolean isEnabled() {
        return this.stato == STATO.ABILITATO;
    }

    @JsonIgnore
    public ObjectId getId_obj() {
        return id;
    }
}
