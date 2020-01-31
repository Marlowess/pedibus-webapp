package it.polito.pedibus.backend.DTOs;

import lombok.Data;

import javax.validation.constraints.NotNull;

@Data
public class DisponibilitaDTO {

    @NotNull
    private String date;

    @NotNull
    private Integer direzione;

    public DisponibilitaDTO(String date, Integer direzione){
        this.date = date;
        this.direzione = direzione;
    }
}
