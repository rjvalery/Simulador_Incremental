// main.js - Punto de entrada principal y bucle del motor corregido

import { ensureBuildingStates, ensurePopulationStates, ensureResourceStates, gameState } from './state.js?v=20260911-5';
import { handleManualHarvest, buildStructure, modifyBuildingWorkers, modifyWorkerAllocation } from './actions.js?v=20260911-5';
import { calculateBuildingCost, BUILDINGS_DATA } from './buildings.js?v=20260911-5';
import { startEngine } from './engine.js?v=20260911-5';
import { renderSidebar, addGameLog } from './ui.js?v=20260911-5';
import { canAfford, refreshResourceCaps } from './resources.js?v=20260911-5';

document.addEventListener('DOMContentLoaded', () => {
    ensureResourceStates(gameState);
    ensureBuildingStates(gameState);
    ensurePopulationStates(gameState);
    setupTabs();
    setupEventListeners();
    renderGame();
    renderEmploymentUI();
    renderBuildingsUI();
    startEngine(gameState, renderGame);
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
            handleManualHarvest(gameState);
            renderGame();
        });
    }

    // Vincular botones de asignación de empleo si existen en la UI
    const btnAssignWorker = document.getElementById('btn-assign-worker');
    if (btnAssignWorker) {
        btnAssignWorker.addEventListener('click', () => {
            modifyWorkerAllocation(gameState, 1);
            renderEmploymentUI();
        });
    }

    const btnUnassignWorker = document.getElementById('btn-unassign-worker');
    if (btnUnassignWorker) {
        btnUnassignWorker.addEventListener('click', () => {
            modifyWorkerAllocation(gameState, -1);
            renderEmploymentUI();
        });
    }

    // Escuchar eventos globales para el Registro Histórico (Game-Log)
    window.addEventListener('log:add', (e) => {
        const { message, type } = e.detail;
        addGameLog(message, type);
    });

    // Botón para vaciar el log
    const btnClearLog = document.getElementById('btn-clear-log');
    if (btnClearLog) {
        btnClearLog.addEventListener('click', () => {
            document.getElementById('game-log').innerHTML = '';
        });
    }
}

function renderEmploymentUI() {
    const workerCountSpan = document.getElementById('worker-count');
    if (workerCountSpan && gameState.population) {
        workerCountSpan.textContent = `Obreros: ${gameState.population.workers} | Libres: ${gameState.population.unskilled || 0}`;
    }
}

let buildingsRenderSignature = '';

function renderGame() {
    refreshResourceCaps(gameState);
    renderSidebar(gameState);
    renderEmploymentUI();
    renderBuildingsUI();
}

function renderBuildingsUI() {
    const container = document.getElementById('buildings-container');
    if (!container) return;

    const buildingEntries = Object.entries(BUILDINGS_DATA)
        .filter(([buildingKey]) => gameState.buildings[buildingKey]?.unlocked !== false)
        .map(([buildingKey, buildingInfo]) => {
            const currentCount = gameState.buildings[buildingKey]?.count || 0;
            const currentCost = calculateBuildingCost(buildingKey, currentCount);
            const atLimit = buildingInfo.maxCount !== undefined && currentCount >= buildingInfo.maxCount;
            const affordable = canAfford(gameState, currentCost);
            return { buildingKey, buildingInfo, currentCount, currentCost, atLimit, affordable };
        });

    const renderSignature = buildingEntries
        .map(({ buildingKey, currentCount, atLimit, affordable }) => `${buildingKey}:${currentCount}:${gameState.population.assignments?.[buildingKey] || 0}:${atLimit}:${affordable}`)
        .join('|');
    if (renderSignature === buildingsRenderSignature) return;
    buildingsRenderSignature = renderSignature;

    container.innerHTML = '';

    for (const { buildingKey, buildingInfo, currentCount, currentCost, atLimit, affordable } of buildingEntries) {

        const card = document.createElement('div');
        card.style.border = '1px solid #444';
        card.style.padding = '10px';
        card.style.borderRadius = '5px';
        card.style.display = 'flex';
        card.style.justifyContent = 'space-between';
        card.style.alignItems = 'center';

        let costString = Object.entries(currentCost)
            .map(([res, amount]) => `${Math.round(amount)} ${gameState.resources[res]?.name || res}`)
            .join(', ');

        const jobCapacity = (buildingInfo.jobsPerBuilding || 0) * currentCount;
        const assignedWorkers = gameState.population.assignments?.[buildingKey] || 0;
        const productionString = Object.entries(buildingInfo.workerOutput || {})
            .map(([resource, rate]) => `+${(rate * assignedWorkers).toFixed(2)}/s ${gameState.resources[resource]?.name || resource}`)
            .join(', ');
        const employmentString = jobCapacity
            ? `<br><small class="employment-line">Puestos: ${assignedWorkers}/${jobCapacity} obreros</small>`
            : '';
        const limitString = buildingInfo.maxCount ? ` | Máximo: ${buildingInfo.maxCount}` : '';

        card.innerHTML = `
            <div>
                <strong>${buildingInfo.name}</strong> (Poseídos: ${currentCount}${limitString})<br>
                <small style="color: #aaa;">${buildingInfo.description}</small><br>
                <small style="color: #aaa;">Costo: ${costString}</small>
                ${productionString ? `<br><small style="color: #81c784;">Producción: ${productionString}</small>` : ''}
                ${employmentString}
            </div>
        `;

        const btnBuild = document.createElement('button');
        btnBuild.textContent = atLimit ? 'Construido' : affordable ? 'Construir' : 'Faltan materiales';
        btnBuild.className = 'btn-action';
        btnBuild.disabled = atLimit;
        if (!affordable && !atLimit) btnBuild.classList.add('btn-unaffordable');
        btnBuild.title = atLimit ? 'Límite de construcción alcanzado' : affordable ? 'Construir edificio' : 'No tienes todos los materiales necesarios';
        btnBuild.addEventListener('click', () => {
            buildStructure(gameState, buildingKey);
            renderBuildingsUI();
            renderGame();
        });

        card.appendChild(btnBuild);
        if (jobCapacity > 0) {
            const employmentControls = document.createElement('div');
            employmentControls.className = 'employment-controls';
            const decreaseWorker = document.createElement('button');
            decreaseWorker.type = 'button';
            decreaseWorker.textContent = '-';
            decreaseWorker.title = 'Liberar un obrero';
            decreaseWorker.disabled = assignedWorkers === 0;
            decreaseWorker.addEventListener('click', () => {
                modifyBuildingWorkers(gameState, buildingKey, -1);
                renderBuildingsUI();
                renderGame();
            });
            const increaseWorker = document.createElement('button');
            increaseWorker.type = 'button';
            increaseWorker.textContent = '+';
            increaseWorker.title = 'Asignar un obrero desocupado';
            increaseWorker.disabled = assignedWorkers >= jobCapacity || gameState.population.unskilled === 0;
            increaseWorker.addEventListener('click', () => {
                modifyBuildingWorkers(gameState, buildingKey, 1);
                renderBuildingsUI();
                renderGame();
            });
            employmentControls.append(decreaseWorker, increaseWorker);
            card.appendChild(employmentControls);
        }
        container.appendChild(card);
    }
}