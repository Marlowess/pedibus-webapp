package it.polito.pedibus.backend.services;

/**
 * Created by Francesco Chiarlo on 04/05/2019
 */
public interface IEmailService {
    void sendSimpleMessage(String to,
                           String subject,
                           String text);
}