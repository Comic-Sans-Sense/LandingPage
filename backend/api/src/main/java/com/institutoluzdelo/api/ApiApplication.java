package com.institutoluzdelo.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootApplication
public class ApiApplication {

    public static void main(String[] args) {
        // Gerador de hash temporário para depuração
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hashGerado = encoder.encode("moises123");

        System.out.println("----------------------------------------");
        System.out.println("HASH PARA A SENHA 'moises123': " + hashGerado);
        System.out.println("----------------------------------------");

        SpringApplication.run(ApiApplication.class, args);
    }
}
