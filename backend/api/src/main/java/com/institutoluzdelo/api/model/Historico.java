package com.institutoluzdelo.api.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "historico")
public class Historico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_historico")
    private Long id;

    // Relacionamento com a classe abstrata (Pai) das movimentações
    @ManyToOne
    @JoinColumn(name = "fk_id_movimentacao", nullable = false)
    private Movimentacao movimentacao;

    // Relacionamento com o Gestor que realizou a ação de auditoria
    @ManyToOne
    @JoinColumn(name = "fk_id_gestor", nullable = false)
    private Gestor gestor;

    @Column(name = "data_historico", insertable = false, updatable = false)
    private LocalDateTime dataHistorico;

    @Column(name = "acao_realizada", nullable = false, length = 255)
    private String acaoRealizada;

    // Construtor Padrão
    public Historico() {}

    // Getters e Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Movimentacao getMovimentacao() {
        return movimentacao;
    }

    public void setMovimentacao(Movimentacao movimentacao) {
        this.movimentacao = movimentacao;
    }

    public Gestor getGestor() {
        return gestor;
    }

    public void setGestor(Gestor gestor) {
        this.gestor = gestor;
    }

    public LocalDateTime getDataHistorico() {
        return dataHistorico;
    }

    public void setDataHistorico(LocalDateTime dataHistorico) {
        this.dataHistorico = dataHistorico;
    }

    public String getAcaoRealizada() {
        return acaoRealizada;
    }

    public void setAcaoRealizada(String acaoRealizada) {
        this.acaoRealizada = acaoRealizada;
    }
}
