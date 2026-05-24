package com.institutoluzdelo.api.repository;

import com.institutoluzdelo.api.model.Movimentacao;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface MovimentacaoRepository extends JpaRepository<Movimentacao, Long> {
    // Filtra por mês e ano (Ex: ano 2026, mes 5)
    @Query("SELECT m FROM Movimentacao m WHERE YEAR(m.dataCriacao) = :ano AND MONTH(m.dataCriacao) = :mes")
    List<Movimentacao> findByMesEAno(@Param("ano") int ano, @Param("mes") int mes);

    // Filtra por uma data específica
    @Query("SELECT m FROM Movimentacao m WHERE DATE(m.dataCriacao) = :data")
    List<Movimentacao> findByDataExata(@Param("data") LocalDate data);
}
