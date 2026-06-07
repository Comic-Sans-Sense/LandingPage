package com.institutoluzdelo.api.security;

import com.institutoluzdelo.api.model.Gestor;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;
import org.springframework.stereotype.Service;

@Service
public class TokenService {

    // Em produção, essa chave deve vir de uma variável de ambiente (application.properties)
    private final Key key = Keys.secretKeyFor(SignatureAlgorithm.HS256);

    public String gerarToken(Gestor gestor) {
        return Jwts.builder()
            .setSubject(gestor.getUsername())
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + 86400000)) // Expira em 1 dia
            .signWith(key)
            .compact();
    }

    public String getSubject(String token) {
        return Jwts.parserBuilder().setSigningKey(key).build().parseClaimsJws(token).getBody().getSubject();
    }
}
