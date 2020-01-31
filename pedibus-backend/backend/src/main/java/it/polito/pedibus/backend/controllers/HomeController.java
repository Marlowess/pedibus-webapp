package it.polito.pedibus.backend.controllers;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import it.polito.pedibus.backend.DTOs.ProfileDTO;
import it.polito.pedibus.backend.DTOs.UserDTO;
import it.polito.pedibus.backend.components.JwtTokenProvider;
import it.polito.pedibus.backend.domain.MailObject;
import it.polito.pedibus.backend.mongoClasses.User;
import it.polito.pedibus.backend.services.EmailService;
import it.polito.pedibus.backend.services.UserService;
import it.polito.pedibus.backend.utilities.ControllerLogger;
import it.polito.pedibus.backend.utilities.ResponseEntityFactory;
import it.polito.pedibus.backend.validators.EmailExistsException;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import javax.validation.constraints.Email;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Null;
import javax.validation.constraints.Size;
import java.security.Principal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

/** Questo controller accetta tutte le richieste da parte dello user **/
@Controller
public class HomeController {

    final private UserService userService;
    final private EmailService emailService;
    final private AuthenticationManager authenticationManager;
    final private JwtTokenProvider jwtTokenProvider;
    private static Logger logger = Logger.getAnonymousLogger();
    private static String loggerTopic = "[USER]";

    public HomeController(UserService userService, EmailService emailService,
                          AuthenticationManager authenticationManager,
                          JwtTokenProvider jwtTokenProvider) {
        this.userService = userService;
        this.emailService = emailService;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Bean
    void setupLogger() {
        logger = Logger.getLogger("Controller - Logger");
        logger.setLevel(Level.ALL);
    }

    /**
     * L'utente fornisce la propria email e la password. Se il sistema lo autentica con successo
     * viene ritornato un token JWT della durata di un'ora. Il token deve essere inviato nello header
     * Authentication ad ogni interazione successiva con il server
     * **/
    @PostMapping(value = "/login", produces = "application/json")
    @ResponseBody
    public Object doLogin(
            @RequestParam("email") @NotNull @Email String email,
            @RequestParam("password") @NotNull @Size(min=8, max=10) String password) {
        User user;
        String requestString = "Nuovo login";
        try {

            ObjectMapper mapper = new ObjectMapper();

            // verifico se l'utente esiste ed ha già confermato la registrazione
            user = userService.findByEmailAndPassword(email, password);

            // genero un token JWT da mandare allo user che si sta loggando
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, password));
            String token = jwtTokenProvider.createToken(email, user.getId(), user.getRuoli());

            ControllerLogger.printPositiveResponse(loggerTopic, requestString);

            LinkedHashMap<String, String> map = new LinkedHashMap<>();
            map.put("token", token);
            map.put("nome_visualizzato", user.getNome() + " " + user.getCognome());

            // richiesta andata a buon fine, ritorno una risposta con codice 200
            //return ResponseEntityFactory.createResponseEntity(HttpStatus.OK, token, "token");
            return mapper.writeValueAsString(map);
        } catch (Exception exception) {
            // Logger here...
            // Si è generato un errore in fase di login, ritorno un codice 401
            logger.info("Errore su login: " + exception.getMessage());
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, exception.getMessage());

            return ResponseEntityFactory.createResponseEntity(HttpStatus.UNAUTHORIZED,
                    null, null);
        }
    }

    /**
     * Endpoint utilizzato per effettuare una nuova registrazione al sistema.
     * L'utente deve fornire le informazioni personali ed una password. Deve essere anche fornito
     * un parametro che indica il ruolo dello user che si sta provando a registrare.
     *
     * Ritorna un codice 200 ed invia una mail in caso di richiesta valida, altrimenti restituisce
     * un errore con codice 400
     * **/
    @PostMapping(value = "/register", produces = "application/json")
    @ResponseBody
    public ResponseEntity registerUser(@RequestParam("ruolo") @NotNull Integer ruolo,
                                       @RequestParam("email") @NotNull String email){
        try {
            logger.info("Nuova registrazione da " + email);

            // inserisco lo user nel DB in stato di ATTESA_VERIFICA e genero un randomUUID
            // UUID randomUUID = userService.registrazione(userDTO, ruolo);
            UUID randomUUID = userService.inserimentoNuovoUser(email, ruolo);

            // invio il randomUUID via mail allo user che sta provando a registrarsi
            MailObject mailObject = emailService.createMailObject(randomUUID, email);
            emailService.sendSimpleMessage(mailObject.getTo(),
                    mailObject.getSubject(),
                    mailObject.getText());

            logger.info("Registrazione riuscita, email inviata");
            return ResponseEntityFactory.createResponseEntity(HttpStatus.OK, null, null);

        } catch (Exception exp) {
            logger.info("Registrazione non riuscita");
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    exp.getMessage(),
                    null);
        } catch (EmailExistsException e) {
            logger.info("Registrazione non riuscita --- email duplicata");
            return ResponseEntityFactory.createResponseEntity(HttpStatus.BAD_REQUEST,
                    "Registrazione non riuscita: indirizzo email già presente",
                    null);
        }
    }

    /**
     * Endpoint utilizzato per confermare la registrazione dopo aver ricevuto il randomUUID via mail.
     * Verifica che il random sia valido ed abilita lo user associato, che deve essere in fase di
     * ATTESA VERIFICA
     * **/
    @PutMapping(value = "/confirm/{randomUUID}", produces = "application/json")
    public ResponseEntity confirmRandomUUID(@PathVariable("randomUUID") @NonNull UUID randomUUID,
                                            @Valid UserDTO userDTO){

        // verifico che il randomUUID arrivato esista, sia valido e corrisponda ad uno user in attesa di verifica
        try{
            userService.completaProfilo(randomUUID, userDTO);
            return createResponseEntity(HttpStatus.OK, null);

        }
        catch(Exception e){
            return createResponseEntity(HttpStatus.BAD_REQUEST, null);
        }
    }

    /**
     * Endpoint per cambiare la password dello user associato all'indirizzo passato.
     * Il metodo verifica che l'indirizzo email esista nel DB e, in caso positivo, invia
     * una mail ad esso con un link per resettare la password
     * **/
    @PostMapping(value = "/recover", produces = "application/json")
    public ResponseEntity recover(@Email @NotNull @RequestParam("email") String email) {
        String requestString = "Richiesta reset password";
        try {

            // se esiste un utente abilitato con la mail passata gli associo un token di cambio password
            UUID randomUUID = userService.recuperaPassword(email);

            // richiesta andata a buon fine
            ControllerLogger.printPositiveResponse(loggerTopic, requestString);

            // invio via mail allo user il Random
            MailObject mailObject = emailService.createMailObjectToRecoverPassword(randomUUID, email);

            emailService.sendSimpleMessage(mailObject.getTo(),
                    mailObject.getSubject(),
                    mailObject.getText());
        } catch (Exception e) {
            // Richiesta non andata a buon fine
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, e.getMessage());
        }

        return createResponseEntity(HttpStatus.OK, null);
    }

    /**
     * Endpoint contattato passando il randomUUID associato alla richiesta di nuova password,
     * la nuova password e la password di conferma, che deve essere identica all'altra
     * e rispettare i criteri di robustezza
     * **/
    @PostMapping(value = "/recover/{randomUUID}", produces = "application/json")
    public ResponseEntity verificaCodiceRandomRecover(@PathVariable("randomUUID") @NonNull UUID randomUUID,
                                                      @NotNull @RequestParam("password") String password,
                                                      @NotNull @RequestParam("verificaPassword")
                                                                  String confermaPassword) {
        try {
            // verifico che le due password corrispondano e che rispettino i parametri di sicurezza
            if(!password.equals(confermaPassword))
                return createResponseEntity(HttpStatus.NOT_FOUND, null);

            if(!(password.matches(".*\\d+.*") &&
                    password.matches(".*[a-z]+.*") &&
                    password.matches(".*[A-Z]+.*")))
                return createResponseEntity(HttpStatus.NOT_FOUND, null);

            // aggiorno password dell'utente
            userService.aggiornaPassword(randomUUID, password);

            return createResponseEntity(HttpStatus.OK, null);
        } catch (Exception err) {
            return createResponseEntity(HttpStatus.NOT_FOUND, null);
        }
    }

    /**
     * Endpoint raggiunto dopo aver cliccato sul link inviato via mail allo scopo di resettare
     * la password. Restituisce una pagina HTML dove inserire la nuova password
     * **/
    @GetMapping(value = "/recover/{randomUUID}")
    public String getTemplateRecoverPassword(@PathVariable("randomUUID") @NotNull UUID random, Model model) {
        model.addAttribute("random", "/recover/"+ random);
        return "recover";
    }

    /**
     * Endpoint raggiungibile solo dagli admin di linee e dall'admin master, permette di visualizzare
     * l'elenco e le informazioni di tutti gli utenti del sistema
     * **/
    @GetMapping(value = "/users", produces = "application/json")
    public ResponseEntity getUsers()
            throws JsonProcessingException {
        List<User> userList = userService.getAllUsers();
        ObjectMapper mapper = new ObjectMapper();

        return ResponseEntity.status(HttpStatus.OK)
                        .body(mapper.writeValueAsString(userList));
    }

    /**
     * Endpoint raggiungibile solo dagli admin di linee e dall'admin master, permette di concedere
     * o revocare i diritti amministrativi di una linea ad un determinato utente.
     * **/
    @PutMapping(value = "/users/{userId}", produces = "application/json")
    public ResponseEntity makeUserAdminOfLine(
            @PathVariable("userId") @NotNull String userId,
            @RequestParam("nomeLinea") @NotNull String lineName,
            @RequestParam("action") @NotNull int action,
            @AuthenticationPrincipal Principal principal) {
        try {
            // tentativo di modifica della gestione della linea. Se la funzione ritorna è andata a buon fine
            userService.aggiornaGestioneLinea(lineName, principal.getName(), userId, action);
        } catch (Exception exception) {
            return createResponseEntity(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
        return createResponseEntity(HttpStatus.OK, null);
    }

    @GetMapping(value = "/users/summary", produces = "application/json")
    public ResponseEntity getAdminsInfos(
            @AuthenticationPrincipal Principal principal) {
        try {
            LinkedHashMap<String, Object> map = userService.getInfoAccompagnatoriEAdmin(principal.getName());
            ObjectMapper mapper = new ObjectMapper();

            return ResponseEntity.status(HttpStatus.OK)
                    .body(mapper.writeValueAsString(map));
        } catch (Exception exception) {
            return createResponseEntity(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    /**
     * Endpoint che permette di aggiungere un bambino all'elenco dei bambini di questo genitore
     * (un controllo sull'effettivo ruolo di genitore viene eseguito nel service)
     * **/
    @PutMapping(value = "/addbambini", produces = "application/json")
    public ResponseEntity aggiungiBambino(
            @RequestParam("bambini_list") @NotNull List<String> bambini,
            @AuthenticationPrincipal Principal principal
    ){
        String requestString = "Richiesta aggiunta bambini a profilo";
        try {
            userService.aggiungiBambino(principal.getName(), bambini);
            ControllerLogger.printPositiveResponse(loggerTopic, requestString);
        } catch (Exception exception) {
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, exception.getMessage());
            return createResponseEntity(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
        return createResponseEntity(HttpStatus.OK, null);
    }

    /** Questo endpoint restituisce le informazioni di default di uno user
     *  {linea_default, fermata_salita_default, fermata_discesa_default, bambini}
     * **/
    @GetMapping(value = "/profile", produces = "application/json")
    public ResponseEntity getProfileInfosChildren(
            @AuthenticationPrincipal Principal principal
    ){
        ObjectMapper mapper = new ObjectMapper();
        try {
            LinkedHashMap<String, Object> map =
                    userService.getProfileInfosBambini(principal.getName());

            return ResponseEntity.status(HttpStatus.OK)
                    .body(mapper.writeValueAsString(map));

        } catch (Exception exception) {
            return createResponseEntity(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    /**
     * Tramite questo metodo è possibile aggiornare le informazioni di profilo dello user, che includono
     * la linea e le relative fermate di default insieme all'elenco dei bambini del genitore
     * **/
    @PostMapping(value = "/profile/update", produces = "application/json")
    public ResponseEntity updateProfile(@AuthenticationPrincipal Principal principal,
                                        @Valid ProfileDTO profileDTO){
        ObjectMapper mapper = new ObjectMapper();
        String requestString = "Richiesto aggiornamento profilo";
        try {

            // Tento di aggiornare il profilo del genitore
            userService.updateProfile(principal.getName(), profileDTO);

            // Andata a buon fine
            ControllerLogger.printPositiveResponse(loggerTopic, requestString);

            // Se tutto va a buon fine restituisco il JSON con tutte le informazioni di default
            LinkedHashMap<String, Object> map =
                    userService.getProfileInfosBambini(principal.getName());

            return ResponseEntity.status(HttpStatus.OK)
                    .body(mapper.writeValueAsString(map));

        } catch (Exception exception) {
            ControllerLogger.printNegativeResponse(loggerTopic, requestString, exception.getMessage());
            return createResponseEntity(HttpStatus.BAD_REQUEST, exception.getMessage());
        }
    }

    /**
     * Ritorna il ruolo dell'utente specificato dalla sua email.
     * Serve alla segreteria per capire se esiste già un utente con la mail specificata
     * **/
    @GetMapping(value = "user/{email}", produces = "application/json")
    public ResponseEntity getUserInfoByEmail(
            @PathVariable("email") String email,
            @AuthenticationPrincipal Principal principal
    ){
        ObjectMapper mapper = new ObjectMapper();
        try {
            LinkedHashMap<String, Object> map = new LinkedHashMap<>();
            User user = userService.verificaEsistenzaUserByEmail(email);
            map.put("ruolo", user.getRuoli().get(0));
            return ResponseEntity.status(HttpStatus.OK)
                    .body(mapper.writeValueAsString(map));

        } catch (Exception exception) {
            return createResponseEntity(HttpStatus.BAD_REQUEST, null);
        }
    }

    /**
     * Metodo per la creazione di una risposta per ciascuna delle chiamate agli endpoint
     * **/
    private ResponseEntity createResponseEntity(HttpStatus httpStatus, @Null String message) {
        ObjectMapper mapper = new ObjectMapper();
        LinkedHashMap<String, Object> result = new LinkedHashMap<>();

        if(message != null)
            result.put("messaggio", message);

        try {
            return ResponseEntity
                    .status(httpStatus)
                    //.headers(headers)
                    .body(mapper.writeValueAsString(result));
        } catch (JsonProcessingException e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(HttpStatus.INTERNAL_SERVER_ERROR.toString());
        }
    }
}
