package com.courtmaster.canchas.exceptions;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class HorarioOcupadoException extends RuntimeException {
    public HorarioOcupadoException(String message) {
        super(message);
    }
}

