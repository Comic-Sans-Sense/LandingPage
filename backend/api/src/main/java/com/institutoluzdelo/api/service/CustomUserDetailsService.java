package com.institutoluzdelo.api.service;

import com.institutoluzdelo.api.model.Gestor;
import com.institutoluzdelo.api.repository.GestorRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    @Autowired
    private GestorRepository gestorRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // O Spring chama este método quando alguém tenta logar.
        // Nós buscamos o gestor no banco pelo email que ele digitou.
        return gestorRepository
            .findByEmail(email)
            .orElseThrow(() -> new UsernameNotFoundException("Gestor não encontrado com o e-mail: " + email));
    }
}
