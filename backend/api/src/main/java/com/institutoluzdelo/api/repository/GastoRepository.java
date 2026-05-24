package com.institutoluzdelo.api.repository;

import com.institutoluzdelo.api.model.Gasto;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface GastoRepository extends JpaRepository<Gasto, Long> {
    // 🔍 Busca o gasto usando o ID herdado da superclasse Movimentacao
    @Query("SELECT g FROM Gasto g WHERE g.id = :idMovimentacao")
    Optional<Gasto> findByMovimentacaoId(@Param("idMovimentacao") Long idMovimentacao);

    // ✂️ Deleta o gasto usando o ID herdado da superclasse Movimentacao
    @Modifying
    @Query("DELETE FROM Gasto g WHERE g.id = :idMovimentacao")
    void deleteByMovimentacaoId(@Param("idMovimentacao") Long idMovimentacao);

    // Filtra os gastos por categoria (Marmitas, Tecidos, Outros)
    List<Gasto> findByCategoria(String categoria);
}
