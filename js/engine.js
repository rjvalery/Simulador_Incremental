// engine.js - Motor unico de produccion y crecimiento demografico

import { calculateMaxHousing, ensurePopulationStates, getTotalPopulation } from './state.js';
import { BUILDINGS_DATA } from './buildings.js';
import { refreshResourceCaps } from './resources.js';
import { foodConsumptionMultiplier, productionMultiplier } from './governance.js';
import { isTechnologyCompleted } from './techs.js';

let migrationTimer = 0;
const FOOD_CONSUMPTION_PER_PERSON = 0.1;

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
    const totalPopulation = getTotalPopulation(state);
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
            const workerOutputBonus = 1 + (buildingInfo.workerOutputBonus || 0) * count;
            const populationFactor = buildingKey === 'taxOffice' ? totalPopulation : 1;
            const rate = baseRate * assigned * workerOutputBonus * populationFactor * multiplier * productionMultiplier(state, resourceKey, resourceKey === 'science');
            if (!resource) continue;
            resource.production += rate;
            addResource(resource, rate * deltaTime);
        }
    }

    const taxablePopulation = (state.population.unskilled || 0) + (state.population.workers || 0);
    if (taxablePopulation > 0 && state.resources.gold && isTaxationActive(state)) {
        const rate = 0.05 * taxablePopulation;
        state.resources.gold.production += rate;
        addResource(state.resources.gold, rate * deltaTime);
    }

    const food = state.resources.food;
    if (food) {
        food.consumption = totalPopulation * FOOD_CONSUMPTION_PER_PERSON * foodConsumptionMultiplier(state);
        food.value -= food.consumption * deltaTime;
    }

    migrationTimer += deltaTime;
    if (migrationTimer >= 5) {
        migrationTimer -= 5;
        if (totalPopulation < calculateMaxHousing(state) && state.resources.food.value >= 10) {
            state.population.unskilled += 1;
            emitLog('Un nuevo habitante ha migrado al asentamiento.', 'info');
        }
    }
}

function isTaxationActive(state) {
    return isTechnologyCompleted(state, 'taxation') &&
        state.governance?.policies?.includes('capitationTax');
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