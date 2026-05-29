package com.institutoluzdelo.api.audit;

import com.institutoluzdelo.api.model.Gestor;
import org.hibernate.envers.RevisionListener;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public class GestorRevisionListener implements RevisionListener {

    @Override
    public void newRevision(Object revisionEntity) {
        GestorRevisionEntity revEntity = (GestorRevisionEntity) revisionEntity;

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        // Verifica se existe um gestor autenticado no momento da alteração
        if (auth != null && auth.getPrincipal() instanceof Gestor) {
            Gestor gestor = (Gestor) auth.getPrincipal();
            revEntity.setIdGestor(gestor.getId());
        }
    }
}
