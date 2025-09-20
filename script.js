let estado = {
  tamanho: 50,
  posicaoInicial: 25,
  requisicoes: [],
};

function getTamanho() {
  const v = parseInt(document.getElementById('diskSize').value);
  return Number.isNaN(v) ? 50 : Math.max(1, v);
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
  const numeros = new Set();

  while (numeros.size < quantidade) {
    numeros.add(Math.floor(Math.random() * tamanho));
  }

  estado.requisicoes = Array.from(numeros);
  atualizarRequisicoes();
}

function atualizarRequisicoes() {
  const display = document.getElementById('requestsDisplay');

  if (estado.requisicoes.length === 0) {
    display.innerHTML = '<strong>Requisições:</strong> <em>Nenhuma ainda. Adicione algumas!</em>';
  } else {
    const tags = estado.requisicoes.map(req => `<span class='request-tag'>${req}</span>`);
    display.innerHTML = "<strong>Requisições:</strong> " + tags.join(" ");
  }
}

function limparRequisicoes() {
  estado.requisicoes = [];
  atualizarRequisicoes();

  document.getElementById('results').style.display = 'none';

  const viz = document.querySelector('.disk-visualization');
  viz.innerHTML = `<div id="diskLine"></div><div id="head"></div>`;

  const head = document.getElementById('head');
  const line = viz.getBoundingClientRect();
  head.style.left = `${(estado.posicaoInicial / estado.tamanho) * line.width}px`;

  const inputFile = document.getElementById('fileInput');
  if (inputFile) inputFile.value = '';
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
    });
  }

  const inputPos = document.getElementById('initialPosition');
  if (inputPos) {
    inputPos.addEventListener('change', e => {
      const v = parseInt(e.target.value);
      estado.posicaoInicial = Number.isNaN(v) ? 0 : v;
    });
  }

  const inputFile = document.getElementById('fileInput');
  if (inputFile) inputFile.addEventListener('change', carregarDeArquivo);

  atualizarRequisicoes();
}

function runAlgoritmo(tipo) {
  if (estado.requisicoes.length === 0) {
    alert('Adicione requisições primeiro!');
    return;
  }

  const tamanho = getTamanho();
  const posicaoInicial = estado.posicaoInicial;
  let resultado = null;

  switch (tipo) {
    case 'sstf':
      resultado = algoritmoSSTF(estado.requisicoes, posicaoInicial);
      break;
    case 'scan':
      resultado = algoritmoSCAN(estado.requisicoes, posicaoInicial, tamanho);
      break;
    case 'cscan':
      resultado = algoritmoCSCAN(estado.requisicoes, posicaoInicial, tamanho);
      break;
    default:
      alert('Algoritmo desconhecido.');
      return;
  }
  mostrarResultado(resultado);
}

function algoritmoSSTF(requisicoes, posicaoInicial) {
  let pendentes = [...requisicoes];
  let posicaoAtual = posicaoInicial;
  let ordemAtendimento = [];
  let movimentoTotal = 0;
  let passos = [];

  while (pendentes.length > 0) {
    let maisProxima = pendentes.reduce((a, b) =>
      Math.abs(a - posicaoAtual) < Math.abs(b - posicaoAtual) ? a : b
    );

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

  return { nome: 'SSTF (Mais Próximo)', explicacao: 'Atende sempre a requisição mais próxima.', sequencia: ordemAtendimento, movimentoTotal, passos };
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

  for (let req of fila) {
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
  }

  return { nome: 'SCAN (Elevador)', explicacao: 'Varre em uma direção até o fim, depois inverte.', sequencia: ordemAtendimento, movimentoTotal, passos };
}

function algoritmoCSCAN(requisicoes, posicaoInicial, tamanho) {
  let pendentes = [...requisicoes].sort((a, b) => a - b);
  let posicaoAtual = posicaoInicial;
  let ordemAtendimento = [];
  let movimentoTotal = 0;
  let passos = [];

  const maiores = pendentes.filter(r => r >= posicaoAtual).sort((a, b) => a - b);
  const menores = pendentes.filter(r => r < posicaoAtual).sort((a, b) => a - b);

  for (let req of maiores) {
    let deslocamento = Math.abs(req - posicaoAtual);
    movimentoTotal += deslocamento;
    passos.push({
      de: posicaoAtual, para: req, distancia: deslocamento,
      pendentesAntes: [...pendentes], pendentesDepois: pendentes.filter(r => r !== req)
    });
    posicaoAtual = req;
    ordemAtendimento.push(req);
    pendentes = pendentes.filter(r => r !== req);
  }

  if (menores.length > 0) {
    if (posicaoAtual !== tamanho - 1) {
      movimentoTotal += (tamanho - 1 - posicaoAtual);
      passos.push({ de: posicaoAtual, para: tamanho - 1, distancia: tamanho - 1 - posicaoAtual, pendentesAntes: [...pendentes], pendentesDepois: [...pendentes] });
      posicaoAtual = tamanho - 1;
    }
    movimentoTotal += (tamanho - 1);
    passos.push({ de: posicaoAtual, para: 0, distancia: (tamanho - 1), pendentesAntes: [...pendentes], pendentesDepois: [...pendentes] });
    posicaoAtual = 0;

    for (let req of menores) {
      let deslocamento = Math.abs(req - posicaoAtual);
      movimentoTotal += deslocamento;
      passos.push({
        de: posicaoAtual, para: req, distancia: deslocamento,
        pendentesAntes: [...pendentes], pendentesDepois: pendentes.filter(r => r !== req)
      });
      posicaoAtual = req;
      ordemAtendimento.push(req);
      pendentes = pendentes.filter(r => r !== req);
    }
  }

  return { nome: 'C-SCAN (Circular SCAN)', explicacao: 'Atende em um sentido; ao fim, volta ao início sem atender.', sequencia: ordemAtendimento, movimentoTotal, passos };
}

function mostrarResultado(resultado) {
  const container = document.getElementById('algoritmoresults');
  const resultsDiv = document.getElementById('results');

  let tabelaPassos = `
    <table class="steps-table">
      <thead>
        <tr>
          <th>Posição Atual</th><th>Requisição Escolhida</th><th>Distância</th><th>Pendentes Antes</th><th>Pendentes Depois</th>
        </tr>
      </thead><tbody>
  `;
  for (let p of resultado.passos) {
    tabelaPassos += `<tr>
      <td>${p.de}</td><td>${p.para ?? '-'}</td><td>${p.distancia ?? '-'}</td>
      <td>[${(p.pendentesAntes || []).join(', ')}]</td>
      <td>[${(p.pendentesDepois || []).join(', ')}]</td></tr>`;
  }
  tabelaPassos += `</tbody></table>`;

  container.innerHTML = `
    <div class="algorithm-result">
      <div class="algorithm-name">${resultado.nome}</div>
      <p>${resultado.explicacao}</p>
      <div class="metrics">
        <div class="metric"><div class="metric-value">${resultado.movimentoTotal}</div><div class="metric-label">Movimento Total</div></div>
        <div class="metric"><div class="metric-value">${resultado.sequencia.length}</div><div class="metric-label">Requisições</div></div>
      </div>
      <div class="sequence"><div class="sequence-title">Ordem de atendimento:</div>${resultado.sequencia.map(pos => `<span class="sequence-step">${pos}</span>`).join('')}</div>
      <div class="details"><div class="sequence-title">Passo a passo:</div>${tabelaPassos}</div>
    </div>`;
  resultsDiv.style.display = 'block';
  animarAlgoritmo(resultado);
}

function animarAlgoritmo(resultado) {
  const tamanho = getTamanho();
  const viz = document.querySelector('.disk-visualization');

  viz.innerHTML = `<div id="diskLine"></div><div id="head"></div>`;
  const line = viz.getBoundingClientRect();
  const head = document.getElementById('head');

  let i = 0;
  let movimentoAtual = 0;
  const movimentoDiv = document.querySelector('.metric-value'); // mostra movimento total

  function mover() {
    if (i >= resultado.passos.length) return;

    const passo = resultado.passos[i];
    const pos = passo.para;

    // move cabeça
    head.style.left = `${(pos / tamanho) * line.width}px`;

    // adiciona requisição na régua
    const label = document.createElement('div');
    label.className = 'request-label';
    label.style.left = `${(pos / tamanho) * line.width}px`;
    label.textContent = pos;
    viz.appendChild(label);

    // atualiza movimento
    movimentoAtual += passo.distancia;
    if (movimentoDiv) movimentoDiv.textContent = movimentoAtual;

    i++;
    setTimeout(mover, 1000); // espera 1s antes do próximo passo
  }

  mover();
}


function carregarDeArquivo(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    const linhas = e.target.result.split(/\r?\n/).map(l => l.trim()).filter(l => l);
    let tamanho = null, cabeca = null, requisicoes = [];

    for (let linha of linhas) {
      if (linha.startsWith("tamanho=")) tamanho = parseInt(linha.split("=")[1]);
      else if (linha.startsWith("cabeca=")) cabeca = parseInt(linha.split("=")[1]);
      else if (linha.startsWith("requisicoes=")) requisicoes = linha.split("=")[1].split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
    }

    if (tamanho !== null) {
      estado.tamanho = tamanho;
      document.getElementById("diskSize").value = tamanho;
    }
    if (cabeca !== null) {
      estado.posicaoInicial = cabeca;
      document.getElementById("initialPosition").value = cabeca;
    }
    if (requisicoes.length > 0) estado.requisicoes = requisicoes;

    atualizarRequisicoes();
  };
  reader.readAsText(file);
}

function compararAlgoritmos() {
  const tamanho = getTamanho();
  const posicaoInicial = estado.posicaoInicial;
  const requisicoes = estado.requisicoes;

  const resultados = {
    sstf: algoritmoSSTF(requisicoes, posicaoInicial),
    scan: algoritmoSCAN(requisicoes, posicaoInicial, tamanho),
    cscan: algoritmoCSCAN(requisicoes, posicaoInicial, tamanho)
  };

  let melhor = Object.values(resultados).reduce((a, b) => a.movimentoTotal < b.movimentoTotal ? a : b);

  mostrarComparacao(resultados, melhor);
  mostrarVisualComparacao(resultados, tamanho);
}

function mostrarComparacao(resultados, melhor) {
  const container = document.getElementById('algoritmoresults');
  const resultsDiv = document.getElementById('results');

  let tabela = `
    <table class="steps-table">
      <thead><tr><th>Algoritmo</th><th>Movimento Total</th><th>Requisições</th><th>Ordem</th></tr></thead><tbody>
      ${Object.values(resultados).map(r => `
        <tr style="${melhor.nome === r.nome ? 'background:#d4edda;' : ''}">
          <td>${r.nome}</td><td>${r.movimentoTotal}</td><td>${r.sequencia.length}</td><td>${r.sequencia.join(' → ')}</td>
        </tr>`).join('')}
      </tbody></table>
      <p><strong>✅ Melhor algoritmo:</strong> ${melhor.nome}</p>
  `;
  container.innerHTML = tabela;
  resultsDiv.style.display = 'block';
}

function mostrarVisualComparacao(resultados, tamanho) {
  const viz = document.querySelector('.disk-visualization');
  viz.innerHTML = `
    <div class="compare-row"><div class="alg-label">SSTF</div><div class="diskLineWrapper"><div class="diskLine"></div><div class="head" id="head-sstf"></div></div></div>
    <div class="compare-row"><div class="alg-label">SCAN</div><div class="diskLineWrapper"><div class="diskLine"></div><div class="head" id="head-scan"></div></div></div>
    <div class="compare-row"><div class="alg-label">C-SCAN</div><div class="diskLineWrapper"><div class="diskLine"></div><div class="head" id="head-cscan"></div></div></div>
  `;
  desenharSequencia(resultados.sstf.sequencia, "head-sstf", tamanho);
  desenharSequencia(resultados.scan.sequencia, "head-scan", tamanho);
  desenharSequencia(resultados.cscan.sequencia, "head-cscan", tamanho);
}

function desenharSequencia(sequencia, headId, tamanho) {
  const head = document.getElementById(headId);
  const wrapper = head.parentElement;
  const line = wrapper.getBoundingClientRect();

  sequencia.forEach(req => {
    const label = document.createElement("div");
    label.className = "request-label";
    label.style.left = `${(req / tamanho) * line.width}px`;
    label.textContent = req;
    wrapper.appendChild(label);
  });

  let i = 0;
  function mover() {
    if (i >= sequencia.length) return;
    const pos = sequencia[i];
    head.style.left = `${(pos / tamanho) * line.width}px`;
    i++;
    setTimeout(mover, 1000);
  }
  mover();
}


function desenharSequenciaAnimada(passos, headId, wrapperId, tamanho, movimentoSpan) {
  const head = document.getElementById(headId);
  const wrapper = document.getElementById(wrapperId);
  const line = wrapper.getBoundingClientRect();

  let i = 0;
  let movimentoAtual = 0;

  function mover() {
    if (i >= passos.length) return;

    const passo = passos[i];
    const pos = passo.para;

    // move cabeça
    head.style.left = `${(pos / tamanho) * line.width}px`;

    // adiciona requisição
    const label = document.createElement('div');
    label.className = 'request-label';
    label.style.left = `${(pos / tamanho) * line.width}px`;
    label.textContent = pos;
    wrapper.appendChild(label);

    // atualiza movimento
    movimentoAtual += passo.distancia;
    if (movimentoSpan) movimentoSpan.textContent = movimentoAtual;

    i++;
    setTimeout(mover, 1000);
  }

  mover();
}


inicializarControles();
