package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.DTOs.DisponibilitaDTO;
import it.polito.pedibus.backend.DTOs.DisponibilitaResponseDTO;
import it.polito.pedibus.backend.DTOs.DisponibilitaUpdateDTO;
import it.polito.pedibus.backend.repositories.CorsaRepository;
import it.polito.pedibus.backend.repositories.DisponibilitaRepository;
import it.polito.pedibus.backend.repositories.TurnoRepository;
import it.polito.pedibus.backend.repositories.UserRepository;
import it.polito.pedibus.backend.utilities.TimestampChecker;
import org.bson.types.ObjectId;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.text.SimpleDateFormat;
import java.util.*;
import java.util.stream.Collectors;

import it.polito.pedibus.backend.mongoClasses.*;

/**
 * Servizio per la gestione delle disponibilità concesse dagli accompagnatori per le corse del peedibus.
 * Con disponibilità si intende l'essere disponibili a svolgere un turno in una certa data e per una certa direzione,
 * senza indicare alcuna linea specifica. L'amministratore di una certa linea deciderà poi, sulla base delle
 * disponibilità, a chi e per quali tratte assegnare un turno.
 * **/
@Service
public class DisponibilitaService {

    private final CorsaRepository corsaRepository;
    private final UserRepository userRepository;
    private final DisponibilitaRepository disponibilitaRepository;
    private final CorsaService corsaService;
    private final TurnoRepository turnoRepository;
    private final LineaService lineaService;
    private ComunicazioneService comunicazioneService;


    public DisponibilitaService(CorsaRepository corsaRepository,
                                UserRepository userRepository,
                                DisponibilitaRepository disponibilitaRepository,
                                CorsaService corsaService,
                                TurnoRepository turnoRepository,
                                LineaService lineaService,
                                ComunicazioneService comunicazioneService) {
        this.corsaRepository = corsaRepository;
        this.userRepository = userRepository;
        this.disponibilitaRepository = disponibilitaRepository;
        this.corsaService = corsaService;
        this.turnoRepository = turnoRepository;
        this.lineaService = lineaService;
        this.comunicazioneService = comunicazioneService;
    }

    /**
     * Tramite questo metodo è possibile inserire una nuova disponilità, indicando
     * il giorno della corsa e la direzione
     **/
    public Disponibilita insertNuovaDisponibilita(DisponibilitaDTO disponibilitaDTO) throws Exception {

        String email = getLoggedUserInfos();
        Date data = new Date(Long.parseLong(disponibilitaDTO.getDate()));
        String date = new SimpleDateFormat("dd-MM-yyyy").format(data);
        Integer direzione = disponibilitaDTO.getDirezione();

        // Verifico che esistano corse per questa data
        if (corsaRepository.findByDataAndDirezione(date, direzione).size() == 0)
            throw new Exception("Nessuna corsa per questa data o per questa direzione");

        // Controllo che la richiesta avvenga al più 5 minuti prima della corsa
        TimestampChecker.verificaOrario(Long.parseLong(disponibilitaDTO.getDate()));

        // Controllo che i dati non siano nulli
        if (email == null || !isValidDirection(direzione))
            throw new Exception("Dati non validi");

        // Verifico che questo user sia un accompagnatore e che quindi possa rendersi disponibile per una corsa
        User user = userRepository.findByEmail(email);
        if (user == null)
            throw new Exception("Utente non valido");
        //User user = userOptional.get();
        if (!user.getRuoli().contains("ROLE_ACCOMPAGNATORE"))
            throw new Exception("Utente non abilitato per questa azione");

        // Verifico che non esistano già disponibilità segnalate per questo user, per lo stesso giorno
        // e la stessa direzione
        Disponibilita disponibilitaCheck = disponibilitaRepository.findByDataAndDirezioneAndUser(
                date, direzione, user);
        if (disponibilitaCheck != null)
            throw new Exception("Disponibilità già inserita");


        // Creo la nuova disponibilità e la inserisco nella collezione
        //String dataString = new SimpleDateFormat("dd-MM-yyyy").format(data);
        Disponibilita disponibilita = new Disponibilita(date, direzione, user);
        disponibilita = disponibilitaRepository.save(disponibilita);

        // Notifico l'aggiunta delle disponibilità in tempo reale
        sendAggiornamentoDisponibilitaRealTime(disponibilita, "add_disponibilita");

        return disponibilita;

    }

    /**
     * Metodo per eliminare una disponibilità
     **/
    public void deleteDisponibilita(String disponibilitaId) throws Exception {

        if (disponibilitaId == null)
            throw new Exception("Disponibilità non valida");

        // Verifico che esita una disponibilità con questo id
        Optional<Disponibilita> disponibilitaOptional = disponibilitaRepository.findById(
                new ObjectId(disponibilitaId)
        );

        if (!disponibilitaOptional.isPresent())
            throw new Exception("Nessuna disponibilità con questo ID");

        // Verifico che non esista già un turno assegnato relativamente a questa disponibilità
        String email = getLoggedUserInfos();
        User user = userRepository.findByEmail(email);
        Disponibilita disponibilita = disponibilitaOptional.get();

        // Verifico che l'utente loggato sia quello associato alla disponibilità
        if(!disponibilita.getUser().getId().equals(user.getId()))
            throw new Exception("Privilegi insufficienti");

        List<Corsa> corse = corsaService.getCorseByDataAndDirezione(disponibilita.getData(), disponibilita.getDirezione());
        for(Corsa c : corse){
            Optional<Turno> turnoOptional = turnoRepository.findByCorsaAndUser(c, user);
            if(!turnoOptional.isPresent())
                continue;
            Turno turno = turnoOptional.get();
            if(turno.getCorsa().getId().equals(c.getId()))
                throw new Exception("Impossibile eliminare una disponibilità per cui esista un turno assegnato");
        }

        // Controllo che la richiesta avvenga al più 5 minuti prima della corsa
        SimpleDateFormat f = new SimpleDateFormat("dd-MM-yyyy");
        TimestampChecker.verificaOrario(f.parse(disponibilita.getData()).getTime());

        disponibilitaRepository.delete(disponibilitaOptional.get());

        // Notifico la cancellazione della disponibilità in tempo reale
        sendAggiornamentoDisponibilitaRealTime(disponibilita, "delete_disponibilita");
    }

    /**
     * Cancella le disponibilità dell'utente indicato
     * **/
    void deleteAllDisponibilitaByUser(User user) throws Exception{
        disponibilitaRepository.deleteByUser(user);
        List<Disponibilita> disponibilita = disponibilitaRepository.findByUser(user);

        if(disponibilita.size() > 0)
            throw new Exception("Impossibile cancellare le disponibilità dell'utente");
    }

    /**
     * Metodo per ritornare tutte le disponibilità sulla base dello user, in modo che ciascuno user possa
     * vedere per quali corse si è reso disponibile.
     * La chiave della mappa è l'ID dello disponibilità, il valore è
     **/
    public List<Disponibilita> getDisponibilitaByUser() throws Exception {

        String email = getLoggedUserInfos();
        User user = userRepository.findByEmail(email);
        if (user == null)
            throw new Exception("Utente non valido");

        if (!user.getRuoli().contains("ROLE_ACCOMPAGNATORE"))
            throw new Exception("Utente non abilitato per questa azione");

        // Prendo tutte le disponibilità associate a questo user e le ritorno al controller
        return disponibilitaRepository.findByUser(user);
    }

    /**
     * Questo metodo ritorna tutte le disponibilità di uno user in una data settimana
     **/
    public LinkedHashMap<String, Object> getDisponibilitaPerWeek(Long date) throws Exception {
        // Controllo le info sullo user
        String email = getLoggedUserInfos();
        User user = userRepository.findByEmail(email);
        if (user == null)
            throw new Exception("Utente non valido");

        if (!user.getRuoli().contains("ROLE_ACCOMPAGNATORE"))
            throw new Exception("Utente non abilitato per questa azione");

        // Prendo le date associate alle corse
        List<String> dateCorse = corsaService.getDataCorse();
        //LinkedList<String> dateCorse = CsvScanner.read("csv_files/corse.csv");

        LinkedHashMap<String, Object> map = corsaService.getMapCorseWeek(date, user.getId());

        // Ciascuna entry del JSON, al più due prenotazioni per ciascuna data, finisce in questa mappa
        Map<String, List<DisponibilitaResponseDTO>> disponibilitaByData = new LinkedHashMap<>();

        // Ciclo tutte le date alla ricerca di disponibilità
        for (String data : dateCorse) {

            // Controllo che la data sia contenuta nella settimana
            if (!corsaService.isDataCorsaCompresa(data, date))
                continue;

            // List di al più due disponibilità giornaliere
            List<DisponibilitaResponseDTO> disponibilitaList = new LinkedList<>();

            // *** Andata ***
            fillDisponibilitaResponseDTOData(disponibilitaList, data, user, 0);

            // *** Ritorno ***
            fillDisponibilitaResponseDTOData(disponibilitaList, data, user, 1);

            // Inserisco le due prenotazioni nella mappa
            disponibilitaByData.put(data, disponibilitaList);
        }

        // Inserisco la lista delle disponibilità all'interno del JSON finale
        map.put("disponibilita", disponibilitaByData);


        return map;
    }

    private void fillDisponibilitaResponseDTOData(List<DisponibilitaResponseDTO> disponibilitaList,
                                                  String data,
                                                  User user,
                                                  int direzione) throws Exception{
        Disponibilita andata = disponibilitaRepository.findByDataAndDirezioneAndUser(data, direzione, user);

        // Creo l'oggetto DisponibilitaResponseDTO
        DisponibilitaResponseDTO disponibilitaResponseDTO = new DisponibilitaResponseDTO();
        disponibilitaResponseDTO.setDisponibilitaInfos(andata);

        // Estraggo le corse associate a questa data e per la direzione
        List<Corsa> corse = corsaService.getCorseByDataAndDirezione(data, direzione);

        // Cerco un eventuale turno associato ad una di queste corse
        Turno turno;
        boolean found = false;

        for (Corsa corsa : corse) {
            Optional<Turno> turnoOptional = turnoRepository.findByCorsaAndUser(corsa, user);
            if(turnoOptional.isPresent()){
                turno = turnoOptional.get();
                disponibilitaResponseDTO.setTurno(turno);

                Linea linea = lineaService.getLineaById(corsa.getLineaId());
                disponibilitaResponseDTO.setNomeLinea(linea.getNome());

                found = true;
                break;
            }
        }
        if(!found)
            disponibilitaResponseDTO.setTurno(null);
        disponibilitaList.add(disponibilitaResponseDTO);
    }


    /**
     * Metodo per ritornare le disponibilità sulla base della data e della direzione.
     * Torna utile ad un amministratore di linea che deve assegnare un turno sulla base delle disponibilità
     **/
    public List<User> getDisponibilitaByDataAndDirezione(DisponibilitaDTO disponibilitaDTO) throws Exception {

        Date data = new Date(Long.parseLong(disponibilitaDTO.getDate()));
        String date = new SimpleDateFormat("dd-MM-yyyy").format(data);
        Integer direzione = disponibilitaDTO.getDirezione();

        if (direzione == null || !isValidDirection(direzione))
            throw new Exception("Dati non validi");

        // Ritorno tutti gli utenti che hanno dato disponibilità in questa data ed in questa direzione
        List<Disponibilita> disponibilita = disponibilitaRepository.findByDataAndDirezione(date, direzione);
        return disponibilita.stream()
                .map(Disponibilita::getUser)
                .collect(Collectors.toList());
    }

    public void deleteAll() {
        disponibilitaRepository.deleteAll();
    }

    /**
     * Recupero le informazioni sull'utente attualmente loggato
     **/
    private String getLoggedUserInfos() {
        // Estraggo le informazioni dell'utente attualmente loggato
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails user = (UserDetails) authentication.getPrincipal();

        // Ne prendo lo username, ossia l'indirizzo email, e lo ritorno
        return userRepository.findById(new ObjectId(user.getUsername())).get().getEmail();
    }

    /**
     * Metodo per verificare che il valore della direzione proveniente dal controller sia uguale a 0 od 1
     **/
    private boolean isValidDirection(int direzione) {
        return direzione == 0 || direzione == 1;
    }

    /** Permette di informare tutti gli admin di linea che un accompagnatore si è reso disponibile in un certo giorno
     *  e per una certa direzione, oppure che ha revocato la propria disponibilità.
     * **/
    private void sendAggiornamentoDisponibilitaRealTime(Disponibilita disponibilita, String azione){

        // Costruisco l'oggetto che rappresenta l'aggiornamento delle disponibilità in tempo reale per gli admin di linea
        DisponibilitaUpdateDTO disponibilitaUpdateDTO = new DisponibilitaUpdateDTO();
        disponibilitaUpdateDTO.setAzione(azione);
        disponibilitaUpdateDTO.setData(disponibilita.getData());
        disponibilitaUpdateDTO.setUser(disponibilita.getUser());
        disponibilitaUpdateDTO.setDirezione(disponibilita.getDirezione());

        // Estraggo gli ID di tutti gli admin delle linea, perchè a tutti deve essere notificata la variazione
        List<User> adminsIds = userRepository.findByRuoliContains("ROLE_ADMIN");
        adminsIds.addAll(userRepository.findByRuoliContains("ROLE_ADMIN_MASTER"));

        List<String> adminsIds_ = adminsIds
                .stream()
                .map(User::getId)
                .distinct()
                .collect(Collectors.toList());

        // Invio a ciascun admin l'aggiornamento sulle disponibilità
        for(String id : adminsIds_){
            comunicazioneService.nuovaComunicazioneRealTime(
                    id,
                    disponibilitaUpdateDTO,
                    "turni");
        }
    }
}
