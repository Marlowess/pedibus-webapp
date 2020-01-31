package it.polito.pedibus.backend.domain;

import lombok.Builder;
import lombok.Data;

import javax.validation.constraints.Email;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

/**
 * Created by Francesco Chiarlo on 05/05/2019.
 * Classe per l'invio di una mail ad un utente
 */
@Data @Builder
public class MailObject {
    @Email
    @NotNull
    @Size(min = 1, message = "Please, set an email address to send the message to it")
    private String to;
    private String subject;
    private String text;
}
