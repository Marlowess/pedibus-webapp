package it.polito.pedibus.backend.DTOs;

import lombok.Data;

/**
 * Questa classe astrae l'aggiornamento di ruolo di un accompagnatore ad admin e viceversa.
 * Un'istanza di questa classe sarà ricevuta da tutti gli amministratori di linea diversi da quello che ha operato
 * la modifica affinchè la loro grafica venga aggiornata in tempo reale
 * **/
@Data
public class RuoloUpdateDTO {
    private String id; // l'id della persona oggetto di modifica
    private String nome; // il nome completo della persona che deve essere visualizzata o rimossa
    private String action; // ACTION_PROMOSSO, ACTION_DECLASSATO
}
