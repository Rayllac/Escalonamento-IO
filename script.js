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

inicializarControles();
