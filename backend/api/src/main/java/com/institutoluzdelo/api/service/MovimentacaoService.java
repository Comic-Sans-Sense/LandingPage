package com.institutoluzdelo.api.service;

import com.institutoluzdelo.api.dto.GastoDTO;
import com.institutoluzdelo.api.model.*;
import com.institutoluzdelo.api.model.Doacao;
import com.institutoluzdelo.api.model.Gasto;
import com.institutoluzdelo.api.model.Movimentacao;
import com.institutoluzdelo.api.repository.*;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MovimentacaoService {
    //apenas para tirar a segurança kkkkkkkk
    @Autowired
    private GestorRepository gestorRepository;

    @Autowired
    private MovimentacaoRepository movimentacaoRepository;

    @Autowired
    private GastoRepository gastoRepository;

    @Autowired
    private CloudinaryService cloudinaryService;


    //Autenticação de gestor (ele precisa estar logado para que funcione)
    //private Gestor getGestorLogado() {
    //    return (Gestor) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    //}
    private Gestor getGestorLogado() {
        return gestorRepository.findById(1L)
                .orElseThrow(() -> new RuntimeException("Gestor de teste não encontrado"));
    }
    @Transactional(readOnly = true)
    public List<Movimentacao> buscarPorMesEAno(int ano, int mes) {
        return movimentacaoRepository.findByMesEAno(ano, mes);
    }

    @Transactional(readOnly = true)
    public List<Movimentacao> buscarPorDataExata(LocalDate data) {
        return movimentacaoRepository.findByDataExata(data);
    }

    @Transactional
    public Doacao cadastrarDoacao(BigDecimal valor, MultipartFile comprovante) throws IOException {
        Doacao doacao = new Doacao();
        doacao.setValor(valor);
        doacao.setTipoMovimentacao("doacao");
        doacao.setStatus("pendente");
        doacao.setGestor(getGestorLogado());

        if (comprovante != null && !comprovante.isEmpty()) {
            String urlPublica = cloudinaryService.uploadArquivo(comprovante);
            doacao.setUrlComprovante(urlPublica);
        }

        return movimentacaoRepository.save(doacao);
    }

    @Transactional
    public Gasto cadastrarGasto(
        BigDecimal valor,
        String categoria,
        String descricao,
        Short qtdMarmitas,
        MultipartFile comprovante
    ) throws IOException {
        Gasto gasto = new Gasto();
        gasto.setValor(valor);
        gasto.setTipoMovimentacao("gasto");
        gasto.setStatus("aprovado");
        gasto.setCategoria(categoria);
        gasto.setDescricao(descricao);
        gasto.setQtdMarmitasProduzidas(qtdMarmitas);
        gasto.setGestor(getGestorLogado());

        // Adicionei este log para você ver no Termux se o arquivo está sendo processado
        if (comprovante != null && !comprovante.isEmpty()) {
            System.out.println("Enviando arquivo para Cloudinary: " + comprovante.getOriginalFilename());
            String urlPublica = cloudinaryService.uploadArquivo(comprovante);
            System.out.println("Upload concluído! URL: " + urlPublica);
            gasto.setUrlComprovante(urlPublica);
        } else {
            System.out.println("Nenhum comprovante foi enviado ou o arquivo está vazio.");
        }

        return gastoRepository.save(gasto);
    }

    @Transactional
    public Movimentacao atualizarStatusDoacao(Long idMovimentacao, String novoStatus) {
        Movimentacao movimentacao = movimentacaoRepository
            .findById(idMovimentacao)
            .orElseThrow(() -> new RuntimeException("Movimentação não encontrada!"));

        if (!"doacao".equals(movimentacao.getTipoMovimentacao())) {
            throw new IllegalArgumentException("Esta movimentação não é uma doação!");
        }

        if (!novoStatus.equals("pendente") && !novoStatus.equals("aprovado") && !novoStatus.equals("rejeitado")) {
            throw new IllegalArgumentException("Status inválido!");
        }

        movimentacao.setStatus(novoStatus);
        return movimentacaoRepository.save(movimentacao);
    }

    @Transactional
    public Movimentacao editarDadosGasto(Long id, GastoDTO dto) {
        Movimentacao mov = movimentacaoRepository
            .findById(id)
            .orElseThrow(() -> new RuntimeException("Movimentação não encontrada!"));
        Gasto gasto = gastoRepository
            .findByMovimentacaoId(id)
            .orElseThrow(() -> new RuntimeException("Gasto não encontrado!"));

        mov.setValor(dto.valor());
        gasto.setDescricao(dto.descricao());
        gasto.setCategoria(dto.categoria());
        gasto.setQtdMarmitasProduzidas(dto.qtdMarmitas());

        gastoRepository.save(gasto);
        return movimentacaoRepository.save(mov);
    }

    @Transactional
    public Movimentacao atualizarComprovante(Long id, MultipartFile arquivo) throws IOException {
        Movimentacao mov = movimentacaoRepository
            .findById(id)
            .orElseThrow(() -> new RuntimeException("Movimentação não encontrada!"));

        String novaUrl = cloudinaryService.uploadArquivo(arquivo);
        mov.setUrlComprovante(novaUrl);

        return movimentacaoRepository.save(mov);
    }

    @Transactional
    public void excluirGasto(Long idMovimentacao) {
        Movimentacao movimentacao = movimentacaoRepository
            .findById(idMovimentacao)
            .orElseThrow(() -> new RuntimeException("Gasto não encontrado!"));

        if (!"gasto".equals(movimentacao.getTipoMovimentacao())) {
            throw new IllegalArgumentException("Apenas gastos podem ser excluídos do sistema!");
        }

        gastoRepository.deleteByMovimentacaoId(idMovimentacao);
        movimentacaoRepository.delete(movimentacao);
    }
}
