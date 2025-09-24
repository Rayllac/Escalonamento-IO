// Lista inicial de processos
let processes = [
    {id: "P1", arrival: 0, burst: 5, priority: 2},
    {id: "P2", arrival: 0, burst: 10, priority: 1},
    {id: "P3", arrival: 5, burst: 5, priority: 1},
    {id: "P4", arrival: 7, burst: 20, priority: 1},
    {id: "P5", arrival: 7, burst: 10, priority: 2}
]; 

let processCount = processes.length; // Guarda a quantidade inicial de processos

updateTable(); // Atualiza a tabela com os processos iniciais

// Captura o envio do formulário de processos
document.getElementById("process-form").addEventListener("submit", e => {
    e.preventDefault(); // Impede o comportamento padrão de recarregar a página

    // Verifica limite de quantidade de processos
    if (processes.length >= 10) {
        alert("Número máximo de processos atingido (10).");
        return;
    }

    // Pega o ID do processo (se não for informado, gera automaticamente)
    let pid = document.getElementById("pid").value || `P${++processCount}`;

    // Converte os valores de entrada em inteiros
    let arrival = parseInt(document.getElementById("arrival").value);
    let burst = parseInt(document.getElementById("burst").value);
    let priority = parseInt(document.getElementById("priority").value);

    // Verifica limite total de bursts
    let totalBurst = processes.reduce((sum, p) => sum + p.burst, 0);
    if (totalBurst + burst > 100) {
        alert("A soma total dos tempos de execução não pode ultrapassar 100.");
        return;
    }

    // Adiciona o processo novo na lista
    processes.push({id: pid, arrival, burst, priority});

    // Atualiza a tabela com o novo processo
    updateTable();

    // Limpa o formulário após o envio
    e.target.reset();
});

// Atualiza a tabela de processos
function updateTable() {
    // Seleciona o corpo da tabela
    let tbody = document.querySelector("#process-table tbody");

    // Limpa o conteúdo atual
    tbody.innerHTML = "";

    // Para cada processo, cria uma linha e adiciona na tabela
    processes.forEach(p => {
        let row = `<tr>
            <td>${p.id}</td>
            <td>${p.arrival}</td>
            <td>${p.burst}</td>
            <td>${p.priority}</td>
        </tr>`;
        tbody.innerHTML += row;
    });
}

// Roda a simulação com um algoritmo escolhido
function runSimulation(algoSelectId, quantumInputId, canvasId, resultsDivId) {
    // Pega o algoritmo selecionado pelo usuário
    let algo = document.getElementById(algoSelectId).value;

    // Pega o quantum informado (apenas usado no Round Robin)
    let quantum = parseInt(document.getElementById(quantumInputId).value);

    // Variáveis para armazenar o diagrama e os resultados
    let gantt, results;

    // Executa o algoritmo correspondente
    if (algo === "FIFO") {
        ({gantt, results} = fifo(processes));
    } else if (algo === "SJF") {
        ({gantt, results} = sjf(processes));
    } else if (algo === "RoundRobin") {
        if (quantum <= 0) {
            alert("Defina um quantum válido (>0).");
            return;
        }
        ({gantt, results} = roundRobin(processes, quantum));
    } else if (algo === "Prioridade") {
        ({gantt, results} = prioridade(processes));
    }

    // Desenha o diagrama no canvas correspondente
    drawGantt(gantt, `Diagrama de Gantt (${algo})`, canvasId, 500);

    // Cria a tabela para exibir as métricas de cada processo com explicações
    let html = `<h3>Métricas por processo</h3>
    <table>
        <tr>
            <th title="Identificador do processo">ID</th>
            <th title="Tempo que o processo esperou antes de ser executado (turnaround - burst)">Espera</th>
            <th title="Tempo total entre a chegada e a finalização do processo (burst - chegada)">Turnaround</th>
            <th title="Tempo até a primeira resposta do processo (primeira execução - chegada)">Resposta</th>
        </tr>`;

    // Adiciona linha para cada processo com suas métricas
    results.forEach(r => {
        html += `<tr><td>${r.id}</td><td>${r.waiting}</td><td>${r.turnaround}</td><td>${r.response}</td></tr>`;
    });
    html += "</table>";

    // Calcula médias das métricas
    let avg = {
        waiting: (results.reduce((s,r) => s+r.waiting,0)/results.length).toFixed(2),
        turnaround: (results.reduce((s,r) => s+r.turnaround,0)/results.length).toFixed(2),
        response: (results.reduce((s,r) => s+r.response,0)/results.length).toFixed(2),
    };

    // Adiciona médias à tabela
    html += `<p><strong>Médias:</strong> Espera = ${avg.waiting}, Turnaround = ${avg.turnaround}, Resposta = ${avg.response}</p>`;

    // Exibe o resultado correspondente
    document.getElementById(resultsDivId).innerHTML = html;
}

// Botão para rodar simulação do primeiro algoritmo
document.getElementById("simulate-btn-1").addEventListener("click", () => {
    runSimulation("algorithm1", "quantum1", "gantt1", "results1");
});

// Botão para rodar simulação do segundo algoritmo
document.getElementById("simulate-btn-2").addEventListener("click", () => {
    runSimulation("algorithm2", "quantum2", "gantt2", "results2");
});

// Botão para comparar todos os algoritmos
document.getElementById("compare-btn").addEventListener("click", () => {
    // Objeto que guarda os resultados de cada algoritmo
    let comparisons = {};

    // Executa FIFO
    comparisons["FIFO"] = fifo(processes).results;

    // Executa SJF
    comparisons["SJF"] = sjf(processes).results;

    // Executa Round Robin (se quantum for válido)
    let q = parseInt(document.getElementById("quantum1").value);
    if (q > 0) comparisons[`RoundRobin`] = roundRobin(processes, q).results;

    // Executa Prioridade
    comparisons["Prioridade"] = prioridade(processes).results;

    // Resumos de definição dos algoritmos
    const algoDescriptions = {
        "FIFO": "First In, First Out: executa os processos na ordem de chegada, sem preempção",
        "SJF": "Shortest Job First: executa o processo com menor tempo de execução, sem preempção",
        "RoundRobin": "Executa em ciclos iguais (quantum), alternando entre processos (preemptivo)",
        "Prioridade": "Executa primeiro os processos com maior prioridade (menor valor atribuído), sem preempção",
    };

    // Monta tabela de comparação
    let html = `<h3>Comparação</h3>
        <table>
            <tr>
                <th title="Escalonador de processos">Algoritmo</th>
                <th title="Tempo médio que os processos esperaram antes de serem executados (turnaround - burst)">Espera Média</th>
                <th title="Tempo total médio entre a chegada e a finalização do processos (burst - chegada)">Turnaround Médio</th>
                <th title="Tempo médio até a primeira resposta dos processos (primeira execução - chegada)">Resposta Média</th>
            </tr>`;
    
    // Para cada algoritmo, calcula médias e adiciona à tabela
    for (let algo in comparisons) {
        let arr = comparisons[algo];
        let avgWait = (arr.reduce((s,r)=>s+r.waiting,0)/arr.length).toFixed(2);
        let avgTurn = (arr.reduce((s,r)=>s+r.turnaround,0)/arr.length).toFixed(2);
        let avgResp = (arr.reduce((s,r)=>s+r.response,0)/arr.length).toFixed(2);
        html += `<tr><td title="${algoDescriptions[algo]}">${algo}</td><td>${avgWait}</td><td>${avgTurn}</td><td>${avgResp}</td></tr>`;
    }
    html += "</table>";

    // Exibe a tabela de comparação
    document.getElementById("comparison").innerHTML = html;
});
