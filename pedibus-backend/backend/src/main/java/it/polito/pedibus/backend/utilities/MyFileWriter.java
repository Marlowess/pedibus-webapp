package it.polito.pedibus.backend.utilities;


import com.google.gson.Gson;
import it.polito.pedibus.backend.DTOs.PresenzaExportDTO;

import java.io.FileWriter;
import java.io.PrintWriter;
import java.util.LinkedList;

import java.io.File;
import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import javax.xml.parsers.ParserConfigurationException;
import javax.xml.transform.Transformer;
import javax.xml.transform.TransformerException;
import javax.xml.transform.TransformerFactory;
import javax.xml.transform.dom.DOMSource;
import javax.xml.transform.stream.StreamResult;
import org.w3c.dom.Attr;
import org.w3c.dom.Document;
import org.w3c.dom.Element;

/**
 * Classe di utility per scrivere dati su file in un certo formato
 * **/
public class MyFileWriter {

    // Scrive dati su file in formato JSON
    public static void writeJsonOnFile(String nomeFile, LinkedList<PresenzaExportDTO> list) throws Exception{
        Gson gson = new Gson();
        String json = gson.toJson(list);
        writeDataOnFile(nomeFile, json);
    }

    // Scrive dati su file in formato CSV
    public static void writeCsvOnFile(String nomeFile, LinkedList<PresenzaExportDTO> list) throws Exception{
        final String COMMA_DELIMITER = ",";
        final String NEW_LINE_SEPARATOR = "\n";
        final String FILE_HEADER =
                "data,direzione,nomeLinea,nomeGenitore,cognomeGenitore,bambino,fermataSalita,fermataDiscesa,salito,sceso";

        FileWriter fileWriter = null;

        try{
            fileWriter = new FileWriter(nomeFile);

            // Creazione dell'header CSV
            fileWriter.append(FILE_HEADER);

            // Nuova riga
            fileWriter.append(NEW_LINE_SEPARATOR);

            // Itero lungo tutte le presenze per costruire il file
            for(PresenzaExportDTO p : list){
                fileWriter.append(p.getData());
                fileWriter.append(COMMA_DELIMITER);
                fileWriter.append(p.getDirezione());
                fileWriter.append(COMMA_DELIMITER);
                fileWriter.append(p.getNomeLinea());
                fileWriter.append(COMMA_DELIMITER);
                fileWriter.append(p.getNomeGenitore());
                fileWriter.append(COMMA_DELIMITER);
                fileWriter.append(p.getCognomeGenitore());
                fileWriter.append(COMMA_DELIMITER);
                fileWriter.append(p.getBambino());
                fileWriter.append(COMMA_DELIMITER);
                fileWriter.append(p.getFermataSalita());
                fileWriter.append(COMMA_DELIMITER);
                fileWriter.append(p.getFermataDiscesa());
                fileWriter.append(COMMA_DELIMITER);
                fileWriter.append(p.isSalito() ? "S" : "N");
                fileWriter.append(COMMA_DELIMITER);
                fileWriter.append(p.isSceso() ? "S" : "N");
            }
        }
        catch (Exception e){
            System.out.println("Errore nell'esportare su file CSV");
            throw new Exception("Errore scrittura file CSV");
        }
        finally {
            try {
                fileWriter.flush();
                fileWriter.close();
            } catch (NullPointerException e) {
                System.out.println("Errore nel fare flush su fileWriter");
            }
        }
    }

    // Scrive dati su file in formato XML
    public static void writeXmlOnFile(String nomeFile, LinkedList<PresenzaExportDTO> list) throws Exception{
        try {

            DocumentBuilderFactory documentFactory = DocumentBuilderFactory.newInstance();

            DocumentBuilder documentBuilder = documentFactory.newDocumentBuilder();

            Document document = documentBuilder.newDocument();

            // root element
            Element root = document.createElement("reseconto_presenze");
            document.appendChild(root);

            for(PresenzaExportDTO p : list){
                // elemento presenza
                Element presenza = document.createElement("presenza");
                root.appendChild(presenza);

                // set an attribute to staff element
//                Attr attr = document.createAttribute("id");
//                attr.setValue("10");
//                employee.setAttributeNode(attr);

                //you can also use staff.setAttribute("id", "1") for this

                // data prenotazione
                Element date = document.createElement("data");
                date.appendChild(document.createTextNode(p.getData()));
                presenza.appendChild(date);

                // direzione della corsa
                Element direzione = document.createElement("direzione");
                direzione.appendChild(document.createTextNode(p.getDirezione()));
                presenza.appendChild(direzione);

                // nome della linea
                Element linea = document.createElement("nomeLinea");
                linea.appendChild(document.createTextNode(p.getNomeLinea()));
                presenza.appendChild(linea);

                // nome del genitore
                Element nomeGenitore = document.createElement("nomeGenitore");
                nomeGenitore.appendChild(document.createTextNode(p.getNomeGenitore()));
                presenza.appendChild(nomeGenitore);

                // cognome del genitore
                Element cognomeGenitore = document.createElement("cognomeGenitore");
                cognomeGenitore.appendChild(document.createTextNode(p.getCognomeGenitore()));
                presenza.appendChild(cognomeGenitore);

                // nome del bambino
                Element bambino = document.createElement("bambino");
                bambino.appendChild(document.createTextNode(p.getBambino()));
                presenza.appendChild(bambino);

                // fermata di salita
                Element fermataSalita = document.createElement("fermataSalita");
                fermataSalita.appendChild(document.createTextNode(p.getFermataSalita()));
                presenza.appendChild(fermataSalita);

                // fermata di discesa
                Element fermataDiscesa = document.createElement("fermataDiscesa");
                fermataDiscesa.appendChild(document.createTextNode(p.getFermataDiscesa()));
                presenza.appendChild(fermataDiscesa);

                // salito
                Element isSalito = document.createElement("salito");
                isSalito.appendChild(document.createTextNode(p.isSalito() ? "S" : "N"));
                presenza.appendChild(isSalito);

                // sceso
                Element isSceso = document.createElement("sceso");
                isSceso.appendChild(document.createTextNode(p.isSceso() ? "S" : "N"));
                presenza.appendChild(isSceso);
            }

            // create the xml file
            //transform the DOM Object to an XML File
            TransformerFactory transformerFactory = TransformerFactory.newInstance();
            Transformer transformer = transformerFactory.newTransformer();
            DOMSource domSource = new DOMSource(document);
            StreamResult streamResult = new StreamResult(new File(nomeFile));

            // If you use
            // StreamResult result = new StreamResult(System.out);
            // the output will be pushed to the standard output ...
            // You can use that for debugging

            transformer.transform(domSource, streamResult);

            System.out.println("Creazione file XML riuscita");

        } catch (ParserConfigurationException pce) {
            throw new Exception("Errore scrittura file XML");
        }
    }

    // Generico metodo per la scrittura su file
    private static void writeDataOnFile(String nomeFile, String data) throws Exception{
        PrintWriter out = new PrintWriter(nomeFile);
        out.println(data);
        out.flush();
        out.close();
    }
}
