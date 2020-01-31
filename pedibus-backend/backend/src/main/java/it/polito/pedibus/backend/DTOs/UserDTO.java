package it.polito.pedibus.backend.DTOs;

import it.polito.pedibus.backend.validators.PasswordMatches;
import it.polito.pedibus.backend.validators.ValidEmail;
import lombok.Data;

import javax.validation.constraints.NotEmpty;
import javax.validation.constraints.NotNull;
import javax.validation.constraints.Size;

@PasswordMatches
@Data
public class UserDTO {
    @NotNull
    @NotEmpty
    private String nome;

    @NotNull
    @NotEmpty
    private String cognome;

    @NotNull
    @NotEmpty
    @Size(min = 8, max = 20)
    private String password;

    @NotNull
    @NotEmpty
    @Size(min = 8, max = 20)
    private String matchingPassword;

    @ValidEmail
    @NotNull
    @NotEmpty
    private String email;
}