console.log('Sistema conectado à API');

// Configurações Globais da API
const API_URL = 'http://localhost:8080';

// Retorna o cabeçalho configurado com o E-mail e Senha que foram salvos no Login
function getAuthHeader() {
  const auth = localStorage.getItem('auth_credentials');
  if (!auth) {
    // Se o usuário tentar acessar direto sem logar, joga para a tela de login
    if (!window.location.href.includes('login.html')) {
      window.location.href = 'login.html';
    }
    return {};
  }
  return { 'Authorization': 'Basic ' + auth };
}

// LOGIN (Utilizando o E-mail e a Senha enviados pelo Back-end)
async function login() {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  if(email.trim() === '' || senha.trim() === '') {
    alert('Por favor, preencha o e-mail e a senha fornecidos.');
    return;
  }

  // O pulo do gato do Basic Auth: junta "email:senha" e transforma em Base64
  const credentials = btoa(`${email}:${senha}`);

  try {
    // Faz uma requisição de teste para ver se o Back-end aceita esse e-mail e senha
    const response = await fetch(`${API_URL}/notificacoes`, {
      method: 'GET',
      headers: { 'Authorization': 'Basic ' + credentials }
    });

    if (response.ok) {
      // Se a API aceitou, salvamos o estado de logado e a credencial codificada
      localStorage.setItem('logado', 'true');
      localStorage.setItem('auth_credentials', credentials);
      
      // Redireciona para o painel principal
      window.location.href = 'notificacoes.html';
    } else if (response.status === 401) {
      alert('E-mail ou Senha inválidos. Verifique os dados enviados no e-mail.');
    } else {
      alert('O servidor respondeu com um erro. Fale com o desenvolvedor do Back-end.');
    }
  } catch (error) {
    console.error('Erro no login:', error);
    alert('Não foi possível conectar ao servidor local. O Back-end está rodando na porta 8080?');
  }
}

// VARIÁVEIS DE ESTADO DA INTERFACE
let filtroAtual = 'Todos';

// REGISTRAR GASTO (Enviando para o Back-end)
async function registrarGasto() {
  const valor = document.getElementById('valor').value;
  const descricao = document.getElementById('descricao').value;
  const botaoAtivo = document.querySelector('.filter-btn.active');

  const categoria = botaoAtivo 
  ? botaoAtivo.innerText 
  : 'Outros';
  const fileInput = document.querySelector('input[type="file"]'); // Alinhado para o upload de mídia

  if(valor === '' || descricao === '') {
    alert('Preencha todos os campos');
    return;
  }

  // Como o Back processa mídia via Cloudinary, usamos FormData
  const formData = new FormData();
  formData.append('valor', valor);
  formData.append('descricao', descricao);
  formData.append('categoria', categoria);
  formData.append('tipo', 'gasto');
  
  if (fileInput && fileInput.files[0]) {
    formData.append('comprovante', fileInput.files[0]);
  }

  try {
    const response = await fetch(`${API_URL}/historico`, {
      method: 'POST',
      headers: getAuthHeader(), // Passa o token de autorização
      body: formData // Nota: Não usar JSON aqui porque tem arquivo físico envolvido
    });

    if (response.ok) {
      alert('Gasto registrado com sucesso no banco de dados!');
      document.getElementById('valor').value = '';
      document.getElementById('descricao').value = '';
      atualizarInterfaceGeral();
    } else {
      alert('Falha ao registrar gasto no servidor.');
    }
  } catch (error) {
    console.error('Erro:', error);
  }
}

// CARREGAR E RENDERIZAR NOTIFICAÇÕES (GET)
async function renderNotificacoes() {
  const container = document.getElementById('lista-notificacoes');
  if(!container) return;

  try {
    const response = await fetch(`${API_URL}/notificacoes`, {
      method: 'GET',
      headers: getAuthHeader()
    });
    
    if (!response.ok) return;
    const notificacoes = await response.json();

    container.innerHTML = '';

    if(notificacoes.length === 0) {
      container.innerHTML = `<div class="card"><p>Nenhuma notificação encontrada.</p></div>`;
      return;
    }

    notificacoes.forEach(item => {
      const ehDoacao = item.tipo === 'doacao';
      const titulo = ehDoacao ? 'Nova doação recebida' : 'Revisão de Gasto';
      const infoExtra = ehDoacao ? `Doador: ${item.nome}` : `Descrição: ${item.descricao}`;

      container.innerHTML += `
        <div class="card">
          <div class="valor">R$ ${Number(item.valor || 0).toFixed(2)}</div>
          <div class="data">${item.data}</div>

          <p><strong>${titulo}</strong></p>
          <p>${infoExtra}</p>
          ${ehDoacao ? `<p><a href="${item.comprovante}" target="_blank">Ver Comprovante (Cloudinary)</a></p>` : `<p>Categoria: ${item.categoria}</p>`}

          <div class="actions">
            <button class="btn btn-red" onclick="rejeitarGasto(${item.id})">Rejeitar</button>
            <button class="btn btn-green" onclick="aprovarGasto(${item.id})">Aprovar</button>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
  }
}

// APROVAR DOAÇÃO (PUT ou POST dependendo do seu Endpoint de destino)
async function aprovarGasto(id) {
  try {
    const response = await fetch(`${API_URL}/notificacoes/${id}/aprovar`, {
      method: 'PUT',
      headers: getAuthHeader()
    });

    if (response.ok) {
      alert('Doação aprovada e enviada para o histórico!');
      atualizarInterfaceGeral();
    }
  } catch (error) {
    console.error('Erro ao aprovar:', error);
  }
}

// REJEITAR DOAÇÃO (PUT)
async function rejeitarGasto(id) {
  try {
    const response = await fetch(`${API_URL}/notificacoes/${id}/rejeitar`, {
      method: 'PUT',
      headers: getAuthHeader()
    });

    if (response.ok) {
      alert('Registro rejeitado.');
      atualizarInterfaceGeral();
    }
  } catch (error) {
    console.error('Erro ao rejeitar:', error);
  }
}

// FILTRAR HISTÓRICO
function filtrarHistorico(categoria) {
  filtroAtual = categoria;
  renderHistorico();
}

// CARREGAR E RENDERIZAR HISTÓRICO (GET com filtro dinâmico)
async function renderHistorico() {
  const container = document.getElementById('lista-historico');
  if(!container) return;

  try {
    const response = await fetch(`${API_URL}/historico`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) return;
    const historico = await response.json();

    container.innerHTML = '';

    // Filtragem e inversão mantidas no Front de forma limpa
    const dadosFiltrados = historico
      .slice()
      .reverse()
      .filter(item => filtroAtual === 'Todos' || item.categoria === filtroAtual);

    if(dadosFiltrados.length === 0) {
      container.innerHTML = `<div class="card"><p>Nenhum registro encontrado para ${filtroAtual}.</p></div>`;
      return;
    }

    dadosFiltrados.forEach(gasto => {
      const badgeClass = gasto.tipo === 'doacao' ? 'badge-green' : 'badge-red';
      const tipoTexto = gasto.tipo === 'doacao' ? 'Entrada' : 'Saída';

      container.innerHTML += `
        <div class="card">
          <div class="valor" style="color: ${gasto.tipo === 'doacao' ? '#37c777' : '#ef3d3d'}">
            ${gasto.tipo === 'doacao' ? '+' : '-'} R$ ${parseFloat(gasto.valor).toFixed(2)}
          </div>
          <div class="data">${gasto.data} <span class="badge ${badgeClass}">${tipoTexto}</span></div>
          <p><strong>Categoria:</strong> ${gasto.categoria}</p>
          <p>${gasto.descricao || 'Processado pelo sistema'}</p>
          <div class="actions">
            <button class="btn btn-green" onclick="editarGasto(${gasto.id})">Editar</button>
            <button class="btn btn-red" onclick="excluirHistorico(${gasto.id})">Excluir</button>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error('Erro ao carregar histórico:', error);
  }
}

// EDITAR (PUT)
async function editarGasto(id) {
  const novoValor = prompt('Novo valor:');
  const novaDescricao = prompt('Nova descrição:');

  if(novoValor && novaDescricao) {
    try {
      const response = await fetch(`${API_URL}/historico/${id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeader(),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ valor: novoValor, descricao: novaDescricao })
      });

      if (response.ok) {
        alert('Registro atualizado com sucesso!');
        renderHistorico();
      }
    } catch (error) {
      console.error('Erro ao editar:', error);
    }
  }
}

// MOVER DO HISTÓRICO PARA REJEITADOS (DELETE ou PUT dependendo da regra do Back)
async function excluirHistorico(id) {
  if (confirm('Tem certeza que deseja remover este item para a aba de Rejeitados?')) {
    try {
      const response = await fetch(`${API_URL}/historico/${id}/mover-rejeitados`, {
        method: 'PUT',
        headers: getAuthHeader()
      });

      if (response.ok) {
        alert('O registro foi movido para a aba de Rejeitados.');
        atualizarInterfaceGeral();
      }
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  }
}

// CARREGAR E RENDERIZAR REJEITADOS (GET)
async function renderRejeitados() {
  const container = document.getElementById('lista-rejeitados');
  if(!container) return;

  try {
    const response = await fetch(`${API_URL}/rejeitados`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) return;
    const rejeitados = await response.json();

    container.innerHTML = '';

    if(rejeitados.length === 0) {
      container.innerHTML = `<div class="card"><p>Nenhum registro rejeitado.</p></div>`;
      return;
    }

    rejeitados.slice().reverse().forEach(gasto => {
      container.innerHTML += `
        <div class="card">
          <div class="valor">R$ ${parseFloat(gasto.valor).toFixed(2)}</div>
          <div class="data">${gasto.data}</div>
          <p><strong>Categoria:</strong> ${gasto.categoria || 'Não definida'}</p>
          <p>${gasto.descricao || 'Registro removido do histórico'}</p>
          <div class="actions">
            <button class="btn btn-cyan" onclick="verificarNovamente(${gasto.id})">Restaurar (Verificar)</button>
            <button class="btn btn-red" onclick="excluirRejeitado(${gasto.id})">Excluir Permanentemente</button>
          </div>
        </div>
      `;
    });
  } catch (error) {
    console.error('Erro ao carregar rejeitados:', error);
  }
}

// RESTAURAR (REJEITADOS -> NOTIFICAÇÕES)
async function verificarNovamente(id) {
  try {
    const response = await fetch(`${API_URL}/rejeitados/${id}/restaurar`, {
      method: 'PUT',
      headers: getAuthHeader()
    });

    if (response.ok) {
      alert('O registro retornou para as notificações!');
      atualizarInterfaceGeral();
    }
  } catch (error) {
    console.error('Erro ao restaurar:', error);
  }
}

// DELETAR DEFINITIVO (DELETE)
async function excluirRejeitado(id) {
  if (confirm('Isso apagará o registro permanentemente do banco de dados.')) {
    try {
      const response = await fetch(`${API_URL}/rejeitados/${id}`, {
        method: 'DELETE',
        headers: getAuthHeader()
      });

      if (response.ok) {
        alert('Apagado permanentemente.');
        atualizarInterfaceGeral();
      }
    } catch (error) {
      console.error('Erro:', error);
    }
  }
}

// ATUALIZAR SALDO (Calculado dinamicamente a partir do histórico vindo da API)
async function atualizarSaldo() {
  const saldoElements = document.querySelectorAll('.saldo');
  if (saldoElements.length === 0) return;

  try {
    const response = await fetch(`${API_URL}/historico`, {
      method: 'GET',
      headers: getAuthHeader()
    });

    if (!response.ok) return;
    const historico = await response.json();

    let total = 0;
    historico.forEach(item => {
      if (item.tipo === 'doacao') {
        total += Number(item.valor);
      } else {
        total -= Number(item.valor);
      }
    });

    saldoElements.forEach(el => {
      el.innerHTML = `Saldo atual: R$ ${total.toFixed(2)}`;
    });
  } catch (error) {
    console.error('Erro ao calcular saldo:', error);
  }
}

// MOCK LOCAL (Mantido apenas para testes de interface rápida, se necessário)
async function gerarDoacaoMock() {
  alert("Para testes reais com o back-end, faça a requisição de doação bater na rota POST do seu localhost:8080/notificacoes");
}

// FUNÇÃO CONCENTRADORA DE INTERFACE
function atualizarInterfaceGeral() {
  renderNotificacoes();
  renderHistorico();
  renderRejeitados();
  atualizarSaldo();
}

// EVENT LISTENERS DOS FILTROS DO FRONT
document.addEventListener('DOMContentLoaded', () => {
  const botoes = document.querySelectorAll('.filter-btn');
  botoes.forEach(botao => {
    botao.addEventListener('click', () => {
      botoes.forEach(btn => btn.classList.remove('active'));
      botao.classList.add('active');
    });
  });

  // Executa a primeira carga de dados
  atualizarInterfaceGeral();
});