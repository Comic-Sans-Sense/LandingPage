package com.institutoluzdelo.api.service;


import com.institutoluzdelo.api.model.Gestor;
import com.institutoluzdelo.api.repository.GestorRepository;
import org.springframework.stereotype.Service;


//aba de criação de um Gestor. Ela só cria o Gestor, não gerencia nada (ainda. Se quiser remover, só remover)
@Service
public class GestorService {

    private final GestorRepository gestorRepository;

    public GestorService(GestorRepository gestorRepository) {
        this.gestorRepository = gestorRepository;
    }

    public Gestor criarGestor(Gestor gestor) {
        return gestorRepository.save(gestor);
    }
}