document.addEventListener('DOMContentLoaded', () => {
    const mainForm = document.getElementById('mainForm');
    const nomePrincipalInput = document.getElementById('nomePrincipal');
    const celularPrincipalInput = document.getElementById('celularPrincipal');
    const cepInput = document.getElementById('cep');
    const ruaInput = document.getElementById('rua');
    const bairroInput = document.getElementById('bairro');
    const estadoInput = document.getElementById('estado');

    const opcaoTratamentoRadio = document.getElementById('opcaoTratamento');
    const opcaoPresentearRadio = document.getElementById('opcaoPresentear');
    const opcaoAmbasRadio = document.getElementById('opcaoAmbas');
    const presenteadosSection = document.getElementById('presenteadosSection');
    const addPresenteadoBtn = document.getElementById('addPresenteadoBtn');
    const presenteadosContainer = document.getElementById('presenteadosContainer');

    let presenteadoCounter = 0;

    // --- Funções de Validação ---
    const validateName = (input, errorMessageElement) => {
        const value = input.value.trim();
        const regex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s]+$/; // Permite letras e espaços
        if (!value) {
            errorMessageElement.textContent = 'Este campo é obrigatório.';
            input.classList.add('invalid');
            return false;
        } else if (!regex.test(value)) {
            errorMessageElement.textContent = 'Nome não pode conter números ou caracteres especiais.';
            input.classList.add('invalid');
            return false;
        } else {
            errorMessageElement.textContent = '';
            input.classList.remove('invalid');
            return true;
        }
    };

    const formatAndValidatePhone = (input, errorMessageElement) => {
        let value = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        if (value.length > 0) {
            value = value.replace(/^(\d{2})(\d)/g, '($1) $2'); // Adiciona parênteses no DDD
            value = value.replace(/(\d)(\d{4})$/, '$1-$2'); // Adiciona hífen nos últimos 4 dígitos
        }
        input.value = value;

        const regex = /^\(\d{2}\) \d{5}-\d{4}$/; // Padrão para (XX) XXXXX-XXXX
        if (!value) {
            errorMessageElement.textContent = 'Celular é obrigatório.';
            input.classList.add('invalid');
            return false;
        } else if (!regex.test(value)) {
            errorMessageElement.textContent = 'Formato de celular inválido (Ex: (99) 99999-9999).';
            input.classList.add('invalid');
            return false;
        } else {
            errorMessageElement.textContent = '';
            input.classList.remove('invalid');
            return true;
        }
    };

    const formatAndValidateCEP = (input, errorMessageElement) => {
        let value = input.value.replace(/\D/g, ''); // Remove tudo que não é dígito
        if (value.length > 5) {
            value = value.replace(/^(\d{5})(\d)/, '$1-$2'); // Adiciona hífen
        }
        input.value = value;

        const regex = /^\d{5}-\d{3}$/;
        if (!value) {
            errorMessageElement.textContent = 'CEP é obrigatório.';
            input.classList.add('invalid');
            return false;
        } else if (!regex.test(value)) {
            errorMessageElement.textContent = 'Formato de CEP inválido (Ex: 99999-999).';
            input.classList.add('invalid');
            return false;
        } else {
            errorMessageElement.textContent = '';
            input.classList.remove('invalid');
            return true;
        }
    };

    // --- Preenchimento Automático de CEP (ViaCEP) ---
    const searchCEP = async () => {
        const cep = cepInput.value.replace(/\D/g, ''); // Apenas dígitos
        if (cep.length === 8) {
            try {
                const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
                const data = await response.json();
                if (data.erro) {
                    ruaInput.value = '';
                    bairroInput.value = '';
                    estadoInput.value = '';
                    cepInput.nextElementSibling.textContent = 'CEP não encontrado.';
                } else {
                    ruaInput.value = data.logradouro;
                    bairroInput.value = data.bairro;
                    estadoInput.value = data.uf;
                    cepInput.nextElementSibling.textContent = '';
                }
            } catch (error) {
                console.error('Erro ao buscar CEP:', error);
                cepInput.nextElementSibling.textContent = 'Erro ao buscar CEP.';
            }
        }
    };

    // --- Adição e Remoção de Presenteados ---
    const createPresenteadoCard = (id) => {
        const card = document.createElement('div');
        card.className = 'presenteado-card';
        card.id = `presenteado-${id}`;
        card.innerHTML = `
            <h4>Pessoa a Presentear #${id}</h4>
            <div class="form-group">
                <label for="nomePresenteado-${id}">Nome da Pessoa:</label>
                <input type="text" id="nomePresenteado-${id}" name="nomePresenteado_${id}" placeholder="Nome completo do presenteado" required>
                <small class="error-message"></small>
            </div>
            <div class="form-group">
                <label for="celularPresenteado-${id}">Celular (Opcional):</label>
                <input type="text" id="celularPresenteado-${id}" name="celularPresenteado_${id}" placeholder="(99) 99999-9999">
                <small class="error-message"></small>
            </div>
            <button type="button" class="remove-presenteado-btn" data-id="${id}">X</button>
        `;
        presenteadosContainer.appendChild(card);

        // Adiciona event listeners para validação nos novos campos
        const nomePresenteadoInput = card.querySelector(`#nomePresenteado-${id}`);
        const celularPresenteadoInput = card.querySelector(`#celularPresenteado-${id}`);

        nomePresenteadoInput.addEventListener('input', () => validateName(nomePresenteadoInput, nomePresenteadoInput.nextElementSibling));
        celularPresenteadoInput.addEventListener('input', () => {
            if (celularPresenteadoInput.value.trim() !== '') {
                formatAndValidatePhone(celularPresenteadoInput, celularPresenteadoInput.nextElementSibling);
            } else {
                celularPresenteadoInput.nextElementSibling.textContent = '';
                celularPresenteadoInput.classList.remove('invalid');
            }
        });

        // Adiciona event listener para o botão de remover
        card.querySelector('.remove-presenteado-btn').addEventListener('click', () => {
            card.remove();
        });
    };

    // --- Event Listeners ---

    // Validação principal do seu nome
    nomePrincipalInput.addEventListener('input', () => validateName(nomePrincipalInput, nomePrincipalInput.nextElementSibling));

    // Validação principal do seu celular
    celularPrincipalInput.addEventListener('input', () => formatAndValidatePhone(celularPrincipalInput, celularPrincipalInput.nextElementSibling));

    // Validação e busca de CEP
    cepInput.addEventListener('input', () => {
        formatAndValidateCEP(cepInput, cepInput.nextElementSibling);
        if (cepInput.value.replace(/\D/g, '').length === 8) {
            searchCEP();
        } else {
            ruaInput.value = '';
            bairroInput.value = '';
            estadoInput.value = '';
        }
    });
    cepInput.addEventListener('blur', searchCEP); // Busca também ao perder o foco

    // Mostrar/Esconder seção de presenteados
    const togglePresenteadosSection = () => {
        if (opcaoPresentearRadio.checked || opcaoAmbasRadio.checked) {
            presenteadosSection.style.display = 'block';
            if (presenteadoCounter === 0) { // Adiciona o primeiro campo se não houver nenhum
                presenteadoCounter++;
                createPresenteadoCard(presenteadoCounter);
            }
        } else {
            presenteadosSection.style.display = 'none';
            presenteadosContainer.innerHTML = ''; // Limpa os campos de presenteados
            presenteadoCounter = 0;
        }
    };

    opcaoTratamentoRadio.addEventListener('change', togglePresenteadosSection);
    opcaoPresentearRadio.addEventListener('change', togglePresenteadosSection);
    opcaoAmbasRadio.addEventListener('change', togglePresenteadosSection);

    addPresenteadoBtn.addEventListener('click', () => {
        presenteadoCounter++;
        createPresenteadoCard(presenteadoCounter);
    });

    // --- Envio do Formulário ---
    mainForm.addEventListener('submit', async (event) => {
        event.preventDefault(); // Previne o envio padrão do formulário inicialmente

        // Valida todos os campos antes de enviar
        let formIsValid = true;
        if (!validateName(nomePrincipalInput, nomePrincipalInput.nextElementSibling)) formIsValid = false;
        if (!formatAndValidatePhone(celularPrincipalInput, celularPrincipalInput.nextElementSibling)) formIsValid = false;
        if (!formatAndValidateCEP(cepInput, cepInput.nextElementSibling)) formIsValid = false;

        // Valida campos de presenteados se a seção estiver visível
        if (presenteadosSection.style.display === 'block') {
            const presenteadoCards = presenteadosContainer.querySelectorAll('.presenteado-card');
            if (presenteadoCards.length === 0) {
                alert('Por favor, adicione pelo menos uma pessoa para presentear.');
                formIsValid = false;
            }
            presenteadoCards.forEach(card => {
                const nomeInput = card.querySelector('input[name^="nomePresenteado_"]'); // Usar o mesmo name do HTML
                const celularInput = card.querySelector('input[name^="celularPresenteado_"]'); // Usar o mesmo name do HTML
                if (!validateName(nomeInput, nomeInput.nextElementSibling)) formIsValid = false;
                // Valida celular do presenteado apenas se preenchido
                if (celularInput.value.trim() !== '' && !formatAndValidatePhone(celularInput, celularInput.nextElementSibling)) formIsValid = false;
            });
        }

        if (!formIsValid) {
            alert('Por favor, corrija os erros no formulário antes de enviar.');
            return; // Impede o envio se houver erros
        }

        // Se todas as validações passarem, permita que o formulário seja enviado para o FormSubmit.co
        alert('Formulário enviado com sucesso! Você será redirecionado em breve.');
        mainForm.submit(); // Submete o formulário de forma nativa para a URL do action
    });

    // Inicializa a seção de presenteados ao carregar a página
    togglePresenteadosSection();
});