package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.DTOs.LineaDTO;
import it.polito.pedibus.backend.mongoClasses.Linea;

import java.util.List;

public interface ILineService {

    // Ritorna tutte le linee
    List<String> getAllLines();

    // Ritorna la linea a partire dal nome
    Linea getLineaByNome(String name) throws Exception;

    // Ritorna l'elenco degli ID delle linee gestite da questo admin
    List<LineaDTO> getLineeIdByAdmin() throws Exception;

}
