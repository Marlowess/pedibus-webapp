package it.polito.pedibus.backend.utilities;

import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import java.io.*;
import java.util.LinkedList;
import java.util.Scanner;

public class CsvScanner {
    public static LinkedList<String> read(String filePath) throws Exception{
        try{
//            File resource = new ClassPathResource(filePath).getFile();
//            Scanner scanner = new Scanner(resource);
//            LinkedList<String> date = new LinkedList<>();
//            while(scanner.hasNext()){
//
//                String data = scanner.next();
//
//                // Aggiungo la data alla lista
//                date.add(data);
//            }
//            scanner.close();
//            return date;
            LinkedList<String> date = new LinkedList<>();
            PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
            Resource[] resources = resolver.getResources("classpath:csv_files/*.*");

            InputStream[] inputStream = new InputStream[1];
            int i = 0;

            for (Resource resource : resources) {
                InputStream inStream = resource.getInputStream();
                // Do something with the input stream
                inputStream[i] = inStream;
                i++;
            }

            for (InputStream is : inputStream) {
                BufferedReader buf = new BufferedReader(new InputStreamReader(is));

                String data = buf.readLine();

                while(data != null){
                    date.add(data);
                    data = buf.readLine();
                }
            }
            return date;
        }
        catch(FileNotFoundException e){
            throw new Exception("File inestistente");
        }
        catch (Exception e){
            throw new Exception(e.getMessage());
        }
    }
}
