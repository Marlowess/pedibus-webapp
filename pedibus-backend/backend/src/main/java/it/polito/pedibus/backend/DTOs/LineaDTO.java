package it.polito.pedibus.backend.DTOs;

import lombok.Data;

import java.util.List;

/**
 * Questa classe viene popolata dal service delle linee quando deve inoltrare le risposte verso il controller
 * **/
@Data
public class LineaDTO {
    private String id;
    private String nome;
    private List<FermataDTO> fermate_andata;
    private List<FermataDTO> fermate_ritorno;
}
