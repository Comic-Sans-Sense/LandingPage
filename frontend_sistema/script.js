console.log('Sistema iniciado com integração à API');

// CONFIGURAÇÕES DA API
const API_BASE_URL = 'http://localhost:8080';
const USERNAME = 'moiseskennedy2005@gmail.com';
const PASSWORD = 'moises123';

// Geração do Token Basic Auth
const authHeader = 'Basic ' + btoa(`${USERNAME}:${PASSWORD}`);

// Headers padrão para requisições JSON
const jsonHeaders = {
  'Content-Type': 'application/json',
  'Authorization': authHeader
};

// Headers padrão para requisições que não mudam o corpo (GET, DELETE)
const defaultHeaders = {
  'Authorization': authHeader
};

// Variáveis de estado da aplicação (substituindo o localStorage)
let notificacoes = [];
let historico = [];
let rejeitados = [];
let filtroAtual = 'Todos';

// LOGIN
function login() {
  const senha = document.getElementById('senha').value;

  if (senha.trim() === '') {
    alert('Digite uma senha');
    return;
  }

  // Como o login agora é fixo e autenticado via API pelo Basic Auth,
  // validamos localmente ou simulamos o sucesso se a senha bater com a da API
  if (senha === PASSWORD) {
    localStorage.setItem('logado', 'true');
    window.location.href = 'notificacoes.html';
  } else {
    alert('Senha incorreta.');
  }
}

// BUSCAR DADOS DA API
async function carregarDados() {
  try {
    // Busca paralela de todas as listagens da API
    const [resNotif, resHist, resRejeitados] = await Promise.all([
      fetch(`${API_BASE_URL}/api/notificacoes`, { headers: defaultHeaders }),
      fetch(`${API_BASE_URL}/api/gastos`, { headers: defaultHeaders }),
      fetch(`${API_BASE_URL}/api/gastos/rejeitados`, { headers: defaultHeaders })
    ]);

    if (resNotif.ok) notificacoes = await resNotif.json();
    if (resHist.ok) historico = await resHist.json();
    if (resRejeitados.ok) rejeitados = await resRejeitados.json();

    // Atualiza os componentes visuais após o carregamento bem-sucedido
    renderNotificacoes();
    renderHistorico();
    renderRejeitados();
    atualizarSaldo();

  } catch (error) {
    console.error('Erro ao conectar com a API:', error);
  }
}

// REGISTRAR GASTO (Com upload para Cloudinary via API)
async function registrarGasto() {
  const valor = document.getElementById('valor').value;
  const descricao = document.getElementById('descricao').value;
  
  const btnActive = document.querySelector('.filter-btn.active');
  const categoria = btnActive ? btnActive.innerText : 'Geral';
  
  // Elemento do tipo file no HTML para o novo fluxo do Cloudinary
  const inputComprovante = document.getElementById('comprovante'); 

  if (valor === '' || descricao === '') {
    alert('Preencha todos os campos');
    return;
  }

  // Criação do FormData para suportar envio de arquivos e strings juntos
  const formData = new FormData();
  formData.append('valor', parseFloat(valor));
  formData.append('descricao', descricao);
  formData.append('categoria', categoria);
  formData.append('tipo', 'gasto');
  
  if (inputComprovante && inputComprovante.files[0]) {
    formData.append('file', inputComprovante.files[0]); // Arquivo capturado do input
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/gastos`, {
      method: 'POST',
      headers: {
        'Authorization': authHeader // Nota: Não definir Content-Type manual para FormData
      },
      body: formData
    });

    if (!response.ok) throw new Error('Erro ao salvar o gasto no servidor.');

    alert('Gasto registrado com sucesso');
    
    // Limpa os campos
    document.getElementById('valor').value = '';
    document.getElementById('descricao').value = '';
    if (inputComprovante) inputComprovante.value = '';

    // Recarrega os dados atualizados da API
    carregarDados();

  } catch (error) {
    alert('Falha ao registrar gasto: ' + error.message);
  }
}

// RENDER NOTIFICAÇÕES
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
        <div class="data">${item.data || new Date(item.createdAt).toLocaleString('pt-BR')}</div>

        <p><strong>${titulo}</strong></p>
        <p>${infoExtra}</p>
        ${ehDoacao ? `<p>Comprovante: <a href="${item.comprovante}" target="_blank">Ver Imagem</a></p>` : `<p>Categoria: ${item.categoria}</p>`}

        <div class="actions">
          <button class="btn btn-red" onclick="rejeitarGasto(${item.id})">Rejeitar</button>
          <button class="btn btn-green" onclick="aprovarGasto(${item.id})">Aprovar</button>
        </div>
      </div>
    `;
  });
}

// APROVAR DOACÃO/GASTO PENDENTE
async function aprovarGasto(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notificacoes/${id}/aprovar`, {
      method: 'POST',
      headers: jsonHeaders
    });

    if (!response.ok) throw new Error('Não foi possível aprovar o item.');

    alert('Registro aprovado e enviado para o histórico!');
    carregarDados();
  } catch (error) {
    alert(error.message);
  }
}

// REJEITAR NOTIFICAÇÃO
async function rejeitarGasto(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/notificacoes/${id}/rejeitar`, {
      method: 'POST',
      headers: jsonHeaders
    });

    if (!response.ok) throw new Error('Não foi possível rejeitar o item.');

    alert('O registro foi movido para a aba de Rejeitados.');
    carregarDados();
  } catch (error) {
    alert(error.message);
  }
}

// FILTROS DE CATEGORIA
function filtrarHistorico(categoria) {
  filtroAtual = categoria;
  renderHistorico();
}

// RENDER HISTÓRICO
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

// EDITAR REGISTRO NO BACK-END
async function editarGasto(id) {
  const gasto = historico.find(item => item.id === id);

  const novoValor = prompt('Novo valor:', gasto.valor);
  const novaDescricao = prompt('Nova descrição:', gasto.descricao);

  if (novoValor && novaDescricao) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gastos/${id}`, {
        method: 'PUT',
        headers: jsonHeaders,
        body: JSON.stringify({
          valor: parseFloat(novoValor),
          descricao: novaDescricao,
          categoria: gasto.categoria,
          tipo: gasto.tipo
        })
      });

      if (!response.ok) throw new Error('Erro ao atualizar dados no servidor.');

      alert('Registro atualizado com sucesso!');
      carregarDados();
    } catch (error) {
      alert(error.message);
    }
  }
}

// MOVER DO HISTÓRICO PARA REJEITADOS
async function excluirHistorico(id) {
  if (confirm('Tem certeza que deseja rejeitar e remover este registro do histórico?')) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gastos/${id}/mover-rejeitados`, {
        method: 'POST',
        headers: jsonHeaders
      });

      if (!response.ok) throw new Error('Erro ao processar requisição no back-end.');

      alert('O registro foi movido para a aba de Rejeitados.');
      carregarDados();
    } catch (error) {
      alert(error.message);
    }
  }
}

// RENDER REJEITADOS
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
          <div class="valor" style="color: #ef3d3d">- R$ ${parseFloat(gasto.valor).toFixed(2)}</div>
          <div class="data">
            <strong>Criado em:</strong> ${gasto.data}
            <span class="badge badge-red">Rejeitado</span>
          </div>
          <p><strong>Categoria:</strong> ${gasto.categoria || 'Não definida'}</p>
          <p style="margin-top: 5px; color: #555;">${gasto.descricao || 'Registro removido do histórico'}</p>

          <div class="actions">
            <button class="btn btn-cyan" onclick="verificarNovamente(${gasto.id})">Restaurar (Verificar)</button>
            <button class="btn btn-red" onclick="excluirRejeitado(${gasto.id})">Excluir Permanentemente</button>
          </div>
        </div>

        <div class="gasto-retorno">
          <div class="status-timeline">
            <span class="status-label">Rejeitado em:</span>
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

// RESTAURAR REJEITADO PARA CONFIRMAÇÃO
async function verificarNovamente(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/gastos/rejeitados/${id}/restaurar`, {
      method: 'POST',
      headers: jsonHeaders
    });

    if (!response.ok) throw new Error('Não foi possível restaurar o item.');

    alert('O registro retornou para a aba de notificações para nova conferência.');
    carregarDados();
  } catch (error) {
    alert(error.message);
  }
}

// EXCLUIR PERMANENTEMENTE DO BANCO
async function excluirRejeitado(id) {
  if (confirm('Ação irreversível. Deseja deletar permanentemente este registro da base de dados?')) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/gastos/rejeitados/${id}`, {
        method: 'DELETE',
        headers: defaultHeaders
      });

      if (!response.ok) throw new Error('Erro ao deletar registro no servidor.');

      alert('Registro apagado permanentemente.');
      carregarDados();
    } catch (error) {
      alert(error.message);
    }
  }
}

// CALCULAR SALDO REAL COM DADOS DO BANCO
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

// EVENT LISTENER DOS FILTROS VIZUAIS
const botoes = document.querySelectorAll('.filter-btn');
botoes.forEach(botao => {
  botao.addEventListener('click', () => {
    botoes.forEach(btn => btn.classList.remove('active'));
    botao.classList.add('active');
  });
});

// DISPARO INICIAL AO CARREGAR A PÁGINA
carregarDados();