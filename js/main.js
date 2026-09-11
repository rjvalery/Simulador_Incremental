// main.js - Punto de entrada principal y bucle del motor corregido

import { ensureBuildingStates, gameState } from './state.js';
import { handleManualHarvest, buildStructure, modifyWorkerAllocation } from './actions.js';
import { calculateBuildingCost, BUILDINGS_DATA } from './buildings.js';
import { startEngine } from './engine.js';
import { renderSidebar, addGameLog } from './ui.js';
import { refreshResourceCaps } from './resources.js';

document.addEventListener('DOMContentLoaded', () => {
    ensureBuildingStates(gameState);
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

function renderGame() {
    refreshResourceCaps(gameState);
    renderSidebar(gameState);
    renderEmploymentUI();
    renderBuildingsUI();
}

function renderBuildingsUI() {
    const container = document.getElementById('buildings-container');
    if (!container) return;

    container.innerHTML = '';

    for (const [buildingKey, buildingInfo] of Object.entries(BUILDINGS_DATA)) {
        if (gameState.buildings[buildingKey]?.unlocked === false) continue;
        const currentCount = gameState.buildings[buildingKey]?.count || 0;
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

        const productionString = Object.entries(buildingInfo.production || {})
            .map(([resource, rate]) => `+${rate}/s ${resource}`)
            .join(', ');
        const limitString = buildingInfo.maxCount ? ` | Máximo: ${buildingInfo.maxCount}` : '';

        card.innerHTML = `
            <div>
                <strong>${buildingInfo.name}</strong> (Poseídos: ${currentCount}${limitString})<br>
                <small style="color: #aaa;">${buildingInfo.description}</small><br>
                <small style="color: #aaa;">Costo: ${costString}</small>
                ${productionString ? `<br><small style="color: #81c784;">Producción: ${productionString}</small>` : ''}
            </div>
        `;

        const btnBuild = document.createElement('button');
        const atLimit = buildingInfo.maxCount !== undefined && currentCount >= buildingInfo.maxCount;
        btnBuild.textContent = atLimit ? 'Construido' : 'Construir';
        btnBuild.className = 'btn-action';
        btnBuild.disabled = atLimit;
        btnBuild.addEventListener('click', () => {
            buildStructure(gameState, buildingKey);
            renderBuildingsUI();
            renderGame();
        });

        card.appendChild(btnBuild);
        container.appendChild(card);
    }
}