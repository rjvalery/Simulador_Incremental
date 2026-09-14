// main.js - Punto de entrada principal y bucle del motor corregido

import { ensureBuildingStates, ensurePopulationStates, ensureResourceStates, gameState } from './state.js?v=20260914-7';
import { handleManualHarvest, buildStructure, modifyBuildingWorkers, modifyWorkerAllocation } from './actions.js?v=20260914-7';
import { calculateBuildingCost, BUILDINGS_DATA } from './buildings.js?v=20260914-7';
import { startEngine } from './engine.js?v=20260914-7';
import { renderSidebar, addGameLog } from './ui.js?v=20260914-7';
import { canAfford, refreshResourceCaps } from './resources.js?v=20260914-7';
import { getTechnologyStatus, TECHS_DATA } from './techs.js?v=20260914-10';
import { LEADERS, POLICIES, constructionCostMultiplier, governanceIsAvailable } from './governance.js';
import { researchTechnology, setLeader, togglePolicy } from './actions.js?v=20260914-7';
import { Storage } from './storage.js';

document.addEventListener('DOMContentLoaded', () => {
    Storage.load();
    ensureResourceStates(gameState);
    ensureBuildingStates(gameState);
    ensurePopulationStates(gameState);
    setupTabs();
    setupEventListeners();
    renderGame();
    renderEmploymentUI();
    renderBuildingsUI();
    renderTechnologyAndGovernmentUI();
    setupAutosave();
    startEngine(gameState, renderGame);
});

function persistGame() {
    Storage.save({ notify: false });
}

function setupAutosave() {
    const saveGame = () => Storage.save({ notify: false });

    // El intervalo limita las escrituras y los eventos cubren cierres o recargas inmediatas.
    window.setInterval(saveGame, 5000);
    window.addEventListener('pagehide', saveGame);
    window.addEventListener('beforeunload', saveGame);
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') saveGame();
    });
}

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
            persistGame();
            renderGame();
        });
    }

    // Vincular botones de asignación de empleo si existen en la UI
    const btnAssignWorker = document.getElementById('btn-assign-worker');
    if (btnAssignWorker) {
        btnAssignWorker.addEventListener('click', () => {
            modifyWorkerAllocation(gameState, 1);
            persistGame();
            renderEmploymentUI();
        });
    }

    const btnUnassignWorker = document.getElementById('btn-unassign-worker');
    if (btnUnassignWorker) {
        btnUnassignWorker.addEventListener('click', () => {
            modifyWorkerAllocation(gameState, -1);
            persistGame();
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

function renderTechnologyAndGovernmentUI() {
    const techPanel = document.getElementById('technology-panel');
    const governmentPanel = document.getElementById('governance-panel');
    const governmentTab = document.getElementById('government-tab');
    if (!techPanel || !governmentPanel || !governmentTab) return;

    const hasTownHall = (gameState.buildings.townHall?.count || 0) > 0;
    governmentTab.style.display = '';
    techPanel.innerHTML = '<h4>Árbol de investigación</h4>';
    for (const [techKey, tech] of Object.entries(TECHS_DATA)) {
        const status = getTechnologyStatus(gameState, techKey);
        const row = document.createElement('div');
        row.className = 'tech-row';
        const cost = Object.entries(tech.cost).map(([resource, amount]) => `${amount} ${gameState.resources[resource]?.name || resource}`).join(', ');
        row.innerHTML = `<div><strong>${tech.name}</strong><br><small>${tech.description}</small><br><small>Costo: ${cost}${tech.requires.length ? ` | Requiere: ${tech.requires.join(', ')}` : ''}</small></div>`;
        const button = document.createElement('button');
        button.className = 'btn-action';
        const requirementNames = status.missingRequirements.join(', ');
        const resourceNames = status.missingResources.map(({ resourceKey, amount, current }) =>
            `${amount} ${gameState.resources?.[resourceKey]?.name || resourceKey} (tienes ${Math.floor(current)})`).join(', ');
        button.textContent = status.completed ? 'Completada' : status.researchable ? 'Investigar' : 'Revisar requisitos';
        button.title = status.completed ? 'Tecnología ya investigada' :
            requirementNames ? `Requiere: ${requirementNames}` : `Necesitas: ${resourceNames}`;
        button.disabled = status.completed;
        button.dataset.techKey = techKey;
        button.addEventListener('click', () => {
            researchTechnology(gameState, techKey);
            persistGame();
            renderGame();
        });
        row.appendChild(button);
        techPanel.appendChild(row);
    }

    if (!hasTownHall) {
        governmentPanel.innerHTML = '<p class="muted-label">Construye una Casa Comunal para activar la gobernanza.</p>';
        return;
    }
    if (!governanceIsAvailable(gameState)) {
        governmentPanel.innerHTML = '<p class="muted-label">Investiga Leyes basicas para activar las leyes y decretos.</p>';
        return;
    }

    governmentPanel.innerHTML = '<h4>Lider del asentamiento</h4>';
    for (const [leaderKey, leader] of Object.entries(LEADERS)) {
        const button = document.createElement('button');
        button.className = 'btn-action';
        button.textContent = `${leader.name}${gameState.governance.leader === leaderKey ? ' (activo)' : ''}`;
        button.title = leader.description;
        button.addEventListener('click', () => { setLeader(gameState, leaderKey); persistGame(); renderGame(); });
        governmentPanel.appendChild(button);
    }
    governmentPanel.insertAdjacentHTML('beforeend', '<h4 style="margin-top: 14px;">Decretos y politicas</h4>');
    for (const [policyKey, policy] of Object.entries(POLICIES)) {
        const button = document.createElement('button');
        button.className = 'btn-action';
        button.textContent = `${policy.name}${gameState.governance.policies.includes(policyKey) ? ' (activo)' : ''}`;
        button.title = policy.description;
        button.addEventListener('click', () => { togglePolicy(gameState, policyKey); persistGame(); renderGame(); });
        governmentPanel.appendChild(button);
    }
}

function renderEmploymentUI() {
    const workerCountSpan = document.getElementById('worker-count');
    if (workerCountSpan && gameState.population) {
        workerCountSpan.textContent = `Obreros: ${gameState.population.workers} | Libres: ${gameState.population.unskilled || 0}`;
    }

    const panel = document.getElementById('employment-panel');
    if (!panel) return;

    const jobEntries = Object.entries(BUILDINGS_DATA)
        .filter(([buildingKey, buildingInfo]) => {
            return gameState.buildings[buildingKey]?.unlocked !== false &&
                (buildingInfo.jobsPerBuilding || 0) > 0 &&
                (gameState.buildings[buildingKey]?.count || 0) > 0;
        })
        .map(([buildingKey, buildingInfo]) => {
            const buildingCount = gameState.buildings[buildingKey].count || 0;
            const capacity = buildingCount * buildingInfo.jobsPerBuilding;
            const assigned = gameState.population.assignments?.[buildingKey] || 0;
            const workerLabel = buildingInfo.workerType === 'technicians'
                ? 'tecnicos'
                : buildingInfo.workerType === 'workers'
                ? 'recaudadores'
                : 'obreros';
            return { buildingKey, buildingInfo, capacity, assigned, workerLabel };
        });

    const signature = jobEntries
        .map(({ buildingKey, capacity, assigned, buildingInfo }) => {
            const availableWorkers = gameState.population[buildingInfo.workerType || 'workers'] || 0;
            return `${buildingKey}:${capacity}:${assigned}:${availableWorkers}:${gameState.population.unskilled || 0}`;
        })
        .join('|');
    if (panel.dataset.signature === signature) return;
    panel.dataset.signature = signature;

    panel.innerHTML = '<p class="employment-summary">Asigna obreros desocupados a los puestos disponibles.</p>';
    if (jobEntries.length === 0) {
        panel.insertAdjacentHTML('beforeend', '<p class="muted-label">Construye un campo productivo para habilitar puestos.</p>');
        return;
    }

    const jobsList = document.createElement('div');
    jobsList.className = 'jobs-list';
    for (const { buildingKey, buildingInfo, capacity, assigned, workerLabel } of jobEntries) {
        const job = document.createElement('div');
        job.className = 'job-row';
        job.innerHTML = `
            <span><strong>${buildingInfo.name}</strong><small>${assigned}/${capacity} ${workerLabel} asignados</small></span>
            <span class="job-controls"></span>
        `;

        const controls = job.querySelector('.job-controls');
        const decrease = document.createElement('button');
        decrease.type = 'button';
        decrease.textContent = '-';
        decrease.disabled = assigned === 0;
        decrease.title = 'Liberar obrero';
        decrease.addEventListener('click', () => {
            modifyBuildingWorkers(gameState, buildingKey, -1);
            persistGame();
            renderEmploymentUI();
            renderGame();
        });
        const increase = document.createElement('button');
        increase.type = 'button';
        increase.textContent = '+';
        increase.disabled = assigned >= capacity || gameState.population.unskilled === 0;
        increase.title = 'Asignar obrero desocupado';
        increase.addEventListener('click', () => {
            modifyBuildingWorkers(gameState, buildingKey, 1);
            persistGame();
            renderEmploymentUI();
            renderGame();
        });
        controls.append(decrease, increase);
        jobsList.appendChild(job);
    }
    panel.appendChild(jobsList);
}

let buildingsRenderSignature = '';

function renderGame() {
    refreshResourceCaps(gameState);
    renderSidebar(gameState);
    renderEmploymentUI();
    renderBuildingsUI();
    renderTechnologyAndGovernmentUI();
}

function renderBuildingsUI() {
    const container = document.getElementById('buildings-container');
    if (!container) return;

    const buildingEntries = Object.entries(BUILDINGS_DATA)
        .filter(([buildingKey]) => gameState.buildings[buildingKey]?.unlocked !== false || ['library', 'townHall'].includes(buildingKey))
        .map(([buildingKey, buildingInfo]) => {
            const currentCount = gameState.buildings[buildingKey]?.count || 0;
            const unlocked = gameState.buildings[buildingKey]?.unlocked !== false;
            const baseCost = calculateBuildingCost(buildingKey, currentCount);
            const currentCost = Object.fromEntries(Object.entries(baseCost).map(([resource, amount]) => [resource, Math.floor(amount * constructionCostMultiplier(gameState))]));
            const atLimit = buildingInfo.maxCount !== undefined && currentCount >= buildingInfo.maxCount;
            const affordable = canAfford(gameState, currentCost);
            return { buildingKey, buildingInfo, currentCount, currentCost, atLimit, affordable, unlocked };
        });

    const renderSignature = buildingEntries
        .map(({ buildingKey, currentCount, atLimit, affordable, unlocked }) => `${buildingKey}:${currentCount}:${gameState.population.assignments?.[buildingKey] || 0}:${atLimit}:${affordable}:${unlocked}`)
        .join('|');
    if (renderSignature === buildingsRenderSignature) return;
    buildingsRenderSignature = renderSignature;

    container.innerHTML = '';

    for (const { buildingKey, buildingInfo, currentCount, currentCost, atLimit, affordable, unlocked } of buildingEntries) {

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
        const requiredTech = buildingKey === 'taxOffice' ? 'taxation' : null;
        btnBuild.textContent = !unlocked ? `Investiga ${requiredTech}` : atLimit ? 'Construido' : affordable ? 'Construir' : 'Faltan materiales';
        btnBuild.className = 'btn-action';
        btnBuild.disabled = !unlocked || atLimit;
        if ((!affordable && !atLimit) || !unlocked) btnBuild.classList.add('btn-unaffordable');
        btnBuild.title = !unlocked ? `Requiere la tecnología ${requiredTech}` : atLimit ? 'Límite de construcción alcanzado' : affordable ? 'Construir edificio' : 'No tienes todos los materiales necesarios';
        btnBuild.addEventListener('click', () => {
            buildStructure(gameState, buildingKey);
            persistGame();
            renderBuildingsUI();
            renderGame();
        });

        card.appendChild(btnBuild);
        container.appendChild(card);
    }
}