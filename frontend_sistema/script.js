console.log('Sistema iniciado');

// LOGIN
function login() {
  const senha = document.getElementById('senha').value;

  if(senha.trim() === '') {
    alert('Digite uma senha');
    return;
  }

  localStorage.setItem('logado', 'true');
  window.location.href = 'notificacoes.html';
}

// DADOS MOCK
let notificacoes = JSON.parse(localStorage.getItem('notificacoes')) || [
  {
    id: 1,
    valor: 100,
    nome: 'João',
    tipo: 'doacao',
    comprovante: 'comprovante.jpg',
    data: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
  }
];

let historico = JSON.parse(localStorage.getItem('historico')) || [];
let rejeitados = JSON.parse(localStorage.getItem('rejeitados')) || [];

// SALVAR
function salvarDados() {
  localStorage.setItem('notificacoes', JSON.stringify(notificacoes));
  localStorage.setItem('historico', JSON.stringify(historico));
  localStorage.setItem('rejeitados', JSON.stringify(rejeitados));
}

// REGISTRAR GASTO
function registrarGasto() {
  const valor = document.getElementById('valor').value;
  const descricao = document.getElementById('descricao').value;
  const categoria = document.querySelector('.filter-btn.active').innerText;

  if(valor === '' || descricao === '') {
    alert('Preencha todos os campos');
    return;
  }

  const novoGasto = {
    id: Date.now(),
    valor: parseFloat(valor),
    descricao: descricao,
    categoria: categoria,
    tipo: 'gasto',
    comprovante: 'comprovante_gasto.jpg',
    // Altere esta linha abaixo:
    data: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
  };

  historico.push(novoGasto);

  salvarDados();

  atualizarSaldo();
  renderHistorico();

  alert('Gasto registrado com sucesso');

  document.getElementById('valor').value = '';
  document.getElementById('descricao').value = '';
}

// RENDER NOTIFICAÇÕES
function renderNotificacoes() {
  const container = document.getElementById('lista-notificacoes');
  if(!container) return;

  container.innerHTML = '';

  if(notificacoes.length === 0) {
    container.innerHTML = `<div class="card"><p>Nenhuma notificação encontrada.</p></div>`;
    return;
  }

  notificacoes.forEach(item => {
    // Define o título e detalhes com base no tipo original
    const ehDoacao = item.tipo === 'doacao';
    const titulo = ehDoacao ? 'Nova doação recebida' : 'Revisão de Gasto';
    const infoExtra = ehDoacao ? `Doador: ${item.nome}` : `Descrição: ${item.descricao}`;

    container.innerHTML += `
      <div class="card">
        <div class="valor">R$ ${parseFloat(item.valor).toFixed(2)}</div>
        <div class="data">${item.data}</div>

        <p><strong>${titulo}</strong></p>
        <p>${infoExtra}</p>
        ${ehDoacao ? `<p>Comprovante: ${item.comprovante}</p>` : `<p>Categoria: ${item.categoria}</p>`}

        <div class="actions">
          <button class="btn btn-red" onclick="rejeitarGasto(${item.id})">Rejeitar</button>
          <button class="btn btn-green" onclick="aprovarGasto(${item.id})">Aprovar</button>
        </div>
      </div>
    `;
  });
}

// APROVAR
function renderHistorico() {
  const container = document.getElementById('lista-historico');
  if(!container) return;

  container.innerHTML = '';

  const dadosFiltrados = historico.filter(item => {
    if (filtroAtual === 'Todos') return true;
    return item.categoria === filtroAtual;
  });

  if(dadosFiltrados.length === 0) {
    container.innerHTML = `<div class="card"><p>Nenhum registro encontrado.</p></div>`;
    return;
  }

  dadosFiltrados.forEach(gasto => {
    // Define a cor do badge baseada no tipo
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
}

// REJEITAR
function rejeitarGasto(id) {
  const gasto = notificacoes.find(item => item.id === id);

  gasto.status = 'rejeitado';

  gasto.dataProcessamento = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});

  rejeitados.push(gasto);

  notificacoes = notificacoes.filter(item => item.id !== id);

  salvarDados();
  renderNotificacoes();
}

// RENDER HISTÓRICO
// Variável global para controlar o filtro atual
let filtroAtual = 'Todos';

// Função chamada pelos botões no historico.html
function filtrarHistorico(categoria) {
  filtroAtual = categoria;
  renderHistorico();
}

function renderHistorico() {
  const container = document.getElementById('lista-historico');
  if(!container) return;

  container.innerHTML = '';

  const dadosFiltrados = historico
    .slice() 
    .reverse() 
    .filter(item => {
      if (filtroAtual === 'Todos') return true;
      return item.categoria === filtroAtual;
    });

  if(dadosFiltrados.length === 0) {
    container.innerHTML = `<div class="card"><p>Nenhum registro encontrado.</p></div>`;
    return;
  }

  dadosFiltrados.forEach(gasto => {
    const badgeClass = gasto.tipo === 'doacao' ? 'badge-green' : 'badge-red';
    const tipoTexto = gasto.tipo === 'doacao' ? 'Entrada' : 'Saída';
    
    // Define o texto sutil de aprovação ou rejeição com base no status do item
    const rotuloStatus = gasto.status === 'rejeitado' ? 'Rejeitado em:' : 'Aprovado em:';
    // Caso não tenha a data gravada ainda nos antigos, mostra a data padrão
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

// EDITAR
function editarGasto(id) {
  const gasto = historico.find(item => item.id === id);

  const novoValor = prompt('Novo valor:', gasto.valor);
  const novaDescricao = prompt('Nova descrição:', gasto.descricao);

  if(novoValor && novaDescricao) {
    gasto.valor = novoValor;
    gasto.descricao = novaDescricao;

    salvarDados();
    renderHistorico();
  }
}

// EXCLUIR HISTÓRICO (Agora move para rejeitados)
function excluirHistorico(id) {
  // 1. Encontra o item que será "excluído"
  const itemParaMover = historico.find(item => item.id === id);

  if (itemParaMover) {
    // 2. Opcional: Atualiza o status para controle interno
    itemParaMover.status = 'rejeitado';

    itemParaMover.dataProcessamento = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    
    // 3. Adiciona aos rejeitados
    rejeitados.push(itemParaMover);

    // 4. Remove do histórico original
    historico = historico.filter(item => item.id !== id);

    // 5. Salva e atualiza tudo
    salvarDados();
    atualizarSaldo();
    renderHistorico();
    
    // Se você estiver na página de rejeitados, ela também atualiza
    if (document.getElementById('lista-rejeitados')) {
      renderRejeitados();
    }

    alert('O registro foi movido para a aba de Rejeitados.');
  }
}

// RENDER REJEITADOS
function renderRejeitados() {
  const container = document.getElementById('lista-rejeitados');
  if(!container) return;

  container.innerHTML = '';

  if(rejeitados.length === 0) {
    container.innerHTML = `<div class="card"><p>Nenhum registro rejeitado.</p></div>`;
    return;
  }

  // Também invertendo para ver o mais recente excluído no topo
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

// VERIFICAR NOVAMENTE
// VERIFICAR NOVAMENTE (Restaura mantendo as propriedades originais)
function verificarNovamente(id) {
  // 1. Encontra o item nos rejeitados
  const gasto = rejeitados.find(item => item.id === id);

  if (gasto) {
    // 2. Apenas removemos o status de rejeitado, mas mantemos o 'tipo' original
    // (Se era 'gasto', continua 'gasto'. Se era 'doacao', continua 'doacao')
    delete gasto.status; 

    // 3. Devolve para a lista de notificações/pendências
    notificacoes.push(gasto);

    // 4. Remove da lista de rejeitados
    rejeitados = rejeitados.filter(item => item.id !== id);

    // 5. Salva e atualiza as telas
    salvarDados();
    renderRejeitados();
    
    if (document.getElementById('lista-notificacoes')) {
      renderNotificacoes();
    }

    alert('O registro retornou para a aba de notificações para nova conferência.');
  }
}

// EXCLUIR REJEITADO
function excluirRejeitado(id) {
  rejeitados = rejeitados.filter(item => item.id !== id);

  salvarDados();
  renderRejeitados();
}

// SALDO
function atualizarSaldo() {
  const saldoElements = document.querySelectorAll('.saldo');
  let entradas = 0;
  let saidas = 0;

  historico.forEach(item => {
    // Agora o item.tipo será 'doacao' após a aprovação corrigida acima
    if(item.tipo === 'doacao') {
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

// FILTROS DE CATEGORIA
const botoes = document.querySelectorAll('.filter-btn');

botoes.forEach(botao => {
  botao.addEventListener('click', () => {
    botoes.forEach(btn => btn.classList.remove('active'));
    botao.classList.add('active');
  });
});

renderNotificacoes();
renderHistorico();
renderRejeitados();
atualizarSaldo();

//TESTES
function gerarDoacaoMock() {
  const nomes = ['Ana Silva', 'Carlos Souza', 'Mariana Oliveira', 'Roberto Santos'];
  const nomeSorteado = nomes[Math.floor(Math.random() * nomes.length)];
  const valorSorteado = (Math.random() * 500 + 10).toFixed(2);

  const novaDoacao = {
    id: Date.now(),
    valor: valorSorteado,
    nome: nomeSorteado,
    tipo: 'doacao',
    categoria: 'Doação',
    comprovante: 'comprovante_mock.jpg',
    // Altere esta linha abaixo:
    data: new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'})
  };

  notificacoes.push(novaDoacao);
  salvarDados();
  
  // Se estiver na página de notificações, atualiza a tela
  if (document.getElementById('lista-notificacoes')) {
    renderNotificacoes();
  }
  
  alert(`Nova doação de ${nomeSorteado} gerada na aba de Notificações!`);
}

function aprovarGasto(id) {
  // Encontra a doação nas notificações
  const gasto = notificacoes.find(item => item.id === id);

  if (gasto) {
    // Definimos explicitamente os campos necessários para o histórico
    gasto.status = 'aprovado';
    gasto.tipo = 'doacao';      // Essencial para o cálculo do saldo (entrada)
    gasto.categoria = 'Doação'; // Essencial para o novo filtro de doações
    gasto.dataProcessamento = new Date().toLocaleDateString('pt-BR') + ' às ' + new Date().toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'});
    // Adiciona ao array de histórico
    historico.push(gasto);

    // Remove das notificações
    notificacoes = notificacoes.filter(item => item.id !== id);

    // Salva e atualiza a interface
    salvarDados();
    atualizarSaldo();
    
    // Atualiza a lista de notificações (se o usuário estiver nela)
    renderNotificacoes();
    
    // Se o usuário estiver na tela de histórico, ela também precisa ser atualizada
    if (document.getElementById('lista-historico')) {
      renderHistorico();
    }
    
    alert('Doação aprovada e enviada para o histórico!');
  }
}