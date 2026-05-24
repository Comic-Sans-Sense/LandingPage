package com.institutoluzdelo.api.repository;

import com.institutoluzdelo.api.model.Doacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DoacaoRepository extends JpaRepository<Doacao, Long> {
    // Pronto! Herdando o JpaRepository você já ganha métodos como save(), findById() e delete() básicos para doações.
}
