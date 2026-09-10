// buildings.js - Definición de infraestructuras y escalado exponencial (1.15^N)

export const BUILDINGS_DATA = {
    shelter: {
        id: "shelter",
        name: "Refugio",
        description: "Aumenta la capacidad máxima de población de la aldea.",
        baseCost: { wood: 15, food: 10 },
        costMultiplier: 1.15,
        housingProvided: 2
    },
    farm: {
        id: "farm",
        name: "Granja",
        description: "Produce alimento de manera constante gracias al trabajo de los obreros.",
        baseCost: { wood: 20 },
        costMultiplier: 1.15,
        production: { food: 1 }
    },
    quarry: {
        id: "quarry",
        name: "Cantera",
        description: "Permite la extracción activa de piedra para construcciones avanzadas.",
        baseCost: { wood: 50, food: 30 },
        costMultiplier: 1.15,
        production: { stone: 0.5 }
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