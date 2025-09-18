

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

  const inputFile = document.getElementById('fileInput');
  if (inputFile) {
    inputFile.value = '';
  }
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

  const inputFile = document.getElementById('fileInput');
  if (inputFile) {
    inputFile.addEventListener('change', carregarDeArquivo);
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

function carregarDeArquivo(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const linhas = e.target.result.split(/\r?\n/).map(l => l.trim()).filter(l => l);

    let tamanho = null;
    let cabeca = null;
    let requisicoes = [];

    for (let linha of linhas) {
      if (linha.startsWith("tamanho=")) {
        tamanho = parseInt(linha.split("=")[1]);
      } else if (linha.startsWith("cabeca=")) {
        cabeca = parseInt(linha.split("=")[1]);
      } else if (linha.startsWith("requisicoes=")) {
        requisicoes = linha.split("=")[1].split(",").map(v => parseInt(v.trim())).filter(v => !isNaN(v));
      }
    }

    if (tamanho !== null) {
      estado.tamanho = tamanho;
      document.getElementById("diskSize").value = tamanho;
    }

    if (cabeca !== null) {
      estado.posicaoInicial = cabeca;
      document.getElementById("initialPosition").value = cabeca;
    }

    if (requisicoes.length > 0) {
      estado.requisicoes = requisicoes;
    }

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
      <thead>
        <tr>
          <th>Algoritmo</th>
          <th>Movimento Total</th>
          <th>Requisições Atendidas</th>
          <th>Ordem</th>
        </tr>
      </thead>
      <tbody>
        <tr style="${melhor.nome === resultados.sstf.nome ? 'background:#d4edda;' : ''}">
          <td>${resultados.sstf.nome}</td>
          <td>${resultados.sstf.movimentoTotal}</td>
          <td>${resultados.sstf.sequencia.length}</td>
          <td>${resultados.sstf.sequencia.join(' → ')}</td>
        </tr>
        <tr style="${melhor.nome === resultados.scan.nome ? 'background:#d4edda;' : ''}">
          <td>${resultados.scan.nome}</td>
          <td>${resultados.scan.movimentoTotal}</td>
          <td>${resultados.scan.sequencia.length}</td>
          <td>${resultados.scan.sequencia.join(' → ')}</td>
        </tr>
        <tr style="${melhor.nome === resultados.cscan.nome ? 'background:#d4edda;' : ''}">
          <td>${resultados.cscan.nome}</td>
          <td>${resultados.cscan.movimentoTotal}</td>
          <td>${resultados.cscan.sequencia.length}</td>
          <td>${resultados.cscan.sequencia.join(' → ')}</td>
        </tr>
      </tbody>
    </table>
    <p><strong>✅ Melhor algoritmo:</strong> ${melhor.nome} (Menor movimento total)</p>
  `;

  container.innerHTML = tabela;
  resultsDiv.style.display = 'block';
}

function mostrarVisualComparacao(resultados, tamanho) {
  const viz = document.querySelector('.disk-visualization');

  // recriar área
  viz.innerHTML = `
    <div class="viz-row">
      <div class="viz-label">SSTF</div>
      <div class="viz-line" id="line-sstf"></div>
      <div class="head" id="head-sstf"></div>
    </div>
    <div class="viz-row">
      <div class="viz-label">SCAN</div>
      <div class="viz-line" id="line-scan"></div>
      <div class="head" id="head-scan"></div>
    </div>
    <div class="viz-row">
      <div class="viz-label">C-SCAN</div>
      <div class="viz-line" id="line-cscan"></div>
      <div class="head" id="head-cscan"></div>
    </div>
  `;

  function desenharRequisicoes(seq, id) {
    const line = document.getElementById(id);
    const largura = line.offsetWidth;

    seq.forEach(req => {
      const dot = document.createElement("div");
      dot.className = "request-dot";
      dot.style.left = `${(req / tamanho) * largura}px`;
      dot.textContent = req;
      line.appendChild(dot);
    });
  }

  desenharRequisicoes(resultados.sstf.sequencia, "line-sstf");
  desenharRequisicoes(resultados.scan.sequencia, "line-scan");
  desenharRequisicoes(resultados.cscan.sequencia, "line-cscan");

  // animar os 3 cabeçotes
  animarHead(resultados.sstf.sequencia, "head-sstf", "line-sstf", tamanho);
  animarHead(resultados.scan.sequencia, "head-scan", "line-scan", tamanho);
  animarHead(resultados.cscan.sequencia, "head-cscan", "line-cscan", tamanho);
}

function animarHead(sequencia, headId, lineId, tamanho) {
  const line = document.getElementById(lineId);
  const largura = line.offsetWidth;
  const head = document.getElementById(headId);

  let i = 0;
  head.style.left = "0px"; // começa do início

  function mover() {
    if (i >= sequencia.length) return;
    const pos = sequencia[i];
    head.style.left = `${(pos / tamanho) * largura}px`;
    i++;
    setTimeout(mover, 800); // 800ms por movimento
  }

  mover();
}





inicializarControles();

