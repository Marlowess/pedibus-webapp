package it.polito.pedibus.backend.validators;

@SuppressWarnings("serial")
public class EmailExistsException extends Throwable {
    public EmailExistsException(final String message) {
        super(message);
    }
}
