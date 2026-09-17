import { BUILDINGS_DATA } from './buildings.js';
import { ensureGovernance } from './governance.js';
import { isTechnologyCompleted } from './techs.js';

export const state = {
    resources: {
        food: { value: 293.29, max: 300 },
        wood: { value: 174.52, max: 250 },
        stone: { value: 2, max: 200 },
        gold: { value: 0, max: 1000 },
        science: { value: 25, max: 600 }
    },
    population: {
        total: 5,
        max: 5,
        workers: 4,
        scholars: 0
    },
    buildings: {
        shelter: { count: 1 },
        farm: { count: 1, workers: 2 },
        sawmill: { count: 1, workers: 2 },
        warehouse: { count: 1 },
        library: { count: 0, workers: 0 },
        townHall: { count: 0 }
    },
    techs: {},
    unlockedTechs: {}
};

export const gameState = state;

if (typeof window !== 'undefined') {
    window.state = state;
}

const LOCKED_BY_DEFAULT = new Set(['quarry', 'library', 'townHall', 'taxOffice', 'factory', 'oilRefinery']);
const DEFAULT_UNLOCKED_BUILDINGS = new Set(['farm', 'woodcutter', 'shelter']);
const BUILDING_TECH_REQUIREMENTS = {
    quarry: 'bronzeWorking',
    library: 'writing',
    townHall: 'leadership',
    taxOffice: 'taxation',
    factory: 'industrialization',
    oilRefinery: 'mechanizedWarfare'
};
const RESOURCE_DEFAULTS = {
    food: { name: 'Alimentos', max: 200 },
    wood: { name: 'Madera', max: 150 },
    stone: { name: 'Piedra', max: 100 },
    gold: { name: 'Oro', max: 1000 },
    science: { name: 'Ciencia', max: 500 }
};

export function ensureResourceStates(state) {
    state.resources = state.resources || {};

    if (!state.resources.gold && state.resources.money) {
        state.resources.gold = state.resources.money;
        state.resources.gold.name = 'Oro';
        delete state.resources.money;
    }

    for (const [resourceKey, defaults] of Object.entries(RESOURCE_DEFAULTS)) {
        const resource = state.resources[resourceKey] || {};
        const parseValue = value => {
            if (typeof value === 'string') {
                const normalizedText = value.trim();
                const normalizedValue = /^[\d.,]+$/.test(normalizedText) && /[.,]\d{3}$/.test(normalizedText)
                    ? normalizedText.replace(/[.,]/g, '')
                    : normalizedText.replace(',', '.');
                return Number(normalizedValue);
            }
            return Number(value);
        };
        const legacyValue = parseValue(resource.val);
        const currentValue = parseValue(resource.value);

        resource.name = resource.name || defaults.name;
        resource.value = Number.isFinite(currentValue)
            ? currentValue
            : Number.isFinite(legacyValue) ? legacyValue : 0;
        resource.value = Number.isFinite(resource.value) ? resource.value : 0;
        resource.max = Number.isFinite(Number(resource.max)) ? Number(resource.max) : defaults.max;
        state.resources[resourceKey] = resource;
    }

}

export function ensureBuildingStates(state) {
    state.buildings = state.buildings || {};

    for (const buildingKey of Object.keys(BUILDINGS_DATA)) {
        if (!state.buildings[buildingKey]) {
            state.buildings[buildingKey] = {
                count: 0,
                unlocked: !LOCKED_BY_DEFAULT.has(buildingKey)
            };
        }
    }

    for (const [buildingKey, requirement] of Object.entries(BUILDING_TECH_REQUIREMENTS)) {
        state.buildings[buildingKey].unlocked = isTechnologyCompleted(state, requirement);
    }

    for (const buildingKey of DEFAULT_UNLOCKED_BUILDINGS) {
        state.buildings[buildingKey].unlocked = true;
    }
}

export function ensurePopulationStates(state) {
    state.population = state.population || {};
    state.population.total = Number(state.population.total) || 0;
    state.population.max = Number(state.population.max) || 0;
    state.population.workers = Number(state.population.workers) || 0;
    state.population.scholars = Number(state.population.scholars) || 0;
    state.population.unskilled = Number(state.population.unskilled) || 0;
    state.population.technicians = Number(state.population.technicians) || state.population.scholars;
    state.population.professionals = Number(state.population.professionals) || 0;
    state.population.assignments = state.population.assignments || {};
    ensureGovernance(state);
}

// Función auxiliar para calcular la capacidad máxima de vivienda de forma dinámica
export function calculateMaxHousing(state) {
    let totalCapacity = 0;
    for (const [key, building] of Object.entries(state.buildings)) {
        const buildingInfo = BUILDINGS_DATA[key];
        if (buildingInfo?.housingCapacity) {
            totalCapacity += building.count * buildingInfo.housingCapacity;
        }
    }
    return totalCapacity;
}

// Función para obtener la población total actual
export function getTotalPopulation(state) {
    const population = state.population;
    if (Number.isFinite(Number(population.total)) && population.total > 0) {
        return Number(population.total);
    }
    return population.unskilled + population.workers + population.technicians + population.professionals;
}