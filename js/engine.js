// engine.js - Motor unico de produccion y crecimiento demografico

import { calculateMaxHousing, getTotalPopulation } from './state.js';
import { BUILDINGS_DATA } from './buildings.js';

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
    for (const resource of Object.values(state.resources)) resource.production = 0;

    for (const [buildingKey, buildingState] of Object.entries(state.buildings)) {
        const buildingInfo = BUILDINGS_DATA[buildingKey];
        const count = buildingState.count || 0;
        if (!buildingInfo || !buildingState.unlocked || count <= 0) continue;

        for (const [resourceKey, baseRate] of Object.entries(buildingInfo.production || {})) {
            const resource = state.resources[resourceKey];
            const multiplier = resource?.productionMultiplier || 1;
            const rate = baseRate * count * multiplier;
            if (!resource) continue;
            resource.production += rate;
            addResource(resource, rate * deltaTime);
        }
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