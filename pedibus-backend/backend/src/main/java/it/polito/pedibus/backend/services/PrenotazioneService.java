package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.DTOs.*;
import it.polito.pedibus.backend.domain.*;
import it.polito.pedibus.backend.mongoClasses.*;
import it.polito.pedibus.backend.repositories.*;
import it.polito.pedibus.backend.utilities.TimestampChecker;
import org.bson.types.ObjectId;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.Collectors;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

/**
 * Questo servizio serve a gestire le prenotazioni degli utenti.
 * Le prenotazioni vengono effettuate dai genitori dei bambini così che essi siano segnati per una
 * certa corsa del pedibus. Viene intesa come prenotazione anche l'azione di segnare un bambino presente quando
 * non era stato prenotato in precedenza. Quest'azione è eseguita dall'accompagnatore designato per la corsa
 * in esame.
 **/
@Service
public class PrenotazioneService implements IReservationService {

    private final UserRepository userRepository;
    private final PrenotazioneRepository prenotazioneRepository;
    private final CorsaRepository corsaRepository;
    private final LineaRepository lineaRepository;
    private final UserService userService;
    private final CorsaService corsaService;
    private final FermataService fermataService;
    private final TurnoService turnoService;
    private final LineaService lineaService;
    private final TurnoRepository turnoRepository;
    private final ComunicazioneService comunicazioneService;

    public PrenotazioneService(UserRepository userRepository,
                               PrenotazioneRepository prenotazioneRepository,
                               CorsaRepository corsaRepository,
                               LineaRepository lineaRepository,
                               UserService userService,
                               CorsaService corsaService,
                               FermataService fermataService,
                               TurnoService turnoService,
                               LineaService lineaService,
                               TurnoRepository turnoRepository,
                               ComunicazioneService comunicazioneService) {
        this.userRepository = userRepository;
        this.prenotazioneRepository = prenotazioneRepository;
        this.corsaRepository = corsaRepository;
        this.lineaRepository = lineaRepository;
        this.userService = userService;
        this.corsaService = corsaService;
        this.fermataService = fermataService;
        this.turnoService = turnoService;
        this.lineaService = lineaService;
        this.turnoRepository = turnoRepository;
        this.comunicazioneService = comunicazioneService;
    }

    /**
     * /reservations/{line_name}/{date}
     * Restituisce un oggetto JSON contenente due liste,
     * riportanti, per ogni fermata di andata e ritorno, l’elenco delle persone che devono essere
     * prese in carico / lasciate in corrispondenza della fermata
     **/
    @Override
    public LinkedHashMap<String, Object> getUsersByReservationDateAndLine(String nomeLinea, Date data)
            throws Exception {

        String date = new SimpleDateFormat("dd-MM-yyyy").format(data);

        // Mi faccio ritornare un optional di linea cercando per nome
        Optional<Linea> lineaOptional = lineaRepository.findByNome(nomeLinea);

        // Controllo che questa linea esista: in caso contrario sollevo un'eccezione
        if (!lineaOptional.isPresent())
            throw new Exception("Linea inesistente");

        // Estraggo la linea dall'optional
        Linea linea = lineaOptional.get();

        // Recupero le corse associate alla data, alla direzione e alla linea
        Corsa corsaAndata = corsaRepository.findByDataAndDirezioneAndLineaId(date, 0, linea.getId_obj());
        Corsa corsaRitorno = corsaRepository.findByDataAndDirezioneAndLineaId(date, 1, linea.getId_obj());

        boolean turnoAndata = false;
        boolean turnoRitorno = false;
        FermataPartenzaArrivo fermataPartenzaArrivoAndata = null;
        FermataPartenzaArrivo fermataPartenzaArrivoRitorno = null;

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails) authentication.getPrincipal();

        String userId_ = userDetails.getUsername();
        User user_ = userRepository.findById(new ObjectId(userId_)).get();
        String email = user_.getUsername();

        try {
            // Verifico che questo user sia associato ad un turno
            fermataPartenzaArrivoAndata =
                    turnoService.checkTurnoByCorsaAndUser(corsaAndata, userService.verificaEsistenzaUserByEmail(email));
            turnoAndata = true;
        } catch (Exception ignored) {
        }

        try {
            // Verifico che questo user sia associato ad un turno
            fermataPartenzaArrivoRitorno =
                    turnoService.checkTurnoByCorsaAndUser(corsaRitorno, userService.verificaEsistenzaUserByEmail(email));
            turnoRitorno = true;
        } catch (Exception ignored) {
        }

        // Mappa che conterrà il risultato finale
        LinkedHashMap<String, Object> result = new LinkedHashMap<>();
        result.put("linea", nomeLinea);

        // Costruisco la mappa globale che conterrà tutte le informazioni
        LinkedHashMap<String, LinkedHashMap<IndirizzoOrario, LinkedHashMap<String, ArrayList<Presenza>>>>
                lineaAndataRitorno = new LinkedHashMap<>();


        // Costruisco la lista dei bambini che non sono stati prenotati per questa corsa
        // Prima di tutto ritorno la lista di tutti gli utenti del DB e li filtro in base al ruolo
        // Devo tenere conto solo dei genitori e non di altre tipologie di genitori
        List<User> users = userRepository.findAll()
                .stream()
                .filter(user ->
                        user.getRuoli().contains("ROLE_PASSEGGERO"))
                .collect(Collectors.toList());

        // Rimappo la lista per avere soltando oggetti della classe UserIdBambino
        List<UserIdBambino> userIdBambinoList = users.stream()
                .flatMap(user -> {
                    UserIdBambino[] l = new UserIdBambino[user.getBambini().size()];
                    String userId = user.getId();

                    // Per ogni bambino di questo genitore costruisco un oggetto UserIdBambino
                    for (int i = 0; i < user.getBambini().size(); i++) {
                        UserIdBambino userIdBambino = new UserIdBambino(userId, user.getBambini().get(i));
                        l[i] = userIdBambino;
                    }
                    return Arrays.stream(l);
                })
                .collect(Collectors.toList());

        // Verifico se questo accompagnatore ha un turno assegnato per la corsa di andata
        if (turnoAndata) {
            fillPresenzeInformations("andata", corsaAndata, linea, result, lineaAndataRitorno, userIdBambinoList, fermataPartenzaArrivoAndata);
        } else {
            // Se non ha un turno assegnato per questa direzione setto null
            result.put("andata", null);
        }

        // Verifico se questo accompagnatore ha un turno assegnato per la corsa di ritorno
        if (turnoRitorno) {
            fillPresenzeInformations("ritorno", corsaRitorno, linea, result, lineaAndataRitorno, userIdBambinoList, fermataPartenzaArrivoRitorno);
        } else {
            // Se non ha un turno assegnato per questa direzione setto null
            result.put("ritorno", null);
        }

        return result;
    }


    /**
     * Metodo per aggiungere gli oggetti "presenza" del JSON ritornato al client
     **/
    private void fillMappaPresenza(LinkedHashMap<IndirizzoOrario, LinkedHashMap<String, ArrayList<Presenza>>> map,
                                   List<Prenotazione> list) {
        for (Prenotazione prenotazione : list) {
            Fermata fermata_sal = prenotazione.getFermataSalita();
            Fermata fermata_disc = prenotazione.getFermataDiscesa();

            ObjectId userId = prenotazione.getUserId();
            Optional<User> userOptional = userRepository.findById(userId);

            if (userOptional.isPresent()) {
                //User user = userOptional.get();
                IndirizzoOrario indirizzoOrario_salita = new IndirizzoOrario();
                indirizzoOrario_salita.setIndirizzo(fermata_sal.getIndirizzo());
                indirizzoOrario_salita.setOrario(fermata_sal.getOrario());
                indirizzoOrario_salita.setDescrizione(fermata_sal.getDescrizione());
                indirizzoOrario_salita.setFermataID(fermata_sal.getId());//.toHexString());

                try {
                    map.get(indirizzoOrario_salita)
                            .get("salita").add(new Presenza(prenotazione.getBambino(),
                            prenotazione.isSalito(),
                            prenotazione.getId(),//.toHexString(),
                            prenotazione.isPrenotatoDaGenitore()));
                } catch (Exception ignored) {
                }

                IndirizzoOrario indirizzoOrario_discesa = new IndirizzoOrario();
                indirizzoOrario_discesa.setIndirizzo(fermata_disc.getIndirizzo());
                indirizzoOrario_discesa.setOrario(fermata_disc.getOrario());
                indirizzoOrario_discesa.setDescrizione(fermata_disc.getDescrizione());
                indirizzoOrario_discesa.setFermataID(fermata_disc.getId());//.toHexString());

                try {
                    map.get(indirizzoOrario_discesa)
                            .get("discesa").add(new Presenza(prenotazione.getBambino(),
                            prenotazione.isSceso(),
                            prenotazione.getId(),//.toHexString(),
                            prenotazione.isPrenotatoDaGenitore()));
                } catch (Exception ignored) {
                }
            }
        }
    }

    /**
     * Metodo per la costruzione del JSON da inviare all'accompagnatore per il resoconto delle presenze e delle
     * prenotazioni
     * **/
    private void fillPresenzeInformations(String direzione,
                                          Corsa corsa,
                                          Linea linea,
                                          LinkedHashMap<String, Object> result,
                                          LinkedHashMap<String,
                                                  LinkedHashMap<IndirizzoOrario,
                                                          LinkedHashMap<String, ArrayList<Presenza>>>>
                                                  lineaAndataRitorno,
                                          List<UserIdBambino> userIdBambinoList,
                                          FermataPartenzaArrivo fermataPartenzaArrivo) {
        // Ritorno le prenotazioni associate a questa corsa
        List<Prenotazione> listReservation = prenotazioneRepository.findByCorsaId(corsa.getId_obj());

        // Costruisco le mappe per contenere le fermate di andata e di ritorno
        LinkedHashMap<IndirizzoOrario, LinkedHashMap<String, ArrayList<Presenza>>>
                fermataSalitaDiscesa = new LinkedHashMap<>();


        lineaAndataRitorno.put(direzione, fermataSalitaDiscesa);

        // Estraggo le fermate di ritorno per questa linea
        List<Fermata> fermate;

        if (direzione.equals("andata"))
            fermate = linea.getFermate_andata();
        else
            fermate = linea.getFermate_ritorno();

        // Creo due mappe per ciascuna stazione
        initializeSalitaDiscesaMap(fermataSalitaDiscesa, fermate);


        // Estraggo le informazioni dalle prenotazioni di ritorno
        fillMappaPresenza(fermataSalitaDiscesa, listReservation);


        List<FermataSalitaDiscesa> list =
                lineaAndataRitorno.get(direzione).entrySet().stream()
                        .map(entry -> {
                            try {
                                return new FermataSalitaDiscesa(
                                        entry.getKey().getIndirizzo(),
                                        entry.getKey().getDescrizione(),
                                        entry.getValue().get("salita"),
                                        entry.getValue().get("discesa"),
                                        entry.getKey().getOrario(),
                                        entry.getKey().getFermataID(),
                                        fermataPartenzaArrivo
                                                .verificaFermataIntervallo(fermataService.getFermataById(
                                                        entry.getKey().getFermataID()))
                                );
                            } catch (Exception e) {
                                e.printStackTrace();
                                return null;
                            }
                        }).collect(Collectors.toList());

        result.put(direzione, list);

        // TODO: verificare che la lista delle prenotazioni di una certa data e per una certa direzione funzioni
        // prima di fare commit
        // Prendo tutte le corse associate alla direzione ed alla data, in modo che un bambino prenotato per una certa
        // linea non compaia come 'non prenotato' ad un admin di un'altra linea
        List<Corsa> corseDirezione = corsaRepository.findByDataAndDirezione(corsa.getData(), corsa.getDirezione());
        List<Prenotazione> prenotazioniAll = new ArrayList<>();
        for(Corsa c : corseDirezione)
            prenotazioniAll.addAll(prenotazioneRepository.findByCorsaId(c.getId_obj()));

        // Lista dei bambini non prenotati per il viaggio di ritorno ed ID del rispettivo genitore
//        List<UserIdBambino> bambiniNonPrenotatiRitorno = getBambiniNonPrenotatiArray(userIdBambinoList,
//                listReservation);
        List<UserIdBambino> bambiniNonPrenotatiRitorno = getBambiniNonPrenotatiArray(userIdBambinoList,
                prenotazioniAll);

        result.put("non-prenotati-" + direzione, bambiniNonPrenotatiRitorno);

        if (direzione.equals("andata"))
            result.put("corsa-completata-" + direzione, corsa.isStatoCorsa());
        else
            result.put("corsa-partita-" + direzione, corsa.isStatoCorsa());
    }


    /**
     * Questo metodo serve per marcare un bambino come presente, dato l'ID della sua prenotazione,
     * il nome del bambino ed un riferimento alla corsa
     *
     * @param salitoSceso 0 significa salita, 1 significa discesa
     * @param azione      indica se si vuole affermare o negare l'azione di salita o di discesa
     *                    0 per desegnalare il bambino come salito/sceso,
     *                    1 per segnalare il bambino come salito/sceso
     **/
    public void segnalaPresenzaBambino(String prenotazioneId,
                                       String nomeBambino,
                                       int salitoSceso,
                                       boolean azione,
                                       String nomeLinea,
                                       Date dataString,
                                       String userId) throws Exception {

        Optional<Prenotazione> prenotazioneOptional = prenotazioneRepository.findById(new ObjectId(prenotazioneId));
        if (!prenotazioneOptional.isPresent())
            throw new Exception("Prenotazione inesistente");

        // Converto la data in stringa
        String data = new SimpleDateFormat("dd-MM-yyyy").format(dataString);

        // Estraggo la prenotazione
        Prenotazione prenotazione = prenotazioneOptional.get();

        // Controllo che la prenotazione sia riferita a questo bambino
        if (!prenotazione.getBambino().equals(nomeBambino))
            throw new Exception("Segnalazione presenza non permessa");

        // Controllo la correttezza della data e della linea
        Optional<Corsa> corsaOptional = corsaRepository.findById(prenotazione.getCorsaId());

        if (!corsaOptional.isPresent())
            throw new Exception("Corsa non esistente");

        // Estraggo la corsa
        Corsa corsa = corsaOptional.get();

        // Controllo che la corsa non sia stata segnalata come già terminata dall'accompagnatore (sola andata)
        if (corsa.isStatoCorsa() && corsa.getDirezione() == 0)
            throw new Exception("Impossibile apportare modifiche alle presenze in quanto la corsa è terminata.");

        // Controllo la data
        if (!corsa.getData().equals(data))
            throw new Exception("Corsa non esistente per questa data");

        Optional<Linea> lineaOptional = lineaRepository.findById(new ObjectId(corsa.getLineaId()));

        if (!lineaOptional.isPresent())
            throw new Exception("Linea inesistente");

        // Estraggo la linea
        Linea linea = lineaOptional.get();

        // Controllo che la linea passata sia riferita alla prenotazione
        if (!nomeLinea.equals(linea.getNome()))
            throw new Exception("Nome linea non valido");

        // Verifico che questo user sia associato ad un turno
        FermataPartenzaArrivo fermataPartenzaArrivo =
                turnoService.checkTurnoByCorsaAndUser(corsa, userService.verificaEsistenzaUser(userId));

        // Se l'azione corrisponde ad una discesa si deve verificare che la salita sia già stata segnata
        switch (salitoSceso) {
            case 0:
                // Non è possibile deselezionare il bambino dalla salita se è segnato come sceso
                if (prenotazione.isSceso() && !azione)
                    throw new Exception("Deselezionare la salita del bambino prima di deselezionarne la discesa");

                // Verifico che questo accompagnatore abbia diritto di effettuare questa operazione
                if (!fermataPartenzaArrivo.verificaFermataIntervallo(prenotazione.getFermataSalita()))
                    throw new Exception("L'operazione richiesta si svolge su una fermata esterna al turno");

                prenotazione.setSalito(azione);
                break;
            case 1:
                // Se il bambino non è stato segnato come salito non può essere segnato come sceso
                if (!prenotazione.isSalito() && azione)
                    throw new Exception("Il bambino non è stato segnato come presente alla salita");

                // Verifico che questo accompagnatore abbia diritto di effettuare questa operazione
                if (!fermataPartenzaArrivo.verificaFermataIntervallo(prenotazione.getFermataDiscesa()))
                    throw new Exception("L'operazione richiesta si svolge su una fermata esterna al turno");

                // Altrimenti lo marco come sceso
                prenotazione.setSceso(azione);

                // TODO: qui devo controllare quanti bambini devono ancora scendere. Se sono scesi tutti devo
                // segnare la corsa come completata
                break;
            default:
                throw new Exception("Azione non valida");
        }
        prenotazioneRepository.save(prenotazione);
        sendComunicazioneGenitore(salitoSceso, azione, nomeBambino, prenotazione);

        // Notifico agli altri accompagnatori che lo stato di un bambino è appena cambiato
        sendAggiornamentoPresenzaRealTime(salitoSceso, azione, nomeBambino, prenotazione, userId);
    }

    /**
     * Permette ad un accompagnatore di marcare una corsa come conclusa. In questo modo tutti i bambini segnati
     * come saliti per questa corsa vengono segnati come scesi e le relative comunicazioni vengono inviate alle
     * famiglie
     **/
    public void setCorsaCompletata(CorsaDTO corsaDTO,
                                   String userId) throws Exception {

        // Converto la data in stringa
        String data = new SimpleDateFormat("dd-MM-yyyy").format(corsaDTO.getDate());

        Corsa corsa = corsaService.getCorsaByDataDirezioneLinea(
                data,
                corsaDTO.getDirezione(),
                lineaService.getLineaByNome(corsaDTO.getNome_linea()).getId_obj());

        // Verifico che questo user sia associato ad un turno
        FermataPartenzaArrivo fermataPartenzaArrivo =
                turnoService.checkTurnoByCorsaAndUser(corsa, userService.verificaEsistenzaUser(userId));

        // Verifico se questo accompagnatore ha diritto di cambiare lo stato della corsa
        // ANDATA
        if (corsa.getDirezione() == 0) {
            if (!fermataPartenzaArrivo.verificaFermataIntervallo(
                    lineaService.getLineaById(corsa.getLineaId()).getFermate_andata().get(
                            lineaService.getLineaById(corsa.getLineaId()).getFermate_andata().size() - 1
                    )))
                throw new Exception("Impossibile effettuare l'operazione per mancanza di diritti");
        }

        // RITORNO
        else{
            if (!fermataPartenzaArrivo.verificaFermataIntervallo(
                    lineaService.getLineaById(corsa.getLineaId()).getFermate_ritorno().get(0)))
                throw new Exception("Impossibile effettuare l'operazione per mancanza di diritti");
        }

        if (corsa.isStatoCorsa())
            throw new Exception("Questa corsa è già terminata oppure è già partita");

        for (Turno turno : turnoService.getTurniByCorsa(corsa)) {
            Corsa c = turno.getCorsa();
            c.setStatoCorsa(true);
            turno.setCorsa(c);
            turnoRepository.save(turno);
        }

        // Rendo persistente lo stato della corsa e del turno associato
        corsa.setStatoCorsa(true);
        corsaRepository.save(corsa);

        // Tutti i bambini saliti per questa corsa devono essere segnati come arrivati
        List<Prenotazione> prenotazioni = prenotazioneRepository.findByCorsaId(corsa.getId_obj());

        // Costruisco l'istanza di classe contenente le informazioni sul cambio di stato della corsa
        PresenzaUpdateStatoCorsaDTO presenzaUpdateStatoCorsaDTO = new PresenzaUpdateStatoCorsaDTO();
        presenzaUpdateStatoCorsaDTO.setData(data);
        presenzaUpdateStatoCorsaDTO.setDirezione(corsa.getDirezione());
        presenzaUpdateStatoCorsaDTO.setLinea(lineaService.getLineaById(corsa.getLineaId()).getNome());

        // Corsa d'andata
        if (corsaDTO.getDirezione() == 0) {

            // Setto l'azione per segnalare all'accompagnatore che la corsa di andata è terminata
            presenzaUpdateStatoCorsaDTO.setAzione("CORSA_COMPLETATA_ANDATA");

            for (Prenotazione p : prenotazioni) {
                if (p.isSalito()) {
                    p.setSceso(true);
                    prenotazioneRepository.save(p);

                    // Informo il genitore del fatto che il figlio è stato preso in carico
                    comunicazioneService.nuovaComunicazione(p.getUserId().toHexString(),
                            "Suo/a figlio/a " + p.getBambino() + " è appena arrivato alla fermata " +
                                    p.getFermataDiscesa().getDescrizione() + ".", "Aggiornamento corsa pedibus");
                } else {
                    // Informo il genitore che la corsa del pedibus è terminata, ma il figlio non era presente
                    // alla fermata di salita indicata nella prenotazione
                    comunicazioneService.nuovaComunicazione(p.getUserId().toHexString(),
                            "La informiamo che la corsa di " + (corsa.getDirezione() == 0 ? "andata" : "ritorno") +
                                    " è terminata. Suo figlio " + p.getBambino() + " non è risultato presente alla fermata " +
                                    p.getFermataSalita().getDescrizione() + " nonostante la prenotazione fosse presente.",
                            "Aggiornamento corsa pedibus");
                }
            }
        }

        // Corsa di ritorno
        else {

            // Setto l'azione per segnalare all'accompagnatore che la corsa di ritorno è partita
            presenzaUpdateStatoCorsaDTO.setAzione("CORSA_PARTITA_RITORNO");

            for (Prenotazione p : prenotazioni) {
                p.setSalito(true);
                prenotazioneRepository.save(p);

                // Informo il genitore del fatto che il figlio è stato preso in carico
                comunicazioneService.nuovaComunicazione(p.getUserId().toHexString(),
                        "Suo/a figlio/a " + p.getBambino() + " è stato preso in carico alla fermata " +
                                p.getFermataSalita().getDescrizione() + ".", "Aggiornamento corsa pedibus");
            }
        }

        List<String> accompagnatoriInTurnoIds = turnoService.getTurniByCorsa(
                corsa)
                .stream()
                .map(Turno::getUser)
                .map(User::getId)
                .filter(id -> !id.equals(userId))
                .distinct()
                .collect(Collectors.toList());

        for (String id : accompagnatoriInTurnoIds)
            comunicazioneService.nuovaComunicazioneRealTime(id, presenzaUpdateStatoCorsaDTO, "presenze");
    }


    /**
     * Metodo usato per aggiungere una nuova prenotazione nella base dati
     **/
    public Prenotazione addReservation(PrenotazioneDTO prenotazioneDTO,
                                       String nomeLinea,
                                       boolean prenotatoDaGenitore,
                                       String loggedUserId) throws Exception {

        // Controllo che l'id dello user associato alla prenotazione non sia nullo
        if (prenotazioneDTO.getUserId() == null)
            throw new Exception("Utente non specificato");
        else {

            if (prenotazioneDTO.getDate() == null)
                throw new Exception("Data non specificata o malformata");

            Linea linea = lineaService.getLineaByNome(nomeLinea);

            // Verifico la correttezza delle informazioni sullo user
            User user = userService.verificaEsistenzaUser(prenotazioneDTO.getUserId());
            checkUserInfos(user, prenotazioneDTO.getBambino());

            // Ritorno l'id che identifica la nuova prenotazione
            return nuovaPrenotazione(prenotazioneDTO, user, linea, prenotatoDaGenitore, loggedUserId);
        }
    }

    /**
     * Metodo per aggiornare una prenotazione esistente. Come per il metodo precedente dovranno essere fatti
     * dei controlli prima di validare i dati forniti dall'utente
     **/
    @Override
    public void updateReservation(PrenotazioneDTO prenotazioneDTO, String nomeLinea) throws Exception {
        // Controllo che l'id della prenotazione non sia nullo
        if (prenotazioneDTO.getUserId() == null)
            throw new Exception("Utente non specificato");
        else {
            // Verifico la correttezza delle informazioni sullo user
            User user = userService.verificaEsistenzaUser(prenotazioneDTO.getUserId());
            checkUserInfos(user, prenotazioneDTO.getBambino());

            aggiornaPrenotazione(prenotazioneDTO, user.getId(), nomeLinea);
        }
    }

    /**
     * Metodo utilizzato per la cancellazione di una prenotazione esistente
     **/
    @Override
    public void deleteReservation(String reservation_id, String userId) throws Exception {
        // Controllo che la prenotazione esista
        Prenotazione prenotazione = checkReservation(reservation_id);

        // Controllo che la prenotazione sia stata fatta dallo user attualmente loggato
        if (!prenotazione.getUserId().toHexString().equals(userId))
            throw new Exception("Utente con privilegi insufficienti per effettuare l'operazione");

        // Verifico che ci sia ancora tempo per effettuare questa cancellazione, altrimenti sollevo un'eccezione
        TimestampChecker.verificaOrario(TimestampChecker.concatDate(
                corsaService.verificaEsistenzaCorsaById(prenotazione.getCorsaId()).getData(),
                fermataService.getOraPassaggioByFermataId(prenotazione.getFermataSalita().getId())));

        // Cancello la prenotazione indicata
        prenotazioneRepository.deleteById(prenotazione.getId_obj());

        // Comunico a tutti gli accompagnatori in turno che una nuova prenotazione è stata creata
        Corsa corsa = corsaService.verificaEsistenzaCorsaById(prenotazione.getCorsaId());
        PrenotazioneDTO prenotazioneDTO = new PrenotazioneDTO();
        prenotazioneDTO.setByReservation(prenotazione, corsa);
//        PrenotazioneDTO prenotazioneDTO = new PrenotazioneDTO();
//        prenotazioneDTO.setReservationId(prenotazione.getId());
//        prenotazioneDTO.setUserId(prenotazione.getUserId().toHexString());
//        prenotazioneDTO.setDirezione(corsa.getDirezione());
//
//        // Converto la data in long
//        SimpleDateFormat sdf = new SimpleDateFormat("dd-MM-yyyy");
//        Date date = sdf.parse(corsa.getData());
//        long data = date.getTime();
//        prenotazioneDTO.setDate(data);
//
//        prenotazioneDTO.setBambino(prenotazione.getBambino());
//        prenotazioneDTO.setFermataSalita(prenotazione.getFermataSalita().getId());
//        prenotazioneDTO.setFermataDiscesa(prenotazione.getFermataDiscesa().getId());

        // Inoltro le informazioni agli accompagnatori
        sendAggiornamentoNuovaPrenotazioneRealTime(prenotazione.isPrenotatoDaGenitore(),
                lineaService.getLineaById(corsa.getLineaId()).getNome(), null, prenotazioneDTO,
                null, corsa, "DELETE_PRENOTAZIONE", userId);

    }

    /**
     * Ritorna tutte le informazioni riguardanti la prenotazione richiesta
     **/
    @Override
    public LinkedHashMap<String, Object> getReservation(String nome_linea,
                                                        long date,
                                                        String reservation_id) throws Exception {

        // Controllo che la prenotazione con l'id dato esista
        Optional<Prenotazione> prenotazioneOptional = prenotazioneRepository.findById(new ObjectId(reservation_id));
        if (!prenotazioneOptional.isPresent())
            throw new Exception("Prenotazione inesistente");

        // Estraggo la prenotazione
        Prenotazione res = prenotazioneOptional.get();

        // Istanzio la mappa
        LinkedHashMap<String, Object> map = new LinkedHashMap<>();
        map.put("id", res.getId());//.toHexString());
        map.put("fermata_salita", res.getFermataSalita());
        map.put("fermata_discesa", res.getFermataDiscesa());

        // Controllo che la corsa associata alla prenotazione sia valida
        Optional<Corsa> corsa = corsaRepository.findById(res.getCorsaId());
        if (!corsa.isPresent())
            throw new Exception("Prenotazione non valida");

        // Inserisco i dati sulla corsa
        map.put("corsa", corsa.get());

        // Inserisco i dati sul bambino da trasportare: il suo nome e lo stato di salita e discesa
        map.put("bambino", res.getBambino());
        map.put("salita_stato", res.isSalito());
        map.put("discesa_stato", res.isSceso());

        // Ritorno la mappa che il controller dovrà inviare al client
        return map;
    }

    /**
     * Questo metodo serve per ritornare tutte le prenotazioni associate ad uno specifico bambino ed ad una
     * specifica linea. Inoltre, devono essere recuperate tutte le prenotazioni comprese tra la data fornita
     * ed una settimana in avanti
     **/
    @Override
    public LinkedHashMap<String, Object> getReservationByLineaBambinoWeek(
            String userId,
            Long date,
            String bambino)
            throws Exception {

        User user = userService.verificaEsistenzaUser(userId);
        checkUserInfos(user, bambino);

        // Prendo le date associate alle corse
        List<String> dateCorse = corsaService.getDataCorse();
        //LinkedList<String> dateCorse = CsvScanner.read("csv_files/corse.csv");

        LinkedHashMap<String, Object> map = corsaService.getMapCorseWeek(date, user.getId());

        // Ciascuna entry del JSON, al più due prenotazioni per ciascuna data
        Map<String, List<PrenotazioneNomeLinea>> prenotazioniByData = new LinkedHashMap<>();

        // Ciclo tutte le date alla ricerca di disponibilità
        for (String data : dateCorse) {

            // Controllo che la data sia contenuta nella settimana
            if (!corsaService.isDataCorsaCompresa(data, date))
                continue;

            // List di al più due disponibilità giornaliere
            LinkedList<PrenotazioneNomeLinea> prenotazioniList = new LinkedList<>();

            // Andata
            getPrenotazioniWeekByData(prenotazioniList, data, 0, bambino);

            // Ritorno
            getPrenotazioniWeekByData(prenotazioniList, data, 1, bambino);

            // Inserisco la lista delle disponibilità all'interno del JSON finale
            prenotazioniByData.put(data, prenotazioniList);

        }

        map.put("prenotazioni", prenotazioniByData);
        return map;
    }

    /**
     * Ritorno una lista contenente informazioni sulle prenotazioni di un certo bambino, in una certa data
     * e per una certa direzione
     **/
    private void getPrenotazioniWeekByData(LinkedList<PrenotazioneNomeLinea> list,
                                           String data,
                                           int direzione,
                                           String bambino) {

        List<ObjectId> corse = corsaRepository.findByDataAndDirezione(data, direzione)
                .stream()
                .map(Corsa::getId_obj)
                .collect(Collectors.toList());

        List<Prenotazione> prenotazioneListAndata = prenotazioneRepository.findByCorsaIdInAndBambinoOrderByCorsaId(
                corse, bambino
        );

        try {
            // Dovrebbe essercene al più una sola
            Prenotazione prenotazione = prenotazioneListAndata.get(0);

            // Estraggo l'informazione sulla corsa e poi sulla linea
            Corsa corsa = corsaRepository.findById(prenotazione.getCorsaId()).get();

            // Estraggo la linea e di conseguenza il suo nome
            Linea linea = lineaRepository.findById(new ObjectId(corsa.getLineaId())).get();

            // Costruisco l'oggetto che racchiude le info sulla prenotazione e sul nome della linea
            PrenotazioneNomeLinea prenotazioneNomeLinea = new PrenotazioneNomeLinea();
            prenotazioneNomeLinea.setNome_linea(linea.getNome());
            prenotazioneNomeLinea.setPrenotazione_dettaglio(prenotazione);

            // Aggiungo alla lista delle prenotazioni di questa data
            list.add(prenotazioneNomeLinea);
        } catch (Exception e) {
            list.add(null);
        }

    }


    /**
     * Metodo per verificare se l'utente esiste, è abilitato ed ha un bambino con il nome indicato
     **/
    private void checkUserInfos(User user, String bambino) throws Exception {

        // Controllo che lo user sia abilitato, altrimenti non può fare prenotazioni
        if (user.getStato() != User.STATO.ABILITATO)
            throw new Exception("Utente non abilitato all'operazione");
        else {
            // Lo user è abilitato, verifico che abbia un figlio con questo nome
            if (!user.getBambini().contains(bambino))
                throw new Exception("Bambino non associato all'utente indicato");
            //else
            // Lo user soddisfa tutti i requisiti, perciò lo restituisco al chiamante
            //return user;
        }

    }

    /**
     * Metodo per verificare che le informazioni sulle fermate associate alla prenotazione siano corrette
     **/
    private void checkStopsInfos(Fermata fermataSalita, Fermata fermataDiscesa, Linea linea) throws Exception {
        // Verifico se queste due fermate esistono
//        Optional<Fermata> fermataSalita = fermataRepository.findById(new ObjectId(prenotazioneDTO.getFermataSalita()));
//        Optional<Fermata> fermataDiscesa = fermataRepository.findById(new ObjectId(prenotazioneDTO.getFermataDiscesa()));

        // Se almeno una delle due non esiste devo uscire immediatamente
//        if (!fermataSalita.isPresent() || !fermataDiscesa.isPresent())
//            throw new Exception("Fermate non valide");

        // Verifico che le due fermate non coincidano, altrimenti va impedita la prenotazione
        if (fermataSalita.getId()
                .equals(fermataDiscesa.getId()))
            throw new Exception("Le fermate coincidono");

        // Verifico che le fermate siano associate alla linea indicata
        if(!fermataSalita.getLinea().getId().equals(linea.getId())
                || !fermataDiscesa.getLinea().getId().equals(linea.getId()))
            throw new Exception("Le fermate indicate non fanno parte della linea specificata");

        // Verifico che le fermate facciano parte della stessa linea
        if (!fermataSalita.getLinea().getId()//.toHexString()
                .equals(fermataDiscesa.getLinea().getId()))//.toHexString()))
            throw new Exception("Fermate di linee diverse");

        // Controllo la sequenzialità delle fermate per mezzo del loro ID, che viene automaticamente generato
        // sequenziale da Mongo
        if (fermataSalita.getId().compareTo(fermataDiscesa.getId()) >= 0)
            throw new Exception("Le fermate non sono sequenziali");

        // return fermataSalita.get().getLinea().getId_obj();
    }

    /**
     * Metodo che aggiunge effettivamente la nuova prenotazione al DB, ritornando il codice univoco
     **/
    private Prenotazione nuovaPrenotazione(PrenotazioneDTO prenotazioneDTO,
                                           User user,
                                           Linea linea,
                                           boolean prenotatoDaGenitore,
                                           String loggedUserId) throws Exception {
        // Converto l'oggetto date fornito dallo user in una stringa concorde con il formato dei dati nel DB
        String date_ = new SimpleDateFormat("dd-MM-yyyy").format(prenotazioneDTO.getDate());

        // Verifico che la direzione sia stata settata nella richiesta
        if (prenotazioneDTO.getDirezione() == null)
            throw new Exception("Direzione non indicata o non valida");

        // Verifico che esista una corsa associata alle info arrivate dal client
        Corsa corsa = corsaRepository.findByDataAndDirezioneAndLineaId(date_, prenotazioneDTO.getDirezione(),
                linea.getId_obj());

        // L'utente potrebbe star tentando di registrarsi per una corsa non prevista. Deve essere impedito.
        if (corsa == null)
            throw new Exception("Prenotazione riferita ad una corsa non valida");

        // Cerco una prenotazione associata alla corsa ed al bambino indicati
        ObjectId userId = new ObjectId(user.getId());

        // Adesso controllo che questo bambino non sia già stato prenotato per lo stesso giorno, stessa direzione
        // ma linea diversa
        List<Corsa> corseStessaData = corsaService.getCorseByDataAndDirezione(date_, prenotazioneDTO.getDirezione());
        for (Corsa c : corseStessaData) {
            Prenotazione p = prenotazioneRepository.findByCorsaIdAndBambino(c.getId_obj(),
                    prenotazioneDTO.getBambino());
            if (p != null)
                if (p.getUserId().equals(userId))
                    if (p.getBambino().equals(prenotazioneDTO.getBambino()))
                        throw new Exception("Prenotazione duplicata o già presente per una linea diversa in contemporanea");
        }


        // La fermata di salita potrebbe essere nulla. In questo caso estraggo l'ID della scuola per l'andata
        Fermata fermataSalita;
        Fermata fermataDiscesa;

        fermataSalita = compileFermatePrenotazioni(prenotazioneDTO, corsa, linea, 0);
        fermataDiscesa = compileFermatePrenotazioni(prenotazioneDTO, corsa, linea, 1);

        checkStopsInfos(fermataSalita, fermataDiscesa, linea);

        if (prenotatoDaGenitore) {
            assert prenotazioneDTO.getDate() != null;
            TimestampChecker.verificaOrario(TimestampChecker.concatDate(
                    new SimpleDateFormat("dd-MM-yyyy").format(prenotazioneDTO.getDate()),
                    fermataService.getOraPassaggioByFermataId(fermataSalita.getId())));
        }
        else{
            // TODO: devo controllare che questo utente admin abbia diritto di far salire qui il bambino
            // Verifico che questo user sia associato ad un turno
            FermataPartenzaArrivo fermataPartenzaArrivo =
                    turnoService.checkTurnoByCorsaAndUser(corsa,
                            userService.verificaEsistenzaUser(loggedUserId));
            if(!fermataPartenzaArrivo.verificaFermataIntervallo(fermataSalita))
                throw new Exception("Impossibile completare la richiesta per mancanza di diritti.");
        }

        // Tutti i controlli hanno dato esito positivo: creo la prenotazione
        Prenotazione prenotazione1 = new Prenotazione();
        prenotazione1.setUserId(userId);
        prenotazione1.setBambino(prenotazioneDTO.getBambino());
        prenotazione1.setFermataSalita(fermataSalita);
        prenotazione1.setFermataDiscesa(fermataDiscesa);

        // Se la prenotazione viene fatta dall'accompagnatore setto immediatamente il bambino come presente
        // alla fermata di salita
        if (!prenotatoDaGenitore)
            prenotazione1.setSalito(true);
        else
            prenotazione1.setSalito(false);

        prenotazione1.setSceso(false);
        prenotazione1.setCorsaId(corsa.getId_obj());
        prenotazione1.setPrenotatoDaGenitore(prenotatoDaGenitore);

        // Ritorno l'id della prenotazione appena creata
        Prenotazione p = prenotazioneRepository.save(prenotazione1);

        if (!prenotatoDaGenitore) {
            // Invio comunicazione al genitore per informarlo che il figlio (o la figlia) è stato preso
            // in carico nonostante non fosse stato prenotato in anticipo
            comunicazioneService.nuovaComunicazione(userId.toHexString(),
                    "Suo/a figlio/a " + prenotazione1.getBambino() + " è stato preso in carico alla fermata " +
                            prenotazione1.getFermataSalita().getDescrizione() + " perchè lì presente al momento del passaggio " +
                            "del pedibus. Si ricorda che è importante effettuare le prenotazioni con anticipo per permettere" +
                            " agli amministratori di assegnare un numero di accompagnatori congruo al numero di bambini.",
                    "Aggiornamento corsa pedibus");
        }

        // Comunico a tutti gli accompagnatori in turno che una nuova prenotazione è stata creata
        prenotazioneDTO.setReservationId(p.getId());
        sendAggiornamentoNuovaPrenotazioneRealTime(prenotatoDaGenitore, linea.getNome(), null, prenotazioneDTO,
                null, corsa, "NUOVA_PRENOTAZIONE", loggedUserId);

        return p;
    }

    /**
     * Metodo per riempire i campi fermata della prenotazione. Controlla che non ci siano fermate nulle.
     * Nel caso, identifica in automatico la fermata scuola di arrivo per la corsa di andata e la fermata scuola
     * di partenza per la corsa di ritorno
     **/
    private Fermata compileFermatePrenotazioni(PrenotazioneDTO prenotazioneDTO,
                                               Corsa corsa,
                                               Linea linea,
                                               int direzione) throws Exception {
        // La fermata di salita potrebbe essere nulla. In questo caso estraggo l'ID della scuola per l'andata
        Fermata fermataSalita;
        Fermata fermataDiscesa;

        if ((prenotazioneDTO.getFermataSalita() == null || prenotazioneDTO.getFermataSalita().equals("")) &&
                (prenotazioneDTO.getFermataDiscesa() == null || prenotazioneDTO.getFermataDiscesa().equals("")))
            throw new Exception("Non è possibile lasciare vuoti entrambi i campi fermata");

        if (direzione == 0) {
            if (prenotazioneDTO.getFermataSalita() == null || prenotazioneDTO.getFermataSalita().equals("")) { // significa che dobbiamo essere per una corsa di ritorno
                if (corsa.getDirezione() != 1)
                    throw new Exception("Per le corse di andata è necessario indicare la fermata di salita.");
                // int size = linea.getFermate_ritorno().size() - 1;
                String idFermataScuolaRitorno = linea.getFermate_ritorno().get(0).getId();
                fermataSalita = fermataService.getFermataById(idFermataScuolaRitorno);
            } else
                fermataSalita = fermataService.getFermataById(prenotazioneDTO.getFermataSalita());
            return fermataSalita;
        } else {
            // La fermata di discesa potrebbe essere nulla. In questo caso estraggo l'ID della scuola per il ritorno
            if (prenotazioneDTO.getFermataDiscesa() == null || prenotazioneDTO.getFermataDiscesa().equals("")) { // significa che dobbiamo essere per una corsa di ritorno
                if (corsa.getDirezione() != 0)
                    throw new Exception("Per le corse di ritorno è necessario indicare la fermata di discesa.");
                int size = linea.getFermate_ritorno().size() - 1;
                String idFermataScuolaAndata = linea.getFermate_andata().get(size).getId();
                fermataDiscesa = fermataService.getFermataById(idFermataScuolaAndata);
            } else
                fermataDiscesa = fermataService.getFermataById(prenotazioneDTO.getFermataDiscesa());
            return fermataDiscesa;
        }
    }

    /**
     * Metodo utilizzato per verificare l'esistenza della prenotazione associata all'ID fornito
     **/
    private Prenotazione checkReservation(String prenotazioneId) throws Exception {
        // Verifico che l'id della prenotazione non sia nullo, come ulteriore controllo
        if (prenotazioneId == null)
            throw new Exception("Prenotazione non valida");

        // Verifico che la prenotazione con l'id fornito esista
        Optional<Prenotazione> prenotazione = prenotazioneRepository.findById(
                new ObjectId(prenotazioneId));

        if (!prenotazione.isPresent())
            throw new Exception("Prenotazione inesistente");

        return prenotazione.get();
    }


    /**
     * Metodo interno per l'aggiornamento di una prenotazione. Viene verificata la consistenza
     * e la correttezza dei dati, dopodichè avviene l'aggiornamento
     **/
    private void aggiornaPrenotazione(PrenotazioneDTO prenotazioneDTO,
                                      String userId, String nome_linea) throws Exception {
        assert prenotazioneDTO.getReservationId() != null;
        Optional<Prenotazione> prenotazioneOptional = prenotazioneRepository
                .findById(new ObjectId(prenotazioneDTO.getReservationId()));

        // Se la prenotazione non esiste sollevo un'eccezione
        if (!prenotazioneOptional.isPresent())
            throw new Exception("Prenotazione inesistente");

        // Verifico che sia stata indicata la direzione
        if(prenotazioneDTO.getDirezione() == null)
            throw new Exception("Indicare la direzione della corsa");

        // Estraggo l'oggetto prenotazione dal DB
        Prenotazione prenotazione = prenotazioneOptional.get();

        // Costruisco l'oggetto PrenotazioneDTO vecchio per segnalare la modifica all'accompagnatore
        PrenotazioneDTO prenotazioneDTOOld = new PrenotazioneDTO();
        Corsa corsaOld = corsaService.verificaEsistenzaCorsaById(prenotazione.getCorsaId());
        String lineaOld = lineaService.getLineaById(corsaOld.getLineaId()).getNome();
        prenotazioneDTOOld.setByReservation(prenotazione, corsaOld);

        // Verifico che questa prenotazione sia dello user che ha fatto la richiesta
        if (!prenotazione.getUserId().toHexString().equals(userId))
            throw new Exception("Utente non abilitato alla modifica della prenotazione");

        // Verifico che il bambino della prenotazione corrisponda a quello della richiesta
        if (!prenotazione.getBambino().equals(prenotazioneDTO.getBambino()))
            throw new Exception("Il bambino indicato non corrisponde a quello della prenotazione");

        Fermata fermataSalita, fermataDiscesa;

        // Estraggo la corsa e linea associate alla modifica
        Linea linea = lineaService.getLineaByNome(nome_linea);
        Corsa corsa = corsaService.getCorsaByDataDirezioneLinea(
                corsaService.verificaEsistenzaCorsaById(prenotazione.getCorsaId()).getData(),
                prenotazioneDTO.getDirezione(),
                linea.getId_obj());

        fermataSalita = compileFermatePrenotazioni(prenotazioneDTO, corsa, linea, 0);
        fermataDiscesa = compileFermatePrenotazioni(prenotazioneDTO, corsa, linea, 1);

        checkStopsInfos(fermataSalita, fermataDiscesa, linea);

        // Verifico che ci sia ancora tempo per effettuare questa modifica, altrimenti sollevo un'eccezione
        TimestampChecker.verificaOrario(TimestampChecker.concatDate(
                corsa.getData(),
                fermataService.getOraPassaggioByFermataId(fermataSalita.getId())));

        // Solo i seguenti campi sono accettati per la modifica
        // In caso si volesse cambiare bambino si dovrebbe cancellare la prenotazione e rifarla
        prenotazione.setCorsaId(corsa.getId_obj());
        prenotazione.setFermataSalita(fermataSalita);
        prenotazione.setFermataDiscesa(fermataDiscesa);
        prenotazione.setSalito(false);
        prenotazione.setSceso(false);
        //prenotazione.setCorsaId(corsa.getId_obj());

        Prenotazione prenotazioneNew = prenotazioneRepository.save(prenotazione);
        PrenotazioneDTO prenotazioneDTONew = new PrenotazioneDTO();
        prenotazioneDTONew.setByReservation(prenotazioneNew, corsa);

        // Comunico a tutti gli accompagnatori la modifica di questa prenotazione per fare in modo che la loro
        // grafica venga aggiornata in tempo reale
        // Inoltro le informazioni agli accompagnatori
        sendAggiornamentoNuovaPrenotazioneRealTime(prenotazione.isPrenotatoDaGenitore(),
                lineaService.getLineaById(corsa.getLineaId()).getNome(), lineaOld, prenotazioneDTONew,
                prenotazioneDTOOld, corsa, "UPDATE_PRENOTAZIONE", userId);

    }

    /**
     * Metodo di servizio per cancellare tutte le prenotazioni esistenti
     **/
    public void deleteAll() {
        prenotazioneRepository.deleteAll();
    }

    /**
     * This method initializes maps related to each station in which we can see people related
     **/
    private void initializeSalitaDiscesaMap(
            LinkedHashMap<IndirizzoOrario, LinkedHashMap<String, ArrayList<Presenza>>> fermataSalitaDiscesa,
            List<Fermata> fermateAndata) {

        for (Fermata f : fermateAndata) {
            LinkedHashMap<String, ArrayList<Presenza>> salita_discesa = new LinkedHashMap<>();
            salita_discesa.put("salita", new ArrayList<>());
            salita_discesa.put("discesa", new ArrayList<>());

            IndirizzoOrario indirizzoOrario = new IndirizzoOrario();
            indirizzoOrario.setIndirizzo(f.getIndirizzo());
            indirizzoOrario.setDescrizione(f.getDescrizione());
            indirizzoOrario.setOrario(f.getOrario());
            indirizzoOrario.setFermataID(f.getId());

            fermataSalitaDiscesa.put(indirizzoOrario, salita_discesa);
        }
    }


    /**
     * Metodo per ritornare gli array dei bambini non prenotati
     **/
    private List<UserIdBambino> getBambiniNonPrenotatiArray(List<UserIdBambino> userIdBambinoList,
                                                            List<Prenotazione> listReservation) {
        return userIdBambinoList
                .stream()
                .filter(user -> {
                    // se questa coppia ha una prenotazione non la ritorno
                    AtomicBoolean prenotato = new AtomicBoolean(false);
                    listReservation.forEach(prenotazione -> {

                        // controllo che questa prenotazione non sia riferita a questa coppia user + bambino
                        if (prenotazione.getUserId().toHexString().equals(user.getUserID())
                                && prenotazione.getBambino().equals(user.getBambino())) {
                            prenotato.set(true);
                        }
                    });

                    // Se non sono state trovate prenotazioni per questa coppia la ritorno
                    return !prenotato.get();
                }).collect(Collectors.toList());
    }

    /**
     * Questo metodo permette ad un accompagnatore di esportare le presenze su file in uno dei seguenti
     * formati: JSON, CSV, XML, ...
     **/
//    public void esportaPresenze(long data,
//                                int direzione,
//                                String nomeLinea, String formato) throws Exception {
//
//        // Converto l'oggetto date fornito dallo user in una stringa concorde con il formato dei dati nel DB
//        String date_ = new SimpleDateFormat("dd-MM-yyyy").format(data);
//
//        // Estraggo la linea associata al nome linea
//        Linea linea = lineaService.getLineaByNome(nomeLinea);
//
//        // Estraggo la corsa associata alla tripla data/direzione/nome
//        Corsa corsa = corsaService.getCorsaInfo(date_, direzione, linea.getId_obj());
//
//        // Costruisco la mappa con le prenotazioni associate a questa data, linea, direzione
//        String dir = corsa.getDirezione() == 0 ? "andata" : "ritorno";
//        LinkedList<PresenzaExportDTO> list = new LinkedList<>();
//        List<Prenotazione> prenotazioni = prenotazioneRepository.findByCorsaId(corsa.getId_obj());
//        for (Prenotazione p : prenotazioni) {
//            PresenzaExportDTO presenzaExportDTO = new PresenzaExportDTO();
//            presenzaExportDTO.setBambino(p.getBambino());
//            presenzaExportDTO.setNomeGenitore(userService.verificaEsistenzaUser(p.getUserId().toHexString()).getNome());
//            presenzaExportDTO.setCognomeGenitore(userService.verificaEsistenzaUser(p.getUserId().toHexString()).getCognome());
//            presenzaExportDTO.setData(corsa.getData());
//            presenzaExportDTO.setFermataSalita(p.getFermataSalita().getDescrizione());
//            presenzaExportDTO.setFermataDiscesa(p.getFermataDiscesa().getDescrizione());
//            presenzaExportDTO.setNomeLinea(linea.getNome());
//            presenzaExportDTO.setDirezione(dir);
//            presenzaExportDTO.setSalito(p.isSalito());
//            presenzaExportDTO.setSceso(p.isSceso());
//
//            list.add(presenzaExportDTO);
//        }
//
//        // Costruzione del nome del file a partire da data, direzione e nome della linea
//        String nomeFile = "~/Desktop/presenze" + "_" + corsa.getData().replace("-", "")
//                + "_" + dir + "_" + linea.getNome();
//
//        switch (formato) {
//            case "json":
//                MyFileWriter.writeJsonOnFile(nomeFile + ".json", list);
//                break;
//            case "xml":
//                MyFileWriter.writeXmlOnFile(nomeFile + ".xml", list);
//                break;
//            case "csv":
//                MyFileWriter.writeCsvOnFile(nomeFile + ".csv", list);
//                break;
//            default:
//                break;
//        }
//    }

    /**
     * Metodo per costruire la comunicazione da inviare al genitore per informarlo che il bambino
     * è salito o sceso ad una determinata fermata
     **/
    private String getComunicazionePresaInCarico(String bambino, boolean tap, String azione, String descrizioneFermata) {
        if (tap) {
            return bambino + " è " + azione + " alla fermata " + descrizioneFermata;
        } else {
            return "L'accompagnatore ha annullato l'ultimo cambiamento di stato della corsa in riferimento a " +
                    bambino + ".";
        }

    }

    /**
     * Metodo per inviare notifiche al genitore per aggiornamenti sulle prenotazioni dei figli
     **/
    private void sendComunicazioneGenitore(int salitoSceso, boolean tap, String bambino, Prenotazione prenotazione) {
        String action;
        String descrizioneFermata;
        if (salitoSceso == 0) {
            action = "salito";
            descrizioneFermata = prenotazione.getFermataSalita().getDescrizione();
        } else {
            action = "sceso";
            descrizioneFermata = prenotazione.getFermataDiscesa().getDescrizione();
        }

        // Comunico al genitore la presa in carico/scarico del bambino
        String notifica = getComunicazionePresaInCarico(bambino, tap, action, descrizioneFermata);
        comunicazioneService.nuovaComunicazione(prenotazione.getUserId().toHexString(), notifica,
                "Aggiornamento corsa pedibus --- " + bambino);
    }

    /**
     * Permette di informare gli altri accompagnatori di questa corsa (che siano in turno) che un bambino è stato
     * preso in carico oppure lasciato presso una fermata. Tale aggiornamento sarà ricevuto da tutti gli altri
     * accompagnatori in tempo reale, i quali vedranno aggiornarsi l'interfaccia grafica.
     **/
    private void sendAggiornamentoPresenzaRealTime(int salitoSceso,
                                                   boolean tap,
                                                   String bambino,
                                                   Prenotazione prenotazione,
                                                   String userId) throws Exception {

        // Ottengo i turni degli accompagnatori per questa corsa
        Corsa corsa = corsaService.verificaEsistenzaCorsaById(prenotazione.getCorsaId());
        List<Turno> accompagnatoriInTurno = turnoService.getTurniByCorsa(corsa);

        String azione = tap ? "selezionato" : "deselezionato";

        // Filtro i turni basandomi sulla fermata interessata dall'aggiornamento. In questo modo posso scartare
        // i turni, e quindi gli accompagnatori, non interessati dalla modifica
        List<String> accompagnatoriInTurnoIds = accompagnatoriInTurno.stream()
                .filter(turno -> {

                    // Bambino salito: controllo che questo user sia in turno per la fermata di salita
                    // della prenotazione
                    String fermataTester;
                    if (salitoSceso == 0)
                        fermataTester = prenotazione.getFermataSalita().getId();

                        // Bambino sceso: controllo che questo user sia in turno per la fermata di discesa
                        // della prenotazione
                    else
                        fermataTester = prenotazione.getFermataDiscesa().getId();

                    return fermataTester.compareTo(turno.getPartenza().getId()) >= 0
                            && fermataTester.compareTo(turno.getArrivo().getId()) <= 0;
                })
                .map(Turno::getUser)
                .map(User::getId)
                .filter(id -> !id.equals(userId))
                .collect(Collectors.toList());

        // Costruisco l'oggetto che rappresenta l'aggiornamento delle disponibilità in tempo reale per gli admin di linea
        PresenzaUpdateDTO presenzaUpdateDTO = new PresenzaUpdateDTO();
        presenzaUpdateDTO.setAzione(azione);
        presenzaUpdateDTO.setBambino(bambino);
        presenzaUpdateDTO.setPrenotatoDaGenitore(prenotazione.isPrenotatoDaGenitore());
        presenzaUpdateDTO.setData(corsa.getData());
        presenzaUpdateDTO.setLinea(lineaService.getLineaById(corsa.getLineaId()).getNome());
        presenzaUpdateDTO.setDirezione(corsa.getDirezione());
        presenzaUpdateDTO.setSalitoSceso(salitoSceso);

        // Estraggo l'identificativo della fermata su cui si sta effettuando la segnalazione
        String fermataId = salitoSceso == 0 ? prenotazione.getFermataSalita().getId() :
                prenotazione.getFermataDiscesa().getId();

        presenzaUpdateDTO.setFermataId(fermataId);

        // Invio a ciascun accompagnatore l'aggiornamento di presenza
        for (String id : accompagnatoriInTurnoIds) {
            comunicazioneService.nuovaComunicazioneRealTime(
                    id,
                    presenzaUpdateDTO,
                    "presenze");
        }
    }

    /**
     * Permette di informare gli accompagnatori in turno che una nuova prenotazione è stata creata, sia che sia
     * stata creata da un genitore che da un altro accompagnatore
     **/
    private void sendAggiornamentoNuovaPrenotazioneRealTime(boolean prenotatoDaGenitore,
                                                            String linea,
                                                            String lineaOld,
                                                            PrenotazioneDTO prenotazioneDTO,
                                                            PrenotazioneDTO prenotazioneDTOOld,
                                                            Corsa corsa,
                                                            String azione,
                                                            String loggedUserId){

        // Costruisco l'oggetto da inviare al client
        PrenotazioneUpdateDTO prenotazioneUpdateDTO = new PrenotazioneUpdateDTO();
        prenotazioneUpdateDTO.setAzione(azione);
        prenotazioneUpdateDTO.setPrenotatoDaGenitore(prenotatoDaGenitore);
        prenotazioneUpdateDTO.setLinea(linea);
        prenotazioneUpdateDTO.setLineaOld(lineaOld);
        prenotazioneUpdateDTO.setDate(corsa.getData());
        prenotazioneUpdateDTO.setPrenotazione(prenotazioneDTO);
        prenotazioneUpdateDTO.setPrenotazioneOld(prenotazioneDTOOld);


        // Estraggo gli accompagnatori che sono in turno per questa corsa
        // Se la prenotazione è stata effettuata da un genitore la comunicazione viene inviata a tutti gli
        // accompagnatori in turno, altrimenti a tutti tranne l'accompagnatore che ha creato al prenotazione
        // al volo
        List<String> accompagnatoriInTurno = turnoService.getTurniByCorsa(corsa)
                .stream()
                .map(Turno::getUser)
                .map(User::getId)
                .filter(id -> {
                    if(prenotatoDaGenitore)
                        return true;
                    return !id.equals(loggedUserId);
                })
                .collect(Collectors.toList());

        // Mando una comunicazione a tutti gli accompagnatori
        for(String id : accompagnatoriInTurno){
            comunicazioneService.nuovaComunicazioneRealTime(id, prenotazioneUpdateDTO, "presenze");
        }

        // Devo anche comunicare agli accompagnatori in turno su altre linee che il bambino non deve più,
        // oppure deve di nuovo, comparire nell'elenco dei non prenotati. In questo modo un accompagnatore
        // non avrà facoltà di prenotare un bambino che sta già viaggiando su un'altra linea.
        if(azione.equals("NUOVA_PRENOTAZIONE") || azione.equals("DELETE_PRENOTAZIONE")){

            // Estraggo le sole corse riferite ad altre linee diverse da quella associata alla prenotazione
            List<Corsa> corse = corsaService.getCorseByDataAndDirezione(corsa.getData(), corsa.getDirezione())
                    .stream()
                    .filter(c -> {
                        try {
                            return !lineaService.getLineaById(c.getLineaId()).getNome().equals(linea);
                        }
                        catch (Exception e){
                            return false;
                        }
                    })
                    .collect(Collectors.toList());

            // Estraggo gli ID degli accompagnatori che hanno un turno per queste corse
            List<Turno> turniAdmin = new ArrayList<>();
            for(Corsa c : corse)
                turniAdmin.addAll(turnoService.getTurniByCorsa(c));

            // Estraggo gli ID in maniera univoca
            List<String> adminInTurnoIds = turniAdmin.stream()
                    .map(Turno::getUser)
                    .map(User::getId)
                    .collect(Collectors.toList());

            // Costruisco la struttura dati da inviare al client
            PrenotazioneUpdateDTO prenotazioneUpdateDTO1 = new PrenotazioneUpdateDTO();
            prenotazioneUpdateDTO1.setLinea(linea);
            prenotazioneUpdateDTO1.setDate(corsa.getData());
            prenotazioneUpdateDTO1.setAzione(azione.equals("NUOVA_PRENOTAZIONE") ? "NOT_AVAILABLE" : "AVAILABLE");

            PrenotazioneDTO prenotazioneDTO1 = new PrenotazioneDTO();
            prenotazioneDTO1.setUserId(prenotazioneDTO.getUserId());
            prenotazioneDTO1.setBambino(prenotazioneDTO.getBambino());
            prenotazioneDTO1.setDirezione(corsa.getDirezione());

            prenotazioneUpdateDTO1.setPrenotazione(prenotazioneDTO1);

            // Invio la comunicazione a tutti gli admin
            for(String admin : adminInTurnoIds)
                comunicazioneService.nuovaComunicazioneRealTime(admin, prenotazioneUpdateDTO1, "presenze");
        }

    }
}