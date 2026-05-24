package com.institutoluzdelo.api.model;

import jakarta.persistence.*;
import org.hibernate.envers.Audited; // Import necessário

@Entity
@Table(name = "doacao")
@PrimaryKeyJoinColumn(name = "fk_id_movimentacao")
@Audited // Habilita a auditoria automática para esta entidade
public class Doacao extends Movimentacao {

    public Doacao() {
        this.setTipoMovimentacao("doacao");
        this.setStatus("pendente");
    }
}
