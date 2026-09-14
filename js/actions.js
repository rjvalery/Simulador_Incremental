// actions.js - Acciones del jugador y gestión de población

import { canAfford, deductCost, refreshResourceCaps } from './resources.js';
import { BUILDINGS_DATA, calculateBuildingCost } from './buildings.js';
import { calculateMaxHousing, ensureBuildingStates, ensurePopulationStates, ensureResourceStates } from './state.js';
import { constructionCostMultiplier, governanceIsAvailable, LEADERS, POLICIES } from './governance.js';
import { getTechnologyStatus, researchTech } from './techs.js';

function addLog(message, type = 'info') {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('log:add', { detail: { message, type } }));
    }
}

export function handleManualHarvest(state) {
    const harvestMultiplier = state.governance?.leader === 'hunter' ? 1.15 : 1;
    const amounts = { food: 5 * harvestMultiplier, wood: 2 * harvestMultiplier, stone: 1 * harvestMultiplier };
    const harvested = {};

    for (const [resourceKey, amount] of Object.entries(amounts)) {
        if (resourceKey !== 'food' && Math.random() >= (resourceKey === 'wood' ? 0.5 : 0.35)) continue;
        const resource = state.resources[resourceKey];
        if (!resource) continue;
        const before = resource.value;
        resource.value = Math.min(resource.max, resource.value + amount);
        harvested[resourceKey] = resource.value - before;
    }

    const summary = Object.entries(harvested)
        .filter(([, amount]) => amount > 0)
        .map(([resource, amount]) => `+${amount} ${resource}`)
        .join(', ');
    addLog(`Recolección manual: ${summary || 'sin espacio disponible'}.`, 'success');
}

export function buildStructure(state, buildingKey) {
    ensureResourceStates(state);
    ensureBuildingStates(state);
    const buildingInfo = BUILDINGS_DATA[buildingKey];
    const building = state.buildings?.[buildingKey];
    if (!buildingInfo || !building || building.unlocked === false) {
        addLog('Esta estructura todavía no está desbloqueada.', 'warning');
        return false;
    }

    const currentCount = Number.isFinite(Number(building.count)) ? Number(building.count) : 0;
    building.count = currentCount;

    if (buildingInfo.maxCount !== undefined && currentCount >= buildingInfo.maxCount) {
        addLog(`${buildingInfo.name} solo puede construirse una vez.`, 'warning');
        return false;
    }

    const baseCost = calculateBuildingCost(buildingKey, currentCount);
    const discount = constructionCostMultiplier(state);
    const cost = Object.fromEntries(Object.entries(baseCost).map(([resource, amount]) => [resource, Math.floor(amount * discount)]));
    if (!canAfford(state, cost)) {
        const missingResources = Object.entries(cost)
            .filter(([resourceKey, amount]) => (state.resources[resourceKey]?.value || 0) < amount)
            .map(([resourceKey]) => resourceKey)
            .join(', ');
        addLog(`No hay recursos suficientes: ${missingResources || 'datos inválidos'}.`, 'warning');
        return false;
    }

    deductCost(state, cost);
    building.count += 1;
    refreshResourceCaps(state);

    if (buildingKey === 'townHall') {
        state.governance = state.governance || { unlocked: false, leader: null, policies: [] };
        state.governance.unlocked = true;
        addLog('La Casa Comunal desbloquea el liderazgo y las políticas de gobernanza.', 'success');
    }

    addLog(`Construiste: ${buildingKey}.`, 'success');
    return true;
}

export function researchTechnology(state, techKey) {
    const status = getTechnologyStatus(state, techKey);
    if (!status.exists) {
        addLog('Tecnología no encontrada.', 'warning');
        return false;
    }
    if (status.completed) {
        addLog('Esta tecnología ya está investigada.', 'info');
        return false;
    }
    if (status.missingRequirements.length > 0) {
        addLog(`Faltan tecnologías: ${status.missingRequirements.join(', ')}.`, 'warning');
        return false;
    }
    if (status.missingResources.length > 0) {
        addLog(`Faltan recursos para investigar ${techKey}.`, 'warning');
        return false;
    }
    const researched = researchTech(state, techKey);
    if (researched) addLog(`Investigacion completada: ${techKey}.`, 'success');
    else addLog(`No se puede investigar ${techKey}: revisa la Ciencia y los prerrequisitos.`, 'warning');
    return researched;
}

export function setLeader(state, leaderKey) {
    if (!governanceIsAvailable(state) || !LEADERS[leaderKey]) return false;
    state.governance.leader = leaderKey;
    addLog(`Lider designado: ${LEADERS[leaderKey].name}.`, 'success');
    return true;
}

export function togglePolicy(state, policyKey) {
    if (!governanceIsAvailable(state) || !POLICIES[policyKey]) return false;
    const policies = state.governance.policies;
    const index = policies.indexOf(policyKey);
    if (index < 0 && !canAfford(state, POLICIES[policyKey].cost || {})) return false;
    if (index < 0) deductCost(state, POLICIES[policyKey].cost || {});
    if (index >= 0) policies.splice(index, 1);
    else policies.push(policyKey);
    addLog(`${index >= 0 ? 'Revocado' : 'Promulgado'}: ${POLICIES[policyKey].name}.`, 'success');
    return true;
}

export function modifyBuildingWorkers(state, buildingKey, amount) {
    ensurePopulationStates(state);
    ensureBuildingStates(state);
    const buildingInfo = BUILDINGS_DATA[buildingKey];
    const building = state.buildings[buildingKey];
    if (!buildingInfo || !building || !building.unlocked || !buildingInfo.jobsPerBuilding) return false;

    const currentAssigned = Number(state.population.assignments[buildingKey]) || 0;
    const capacity = (Number(building.count) || 0) * buildingInfo.jobsPerBuilding;
    const nextAssigned = Math.max(0, Math.min(capacity, currentAssigned + amount));
    const delta = nextAssigned - currentAssigned;
    const workerPool = buildingInfo.workerType || 'workers';
    const assignedPool = Number(state.population[workerPool]) || 0;
    if (delta > 0) {
        if (state.population.unskilled < delta) return false;
        state.population.unskilled -= delta;
        state.population.assignments[buildingKey] = nextAssigned;
        state.population[workerPool] = assignedPool + delta;
        addLog(`Asignaste ${delta} ${workerPool} a ${buildingInfo.name}.`, 'success');
    } else if (delta < 0) {
        state.population.assignments[buildingKey] = nextAssigned;
        state.population.unskilled += -delta;
        state.population[workerPool] = Math.max(0, assignedPool + delta);
        addLog(`Liberaste ${-delta} puesto(s) de ${buildingInfo.name}.`, 'info');
    }
    return delta !== 0;
}

export function modifyWorkerAllocation(state, amount) {
    // Asegurar estructura demográfica con pool de ciudadanos libres (desempleados)
    if (!state.population) state.population = { unskilled: 0, workers: 0, technicians: 0, professionals: 0 };

    const maxPop = calculateMaxHousing(state);
    const currentAssigned = state.population.workers + state.population.technicians;
    const totalPopulation = currentAssigned + (state.population.unskilled || 0);

    // Intentar asignar obreros (requiere ciudadanos libres y respetar el límite de vivienda)
    if (amount > 0) {
        if (state.population.unskilled >= amount && currentAssigned + amount <= maxPop) {
            state.population.unskilled -= amount;
            state.population.workers += amount;
            addLog('Un ciudadano ha comenzado a laborar como obrero.', 'success');
        } else if (totalPopulation < maxPop && state.population.unskilled < amount) {
            addLog('No hay ciudadanos libres suficientes para asignar.', 'warning');
        } else {
            addLog('Límite de población (Refugios) alcanzado.', 'warning');
        }
    }
    // Liberar/Desasignar obrero (convierte el puesto en vacante y libera al ciudadano)
    else if (amount < 0) {
        const absAmount = Math.abs(amount);
        if (state.population.workers >= absAmount) {
            state.population.workers -= absAmount;
            state.population.unskilled = (state.population.unskilled || 0) + absAmount;
            addLog('Un puesto de trabajo ha quedado vacante.', 'info');
        }
    }
}