package it.polito.pedibus.backend.DTOs;

import lombok.Data;

@Data
public class PresenzaExportDTO {
    private String data;
    private String direzione;
    private String nomeLinea;
    private String nomeGenitore;
    private String cognomeGenitore;
    private String bambino;
    private String fermataSalita;
    private String fermataDiscesa;
    private boolean isSalito;
    private boolean isSceso;
}
