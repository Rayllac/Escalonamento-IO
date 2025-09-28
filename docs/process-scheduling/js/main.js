const MAX_PROCESSES = 10;
const TOTAL_BURST_CAPACITY = 100;
const PRE_REGISTERED_COUNT = 5;
const PRE_REGISTERED_BURST = 50;

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateBurstsSum(count, total) {
  const bursts = [];
  let remaining = total;
  for (let i = 0; i < count; i++) {
    if (i === count - 1) {
      bursts.push(remaining);
    } else {
      const maxAllowed = remaining - (count - i - 1);
      const value = randInt(1, Math.max(1, maxAllowed));
      bursts.push(value);
      remaining -= value;
    }
  }
  return bursts;
}

function generatePreRegisteredProcesses() {
  const bursts = generateBurstsSum(PRE_REGISTERED_COUNT, PRE_REGISTERED_BURST);
  const procs = [];
  for (let i = 0; i < PRE_REGISTERED_COUNT; i++) {
    procs.push({
      id: `P${i + 1}`,
      arrival: randInt(0, 9),
      burst: bursts[i],
      priority: randInt(1, 10),
    });
  }
  return procs;
}

function getMaxProcessIndex(arr) {
  if (!arr || !arr.length) return 0;
  let max = 0;
  arr.forEach((p) => {
    const digits = (p.id || "").replace(/\D/g, "");
    const n = parseInt(digits, 10);
    if (!isNaN(n) && n > max) max = n;
  });
  return max;
}

let processes = JSON.parse(localStorage.getItem("processes") || "null");
const wasInitialized = localStorage.getItem("processes_initialized") === "true";

if (!wasInitialized) {
  processes = generatePreRegisteredProcesses();
  localStorage.setItem("processes", JSON.stringify(processes));
  localStorage.setItem("processes_initialized", "true");
} else {
  if (!processes) processes = [];
}

let processCount = getMaxProcessIndex(processes);

function updateTable() {
  const tbody = document.querySelector("#process-table tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  processes.forEach((p) => {
    tbody.innerHTML += `<tr>
            <td>${p.id}</td>
            <td>${p.arrival}</td>
            <td>${p.burst}</td>
            <td>${p.priority}</td>
        </tr>`;
  });
}
updateTable();

function totalBurstSum() {
  return processes.reduce((s, p) => s + (p.burst || 0), 0);
}

const form = document.getElementById("process-form");
if (form) {
  form.addEventListener("submit", (e) => {
    e.preventDefault();

    if (processes.length >= MAX_PROCESSES) {
      alert(`Número máximo de processos atingido (${MAX_PROCESSES}).`);
      return;
    }

    const arrivalInput = document.getElementById("arrival");
    const burstInput = document.getElementById("burst");
    const priorityInput = document.getElementById("priority");
    if (!arrivalInput || !burstInput || !priorityInput) return;

    const arrival = parseInt(arrivalInput.value, 10);
    const burst = parseInt(burstInput.value, 10);
    const priority = parseInt(priorityInput.value, 10);

    if (isNaN(burst) || burst <= 0) {
      alert("Informe um valor de duração (burst) válido (> 0).");
      return;
    }

    const currentTotalBurst = totalBurstSum();
    if (currentTotalBurst + burst > TOTAL_BURST_CAPACITY) {
      alert(
        `Não é possível adicionar: soma de bursts ultrapassaria ${TOTAL_BURST_CAPACITY} (atual: ${currentTotalBurst}).`
      );
      return;
    }

    const pidField = document.getElementById("pid");
    const pid =
      pidField && pidField.value ? pidField.value : `P${++processCount}`;

    processes.push({
      id: pid,
      arrival: isNaN(arrival) ? 0 : arrival,
      burst,
      priority: isNaN(priority) ? 1 : priority,
    });
    localStorage.setItem("processes", JSON.stringify(processes));
    updateTable();
    e.target.reset();
  });

  const clearBtn = document.getElementById("clear-btn");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      if (!confirm("Remover TODOS os processos?")) return;
      processes = [];
      localStorage.setItem("processes", JSON.stringify(processes));
      updateTable();
    });
  }

  const reloadBtn = document.getElementById("reload-btn");
  if (reloadBtn) {
    reloadBtn.addEventListener("click", () => {
      if (
        !confirm(
          "Recarregar processos pré-cadastrados aleatórios? Isso substituirá a lista atual."
        )
      )
        return;
      processes = generatePreRegisteredProcesses();
      processCount = getMaxProcessIndex(processes);
      localStorage.setItem("processes_initialized", "true");
      localStorage.setItem("processes", JSON.stringify(processes));
      updateTable();
    });
  }

  const goSimBtn = document.getElementById("go-simulations-btn");
  if (goSimBtn) {
    goSimBtn.addEventListener("click", () => {
      localStorage.setItem("processes", JSON.stringify(processes));
      window.location.href = "simulation.html";
    });
  }
}

function runSimulation(algoSelectId, quantumInputId, canvasId, resultsDivId) {
  const stored = JSON.parse(localStorage.getItem("processes") || "null");
  if (stored && stored.length) processes = stored;

  if (!processes || !processes.length) {
    alert(
      "Não é possível executar a simulação: não existem processos cadastrados. Cadastre processos na página de entrada antes de simular."
    );
    return;
  }

  const algoSelect = document.getElementById(algoSelectId);
  const quantumInput = document.getElementById(quantumInputId);
  if (!algoSelect) return;

  const algo = algoSelect.value;
  const quantum = quantumInput ? parseInt(quantumInput.value, 10) : undefined;

  let gantt, results;
  if (algo === "FIFO") ({ gantt, results } = fifo(processes));
  else if (algo === "SJF") ({ gantt, results } = sjf(processes));
  else if (algo === "RoundRobin") {
    if (!quantum || quantum <= 0) {
      alert("Defina um quantum válido (>0).");
      return;
    }
    ({ gantt, results } = roundRobin(processes, quantum));
  } else if (algo === "Prioridade")
    ({ gantt, results } = prioridade(processes));
  else {
    alert("Algoritmo desconhecido.");
    return;
  }

  if (gantt && gantt.length) {
    const minStart = gantt.reduce((min, b) => Math.min(min, b.start), Infinity);
    if (minStart > 0 && isFinite(minStart)) {
      gantt = gantt.map((block) => ({
        id: block.id,
        start: block.start - minStart,
        end: block.end - minStart,
      }));
    }

    gantt.sort((a, b) => a.start - b.start);
    for (let i = 1; i < gantt.length; i++) {
      if (gantt[i].start > gantt[i - 1].end) {
        const dur = gantt[i].end - gantt[i].start;
        gantt[i].start = gantt[i - 1].end;
        gantt[i].end = gantt[i].start + dur;
      }
    }
  }

  drawGantt(gantt, `Diagrama de Gannt (${algo})`, canvasId, 500);

  let html = `<h3>Métricas</h3><table>
        <tr>
            <th title="Identificador do processo">ID</th>
            <th title="Tempo que o processo esperou antes de ser executado (turnaround - burst)">Espera</th>
            <th title="Tempo total entre a chegada e a finalização do processo (burst - chegada)">Turnaround</th>
            <th title="Tempo até a primeira resposta do processo (primeira execução - chegada)">Resposta</th>
        </tr>`;
  results.forEach((r) => {
    html += `<tr><td>${r.id}</td><td>${r.waiting}</td><td>${r.turnaround}</td><td>${r.response}</td></tr>`;
  });
  html += `</table>`;

  const avg = {
    waiting: (
      results.reduce((s, r) => s + r.waiting, 0) / results.length
    ).toFixed(2),
    turnaround: (
      results.reduce((s, r) => s + r.turnaround, 0) / results.length
    ).toFixed(2),
    response: (
      results.reduce((s, r) => s + r.response, 0) / results.length
    ).toFixed(2),
  };
  html += `<p><strong>Médias:</strong> Espera = ${avg.waiting}, Turnaround = ${avg.turnaround}, Resposta = ${avg.response}</p>`;

  const resultsDiv = document.getElementById(resultsDivId);
  if (resultsDiv) resultsDiv.innerHTML = html;
}

if (document.getElementById("simulate-btn-1")) {
  document.getElementById("simulate-btn-1").addEventListener("click", () => {
    runSimulation("algorithm1", "quantum1", "gantt1", "results1");
  });
}
if (document.getElementById("simulate-btn-2")) {
  document.getElementById("simulate-btn-2").addEventListener("click", () => {
    runSimulation("algorithm2", "quantum2", "gantt2", "results2");
  });
}

if (document.getElementById("compare-btn")) {
  document.getElementById("compare-btn").addEventListener("click", () => {
    const stored = JSON.parse(localStorage.getItem("processes") || "null");
    if (stored && stored.length) processes = stored;

    if (!processes || !processes.length) {
      alert(
        "Não é possível executar a comparação: não existem processos cadastrados. Cadastre processos na página de entrada antes de comparar."
      );
      return;
    }

    const comparisons = {
      FIFO: fifo(processes).results,
      SJF: sjf(processes).results,
      Prioridade: prioridade(processes).results,
    };

    const qInput = document.getElementById("quantum1");
    const q = qInput ? parseInt(qInput.value, 10) : NaN;
    if (!isNaN(q) && q > 0)
      comparisons["RoundRobin"] = roundRobin(processes, q).results;

    const algoDescriptions = {
      FIFO: "First In, First Out: executa os processos na ordem de chegada, sem preempção",
      SJF: "Shortest Job First: executa o processo com menor tempo de execução, sem preempção",
      RoundRobin:
        "Executa em ciclos iguais (quantum), alternando entre processos (preemptivo)",
      Prioridade:
        "Executa primeiro os processos com maior prioridade (menor valor atribuído), sem preempção",
    };

    // Monta tabela de comparação
    let html = `<h3>Resumo comparativo com todas as métricas dos algoritmos</h3>
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
    document.getElementById("comparison").innerHTML = html;
  });
}

const editBtn1 = document.getElementById("edit-btn1");
if (editBtn1) {
  editBtn1.addEventListener("click", () => {
    window.location.href = "input.html";
  });
}

const editBtn2 = document.getElementById("edit-btn2");
if (editBtn2) {
  editBtn2.addEventListener("click", () => {
    window.location.href = "input.html";
  });
}
