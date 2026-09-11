// state.js - Estado Global del Simulador Incremental
import { BUILDINGS_DATA } from './buildings.js';

export const gameState = {
    resources: {
        food: { name: "Alimentos", value: 50, max: 200, baseMax: 200, production: 0, consumption: 0 },
        wood: { name: "Madera", value: 30, max: 150, baseMax: 150, production: 0, consumption: 0 },
        stone: { name: "Piedra", value: 10, max: 100, baseMax: 100, production: 0, consumption: 0 },
        money: { name: "Monedas", value: 0, max: 1000, baseMax: 1000, production: 0, consumption: 0 },
        science: { name: "Ciencia", value: 0, max: 500, baseMax: 500, production: 0, consumption: 0 }
    },
    population: {
        unskilled: 2,     // Población libre / desempleada disponible
        workers: 0,       // Asignados a producción primaria
        technicians: 0,   // Asignados a ciencia / industria avanzada
        professionals: 0  // Profesionales / administración
    },
    buildings: {
        shelter: { count: 1, unlocked: true },
        farm: { count: 0, unlocked: true },
        woodcutter: { count: 0, unlocked: true },
        quarry: { count: 0, unlocked: true },
        warehouse: { count: 0, unlocked: true },
        library: { count: 0, unlocked: true },
        townHall: { count: 0, unlocked: true },
        factory: { count: 0, unlocked: false },
        oilRefinery: { count: 0, unlocked: false }
    },
    techs: {},
    unlockedTechs: {},
    military: { unlockedUnits: [] },
    governance: {
        unlocked: false,
        leader: null,
        policies: []
    },
    settings: {
        gameSpeed: 1
    }
};

const LOCKED_BY_DEFAULT = new Set(['factory', 'oilRefinery']);

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
    return state.population.unskilled +
           state.population.workers +
           state.population.technicians +
           state.population.professionals;
}