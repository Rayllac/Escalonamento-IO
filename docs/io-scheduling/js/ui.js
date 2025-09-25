import { CONFIGURACOES } from './config.js';
import { estado, salvarEstado, carregarEstado } from './state.js';
import { algoritmoSSTF, algoritmoSCAN, algoritmoCSCAN, gerarComparacao } from './algorithms.js';

let agendamentoEqualizacao = null;

function sincronizarInputs() {
  const diskInput = document.getElementById('diskSize');
  if (diskInput) diskInput.value = estado.tamanho;

  const posInput = document.getElementById('initialPosition');
  if (posInput) posInput.value = estado.posicaoInicial;
}

function getTamanho() {
  const input = document.getElementById('diskSize');
  if (!input) return estado.tamanho || CONFIGURACOES.TAMANHO_PADRAO;

  const valor = parseInt(input.value);
  return Number.isNaN(valor) ? CONFIGURACOES.TAMANHO_PADRAO : Math.max(1, valor);
}

function validarEntrada(valor, tamanho) {
  if (Number.isNaN(valor)) {
    return { valido: false, erro: 'Digite um número válido!' };
  }
  if (valor < 0 || valor >= tamanho) {
    return { valido: false, erro: `O número deve estar entre 0 e ${tamanho - 1}!` };
  }
  if (estado.requisicoes.includes(valor)) {
    return { valido: false, erro: 'Esta posição já existe na lista!' };
  }
  return { valido: true };
}

function addRequisicao() {
  if (estado.animacaoAtiva) {
    alert('Aguarde o término da animação atual!');
    return;
  }

  const input = document.getElementById('newRequest');
  if (!input) return;

  const valor = parseInt(input.value);
  const tamanho = getTamanho();

  const validacao = validarEntrada(valor, tamanho);
  if (!validacao.valido) {
    alert(validacao.erro);
    return;
  }

  estado.requisicoes.push(valor);
  input.value = '';
  atualizarRequisicoes();
  salvarEstado();
  animarAdicaoRequisicao();
}

function exemploAutomatico() {
  if (estado.animacaoAtiva) {
    alert('Aguarde o término da animação atual!');
    return;
  }

  const tamanho = getTamanho();
  const quantidade = Math.min(5, Math.max(5, Math.floor(tamanho / 10)));
  const numeros = new Set();

  while (numeros.size < quantidade) {
    numeros.add(Math.floor(Math.random() * tamanho));
  }

  estado.requisicoes = Array.from(numeros);
  atualizarRequisicoes();
  salvarEstado();
  animarCarregamentoAutomatico();
}

function limparRequisicoes() {
  if (estado.animacaoAtiva) {
    alert('Aguarde o término da animação atual!');
    return;
  }

  estado.requisicoes = [];
  estado.animacaoAtiva = false;
  
  atualizarRequisicoes();
  resetarVisualizacao();
  ocultarResultados();
  salvarEstado();
  
  const inputFile = document.getElementById('fileInput');
  if (inputFile) inputFile.value = '';
}

function atualizarRequisicoes() {
  const display = document.getElementById('requestsDisplay');

  if (display) {
    if (estado.requisicoes.length === 0) {
      display.innerHTML = '<strong>Requisições:</strong> <em>Nenhuma ainda. Adicione algumas!</em>';
    } else {
      const tags = estado.requisicoes.map(req => 
        `<span class='request-tag' data-value='${req}'>${req}</span>`
      );
      display.innerHTML = "<strong>Requisições:</strong> " + tags.join(" ");
    }
  }

  const resumoTamanho = document.getElementById('resumoTamanho');
  if (resumoTamanho) resumoTamanho.textContent = estado.tamanho;

  const resumoCabeca = document.getElementById('resumoCabeca');
  if (resumoCabeca) resumoCabeca.textContent = estado.posicaoInicial;

  const resumoRequisicoes = document.getElementById('resumoRequisicoes');
  if (resumoRequisicoes) resumoRequisicoes.textContent = estado.requisicoes.length;
}

function animarAdicaoRequisicao() {
  const tags = document.querySelectorAll('.request-tag');
  const ultimaTag = tags[tags.length - 1];
  
  if (ultimaTag) {
    ultimaTag.style.transform = 'scale(0)';
    ultimaTag.style.opacity = '0';
    
    setTimeout(() => {
      ultimaTag.style.transition = `all ${CONFIGURACOES.DURACAO_TRANSICAO}ms ease-out`;
      ultimaTag.style.transform = 'scale(1.1)';
      ultimaTag.style.opacity = '1';
      
      setTimeout(() => {
        ultimaTag.style.transform = 'scale(1)';
      }, CONFIGURACOES.DURACAO_TRANSICAO / 2);
    }, 50);
  }
}

function animarCarregamentoAutomatico() {
  const tags = document.querySelectorAll('.request-tag');
  tags.forEach((tag, index) => {
    tag.style.transform = 'scale(0)';
    tag.style.opacity = '0';
    
    setTimeout(() => {
      tag.style.transition = `all ${CONFIGURACOES.DURACAO_TRANSICAO}ms ease-out`;
      tag.style.transform = 'scale(1)';
      tag.style.opacity = '1';
    }, index * 100);
  });
}

function resetarVisualizacao() {
  const viz = document.querySelector('.disk-visualization');
  if (!viz) return;

  viz.innerHTML = `<div id="diskLine"></div><div id="head"></div>`;

  const head = document.getElementById('head');
  const line = viz.getBoundingClientRect();
  
  if (head && line.width > 0) {
    head.style.left = `${(estado.posicaoInicial / estado.tamanho) * line.width}px`;
    head.style.transition = `left ${CONFIGURACOES.DURACAO_TRANSICAO}ms ease-in-out`;
  }
}

function ocultarResultados() {
  const results = document.getElementById('results');
  if (!results) return;

  results.style.transition = `opacity ${CONFIGURACOES.DURACAO_TRANSICAO}ms ease-out`;
  results.style.opacity = '0';
  
  setTimeout(() => {
    results.style.display = 'none';
    results.style.opacity = '1';
    resetarAlturaCardsSimulacao();
  }, CONFIGURACOES.DURACAO_TRANSICAO);
}

function inicializarControles() {
  const inputReq = document.getElementById('newRequest');
  if (inputReq) {
    inputReq.addEventListener('keypress', e => {
      if (e.key === 'Enter') addRequisicao();
    });
    
    inputReq.addEventListener('input', e => {
      const valor = parseInt(e.target.value);
      const tamanho = getTamanho();
      
      if (!Number.isNaN(valor) && (valor < 0 || valor >= tamanho)) {
        e.target.style.borderColor = '#dc3545';
      } else {
        e.target.style.borderColor = '';
      }
    });
  }

  const inputTamanho = document.getElementById('diskSize');
  if (inputTamanho) {
    inputTamanho.addEventListener('change', () => {
      estado.tamanho = getTamanho();
      estado.requisicoes = estado.requisicoes.filter(req => req < estado.tamanho);
      atualizarRequisicoes();
      resetarVisualizacao();
      salvarEstado();
    });
  }

  const inputPos = document.getElementById('initialPosition');
  if (inputPos) {
    inputPos.addEventListener('change', e => {
      const valor = parseInt(e.target.value);
      estado.posicaoInicial = Number.isNaN(valor) ? 0 : Math.max(0, Math.min(valor, estado.tamanho - 1));
      e.target.value = estado.posicaoInicial;
      atualizarRequisicoes();
      resetarVisualizacao();
      salvarEstado();
    });
  }

  const inputFile = document.getElementById('fileInput');
  if (inputFile) {
    inputFile.addEventListener('change', carregarDeArquivo);
  }

  const btnAdd = document.getElementById('btnAddRequest');
  if (btnAdd) btnAdd.addEventListener('click', addRequisicao);

  const btnExample = document.getElementById('btnExampleRequests');
  if (btnExample) btnExample.addEventListener('click', exemploAutomatico);

  const btnClear = document.getElementById('btnClearRequests');
  if (btnClear) btnClear.addEventListener('click', limparRequisicoes);

  const btnSSTF = document.getElementById('btnRunSSTF');
  if (btnSSTF) btnSSTF.addEventListener('click', () => runAlgoritmo('sstf'));

  const btnSCAN = document.getElementById('btnRunSCAN');
  if (btnSCAN) btnSCAN.addEventListener('click', () => runAlgoritmo('scan'));

  const btnCSCAN = document.getElementById('btnRunCSCAN');
  if (btnCSCAN) btnCSCAN.addEventListener('click', () => runAlgoritmo('cscan'));

  const btnCompare = document.getElementById('btnCompareAll');
  if (btnCompare) btnCompare.addEventListener('click', compararAlgoritmos);

  const goToSimulation = document.getElementById('goToSimulation');
  if (goToSimulation) {
    goToSimulation.addEventListener('click', () => {
      salvarEstado();
      window.location.href = 'simulacao.html';
    });
  }

  atualizarRequisicoes();
  resetarVisualizacao();
}

function runAlgoritmo(tipo) {
  if (estado.animacaoAtiva) {
    alert('Aguarde o término da animação atual!');
    return;
  }

  if (estado.requisicoes.length === 0) {
    alert('Adicione requisições primeiro!');
    return;
  }

  const tamanho = getTamanho();
  const posicaoInicial = estado.posicaoInicial;

  estado.animacaoAtiva = true;

  const algoritmos = {
    sstf: () => algoritmoSSTF(estado.requisicoes, posicaoInicial),
    scan: () => algoritmoSCAN(estado.requisicoes, posicaoInicial, tamanho),
    cscan: () => algoritmoCSCAN(estado.requisicoes, posicaoInicial, tamanho)
  };

  const algoritmo = algoritmos[tipo];
  if (algoritmo) {
    const resultado = algoritmo();
    mostrarResultado(resultado);
  } else {
    alert('Algoritmo desconhecido.');
    estado.animacaoAtiva = false;
  }
}

function mostrarResultado(resultado) {
  const container = document.getElementById('algoritmoresults');
  const resultsDiv = document.getElementById('results');

  if (!container || !resultsDiv) return;

  container.innerHTML = criarLayoutResultado(resultado);
  
  resultsDiv.style.display = 'flex';
  resultsDiv.style.opacity = '0';
  resultsDiv.style.transition = `opacity ${CONFIGURACOES.DURACAO_TRANSICAO}ms ease-in`;
  
  setTimeout(() => {
    resultsDiv.style.opacity = '1';
    animarAlgoritmo(resultado);
    setTimeout(equalizarAlturasSimulacao, 50);
    rolarParaResultados();
  }, 100);

  const descDiv = document.getElementById('algoritmoDescricao');
  if (descDiv) {
    descDiv.textContent = resultado.explicacao;
    descDiv.classList.remove('show');
    setTimeout(() => descDiv.classList.add('show'), 50);
  }

  const aviso = document.getElementById('alertaSemDados');
  if (aviso) aviso.style.display = 'none';
}

function criarLayoutResultado(resultado) {
  return `
    <div class="algorithm-result">
      <div class="algorithm-name">${resultado.nome}</div>

      <div class="metrics">
        <div class="metric">
          <div class="metric-value" id="movimentoAtual">0</div>
          <div class="metric-label">Movimento Total</div>
        </div>
        <div class="metric">
          <div class="metric-value">${resultado.sequencia.length}</div>
          <div class="metric-label">Requisições</div>
        </div>
        <div class="metric">
          <div class="metric-value" id="passoAtual">0</div>
          <div class="metric-label">Passo Atual</div>
        </div>
      </div>

      <div class="status-panels">
        <div class="panel">
          <h4>Posição Atual</h4>
          <div id="currentRequest">Iniciando...</div>
        </div>

        <div class="panel">
          <h4>Fila Pendente</h4>
          <div id="pendingQueue" class="pill-container">Carregando...</div>
        </div>

        <div class="panel">
          <h4>Concluídas</h4>
          <div id="completedQueue" class="pill-container"></div>
        </div>
      </div>
    </div>
  `;
}

function animarAlgoritmo(resultado) {
  const tamanho = getTamanho();
  const viz = document.querySelector('.disk-visualization');
  if (!viz) return;

  viz.innerHTML = `<div id="diskLine"></div><div id="head"></div>`;
  
  const head = document.getElementById('head');
  const line = viz.getBoundingClientRect();

  const movimentoDiv = document.getElementById('movimentoAtual');
  const passoDiv = document.getElementById('passoAtual');
  const currentDiv = document.getElementById('currentRequest');
  const pendingDiv = document.getElementById('pendingQueue');
  const completedDiv = document.getElementById('completedQueue');

  let indicePasso = 0;
  let movimentoAcumulado = 0;
  const concluidas = [];

  if (head && line.width > 0) {
    head.style.left = `${(estado.posicaoInicial / tamanho) * line.width}px`;
    head.style.transition = `left ${CONFIGURACOES.VELOCIDADE_ANIMACAO}ms cubic-bezier(0.4, 0, 0.2, 1)`;
  }

  if (currentDiv) currentDiv.textContent = estado.posicaoInicial;
  if (pendingDiv) atualizarFilaPendente(estado.requisicoes, pendingDiv);

  function executarProximoPasso() {
    if (indicePasso >= resultado.passos.length) {
      finalizarAnimacao();
      return;
    }

    const passo = resultado.passos[indicePasso];
    
    if (passoDiv) passoDiv.textContent = indicePasso + 1;
    movimentoAcumulado += passo.distancia || 0;
    
    animarContador(movimentoDiv, movimentoAcumulado);
    moverCabeca(head, passo.para, tamanho, line.width);

    if (passo.tipo === 'requisicao') {
      criarMarcadorRequisicao(viz, passo.para, tamanho, line.width);
      concluidas.push(passo.para);
      atualizarFilaPendente(passo.pendentesDepois, pendingDiv);
      atualizarFilaConcluidas(concluidas, completedDiv);
      if (currentDiv) currentDiv.textContent = passo.para;
    }

    indicePasso++;
    setTimeout(executarProximoPasso, CONFIGURACOES.VELOCIDADE_ANIMACAO);
  }

  setTimeout(executarProximoPasso, 500);

  function finalizarAnimacao() {
    if (currentDiv) currentDiv.textContent = 'Finalizado';
    if (pendingDiv) pendingDiv.innerHTML = '<span class="pill green">Todas atendidas</span>';
    estado.animacaoAtiva = false;
  }
}

function moverCabeca(head, posicao, tamanho, larguraLinha) {
  if (!head) return;
  const posicaoPixels = (posicao / tamanho) * larguraLinha;
  head.style.left = `${posicaoPixels}px`;
  
  head.style.transform = 'scale(1.2)';
  setTimeout(() => {
    head.style.transform = 'scale(1)';
  }, CONFIGURACOES.VELOCIDADE_ANIMACAO / 2);
}

function criarMarcadorRequisicao(container, posicao, tamanho, larguraLinha) {
  const marcador = document.createElement('div');
  marcador.className = 'request-label';
  marcador.style.left = `${(posicao / tamanho) * larguraLinha}px`;
  marcador.textContent = posicao;
  marcador.style.opacity = '0';
  marcador.style.transform = 'scale(0.5)';
  marcador.style.transition = `all ${CONFIGURACOES.DURACAO_TRANSICAO}ms ease-out`;
  
  container.appendChild(marcador);
  
  setTimeout(() => {
    marcador.style.opacity = '1';
    marcador.style.transform = 'scale(1)';
  }, 100);
}

function animarContador(elemento, valorFinal) {
  if (!elemento) return;
  const valorInicial = parseInt(elemento.textContent);
  const incremento = (valorFinal - valorInicial) / 20;
  let contador = 0;

  const intervalo = setInterval(() => {
    contador++;
    const valorAtual = Math.round(valorInicial + (incremento * contador));
    elemento.textContent = valorAtual;

    if (contador >= 20 || valorAtual >= valorFinal) {
      elemento.textContent = valorFinal;
      clearInterval(intervalo);
    }
  }, CONFIGURACOES.VELOCIDADE_ANIMACAO / 20);
}

function atualizarFilaPendente(pendentes, container) {
  if (!container) return;
  if (!pendentes || pendentes.length === 0) {
    container.innerHTML = '<span class="pill muted">Vazia</span>';
  } else {
    container.innerHTML = pendentes
      .map(p => `<span class="pill pending">${p}</span>`)
      .join('');
  }
}

function atualizarFilaConcluidas(concluidas, container) {
  if (!container) return;
  if (concluidas.length === 0) {
    container.innerHTML = '<span class="pill muted">Nenhuma</span>';
  } else {
    container.innerHTML = concluidas
      .map(c => `<span class="pill completed">${c}</span>`)
      .join('');
  }
}

function compararAlgoritmos() {
  if (estado.animacaoAtiva) {
    alert('Aguarde o término da animação atual!');
    return;
  }

  if (estado.requisicoes.length === 0) {
    alert('Adicione requisições primeiro!');
    return;
  }

  const tamanho = getTamanho();
  const posicaoInicial = estado.posicaoInicial;

  const { resultados, melhores } = gerarComparacao(estado.requisicoes, posicaoInicial, tamanho);

  mostrarComparacao(resultados, melhores);
  mostrarVisualComparacao(resultados, tamanho);
  setTimeout(equalizarAlturasSimulacao, 50);
  rolarParaResultados();
}

function mostrarComparacao(resultados, melhores) {
  const container = document.getElementById('algoritmoresults');
  const resultsDiv = document.getElementById('results');

  if (!container || !resultsDiv) return;

  const tabela = `
    <div class="comparison-header">
      <h3> Comparação de Algoritmos</h3>
      <p>Análise de desempenho dos diferentes algoritmos de escalonamento</p>
    </div>
    
    <table class="comparison-table">
      <thead>
        <tr>
          <th>Algoritmo</th>
          <th>Movimento Total</th>
          <th>Requisições</th>
          <th>Eficiência</th>
          <th>Sequência</th>
        </tr>
      </thead>
      <tbody>
        ${Object.values(resultados).map(r => {
          const eficiencia = ((melhores[0].movimentoTotal / r.movimentoTotal) * 100).toFixed(1);
          const melhoresNomes = melhores.map(e => e.nome);
          const isMelhor = melhoresNomes.includes(r.nome);
          
          return `
            <tr class="${isMelhor ? 'best-result' : ''}">
              <td class="algorithm-name">${r.nome}</td>
              <td class="movement-value">${r.movimentoTotal}</td>
              <td>${r.sequencia.length}</td>
              <td>${eficiencia}%</td>
              <td class="sequence">${r.sequencia.join(' → ')}</td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
    
    <div class="best-algorithm">
      <strong>🏆 Melhores algoritmos:</strong> ${melhores.map(e => e.nome).join(";")} 
      (${melhores[0].movimentoTotal} movimentos)
    </div>
  `;

  container.innerHTML = tabela;
  resultsDiv.style.display = 'flex';
  resultsDiv.style.opacity = '1';

  const aviso = document.getElementById('alertaSemDados');
  if (aviso) aviso.style.display = 'none';
}

function mostrarVisualComparacao(resultados, tamanho) {
  const viz = document.querySelector('.disk-visualization');
  if (!viz) return;
  
  viz.innerHTML = `
    <div class="compare-header">Visualização Comparativa</div>
    <div class="compare-row">
      <div class="alg-label">SSTF</div>
      <div class="diskLineWrapper">
        <div class="diskLine"></div>
        <div class="head" id="head-sstf"></div>
      </div>
    </div>
    <div class="compare-row">
      <div class="alg-label">SCAN</div>
      <div class="diskLineWrapper">
        <div class="diskLine"></div>
        <div class="head" id="head-scan"></div>
      </div>
    </div>
    <div class="compare-row">
      <div class="alg-label">C-SCAN</div>
      <div class="diskLineWrapper">
        <div class="diskLine"></div>
        <div class="head" id="head-cscan"></div>
      </div>
    </div>
  `;

  setTimeout(() => desenharSequencia(resultados.sstf.sequencia, 'head-sstf', tamanho), 0);
  setTimeout(() => desenharSequencia(resultados.scan.sequencia, 'head-scan', tamanho), 250);
  setTimeout(() => desenharSequencia(resultados.cscan.sequencia, 'head-cscan', tamanho), 500);

  const descDiv = document.getElementById('algoritmoDescricao');
  if (descDiv) {
    descDiv.textContent = '';
    descDiv.classList.remove('show');
  }
}

function desenharSequencia(sequencia, headId, tamanho) {
  const head = document.getElementById(headId);
  const wrapper = head?.parentElement;
  
  if (!head || !wrapper) return;
  
  const line = wrapper.getBoundingClientRect();
  
  head.style.left = `${(estado.posicaoInicial / tamanho) * line.width}px`;
  head.style.transition = `left ${CONFIGURACOES.VELOCIDADE_ANIMACAO * 0.6}ms ease-in-out`;
  
  sequencia.forEach((req, index) => {
    const marcador = document.createElement('div');
    marcador.className = 'request-label comparison-label';
    marcador.style.left = `${(req / tamanho) * line.width}px`;
    marcador.textContent = req;
    marcador.style.opacity = '0';
    marcador.style.transform = 'translateX(-50%) scale(0.85)';
    marcador.style.transition = `all ${CONFIGURACOES.DURACAO_TRANSICAO}ms ease-out`;
    
    wrapper.appendChild(marcador);
    
    setTimeout(() => {
      marcador.style.opacity = '1';
      marcador.style.transform = 'translateX(-50%) scale(1)';
    }, index * 100);
  });
  
  let indice = 0;
  function moverProximo() {
    if (indice >= sequencia.length) return;
    
    const posicao = sequencia[indice];
    const posicaoPixels = (posicao / tamanho) * line.width;
    
    head.style.left = `${posicaoPixels}px`;
    
    const marcadores = wrapper.querySelectorAll('.comparison-label');
    if (marcadores[indice]) {
      marcadores[indice].style.backgroundColor = '#28a745';
      marcadores[indice].style.color = 'white';
      marcadores[indice].style.transform = 'translateX(-50%) scale(1.1)';
      
      setTimeout(() => {
        if (marcadores[indice]) {
          marcadores[indice].style.transform = 'translateX(-50%) scale(1)';
        }
      }, CONFIGURACOES.DURACAO_TRANSICAO);
    }

    indice++;
    setTimeout(moverProximo, CONFIGURACOES.VELOCIDADE_ANIMACAO * 0.6);
  }

  setTimeout(moverProximo, 300);
}

function carregarDeArquivo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const dados = processarArquivo(e.target.result);
      aplicarDadosCarregados(dados);
      alert('Arquivo carregado com sucesso!');
    } catch (error) {
      alert('Erro ao carregar arquivo: ' + error.message);
    }
  };
  reader.readAsText(file);
}

function processarArquivo(conteudo) {
  const linhas = conteudo.split(/\r?\n/)
    .map(l => l.trim())
    .filter(l => l && !l.startsWith('#'));

  const dados = { tamanho: null, cabeca: null, requisicoes: [] };

  for (const linha of linhas) {
    if (linha.startsWith('tamanho=')) {
      dados.tamanho = parseInt(linha.split('=')[1]);
    } else if (linha.startsWith('cabeca=')) {
      dados.cabeca = parseInt(linha.split('=')[1]);
    } else if (linha.startsWith('requisicoes=')) {
      dados.requisicoes = linha.split('=')[1]
        .split(',')
        .map(v => parseInt(v.trim()))
        .filter(v => !Number.isNaN(v));
    }
  }

  return dados;
}

function aplicarDadosCarregados(dados) {
  if (dados.tamanho !== null && dados.tamanho > 0) {
    estado.tamanho = dados.tamanho;
    const diskInput = document.getElementById('diskSize');
    if (diskInput) diskInput.value = dados.tamanho;
  }

  if (dados.cabeca !== null && dados.cabeca >= 0) {
    estado.posicaoInicial = Math.min(dados.cabeca, estado.tamanho - 1);
    const headInput = document.getElementById('initialPosition');
    if (headInput) headInput.value = estado.posicaoInicial;
  }

  if (dados.requisicoes.length > 0) {
    estado.requisicoes = dados.requisicoes.filter(req => 
      req >= 0 && req < estado.tamanho
    );
  }

  atualizarRequisicoes();
  resetarVisualizacao();
  salvarEstado();
}

function adicionarAcessibilidade() {
  const elementos = {
    'diskSize': 'Tamanho do disco em setores',
    'initialPosition': 'Posição inicial da cabeça do disco',
    'newRequest': 'Nova requisição para adicionar à fila'
  };
  
  Object.entries(elementos).forEach(([id, label]) => {
    const elemento = document.getElementById(id);
    if (elemento) {
      elemento.setAttribute('aria-label', label);
    }
  });
  
  const statusDiv = document.createElement('div');
  statusDiv.id = 'statusAria';
  statusDiv.setAttribute('aria-live', 'polite');
  statusDiv.style.position = 'absolute';
  statusDiv.style.left = '-9999px';
  document.body.appendChild(statusDiv);
}

function anunciarStatus(mensagem) {
  const statusDiv = document.getElementById('statusAria');
  if (statusDiv) {
    statusDiv.textContent = mensagem;
  }
}

function otimizarAnimacoes() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    CONFIGURACOES.VELOCIDADE_ANIMACAO = 200;
    CONFIGURACOES.DURACAO_TRANSICAO = 100;
  }
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
    CONFIGURACOES.VELOCIDADE_ANIMACAO = Math.min(CONFIGURACOES.VELOCIDADE_ANIMACAO * 1.5, 1200);
  }
}

function tratarErro(erro, contexto = 'Operação') {
  console.error(`Erro em ${contexto}:`, erro);
  
  const mensagemErro = erro.message || 'Erro desconhecido';
  alert(`${contexto} falhou: ${mensagemErro}`);
  
  if (contexto.includes('Animação')) {
    estado.animacaoAtiva = false;
  }
}

function configurarPaginaEntrada() {
  const botao = document.getElementById('goToSimulation');
  if (botao) {
    botao.addEventListener('click', () => {
      salvarEstado();
      window.location.href = 'simulacao.html';
    });
  }
}

function configurarPaginaSimulacao() {
  const botaoVoltar = document.getElementById('backToEntrada');
  if (botaoVoltar) {
    botaoVoltar.addEventListener('click', () => {
      salvarEstado();
      window.location.href = 'entrada.html';
    });
  }

  const aviso = document.getElementById('alertaSemDados');
  if (aviso) {
    aviso.style.display = estado.requisicoes.length > 0 ? 'none' : 'block';
  }
}

function rolarParaResultados() {
  const resultsDiv = document.getElementById('results');
  if (!resultsDiv || resultsDiv.style.display === 'none') return;

  setTimeout(() => {
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 150);
}

function equalizarAlturasSimulacao() {
  const layout = document.querySelector('.simulacao-layout');
  if (!layout) return;

  const cards = Array.from(layout.querySelectorAll('.simulacao-card'));
  if (cards.length < 2) return;

  cards.forEach(card => {
    card.style.minHeight = '';
  });

  const maiorAltura = Math.max(0, ...cards
    .filter(card => card.offsetParent !== null)
    .map(card => card.getBoundingClientRect().height));

  if (maiorAltura === 0) return;

  cards.forEach(card => {
    if (card.offsetParent !== null) {
      card.style.minHeight = `${maiorAltura}px`;
    }
  });
}

function resetarAlturaCardsSimulacao() {
  document.querySelectorAll('.simulacao-card').forEach(card => {
    card.style.minHeight = '';
  });
}

function inicializar() {
  try {
    estado.animacaoAtiva = false;
    otimizarAnimacoes();
    adicionarAcessibilidade();
    carregarEstado();
    sincronizarInputs();
    inicializarControles();

    const pagina = document.body.dataset.page || 'entrada';
    if (pagina === 'simulacao') {
      configurarPaginaSimulacao();
    } else {
      configurarPaginaEntrada();
    }

    anunciarStatus('Simulador de algoritmos de disco carregado e pronto para uso');

    window.addEventListener('resize', () => {
      if (agendamentoEqualizacao) clearTimeout(agendamentoEqualizacao);
      agendamentoEqualizacao = setTimeout(equalizarAlturasSimulacao, 150);
    });
  } catch (error) {
    tratarErro(error, 'Inicialização');
  }
}

export function inicializarAplicacao() {
  inicializar();
}
