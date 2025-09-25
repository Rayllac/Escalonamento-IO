import { CONFIGURACOES } from './config.js';
import { estado } from './state.js';
import { algoritmoSSTF, algoritmoSCAN, algoritmoCSCAN, gerarComparacao } from './algorithms.js';
import { getTamanho } from './requests.js';

let agendamentoEqualizacao = null;

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
  if (!algoritmo) {
    alert('Algoritmo desconhecido.');
    estado.animacaoAtiva = false;
    return;
  }

  const resultado = algoritmo();
  mostrarResultado(resultado);
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

function agendarEqualizacao() {
  if (agendamentoEqualizacao) clearTimeout(agendamentoEqualizacao);
  agendamentoEqualizacao = setTimeout(equalizarAlturasSimulacao, 150);
}

export {
  runAlgoritmo,
  compararAlgoritmos,
  equalizarAlturasSimulacao,
  agendarEqualizacao
};
