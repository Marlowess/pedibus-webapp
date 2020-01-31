package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.DTOs.FermataDTO;
import it.polito.pedibus.backend.DTOs.LineaDTO;
import it.polito.pedibus.backend.mongoClasses.Linea;
import it.polito.pedibus.backend.mongoClasses.User;
import it.polito.pedibus.backend.repositories.LineaRepository;
import it.polito.pedibus.backend.repositories.UserRepository;
import org.bson.types.ObjectId;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Servizio per la gestione delle linee del pedibus
 * **/
@Service
public class LineaService implements ILineService {

    private final LineaRepository lineaRepository;
    private final UserRepository userRepository;

    public LineaService(LineaRepository lineaRepository, UserRepository userRepository) {
        this.lineaRepository = lineaRepository;
        this.userRepository = userRepository;
    }

    /** Metodo per aggiungere una nuova linea nel DB **/
    public void aggiungiLinea(Linea linea){
        lineaRepository.save(linea);
    }

    /** Questo metodo ritorna la lista dei nomi delle linee presenti nel DB **/
    @Override
    public List<String> getAllLines() {
        List<String> linesName = new ArrayList<>();

        for(Linea l : lineaRepository.findAll())
            linesName.add(l.getNome());

        return linesName;
    }

    /** Metodo che ritorna una linea sulla base del suo nome. Se non esiste solleva un'eccezione **/
    public Linea getLineaByNome(String nomeLinea) throws Exception{
        Optional<Linea> lineaOptional = lineaRepository.findByNome(nomeLinea);

        if(!lineaOptional.isPresent())
            throw new Exception("Linea inesistente");

        return lineaOptional.get();
    }

    /** Ritorna una linea dato il suo ID **/
    Linea getLineaById(String id) throws Exception{
        Optional<Linea> lineaOptional = lineaRepository.findById(new ObjectId(id));
        if(!lineaOptional.isPresent())
            throw new Exception("Linea inesistente");
        return lineaOptional.get();
    }

    @Override
    public List<LineaDTO> getLineeIdByAdmin() throws Exception {
        // Estraggo le informazioni dell'utente attualmente loggato
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails)authentication.getPrincipal();

        // Ne prendo lo username, ossia l'indirizzo email
        String userId = userDetails.getUsername();
        User user = userRepository.findById(new ObjectId(userId)).get();
        if(!user.getRuoli().contains("ROLE_ADMIN") && !user.getRuoli().contains("ROLE_ADMIN_MASTER"))
            throw new Exception("Utente non abilitato alla transazione: ruoli insufficienti");

        // Trasformo la lista delle linee in una lista di oggetti LineaDTO e, per ciascuna delle fermate delle linee
        // rimappo l'oggetto Fermata in un oggetto FermataDTO
        return user.getLineeAmministrate().stream()
                .map(lineaRepository::findByNome)
                .map(Optional::get)
                .map(linea -> {
                    LineaDTO lineaDto = new LineaDTO();
                    lineaDto.setId(linea.getId());//.toHexString());
                    lineaDto.setFermate_andata(linea.getFermate_andata().stream()
                                                .map(FermataDTO::new).collect(Collectors.toList()));
                    lineaDto.setFermate_ritorno(linea.getFermate_ritorno().stream()
                                                .map(FermataDTO::new).collect(Collectors.toList()));
                    lineaDto.setNome(linea.getNome());
                    return lineaDto;
                })
                .collect(Collectors.toList());
    }

    public List<String> getNomeLineeAdmin() throws Exception{
        // Estraggo le informazioni dell'utente attualmente loggato
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails)authentication.getPrincipal();

        // Ne prendo lo username, ossia l'indirizzo email
        String userId = userDetails.getUsername();
        User user = userRepository.findById(new ObjectId(userId)).get();
        if(!user.getRuoli().contains("ROLE_ADMIN") && !user.getRuoli().contains("ROLE_ADMIN_MASTER"))
            throw new Exception("Utente non abilitato alla transazione: ruoli insufficienti");

        return user.getLineeAmministrate();
    }

    Linea verificaAmministrazioneLinea(String nomeLinea) throws Exception {
        // Estraggo le informazioni dell'utente attualmente loggato
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        UserDetails userDetails = (UserDetails)authentication.getPrincipal();

        // Ne prendo lo username, ossia l'indirizzo email
        String userId = userDetails.getUsername();
        User user = userRepository.findById(new ObjectId(userId)).get();

        // Estraggo la linea associata al nome passato
        Optional<Linea> lineaOptional = lineaRepository.findByNome(nomeLinea);

        // Verifico che la linea esista
        if(!lineaOptional.isPresent())
            throw new Exception("Linea inesistente");

        // Estraggo l'oggetto Linea
        Linea linea = lineaOptional.get();

        // Verifico che l'utente loggato stia amministrando la linea
        if(!user.getLineeAmministrate().contains(linea.getNome()))
            throw new Exception("Utente non abilitato alla transazione: non amministra questa linea");

        return linea;
    }

    public void deleteAll(){
        lineaRepository.deleteAll();
    }
}