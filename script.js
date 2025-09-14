let estado = {
    tamanho: 100,
    posicaoInicial: 50,
    requisicoes: [],
    simulacaoAtiva: false
};

function getTamanho() {
  const v = parseInt(document.getElementById('diskSize').value);
  return Number.isNaN(v) ? 100 : Math.max(1, v);
}

function atualizarRequisicoes() {
    const display = document.getElementById('requestsDisplay');

    if (!estado.requisicoes.length) {
        display.innerHTML = '<strong>Requisições:</strong> <em>Nenhuma ainda. Adicione algumas!</em>';
        return;
    }
    const tags = estado.requisicoes
    .map(req => `<span class="request-tag">${req}</span>`)
    .join(' ');
    
    display.innerHTML = `<strong>Requisições:</strong> ${tags}`;
}

function addRequisicao() {
    const input = document.getElementById('newRequest'); 
    const valor = parseInt(input.value);
    const tamanho = getTamanho();

    if (Number.isNaN(valor)) {
        alert('Digite um número válido!');
        return;
    }
    if (valor < 0 || valor >= tamanho) {
        alert(`O número deve estar entre 0 e ${tamanho - 1}!`);
        return;
    }
    if (estado.requisicoes.includes(valor)) {
        alert('Esta posição já existe na lista!');
        return;
    }

    estado.requisicoes.push(valor);
    input.value = '';
    atualizarRequisicoes();
}

function exemploAutomatico() {
    const tamanho = getTamanho();
    const quantidade = 5;
    estado.requisicoes = Array.from({ length: quantidade }, () => Math.floor(Math.random() * tamanho));
    atualizarRequisicoes();//atualiza vizualmente
}

function limparRequisicoes() {
    estado.requisicoes = [];
    atualizarRequisicoes();
    const results = document.getElementById('results');
    if (results) results.style.display = 'none';
}

function inicializarControles() {

  const inputReq = document.getElementById('newRequest');
  if (inputReq) {
    inputReq.addEventListener('keypress', e => {
      if (e.key === 'Enter') addRequisicao();
    });
  }

  const inputTamanho = document.getElementById('diskSize');
  if (inputTamanho) {
    inputTamanho.addEventListener('change', () => {
      estado.tamanho = getTamanho();
      atualizarRequisicoes();
      atualizarVisualizacaoDisco();
    });
  }

  const inputPos = document.getElementById('initialPosition');
  if (inputPos) {
    inputPos.addEventListener('change', e => {
      const v = parseInt(e.target.value);
      estado.posicaoInicial = Number.isNaN(v) ? 0 : v;
      atualizarVisualizacaoDisco();
    });
  }


  atualizarRequisicoes();
  atualizarVisualizacaoDisco();
}


function runAlgoritmo(tipo) {
  if (estado.requisicoes.length === 0) {
    alert("Adicione requisições primeiro!");
    return;
  }

  const tamanho = getTamanho();
  const posicaoInicial = estado.posicaoInicial;

  let resultado;

  if (tipo === "sstf") {
    resultado = algoritmoSSTF(estado.requisicoes, posicaoInicial);
  }

  if (resultado) {
    mostrarResultado(resultado, resultado.detalhes);
  }
}

function algoritmoSSTF(requisicoes, posicaoInicial) {
  let pendentes = [...requisicoes];
  let posicaoAtual = posicaoInicial;
  let ordemAtendimento = [];
  let movimentoTotal = 0;
  let detalhes = [];

  detalhes.push(`Cabeça inicia na posição ${posicaoAtual}`);
  detalhes.push(`Requisições pendentes: [${pendentes.join(", ")}]`);

  while (pendentes.length > 0) {
    let maisProxima = pendentes.reduce((maisPerto, req) => {
      let distAtual = Math.abs(req - posicaoAtual);
      let distMaisPerto = Math.abs(maisPerto - posicaoAtual);
      return distAtual < distMaisPerto ? req : maisPerto;
    });

    let deslocamento = Math.abs(maisProxima - posicaoAtual);
    movimentoTotal += deslocamento;

    detalhes.push(`Movendo de ${posicaoAtual} até ${maisProxima} (distância ${deslocamento})`);

    posicaoAtual = maisProxima;
    ordemAtendimento.push(maisProxima);
    pendentes = pendentes.filter(r => r !== maisProxima);

    detalhes.push(`Atendido ${maisProxima}`);
    detalhes.push(`Pendentes agora: [${pendentes.join(", ")}]`);
  }

  detalhes.push(`Movimento total: ${movimentoTotal}`);

  return {
    nome: "SSTF (Mais Próximo)",
    explicacao: "Atende sempre a requisição mais próxima da posição atual da cabeça.",
    sequencia: ordemAtendimento,
    movimentoTotal,
    detalhes
  };
}


function mostrarResultado(resultado, detalhes) {
  const container = document.getElementById("algoritmoresults");
  const resultsDiv = document.getElementById("results");

  // Monta bloco HTML
  container.innerHTML = `
    <div class="algorithm-result">
      <div class="algorithm-name">${resultado.nome}</div>
      <p>${resultado.explicacao}</p>

      <div class="metrics">
        <div class="metric">
          <div class="metric-value">${resultado.movimentoTotal}</div>
          <div class="metric-label">Movimento Total</div>
        </div>
        <div class="metric">
          <div class="metric-value">${resultado.sequencia.length}</div>
          <div class="metric-label">Requisições</div>
        </div>
      </div>

      <div class="sequence">
        <div class="sequence-title">Ordem de atendimento:</div>
        ${resultado.sequencia.map(pos => `<span class="sequence-step">${pos}</span>`).join("")}
      </div>

      <div class="details">
        <div class="sequence-title">Passo a passo:</div>
        <ul>
          ${detalhes.map(p => `<li>${p}</li>`).join("")}
        </ul>
      </div>
    </div>
  `;

  resultsDiv.style.display = "block";
}



inicializarControles();
