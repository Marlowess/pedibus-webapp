package it.polito.pedibus.backend.utilities;

import com.fasterxml.jackson.databind.ObjectMapper;
import it.polito.pedibus.backend.mongoClasses.Corsa;
import it.polito.pedibus.backend.mongoClasses.Fermata;
import it.polito.pedibus.backend.mongoClasses.Linea;
import it.polito.pedibus.backend.services.CorsaService;
import it.polito.pedibus.backend.services.FermataService;
import it.polito.pedibus.backend.services.LineaService;
import it.polito.pedibus.backend.services.UserService;
import org.bson.types.ObjectId;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.util.ResourceUtils;

import java.io.*;
import java.util.ArrayList;
import java.util.LinkedList;

/** This class provides a JSON reader utilities **/
public class JSONReader {
    private ArrayList<String> jsonFiles;
    private Logger log;

    // Constructor
    public JSONReader(){
        jsonFiles = new ArrayList<>();
        log = LoggerFactory.getLogger(JSONReader.class);
    }

    /** This method parses the JSON string and inserts lines data into the DB **/
    public void parseLinesJSON(){
        try{
            // It fills the list of JSON strings
            JSONFromFile();
        }catch(IOException e){
            log.info("An error on reading JSON has occured.");
            log.info(e.toString());
        }

    }

    /** This method inserts data into the DB by usign JPA API **/
    public void buildDBFromJSON(LineaService lineaService,
                                FermataService fermataService,
                                UserService userService,
                                CorsaService corsaService){
        ObjectMapper mapper = new ObjectMapper();
        try{
            // Read CSV file containing dates
            LinkedList<String> dateCorse = CsvScanner.read("csv_files/corse.csv");

            // For each file in the directory
            for(String s : jsonFiles){
                // Getting data about line as a class instance
                Linea linea = mapper.readValue(s, Linea.class);

                // Then I put the line into the DB
                lineaService.aggiungiLinea(linea);

                Linea db_linea = lineaService.getLineaByNome(linea.getNome());

                if(db_linea == null) continue;

                //creazioneCorsaByLinea(db_linea.getId(), corsaService);
                // Create two trips for each line
                for(String data:dateCorse){
                    creazioneCorsaByLinea(db_linea.getId_obj(), corsaService, data);
                }

                // Now, for each stop related to this line I have to add a record
                // in the table of stops
                for(Fermata f : db_linea.getFermate_andata()){
                    Fermata f2 = new Fermata(f);
                    f2.setLinea(db_linea);
                    ObjectId fermataId = fermataService.aggiungiFermata(f2).getId_obj();
                    f.setId(fermataId);
                }

                for(Fermata f : db_linea.getFermate_ritorno()){
                    Fermata f3 = new Fermata(f);
                    f3.setLinea(db_linea);
                    ObjectId fermataId = fermataService.aggiungiFermata(f3).getId_obj();
                    f.setId(fermataId);
                }

                lineaService.aggiungiLinea(db_linea);

                // Qui assegno la gestione della linea alla persona indicata nel file
                userService.assegnaGestioneLineaAtBoot(db_linea);
            }
        }catch (Exception e){
            log.info(e.getMessage());
        }
        finally {
            log.info("DB building completed.");
        }
    }

    /** Questo metodo crea due corse (andata + ritorno) per ciascuna linea che viene creata al boot
     *  del sistema
     * **/
    private void creazioneCorsaByLinea(ObjectId lineaId, CorsaService corsaService, String data){
        Corsa corsaA = new Corsa();
        corsaA.setDirezione(0);
        corsaA.setData(data);
        corsaA.setLineaId(lineaId);
        corsaA.setStatoCorsa(false);

        Corsa corsaR = new Corsa();
        corsaR.setDirezione(1);
        corsaR.setData(data);
        corsaR.setLineaId(lineaId);
        corsaR.setStatoCorsa(false);

        corsaService.aggiungiCorsa(corsaA);
        corsaService.aggiungiCorsa(corsaR);
    }


    /** This method opens the JSON file and returns the related String **/
    private void JSONFromFile() throws IOException{

        jsonFiles.clear();

        // Reference to the target directory
        //File dir = new ClassPathResource("lines" + "/").getFile();

        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources("classpath:lines/*.*");

        // Array of all files into the folder
        //File[] directoryListing = dir.listFiles();
        //File[] directoryListing = new File[2];
        InputStream[] inputStream = new InputStream[2];
        int i = 0;

        for (Resource resource : resources) {
            InputStream inStream = resource.getInputStream();
            // Do something with the input stream
            inputStream[i] = inStream;
            i++;
        }


        // For each file I read the content as JSON and put it
        // into the JSON array
        //for (File child : directoryListing) {
        for (InputStream is : inputStream) {
            //InputStream is = new FileInputStream(child);
            //BufferedReader buf = new BufferedReader(new InputStreamReader(is));
            BufferedReader buf = new BufferedReader(new InputStreamReader(is));

            String line = buf.readLine();
            StringBuilder sb = new StringBuilder();

            while(line != null){
                sb.append(line).append("\n");
                line = buf.readLine();
            }
            jsonFiles.add(sb.toString());
        }
    }

}
