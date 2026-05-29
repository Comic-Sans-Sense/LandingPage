package com.institutoluzdelo.api.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record GastoDTO(
    @NotNull(message = "O valor é obrigatório") 
    @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero") 
    BigDecimal valor,

    @NotBlank(message = "A categoria é obrigatória")
    @Pattern(regexp = "marmitas|tecido|outros", message = "Categoria inválida. Use: marmitas, tecido ou outros")
    String categoria,

    @Size(max = 500, message = "A descrição não pode exceder 500 caracteres")
    String descricao,

    @Min(value = 0, message = "A quantidade de marmitas não pode ser negativa")
    Short qtdMarmitas
) {}
