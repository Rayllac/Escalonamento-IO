

let estado = {
    tamanho: 50, 
    posicaoInicial: 25, 
    requisicoes: [],
};

function getTamanho() {
  const v = parseInt(document.getElementById('diskSize').value);
  if (Number.isNaN(v)) {
    return 50;
  }
  return Math.max(1, v);
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

    let tags = [];

    for (let req of estado.requisicoes) {

      let tagHTML = "<span class='request-tag'>" + req + "</span>";

      tags.push(tagHTML);
    }

    let tagsProntas = tags.join(" ");

    display.innerHTML = "<strong>Requisições:</strong> " + tagsProntas;
  }
}

function limparRequisicoes() {
  estado.requisicoes = [];
  atualizarRequisicoes();

  const results = document.getElementById('results');
  results.style.display = 'none';

  const viz = document.querySelector('.disk-visualization');
  viz.innerHTML = `<div id="diskLine"></div><div id="head"></div>`;

  const head = document.getElementById('head');
  const line = viz.getBoundingClientRect();
  head.style.left = `${(estado.posicaoInicial / estado.tamanho) * line.width}px`;
}

function inicializarControles() {
  const inputReq = document.getElementById('newRequest');
  if (inputReq) {
    inputReq.addEventListener('keypress', e => {
      if (e.key === 'Enter') {
        addRequisicao();
      }
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
      estado.posicaoInicial = null;
      if (Number.isNaN(v)) {                 
        estado.posicaoInicial = 0;           
      } else {                               
        estado.posicaoInicial = v;           
      }
    });
  }

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
    let maisProxima = pendentes[0];
    for (let req of pendentes) {
      if (Math.abs(req - posicaoAtual) < Math.abs(maisProxima - posicaoAtual)) {
        maisProxima = req;
      }
    }

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
    nome: 'SSTF (Mais Próximo)',
    explicacao: 'Atende sempre a requisição mais próxima da posição atual da cabeça.',
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

  return {
    nome: 'SCAN (Elevador)',
    explicacao: 'A cabeça varre em uma direção até o fim, depois inverte o sentido.',
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

  for (let req of maiores) {
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


  if (menores.length > 0) {
 
    if (posicaoAtual !== tamanho - 1) {
      let deslocamento = (tamanho - 1 - posicaoAtual);
      movimentoTotal += deslocamento;
      passos.push({
        de: posicaoAtual,
        para: tamanho - 1,
        distancia: deslocamento,
        pendentesAntes: [...pendentes],
        pendentesDepois: [...pendentes]  
      });
      posicaoAtual = tamanho - 1;
    }

    movimentoTotal += (tamanho - 1);
    passos.push({
      de: posicaoAtual,
      para: 0,
      distancia: (tamanho - 1),
      pendentesAntes: [...pendentes],   
      pendentesDepois: [...pendentes]  
    });
    posicaoAtual = 0;

    for (let req of menores) {
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
  }

  return {
    nome: 'C-SCAN (Circular SCAN)',
    explicacao: 'A cabeça só atende em um sentido. Ao chegar no fim, volta ao início sem atender nada.',
    sequencia: ordemAtendimento,
    movimentoTotal,
    passos
  };
}

function mostrarResultado(resultado) {
  const container = document.getElementById('algoritmoresults');
  const resultsDiv = document.getElementById('results');


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

  for (let p of resultado.passos) {
    tabelaPassos += `
      <tr>
        <td>${p.de}</td>
        <td>${p.para ?? '-'}</td>
        <td>${p.distancia ?? '-'}</td>
        <td>[${(p.pendentesAntes || []).join(', ')}]</td>
        <td>[${(p.pendentesDepois || []).join(', ')}]</td>
      </tr>
    `;
  }

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
        ${resultado.sequencia.map(pos => `<span class="sequence-step">${pos}</span>`).join('')}
      </div>
      <div class="details">
        <div class="sequence-title">Passo a passo:</div>
        ${tabelaPassos}
      </div>
    </div>
  `;

  resultsDiv.style.display = 'block';
  animarAlgoritmo(resultado);
}


function animarAlgoritmo(resultado) {
  const tamanho = getTamanho();
  const viz = document.querySelector('.disk-visualization');

  viz.innerHTML = `<div id="diskLine"></div><div id="head"></div>`;
  const line = viz.getBoundingClientRect();

  for (let req of resultado.sequencia) {
    const label = document.createElement('div');
    label.className = 'request-label';
    label.style.left = `${(req / tamanho) * line.width}px`;
    label.textContent = req;
    viz.appendChild(label);
  }

  const head = document.getElementById('head');
  let i = 0;

  function mover() {
    if (i >= resultado.sequencia.length) return;
    const pos = resultado.sequencia[i];
    head.style.left = `${(pos / tamanho) * line.width}px`;
    i++;
    setTimeout(mover, 1000);
  }

  mover();
}

inicializarControles();

