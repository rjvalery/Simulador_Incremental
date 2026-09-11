// engine.js - Motor unico de produccion y crecimiento demografico

import { calculateMaxHousing, ensurePopulationStates, getTotalPopulation } from './state.js?v=20260911-5';
import { BUILDINGS_DATA } from './buildings.js?v=20260911-5';
import { refreshResourceCaps } from './resources.js?v=20260911-5';

let migrationTimer = 0;

function emitLog(message, type = 'info') {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('log:add', { detail: { message, type } }));
    }
}

function addResource(resource, amount) {
    if (!resource || amount <= 0) return 0;
    const previousValue = resource.value;
    resource.value = Math.min(resource.max, resource.value + amount);
    return resource.value - previousValue;
}

export function runGameTick(state, deltaTime = 1) {
    ensurePopulationStates(state);
    refreshResourceCaps(state);
    for (const resource of Object.values(state.resources)) resource.production = 0;

    for (const [buildingKey, buildingState] of Object.entries(state.buildings)) {
        const buildingInfo = BUILDINGS_DATA[buildingKey];
        const count = buildingState.count || 0;
        const assigned = Math.min(
            Number(state.population.assignments[buildingKey]) || 0,
            count * (buildingInfo?.jobsPerBuilding || 0)
        );
        if (!buildingInfo || !buildingState.unlocked || assigned <= 0) continue;

        for (const [resourceKey, baseRate] of Object.entries(buildingInfo.workerOutput || {})) {
            const resource = state.resources[resourceKey];
            const multiplier = resource?.productionMultiplier || 1;
            const rate = baseRate * assigned * multiplier;
            if (!resource) continue;
            resource.production += rate;
            addResource(resource, rate * deltaTime);
        }
    }

    const employedWorkers = Object.values(state.population.assignments)
        .reduce((total, assigned) => total + (Number(assigned) || 0), 0);
    const treasury = state.resources.money;
    if (treasury) {
        const taxRate = 0.1;
        const rate = employedWorkers * taxRate;
        treasury.production = rate;
        addResource(treasury, rate * deltaTime);
    }

    migrationTimer += deltaTime;
    if (migrationTimer >= 5) {
        migrationTimer -= 5;
        const totalPopulation = getTotalPopulation(state);
        if (totalPopulation < calculateMaxHousing(state) && state.resources.food.value >= 10) {
            state.population.unskilled += 1;
            emitLog('Un nuevo habitante ha migrado al asentamiento.', 'info');
        }
    }
}

export function startEngine(state, onTick) {
    let lastTick = performance.now();

    function frame(timestamp) {
        const deltaTime = Math.min((timestamp - lastTick) / 1000, 1);
        lastTick = timestamp;
        runGameTick(state, deltaTime);
        onTick?.();
        requestAnimationFrame(frame);
    }

    requestAnimationFrame(frame);
}