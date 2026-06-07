package com.institutoluzdelo.api.controller;

import com.institutoluzdelo.api.dto.LoginDTO;
import com.institutoluzdelo.api.model.Gestor;
import com.institutoluzdelo.api.security.TokenService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/login")
public class LoginController {

    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private TokenService tokenService;

    @PostMapping
    public String login(@RequestBody @Valid LoginDTO dados) {
        // Cria um token de autenticação com o email e senha recebidos
        var authToken = new UsernamePasswordAuthenticationToken(dados.email(), dados.senha());

        // O AuthenticationManager valida as credenciais usando o seu AuthenticationService
        var authentication = authenticationManager.authenticate(authToken);

        // Se a senha estiver correta, recuperamos o gestor autenticado
        var gestor = (Gestor) authentication.getPrincipal();

        // Geramos o token JWT para esse gestor
        return tokenService.gerarToken(gestor);
    }
}
