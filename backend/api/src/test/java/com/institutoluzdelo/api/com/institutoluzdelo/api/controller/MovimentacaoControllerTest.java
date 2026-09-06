package com.institutoluzdelo.api.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.BDDMockito.given;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.institutoluzdelo.api.model.Gasto;
import com.institutoluzdelo.api.service.MovimentacaoService;
import java.math.BigDecimal;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(MovimentacaoController.class)
public class MovimentacaoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private MovimentacaoService movimentacaoService;

    @Test
    @DisplayName("Deve cadastrar um gasto com sucesso e retornar 201 Created")
    @WithMockUser // Simula um usuário autenticado (Gestor)
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

        given(movimentacaoService.cadastrarGasto(any(), any(), any(), any(), any())).willReturn(gastoSimulado);

        mockMvc
            .perform(
                multipart("/api/movimentacoes/gasto")
                    .file(mockArquivo)
                    .param("valor", "450.00")
                    .param("categoria", "Marmitas")
                    .param("descricao", "Teste")
                    .param("qtdMarmitas", "120")
                    .with(csrf()) // Necessário se o CSRF estiver habilitado (mesmo que disable)
            )
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.categoria").value("Marmitas"))
            .andExpect(jsonPath("$.status").value("aprovado"));
    }

    @Test
    @DisplayName("Não deve cadastrar gasto com valor negativo")
    @WithMockUser
    void naoDeveCadastrarGastoComValorNegativo() throws Exception {
        // Nota: O teste de 400 Bad Request depende das validações (Bean Validation) no DTO
        mockMvc
            .perform(
                multipart("/api/movimentacoes/gasto")
                    .param("valor", "-50.00")
                    .param("categoria", "Marmitas")
                    .with(csrf())
            )
            .andExpect(status().isBadRequest());
    }
}
