package it.polito.pedibus.backend.validators;


import it.polito.pedibus.backend.DTOs.UserDTO;

import javax.validation.ConstraintValidator;
import javax.validation.ConstraintValidatorContext;

public class PasswordMatchesValidator
        implements ConstraintValidator<PasswordMatches, Object> {

    @Override
    public void initialize(PasswordMatches constraintAnnotation) {
    }

    @Override
    public boolean isValid(Object obj, ConstraintValidatorContext context) {
        UserDTO user = (UserDTO) obj;

        if(!user.getPassword().equals(user.getMatchingPassword()))
            return false;

        return user.getPassword().matches(".*\\d+.*") &&
                user.getPassword().matches(".*[a-z]+.*") &&
                user.getPassword().matches(".*[A-Z]+.*");
    }
}