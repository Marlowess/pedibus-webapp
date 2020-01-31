package it.polito.pedibus.backend.controllers;


import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import it.polito.pedibus.backend.mongoClasses.Fermata;
import it.polito.pedibus.backend.mongoClasses.Linea;
import it.polito.pedibus.backend.services.LineaService;
import it.polito.pedibus.backend.utilities.ResponseEntityFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;


/**
 * Questa classe è stata pensata per poter funzionare da controller che riceve
 * nuove richieste per i propri endpoint relativi alla gestione delle informazioni
 * che riguardano le linee o una linea in modo più specificio.
 *
 * Risponderà a tutte le richieste http che correttamente gli giungono, validando i dati in input se presenti,
 * e fornendo risposte in formato http se l'operazione termina correttamente oppure con un messaggio d'errore.
 * */
@RestController
@RequestMapping("/lines")
public class LineaController {

    private final LineaService lineaService;

    @Autowired
    public LineaController(LineaService lineaService) {
        this.lineaService = lineaService;
    }

    // =========================================== Ottieni tutte le linee ==========================================

    /**
     * Questo metodo viene contattato quando una nuova richiesta http di tipo get
     * viene effettuata da un client remoto per l'url /lines.
     *
     * Il metodo cerca tutte le linee nel database e le ritorna in formato json
     * aggiungendole al corpo della risposta Http.
     *
     * In caso in cui, invece, non ci fossero linee presenti all'interno del database oppure
     * errori di altro genere quali connessione persa con il database, la risposta indicherà
     * nell'header lo stato pari ad 204 NO CONTENT
     *
     *
     * @return ResponseEntity<List<String>>
     * */
    @CrossOrigin
    @RequestMapping(method = RequestMethod.GET, produces = "application/json")
    public ResponseEntity getAllLines() {
        List<String> linee = lineaService.getAllLines();
        ObjectMapper mapper = new ObjectMapper();

        if (linee == null || linee.isEmpty()){
            return new ResponseEntity<>(HttpStatus.NO_CONTENT);
        }

        try {
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(mapper.writeValueAsString(linee));
        } catch (JsonProcessingException e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(HttpStatus.INTERNAL_SERVER_ERROR.toString());
        }
    }

    // =========================================== Ottieni elenco fermate andata e ritorno di una linea ==============

    /**
     * Questo metodo viene contattato quando una nuova richiesta http di tipo get
     * viene effettuata da un client remoto per l'url /lines/{line_name}.
     *
     * Il metodo cerca tutte le fermate di una linea, il cui nome viene passato come
     * parte del path che forma l'url contattata per questo endpoint, e restituisce in formato
     * json l'elenco delle fermate suddividendole tra direzione di andata e ritorno
     * mantenendo l'ordine o la precedenza fra le fermate stesse lungo una direzione.
     *
     * Altrimenti, nel caso in cui il nome della linea indicato nel path dell'url non
     * esista viene restituita una risposta vuota indicando nell'header http
     * lo stato della risposta pari a 404 NOT FOUND
     *
     * @param lineName nome della linea di cui si vuole avere informazioni
     * @return ResponseEntity<Map<String, List<Fermata>>>
     * */
    @GetMapping(value = "{line_name}", produces = "application/json")
    public ResponseEntity getAllFermateOfLineaByDirezione(@PathVariable("line_name")
                                                          @NotNull
                                                          @Size(min=2, max=20)
                                                                  String lineName) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            Linea linea = lineaService.getLineaByNome(lineName);


            List<Fermata> andata = new ArrayList<>(linea.getFermate_andata());
            List<Fermata> ritorno = new ArrayList<>(linea.getFermate_ritorno());

            Map<String, List<Fermata>> map = new LinkedHashMap<>();

            map.put("andata", andata);
            map.put("ritorno", ritorno);

//            HttpHeaders headers = new HttpHeaders();
//            headers.setAccessControlAllowOrigin("*");

            try {
                return ResponseEntity
                        .status(HttpStatus.OK)
                        .body(mapper.writeValueAsString(map));
            } catch (JsonProcessingException e) {
                return ResponseEntity
                        .status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(HttpStatus.INTERNAL_SERVER_ERROR.toString());
            }

        } catch (Exception exception) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }


    }

    /**
     * Questo metodo ritorna un array contenente gli ID delle linee amministrate dall'amministratore loggato
     * **/
    @RequestMapping(method = RequestMethod.GET, value="/adminlinea/summary", produces = "application/json")
    public ResponseEntity getLineeByAdmin(){
        try {
            ObjectMapper mapper = new ObjectMapper();
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(mapper.writeValueAsString(lineaService.getNomeLineeAdmin()));
        } catch (Exception e) {
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    e.getMessage(),
                    "errore");
        }
    }

}
