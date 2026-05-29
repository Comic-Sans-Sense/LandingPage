package com.institutoluzdelo.api.audit;

import jakarta.persistence.*;
import org.hibernate.envers.DefaultRevisionEntity;
import org.hibernate.envers.RevisionEntity;

@Entity
@RevisionEntity(GestorRevisionListener.class)
public class GestorRevisionEntity extends DefaultRevisionEntity {

    @Column(name = "id_gestor")
    private Long idGestor;

    public Long getIdGestor() {
        return idGestor;
    }

    public void setIdGestor(Long idGestor) {
        this.idGestor = idGestor;
    }
}
