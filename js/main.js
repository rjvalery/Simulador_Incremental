// main.js - Punto de entrada principal y bucle del motor corregido

import { state } from './resources.js';
import { handleManualHarvest, buildStructure, researchTech, launchMilitaryAttack, modifyWorkerAllocation } from './actions.js';
import { calculateBuildingCost, BUILDINGS_DATA } from './buildings.js';

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupEventListeners();
    startGameLoop();
});

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(section => {
                section.style.display = 'none';
            });
            const activeSection = document.getElementById(`tab-${targetTab}`);
            if (activeSection) {
                activeSection.style.display = 'flex';
            }
        });
    });
}

function setupEventListeners() {
    // Vincular el botón de recolección manual
    const btnHarvestFood = document.getElementById('btn-harvest-food');
    if (btnHarvestFood) {
        btnHarvestFood.addEventListener('click', () => {
            handleManualHarvest(state, 'food');
            renderResources();
        });
    }

    // Vincular botones de asignación de empleo si existen en la UI
    const btnAssignWorker = document.getElementById('btn-assign-worker');
    if (btnAssignWorker) {
        btnAssignWorker.addEventListener('click', () => {
            modifyWorkerAllocation(state, 1);
            renderEmploymentUI();
        });
    }

    const btnUnassignWorker = document.getElementById('btn-unassign-worker');
    if (btnUnassignWorker) {
        btnUnassignWorker.addEventListener('click', () => {
            modifyWorkerAllocation(state, -1);
            renderEmploymentUI();
        });
    }

    // Escuchar eventos globales para el Registro Histórico (Game-Log)
    window.addEventListener('log:add', (e) => {
        const { message, type } = e.detail;
        appendLog(message, type);
    });

    // Botón para vaciar el log
    const btnClearLog = document.getElementById('btn-clear-log');
    if (btnClearLog) {
        btnClearLog.addEventListener('click', () => {
            document.getElementById('game-log').innerHTML = '';
        });
    }
}

// Lógica del motor ejecutada en cada tick por segundo (sin duplicados)
function runGameTick(currentState) {
    // 1. Calcular producción pasiva por edificaciones
    for (const [buildingKey, count] of Object.entries(currentState.buildings || {})) {
        if (count > 0) {
            if (buildingKey === 'farm' && currentState.resources.food) {
                currentState.resources.food.value += 2 * count;
            }
            if (buildingKey === 'woodcutter' && currentState.resources.wood) {
                currentState.resources.wood.value += 1.5 * count;
            }
        }
    }

    // 2. Crecimiento demográfico basado en refugios y comida disponible
    if (!currentState.population) {
        currentState.population = { free: 0, workers: 0, technicians: 0 };
    }

    const maxPopulation = (currentState.buildings.shelter || 0) * 5;
    const currentAssigned = currentState.population.workers + currentState.population.technicians;
    const totalPopulation = currentAssigned + currentState.population.free;

    // Si hay espacio y comida suficiente, los ciudadanos libres aumentan gradualmente
    if (totalPopulation < maxPopulation && currentState.resources.food.value >= 10) {
        // Incremento acumulativo controlado (al llegar a 1 se añade un ciudadano libre)
        if (!currentState._popAccumulator) currentState._popAccumulator = 0;
        currentState._popAccumulator += 0.05; // Goteo demográfico
        
        if (currentState._popAccumulator >= 1) {
            currentState.population.free += 1;
            currentState._popAccumulator = 0;
            window.dispatchEvent(new CustomEvent('log:add', {
                detail: { message: `Un nuevo habitante ha llegado al asentamiento buscando refugio.`, type: 'success' }
            }));
        }
    }
}

function appendLog(message, type = 'info') {
    const logContainer = document.getElementById('game-log');
    if (!logContainer) return;

    const div = document.createElement('div');
    div.style.marginBottom = '4px';
    if (type === 'success') div.style.color = '#4CAF50';
    if (type === 'warning') div.style.color = '#FF9800';
    if (type === 'danger') div.style.color = '#F44336';
    
    div.textContent = `> ${message}`;
    logContainer.prepend(div);
}

function renderResources() {
    const container = document.getElementById('sidebar-resources');
    if (!container) return;

    container.innerHTML = '';
    for (const [key, res] of Object.entries(state.resources)) {
        const div = document.createElement('div');
        div.style.marginBottom = '8px';
        div.style.fontSize = '0.9rem';
        div.innerHTML = `<strong>${res.name || key}:</strong> ${Math.floor(res.value)} / ${res.max || '∞'}`;
        container.appendChild(div);
    }
}

function renderEmploymentUI() {
    const workerCountSpan = document.getElementById('worker-count');
    if (workerCountSpan && state.population) {
        workerCountSpan.textContent = `Obreros: ${state.population.workers} | Libres: ${state.population.free || 0}`;
    }
}

function startGameLoop() {
    setInterval(() => {
        runGameTick(state);
        renderResources();
        renderEmploymentUI();
        renderBuildingsUI();
    }, 1000);
}

function renderBuildingsUI() {
    const container = document.getElementById('buildings-container');
    if (!container) return;

    container.innerHTML = '';

    for (const [buildingKey, buildingInfo] of Object.entries(BUILDINGS_DATA)) {
        const currentCount = state.buildings[buildingKey] || 0;
        const currentCost = calculateBuildingCost(buildingKey, currentCount);

        const card = document.createElement('div');
        card.style.border = '1px solid #444';
        card.style.padding = '10px';
        card.style.borderRadius = '5px';
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';

        let costString = Object.entries(currentCost)
            .map(([res, amount]) => `${Math.round(amount)} ${res}`)
            .join(', ');

        card.innerHTML = `
            <div>
                <strong>${buildingInfo.name}</strong> (Poseídos: ${currentCount})<br>
                <small style="color: #aaa;">Costo: ${costString}</small>
            </div>
        `;

        const btnBuild = document.createElement('button');
        btnBuild.textContent = 'Construir';
        btnBuild.className = 'btn-action';
        btnBuild.addEventListener('click', () => {
            buildStructure(state, buildingKey);
            renderBuildingsUI();
            renderResources();
        });

        card.appendChild(btnBuild);
        container.appendChild(card);
    }
}