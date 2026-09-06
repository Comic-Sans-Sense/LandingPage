package com.institutoluzdelo.api;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GeradorHash {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String senha = "moises123";
        String hash = encoder.encode(senha);
        System.out.println("----------------------------------------");
        System.out.println("HASH GERADO: " + hash);
        System.out.println("----------------------------------------");
    }
}
