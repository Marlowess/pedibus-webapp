package it.polito.pedibus.backend.utilities;

import java.text.SimpleDateFormat;

public class TimestampChecker {

    /*
    * Con questo metodo è possibile verificare che la data attuale sia precedente la data di passaggio presso una certa
    * fermata del pedibus. In questo modo è possibile controllare che si possano fare nuove prenotazioni, assegnare o
    * modificare turni.
    *
    * Il parametro dataRichiesta rappresenta il timestamp relativo all'operazione che si vuole effettuare:
    * - se si tratta di una prenotazione rappresenta la data
    *  */
    public static void verificaOrario(long dataVerifica) throws Exception{

        final long fiveMinsMilliseconds = 300000L;

//        String date =
//        long dataVerifica = new SimpleDateFormat("dd-MM-yyyy HH:mm").parse(dataVerificaString).getTime();
        long now = System.currentTimeMillis();

        if(now >= dataVerifica - fiveMinsMilliseconds)
            throw new Exception("Impossibile completare la richiesta perchè l'evento avverrà tra meno di cinque minuti.");

    }

    /** Permette di concatenare la data della corsa e l'orario di passaggio alla fermata **/
    public static long concatDate(String dataCorsa, String oraFermata) throws Exception{
        String dateString = dataCorsa + " " + oraFermata; // 16-10-2019 07:15
        return new SimpleDateFormat("dd-MM-yyyy HH:mm").parse(dateString).getTime();
    }
}
