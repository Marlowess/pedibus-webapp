package it.polito.pedibus.backend.DTOs;

import it.polito.pedibus.backend.mongoClasses.Disponibilita;
import it.polito.pedibus.backend.mongoClasses.Turno;
import lombok.Data;

/**
  Classe che astrae la disponibilità come visualizzata da un admin. Esso potrà vedere, se esiste, il turno
  a lui assegnato e che corrisponde alla disponibilità. In questo modo potrà confermare o rifiutare l'assegnazione
  del turno al volo
 **/
@Data
public class DisponibilitaResponseDTO {
    private Disponibilita disponibilitaInfos;
    private Turno turno;
    private String nomeLinea;
}
