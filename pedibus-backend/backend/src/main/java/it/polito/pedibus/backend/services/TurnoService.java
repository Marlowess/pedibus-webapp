package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.DTOs.*;
import it.polito.pedibus.backend.domain.FermataPartenzaArrivo;
import it.polito.pedibus.backend.domain.TurnoInfo;
import it.polito.pedibus.backend.mongoClasses.*;
import it.polito.pedibus.backend.repositories.*;
import it.polito.pedibus.backend.utilities.TimestampChecker;
import org.bson.types.ObjectId;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Servizio per la gestione dei turni sul livello di persistenza
 * **/
@Service
public class TurnoService implements ITurnoService {

    private CorsaRepository corsaRepository;
    private UserRepository userRepository;
    private DisponibilitaRepository disponibilitaRepository;
    private LineaService lineaService;
    private TurnoRepository turnoRepository;
    private FermataRepository fermataRepository;
    private DisponibilitaService disponibilitaService;
    private CorsaService corsaService;
    private FermataService fermataService;
    private ComunicazioneService comunicazioneService;

    public TurnoService(CorsaRepository corsaRepository,
                        UserRepository userRepository,
                        DisponibilitaRepository disponibilitaRepository,
                        TurnoRepository turnoRepository,
                        FermataRepository fermataRepository,
                        DisponibilitaService disponibilitaService,
                        CorsaService corsaService,
                        FermataService fermataService,
                        LineaService lineaService,
                        ComunicazioneService comunicazioneService){
        this.corsaRepository = corsaRepository;
        this.userRepository = userRepository;
        this.disponibilitaRepository = disponibilitaRepository;
        this.lineaService = lineaService;
        this.turnoRepository = turnoRepository;
        this.fermataRepository = fermataRepository;
        this.disponibilitaService = disponibilitaService;
        this.corsaService = corsaService;
        this.fermataService = fermataService;
        this.comunicazioneService = comunicazioneService;
    }

    /**
     * Permette la creazione ed assegnazione di un turno ad un accompagnatore che ha concesso la propria
     * disponibilità
     * **/
    @Override
    public TurnoResponseDTO assegnaTurno(TurnoDTO turnoDTO) throws Exception {

        if(turnoDTO.getData() == null)
            throw new Exception("Specificare una data per il turno");

        Date data = new Date(Long.parseLong(turnoDTO.getData()));
        String date = new SimpleDateFormat("dd-MM-yyyy").format(data);

        // Verifico che l'utente loggato sia l'amministratore di questa linea
        Linea linea = lineaService.verificaAmministrazioneLinea(turnoDTO.getNome_linea());

        Corsa corsa = corsaService.getCorsaInfo(date, turnoDTO.getDirezione(), linea.getId_obj());

        // Verifico le informazioni sull'utente
        User user = checkUserInfos(turnoDTO.getUserId());

        // Verifico che questo utente si sia reso disponibile in questa data e per questa direzione
        verificaDisponibilita(turnoDTO.getData(),
                turnoDTO.getDirezione(), user);

        // Verifico che l'utente a cui si vuole assegnare il turno non abbia già un turno assegnato
        // nella stessa corsa. Inoltre devo verificare che non esistano altri turni già assegnati
        // a questo utente per la stessa data e direzione ma per un'altra linea
        verificaPresenzaAltriTurni(corsa, user);

        // Verifico la consistenza della richiesta con i turni già presenti nel DB. Se esistono già
        // dei turni assegnati per le fermate richieste, oppure ci sono sovrapposizioni, la richiesta
        // non può essere evasa
        FermataPartenzaArrivo fermataPartenzaArrivo =
                verificaConsistenzaFermate(linea,
                        corsa,
                        turnoDTO.getFermataPartenzaId(),
                        turnoDTO.getFermataArrivoId());

        // Verifico che la data di passaggio alla prima fermata del turno non sia più vicina di 5 minuti
        TimestampChecker.verificaOrario(TimestampChecker.concatDate(
                corsa.getData(),
                fermataService.getOraPassaggioByFermataId(turnoDTO.getFermataPartenzaId())));

        // Arrivato a questo punto il turno può essere creato, e la relativa disponibilità deve essere eliminata
        Turno turno = new Turno();
        turno.setUser(user);
        turno.setCorsa(corsa);
        turno.setPartenza(fermataPartenzaArrivo.getPartenza());
        turno.setArrivo(fermataPartenzaArrivo.getArrivo());
        turno.setConfermato(false);

        // Creo l'istanza del turno
        Turno turno1 = turnoRepository.save(turno);

        // Mando una notifica all'accompagnatore a cui il turno è stato assegnato
        String testo = getCommunicationNuovoTurno(turno, corsa, linea);
        comunicazioneService.nuovaComunicazione(user.getId(), testo, "Nuovo turno");

        // Mando a tutti gli altri admin i nuovi dati così che aggionino la grafica
        sendAggiormentoTurnoRealTime(turno1, "add", false);

        // Costruisco un oggetto TurnoResponseDTO
        return new TurnoResponseDTO(turno1, linea.getNome());
    }

    /**
     * Permette di modificare un turno già assegnato
     * **/
    @Override
    public void modificaTurno(TurnoDTO turnoDTO) throws Exception {
        // Controllo che il campo ID sia valido prima di proseguire con i controlli e con le operazioni
        if(turnoDTO.getTurnoId() == null)
            throw new Exception("Turno non valido");

        // Estraggo l'optional associato all'ID ricevuto
        Optional<Turno> optionalTurno = this.turnoRepository.findById(new ObjectId(turnoDTO.getTurnoId()));

        // Verifico che il turno esista
        if(!optionalTurno.isPresent())
            throw new Exception("Turno inesistente");

        // Estraggo il turno
        Turno turno = optionalTurno.get();

        // Verifico che esista una corsa relativa alla richiesta di questo turno
        Corsa corsa = corsaRepository.findByDataAndDirezioneAndLineaId(
                turno.getCorsa().getData(),
                turno.getCorsa().getDirezione(),
                new ObjectId(turno.getCorsa().getLineaId())
        );

        // Verifico che esista questa corsa
        if(corsa == null)
            throw new Exception("Dati della corsa non validi");

        // Verifico che l'utente loggato sia l'amministratore di questa linea
        Linea linea = lineaService.verificaAmministrazioneLinea(turnoDTO.getNome_linea());

        // Verifico che la data di passaggio alla prima fermata del turno non sia più vicina di 5 minuti
        TimestampChecker.verificaOrario(TimestampChecker.concatDate(
                corsa.getData(),
                fermataService.getOraPassaggioByFermataId(turnoDTO.getFermataPartenzaId())));

        // Verifico la consistenza delle fermate
        FermataPartenzaArrivo fermataPartenzaArrivo =
                verificaConsistenzaFermate(linea,
                        corsa,
                        turnoDTO.getFermataPartenzaId(),
                        turnoDTO.getFermataArrivoId());

        // Costruisco il nuovo turno
        turno.setPartenza(fermataPartenzaArrivo.getPartenza());
        turno.setArrivo(fermataPartenzaArrivo.getArrivo());
        turno.setConfermato(false);

        // Salvo il nuovo turno nel DB
        this.turnoRepository.save(turno);

        // Aggiornamento real-time per gli altri admin
        sendAggiormentoTurnoRealTime(turno, "modify", false);

        comunicazioneService.nuovaComunicazione(turno.getUser().getId(), "Il tuo turno "
                        + "in data " + corsa.getData() + ", direzione " + (corsa.getDirezione() == 0 ? "andata" : "ritorno") +
                        ", linea " + lineaService.getLineaById(turno.getCorsa().getLineaId()).getNome() + " è stato modificato. " +
                        "Visita la sezione delle disponibilità per accettare o rifiutare il nuovo turno",
                "Modifica turno");
    }


    /**
     * Cancella un turno dal DB sulla base del suo identificativo
     * **/
    @Override
    public void eliminaTurno(String turnoId) throws Exception {

        // Verifico che questo turno esista
        Optional<Turno> turnoOptional = turnoRepository.findById(new ObjectId(turnoId));
        if(!turnoOptional.isPresent())
            throw new Exception("Turno inesistente");

        Turno turno = turnoOptional.get();
        Corsa corsa = turno.getCorsa();

        // Verifico che la data di passaggio alla prima fermata del turno non sia più vicina di 5 minuti
        TimestampChecker.verificaOrario(TimestampChecker.concatDate(
                corsa.getData(),
                fermataService.getOraPassaggioByFermataId(turno.getPartenza().getId())));


        turnoRepository.delete(turno);

        // Aggiornamento real-time per gli altri admin
        sendAggiormentoTurnoRealTime(turno, "delete", false);

        comunicazioneService.nuovaComunicazione(turno.getUser().getId(), "Il tuo turno "
                        + "in data " + corsa.getData() + ", direzione " + (corsa.getDirezione() == 0 ? "andata" : "ritorno") +
                        ", linea " + lineaService.getLineaById(corsa.getLineaId()).getNome() + " è stato cancellato.",
                "Cancellazione turno");
    }

    /**
     * Metodo per verificare se l'utente a cui si vuole assegnare un turno soddisfi o meno le condizioni richieste
     * **/
    @Override
    public User checkUserInfos(String userId) throws Exception {
        // Verifico che l'utente a cui si vuole assegnare il turno:
        // 1) Esista
        // 2) Abbia il ruolo di accompagnatore
        // 3) Non possegga già un turno in quella data e per quella direzione
        Optional<User> userOptional = userRepository.findById(new ObjectId(userId));

        // Verifico l'esistenza
        if(!userOptional.isPresent())
            throw new Exception("Utente inesistente");

        User user = userOptional.get();

        // Verifico che l'utente sia un accompagnatore
        if(!user.getRuoli().contains("ROLE_ACCOMPAGNATORE"))
            throw new Exception("Utente non abilitato a ricoprire il turno");

        return user;
    }

    /**
     * Verifica che un certo user si sia reso disponibile prima di assegnargli un turno
     * **/
    @Override
    public Disponibilita verificaDisponibilita(String data, int direzione, User user) throws Exception {

        Date date = new Date(Long.parseLong(data));
        data = new SimpleDateFormat("dd-MM-yyyy").format(date);

        // Estraggo la disponibilità associata a queste informazioni
        Disponibilita disponibilita = disponibilitaRepository.findByDataAndDirezioneAndUser(
                data, direzione, user
        );

        // Verifico che esista
        if(disponibilita == null)
            throw new Exception("Questo utente non si è reso disponibile per questa corsa");

        return disponibilita;
    }

    /**
     * Effettua una verifica sulle fermate di un nuovo turno per evitare incogruenze
     * **/
    @Override
    public FermataPartenzaArrivo verificaConsistenzaFermate(Linea linea,
                                           Corsa corsa,
                                           String partenzaId,
                                           String arrivoId
    ) throws Exception {
        // Verifico che le fermate passate per l'assegnazione del turno siano consecutive e facenti parte
        // della linea
        if(partenzaId.compareTo(arrivoId) >= 0)
            throw new Exception("Fermate non consecutive o sovrapposte");

        // Estraggo gli ID delle fermate di questa linea in base alla direzione richiesta
        List<String> fermateIds = (corsa.getDirezione() == 0 ? linea.getFermate_andata() : linea.getFermate_ritorno())
                .stream()
                .map(Fermata::getId)//.toHexString())
                .collect(Collectors.toList());

        // Controllo che gli Id delle fermate passate siano contenuti nell'elenco degli id delle fermate
        // di questa linea
        if(!fermateIds.contains(partenzaId) || !fermateIds.contains(arrivoId))
            throw new Exception("Fermate non associate parzialmente/totalmente a questa linea");

        // Estraggo gli oggetti Fermata dal DB per poterli ritornare
        Optional<Fermata> partenzaOpt = fermataRepository.findById(new ObjectId(partenzaId));
        Optional<Fermata> arrivoOpt = fermataRepository.findById(new ObjectId(arrivoId));

        if(!partenzaOpt.isPresent() || !arrivoOpt.isPresent())
            throw new Exception("Fermate inesistenti");

        // Costruisco l'oggetto FermataPartenzaArrivo
        FermataPartenzaArrivo fermataPartenzaArrivo = new FermataPartenzaArrivo();
        fermataPartenzaArrivo.setPartenza(partenzaOpt.get());
        fermataPartenzaArrivo.setArrivo(arrivoOpt.get());

        return fermataPartenzaArrivo;

    }

    /**
     * Verifica che lo user non abbia già un turno assegnato per una certa corsa. Serve per evitare una assegnazione
     * doppia
     * **/
    @Override
    public void verificaPresenzaAltriTurni(Corsa corsa, User user) throws Exception {
        // Estraggo l'eventuale turno già assegnato a questo user per questa corsa
        Optional<Turno> turnoOptional = turnoRepository.findByCorsaAndUser(corsa, user);
        if(turnoOptional.isPresent())
            throw new Exception("Questo utente è già stato assegnato ad un altro turno");

        // Verifico che, tra tutti i turni già assegnati allo user non ce ne sia nessuno nella stessa data
        // e nella stessa direzione, ma per una linea diversa
        List<Turno> turni = turnoRepository.findByUser(user);

        // Itero lungo tutti i turni di questo accompagnatore
        for(Turno t : turni){
            String data = t.getCorsa().getData();
            int direzione = t.getCorsa().getDirezione();
            String lineaId = t.getCorsa().getLineaId();

            // Controllo che questo utente non abbia già un altro turno in questa data e direzione
            // Devo verificare che gli ID delle linee siano diversi per decretare l'incoerenza
            if(data.equals(corsa.getData())
                    && direzione == corsa.getDirezione()
                    && !lineaId.equals(corsa.getLineaId()))
                throw new Exception("Questo utente ha già un turno per un'altra corsa");
        }
    }

    /** Ritorna una mappa contenente informazioni riepilogative riguardo ai turni
     *  in una certa data e per una certa linea
     * **/
    @Override
    public LinkedHashMap<String, Object> getRiepilogoTurniByDataAndLinea(String adminId,
                                                                         String nome_linea,
                                                                         Long data) throws Exception {
        Date date = new Date(data);
        String dateString = new SimpleDateFormat("dd-MM-yyyy").format(date);

        // Verifico che l'utente loggato sia l'amministratore di questa linea
        Linea linea = lineaService.verificaAmministrazioneLinea(nome_linea);

        // Costruisco passo a passo il JSON che devo inviare al client
        LinkedHashMap<String, Object> json = new LinkedHashMap<>();

        // Inserisco la data
        json.put("data", dateString);

        // Inserisco il nome della linea
        json.put("nome_linea", nome_linea);

        // Costruisco gli array di andata e ritorno
        json.put("andata", fillInfosByFermata(
                linea.getFermate_andata(),
                linea.getId_obj(),
                data,
                dateString,
                0
        ));

        json.put("ritorno", fillInfosByFermata(
                linea.getFermate_ritorno(),
                linea.getId_obj(),
                data,
                dateString,
                1
        ));
        return json;
    }

    /**
     * Questo metodo riceve l'elenco delle fermate per una data direzione e costruisce l'array da inserire nel JSON
     * **/
    private LinkedList<TurnoInfo> fillInfosByFermata(final List<Fermata> fermate,
                                   ObjectId linea_id,
                                   Long data,
                                   String dataString,
                                   Integer direzione) throws Exception{
        // Itero lungo le fermata e costruisco una lista di oggetti
        LinkedList<TurnoInfo> turnoInfos = new LinkedList<>();

        // Creo la lista degli id delle fermate
        List<String> fermateIds = fermate.stream().map(Fermata::getId).collect(Collectors.toList());

        for (final Fermata fermata : fermate) {

            // Per ogni fermata cerco tutti gli user disponibili o già assegnati per un turno
            TurnoInfo turnoInfo = new TurnoInfo(fermata);

            // Estraggo tutti gli user già assegnati ad un turno sulla base della corsa
            Corsa corsa = corsaService.getCorsaInfo(dataString, direzione, linea_id);

            // Filtro i turni sono sulle fermate di mio interesse
            List<Turno> turni = turnoRepository.findByCorsa(corsa)
                    .stream()
                    .filter(turno -> {
                        int indexStart = fermateIds.indexOf(turno.getPartenza().getId());
                        int indexEnd = fermateIds.indexOf(turno.getArrivo().getId());
                        int indexCurrent = fermateIds.indexOf(fermata.getId());
                        return (indexCurrent >= indexStart && indexCurrent <= indexEnd);
                    })
                    .collect(Collectors.toList());

            // Estraggo gli id degli admin che hanno un turno per questa data e per questa direzione,
            // in modo da un mostrare la disponibilità agli admin se un accompagnatore ha un turno per un'altra linea
            // List<String> usersTurniIds = turni.stream().map(t -> t.getUser().getId()).collect(Collectors.toList());
            // Elenco delle corse per la data e la direzione indicata nella richiesta
            List<Corsa> corse = corsaService.getCorseByDataAndDirezione(corsa.getData(), corsa.getDirezione());

            // Elenco dei turni associati alle suddette corse
            List<Turno> turniInDataDirezione = new ArrayList<>();
            for(Corsa c : corse){
                turniInDataDirezione.addAll(turnoRepository.findByCorsa(c));
            }

            // Estrazione degli ID degli admin. Ritorno solo i turni
            List<String> usersTurniIds = turniInDataDirezione.stream()
                    .map(Turno::getUser)
                    .map(User::getId).distinct()
                    .collect(Collectors.toList());


            // Aggiungo le informazioni su questi user all'oggetto TurnoInfo
            for (Turno turno : turni) {
                turnoInfo.addUser(turno.getUser(), true, turno.isConfermato(), turno.getId());
            }


            // Estraggo tutte le persone disponibili per questa fermata
            DisponibilitaDTO disponibilitaDTO = new DisponibilitaDTO(data.toString(), direzione);
            List<User> usersDisponibilita = disponibilitaService.getDisponibilitaByDataAndDirezione(disponibilitaDTO);

            // Per ogni user aggiungo le informazioni all'oggetto TurnoInfo, verificando che lo user non sia già
            // nell'elenco degli user con turno assegnato
            for (User u : usersDisponibilita) {
//                if (usersTurniIds.contains(u.getId()))
                if (turni.stream().map(Turno::getUser).map(User::getId).collect(Collectors.toList()).contains(u.getId()))
                    continue;
                turnoInfo.addUser(u, false, false, null);
            }

            // Aggiungo alla lista, dove ogni elemento rappresenta una fermata
            turnoInfos.add(turnoInfo);
        }
        return turnoInfos;
    }

    /**
     * Permette di confermare l'assegnazione di un turno da parte di un accompagnatore
     * **/
    public String confermaTurno(String turnoId, boolean conferma) throws Exception{

        // Verifico che il turno esista
        Optional<Turno> turnoOptional = turnoRepository.findById(new ObjectId(turnoId));
        if(!turnoOptional.isPresent())
            throw new Exception("Turno inesistente");

        Turno turno = turnoOptional.get();
        String userId = turno.getUser().getId();

        // Verifico che l'utente che sta provando a confermare sia quello associato al turno
        User user = userRepository.findById(new ObjectId(userId)).get();
        if(!userId.equals(user.getId()))
            throw new Exception("L'utente che ha richiesto la conferma non corrisponde all'utente del turno");

        // L'utente può accettare o rifiutare questo turno
        if(conferma){
            // Setto il turno come confermato
            turno.setConfermato(true);
            turnoRepository.save(turno);

            // Informo tutti gli admin che il turno è stato accettato dall'accompagnatore
            sendAggiormentoTurnoRealTime(turno, "modify_accettazione", true);

            // Mando una notifica a tutti gli admin di questa linea
            sendNotificaAdminLinea(turno, true);
            return "Turno confermato";
        }
        else{
            // Rimuovo il turno perchè l'accompagnatore lo ha rifiutato
            turnoRepository.delete(turno);

            // Informo tutti gli admin che il turno è stato rifiutato dall'accompagnatore e quindi cancellato
            sendAggiormentoTurnoRealTime(turno, "delete", true);

            // Mando una notifica a tutti gli admin di questa linea
            sendNotificaAdminLinea(turno, false);
            return "Turno rifiutato ed eliminato";
        }
    }

    /**
     * Cancella tutti i turni dal DB
     * **/
    public void deleteAll(){
        turnoRepository.deleteAll();
    }

    /** Costruisco un oggetto contenente le fermate di partenza e arrivo associate ad un turno **/
    FermataPartenzaArrivo checkTurnoByCorsaAndUser(Corsa corsa, User user) throws Exception{
        Turno turno = getTurnoByCorsaUser(corsa, user);
        FermataPartenzaArrivo fermataPartenzaArrivo = new FermataPartenzaArrivo();
        fermataPartenzaArrivo.setPartenza(turno.getPartenza());
        fermataPartenzaArrivo.setArrivo(turno.getArrivo());
        return fermataPartenzaArrivo;

    }

    /**
     * Metodo per verificare se l'utente indicato è in turno per una qualsiasi delle corse
     * **/
    void verificaPresenzaTurni(User user) throws Exception{
        List<Turno> listTurni = turnoRepository.findByUser(user);
        if(listTurni.size() > 0)
            throw new Exception("L'accompagnatore ha uno o più turni assegnati");
    }

    /**
     * Ritorna un turno data una corsa ed un accompagnatore
     * **/
    private Turno getTurnoByCorsaUser(Corsa corsa, User user) throws Exception{
        Optional<Turno> turnoOptional = turnoRepository.findByCorsaAndUser(corsa, user);
        if(!turnoOptional.isPresent())
            throw new Exception("Turno inesistente per questa corsa e per questo user");
        if(!turnoOptional.get().isConfermato())
            throw new Exception("Turno non confermato");
        return turnoOptional.get();
    }

    /**
     * Ritorna l'elenco dei turni associati ad una corsa
     * **/
    List<Turno> getTurniByCorsa(Corsa corsa){
        return turnoRepository.findByCorsa(corsa);
    }

    /**
     * Permette di creare un testo di notifica quando un turno viene creato
     * **/
    private String getCommunicationNuovoTurno(Turno turno, Corsa corsa, Linea linea){
        String direzione = corsa.getDirezione() == 0 ? "andata" : "ritorno";
        String indicazione = "Visita la sezione delle disponibilità per confermare il turno.";
        String infoFermataStart = "La fermata di partenza è \'" + turno.getPartenza().getDescrizione() +
                "\' alle ore " + turno.getPartenza().getOrario() + ". ";
        String infoFermataStop = "L'arrivo è alla fermata \'" + turno.getArrivo().getDescrizione() +
                "\' alle ore " + turno.getArrivo().getOrario() + ". ";

        return "Ti è stato assegnato un nuovo turno " +
                "per il giorno " + corsa.getData() + ", corsa di " + direzione + ", linea " + linea.getNome() +
                ". " + infoFermataStart + infoFermataStop + indicazione;
    }

    /**
     * Permette l'invio di una comunicazione a tutti gli admin della linea associata al turno indicato
     * **/
    private void sendNotificaAdminLinea(Turno turno, boolean accettato) throws Exception{
        Linea linea = lineaService.getLineaById(turno.getCorsa().getLineaId());

        // Mando una notifica a ciascun admin di questa linea
        for(String email : linea.getAdmin_email()){
            User user = userRepository.findByEmail(email);

            String direzione = turno.getCorsa().getDirezione() == 0 ? "andata" : "ritorno";

            String infoTurno = turno.getCorsa().getData() + ", linea " +
                    lineaService.getLineaById(turno.getCorsa().getLineaId()).getNome() + ", " +
                    direzione + ".";

            if(accettato)
                comunicazioneService.nuovaComunicazione(user.getId(), turno.getUser().getNome()
                        + " " + turno.getUser().getCognome()
                        + " " +
                        "ha accettato il turno per la corsa in data " + infoTurno, "Turno accettato");
            else
                comunicazioneService.nuovaComunicazione(user.getId(), turno.getUser().getNome()
                        + " " + turno.getUser().getCognome()
                        + " " +
                        "ha rifiutato il turno per la corsa in data " + infoTurno, "Turno rifiutato");
        }
    }

    /** Permette l'invio di un aggiornamento in tempo reale agli altri admin ed all'accompagnatore
     *  toccato dalla aggiunta/modifica/eliminazione del turno
     * **/
    private void sendAggiormentoTurnoRealTime(Turno turno, String azione, boolean sendAll) throws Exception{

        // Estraggo le informazioni sulla linea associata a questo turno
        Linea linea = lineaService.getLineaById(turno.getCorsa().getLineaId());

        // Estraggo le email di tutti gli admin, rimappandoli sui loro ID
        List<String> emails = linea.getAdmin_email();
        List<String> adminsIds = new ArrayList<>();
        for(String email:emails){
            User user = userRepository.findByEmail(email);
            if(user != null)
                adminsIds.add(user.getId());
        }

        // sendAll == true : l'aggiornamento deve essere inviato a tutti gli admin perchè è stata effettuata da un
        //  accompagnatore
        // sendAll == false : l'aggiornamento deve essere inviato a tutti gli admin che non siano quello loggato,
        //  in quanto è stato lui a causare l'aggiornamento dei dati
        if(!sendAll){
            // Estraggo l'id dello user loggato, ossia chi ha fatto la modifica
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            UserDetails userDetails = (UserDetails)authentication.getPrincipal();
            String loggedUserId = userDetails.getUsername();

            adminsIds = adminsIds.stream()
                    .filter(id -> !id.equals(loggedUserId))
                    .collect(Collectors.toList());
        }

        // Inizio a compilare le informazioni da inviare al client tramite websocket
        TurnoUpdateDTO turnoUpdateDTO = new TurnoUpdateDTO();

        String action;
        if(azione.contains("modify"))
            action = "modify";
        else
            action = azione;
        turnoUpdateDTO.setAzione(action);

        turnoUpdateDTO.setResponse(new TurnoResponseDTO(turno, linea.getNome()));

        // Distinguo i casi in cui è un admin a fare una modifica oppure è una modifica data da un'accettazione del
        // turno
        if(azione.contains("modify")){
            if(sendAll)
                // Invio a tutti: significa che l'accompagnatore ha accettato il turno
                turnoUpdateDTO.setConfermato(true);
            else
                // Invio a tutti tranne a chi ha fatto la modifica: non si tratta di un'accettazione dell'accompagnatore
                turnoUpdateDTO.setConfermato(null);
        }
        else
            turnoUpdateDTO.setConfermato(null);

        // Invio la comunicazione agli admin di questa linea sulla base della logica precedente
        for(String id : adminsIds)
            comunicazioneService.nuovaComunicazioneRealTime(id, turnoUpdateDTO, "turni");

        if(!azione.contains("accettazione"))
            // Mando all'accompagnatore interessato dall'operazione sul turno un aggiornamento in tempo reale
            comunicazioneService.nuovaComunicazioneRealTime(turno.getUser().getId(), turnoUpdateDTO, "disponibilita");

        // Devo inoltre comunicare agli admin delle altre linee che questo accompagnatore non è più disponibile/è di
        // nuovo disponibile.
        // In questo modo non saranno in grado di assegnare un turno a tale accompagnatore/saranno di nuovo in grado
        // di assegnargli un turno.
        if(azione.equals("add") || azione.equals("delete")){
            // Estraggo gli user che sono admin dal DB
            List<User> adminLinee = userRepository.findByRuoliContains("ROLE_ADMIN");
            adminLinee.addAll(userRepository.findByRuoliContains("ROLE_ADMIN_MASTER"));

            // Tengo solo quelli che sono admin di linee diverse da quella associata al turno oggetto del cambiamento
            List<String> adminsAltreLineeIds = adminLinee
                    .stream()
                    .filter(admin -> {
                        // Se amministra una sola linea verifico non sia proprio quella in esame
                        if(admin.getLineeAmministrate().size() == 1)
                            return !admin.getLineeAmministrate().get(0).equals(linea.getNome()); // TODO: CHECK THIS

                        // Se amministra più linee sono sicuro debba ricevere questa comunicazione
                        else
                            return true;
                    })
                    .map(User::getId)
                    .distinct()
                    .collect(Collectors.toList());

            // Costruisco l'oggetto da inviare al client
            TurnoUpdateDTO turnoUpdateDTO1 = new TurnoUpdateDTO();
            turnoUpdateDTO1.setAzione(azione.equals("add") ? "not_available" : "available");
            TurnoResponseDTO turnoResponseDTO = new TurnoResponseDTO();
            turnoResponseDTO.setUser(turno.getUser());
            turnoResponseDTO.setCorsa(turno.getCorsa());
            turnoResponseDTO.setNomeLinea(linea.getNome());
            turnoUpdateDTO1.setResponse(turnoResponseDTO);


            // Itero lungo gli admin ed invio la comunicazione
            for(String id : adminsAltreLineeIds)
                comunicazioneService.nuovaComunicazioneRealTime(id, turnoUpdateDTO1, "turni");

        }
    }
}