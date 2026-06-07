console.log('Sistema iniciado com integração ao Back-end');

// Configuração da URL base da API do Spring Boot
const API_BASE_URL = 'http://localhost:8080/api';

// FUNÇÃO AUXILIAR: Retorna os cabeçalhos padrões com o Token JWT se o usuário estiver logado
function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('token');
  if (!token) {
    // Se não houver token, redireciona para a tela de login (exceto se já estiver nela)
    if (!window.location.href.includes('login.html')) {
      window.location.href = 'login.html';
    }
    return extraHeaders;
  }
  return {
    'Authorization': `Bearer ${token}`,
    ...extraHeaders
  };
}

// LOGIN: Conecta com o LoginController (/api/login)
async function login() {
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');

  if (!emailInput || !senhaInput) return;

  const email = emailInput.value;
  const senha = senhaInput.value;

  if (email.trim() === '' || senha.trim() === '') {
    alert('Por favor, preencha o e-mail e a senha.');
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email, senha: senha })
    });

    if (!response.ok) {
      throw new Error('Credenciais inválidas ou erro no servidor.');
    }

    // O LoginController retorna diretamente a string do Token JWT
    const token = await response.text();
    
    localStorage.setItem('logado', 'true');
    localStorage.setItem('token', token); // Armazena o token para as próximas requisições
    
    window.location.href = 'notificacoes.html';
  } catch (error) {
    console.error('Erro ao fazer login:', error);
    alert('Erro ao realizar o login. Verifique suas credenciais.');
  }
}

// LOGOUT (Auxiliar para limpar o armazenamento)
function logout() {
  localStorage.clear();
  window.location.href = 'login.html';
}

// REGISTRAR GASTO: Envia os dados como Multipart (FormData) para o MovimentacaoController
async function registrarGasto() {
  const valorInput = document.getElementById('valor');
  const descricaoInput = document.getElementById('descricao');
  const fileInput = document.getElementById('file-input');

  if (!valorInput || !descricaoInput) return;

  const valor = valorInput.value;
  const descricao = descricaoInput.value;

  // Captura qual botão de categoria está ativo
  const btnAtivo = document.querySelector('.filters .filter-btn.active');
  let categoria = btnAtivo ? btnAtivo.textContent.trim().toLowerCase() : 'outros';
  if (categoria === 'tecidos') categoria = 'tecido'; // Ajuste para o Pattern do GastoDTO

  if (!valor || valor <= 0) {
    alert('Insira um valor válido maior que zero.');
    return;
  }

  if (!fileInput || fileInput.files.length === 0) {
    alert('Por favor, selecione um arquivo de comprovante.');
    return;
  }

  // Cria o FormData para envio Multipart
  const formData = new FormData();
  formData.append('valor', valor);
  formData.append('categoria', categoria);
  formData.append('descricao', descricao);
  
  if (categoria === 'marmitas') {
    formData.append('qtdMarmitas', 10); // Valor padrão ou capturado de um input
  } else {
    formData.append('qtdMarmitas', 0);
  }

  // O nome do parâmetro aqui deve ser exatamente o que o @RequestPart do seu Controller espera
  formData.append('comprovante', fileInput.files[0]);

  try {
    const response = await fetch(`${API_BASE_URL}/movimentacoes/gasto`, {
      method: 'POST',
      headers: getAuthHeaders(), // Não adicione Content-Type aqui, o browser resolve o boundary do multipart
      body: formData
    });

    if (!response.ok) {
      const txtErro = await response.text();
      throw new Error(txtErro || 'Erro ao registrar gasto.');
    }

    alert('Gasto registrado com sucesso e enviado para aprovação!');
    
    // Limpa os campos após o sucesso
    valorInput.value = '';
    descricaoInput.value = '';
    if (fileInput) fileInput.value = '';
    
  } catch (error) {
    console.error('Erro ao registrar gasto:', error);
    alert('Erro ao registrar gasto: ' + error.message);
  }
}

// BUSCAR MOVIMENTAÇÕES (HISTÓRICO / NOTIFICAÇÕES): Traz os dados reais da API
async function carregarMovimentacoes() {
  try {
    const response = await fetch(`${API_BASE_URL}/movimentacoes`, {
      method: 'GET',
      headers: getAuthHeaders({ 'Content-Type': 'application/json' })
    });

    if (!response.ok) throw new Error('Erro ao buscar movimentações da API.');

    const dados = await response.json();
    return dados; 
  } catch (error) {
    console.error('Erro ao carregar dados do servidor:', error);
    return [];
  }
}

// RENDERIZAR NOTIFICAÇÕES (Páginas pendentes)
async function renderNotificacoes() {
  const container = document.getElementById('lista-notificacoes');
  if (!container) return;

  container.innerHTML = '<p style="padding:20px;">Carregando notificações reais...</p>';
  const movimentacoes = await carregarMovimentacoes();
  
  // Filtra ignorando maiúsculas/minúsculas
  const pendentes = movimentacoes.filter(item => item.status && item.status.toLowerCase() === 'pendente');

  if (pendentes.length === 0) {
    container.innerHTML = '<p style="padding:20px; color:#666;">Nenhuma notificação ou doação pendente no momento.</p>';
    return;
  }

  container.innerHTML = '';
  pendentes.forEach(item => {
    const dataFormatada = new Date(item.dataCriacao).toLocaleString('pt-BR');
    
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-info">
        <div class="card-title">Nova entrada cadastrada (via formulário externo)</div>
        <div class="card-meta">Valor: R$ ${Number(item.valor).toFixed(2)} | Tipo: ${item.tipoMovimentacao}</div>
        <div class="card-date">Criado em: ${dataFormatada}</div>
      </div>
      <div class="card-actions">
        <button onclick="alterarStatusMovimentacao(${item.id}, 'APROVADO')" class="btn btn-approve">Aprovar</button>
        <button onclick="alterarStatusMovimentacao(${item.id}, 'REJEITADO')" class="btn btn-reject">Rejeitar</button>
      </div>
    `;
    container.appendChild(card);
  });

  atualizarSaldoGeral(movimentacoes);
}

// RENDERIZAR HISTÓRICO (Filtro Todos / Doações / Gastos)
async function renderHistorico(filtro = 'Todos') {
  const container = document.getElementById('lista-historico'); 
  if (!container) return;

  container.innerHTML = '<p style="padding:20px;">Carregando histórico...</p>';
  const movimentacoes = await carregarMovimentacoes();

  // Exibe apenas as aprovadas no histórico
  let filtradas = movimentacoes.filter(item => item.status && item.status.toLowerCase() === 'aprovado');

  if (filtro === 'Doação') {
    filtradas = filtradas.filter(item => item.tipoMovimentacao && item.tipoMovimentacao.toLowerCase() === 'doacao');
  } else if (filtro === 'Gasto') {
    filtradas = filtradas.filter(item => item.tipoMovimentacao && item.tipoMovimentacao.toLowerCase() === 'gasto');
  }

  if (filtradas.length === 0) {
    container.innerHTML = `<p style="padding:20px; color:#666;">Nenhum registro encontrado para a categoria: ${filtro}.</p>`;
    return;
  }

  container.innerHTML = '';
  filtradas.forEach(item => {
    const dataFormatada = new Date(item.dataCriacao).toLocaleString('pt-BR');
    const isDoacao = item.tipoMovimentacao && item.tipoMovimentacao.toLowerCase() === 'doacao';
    const badgeClass = isDoacao ? 'status-entrada' : 'status-saida';
    const sinal = isDoacao ? '+' : '-';

    const card = document.createElement('div');
    card.className = 'card card-gasto';
    card.innerHTML = `
      <div class="gasto-info">
        <div class="card-title" style="display:flex; align-items:center; gap:10px;">
          ${item.tipoMovimentacao.toUpperCase()} 
          <span class="status-badge ${badgeClass}">${isDoacao ? 'Recebido' : 'Gasto'}</span>
        </div>
        <div class="card-meta">Descrição: ${item.descricao || 'Movimentação do instituto'}</div>
        ${item.urlComprovante ? `<div class="card-meta"><a href="${item.urlComprovante}" target="_blank" style="color:#44d1c7; font-weight:bold;">📄 Ver Comprovante</a></div>` : ''}
      </div>
      <div class="gasto-retorno">
        <div class="card-title" style="color: ${isDoacao ? '#2e7d32' : '#c62828'}">
          ${sinal} R$ ${Number(item.valor).toFixed(2)}
        </div>
        <div class="status-timeline">
          <span style="font-size:12px; color:#888;">Processado em</span>
          <span style="font-weight:bold; font-size:13px;">${dataFormatada}</span>
        </div>
      </div>
    `;
    container.appendChild(card);
  });

  atualizarSaldoGeral(movimentacoes);
}

// RENDERIZAR REJEITADOS
async function renderRejeitados() {
  const container = document.getElementById('lista-rejeitados');
  if (!container) return;

  container.innerHTML = '<p style="padding:20px;">Carregando itens rejeitados...</p>';
  const movimentacoes = await carregarMovimentacoes();
  const rejeitados = movimentacoes.filter(item => item.status && item.status.toLowerCase() === 'rejeitado');

  if (rejeitados.length === 0) {
    container.innerHTML = '<p style="padding:20px; color:#666;">Nenhum registro foi rejeitado.</p>';
    return;
  }

  container.innerHTML = '';
  rejeitados.forEach(item => {
    const dataFormatada = new Date(item.dataCriacao).toLocaleString('pt-BR');
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <div class="card-info">
        <div class="card-title" style="color:#c62828;">Registro Rejeitado</div>
        <div class="card-meta">Valor: R$ ${Number(item.valor).toFixed(2)} | Tipo: ${item.tipoMovimentacao}</div>
        <div class="card-date">Modificado em: ${dataFormatada}</div>
      </div>
    `;
    container.appendChild(card);
  });

  atualizarSaldoGeral(movimentacoes);
}

// AÇÃO DE APROVAR OU REJEITAR
async function alterarStatusMovimentacao(id, novoStatus) {
  try {
    // RECOMENDAÇÃO: Ajuste esta URL para bater com o método de atualizar status que você criar no back-end
    let urlEndpoint = `${API_BASE_URL}/movimentacoes/${id}/status?status=${novoStatus}`;
    
    const response = await fetch(urlEndpoint, {
      method: 'PATCH', // Geralmente usa-se PATCH ou PUT para atualizações parciais
      headers: getAuthHeaders({ 'Content-Type': 'application/json' })
    });

    if (!response.ok) throw new Error('Não foi possível processar a ação no servidor.');

    alert(`Movimentação atualizada para ${novoStatus} com sucesso!`);
    renderNotificacoes();
  } catch (error) {
    console.error(error);
    alert('Erro ao atualizar status no servidor. Verifique o mapeamento da rota no back-end.');
  }
}

// CALCULAR E ATUALIZAR SALDO DINAMICAMENTE
function atualizarSaldoGeral(movimentacoes) {
  const saldoElement = document.querySelector('.saldo');
  if (!saldoElement) return;

  let saldo = 0;
  movimentacoes.forEach(item => {
    if (item.status && item.status.toLowerCase() === 'aprovado') {
      if (item.tipoMovimentacao && item.tipoMovimentacao.toLowerCase() === 'doacao') {
        saldo += Number(item.valor);
      } else if (item.tipoMovimentacao && item.tipoMovimentacao.toLowerCase() === 'gasto') {
        saldo -= Number(item.valor);
      }
    }
  });

  saldoElement.textContent = `Saldo atual: R$ ${saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// FILTRAR HISTÓRICO (Botões da tela)
function filtrarHistorico(tipo) {
  const botoes = document.querySelectorAll('.filters .filter-btn');
  botoes.forEach(btn => {
    if (btn.textContent.trim().includes(tipo) || (tipo === 'Todos' && btn.textContent.trim() === 'Todos')) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  
  renderHistorico(tipo);
}

// INICIALIZADOR AUTOMÁTICO DE ACORDO COM A PÁGINA ABERTA
document.addEventListener('DOMContentLoaded', () => {
  // Configura os botões de categoria na página de registrar gastos
  const botoesFiltro = document.querySelectorAll('.card .filters .filter-btn');
  botoesFiltro.forEach(btn => {
    btn.addEventListener('click', function() {
      botoesFiltro.forEach(b => b.classList.remove('active'));
      this.classList.add('active');
    });
  });

  // Proteção: se não estiver logado e não estiver na login.html, vai ser redirecionado pelo getAuthHeaders
  if (!localStorage.getItem('token') && !window.location.href.includes('login.html')) {
    window.location.href = 'login.html';
    return;
  }

  // Identifica a página ativa pelo ID do elemento container e popula com os dados reais
  if (document.getElementById('lista-notificacoes')) {
    renderNotificacoes();
  }
  if (document.getElementById('lista-historico')) {
    renderHistorico('Todos');
  }
  if (document.getElementById('lista-rejeitados')) {
    renderRejeitados();
  }
});