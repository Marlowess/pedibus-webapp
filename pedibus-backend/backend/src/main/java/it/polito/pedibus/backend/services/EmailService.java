package it.polito.pedibus.backend.services;

import it.polito.pedibus.backend.domain.MailObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

import java.util.UUID;


/**
 * Created by Francesco Chiarlo on 04/05/2019
 */
@Component
public class EmailService implements IEmailService {


    private static JavaMailSender emailSender;

    @Value("${service.mail.host}")
    private String host;

    @Autowired
    void setEmailSender(@Qualifier("getJavaMailSender") JavaMailSender emailSender) {
        EmailService.emailSender = emailSender;
    }

    public MailObject createMailObjectToRecoverPassword(UUID random, String email) {
        String subjectEmail = "Servizio Pedibus - Reset Password";
        String message = "Clicca sul link sottostante (o incollalo nella barra degli indirizzi del tuo browser" +
                ") per impostare una nuova password:\n";
        String sb = "http://" +
                host +
                "/sostituzione-password/" +
                random;
        return MailObject.builder()
                .to(email)
                .subject(subjectEmail)
                .text(message+sb)
                .build();
    }

    public MailObject createMailObject(UUID random, String email) {

        String subjectEmail = "Registrazione al servizio Pedibus";
        String message = "Clicca sul link sottostante (o incollalo nella barra degli indirizzi del tuo browser" +
                ") per completare la registrazione al servizio Pedibus:\n";
        String sb = "http://" +
                host +
                "/registration-form/" +
                random;
        return MailObject.builder()
                .to(email)
                .subject(subjectEmail)
                .text(message+sb)
                .build();
    }


    public void sendSimpleMessage(String to, String subject, String text) {
        System.out.println("sendSimpleMessage");
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);

            System.out.println(message.toString());

            emailSender.send(message);
        } catch (MailException exception) {
            exception.printStackTrace();
        }
    }
}
