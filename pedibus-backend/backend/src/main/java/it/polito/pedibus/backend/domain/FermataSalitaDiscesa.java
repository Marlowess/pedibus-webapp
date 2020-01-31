package it.polito.pedibus.backend.domain;

import lombok.Data;

import java.util.ArrayList;

/**
 * Classe rappresentante le informazioni riguardanti le presenze per una certa fermata di una certa corsa.
 * Contiene anche informazioni aggiuntive sulla fermata in modo da decorare meglio la grafica lato client
 * **/
@Data
public class FermataSalitaDiscesa {
    private String fermataID;
    private String orario;
    private String indirizzo;
    private String descrizione;
    private ArrayList<Presenza> salita;
    private ArrayList<Presenza> discesa;

    // Indica se questa fermata fa parte del turno dell'accompagnatore
    private boolean inTurno;

    public FermataSalitaDiscesa(String indirizzo,
                                String descrizione,
                                ArrayList<Presenza> salita,
                                ArrayList<Presenza> discesa,
                                String orario,
                                String fermataID,
                                boolean inTurno){
        this.indirizzo = indirizzo;
        this.descrizione = descrizione;
        this.salita = salita;
        this.discesa = discesa;
        this.orario = orario;
        this.fermataID = fermataID;
        this.inTurno = inTurno;
    }
}