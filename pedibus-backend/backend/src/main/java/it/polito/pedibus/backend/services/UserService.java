package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.DTOs.*;
import it.polito.pedibus.backend.mongoClasses.*;
import it.polito.pedibus.backend.repositories.*;
import it.polito.pedibus.backend.validators.EmailExistsException;
import org.bson.types.ObjectId;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servizio per la gestione degli utenti del servizio
 * **/
@Service
public class UserService implements IUserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final LineaRepository lineaRepository;
    private final CorsaRepository corsaRepository;
    private final PrenotazioneRepository prenotazioneRepository;
    private final TurnoRepository turnoRepository;

    private LineaService lineaService;
    private FermataService fermataService;
    private DisponibilitaRepository disponibilitaRepository;
    private ComunicazioneService comunicazioneService;

    public UserService(UserRepository userRepository,
                       LineaRepository lineaRepository,
                       PasswordEncoder passwordEncoder,
                       LineaService lineaService,
                       FermataService fermataService,
                       CorsaRepository corsaRepository,
                       PrenotazioneRepository prenotazioneRepository,
                       DisponibilitaRepository disponibilitaRepository,
                       TurnoRepository turnoRepository,
                       ComunicazioneService comunicazioneService) {
        this.userRepository = userRepository;
        this.lineaRepository = lineaRepository;
        this.passwordEncoder = passwordEncoder;
        this.lineaService = lineaService;
        this.fermataService = fermataService;
        this.corsaRepository = corsaRepository;
        this.prenotazioneRepository = prenotazioneRepository;
        this.turnoRepository = turnoRepository;
        this.disponibilitaRepository = disponibilitaRepository;
        this.comunicazioneService = comunicazioneService;
    }


    /**
     * Questo metodo è usato per la creazione dell'admin master nella fase di boot del programma.
     * Esso ha potere massimo e può accettare qualsiasi richiesta rivolta agli admin
     **/
    @Override
    //@Transactional
    public void creazioneAdminMaster(UserDTO userDTO) {
        User amministratore = new User(
                userDTO.getEmail(),
                userDTO.getNome(),
                userDTO.getCognome(),
                passwordEncoder.encode(userDTO.getPassword()),
                Collections.singletonList("ROLE_SEGRETERIA")
        );
        amministratore.setBambini(null);
        amministratore.setLineeAmministrate(null);
        amministratore.setStato(User.STATO.ABILITATO);
        userRepository.save(amministratore);
    }

    // ============= METODI PER INSERIMENTO DI UTENTI NEL DB DA PARTE DI ADMIN ROOT ===============================

    /**
     * Questo metodo viene invocato dal controller quando lo user generale (segreteria) vuole aggiungere
     * un nuovo utente (accompagnatore oppure passeggero).
     * Le informazioni sono lasciate tutte vuote, perchè sarà lo user a completarle accedendo tramite link mandato
     * via mail
     **/
    @Override
    public UUID inserimentoNuovoUser(String email,
                                     int ruolo) throws Exception, EmailExistsException {

        // Verifico che non esita già un utente con questa mail
        if (emailExists(email)) {
            throw new EmailExistsException("Account esistente con questo indirizzo email:" + email);
        }

        // Verifico che il ruolo inviato sia sensato
//        if(ruolo < 0 || ruolo > 2)
//            throw new Exception("Ruolo non valido");

        // Creo lo user a seconda del ruolo
        User user = new User();
        user.setEmail(email);
        user.setNome("");
        user.setCognome("");
        user.setPassword("");

        // setto il ruolo a seconda del valore ricevuto dal controller
        switch (ruolo) {
            case 0: // genitore
                user.setRuoli(Collections.singletonList("ROLE_PASSEGGERO"));
                user.setBambini(new ArrayList<>());
                user.setSalitaDefault(null);
                user.setDiscesaDefault(null);
                break;
            case 1: //accompagnatore
                user.setRuoli(Collections.singletonList("ROLE_ACCOMPAGNATORE"));
                break;

            case 2: // admin_linea
                user.setRuoli(Collections.singletonList("ROLE_ADMIN_LINEA"));
                break;
            default:
                throw new Exception("Ruolo non valido");
        }

        // lo user non è ancora abilitato, perchè non ha ancora perfezionato il suo profilo con le altre info
        user.setStato(User.STATO.ATTESA_VERIFICA);

        // setto il token univoco per riconoscere questo user quando andrà a completare il suo profilo
        UUID uuid = UUID.randomUUID();
        user.setToken(uuid); // assegno una stringa random per la verifica

        // Salvo lo user nel DB
        userRepository.save(user);

        return uuid;
    }

    /**
     * Questo metodo viene usato per verificare che un dato utente non sia già presente nel DB.
     * Se esiste viene ritornato il ruolo, altrimenti null
     **/
    @Override
    public String getRoleByEmail(String userId) throws Exception {
        User user = verificaEsistenzaUser(userId);
        return user.getRuoli().get(0);
    }

    /**
     * Metodo per completare il profilo dello user ed abilitarlo
     **/
    @Override
    public User completaProfilo(UUID uuid, UserDTO userDTO) throws Exception {

        // Estraggo lo user sulla base del token inviato
        User user = userRepository.findByToken(uuid);
        if (user == null)
            throw new Exception("Token non valido");

        // Verifico che il suo stato sia di attesa completamento profilo
        if (user.getStato() != User.STATO.ATTESA_VERIFICA)
            throw new Exception("Utente non abilitato all'operazione");

        // Verifico che la mail passata corrisponda allo user che deve essere attivato
        if(!user.getEmail().equals(userDTO.getEmail()))
            throw new Exception("L'indirizzo email passato non è valido");

        // Verifico che le password passate siano identiche
//        if(!userDTO.getPassword().equals(userDTO.getMatchingPassword()))
//            throw new Exception("Le password non corrispondono");

        // Verifico che la mail sia ben formata
//        Pattern pattern = Pattern.compile(EMAIL_PATTERN);
//        Matcher matcher = pattern.matcher(userDTO.getEmail());
//        if(!matcher.matches())
//            throw new Exception("Email non valida");

        // Completo il suo profilo e salvo le informazioni
        user.setNome(userDTO.getNome());
        user.setCognome(userDTO.getCognome());
        user.setPassword(passwordEncoder.encode(userDTO.getPassword()));
        user.setStato(User.STATO.ABILITATO);
        user.setToken(null);
        user.setTokenTime(null);

        // Salvo l'utente nel DB
        userRepository.save(user);

        return user;
    }


    // ========================================================================================================


    /**
     * Metodo invocato per la registrazione di un nuovo utente
     **/
    @Override
    //@Transactional
    public UUID registrazione(UserDTO userDTO, int ruolo) throws Exception {
        switch (ruolo) {
            case 0:
                try {
                    return registrazioneNuovoAccountPasseggero(userDTO);
                } catch (EmailExistsException e) {
                    throw new Exception("Email non valida");
                }
            case 1:
                try {
                    return registrazioneNuovoAccountAccompagnatore(userDTO);
                } catch (EmailExistsException e) {
                    throw new Exception("Email non valida");
                }
            default:
                throw new Exception("Errata definizione ruolo utente");
        }
    }


    /**
     * Questo metodo viene invocato per registrare un nuovo passeggero nel DB di tutti gli utenti
     **/
    //@Transactional
    private UUID registrazioneNuovoAccountPasseggero(UserDTO accountDto)
            throws EmailExistsException {

        User genitore = compilaInfoGenitore(accountDto);
        genitore.setStato(User.STATO.ATTESA_VERIFICA); // metto user in attesa di verifica

        UUID uuid = UUID.randomUUID();

        genitore.setToken(uuid); // assegno una stringa random per la verifica
        genitore.setTokenTime(System.currentTimeMillis()); // data e ora della richiesta di registrazione
        userRepository.save(genitore);

        return uuid;
    }


    /**
     * Questo metodo viene invocato per registrare un nuovo accompagnatore nel DB di tutti gli utenti
     **/
    //@Transactional
    private UUID registrazioneNuovoAccountAccompagnatore(UserDTO accountDto)
            throws EmailExistsException {

        User accompagnatore = compilaInfoAccompagnatore(accountDto);
        accompagnatore.setStato(User.STATO.ATTESA_VERIFICA); // metto user in attesa di verifica

        UUID uuid = UUID.randomUUID();

        accompagnatore.setToken(uuid); // assegno una stringa random per la verifica
        accompagnatore.setTokenTime(System.currentTimeMillis()); // data e ora della richiesta di registrazione
        userRepository.save(accompagnatore);

        return uuid;
    }


    /**
     * Crea uno user di tipo genitore e lo restituisce al chiamante
     **/
    private User compilaInfoGenitore(UserDTO accountDto) throws EmailExistsException {
        if (emailExists(accountDto.getEmail())) {
            throw new EmailExistsException("Account esistente con questo indirizzo email:" + accountDto.getEmail());
        }

        User user = new User(accountDto.getEmail(),
                accountDto.getNome(),
                accountDto.getCognome(),
                passwordEncoder.encode(accountDto.getPassword()),
                Collections.singletonList("ROLE_PASSEGGERO"));
        user.setBambini(new ArrayList<>());
        user.setSalitaDefault(null);
        user.setDiscesaDefault(null);

        return user;
    }


    /**
     * Crea uno user di tipo accompagnatore e lo restituisce al chiamante
     **/
    private User compilaInfoAccompagnatore(UserDTO accountDto) throws EmailExistsException {
        if (emailExists(accountDto.getEmail())) {
            throw new EmailExistsException("Account esistente con questo indirizzo email:" + accountDto.getEmail());
        }

        return new User(accountDto.getEmail(),
                accountDto.getNome(),
                accountDto.getCognome(),
                passwordEncoder.encode(accountDto.getPassword()),
                Collections.singletonList("ROLE_ACCOMPAGNATORE"));
    }


    /**
     * Metodo usato per verificare che l'indirizzo email fornito non esista già nel DB
     **/
    private boolean emailExists(String email) {
        User user = userRepository.findByEmail(email);
        return user != null;
    }


    /**
     * Metodo usato per eliminare tutti gli utenti
     **/
    //@Transactional
    public void deleteAll() {
        userRepository.deleteAll();
    }


    /**
     * Metodo per verificare se il random UUID inviato dall'utente esiste oppure no
     **/
    @Override
    public boolean verificaAbilitazione(UUID random) {
        User user = userRepository.findByToken(random);

        /* L'utente esiste: ha richiesto la registrazione */
        if (user != null) {

            /* Solo un utente in attesa di verifica può finalizzare una registrazione */
            if (user.getStato() != User.STATO.ATTESA_VERIFICA)
                return false;

            /* Verifico che il token di registrazione non sia scaduto */
            long activationTime = user.getTokenTime();
            long now = System.currentTimeMillis(); // data e ora della richiesta di registrazione
            if ((now - activationTime) / 1000 > 24 * 60 * 60) {
                userRepository.delete(user); // cancello l'utente, dovrà fare una nuova registrazione
                return false; // token scaduto
            }

            /* Se l'utente esiste ed il token non è scaduto la sua registrazione viene ultimata */
            user.setStato(User.STATO.ABILITATO);
            user.setToken(null);
            user.setTokenTime(null);
            userRepository.save(user);
            return true;
        } else
            return false;
    }


    /**
     * Metodo per il recupero della password dell'utente. Se la mail non esiste nel DB viene
     * sollevata un'eccezione, altrimenti viene generato un nuovo UUID e ritornato
     **/
    @Override
    //@Transactional
    public UUID recuperaPassword(String email) throws Exception {
        User user;
        try {
            user = userRepository.findByEmail(email);
        } catch (UsernameNotFoundException e) {
            throw new Exception("Utente inesistente");
        }

        if (user.getStato() != User.STATO.ABILITATO)
            throw new Exception("Utente non abilitato al recupero password");
        else {
            UUID uuid = UUID.randomUUID();
            user.setToken(uuid);
            user.setTokenTime(System.currentTimeMillis());
            userRepository.save(user);
            return uuid;
        }
    }


    /**
     * Metodo per aggiornare la password di un utente che ne abbia diritto
     **/
    @Override
    //@Transactional
    public void aggiornaPassword(UUID uuid, String nuovaPassword) throws Exception {
        User user = userRepository.findByToken(uuid);

        /* L'utente esiste: ha richiesto la registrazione */
        if (user != null) {

            /* Solo un utente in attesa di verifica può finalizzare una registrazione */
            if (user.getStato() != User.STATO.ABILITATO)
                throw new Exception("Utente non abilitato");

            /* Verifico che il token di registrazione non sia scaduto */
            long activationTime = user.getTokenTime();
            long now = System.currentTimeMillis(); // data e ora della richiesta di registrazione
            if ((now - activationTime) / 1000 > 60 * 60) {
                throw new Exception("Richiesta nuova password scaduta");
            }

            /* Se l'utente esiste ed il token non è scaduto la nuova password viene settata */
            user.setToken(null);
            user.setTokenTime(null);
            user.setPassword(passwordEncoder.encode(nuovaPassword));
            userRepository.save(user);
        } else
            throw new Exception("Richiesta nuova password non valida");
    }


    /**
     * Metodo che ritorna l'elenco di tutti gli utenti del sistema.
     * Lato controller questo metodo deve essere utilizzabile solamente da utenti con ruolo
     * ADMIN_MASTER oppure ADMIN_LINEA
     **/
    @Override
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }


    /**
     * Il metodo permette di concedere o di revocare i diritti amministrativi di un admin per una data linea.
     * Accetta il nome della linea, l'identità dell'utente autenticato per verificare i suoi diritti
     * e l'identificativo dello user a cui deve essere concesso/revocato il permesso di amministrazione
     **/
    @Override
    //@Transactional
    public void aggiornaGestioneLinea(String nomeLinea,
                                      String adminId,
                                      String userId,
                                      int azione) throws Exception {
        // Verifico che questa linea esista
        Linea linea = lineaService.getLineaByNome(nomeLinea);

        // Estrazione utente con presunto ruolo di admin
        //User admin = userRepository.findById(new ObjectId(adminId)).get();
        User admin = verificaEsistenzaUser(adminId);

        // Verifico che questo utente sia un admin master
        if(admin.getRuoli().contains("ROLE_ADMIN_MASTER")){
            // Verifico che questo user esista
            User user = verificaEsistenzaUser(userId);

            switch (azione) {
                case 0: // rimozione diritto amministrativo su una linea
                    if (linea.getAdmin_email().contains(admin.getEmail())) {

                        // Verifico che lo user da declassare sia effettivamente un admin
                        if(!user.getRuoli().contains("ROLE_ADMIN"))
                            throw new Exception("Ruolo dell'utente indicato non corrispondente all'azione");

                        // Verifico che lo user amministri effettivamente la linea indicata
                        if(!user.getLineeAmministrate().contains(linea.getNome()))
                            throw new Exception("L'utente indicato non amministra questa linea");

                        // Verifiche ultimate: tolgo l'amministrazione a questo user e lo declasso ad accompagnatore
                        user.getLineeAmministrate().remove(linea.getNome());

                        // Se la linea rimossa era l'ultima gestita, l'utente viene declassato a semplice accompagnatore
                        if (user.getLineeAmministrate().isEmpty()) {
                            user.setLineeAmministrate(null);
                            user.setRuoli(Collections.singletonList("ROLE_ACCOMPAGNATORE"));
                        }

                        // Salvo le informazioni sull'utente accompagnatore
                        userRepository.save(user);

                        // Modifico le informazioni sulla linea associata alla modifica e le trasporto all'admin
                        linea.getAdmin_email().remove(user.getEmail());
                        lineaRepository.save(linea);

                        // Mando la comunicazione all'admin interessato dalla modifica
                        // Messaggio di notifica da inviare a questo utente
                        String text = "Non sei più amministratore della linea " + "'" + linea.getNome() + "'.";
                        text = text + " A partire da questo momento il tuo ruolo è quello di accompagnatore, dunque " +
                                " effettua logout/login per accedere alle funzionalità di tua competenza";
                        comunicazioneService.nuovaComunicazione(userId, text, "Cambiamento ruolo");

                        // Mandare comunicazione in tempo reale agli admin di tutte le altre linee affinchè
                        // aggiungano alla lista degli accompagnatori la persone che è appena stata declassata
                        List<String> admins = userRepository.findByRuoliContains("ROLE_ADMIN_MASTER")
                                .stream()
                                .filter(a -> !a.getId().equals(adminId))
                                .map(User::getId)
                                .collect(Collectors.toList());
                        for(String adminLinea : admins) {
                            RuoloUpdateDTO ruoloUpdateDTO = new RuoloUpdateDTO();
                            ruoloUpdateDTO.setId(userId);
                            ruoloUpdateDTO.setNome(user.getNome() + " " + user.getCognome());
                            ruoloUpdateDTO.setAction("DECLASSATO");
                            comunicazioneService
                                    .nuovaComunicazioneRealTime(adminLinea, ruoloUpdateDTO, "promozione_declassamento");
                        }

                    } else
                        throw new Exception("L'utente loggato non è amministratore di questa linea");
                    break;

                case 1: // assegnazione diritto amministrativo su una linea
                    if (linea.getAdmin_email().contains(admin.getEmail())) {

                        if (user.getRuoli().contains("ROLE_ACCOMPAGNATORE")) {
                            // Verifico che questo accompagnatore non abbia dei turni assegnati
                            List<Turno> listTurni = turnoRepository.findByUser(user);
                            if(listTurni.size() > 0)
                                throw new Exception("L'accompagnatore ha uno o più turni assegnati");

                            // Elimino tutte le disponibilità di questo utente
                            disponibilitaRepository.deleteByUser(user);
                            List<Disponibilita> disponibilita = disponibilitaRepository.findByUser(user);

                            if(disponibilita.size() > 0)
                                throw new Exception("Impossibile cancellare le disponibilità dell'utente");

                            // Promuovo l'accompagnatore ad admin di linea
                            user.setRuoli(Collections.singletonList("ROLE_ADMIN"));
                            user.setLineeAmministrate(new ArrayList<>());

                            // Modifico le informazioni sulla linea associata alla modifica e le trasporto all'admin
                            //admin.getLineeAmministrate().remove(linea);
                            linea.getAdmin_email().add(user.getEmail());
                            lineaRepository.save(linea);
                            user.getLineeAmministrate().add(linea.getNome());
                            userRepository.save(user);

                            // Mando la comunicazione all'admin interessato dalla modifica
                            // Messaggio di notifica da inviare a questo utente
                            String text = "Sei stato promosso ad amministratore della linea " + "'" + linea.getNome() + "'.";
                            text = text + " A partire da questo momento il tuo ruolo è quello di amministratore, dunque " +
                                    " effettua logout/login per accedere alle funzionalità di tua competenza";
                            comunicazioneService.nuovaComunicazione(userId, text, "Cambiamento ruolo");

                            // Mandare comunicazione in tempo reale agli admin di tutte le altre linee affinchè
                            // rimuovano dalla lista degli accompagnatori la persone che è appena stata promossa
                            List<String> admins = userRepository.findByRuoliContains("ROLE_ADMIN_MASTER")
                                    .stream()
                                    .filter(a -> !a.getId().equals(adminId))
                                    .map(User::getId)
                                    .collect(Collectors.toList());
                            for(String adminLinea : admins) {
                                RuoloUpdateDTO ruoloUpdateDTO = new RuoloUpdateDTO();
                                ruoloUpdateDTO.setId(userId);
                                ruoloUpdateDTO.setNome(user.getNome() + " " + user.getCognome());
                                ruoloUpdateDTO.setAction("PROMOSSO");
                                comunicazioneService.nuovaComunicazioneRealTime(adminLinea, ruoloUpdateDTO, "promozione_declassamento");
                            }

                            // Comunico agli admin di tutte le linee che questo accompagnatore è stato promosso,
                            // e dunque non potrà più essergli assegnato un turno
                            DisponibilitaUpdateDTO disponibilitaUpdateDTO = new DisponibilitaUpdateDTO();
                            disponibilitaUpdateDTO.setAzione("delete_disponibilita_promozione");
                            disponibilitaUpdateDTO.setData(null);
                            disponibilitaUpdateDTO.setUser(user);
                            disponibilitaUpdateDTO.setDirezione(-1);

                            List<String> adminsAvailabilities = userRepository.findByRuoliContains("ROLE_ADMIN")
                                    .stream()
                                    .filter(a -> !a.getId().equals(user.getId()))
                                    .map(User::getId)
                                    .collect(Collectors.toList());
                            adminsAvailabilities.addAll(userRepository.findByRuoliContains("ROLE_ADMIN_MASTER").stream()
                            .map(User::getId).collect(Collectors.toList()));

                            for(String adm : adminsAvailabilities){
                                comunicazioneService.nuovaComunicazioneRealTime(adm, disponibilitaUpdateDTO, "turni");
                            }


                        }
                        else
                            throw new Exception("L'utente indicato non può essere promosso a causa del ruolo attuale");
                    }
                    else
                        throw new Exception("L'utente loggato non è amministratore di questa linea");
                    break;
            }
        }
        else
            throw new Exception("Utente non abilitato a questa operazione");
    }

    /**
     * Ritorna due liste all'interno di una mappa:
     * > La prima contiene l'elenco di tutti gli accompagnatori del sistema {nome, cognome, ID}
     * > La seconda contiene l'elenco degli admin di linee di cui l'admin master loggato è amministratore
     *  {nome, cognome, ID, linea}
     * **/
    public LinkedHashMap<String, Object> getInfoAccompagnatoriEAdmin(String loggedUserId) throws Exception{
        // Questo metodo può essere invocato solamente se lo user è un ADMIN_MASTER, quindi salto il controllo
        // sul suo ruolo

        // Istanzio la mappa che userò per inviare i dati
        LinkedHashMap<String, Object> result = new LinkedHashMap<>();

        // Estraggo l'istanza utente in riferimento a quello loggato
        User admin_master = verificaEsistenzaUser(loggedUserId);

        // Estraggo la lista delle linee da lui amministrate
        List<String> linee = admin_master.getLineeAmministrate();

        // Inserisco le linee nella mappa
        result.put("linee_amministrate", linee);

        // Estraggo la lista degli accompagnatori dal DB e costruisco i relativi oggetti AdminInfosDTO
        List<AdminsInfoDTO> accompagnatori = userRepository.findByRuoliContains("ROLE_ACCOMPAGNATORE")
                .stream()
                .filter(u -> u.getStato() == User.STATO.ABILITATO)
                .map(acc -> {
                    AdminsInfoDTO adminsInfoDTO = new AdminsInfoDTO();
                    adminsInfoDTO.setNome(acc.getNome());
                    adminsInfoDTO.setCognome(acc.getCognome());
                    adminsInfoDTO.setId(acc.getId());
                    adminsInfoDTO.setLinea(null);
                    return adminsInfoDTO;
                }).collect(Collectors.toList());
        result.put("accompagnatori", accompagnatori);

        //Estraggo le informazioni sugli admin di linea (che non siano master e che amministrino una delle linee
        // gestite dall'admin master loggato)
        List<AdminsInfoDTO> adminLinea = userRepository.findByRuoliContains("ROLE_ADMIN")
                .stream()
                .filter(u -> u.getStato() == User.STATO.ABILITATO)
                .filter(u -> {
                    // Verifico che la linea gestita da questo user sia la stessa gestita dal master
                    // Per sviluppi futuri si fa un confronto sulle liste di linee amministrate nonostante la logica
                    // preveda si possa gestire una sola linea
                    boolean flag = false;
                    //List<String> nomeLinee = linee.stream().map(Linea::getNome).collect(Collectors.toList());
                    for(String l : u.getLineeAmministrate()){
                        if(linee.contains(l)){
                            flag = true;
                            break;
                        }
                    }
                    return flag;
                })
                .map(acc -> {
                    AdminsInfoDTO adminsInfoDTO = new AdminsInfoDTO();
                    adminsInfoDTO.setNome(acc.getNome());
                    adminsInfoDTO.setCognome(acc.getCognome());
                    adminsInfoDTO.setId(acc.getId());
                    adminsInfoDTO.setLinea(linee.get(0));
                    return adminsInfoDTO;})
                .collect(Collectors.toList());
        result.put("amministratori", adminLinea);

        return result;
    }

    @Override
    //@Transactional
    public void assegnaGestioneLineaAtBoot(Linea linea) throws Exception {
        List<String> admin_emails = linea.getAdmin_email();

        for (String email : admin_emails) {
            User admin = userRepository.findByEmail(email);

            if (admin == null)
                throw new Exception("Utente inesistente");

            admin.setLineeAmministrate(new ArrayList<>());
            admin.setRuoli(Collections.singletonList("ROLE_ADMIN_MASTER"));

            admin.getLineeAmministrate().add(linea.getNome());
            userRepository.save(admin);
        }
    }

    /**
     * Aggiunge un bambino ad un genitore identificato dal suo ID
     **/
    @Override
    public void aggiungiBambino(String id, List<String> bambini) throws Exception {
        // Verifico la presenza di questo user
//        Optional<User> user = userRepository.findById(new ObjectId(userID));
//        if(!user.isPresent())
//            throw new Exception("Utente inesistente");

        // Estrazione utente con presunto ruolo di admin
        User user = userRepository.findById(new ObjectId(id)).get();

        // Verifico che questo utente sia un genitore
        if (!user.getRuoli().contains("ROLE_PASSEGGERO"))
            throw new Exception("Questo utente non è un genitore");

        for (String bambino : bambini) {

            // Verifico che il genitore non abbia già questo bambino registrato
            if (user.getBambini().contains(bambino))
                // Bambino esistente: ignoro
                continue;
            //throw new Exception("Uno dei bambini indicati è già associato a questo genitore. Riprova");

            // Registro il bambino
            user.getBambini().add(bambino);

            // Creo una prenotazione
        }

        // Aggiorno l'informazione su questo utente
        userRepository.save(user);
    }

    /**
     * Permette di aggiungere una fermata di salita e di discesa di default al profilo dello user
     **/
    @Override
    public void updateProfile(String userId,
                              ProfileDTO profileDTO) throws Exception {
        // Controllo che questa linea esista nel sistema
        // Linea linea = lineaService.getLineaByNome(profileDTO.getNome_linea());

        // Controllo che queste fermate esistano
        Fermata fermataSalita = fermataService.getFermataById(profileDTO.getFermata_salita_id());
        Fermata fermataDiscesa = fermataService.getFermataById(profileDTO.getFermata_discesa_id());

        Linea lineaA = lineaService.getLineaByNome(fermataSalita.getLinea().getNome());
        Linea lineaR = lineaService.getLineaByNome(fermataDiscesa.getLinea().getNome());

        // Controllo che il genitore non abbia settato la scuola come fermata di discesa all'andata
        // oppure come fermata di salita al ritorno
        if(lineaA.getFermate_andata().get(lineaA.getFermate_andata().size()-1).getId().equals(fermataSalita.getId()))
            throw new Exception("La scuola non può essere la fermata di salita all'andata");
        if(lineaR.getFermate_ritorno().get(0).getId().equals(fermataDiscesa.getId()))
            throw new Exception("La scuola non può essere la fermata di discesa al ritorno");

        // Controllo che le info sulla linea combacino con le info delle fermate
        // fermataService.checkLineInfos(fermataSalita, fermataDiscesa, profileDTO.getNome_linea());

        // Aggiungo queste informazioni allo user
        User user = verificaEsistenzaUser(userId);

        // Aggiungo le informazioni delle fermate allo user
        user.setSalitaDefault(fermataSalita);
        user.setDiscesaDefault(fermataDiscesa);

        List<String> bambiniAggiunti = new ArrayList<>();
        List<String> bambiniCancellati = new ArrayList<>();
        List<String> bambiniDb = user.getBambini().stream().map(String::toLowerCase).collect(Collectors.toList());

        // Bambini passati dal client
        List<String> bambiniPassati = new ArrayList<>(Arrays.asList(profileDTO.getBambini()));

        // Aggiorno l'elenco dei bambini di questo genitore
        // user.setBambini(bambiniPassati);

        // Riempio la lista dei bambini cancellati filtrando sulla lista di tutti i bambini
        for (String bambino : bambiniDb) {
            if (!bambiniPassati.stream().map(String::toLowerCase).collect(Collectors.toList())
                    .contains(bambino.toLowerCase()))
                bambiniCancellati.add(bambino);
        }

        // Verifico che le informazioni sui bambini siano corrette (no duplicati)
        for (String bambino : bambiniPassati) {

            // Verifico che il genitore non abbia già questo bambino registrato
            if (bambiniDb.contains(bambino.toLowerCase()))
                continue;

            // Registro il bambino
            user.getBambini().add(bambino);

            // Aggiunto il bambino alla lista dei bambini nuovi
            bambiniAggiunti.add(bambino);
        }

        // Data di oggi
        long today = System.currentTimeMillis();
        System.out.println("TODAY date: " + today);

//        List<Corsa> corse = corsaRepository.findByLineaId(linea.getId_obj());
        List<Corsa> corse = corsaRepository.findByLineaId(lineaA.getId_obj());

        if(!lineaA.getNome().equals(lineaR.getNome()))
            corse.addAll(corsaRepository.findByLineaId(lineaR.getId_obj()));

        for (Corsa corsa : corse) {

            // Estraggo la linea associata a questa corsa
            Linea linea = lineaService.getLineaById(corsa.getLineaId());

            long dataCorsa = new SimpleDateFormat("dd-MM-yyyy").parse(corsa.getData()).getTime();

            if(dataCorsa <= today)
                continue;

            for(String bambino : bambiniAggiunti){

                // TODO: rimuovere il codice seguente: usare solo in fase di sviluppo
                if(bambino.equals("Luca"))
                    continue;

                int direzione = corsa.getDirezione();

                // Tutti i controlli hanno dato esito positivo: creo la prenotazione
                Prenotazione prenotazione1 = new Prenotazione();
                prenotazione1.setBambino(bambino);
                prenotazione1.setUserId(new ObjectId(user.getId()));
                prenotazione1.setSalito(false);
                prenotazione1.setSceso(false);
                prenotazione1.setPrenotatoDaGenitore(true);
                prenotazione1.setCorsaId(corsa.getId_obj());

                if (direzione == 0) {

                    // Se la corsa che si sta osservando riguarda un'altra linea continuo alla prossima
                    if(!linea.getNome().equals(lineaA.getNome()))
                        continue;

                    // Estraggo l'ID della fermata che corrisponde alla scuola all'andata
                    int size = lineaA.getFermate_andata().size() - 1;
                    String idFermataScuola = lineaA.getFermate_andata().get(size).getId();
                    Fermata scuola_andata = fermataService.getFermataById(idFermataScuola);
                    prenotazione1.setFermataSalita(fermataSalita);
                    prenotazione1.setFermataDiscesa(scuola_andata);

                    prenotazioneRepository.save(prenotazione1);
                } else {

                    // Se la corsa che si sta osservando riguarda un'altra linea continuo alla prossima
                    if(!linea.getNome().equals(lineaR.getNome()))
                        continue;

                    // Estraggo l'ID della fermata che corrisponde alla scuola all'andata
                    Fermata scuola_ritorno = lineaR.getFermate_ritorno().get(0);
                    prenotazione1.setFermataSalita(scuola_ritorno);
                    prenotazione1.setFermataDiscesa(fermataDiscesa);

                    prenotazioneRepository.save(prenotazione1);
                }
            }

//            for(String bambino:bambiniCancellati){
//                Prenotazione prenotazione = prenotazioneRepository.findByCorsaIdAndBambino(corsa.getId_obj(),
//                        bambino);
//
//                if(prenotazione == null)
//                    continue;
//
//                // Cancello questa prenotazione
//                prenotazioneRepository.delete(prenotazione);
//            }
        }

        // Elimino le prenotazioni dei bambini che devono essere cancellati
        for(String bambino:bambiniCancellati){

            // Estraggo tutte le prenotazioni associate al bambino cancellato
            List<Prenotazione> prenotazioniDaCancellare = prenotazioneRepository.findByBambinoIgnoreCase(bambino);
            for(Prenotazione p : prenotazioniDaCancellare){
                Corsa corsa = corsaRepository.findById(p.getCorsaId()).get();
                long dataCorsa = new SimpleDateFormat("dd-MM-yyyy").parse(corsa.getData()).getTime();

                // Se la prenotazione è passata non la devo cancellare
                if(dataCorsa <= today)
                    continue;

                // Altrimenti cancello la prenotazione
                prenotazioneRepository.delete(p);
            }

            String bambinoToDelete = user.getBambini()
                    .stream()
                    .filter(b -> b.equalsIgnoreCase(bambino))
                    .collect(Collectors.joining());
            user.getBambini().remove(bambinoToDelete);
        }

        // user.setBambini(bambiniPassati);

        // Salvo nel DB
        userRepository.save(user);

    }

    /**
     * Permette di verificare se lo user associato all'ID esista o meno
     **/
    @Override
    public User verificaEsistenzaUser(String userId) throws Exception {
        Optional<User> user = userRepository.findById(new ObjectId(userId));
        if (!user.isPresent())
            throw new Exception("Utente inesistente");
        return user.get();
    }

    @Override
    public User verificaEsistenzaUserByEmail(String email) throws Exception {
        User user = userRepository.findByEmail(email);

        if (user == null)
            throw new Exception("Utente inesistente");

        return user;
    }


    /**
     * Questo metodo estrae le informazioni sulle fermate di default dello user che ha fatto richiesta
     **/
    @Override
    public LinkedHashMap<String, Object> getProfileInfos(String userId) throws Exception {

        LinkedHashMap<String, Object> map =
                new LinkedHashMap<>();

        // Estrazione utente con presunto ruolo di admin
        User user = userRepository.findById(new ObjectId(userId)).get();

        // Verifico che questo utente sia un genitore
        if (!user.getRuoli().contains("ROLE_PASSEGGERO"))
            throw new Exception("Questo utente non è un genitore");

        Fermata salitaDefault = user.getSalitaDefault();
        Fermata discesaDefault = user.getSalitaDefault();

        map.put("nome_linea_andata", salitaDefault != null ? user.getSalitaDefault().getLinea().getNome() : null);
        map.put("nome_linea_ritorno", discesaDefault != null ? user.getDiscesaDefault().getLinea().getNome() : null);
        map.put("fermata_salita_default", user.getSalitaDefault());
        map.put("fermata_discesa_default", user.getDiscesaDefault());

        return map;
    }

    /**
     * Ritorna le informazioni del metodo soprastante e l'elenco dei bambini di questo user
     **/
    @Override
    public LinkedHashMap<String, Object> getProfileInfosBambini(String userId) throws Exception {

        User user_ = userRepository.findById(new ObjectId(userId)).get();
        String email = user_.getUsername();

        // Informazioni di default del profilo
        LinkedHashMap<String, Object> map = getProfileInfos(userId);

        // Se arrivo qui questo user esiste sicuramente, quindi non ripeto i controlli
        User user = userRepository.findByEmail(email);

        // Estraggo l'elenco dei bambini
        List<String> bambini = user.getBambini();

        // Aggiungo i bambini alla mappa
        map.put("bambini", bambini);

        return map;
    }

    /**
     * Metodo per verificare se l'utente che si vuole loggare esiste nel DB
     **/
    public User findByEmailAndPassword(String email, String password) throws Exception {
        User user = userRepository.findByEmail(email);
        if (user != null) {
            if (passwordEncoder.matches(password, user.getPassword()))
                if (!user.getRuoli().contains("ROLE_ADMIN_MASTER"))
                    // l'utente deve in stato di ABILITATO per fare login
                    if (user.getStato() != User.STATO.ABILITATO)
                        throw new Exception("L'utente non ha confermato la registrazione");
                    else
                        return user;
                else
                    return user;
            else
                throw new Exception("User/password errati");
        } else
            throw new Exception("User/password errati");
    }
}
