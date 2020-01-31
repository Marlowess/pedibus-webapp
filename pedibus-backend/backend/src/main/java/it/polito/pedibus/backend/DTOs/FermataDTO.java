package it.polito.pedibus.backend.DTOs;

import it.polito.pedibus.backend.mongoClasses.Fermata;
import lombok.Data;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

@Data
public class FermataDTO {
    private String id;
    private String direzione;
    private String indirizzo;
    private String descrizione;
    private String orario;
    private GeoJsonPoint geoJsonPoint;

    public FermataDTO(){}

    public FermataDTO(Fermata fermata){
        this.descrizione = fermata.getDescrizione();
        this.direzione = fermata.getDirezione();
        this.geoJsonPoint = fermata.getGeoJsonPoint();
        this.id = fermata.getId();//.toHexString();
        this.indirizzo = fermata.getIndirizzo();
        this.orario = fermata.getOrario();
    }
}
