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
      if (typeof atualizarVisualizacaoDisco === 'function') atualizarVisualizacaoDisco();
    });
  }

  const inputPos = document.getElementById('initialPosition');
  if (inputPos) {
    inputPos.addEventListener('change', e => {
      const v = parseInt(e.target.value);
      estado.posicaoInicial = Number.isNaN(v) ? 0 : v;
      if (typeof atualizarVisualizacaoDisco === 'function') atualizarVisualizacaoDisco();
    });
  }

  atualizarRequisicoes();
  if (typeof atualizarVisualizacaoDisco === 'function') atualizarVisualizacaoDisco();
}



function runAlgoritmo(tipo) {
  if (estado.requisicoes.length === 0) {
    alert("Adicione requisições primeiro!");
    return;
  }

  const tamanho = getTamanho();
  const posicaoInicial = estado.posicaoInicial;
  let resultado;

   switch (tipo) {
    case "sstf":
      resultado = algoritmoSSTF(estado.requisicoes, posicaoInicial);
      break;
    case "scan":
      resultado = algoritmoSCAN(estado.requisicoes, posicaoInicial, tamanho);
      break;
    case "cscan":
      resultado = algoritmoCSCAN(estado.requisicoes, posicaoInicial, tamanho);
      break;
    default:
      alert("Algoritmo desconhecido.");
      return;
  }
  
    mostrarResultado(resultado);
}

function algoritmoSSTF(requisicoes, posicaoInicial) {
  let pendentes = [...requisicoes];
  let posicaoAtual = posicaoInicial;
  let ordemAtendimento = [];
  let movimentoTotal = 0;
  let passos = []; // aqui guardamos cada linha da tabela

  // loop principal
  while (pendentes.length > 0) {
    let maisProxima = pendentes.reduce((maisPerto, req) => {
      let distAtual = Math.abs(req - posicaoAtual);
      let distMaisPerto = Math.abs(maisPerto - posicaoAtual);
      return distAtual < distMaisPerto ? req : maisPerto;
    });

    let deslocamento = Math.abs(maisProxima - posicaoAtual);
    movimentoTotal += deslocamento;

    passos.push({
      de: posicaoAtual,
      para: maisProxima,
      distancia: deslocamento,
      pendentesAntes: [...pendentes],
      pendentesDepois: pendentes.filter(r => r !== maisProxima)
    });

    posicaoAtual = maisProxima;
    ordemAtendimento.push(maisProxima);
    pendentes = pendentes.filter(r => r !== maisProxima);
  }

  return {
    nome: "SSTF (Mais Próximo)",
    explicacao: "Atende sempre a requisição mais próxima da posição atual da cabeça.",
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

  // dividir entre menores e maiores que a posição inicial
  let menores = pendentes.filter(r => r < posicaoAtual).sort((a, b) => b - a);
  let maiores = pendentes.filter(r => r >= posicaoAtual).sort((a, b) => a - b);

  // primeiro vai para o fim (lado crescente)
  let fila = [...maiores, ...menores];

  fila.forEach(req => {
    let deslocamento = Math.abs(req - posicaoAtual);
    movimentoTotal += deslocamento;

    passos.push({
      de: posicaoAtual,
      para: req,
      distancia: deslocamento,
      pendentesAntes: [...pendentes],
      pendentesDepois: pendentes.filter(r => r !== req)
    });

    posicaoAtual = req;
    ordemAtendimento.push(req);
    pendentes = pendentes.filter(r => r !== req);
  });

  return {
    nome: "SCAN (Elevador)",
    explicacao: "A cabeça varre em uma direção até o fim, depois inverte o sentido.",
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

  let maiores = pendentes.filter(r => r >= posicaoAtual).sort((a, b) => a - b);
  let menores = pendentes.filter(r => r < posicaoAtual).sort((a, b) => a - b);

  // atende maiores primeiro
  maiores.forEach(req => {
    let deslocamento = Math.abs(req - posicaoAtual);
    movimentoTotal += deslocamento;

    passos.push({
      de: posicaoAtual,
      para: req,
      distancia: deslocamento,
      pendentesAntes: [...pendentes],
      pendentesDepois: pendentes.filter(r => r !== req)
    });

    posicaoAtual = req;
    ordemAtendimento.push(req);
    pendentes = pendentes.filter(r => r !== req);
  });

  if (menores.length > 0) {
    // move até o fim do disco
    movimentoTotal += (tamanho - 1 - posicaoAtual);
    passos.push({
      de: posicaoAtual,
      para: tamanho - 1,
      distancia: (tamanho - 1 - posicaoAtual),
      pendentesAntes: [...pendentes],
      pendentesDepois: [...pendentes]
    });
    posicaoAtual = 0; // volta ao início (movimento de reset)

    // conta também o salto de reset
    movimentoTotal += (tamanho - 1);

    // atende os menores
    menores.forEach(req => {
      let deslocamento = Math.abs(req - posicaoAtual);
      movimentoTotal += deslocamento;

      passos.push({
        de: posicaoAtual,
        para: req,
        distancia: deslocamento,
        pendentesAntes: [...pendentes],
        pendentesDepois: pendentes.filter(r => r !== req)
      });

      posicaoAtual = req;
      ordemAtendimento.push(req);
      pendentes = pendentes.filter(r => r !== req);
    });
  }

  return {
    nome: "C-SCAN (Circular SCAN)",
    explicacao: "A cabeça só atende em um sentido. Ao chegar no fim, volta ao início sem atender nada.",
    sequencia: ordemAtendimento,
    movimentoTotal,
    passos
  };
}



function mostrarResultado(resultado) {
  const container = document.getElementById("algoritmoresults");
  const resultsDiv = document.getElementById("results");

  let tabelaPassos = `
    <table class="steps-table">
      <thead>
        <tr>
          <th>Posição Atual</th>
          <th>Requisição Escolhida</th>
          <th>Distância</th>
          <th>Pendentes Antes</th>
          <th>Pendentes Depois</th>
        </tr>
      </thead>
      <tbody>
  `;

  resultado.passos.forEach(p => {
    tabelaPassos += `
      <tr>
        <td>${p.de}</td>
        <td>${p.para}</td>
        <td>${p.distancia}</td>
        <td>[${p.pendentesAntes.join(", ")}]</td>
        <td>[${p.pendentesDepois.join(", ")}]</td>
      </tr>
    `;
  });

  tabelaPassos += `</tbody></table>`;

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
        ${tabelaPassos}
      </div>
    </div>
  `;

  resultsDiv.style.display = "block";
}



inicializarControles();
