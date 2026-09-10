// state.js - Estado Global del Simulador Incremental
export const gameState = {
    resources: {
        food: { value: 50, max: 200, production: 0, consumption: 0 },
        wood: { value: 30, max: 150, production: 0, consumption: 0 },
        stone: { value: 10, max: 100, production: 0, consumption: 0 },
        money: { value: 0, max: 1000, production: 0, consumption: 0 },
        science: { value: 0, max: 500, production: 0, consumption: 0 }
    },
    population: {
        unskilled: 2,     // Población libre / desempleada disponible
        workers: 0,       // Asignados a producción primaria
        technicians: 0,   // Asignados a ciencia / industria avanzada
        professionals: 0  // Profesionales / administración
    },
    buildings: {
        shelter: { count: 1, baseCost: { wood: 15 }, costMultiplier: 1.15, housingCapacity: 5 },
        farm: { count: 0, baseCost: { wood: 10, food: 5 }, costMultiplier: 1.15 },
        woodcutter: { count: 0, baseCost: { wood: 20 }, costMultiplier: 1.15 },
        quarry: { count: 0, baseCost: { wood: 50, stone: 20 }, costMultiplier: 1.15 }
    },
    techs: {},
    settings: {
        gameSpeed: 1
    }
};

// Función auxiliar para calcular la capacidad máxima de vivienda de forma dinámica
export function calculateMaxHousing(state) {
    let totalCapacity = 0;
    for (const [key, building] of Object.entries(state.buildings)) {
        if (building.housingCapacity) {
            totalCapacity += building.count * building.housingCapacity;
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