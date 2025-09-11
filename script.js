let estadoPadrao = {
    tamanho: 100,
    posicaoInicial: 50,
    requisicoes: [],
    simulacaoAtiva: false
};

function atualizarRequisicoes() {
    const display = document.getElementById('requestsDisplay');

    const tags = estadoPadrao.requisicoes.map(req => 
        `<span class="request-tag">${req}</span>`
    ).join('');
    
    display.innerHTML = `<strong>Requisições:</strong> ${tags}`;
}

function addRequisicao() {
    const input = document.getElementById('newRequest');
    const valor = parseInt(input.value);
    const tamanho = parseInt(document.getElementById('diskSize').value);

    if (!valor && valor !== 0) {
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
    atualizarVisualizacaoDisco();
}

function exemploAutomatico() {
    const tamanho = parseInt(document.getElementById('diskSize').value);
    estado.requisicoes = [];
    const quantidade = Math.floor(Math.random() * 6) + 5;
    const exemplos = Array.from(
        { length: quantidade },
        () => Math.floor(Math.random() * tamanho)
    );

    estado.requisicoes = exemplos;

    atualizarRequisicoes();
    atualizarVisualizacaoDisco();
}

function limparRequisicoes() {
    estadoPadrao.requisicoes = [];
    atualizarRequisicoes();
    atualizarVisualizacaoDisco();
    document.getElementById('results').style.display = 'none';
}