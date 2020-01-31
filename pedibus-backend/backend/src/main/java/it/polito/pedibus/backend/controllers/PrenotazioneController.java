package it.polito.pedibus.backend.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import it.polito.pedibus.backend.DTOs.CorsaDTO;
import it.polito.pedibus.backend.DTOs.PrenotazioneDTO;
import it.polito.pedibus.backend.DTOs.PresenzaDTO;
import it.polito.pedibus.backend.mongoClasses.Prenotazione;
import it.polito.pedibus.backend.services.PrenotazioneService;
import it.polito.pedibus.backend.utilities.ControllerLogger;
import it.polito.pedibus.backend.utilities.ResponseEntityFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.validation.Valid;
import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Null;
import java.security.Principal;
import java.util.Date;
import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/reservations")
public class PrenotazioneController {

    private final PrenotazioneService prenotazioneService;
    private static String loggerTopic = "[PRENOTAZIONI]";

    @Autowired
    public PrenotazioneController(PrenotazioneService prenotazioneService) {
        this.prenotazioneService = prenotazioneService;
    }

    /**
     * Endpoint utilizzato da un accompagnatore per ricevere l'elenco dei bambini da gestire per una certa
     * corsa. Il JSON ritornato conterrà due liste: una per le fermate di andata e l'altra per le fermate di ritorno.
     * Esse possono essere null se l'accompagnatore non ha un turno assegnato per quella corsa in quella data direzione
     * **/
    @RequestMapping(method = RequestMethod.GET, value = "/presenze/{nome_linea}/{data}",produces = "application/json")
    public ResponseEntity getPasseggeriByDataAndLinea(
            @PathVariable("nome_linea") @NotNull @NotEmpty String nomeLinea,
            @PathVariable("data") @NotNull String data
    ) {
        try {
            Map result = prenotazioneService.getUsersByReservationDateAndLine(nomeLinea,
                    new Date(Long.parseLong(data)));
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(result);

        } catch (Exception e) {
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST, e.getMessage(), "errore");
        }
    }

    /**
     * Endpoint invocato dagli accompagnatori che vogliono segnare un bambino come preso in carico oppure
     * lasciato alla fermata di destinazione
     * **/
    @RequestMapping(method = RequestMethod.POST, value = "/presenze/{nome_linea}/{data}",produces = "application/json")
    public ResponseEntity segnalazionePresenza (
            @PathVariable("nome_linea") @NotNull @NotEmpty String nomeLinea,
            @PathVariable("data")  @NotNull long data,
            @Valid PresenzaDTO presenzaDTO,
            @AuthenticationPrincipal Principal principal,
            BindingResult result) {
        String requestString = "Segnalazione presenza";
        try {
            if (result.hasErrors()) // verifica dei vincoli dei dati passati
                throw new Exception("Dati forniti non validi");

            prenotazioneService.segnalaPresenzaBambino(
                    presenzaDTO.getPrenotazioneId(),
                    presenzaDTO.getBambino(),
                    presenzaDTO.getSalitaDiscesa(),
                    presenzaDTO.isAzione(),
                    nomeLinea,
                    new Date(data),
                    principal.getName()
            );
            ControllerLogger.printPositiveResponse(loggerTopic, requestString);

            return ResponseEntityFactory.createResponseEntity(HttpStatus.OK,
                    "Bambino segnato con successo",
                    "messaggio");

        } catch (Exception exp) {
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, exp.getMessage());
            return ResponseEntityFactory
                    .createResponseEntity(HttpStatus.BAD_REQUEST, exp.getMessage(), "errore");
        }
    }

    /**
     * Permette di marcare una corsa come completata: ciò significa che tutti i bambini segnati come saliti
     * dall'accompagnatore sono stati segnati come scesi e i relativi genitori sono stati avvertiti tramite
     * comunicazione interna all'applicazione
     * **/
    @RequestMapping(method = RequestMethod.PUT, value = "/presenze/consolidacorsa",produces = "application/json")
    public ResponseEntity segnalazioneCorsaCompletata(@Valid CorsaDTO corsaDTO,
                                                @AuthenticationPrincipal Principal principal){
        String requestString = "Richiesta completamento corsa";
        try{
            prenotazioneService.setCorsaCompletata(corsaDTO, principal.getName());
            ControllerLogger.printPositiveResponse(loggerTopic, requestString);

            return createResponseEntity(HttpStatus.OK, null);
        }
        catch(Exception e){
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, e.getMessage());
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    e.getMessage(),
                    "errore");
        }
    }

    /**
     * Permette ad un genitore di prenotare il figlio per una delle corse del pedibus
     * **/
    @RequestMapping(method = RequestMethod.POST, value = "{nome_linea}/{data}",produces = "application/json")
    public ResponseEntity aggiungiNuovaPrenotazione (
            @PathVariable("nome_linea") @NotNull @NotEmpty String nomeLinea,
            @PathVariable("data")  @NotNull long data,
            @AuthenticationPrincipal Principal principal,
            @Valid PrenotazioneDTO prenotazione,
            BindingResult result) {
        String requestString = "Nuova prenotazione";
        try {

            if (result.hasErrors()) // verifica dei vincoli dei dati passati
                throw new Exception("Dati forniti nel body della richiesta http non validi");

            prenotazione.setDate(data);
            prenotazione.setUserId(principal.getName());
            Prenotazione prenotazione1 = prenotazioneService
                    .addReservation(prenotazione, nomeLinea, true, principal.getName());

            ControllerLogger.printPositiveResponse(loggerTopic, requestString);
            return ResponseEntityFactory.createResponseEntity(HttpStatus.OK, prenotazione1, "prenotazione");

        } catch (Exception exp) {
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, exp.getMessage());
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    exp.getMessage(),
                    "errore");
        }
    }

    /**
     * Endpoint utilizzato da un accompagnatore per prendere in carico un bambino che non era stato in precedenza
     * prenotato dal genitore. Questa azione corrisponde ad una prenotazione vera e propria, anche se sul DB
     * rimarrà traccia del fatto che questo bambino è stato prenotato al volo da un accompagnatore.
     * **/
    @RequestMapping(method = RequestMethod.POST, value = "/accompagnatore/{nome_linea}/{data}",
            produces = "application/json")
    public ResponseEntity aggiungiNuovaPrenotazioneAccompagnatore (
            @PathVariable("nome_linea") @NotNull @NotEmpty String nomeLinea,
            @PathVariable("data")  @NotNull long data,
            @Valid PrenotazioneDTO prenotazione,
            @AuthenticationPrincipal Principal principal,
            BindingResult result) {
        String requestString = "Nuova prenotazione da accompagnatore";
        try {
            if (result.hasErrors()) // verifica dei vincoli dei dati passati
                throw new Exception("Dati forniti nel body della richiesta http non validi");
            prenotazione.setDate(data);
            //prenotazione.setUserId(principal.getName());

            // TODO: passare l'identità della persona loggata per effettuare i controlli
            Prenotazione prenotazione1 = prenotazioneService
                    .addReservation(prenotazione, nomeLinea, false, principal.getName());

            ControllerLogger.printPositiveResponse(loggerTopic, requestString);
            return ResponseEntityFactory.createResponseEntity(HttpStatus.OK, prenotazione1, "prenotazione");

        } catch (Exception exp) {
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, exp.getMessage());
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    exp.getMessage(),
                    "errore");
        }
    }

    /**
     * Endpoint utilizzato per modificare una prenotazione già presente nel DB.
     * Non è più possibile apporare modifiche se la corsa avverrà in un lasso di tempo inferiore ai cinque
     * minuti prima dell'inizio della stessa
     * **/
    @RequestMapping(method = RequestMethod.PUT, value = "/{nome_linea}/{reservation_id}",
            produces = "application/json")
    public ResponseEntity modificaPrenotazioneByPrenotazioneId (
            @PathVariable("nome_linea") @NotNull @NotEmpty String nomeLinea,
            @PathVariable("reservation_id") @NotNull String prenotazioneId,
            @AuthenticationPrincipal Principal principal,
            @Valid PrenotazioneDTO prenotazione,
            BindingResult result
    ) {
        String requestString = "Richiesta modifica prenotazione";
        try {
            if (result.hasErrors()) // verifica dei vincoli dei dati passati
                throw new Exception("Dati forniti nel body della richiesta http non validi");

            prenotazione.setReservationId(prenotazioneId);
            prenotazione.setUserId(principal.getName());
            prenotazioneService.updateReservation(prenotazione, nomeLinea);

            ControllerLogger.printPositiveResponse(loggerTopic, requestString);
            return createResponseEntity(HttpStatus.OK, null);

        } catch (Exception exp) {
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, exp.getMessage());
            return createResponseEntity(HttpStatus.BAD_REQUEST, exp.getMessage());
        }
    }

    /**
     * Permette l'eliminazione di una prenotazione. Può essere effettuato solo dal genitore del bambino associato
     * alla prenotazione
     * **/
    @RequestMapping(method = RequestMethod.DELETE, value = "/{reservation_id}",
            produces = "application/json")
    public ResponseEntity cancellaPrenotazioneByReservationId(
            @PathVariable("reservation_id") @NotNull String prenotazioneId,
            @AuthenticationPrincipal Principal principal
    ) {
        String requestString = "Richiesta cancellazione prenotazione";
        try {
            prenotazioneService.deleteReservation(prenotazioneId, principal.getName());

            ControllerLogger.printPositiveResponse(loggerTopic, requestString);
            return createResponseEntity(HttpStatus.OK, null);

        } catch (Exception exp) {
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, exp.getMessage());
            return createResponseEntity(HttpStatus.BAD_REQUEST, exp.getMessage());
        }
    }

    /**
     * Restituisce una prenotazione dato un ID di prenotazione
     * **/
    @RequestMapping(method = RequestMethod.GET, value = "/{nome_linea}/{data}/{reservation_id}",
            produces = "application/json")
    public Object getPrenotazioneByLineaDataReservationId(
            @PathVariable("nome_linea") @NotNull @NotEmpty String nomeLinea,
            @PathVariable("data")
            @NotNull long data,
            @PathVariable("reservation_id") @NotNull String prenotazioneId
    ){
        try{
            ObjectMapper mapper = new ObjectMapper();
            LinkedHashMap<String, Object> map = prenotazioneService.getReservation(nomeLinea, data, prenotazioneId);
            return mapper.writeValueAsString(map);
        }
        catch(Exception e){
            return createResponseEntity(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Endpoint utilizzato per ricevere un resoconto settimanale delle prenotazioni a partire dalla data indicata
     * come parametro
     * **/
    @RequestMapping(method = RequestMethod.GET, value = "/week/{bambino}/{data}",
            produces = "application/json")
    public Object getPrenotazioniByLineaBambinoDataWeek(
           @PathVariable("bambino") @NotNull String bambino,
            @PathVariable("data")
            @NotNull Long data,
            @AuthenticationPrincipal Principal principal
    ){
        try{
            ObjectMapper mapper = new ObjectMapper();
            LinkedHashMap<String, Object> map =
                    prenotazioneService.getReservationByLineaBambinoWeek(principal.getName(),
                            data,
                            bambino);
            return mapper.writeValueAsString(map);
        }
        catch(Exception e){
            return createResponseEntity(HttpStatus.BAD_REQUEST, e.getMessage());
        }
    }

    /**
     * Metodo per la creazione di una risposta per ciascuna delle chiamate agli endpoint
     * **/
    private ResponseEntity createResponseEntity(HttpStatus httpStatus, @Null String message) {
        ObjectMapper mapper = new ObjectMapper();
        LinkedHashMap<String, Object> result = new LinkedHashMap<>();
        result.put("messaggio", message);

//        Integer code = new Integer(httpStatus.toString().split(" ")[0]);
//        String message = httpStatus.toString().split(" ")[1];
//
//        result.put("Codice", code);
//        result.put("Messaggio", message);
//
//        if(prenotazioneId != null)
//            result.put("prenotazione_id", prenotazioneId);

        try {
            return ResponseEntity
                    .status(httpStatus)
                    .body(mapper.writeValueAsString(result));
        } catch (JsonProcessingException e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(HttpStatus.INTERNAL_SERVER_ERROR.toString());
        }
    }
}