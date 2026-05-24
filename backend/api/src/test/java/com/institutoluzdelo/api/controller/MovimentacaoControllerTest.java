package com.institutoluzdelo.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.institutoluzdelo.api.model.Gasto;
import com.institutoluzdelo.api.service.MovimentacaoService;
import java.math.BigDecimal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
public class MovimentacaoControllerTest {

    private MockMvc mockMvc;

    @InjectMocks
    private MovimentacaoController movimentacaoController;

    @Mock
    private MovimentacaoService movimentacaoService;

    @BeforeEach
    void setUp() {
        this.mockMvc = MockMvcBuilders.standaloneSetup(movimentacaoController).build();
    }

    @Test
    @DisplayName("Deve cadastrar um gasto com sucesso e retornar 201 Created")
    void deveCadastrarGastoComSucesso() throws Exception {
        MockMultipartFile mockArquivo = new MockMultipartFile(
            "comprovante",
            "comprovante.jpg",
            MediaType.IMAGE_JPEG_VALUE,
            "fake data".getBytes()
        );

        Gasto gastoSimulado = new Gasto();
        gastoSimulado.setCategoria("Marmitas");
        gastoSimulado.setValor(new BigDecimal("450.00"));
        gastoSimulado.setStatus("aprovado");
        gastoSimulado.setTipoMovimentacao("gasto");

        // Ajuste: Agora espera apenas 5 argumentos (valor, categoria, descricao, qtdMarmitas, comprovante)
        given(movimentacaoService.cadastrarGasto(any(), any(), any(), any(), any())).willReturn(gastoSimulado);

        mockMvc
            .perform(
                multipart("/api/movimentacoes/gasto")
                    .file(mockArquivo)
                    .param("valor", "450.00")
                    // idGestor removido conforme solicitado na refatoração
                    .param("categoria", "Marmitas")
                    .param("descricao", "Teste")
                    .param("qtdMarmitas", "120")
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.categoria").value("Marmitas"))
            .andExpect(jsonPath("$.status").value("aprovado"));
    }

    @Test
    @DisplayName("Não deve cadastrar gasto com valor negativo")
    void naoDeveCadastrarGastoComValorNegativo() throws Exception {
        mockMvc
            .perform(
                multipart("/api/movimentacoes/gasto")
                    .param("valor", "-50.00")
                    // idGestor removido aqui também
                    .param("categoria", "Marmitas")
            )
            .andExpect(status().isBadRequest());
    }
}
