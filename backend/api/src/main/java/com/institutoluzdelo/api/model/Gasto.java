package com.institutoluzdelo.api.model;

import jakarta.persistence.*;
import org.hibernate.envers.Audited; // Import necessário

@Entity
@Table(name = "gasto")
@PrimaryKeyJoinColumn(name = "fk_id_movimentacao")
@Audited // Habilita a auditoria automática para esta entidade e seus campos
public class Gasto extends Movimentacao {

    @Column(nullable = false)
    private String categoria;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(name = "qtd_marmitas_produzidas")
    private Short qtdMarmitasProduzidas;

    public Gasto() {
        this.setTipoMovimentacao("gasto");
        this.setStatus("aprovado");
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getDescricao() {
        return descricao;
    }

    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }

    public Short getQtdMarmitasProduzidas() {
        return qtdMarmitasProduzidas;
    }

    public void setQtdMarmitasProduzidas(Short qtdMarmitasProduzidas) {
        this.qtdMarmitasProduzidas = qtdMarmitasProduzidas;
    }
}
