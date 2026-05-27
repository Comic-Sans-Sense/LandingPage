// =========================================================================
// CONFIGURAÇÕES REAIS DA CONTA DO INSTITUTO (CONEXÃO VIA CNPJ)
// =========================================================================
const PIX_KEY = "50640121000176"; // CNPJ do Instituto (Apenas números)
const MERCHANT_NAME = "Instituto Luz de Lo"; // Sem acentos
const MERCHANT_CITY = "Franca";             
// =========================================================================

let valorSelecionado = 5.00; // Valor inicial correspondente ao botão de R$ 5 que está 'active'

document.addEventListener("DOMContentLoaded", () => {
    // Tenta gerar o Pix inicial assim que a página abre
    gerarPixDinamico(valorSelecionado);

    // Mapeia os elementos usando as classes e IDs exatos do teu HTML novo
    const botoesValor = document.querySelectorAll(".val-btn");
    const inputCustomizado = document.getElementById("custom-val");
    const selectedValText = document.getElementById("selected-val-text");

    // Ouvir cliques nos botões de valores fixos
    botoesValor.forEach(botao => {
        botao.addEventListener("click", function() {
            botoesValor.forEach(btn => btn.classList.remove("active"));
            this.classList.add("active");
            
            if (inputCustomizado) inputCustomizado.value = ""; 
            
            valorSelecionado = parseFloat(this.getAttribute("data-value"));
            
            // Atualiza o texto visual do valor selecionado abaixo do Pix
            if (selectedValText) {
                selectedValText.textContent = "R$ " + valorSelecionado.toFixed(2).replace(".", ",");
            }
            
            gerarPixDinamico(valorSelecionado);
        });
    });

    // Ouvir digitação no campo de valor customizado (Outro valor)
    if (inputCustomizado) {
        inputCustomizado.addEventListener("input", function() {
            botoesValor.forEach(btn => btn.classList.remove("active")); 
            
            let valorInjetado = parseFloat(this.value);
            
            if (!isNaN(valorInjetado) && valorInjetado > 0) {
                valorSelecionado = valorInjetado;
                
                if (selectedValText) {
                    selectedValText.textContent = "R$ " + valorSelecionado.toFixed(2).replace(".", ",");
                }
                
                gerarPixDinamico(valorSelecionado);
            }
        });
    }

    // Lógica visual do Dropzone de arquivos (Comprovante)
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("file-input");
    const fileNamePreview = document.getElementById("file-name-preview");

    if (dropzone && fileInput) {
        dropzone.addEventListener("click", () => fileInput.click());
        fileInput.addEventListener("change", function() {
            if (this.files.length > 0) {
                fileNamePreview.textContent = "Arquivo selecionado: " + this.files[0].name;
            }
        });
    }
});

// Função que monta o código Pix padrão do Banco Central
function gerarPixDinamico(valor) {

    function format(id, value) {
        const size = value.length.toString().padStart(2, '0');
        return id + size + value;
    }

    function crc16(payload) {
        let polinomio = 0x1021;
        let resultado = 0xFFFF;

        for (let offset = 0; offset < payload.length; offset++) {
            resultado ^= (payload.charCodeAt(offset) << 8);

            for (let bitwise = 0; bitwise < 8; bitwise++) {
                if ((resultado <<= 1) & 0x10000) {
                    resultado ^= polinomio;
                }

                resultado &= 0xFFFF;
            }
        }

        return resultado.toString(16).toUpperCase().padStart(4, '0');
    }

    const chavePix = PIX_KEY;
    const nome = MERCHANT_NAME;
    const cidade = MERCHANT_CITY;
    const valorFormatado = valor.toFixed(2);

    const gui = format("00", "BR.GOV.BCB.PIX");
    const chave = format("01", chavePix);

    const merchantAccount = format("26", gui + chave);

    const payload =
        format("00", "01") +
        merchantAccount +
        format("52", "0000") +
        format("53", "986") +
        format("54", valorFormatado) +
        format("58", "BR") +
        format("59", nome) +
        format("60", cidade) +
        format("62", format("05", "***")) +
        "6304";

    const crc = crc16(payload);

    const payloadFinal = payload + crc;

    document.getElementById("pixKey").value = payloadFinal;
}

// Função para copiar o código Pix gerado
function copyPixKey() {
    const pixTextArea = document.getElementById('pixKey');
    const copyButton = document.querySelector('.copy-button');
    const copyMessage = document.getElementById('copyMessage');

    if (!pixTextArea || pixTextArea.value.includes("Gerando") || pixTextArea.value.includes("Erro")) return;

    pixTextArea.select();
    pixTextArea.setSelectionRange(0, 99999); 

    navigator.clipboard.writeText(pixTextArea.value).then(() => {
        if (copyMessage) {
            copyMessage.textContent = 'Código Pix copiado! Abra o aplicativo do seu banco.';
            copyMessage.style.color = '#28a745';
        }
        if (copyButton) copyButton.textContent = 'Copiado!';

        setTimeout(() => {
            if (copyMessage) copyMessage.textContent = '';
            if (copyButton) copyButton.textContent = 'Copiar';
        }, 3000);
    }).catch(err => {
        console.error('Erro ao copiar: ', err);
    });
}