package com.institutoluzdelo.api.controller;

import com.institutoluzdelo.api.dto.GastoDTO;
import com.institutoluzdelo.api.model.Doacao;
import com.institutoluzdelo.api.model.Gasto;
import com.institutoluzdelo.api.model.Movimentacao;
import com.institutoluzdelo.api.repository.GastoRepository;
import com.institutoluzdelo.api.service.MovimentacaoService;
import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/movimentacoes")
@CrossOrigin(origins = "*")
public class MovimentacaoController {

    @Autowired
    private MovimentacaoService movimentacaoService;

    @Autowired
    private GastoRepository gastoRepository;

    @PostMapping(value = "/doacao", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> criarDoacao(
        @RequestParam("valor") BigDecimal valor,
        @RequestParam(value = "comprovante", required = false) MultipartFile comprovante
    ) {
        try {
            Doacao doacaoSalva = movimentacaoService.cadastrarDoacao(valor, comprovante);
            return ResponseEntity.status(HttpStatus.CREATED).body(doacaoSalva);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(
                "Erro ao processar doação: " + e.getMessage()
            );
        }
    }

    @PostMapping(value = "/gasto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> criarGasto(
        @Valid @ModelAttribute GastoDTO gastoDTO,
        @RequestParam(value = "comprovante", required = false) MultipartFile comprovante
    ) {
        try {
            Gasto gastoSalvo = movimentacaoService.cadastrarGasto(
                gastoDTO.valor(),
                gastoDTO.categoria(),
                gastoDTO.descricao(),
                gastoDTO.qtdMarmitas(),
                comprovante
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(gastoSalvo);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro: " + e.getMessage());
        }
    }

    @PutMapping("/doacao/{id}/status")
    public ResponseEntity<?> alterarStatus(@PathVariable Long id, @RequestParam String novoStatus) {
        try {
            Movimentacao atualizada = movimentacaoService.atualizarStatusDoacao(id, novoStatus);
            return ResponseEntity.ok(atualizada);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    // --- MÉTODOS DE EDIÇÃO ATUALIZADOS ---

    @PutMapping("/gasto/{id}")
    public ResponseEntity<?> editarDados(@PathVariable Long id, @Valid @RequestBody GastoDTO dto) {
        try {
            Movimentacao editada = movimentacaoService.editarDadosGasto(id, dto);
            return ResponseEntity.ok(editada);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro: " + e.getMessage());
        }
    }

    @PatchMapping("/gasto/{id}/comprovante")
    public ResponseEntity<?> atualizarComprovante(
        @PathVariable Long id,
        @RequestParam("comprovante") MultipartFile arquivo
    ) {
        try {
            Movimentacao editada = movimentacaoService.atualizarComprovante(id, arquivo);
            return ResponseEntity.ok(editada);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Erro: " + e.getMessage());
        }
    }

    // --- FIM DOS MÉTODOS DE EDIÇÃO ---

    @DeleteMapping("/gasto/{id}")
    public ResponseEntity<?> removerGasto(@PathVariable Long id) {
        try {
            movimentacaoService.excluirGasto(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(e.getMessage());
        }
    }

    @GetMapping("/gastos/filtro")
    public ResponseEntity<List<Gasto>> listarPorCategoria(@RequestParam String categoria) {
        List<Gasto> gastos = gastoRepository.findByCategoria(categoria);
        return ResponseEntity.ok(gastos);
    }

    @GetMapping("/filtro/data")
    public ResponseEntity<List<Movimentacao>> filtrarPorData(
        @RequestParam(required = false) Integer ano,
        @RequestParam(required = false) Integer mes,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate data
    ) {
        if (data != null) {
            return ResponseEntity.ok(movimentacaoService.buscarPorDataExata(data));
        } else if (ano != null && mes != null) {
            return ResponseEntity.ok(movimentacaoService.buscarPorMesEAno(ano, mes));
        }

        return ResponseEntity.badRequest().build();
    }
}
