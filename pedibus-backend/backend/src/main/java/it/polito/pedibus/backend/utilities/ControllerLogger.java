package it.polito.pedibus.backend.utilities;

import java.util.logging.Logger;

/**
 * Permette il logging su console
 * **/
public class ControllerLogger {

    private static Logger logger = Logger.getAnonymousLogger();

    public static void printPositiveResponse(String loggerTopic, String request){
        String loggerResponsePositive = "DONE";
        logger.info(loggerTopic + " --- " + request + " --- " + loggerResponsePositive);
    }

    public static void printNegativeResponse(String loggerTopic, String request, String errorMessage){
        String loggerResponseNegative = "ERROR";
        logger.info(loggerTopic + " --- " + request + " --- " + loggerResponseNegative);
        logger.info(loggerTopic + " --- " + errorMessage);
    }
}
