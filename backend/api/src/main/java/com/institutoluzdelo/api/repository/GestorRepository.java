package com.institutoluzdelo.api.repository;

import com.institutoluzdelo.api.model.Gestor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional; // Import necessário para o Optional

@Repository
public interface GestorRepository extends JpaRepository<Gestor, Long> {

    // O Spring Data JPA implementa automaticamente a busca por este método
    Optional<Gestor> findByEmail(String email);
    
}
