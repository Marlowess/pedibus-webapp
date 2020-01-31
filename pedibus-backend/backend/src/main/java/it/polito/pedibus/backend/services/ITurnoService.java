package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.DTOs.TurnoDTO;
import it.polito.pedibus.backend.DTOs.TurnoResponseDTO;
import it.polito.pedibus.backend.domain.FermataPartenzaArrivo;
import it.polito.pedibus.backend.mongoClasses.*;

import java.util.LinkedHashMap;

/**
 * Interfaccia che espone i metodi per creare e gestire i turni associati agli accompagnatori per le corse
 * del pedibus
 * **/
public interface ITurnoService {

    // Metodo per assegnare il turno di una corsa ad un accompagnatore. Riceve un TurnoDTO e restituisce
    // l'ID del turno appena creato. Solleva un'eccezione in caso di errori od incoerenze
    TurnoResponseDTO assegnaTurno(TurnoDTO turnoDTO) throws Exception;

    // Metodo per la modifica di un turno. Bisogna verificare che il campo turnoId non sia null, in quanto
    // costituisce l'unica informazione necessaria per trovare il turno corretto
    // Non ritorna alcun valore. Il sollevamento di un'eccezione indica un errore, in caso contrario la modifica
    // sarà andata a buon fine
    void modificaTurno(TurnoDTO turnoDTO) throws Exception;

    // Metodo per eliminare un turno dato il suo ID
    void eliminaTurno(String turnoId) throws Exception;

    // Con questo metodo si verifica che l'utente sia abilitato per essere assegnato a questo turno
    User checkUserInfos(String userId) throws Exception;

    // Questo metodo serve a verificare che questo user abbia dato disponibilità in questa data e per questa
    // direzione
    Disponibilita verificaDisponibilita(String data, int direzione, User user) throws Exception;

    // Verifico che le fermate di partenza e arrivo facciano parte della linea richiesta, siano consecutive,
    // e che non esistano già altri turni assegnati per fermate intermedie
    FermataPartenzaArrivo verificaConsistenzaFermate(Linea linea,
                                                     Corsa corsa,
                                                     String partenzaId,
                                                     String arrivoId) throws Exception;

    // Verifico che lo user loggato sia effettivamente l'amministratore della linea per cui si sta cercando di
    // assegnare il turno
    // Linea verificaAmministrazioneLinea(String lineaId) throws Exception;

    // Con questo metodo posso verificare che l'accompagnatore non sia già stato assegnato ad un turno nello stesso
    // giorno e nella stessa direzione
    void verificaPresenzaAltriTurni(Corsa corsa, User user) throws Exception;

    // Invia un riepilogo di tutte le fermate, indicando per ciascuna le persone che sono disponibili e quelle
    // a cui è già stato assegnato il turno, con eventuale accettazione da parte dell'accompagnatore
    LinkedHashMap<String, Object> getRiepilogoTurniByDataAndLinea(String emailAdmin,
                                                                  String nome_linea,
                                                                  Long data) throws Exception;
}
