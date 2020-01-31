package it.polito.pedibus.backend;

import it.polito.pedibus.backend.DTOs.UserDTO;
import it.polito.pedibus.backend.services.*;
import it.polito.pedibus.backend.utilities.JSONReader;
import it.polito.pedibus.backend.validators.EmailExistsException;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.util.UUID;

@SpringBootApplication
public class BackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(BackendApplication.class, args);
    }


    @Bean
    public CommandLineRunner demo(UserService userService,
                                  LineaService lineaService,
                                  FermataService fermataService,
                                  CorsaService corsaService,
                                  PrenotazioneService prenotazioneService,
                                  DisponibilitaService disponibilitaService,
                                  TurnoService turnoService,
                                  ComunicazioneService comunicazioneService){
        return (args) -> {

            /* Cancello tutti gli utenti, le linee e le fermate */
            userService.deleteAll();
            lineaService.deleteAll();
            fermataService.deleteAll();
            corsaService.deleteAll();
            prenotazioneService.deleteAll();
            disponibilitaService.deleteAll();
            turnoService.deleteAll();
            comunicazioneService.deleteAll();


            /* Creazione e registrazione nuovo admin master */
            UserDTO userDTOMaster = new UserDTO();
            userDTOMaster.setNome("Tony");
            userDTOMaster.setCognome("Stark");
            userDTOMaster.setEmail("iron.man@avengers.com");
            userDTOMaster.setPassword("password6Y");
            userDTOMaster.setMatchingPassword("password6Y");
            userService.creazioneAdminMaster(userDTOMaster);

            // Test nuova modalità di registrazione user
            try{
                // L'admin master aggiunge una nuova mail al sistema. Viene ritornato un token
                UUID uuid = userService.inserimentoNuovoUser("brll.stefano@gmail.com", 0);

                // Lo user completa il profilo ed invia le informazioni
                UserDTO userDTO = new UserDTO();
                userDTO.setNome("Stefano");
                userDTO.setCognome("Brilli");
                userDTO.setPassword("password6Y");
                userDTO.setMatchingPassword("password6Y");
                userDTO.setEmail("brll.stefano@gmail.com");
                userService.completaProfilo(uuid, userDTO);
            }
            catch(EmailExistsException e){
                System.out.println(e.getMessage());
            }

            // Aggiungo un admin di linea
            try{
                // L'admin master aggiunge una nuova mail al sistema. Viene ritornato un token
                UUID uuid = userService.inserimentoNuovoUser("mario.rossi@gmail.com", 2);
                UUID uuid1 = userService.inserimentoNuovoUser("mario.biondi@gmail.com", 2);

                // Lo user completa il profilo ed invia le informazioni
                UserDTO userDTO = new UserDTO();
                userDTO.setNome("Mario");
                userDTO.setCognome("Rossi");
                userDTO.setPassword("password6Y");
                userDTO.setMatchingPassword("password6Y");
                userDTO.setEmail("mario.rossi@gmail.com");
                userService.completaProfilo(uuid, userDTO);

                // Lo user completa il profilo ed invia le informazioni
                UserDTO userDTO1 = new UserDTO();
                userDTO1.setNome("Mario");
                userDTO1.setCognome("Biondi");
                userDTO1.setPassword("password6Y");
                userDTO1.setMatchingPassword("password6Y");
                userDTO1.setEmail("mario.biondi@gmail.com");
                userService.completaProfilo(uuid1, userDTO1);
            }
            catch(EmailExistsException e){
                System.out.println(e.getMessage());
            }

            // Aggiungo un accompagnatore
            try{
                // L'admin master aggiunge una nuova mail al sistema. Viene ritornato un token
                UUID uuid = userService.inserimentoNuovoUser("franec94@gmail.com", 1);
                UUID uuid2 = userService.inserimentoNuovoUser("cate.oppici.95@outlook.it", 1);
                UUID uuid3 = userService.inserimentoNuovoUser("fabryronzi@gmail.com", 1);

                // Lo user completa il profilo ed invia le informazioni
                UserDTO userDTO = new UserDTO();
                userDTO.setNome("Francesco");
                userDTO.setCognome("Chiarlo");
                userDTO.setPassword("Jstrin01_!");
                userDTO.setMatchingPassword("Jstrin01_!");
                userDTO.setEmail("franec94@gmail.com");
                userService.completaProfilo(uuid, userDTO);

                userDTO = new UserDTO();
                userDTO.setNome("Caterina");
                userDTO.setCognome("Oppici");
                userDTO.setPassword("Jstrin01_!");
                userDTO.setMatchingPassword("Jstrin01_!");
                userDTO.setEmail("cate.oppici.95@outlook.it");
                userService.completaProfilo(uuid2, userDTO);

                userDTO = new UserDTO();
                userDTO.setNome("Fabrizio");
                userDTO.setCognome("Ronzino");
                userDTO.setPassword("Jstrin01_!");
                userDTO.setMatchingPassword("Jstrin01_!");
                userDTO.setEmail("fabryronzi@gmail.com");
                userService.completaProfilo(uuid3, userDTO);
            }
            catch(EmailExistsException e){
                System.out.println(e.getMessage());
            }

            // Creazione dell'oggetto JSONReader
            JSONReader jsonReader = new JSONReader();

            // Lettura di tutti i file contenenti le linee
            jsonReader.parseLinesJSON();

            // Costruzione del DB a partire da quanto letto sui file
            jsonReader.buildDBFromJSON(lineaService, fermataService, userService, corsaService);

//            String[] bambini = {"Luca", "Marta", "Matteo", "Giovanni"};
//
//            // Creo una nuova prenotazione ed ottendo il suo identificatore
//            Linea linea1 = lineaService.getLineaByNome("linea_1");
//            Linea linea2 = lineaService.getLineaByNome("linea_2");
//
//            // Setto le fermate di default dello user genitore
//            ProfileDTO profileDTO = new ProfileDTO();
//            profileDTO.setBambini(bambini);
//            profileDTO.setNome_linea("linea_1");
//            profileDTO.setFermata_salita_id(linea1.getFermate_andata().get(0).getId());
//            profileDTO.setFermata_discesa_id(linea2.getFermate_ritorno().get(2).getId());
//
//            userService.updateProfile(userService.
//                    findByEmailAndPassword("brll.stefano@gmail.com", "password6Y").getId(),
//                    profileDTO);

            // Prova di esportazione presenze
            // prenotazioneService.esportaPresenze(1574118000000L, 0, "linea_1", "csv");
        };
    }
}
