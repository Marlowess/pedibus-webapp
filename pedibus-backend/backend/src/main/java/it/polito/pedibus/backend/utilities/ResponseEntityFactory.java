package it.polito.pedibus.backend.utilities;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import javax.validation.constraints.Null;
import java.util.LinkedHashMap;

/**
 * Classe di utilità per ritornare le risposte in formato JSON verso il client
 * **/
public class ResponseEntityFactory {
    public static ResponseEntity createResponseEntity(HttpStatus httpStatus, @Null Object body,
                                                      String bodyName) {
        ObjectMapper mapper = new ObjectMapper();
        LinkedHashMap<String, Object> result = new LinkedHashMap<>();

//        Integer code = new Integer(httpStatus.toString().split(" ")[0]);
//        String message = httpStatus.toString().split(" ")[1];

//        result.put("codice", code);
//        result.put("messaggio", message);

//        if(token != null)
//            result.put("token", token);

//        HttpHeaders headers = new HttpHeaders();
//        headers.setAccessControlAllowOrigin("*");
        if(body != null)
            result.put(bodyName, body);

        try {
            return ResponseEntity
                    .status(httpStatus)
                    //.headers(headers)
                    .body(mapper.writeValueAsString(result));
        } catch (JsonProcessingException e) {
            return ResponseEntity
                    .status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(result);
                    //.body(HttpStatus.INTERNAL_SERVER_ERROR.toString());
        }
    }
}
