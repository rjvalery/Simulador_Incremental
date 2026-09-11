// buildings.js - Definición de infraestructuras y escalado exponencial (1.15^N)

export const BUILDINGS_DATA = {
    shelter: {
        id: "shelter",
        name: "Refugio",
        description: "Aumenta la capacidad máxima de población de la aldea.",
        baseCost: { wood: 15, food: 10 },
        costMultiplier: 1.15,
        housingCapacity: 5,
        production: {},
        jobsPerBuilding: 0
    },
    farm: {
        id: "farm",
        name: "Granja",
        description: "Produce alimento de manera constante gracias al trabajo de los obreros.",
        baseCost: { wood: 20 },
        costMultiplier: 1.15,
        production: { food: 1 },
        jobsPerBuilding: 2,
        workerOutput: { food: 1 }
    },
    woodcutter: {
        id: "woodcutter",
        name: "Aserradero",
        description: "Produce madera de manera constante.",
        baseCost: { wood: 20 },
        costMultiplier: 1.15,
        production: { wood: 0.8 },
        jobsPerBuilding: 2,
        workerOutput: { wood: 0.8 }
    },
    quarry: {
        id: "quarry",
        name: "Cantera",
        description: "Extrae piedra para construcciones avanzadas.",
        baseCost: { wood: 50, food: 30 },
        costMultiplier: 1.15,
        production: { stone: 0.5 },
        jobsPerBuilding: 2,
        workerOutput: { stone: 0.5 }
    },
    warehouse: {
        id: "warehouse",
        name: "Almacén",
        description: "Aumenta la capacidad de almacenamiento de los recursos básicos.",
        baseCost: { wood: 75, stone: 25 },
        costMultiplier: 1.15,
        storageCapacity: 100,
        production: {},
        jobsPerBuilding: 0
    },
    library: {
        id: "library",
        name: "Biblioteca",
        description: "Genera conocimiento y puntos de ciencia de forma pasiva.",
        baseCost: { wood: 100, stone: 50 },
        costMultiplier: 1.15,
        production: { science: 0.25 },
        jobsPerBuilding: 1,
        workerType: 'technicians',
        workerOutput: { science: 0.25 }
    },
    townHall: {
        id: "townHall",
        name: "Casa Comunal",
        description: "Desbloquea el liderazgo y las políticas de gobernanza.",
        baseCost: { wood: 150, stone: 100, food: 75 },
        costMultiplier: 1.15,
        maxCount: 1,
        production: {},
        jobsPerBuilding: 1,
        workerType: 'professionals',
        workerOutput: { money: 0.5 }
    },
    factory: {
        id: "factory",
        name: "Fábrica",
        description: "Convierte madera y piedra en producción industrial.",
        baseCost: { wood: 180, stone: 100 },
        costMultiplier: 1.18,
        production: { science: 0.5 },
        jobsPerBuilding: 3,
        workerType: 'technicians',
        workerOutput: { science: 0.5 }
    },
    oilRefinery: {
        id: "oilRefinery",
        name: "Refinería de petróleo",
        description: "Procesa petróleo para sostener la industria moderna.",
        baseCost: { wood: 350, stone: 250, science: 100 },
        costMultiplier: 1.2,
        production: { power: 1 },
        jobsPerBuilding: 3,
        workerType: 'technicians',
        workerOutput: { power: 1 }
    }
};

// Función para calcular el coste exponencial (Costo Base * 1.15^N)
export function calculateBuildingCost(buildingKey, currentCount) {
    const building = BUILDINGS_DATA[buildingKey];
    if (!building) return {};

    const calculatedCost = {};
    for (const [resource, baseAmount] of Object.entries(building.baseCost)) {
        calculatedCost[resource] = Math.floor(baseAmount * Math.pow(building.costMultiplier, currentCount));
    }
    return calculatedCost;
}