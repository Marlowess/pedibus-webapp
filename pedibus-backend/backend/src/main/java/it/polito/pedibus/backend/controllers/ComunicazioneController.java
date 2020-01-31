package it.polito.pedibus.backend.controllers;

import it.polito.pedibus.backend.mongoClasses.Comunicazione;
import it.polito.pedibus.backend.services.ComunicazioneService;
import it.polito.pedibus.backend.utilities.ResponseEntityFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.HashMap;
import java.util.List;

@RestController
@RequestMapping("/notifications")
public class ComunicazioneController {

    private final ComunicazioneService comunicazioneService;

    public ComunicazioneController(ComunicazioneService comunicazioneService) {
        this.comunicazioneService = comunicazioneService;
    }

    /**
     * Endpoint per ottenere il numero di comunicazioni ancora da leggere
     * **/
    @RequestMapping(method = RequestMethod.GET, value = "/numunread",produces = "application/json")
    public ResponseEntity getUnreadComunicationsNum(@AuthenticationPrincipal Principal principal) {
        try {
            HashMap<String, Integer> map = comunicazioneService.getNumeroComunicazioniNonLette(principal.getName());

            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(map);

        } catch (Exception e) {
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST, e.getMessage(), "errore");
        }
    }

    /**
     * Endpoint per ottenere tutte le comunicazioni associate ad uno specifico user
     * **/
    @RequestMapping(method = RequestMethod.GET, value = "/getall",produces = "application/json")
    public ResponseEntity getAllNotificationByUser(@AuthenticationPrincipal Principal principal) {
        try {
            List<Comunicazione> notifications = comunicazioneService.getAllComunicazioniByUser(principal.getName());

            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(notifications);

        } catch (Exception e) {
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST, e.getMessage(), "errore");
        }
    }

    /**
     * Permette di segnare tutte le comunicazioni come lette
     * **/
    @RequestMapping(method = RequestMethod.PUT, value = "/segnalette", produces = "application/json")
    public ResponseEntity segnaTutteLette(@AuthenticationPrincipal Principal principal){
        try {
            comunicazioneService.segnaTutteLette(principal.getName());
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(null);
        } catch (Exception e) {
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST, e.getMessage(), "errore");
        }
    }

    /**
     * Permette di segnare una comunicazione come letta
     * **/
    @RequestMapping(method = RequestMethod.PUT, value = "/segnaletta", produces = "application/json")
    public ResponseEntity segnaComunicazioneLetta(
            @RequestParam("comunicazioneId") String comunicazioneId,
            @RequestParam("azione") boolean azione,
            @AuthenticationPrincipal Principal principal){
        try {
            comunicazioneService.segnaComunicazione(principal.getName(), comunicazioneId, azione);
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(null);
        } catch (Exception e) {
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST, e.getMessage(), "errore");
        }
    }


    /**
     * Permette di cancellare tutte le comunicazioni. Di fatto questo comporta che l'utente non visualizzerà
     * più tali notifiche, le quali rimarranno comunque sul DB come dato storico
     * **/
    @RequestMapping(method = RequestMethod.PUT, value = "/cancellatutte", produces = "application/json")
    public ResponseEntity segnaTutteCancellate(
            @AuthenticationPrincipal Principal principal){
        try {
            comunicazioneService.deleteAllComunicazioni(principal.getName());
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(null);
        } catch (Exception e) {
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST, e.getMessage(), "errore");
        }
    }

    // deleteComunicazione(String userId, String comunicazioneId)
    /**
     * Permette di cancellare una comunicazione dato l'ID. Essa rimane comunque nel DB come dato storico
     * **/
    @RequestMapping(method = RequestMethod.PUT, value = "/cancellacomunicazione", produces = "application/json")
    public ResponseEntity segnaComunicazioneCancellata(
            @RequestParam("comunicazioneId") String comunicazioneId,
            @AuthenticationPrincipal Principal principal){
        try {
            comunicazioneService.deleteComunicazione(principal.getName(), comunicazioneId);
            return ResponseEntity
                    .status(HttpStatus.OK)
                    .body(null);
        } catch (Exception e) {
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST, e.getMessage(), "errore");
        }
    }
}
