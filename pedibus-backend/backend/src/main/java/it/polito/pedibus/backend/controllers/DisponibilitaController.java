package it.polito.pedibus.backend.controllers;

import com.fasterxml.jackson.databind.ObjectMapper;
import it.polito.pedibus.backend.DTOs.DisponibilitaDTO;
import it.polito.pedibus.backend.mongoClasses.Disponibilita;
import it.polito.pedibus.backend.services.DisponibilitaService;
import it.polito.pedibus.backend.utilities.ControllerLogger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import it.polito.pedibus.backend.utilities.ResponseEntityFactory;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.util.LinkedHashMap;

/**
 * Questo controller mappa tutti gli endpoint che gli accompagnatori possono usare per creare, modificare e
 * cancellare le proprie disponibilità alle corse del pedibus
 **/
@RestController
@RequestMapping("/availability")
public class DisponibilitaController {

    private static String loggerTopic = "[DISPONIBILITA]";
    private DisponibilitaService disponibilitaService;

    @Autowired
    public DisponibilitaController(DisponibilitaService disponibilitaService) {
        this.disponibilitaService = disponibilitaService;
    }

    /**
     * Contattare questo endpoint per aggiungere una nuova disponibilità.
     * I parametri richiesti sono il giorno della corsa e la direzione, in formato Integer
     **/
    @RequestMapping(method = RequestMethod.POST, value = "/accompagnatore/add", produces = "application/json")
    public ResponseEntity aggiungiDisponibilita(
            @Valid DisponibilitaDTO disponibilitaDTO,
            BindingResult result) {
        String requestString = "Richiesta nuova disponibilità";
        try {
            // Verifico che i dati siano validi
            if (result.hasErrors()) {
                throw new Exception("Dati della richiesta non validi");
            }

            // Creo una nuova disponibilità, ottenendo il suo ID all'interno della collezione
            Disponibilita disponibilita = disponibilitaService.insertNuovaDisponibilita(
                    disponibilitaDTO);

            ControllerLogger.printPositiveResponse(loggerTopic, requestString);

            // Rispondo al client
            return ResponseEntityFactory.createResponseEntity(HttpStatus.OK, disponibilita, "disponibilita");
        } catch (Exception e) {
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, e.getMessage());
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    e.getMessage(), "errore");
        }
    }

    /**
     * Questo endpoint viene utilizzato per eliminare una dichiarazione di disponibilità
     **/
    @RequestMapping(method = RequestMethod.DELETE, value = "/accompagnatore/delete/{disp_id}", produces = "application/json")
    public ResponseEntity eliminaDisponibilita(
            @PathVariable("disp_id") @NotNull String disponibilitaID) {
        String requestString = "Richiesta eliminazione disponibilità";
        try {
            disponibilitaService.deleteDisponibilita(disponibilitaID);
            ControllerLogger.printPositiveResponse(loggerTopic, requestString);
            return ResponseEntityFactory.createResponseEntity(HttpStatus.OK, null, null);
        } catch (Exception e) {
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, e.getMessage());
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    e.getMessage(),
                    "errore");
        }
    }

    /**
     * Questo metodo può essere invocato solo da uno user che sia un ACCOMPAGNATORE, in quanto potrà vedere,
     * ed eventualmente manipolare, le disponibilità già fornite
     **/
    @RequestMapping(method = RequestMethod.GET, value = "accompagnatore/summary", produces = "application/json")
    public ResponseEntity getDisponibilitaByUser() {
        try {
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(disponibilitaService.getDisponibilitaByUser());
        } catch (Exception e) {
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    e.getMessage(), "errore");
        }
    }

    /**
     * Questo metodo ritorna le informazioni sulle disponibilità di una certa settimana
     **/
    @RequestMapping(method = RequestMethod.GET, value = "accompagnatore/week/{data}",
            produces = "application/json")
    public Object getDisponibilitaWeek(
            @PathVariable("data")
            @NotNull
                    Long data
    ) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            LinkedHashMap<String, Object> map =
                    disponibilitaService.getDisponibilitaPerWeek(data);
            return mapper.writeValueAsString(map);
        } catch (Exception e) {
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    e.getMessage(),
                    "errore");
        }
    }

    /**
     * Questo metodo viene utilizzato dall'admin di una linea per visualizzare gli accompagnatori
     * che si sono resi disponibili per una certa data e per una certa direzione.
     * Il metodo ritorna un oggetto JSON contenente le informazioni degli user che soddisfano questa
     * condizione
     **/
    @RequestMapping(method = RequestMethod.GET,
            value = "adminlinea/summary/{date}/{direzione}",
            produces = "application/json")
    public ResponseEntity getUtentiDisponibiliByDataAndDirezione(
            @PathVariable("date") @NotNull String date,
            @PathVariable("direzione") @NotNull Integer direzione) {
        try {
            DisponibilitaDTO disponibilitaDTO =
                    new DisponibilitaDTO(date, direzione);
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(disponibilitaService.getDisponibilitaByDataAndDirezione(disponibilitaDTO));
        } catch (Exception e) {
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    e.getMessage(), "errore");
        }
    }
}
