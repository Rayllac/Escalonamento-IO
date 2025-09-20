/* ========================
   Estado Global e Configurações
========================= */
const CONFIGURACOES = {
  VELOCIDADE_ANIMACAO: 800,
  DURACAO_TRANSICAO: 300,
  TAMANHO_PADRAO: 50,
  POSICAO_INICIAL_PADRAO: 25
};

let estado = {
  tamanho: CONFIGURACOES.TAMANHO_PADRAO,
  posicaoInicial: CONFIGURACOES.POSICAO_INICIAL_PADRAO,
  requisicoes: [],
  animacaoAtiva: false
};

/* ========================
   Utilitários de Validação
========================= */
function getTamanho() {
  const valor = parseInt(document.getElementById('diskSize').value);
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

/* ========================
   Manipulação de Requisições
========================= */
function addRequisicao() {
  if (estado.animacaoAtiva) {
    alert('Aguarde o término da animação atual!');
    return;
  }

  const input = document.getElementById('newRequest');
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
  
  const inputFile = document.getElementById('fileInput');
  if (inputFile) inputFile.value = '';
}

function atualizarRequisicoes() {
  const display = document.getElementById('requestsDisplay');

  if (estado.requisicoes.length === 0) {
    display.innerHTML = '<strong>Requisições:</strong> <em>Nenhuma ainda. Adicione algumas!</em>';
  } else {
    const tags = estado.requisicoes.map(req => 
      `<span class='request-tag' data-value='${req}'>${req}</span>`
    );
    display.innerHTML = "<strong>Requisições:</strong> " + tags.join(" ");
  }
}

/* ========================
   Animações de Interface
========================= */
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
  results.style.transition = `opacity ${CONFIGURACOES.DURACAO_TRANSICAO}ms ease-out`;
  results.style.opacity = '0';
  
  setTimeout(() => {
    results.style.display = 'none';
    results.style.opacity = '1';
  }, CONFIGURACOES.DURACAO_TRANSICAO);
}

/* ========================
   Inicialização e Eventos
========================= */
function inicializarControles() {
  // Input de nova requisição
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

  // Input de tamanho do disco
  const inputTamanho = document.getElementById('diskSize');
  if (inputTamanho) {
    inputTamanho.addEventListener('change', () => {
      estado.tamanho = getTamanho();
      estado.requisicoes = estado.requisicoes.filter(req => req < estado.tamanho);
      atualizarRequisicoes();
      resetarVisualizacao();
    });
  }

  // Input de posição inicial
  const inputPos = document.getElementById('initialPosition');
  if (inputPos) {
    inputPos.addEventListener('change', e => {
      const valor = parseInt(e.target.value);
      estado.posicaoInicial = Number.isNaN(valor) ? 0 : Math.max(0, Math.min(valor, estado.tamanho - 1));
      e.target.value = estado.posicaoInicial;
      resetarVisualizacao();
    });
  }

  // Input de arquivo
  const inputFile = document.getElementById('fileInput');
  if (inputFile) {
    inputFile.addEventListener('change', carregarDeArquivo);
  }

  atualizarRequisicoes();
  resetarVisualizacao();
}

/* ========================
   Execução de Algoritmos
========================= */
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
  let resultado = null;

  estado.animacaoAtiva = true;

  const algoritmos = {
    'sstf': () => algoritmoSSTF(estado.requisicoes, posicaoInicial),
    'scan': () => algoritmoSCAN(estado.requisicoes, posicaoInicial, tamanho),
    'cscan': () => algoritmoCSCAN(estado.requisicoes, posicaoInicial, tamanho)
  };

  if (algoritmos[tipo]) {
    resultado = algoritmos[tipo]();
    mostrarResultado(resultado);
  } else {
    alert('Algoritmo desconhecido.');
    estado.animacaoAtiva = false;
  }
}

/* ========================
   Implementação dos Algoritmos
========================= */
function algoritmoSSTF(requisicoes, posicaoInicial) {
  let pendentes = [...requisicoes];
  let posicaoAtual = posicaoInicial;
  let ordemAtendimento = [];
  let movimentoTotal = 0;
  let passos = [];

  while (pendentes.length > 0) {
    const maisProxima = pendentes.reduce((a, b) =>
      Math.abs(a - posicaoAtual) < Math.abs(b - posicaoAtual) ? a : b
    );

    const deslocamento = Math.abs(maisProxima - posicaoAtual);
    movimentoTotal += deslocamento;

    passos.push({
      de: posicaoAtual,
      para: maisProxima,
      distancia: deslocamento,
      pendentesAntes: [...pendentes],
      pendentesDepois: pendentes.filter(r => r !== maisProxima),
      tipo: 'requisicao'
    });

    posicaoAtual = maisProxima;
    ordemAtendimento.push(maisProxima);
    pendentes = pendentes.filter(r => r !== maisProxima);
  }

  return {
    nome: 'SSTF (Mais Próximo)',
    explicacao: 'O algoritmo SSTF sempre seleciona, dentre as requisições pendentes, a que está mais próxima da posição atual da cabeça de leitura. Isso reduz o tempo de deslocamento em cada movimento, tornando-o eficiente em termos de busca individual.',
    sequencia: ordemAtendimento,
    movimentoTotal,
    passos
  };
}

function algoritmoSCAN(requisicoes, posicaoInicial, tamanho) {
  let pendentes = [...requisicoes].sort((a, b) => a - b);
  let posicaoAtual = posicaoInicial;
  let ordemAtendimento = [];
  let movimentoTotal = 0;
  let passos = [];

  const menores = pendentes.filter(r => r < posicaoAtual).sort((a, b) => b - a);
  const maiores = pendentes.filter(r => r >= posicaoAtual).sort((a, b) => a - b);
  const fila = [...maiores, ...menores];

  for (const req of fila) {
    const deslocamento = Math.abs(req - posicaoAtual);
    movimentoTotal += deslocamento;

    passos.push({
      de: posicaoAtual,
      para: req,
      distancia: deslocamento,
      pendentesAntes: [...pendentes],
      pendentesDepois: pendentes.filter(r => r !== req),
      tipo: 'requisicao'
    });

    posicaoAtual = req;
    ordemAtendimento.push(req);
    pendentes = pendentes.filter(r => r !== req);
  }

  return {
    nome: 'SCAN (Elevador)',
    explicacao: 'O SCAN é conhecido como algoritmo do elevador porque a cabeça do disco se movimenta em uma direção até atingir o final (ou a última requisição nesse sentido) e, em seguida, inverte o movimento. Durante a varredura, todas as requisições encontradas no caminho são atendidas na ordem em que aparecem.',
    sequencia: ordemAtendimento,
    movimentoTotal,
    passos
  };
}

function algoritmoCSCAN(requisicoes, posicaoInicial, tamanho) {
  let pendentes = [...requisicoes].sort((a, b) => a - b);
  let posicaoAtual = posicaoInicial;
  let ordemAtendimento = [];
  let movimentoTotal = 0;
  let passos = [];

  const maiores = pendentes.filter(r => r >= posicaoAtual).sort((a, b) => a - b);
  const menores = pendentes.filter(r => r < posicaoAtual).sort((a, b) => a - b);

  // Atende requisições maiores ou iguais
  for (const req of maiores) {
    const deslocamento = Math.abs(req - posicaoAtual);
    movimentoTotal += deslocamento;
    
    passos.push({
      de: posicaoAtual,
      para: req,
      distancia: deslocamento,
      pendentesAntes: [...pendentes],
      pendentesDepois: pendentes.filter(r => r !== req),
      tipo: 'requisicao'
    });
    
    posicaoAtual = req;
    ordemAtendimento.push(req);
    pendentes = pendentes.filter(r => r !== req);
  }

  // Se há requisições menores, volta ao início
  if (menores.length > 0) {
    // Move até o final se não estiver lá
    if (posicaoAtual !== tamanho - 1) {
      const deslocamento = tamanho - 1 - posicaoAtual;
      movimentoTotal += deslocamento;
      
      passos.push({
        de: posicaoAtual,
        para: tamanho - 1,
        distancia: deslocamento,
        pendentesAntes: [...pendentes],
        pendentesDepois: [...pendentes],
        tipo: 'movimento'
      });
      
      posicaoAtual = tamanho - 1;
    }

    // Volta ao início
    const deslocamento = tamanho - 1;
    movimentoTotal += deslocamento;
    
    passos.push({
      de: posicaoAtual,
      para: 0,
      distancia: deslocamento,
      pendentesAntes: [...pendentes],
      pendentesDepois: [...pendentes],
      tipo: 'movimento'
    });
    
    posicaoAtual = 0;

    // Atende requisições menores
    for (const req of menores) {
      const deslocamento = Math.abs(req - posicaoAtual);
      movimentoTotal += deslocamento;
      
      passos.push({
        de: posicaoAtual,
        para: req,
        distancia: deslocamento,
        pendentesAntes: [...pendentes],
        pendentesDepois: pendentes.filter(r => r !== req),
        tipo: 'requisicao'
      });
      
      posicaoAtual = req;
      ordemAtendimento.push(req);
      pendentes = pendentes.filter(r => r !== req);
    }
  }

  return {
    nome: 'C-SCAN (Circular SCAN)',
    explicacao: 'O C-SCAN é uma variação do SCAN. Ele também percorre as requisições em apenas um sentido (por exemplo, da esquerda para a direita). Ao chegar ao final do disco, a cabeça retorna diretamente ao início, sem atender nenhuma requisição no caminho de volta. Em seguida, retoma o mesmo sentido de varredura.',
    sequencia: ordemAtendimento,
    movimentoTotal,
    passos
  };
}

/* ========================
   Exibição de Resultados
========================= */
function mostrarResultado(resultado) {
  const container = document.getElementById('algoritmoresults');
  const resultsDiv = document.getElementById('results');

  container.innerHTML = criarLayoutResultado(resultado);
  
  resultsDiv.style.display = 'block';
  resultsDiv.style.opacity = '0';
  resultsDiv.style.transition = `opacity ${CONFIGURACOES.DURACAO_TRANSICAO}ms ease-in`;
  
  setTimeout(() => {
    resultsDiv.style.opacity = '1';
    animarAlgoritmo(resultado);
  }, 100);

  const descDiv = document.getElementById('algoritmoDescricao');
if (descDiv) {
  descDiv.textContent = resultado.explicacao;
  descDiv.classList.remove('show');
  setTimeout(() => descDiv.classList.add('show'), 50);
}

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

  viz.innerHTML = `<div id="diskLine"></div><div id="head"></div>`;
  
  const head = document.getElementById('head');
  const line = viz.getBoundingClientRect();

  // Elementos de interface
  const movimentoDiv = document.getElementById('movimentoAtual');
  const passoDiv = document.getElementById('passoAtual');
  const currentDiv = document.getElementById('currentRequest');
  const pendingDiv = document.getElementById('pendingQueue');
  const completedDiv = document.getElementById('completedQueue');

  // Estado da animação
  let indicePasso = 0;
  let movimentoAcumulado = 0;
  let concluidas = [];

  // Configurar posição inicial
  head.style.left = `${(estado.posicaoInicial / tamanho) * line.width}px`;
  head.style.transition = `left ${CONFIGURACOES.VELOCIDADE_ANIMACAO}ms cubic-bezier(0.4, 0, 0.2, 1)`;

  // Inicializar interface
  currentDiv.textContent = estado.posicaoInicial;
  atualizarFilaPendente(estado.requisicoes, pendingDiv);

  function executarProximoPasso() {
    if (indicePasso >= resultado.passos.length) {
      finalizarAnimacao();
      return;
    }

    const passo = resultado.passos[indicePasso];
    
    // Atualizar contadores
    passoDiv.textContent = indicePasso + 1;
    movimentoAcumulado += passo.distancia || 0;
    
    // Animar contador de movimento
    animarContador(movimentoDiv, movimentoAcumulado);

    // Mover cabeça do disco
    moverCabeca(head, passo.para, tamanho, line.width);

    // Criar marcador visual se for requisição
    if (passo.tipo === 'requisicao') {
      criarMarcadorRequisicao(viz, passo.para, tamanho, line.width);
      concluidas.push(passo.para);
      atualizarFilaConcluidas(concluidas, completedDiv);
    }

    // Atualizar interface
    currentDiv.textContent = passo.para;
    atualizarFilaPendente(passo.pendentesDepois, pendingDiv);

    indicePasso++;
    setTimeout(executarProximoPasso, CONFIGURACOES.VELOCIDADE_ANIMACAO);
  }

  // Iniciar animação
  setTimeout(executarProximoPasso, 500);

  function finalizarAnimacao() {
    currentDiv.textContent = "Finalizado";
    pendingDiv.innerHTML = '<span class="pill success">Todas atendidas</span>';
    estado.animacaoAtiva = false;
  }
}

/* ========================
   Utilitários de Animação
========================= */
function moverCabeca(head, posicao, tamanho, larguraLinha) {
  const posicaoPixels = (posicao / tamanho) * larguraLinha;
  head.style.left = `${posicaoPixels}px`;
  
  // Efeito de pulsação na cabeça
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
  if (!pendentes || pendentes.length === 0) {
    container.innerHTML = '<span class="pill muted">Vazia</span>';
  } else {
    container.innerHTML = pendentes
      .map(p => `<span class="pill pending">${p}</span>`)
      .join('');
  }
}

function atualizarFilaConcluidas(concluidas, container) {
  if (concluidas.length === 0) {
    container.innerHTML = '<span class="pill muted">Nenhuma</span>';
  } else {
    container.innerHTML = concluidas
      .map(c => `<span class="pill completed">${c}</span>`)
      .join('');
  }
}

/* ========================
   Carregamento de Arquivo
========================= */
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

  let dados = { tamanho: null, cabeca: null, requisicoes: [] };

  for (const linha of linhas) {
    if (linha.startsWith("tamanho=")) {
      dados.tamanho = parseInt(linha.split("=")[1]);
    } else if (linha.startsWith("cabeca=")) {
      dados.cabeca = parseInt(linha.split("=")[1]);
    } else if (linha.startsWith("requisicoes=")) {
      dados.requisicoes = linha.split("=")[1]
        .split(",")
        .map(v => parseInt(v.trim()))
        .filter(v => !isNaN(v));
    }
  }

  return dados;
}

function aplicarDadosCarregados(dados) {
  if (dados.tamanho !== null && dados.tamanho > 0) {
    estado.tamanho = dados.tamanho;
    document.getElementById("diskSize").value = dados.tamanho;
  }

  if (dados.cabeca !== null && dados.cabeca >= 0) {
    estado.posicaoInicial = Math.min(dados.cabeca, estado.tamanho - 1);
    document.getElementById("initialPosition").value = estado.posicaoInicial;
  }

  if (dados.requisicoes.length > 0) {
    estado.requisicoes = dados.requisicoes.filter(req => 
      req >= 0 && req < estado.tamanho
    );
  }

  atualizarRequisicoes();
  resetarVisualizacao();
}

/* ========================
   Comparação de Algoritmos
========================= */
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

  const resultados = {
    sstf: algoritmoSSTF(estado.requisicoes, posicaoInicial),
    scan: algoritmoSCAN(estado.requisicoes, posicaoInicial, tamanho),
    cscan: algoritmoCSCAN(estado.requisicoes, posicaoInicial, tamanho)
  };

  // const melhor = Object.values(resultados).reduce((a, b) => 
  //   a.movimentoTotal < b.movimentoTotal ? a : b
  // );
let melhores = [resultados.sstf];
let melhor = resultados.sstf;

for (let chave in resultados) {
  const algoritmo = resultados[chave];

  if (algoritmo.movimentoTotal < melhor.movimentoTotal) {
    melhores = [algoritmo]; // reinicia lista com o novo melhor
    melhor = algoritmo;
  } else if (algoritmo.movimentoTotal === melhor.movimentoTotal && algoritmo !== melhor) {
    melhores.push(algoritmo); // adiciona em caso de empate
  }
}


  mostrarComparacao(resultados, melhores);
  mostrarVisualComparacao(resultados, tamanho);
}

const mostrarComparacao = (resultados, melhores) =>  {
  const container = document.getElementById('algoritmoresults');
  const resultsDiv = document.getElementById('results');

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
  resultsDiv.style.display = 'block';
  resultsDiv.style.opacity = '1';
}

function mostrarVisualComparacao(resultados, tamanho) {
  const viz = document.querySelector('.disk-visualization');
  
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

  // Animar cada algoritmo com delay
  setTimeout(() => desenharSequencia(resultados.sstf.sequencia, "head-sstf", tamanho), 0);
  setTimeout(() => desenharSequencia(resultados.scan.sequencia, "head-scan", tamanho), 500);
  setTimeout(() => desenharSequencia(resultados.cscan.sequencia, "head-cscan", tamanho), 1000);
}

function desenharSequencia(sequencia, headId, tamanho) {
  const head = document.getElementById(headId);
  const wrapper = head.parentElement;
  
  if (!head || !wrapper) return;
  
  const line = wrapper.getBoundingClientRect();
  
  // Posição inicial
  head.style.left = `${(estado.posicaoInicial / tamanho) * line.width}px`;
  head.style.transition = `left ${CONFIGURACOES.VELOCIDADE_ANIMACAO * 0.6}ms ease-in-out`;
  
  // Criar marcadores para cada posição
  sequencia.forEach((req, index) => {
    const marcador = document.createElement("div");
    marcador.className = "request-label comparison-label";
    marcador.style.left = `${(req / tamanho) * line.width}px`;
    marcador.textContent = req;
    marcador.style.opacity = '0';
    marcador.style.transform = 'scale(0.8)';
    marcador.style.transition = `all ${CONFIGURACOES.DURACAO_TRANSICAO}ms ease-out`;
    
    wrapper.appendChild(marcador);
    
    // Animar aparição dos marcadores
    setTimeout(() => {
      marcador.style.opacity = '1';
      marcador.style.transform = 'scale(1)';
    }, index * 100);
  });

  // Animar movimento da cabeça
  let indice = 0;
  function moverProximo() {
    if (indice >= sequencia.length) return;
    
    const posicao = sequencia[indice];
    const posicaoPixels = (posicao / tamanho) * line.width;
    
    head.style.left = `${posicaoPixels}px`;
    
    // Destacar marcador atual
    const marcadores = wrapper.querySelectorAll('.comparison-label');
    if (marcadores[indice]) {
      marcadores[indice].style.backgroundColor = '#28a745';
      marcadores[indice].style.color = 'white';
      marcadores[indice].style.transform = 'scale(1.1)';
      
      setTimeout(() => {
        if (marcadores[indice]) {
          marcadores[indice].style.transform = 'scale(1)';
        }
      }, CONFIGURACOES.DURACAO_TRANSICAO);
    }
    
    indice++;
    setTimeout(moverProximo, CONFIGURACOES.VELOCIDADE_ANIMACAO * 0.6);
  }
  
  setTimeout(moverProximo, 300);
}

/* ========================
   Utilitários de Performance
========================= */
function calcularEstatisticas(resultados) {
  const movimentos = Object.values(resultados).map(r => r.movimentoTotal);
  const minimo = Math.min(...movimentos);
  const maximo = Math.max(...movimentos);
  const media = movimentos.reduce((a, b) => a + b, 0) / movimentos.length;
  
  return {
    minimo,
    maximo,
    media: Math.round(media * 100) / 100,
    economia: Math.round(((maximo - minimo) / maximo) * 100)
  };
}

function exportarResultados(resultados) {
  const estatisticas = calcularEstatisticas(resultados);
  
  const dados = {
    configuracao: {
      tamanho: estado.tamanho,
      posicaoInicial: estado.posicaoInicial,
      requisicoes: estado.requisicoes
    },
    resultados: Object.values(resultados).map(r => ({
      algoritmo: r.nome,
      movimentoTotal: r.movimentoTotal,
      sequencia: r.sequencia
    })),
    estatisticas
  };
  
  const json = JSON.stringify(dados, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = `disk_scheduler_results_${new Date().getTime()}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ========================
   Validações Avançadas
========================= */
function validarConfiguracao() {
  const erros = [];
  
  if (estado.tamanho < 1) {
    erros.push('Tamanho do disco deve ser maior que 0');
  }
  
  if (estado.posicaoInicial < 0 || estado.posicaoInicial >= estado.tamanho) {
    erros.push('Posição inicial deve estar dentro do disco');
  }
  
  if (estado.requisicoes.length === 0) {
    erros.push('É necessário pelo menos uma requisição');
  }
  
  const requisicoesInvalidas = estado.requisicoes.filter(r => 
    r < 0 || r >= estado.tamanho
  );
  
  if (requisicoesInvalidas.length > 0) {
    erros.push(`Requisições inválidas: ${requisicoesInvalidas.join(', ')}`);
  }
  
  return {
    valida: erros.length === 0,
    erros
  };
}

/* ========================
   Melhorias de Acessibilidade
========================= */
function adicionarAcessibilidade() {
  // Adicionar ARIA labels
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
  
  // Adicionar indicadores de status para leitores de tela
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

/* ========================
   Otimizações de Performance
========================= */
function otimizarAnimacoes() {
  // Desabilitar animações se o usuário preferir movimento reduzido
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    CONFIGURACOES.VELOCIDADE_ANIMACAO = 200;
    CONFIGURACOES.DURACAO_TRANSICAO = 100;
  }
  
  // Otimizar para dispositivos com baixa performance
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) {
    CONFIGURACOES.VELOCIDADE_ANIMACAO = Math.min(CONFIGURACOES.VELOCIDADE_ANIMACAO * 1.5, 1200);
  }
}

/* ========================
   Tratamento de Erros Aprimorado
========================= */
function tratarErro(erro, contexto = 'Operação') {
  console.error(`Erro em ${contexto}:`, erro);
  
  const mensagemErro = erro.message || 'Erro desconhecido';
  alert(`${contexto} falhou: ${mensagemErro}`);
  
  // Reset do estado em caso de erro crítico
  if (contexto.includes('Animação')) {
    estado.animacaoAtiva = false;
  }
}

/* ========================
   Gerenciamento de Estado Aprimorado
========================= */
function salvarEstadoLocal() {
  try {
    // Note: Em ambientes que não suportam localStorage, 
    // este será um no-op silencioso
    if (typeof Storage !== 'undefined') {
      const estadoParaSalvar = {
        tamanho: estado.tamanho,
        posicaoInicial: estado.posicaoInicial,
        requisicoes: estado.requisicoes,
        timestamp: Date.now()
      };
      localStorage.setItem('diskSchedulerState', JSON.stringify(estadoParaSalvar));
    }
  } catch (error) {
    // Falha silenciosa se localStorage não estiver disponível
  }
}

function carregarEstadoLocal() {
  try {
    if (typeof Storage !== 'undefined') {
      const estadoSalvo = localStorage.getItem('diskSchedulerState');
      if (estadoSalvo) {
        const dados = JSON.parse(estadoSalvo);
        
        // Verificar se o estado não é muito antigo (24 horas)
        if (Date.now() - dados.timestamp < 24 * 60 * 60 * 1000) {
          return dados;
        }
      }
    }
  } catch (error) {
    // Falha silenciosa se localStorage não estiver disponível
  }
  return null;
}

/* ========================
   Inicialização Principal
========================= */
function inicializar() {
  try {
    // Aplicar otimizações
    otimizarAnimacoes();
    
    // Adicionar acessibilidade
    adicionarAcessibilidade();
    
    // Tentar carregar estado anterior
    const estadoAnterior = carregarEstadoLocal();
    if (estadoAnterior) {
      estado.tamanho = estadoAnterior.tamanho;
      estado.posicaoInicial = estadoAnterior.posicaoInicial;
      estado.requisicoes = estadoAnterior.requisicoes;
      
      // Atualizar inputs
      document.getElementById('diskSize').value = estado.tamanho;
      document.getElementById('initialPosition').value = estado.posicaoInicial;
    }
    
    // Inicializar controles
    inicializarControles();
    
    // Salvar estado quando houver mudanças
    setInterval(() => {
      if (!estado.animacaoAtiva) {
        salvarEstadoLocal();
      }
    }, 5000); // A cada 5 segundos
    
    anunciarStatus('Simulador de algoritmos de disco carregado e pronto para uso');
    
  } catch (error) {
    tratarErro(error, 'Inicialização');
  }
}

// Aguardar carregamento completo da página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', inicializar);
} else {
  inicializar();
}

