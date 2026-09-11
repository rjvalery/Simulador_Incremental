// actions.js - Acciones del jugador y gestión de población

import { canAfford, deductCost } from './resources.js';
import { calculateBuildingCost } from './buildings.js';

function addLog(message, type = 'info') {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('log:add', { detail: { message, type } }));
    }
}

export function handleManualHarvest(state) {
    const amounts = { food: 5, wood: 2, stone: 1 };
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
    const building = state.buildings[buildingKey];
    if (!building) return false;

    const cost = calculateBuildingCost(buildingKey, building.count);
    if (!canAfford(state, cost)) {
        addLog('No hay recursos suficientes para construir esta estructura.', 'warning');
        return false;
    }

    deductCost(state, cost);
    building.count += 1;
    addLog(`Construiste: ${buildingKey}.`, 'success');
    return true;
}

export function modifyWorkerAllocation(state, amount) {
    // Asegurar estructura demográfica con pool de ciudadanos libres (desempleados)
    if (!state.population) state.population = { unskilled: 0, workers: 0, technicians: 0, professionals: 0 };

    const maxPop = Object.values(state.buildings)
        .reduce((capacity, building) => capacity + (building.count * (building.housingCapacity || 0)), 0);
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