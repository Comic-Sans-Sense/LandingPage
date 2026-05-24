package com.institutoluzdelo.api.dto;

import jakarta.validation.constraints.*;
import java.math.BigDecimal;

public record GastoDTO(
    @NotNull @DecimalMin("0.01") BigDecimal valor,
    @NotBlank String categoria,
    String descricao,
    Short qtdMarmitas
) {}
