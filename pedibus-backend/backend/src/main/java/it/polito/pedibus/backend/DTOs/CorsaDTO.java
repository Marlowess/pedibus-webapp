package it.polito.pedibus.backend.DTOs;

import lombok.Data;

import javax.validation.constraints.NotNull;
@Data
public class CorsaDTO {

    @NotNull
    private String nome_linea;

    @NotNull
    private Long date;

    @NotNull
    private Integer direzione;
}
