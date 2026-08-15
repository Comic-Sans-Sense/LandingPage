console.log('Sistema iniciado');

// =====================================================================
// CONFIGURAÇÃO DA API

const API_BASE_URL = 'http://localhost:8080/api';

// Recupera o token salvo no login
function getToken() {
  return localStorage.getItem('token');
}

// Wrapper de fetch que já injeta o token JWT quando existe
async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = options.headers || {};

  if (token) {
    headers['Authorization'] = 'Bearer ' + token;
  }

  const resposta = await fetch(API_BASE_URL + path, { ...options, headers });

  // Se o token expirou ou é inválido, o back-end responde 401/403
  if (resposta.status === 401 || resposta.status === 403) {
    localStorage.removeItem('token');
    alert('Sua sessão expirou. Faça login novamente.');
    window.location.href = 'login.html';
    throw new Error('Não autenticado');
  }

  return resposta;
}

// Guarda de autenticação: em qualquer página que não seja login.html,
// se não houver token salvo, manda o usuário de volta pro login.
(function protegerPagina() {
  const paginaAtual = window.location.pathname.split('/').pop();
  if (paginaAtual !== 'login.html' && !getToken()) {
    window.location.href = 'login.html';
  }
})();

// =====================================================================
// LOGIN
// =====================================================================
async function login() {
  const email = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  if (senha.trim() === '' || email.trim() === '') {
    alert('Digite e-mail e senha');
    return;
  }

  try {
    const resposta = await fetch(API_BASE_URL + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, senha: senha })
    });

    if (!resposta.ok) {
      alert('E-mail ou senha inválidos');
      return;
    }

    // O back-end retorna o token como texto puro, não como JSON
    const token = await resposta.text();
    localStorage.setItem('token', token);
    window.location.href = 'notificacoes.html';
  } catch (erro) {
    console.error(erro);
    alert('Não foi possível conectar ao servidor. Verifique se o back-end está rodando.');
  }
}

// =====================================================================
// MAPEAMENTO DE CATEGORIAS (front <-> back)
// =====================================================================
// O back-end só aceita "marmitas", "tecido" ou "outros" (regex no GastoDTO).
// O front usa os rótulos "Marmitas", "Tecidos", "Outros".
const CATEGORIA_FRONT_PARA_BACK = {
  'Marmitas': 'marmitas',
  'Tecidos': 'tecido',
  'Outros': 'outros'
};

const CATEGORIA_BACK_PARA_FRONT = {
  'marmitas': 'Marmitas',
  'tecido': 'Tecidos',
  'outros': 'Outros'
};

// =====================================================================
// DADOS (agora vêm da API, não mais do localStorage)
// =====================================================================
let notificacoes = [];
let historico = [];
let rejeitados = [];

// Formata data ISO (vinda do back) no mesmo padrão que o front já usava
function formatarData(dataIso) {
  if (!dataIso) return '';
  const d = new Date(dataIso);
  return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// Converte um item vindo do back-end (Doacao ou Gasto) para o formato
// que as funções de render já esperam (mesmo "shape" do mock antigo)
function adaptarMovimentacao(item) {
  const ehDoacao = item.tipoMovimentacao === 'doacao';

  return {
    id: item.id,
    valor: item.valor,
    tipo: item.tipoMovimentacao, // 'doacao' | 'gasto'
    status: item.status,         // 'pendente' | 'aprovado' | 'rejeitado'
    categoria: ehDoacao ? 'Doação' : (CATEGORIA_BACK_PARA_FRONT[item.categoria] || item.categoria),
    descricao: item.descricao || null,
    comprovante: item.urlComprovante || null,
    // O back-end não guarda nome de doador no modelo Doacao atualmente
    nome: ehDoacao ? 'Doador não identificado' : null,
    data: formatarData(item.dataCriacao),
    // O back-end não guarda uma data separada de aprovação/rejeição,
    // então usamos a mesma data de criação como aproximação
    dataProcessamento: item.status !== 'pendente' ? formatarData(item.dataCriacao) : null
  };
}

// Busca as movimentações do mês atual e separa em notificações / histórico / rejeitados.
// OBS: o back-end não tem um endpoint de "listar tudo", só filtro por
// mês/ano ou data exata. Por isso usamos o mês corrente como padrão.
// Se precisar ver meses anteriores, é necessário pedir ao back-end um
// endpoint de listagem completa ou por período customizado.
async function carregarDados() {
  const agora = new Date();
  const ano = agora.getFullYear();
  const mes = agora.getMonth() + 1;

  try {
    const resposta = await apiFetch(`/movimentacoes/filtro/data?ano=${ano}&mes=${mes}`, {
      method: 'GET'
    });

    if (!resposta.ok) {
      console.error('Erro ao buscar movimentações:', resposta.status);
      return;
    }

    const dados = await resposta.json();
    const adaptados = dados.map(adaptarMovimentacao);

    notificacoes = adaptados.filter(item => item.tipo === 'doacao' && item.status === 'pendente');
    historico = adaptados.filter(item => item.status === 'aprovado');
    rejeitados = adaptados.filter(item => item.status === 'rejeitado');

    renderNotificacoes();
    renderHistorico();
    renderRejeitados();
    atualizarSaldo();
  } catch (erro) {
    console.error('Erro ao carregar dados:', erro);
  }
}

// =====================================================================
// REGISTRAR GASTO
// =====================================================================
async function registrarGasto() {
  const valor = document.getElementById('valor').value;
  const descricao = document.getElementById('descricao').value;
  const categoriaFront = document.querySelector('.filter-btn.active').innerText;
  const arquivoInput = document.getElementById('file-input');

  if (valor === '' || descricao === '') {
    alert('Preencha todos os campos');
    return;
  }

  const categoriaBack = CATEGORIA_FRONT_PARA_BACK[categoriaFront] || categoriaFront.toLowerCase();

  const formData = new FormData();
  formData.append('valor', valor);
  formData.append('categoria', categoriaBack);
  formData.append('descricao', descricao);

  if (arquivoInput.files[0]) {
    formData.append('comprovante', arquivoInput.files[0]);
  }

  try {
    // Não define Content-Type manualmente: o navegador define o
    // boundary do multipart/form-data automaticamente.
    const resposta = await apiFetch('/movimentacoes/gasto', {
      method: 'POST',
      body: formData
    });

    if (!resposta.ok) {
      const erroTexto = await resposta.text();
      alert('Erro ao registrar gasto: ' + erroTexto);
      return;
    }

    await carregarDados();

    alert('Gasto registrado com sucesso');

    document.getElementById('valor').value = '';
    document.getElementById('descricao').value = '';
  } catch (erro) {
    console.error(erro);
  }
}

// =====================================================================
// RENDER NOTIFICAÇÕES
// =====================================================================
function renderNotificacoes() {
  const container = document.getElementById('lista-notificacoes');
  if (!container) return;

  container.innerHTML = '';

  if (notificacoes.length === 0) {
    container.innerHTML = `<div class="card"><p>Nenhuma notificação encontrada.</p></div>`;
    return;
  }

  notificacoes.forEach(item => {
    const ehDoacao = item.tipo === 'doacao';
    const titulo = ehDoacao ? 'Nova doação recebida' : 'Revisão de Gasto';
    const infoExtra = ehDoacao ? `Doador: ${item.nome}` : `Descrição: ${item.descricao}`;

    container.innerHTML += `
      <div class="card">
        <div class="valor">R$ ${parseFloat(item.valor).toFixed(2)}</div>
        <div class="data">${item.data}</div>

        <p><strong>${titulo}</strong></p>
        <p>${infoExtra}</p>
        ${ehDoacao ? `<p>Comprovante: ${item.comprovante ? 'enviado' : 'não enviado'}</p>` : `<p>Categoria: ${item.categoria}</p>`}

        <div class="actions">
          <button class="btn btn-red" onclick="rejeitarGasto(${item.id})">Rejeitar</button>
          <button class="btn btn-green" onclick="aprovarGasto(${item.id})">Aprovar</button>
        </div>
      </div>
    `;
  });
}

// =====================================================================
// APROVAR / REJEITAR (doações pendentes -> notificações)
// =====================================================================
// Apenas doações têm fluxo de aprovação/rejeição no back-end
// (MovimentacaoService.atualizarStatusDoacao lança erro para gastos).
async function alterarStatusDoacao(id, novoStatus) {
  try {
    const resposta = await apiFetch(`/movimentacoes/doacao/${id}/status?novoStatus=${novoStatus}`, {
      method: 'PUT'
    });

    if (!resposta.ok) {
      const erroTexto = await resposta.text();
      alert('Erro ao atualizar status: ' + erroTexto);
      return false;
    }

    return true;
  } catch (erro) {
    console.error(erro);
    return false;
  }
}

async function rejeitarGasto(id) {
  const ok = await alterarStatusDoacao(id, 'rejeitado');
  if (ok) await carregarDados();
}

async function aprovarGasto(id) {
  const ok = await alterarStatusDoacao(id, 'aprovado');
  if (ok) {
    await carregarDados();
    alert('Doação aprovada e enviada para o histórico!');
  }
}

// =====================================================================
// RENDER HISTÓRICO
// =====================================================================
let filtroAtual = 'Todos';

function filtrarHistorico(categoria) {
  filtroAtual = categoria;
  renderHistorico();
}

function renderHistorico() {
  const container = document.getElementById('lista-historico');
  if (!container) return;

  container.innerHTML = '';

  const dadosFiltrados = historico
    .slice()
    .reverse()
    .filter(item => {
      if (filtroAtual === 'Todos') return true;
      return item.categoria === filtroAtual;
    });

  if (dadosFiltrados.length === 0) {
    container.innerHTML = `<div class="card"><p>Nenhum registro encontrado.</p></div>`;
    return;
  }

  dadosFiltrados.forEach(gasto => {
    const badgeClass = gasto.tipo === 'doacao' ? 'badge-green' : 'badge-red';
    const tipoTexto = gasto.tipo === 'doacao' ? 'Entrada' : 'Saída';

    const rotuloStatus = gasto.status === 'rejeitado' ? 'Rejeitado em:' : 'Aprovado em:';
    const dataProc = gasto.dataProcessamento || gasto.data;

    container.innerHTML += `
      <div class="card card-gasto">

        <div class="gasto-info">
          <div class="valor" style="color: ${gasto.tipo === 'doacao' ? '#37c777' : '#ef3d3d'}">
            ${gasto.tipo === 'doacao' ? '+' : '-'} R$ ${parseFloat(gasto.valor).toFixed(2)}
          </div>
          <div class="data">
            <strong>Criado em:</strong> ${gasto.data}
            <span class="badge ${badgeClass}">${gasto.tipo === 'doacao' ? 'Doação' : 'Gasto'}</span>
          </div>
          <p><strong>Categoria:</strong> ${gasto.categoria}</p>
          <p style="margin-top: 5px; color: #555;">${gasto.descricao || 'Processado pelo sistema'}</p>

          <div class="actions">
            <button class="btn btn-green" style="padding: 6px 12px; font-size: 14px;" onclick="editarGasto(${gasto.id})">Editar</button>
            <button class="btn btn-red" style="padding: 6px 12px; font-size: 14px;" onclick="excluirHistorico(${gasto.id})">Excluir</button>
          </div>
        </div>

        <div class="gasto-retorno">
          <div class="status-timeline">
            <span class="status-label">${rotuloStatus}</span>
            <span class="status-data">${dataProc}</span>
          </div>

          <div class="gasto-comprovante">
            <a href="${gasto.comprovante || '#'}" target="_blank" class="btn-comprovante" ${!gasto.comprovante ? 'style="opacity: 0.5; pointer-events: none;" title="Sem comprovante"' : ''}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
              </svg>
              Comprovante
            </a>
          </div>
        </div>

      </div>
    `;
  });
}

// =====================================================================
// EDITAR GASTO
// =====================================================================
// Só é possível editar GASTOS pelo back-end (não existe endpoint de
// edição para doações).
async function editarGasto(id) {
  const gasto = historico.find(item => item.id === id);
  if (!gasto) return;

  if (gasto.tipo === 'doacao') {
    alert('Doações não podem ser editadas.');
    return;
  }

  const novoValor = prompt('Novo valor:', gasto.valor);
  const novaDescricao = prompt('Nova descrição:', gasto.descricao || '');

  if (novoValor && novaDescricao) {
    const categoriaBack = CATEGORIA_FRONT_PARA_BACK[gasto.categoria] || gasto.categoria.toLowerCase();

    try {
      const resposta = await apiFetch(`/movimentacoes/gasto/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valor: parseFloat(novoValor),
          categoria: categoriaBack,
          descricao: novaDescricao,
          qtdMarmitas: null
        })
      });

      if (!resposta.ok) {
        const erroTexto = await resposta.text();
        alert('Erro ao editar gasto: ' + erroTexto);
        return;
      }

      await carregarDados();
    } catch (erro) {
      console.error(erro);
    }
  }
}

// =====================================================================
// EXCLUIR HISTÓRICO
// =====================================================================
// Doação: o back-end permite mudar o status para "rejeitado" (vai pra
// aba Rejeitados, como no front original).
// Gasto: o back-end NÃO tem endpoint de "rejeitar" gasto, só exclusão
// permanente. Por isso, excluir um gasto no histórico apaga de vez.
async function excluirHistorico(id) {
  const itemParaMover = historico.find(item => item.id === id);
  if (!itemParaMover) return;

  if (itemParaMover.tipo === 'doacao') {
    const ok = await alterarStatusDoacao(id, 'rejeitado');
    if (ok) {
      await carregarDados();
      alert('O registro foi movido para a aba de Rejeitados.');
    }
    return;
  }

  // tipo === 'gasto': exclusão é permanente no back-end
  const confirmar = confirm('Gastos não podem ser "rejeitados", apenas excluídos permanentemente. Deseja excluir este gasto?');
  if (!confirmar) return;

  try {
    const resposta = await apiFetch(`/movimentacoes/gasto/${id}`, { method: 'DELETE' });

    if (!resposta.ok && resposta.status !== 204) {
      const erroTexto = await resposta.text();
      alert('Erro ao excluir gasto: ' + erroTexto);
      return;
    }

    await carregarDados();
    alert('Gasto excluído permanentemente.');
  } catch (erro) {
    console.error(erro);
  }
}

// =====================================================================
// RENDER REJEITADOS
// =====================================================================
function renderRejeitados() {
  const container = document.getElementById('lista-rejeitados');
  if (!container) return;

  container.innerHTML = '';

  if (rejeitados.length === 0) {
    container.innerHTML = `<div class="card"><p>Nenhum registro rejeitado.</p></div>`;
    return;
  }

  rejeitados.slice().reverse().forEach(gasto => {
    const dataProc = gasto.dataProcessamento || gasto.data;

    container.innerHTML += `
      <div class="card card-gasto">

        <div class="gasto-info">
          <div class="valor" style="color: #ef3d3d">
            - R$ ${parseFloat(gasto.valor).toFixed(2)}
          </div>

          <div class="data">
            <strong>Criado em:</strong> ${gasto.data}
            <span class="badge badge-red">Rejeitado</span>
          </div>

          <p><strong>Categoria:</strong> ${gasto.categoria || 'Não definida'}</p>
          <p style="margin-top: 5px; color: #555;">
            ${gasto.descricao || 'Registro removido do histórico'}
          </p>

          <div class="actions">
            <button class="btn btn-cyan" onclick="verificarNovamente(${gasto.id})">
              Restaurar (Verificar)
            </button>

            <button class="btn btn-red" onclick="excluirRejeitado(${gasto.id})">
              Excluir Permanentemente
            </button>
          </div>
        </div>

        <div class="gasto-retorno">

          <div class="status-timeline">
            <span class="status-label">Rejeitado em:</span>
            <span class="status-data">${dataProc}</span>
          </div>

          <div class="gasto-comprovante">
            <a href="${gasto.comprovante || '#'}"
               target="_blank"
               class="btn-comprovante"
               ${!gasto.comprovante ? 'style="opacity: 0.5; pointer-events: none;" title="Sem comprovante"' : ''}>

              <svg width="16" height="16" viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round">

                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>

              </svg>

              Comprovante
            </a>
          </div>

        </div>

      </div>
    `;
  });
}

// =====================================================================
// VERIFICAR NOVAMENTE (só se aplica a doações, ver excluirHistorico)
// =====================================================================
async function verificarNovamente(id) {
  const gasto = rejeitados.find(item => item.id === id);
  if (!gasto) return;

  if (gasto.tipo !== 'doacao') {
    alert('Este tipo de registro não pode ser restaurado.');
    return;
  }

  const ok = await alterarStatusDoacao(id, 'pendente');
  if (ok) {
    await carregarDados();
    alert('O registro retornou para a aba de notificações para nova conferência.');
  }
}

// =====================================================================
// EXCLUIR REJEITADO (permanente)
// =====================================================================
// O back-end só tem exclusão permanente para GASTOS. Doações rejeitadas
// não têm endpoint de exclusão no back-end atual.
async function excluirRejeitado(id) {
  const gasto = rejeitados.find(item => item.id === id);
  if (!gasto) return;

  if (gasto.tipo === 'doacao') {
    alert('O back-end ainda não tem um endpoint para excluir doações permanentemente. Fale com quem fez o back-end sobre isso.');
    return;
  }

  try {
    const resposta = await apiFetch(`/movimentacoes/gasto/${id}`, { method: 'DELETE' });

    if (!resposta.ok && resposta.status !== 204) {
      const erroTexto = await resposta.text();
      alert('Erro ao excluir: ' + erroTexto);
      return;
    }

    await carregarDados();
  } catch (erro) {
    console.error(erro);
  }
}

// =====================================================================
// SALDO
// =====================================================================
function atualizarSaldo() {
  const saldoElements = document.querySelectorAll('.saldo');
  let entradas = 0;
  let saidas = 0;

  historico.forEach(item => {
    if (item.tipo === 'doacao') {
      entradas += Number(item.valor);
    } else {
      saidas += Number(item.valor);
    }
  });

  const saldoTotal = entradas - saidas;

  saldoElements.forEach(el => {
    el.innerHTML = `Saldo atual: R$ ${saldoTotal.toFixed(2)}`;
  });
}

// =====================================================================
// FILTROS DE CATEGORIA (botões do formulário de registrar gasto)
// =====================================================================
const botoes = document.querySelectorAll('.filter-btn');

botoes.forEach(botao => {
  botao.addEventListener('click', () => {
    botoes.forEach(btn => btn.classList.remove('active'));
    botao.classList.add('active');
  });
});

// Carrega os dados reais da API ao abrir qualquer página (exceto login)
if (window.location.pathname.split('/').pop() !== 'login.html') {
  carregarDados();
}

// =====================================================================
// AMBIENTE DE TESTES
// =====================================================================
// Antes isso só criava um registro fake no localStorage. Agora ele cria
// uma doação PENDENTE de verdade no back-end (rota pública /doacao),
// pra você conseguir testar o fluxo de aprovar/rejeitar na tela de
// Notificações sem precisar de um formulário externo de doação.
async function gerarDoacaoMock() {
  const valorSorteado = (Math.random() * 500 + 10).toFixed(2);

  const formData = new FormData();
  formData.append('valor', valorSorteado);

  try {
    const resposta = await fetch(API_BASE_URL + '/movimentacoes/doacao', {
      method: 'POST',
      body: formData
    });

    if (!resposta.ok) {
      const erroTexto = await resposta.text();
      alert('Erro ao gerar doação de teste: ' + erroTexto);
      return;
    }

    await carregarDados();
    alert(`Nova doação de teste (R$ ${valorSorteado}) gerada na aba de Notificações!`);
  } catch (erro) {
    console.error(erro);
  }
}