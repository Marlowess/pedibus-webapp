package it.polito.pedibus.backend.controllers;

import it.polito.pedibus.backend.DTOs.TurnoDTO;
import it.polito.pedibus.backend.DTOs.TurnoResponseDTO;
import it.polito.pedibus.backend.services.TurnoService;
import it.polito.pedibus.backend.utilities.ControllerLogger;
import it.polito.pedibus.backend.utilities.ResponseEntityFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.NotNull;
import java.security.Principal;
import java.util.LinkedHashMap;

/**
 * Questo controller permette l'aggiunta di nuovi turni da parte degli amministratori delle linee
 * **/
@RestController
@RequestMapping("/turni")
public class TurnoController {

    private TurnoService turnoService;
    private static String loggerTopic = "[TURNI]";

    public TurnoController(TurnoService turnoService){
        this.turnoService = turnoService;
    }

    /**
     * Metodo per la creazione di un nuovo turno
     * **/
    @RequestMapping(method = RequestMethod.POST, value = "/new", produces = "application/json")
    public ResponseEntity nuovoTurno(@Valid TurnoDTO turnoDTO,
                                     BindingResult bindingResult){
        String requestString = "Richiesta nuovo turno";
        try{
            if(bindingResult.hasErrors())
                throw new Exception("Dati non validi");

            TurnoResponseDTO turnoResponseDTO = turnoService.assegnaTurno(turnoDTO);

            ControllerLogger.printPositiveResponse(loggerTopic, requestString);

            // Rispondo al client
            return ResponseEntityFactory.createResponseEntity(HttpStatus.OK, turnoResponseDTO, "turno");
        }
        catch(Exception e){
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, e.getMessage());
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    e.getMessage(), "errore");
        }
    }

    /** Metodo invocato per eliminare un turno già assegnato ad un accompagnatore.
     * Quando un turno viene eliminato, una notifica arriva all'accompagnatore, il quale può decidere di fornire
     * nuovamente la sua disponibilità per effettuare un turno
     * **/
    @RequestMapping(method = RequestMethod.DELETE, value = "/delete/{turnoID}", produces = "application/json")
    public ResponseEntity eliminaTurno(@PathVariable("turnoID") @NotNull String turnoID){
        String requestString = "Richiesta eliminazione turno";
        try{
            this.turnoService.eliminaTurno(turnoID);

            ControllerLogger.printPositiveResponse(loggerTopic, requestString);
            return ResponseEntityFactory.createResponseEntity(
                    HttpStatus.OK, null,
                    "turno eliminato");
        }
        catch(Exception e){
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, e.getMessage());
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    e.getMessage(), "impossibile eliminare il turno");
        }
    }

    /**
     * Metodo utilizzato per la modifica di un turno già assegnato ad un accompagnatore
     * **/
    @RequestMapping(method = RequestMethod.PUT, value = "/edit", produces = "application/json")
    public ResponseEntity modificaTurno(@Valid TurnoDTO turnoDTO){
        String requestString = "Richiesta modifica turno";
        try{
            this.turnoService.modificaTurno(turnoDTO);

            ControllerLogger.printPositiveResponse(loggerTopic, requestString);
            return ResponseEntityFactory.createResponseEntity(
                    HttpStatus.OK, null,
                    "turno modificato");
        }
        catch(Exception e){
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, e.getMessage());
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    e.getMessage(), "impossibile modificare il turno");
        }
    }

    /**
     * Endpoint per ricevere un resoconto dei turni assegnati per una certa linea e per una certa data
     * **/
    @RequestMapping(method = RequestMethod.GET, value = "/summary/{nome_linea}/{data}", produces = "application/json")
    public ResponseEntity getSummaryTurni(@PathVariable(value = "nome_linea") String nome_linea,
                                          @PathVariable(value = "data") Long data,
                                          @AuthenticationPrincipal Principal principal){
        try{
            LinkedHashMap<String, Object> json = turnoService.getRiepilogoTurniByDataAndLinea(
                    principal.getName(),
                    nome_linea,
                    data
            );
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(json);
        }
        catch(Exception e){
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    e.getMessage(), "errore");
        }
    }

    /**
     * Questo metodo permette ad un accompagnatore di confermare la propria assegnazione per un turno.
     * Il client dovrà inviare l'identificativo del turno ed un booleano per confermare oppure rifiutare
     * il turno. In caso di rifiuto il turno viene eliminato dal sistema
     * **/
    @RequestMapping(method = RequestMethod.PUT, value="accompagnatore/confermaturno", produces = "application/json")
    public ResponseEntity confermaTurno(@RequestParam("turnoId") String turnoId,
                                        @RequestParam("conferma") Boolean conferma){
        String requestString = "Richiesta conferma turno";
        try{
            String res = turnoService.confermaTurno(turnoId, conferma);

            ControllerLogger.printPositiveResponse(loggerTopic, requestString);
            return ResponseEntityFactory.createResponseEntity(
                    HttpStatus.OK, null,
                    res);
        }
        catch(Exception e){
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, e.getMessage());
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    e.getMessage(), "errore");
        }
    }
}
