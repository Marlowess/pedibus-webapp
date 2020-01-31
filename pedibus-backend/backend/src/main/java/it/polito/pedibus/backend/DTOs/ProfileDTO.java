package it.polito.pedibus.backend.DTOs;

import lombok.Data;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Null;

@Data
public class ProfileDTO {

    String nome_linea;

    @NotNull
    String fermata_salita_id;

    @NotNull
    String fermata_discesa_id;

    @NotNull
    String[] bambini;
}
