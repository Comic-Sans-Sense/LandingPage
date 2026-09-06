package com.institutoluzdelo.api.controller;

import com.institutoluzdelo.api.dto.GastoDTO;
import com.institutoluzdelo.api.model.Doacao;
import com.institutoluzdelo.api.model.Gasto;
import com.institutoluzdelo.api.model.Movimentacao;
import com.institutoluzdelo.api.repository.GastoRepository;
import com.institutoluzdelo.api.service.MovimentacaoService;
import jakarta.validation.Valid;
import java.io.IOException;
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
public class MovimentacaoController {

    @Autowired
    private MovimentacaoService movimentacaoService;

    @Autowired
    private GastoRepository gastoRepository;

    @PostMapping(value = "/doacao", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Doacao> criarDoacao(
            @RequestParam("valor") BigDecimal valor,
            @RequestPart(value = "comprovante", required = false) MultipartFile comprovante
    ) throws IOException {

    //  System.out.println("===== ENTROU NO CRIAR DOACAO =====");
    //  System.out.println("Valor: " + valor);

        Doacao doacaoSalva = movimentacaoService.cadastrarDoacao(valor, comprovante);
        return ResponseEntity.status(HttpStatus.CREATED).body(doacaoSalva);
    }

    @PostMapping(value = "/gasto", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Gasto> criarGasto(
        @Valid @ModelAttribute GastoDTO gastoDTO,
        @RequestPart(value = "comprovante", required = false) MultipartFile comprovante
    ) throws IOException {
        Gasto gastoSalvo = movimentacaoService.cadastrarGasto(
            gastoDTO.valor(),
            gastoDTO.categoria(),
            gastoDTO.descricao(),
            gastoDTO.qtdMarmitas(),
            comprovante
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(gastoSalvo);
    }

    @PutMapping("/doacao/{id}/status")
    public ResponseEntity<Movimentacao> alterarStatus(@PathVariable Long id, @RequestParam String novoStatus) {
        Movimentacao atualizada = movimentacaoService.atualizarStatusDoacao(id, novoStatus);
        return ResponseEntity.ok(atualizada);
    }

    @PutMapping("/gasto/{id}")
    public ResponseEntity<Movimentacao> editarDados(@PathVariable Long id, @Valid @RequestBody GastoDTO dto) {
        Movimentacao editada = movimentacaoService.editarDadosGasto(id, dto);
        return ResponseEntity.ok(editada);
    }

    @PatchMapping(value = "/gasto/{id}/comprovante", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Movimentacao> atualizarComprovante(
        @PathVariable Long id,
        @RequestPart("comprovante") MultipartFile arquivo
    ) throws IOException {
        Movimentacao editada = movimentacaoService.atualizarComprovante(id, arquivo);
        return ResponseEntity.ok(editada);
    }

    @DeleteMapping("/gasto/{id}")
    public ResponseEntity<Void> removerGasto(@PathVariable Long id) {
        movimentacaoService.excluirGasto(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/gastos/filtro")
    public ResponseEntity<List<Gasto>> listarPorCategoria(@RequestParam String categoria) {
        return ResponseEntity.ok(gastoRepository.findByCategoria(categoria));
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
