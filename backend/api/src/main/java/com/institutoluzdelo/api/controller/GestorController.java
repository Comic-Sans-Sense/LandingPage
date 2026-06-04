package com.institutoluzdelo.api.controller;

import com.institutoluzdelo.api.model.Gestor;
import com.institutoluzdelo.api.service.GestorService;
import org.springframework.web.bind.annotation.*;


//criei o Controller do Gestor só para criar um Gestor de Teste
@RestController
@RequestMapping("/gestores")
public class GestorController {

    private final GestorService gestorService;

    public GestorController(GestorService gestorService) {
        this.gestorService = gestorService;
    }

    @PostMapping
    public Gestor criarGestor(@RequestBody Gestor gestor) {
        return gestorService.criarGestor(gestor);
    }
}