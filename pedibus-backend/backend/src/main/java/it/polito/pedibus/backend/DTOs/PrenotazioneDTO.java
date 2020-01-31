package it.polito.pedibus.backend.DTOs;

import it.polito.pedibus.backend.mongoClasses.Corsa;
import it.polito.pedibus.backend.mongoClasses.Prenotazione;
import lombok.Data;
import org.springframework.lang.Nullable;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Date;

@Data
public class PrenotazioneDTO {

    @Nullable
    private String fermataSalita;

    @Nullable
    private String fermataDiscesa;

    @Nullable
    private String reservationId;

    @Nullable
    private String userId;

    @Nullable
    private Long date;

    @Nullable
    private String bambino;

    @Nullable
    private Integer direzione;

    public void setByReservation(Prenotazione p, Corsa corsa){
        this.fermataSalita = p.getFermataSalita().getId();
        this.fermataDiscesa = p.getFermataDiscesa().getId();
        this.reservationId = p.getId();
        this.userId = p.getUserId().toHexString();

        // Converto la data in long
        try{
            SimpleDateFormat sdf = new SimpleDateFormat("dd-MM-yyyy");
            Date date = sdf.parse(corsa.getData());
            this.date = date.getTime();
        }
        catch(ParseException e){
            this.date = null;
        }


        this.direzione = corsa.getDirezione();
        this.bambino = p.getBambino();
    }
}
