// techs.js - Árbol Tecnológico Unificado por Eras (Aldea y Evolución Militar)

export const TECHS_DATA = {
    // --- ERA ANTIGUA ---
    agriculture: {
        id: "agriculture",
        era: "Antigua",
        name: "Agricultura Avanzada",
        description: "Optimiza los cultivos y desbloquea el crecimiento básico de la aldea.",
        cost: { science: 50 },
        requires: [],
        completed: false,
        unlocks: { buildings: ["farm"], units: [] },
        effect: (state) => {
            state.resources.food.productionMultiplier = (state.resources.food.productionMultiplier || 1) + 0.25;
        }
    },
    bronzeWorking: {
        id: "bronzeWorking",
        era: "Antigua",
        name: "Metalurgia del Bronce",
        description: "Permite el uso de herramientas de metal y el reclutamiento de milicias armadas.",
        cost: { science: 120 },
        requires: ["agriculture"],
        completed: false,
        unlocks: { buildings: ["quarry"], units: ["spearman"] },
        effect: (state) => {
            if (state.resources.stone) state.resources.stone.unlocked = true;
        }
    },

    // --- ERA INDUSTRIAL ---
    industrialization: {
        id: "industrialization",
        era: "Industrial",
        name: "Industrialización",
        description: "Mecanización de procesos productivos y refinerías de acero para la guerra moderna.",
        cost: { science: 500 },
        requires: ["bronzeWorking"],
        completed: false,
        unlocks: { buildings: ["factory"], units: ["infantry"] },
        effect: (state) => {
            state.resources.iron = { value: 0, max: 500, production: 0, unlocked: true };
        }
    },

    // --- ERA MODERNA ---
    mechanizedWarfare: {
        id: "mechanizedWarfare",
        era: "Moderna",
        name: "Guerra Mecanizada",
        description: "Tecnología de motores de combustión pesados para la fabricación de tanques y vehículos blindados.",
        cost: { science: 1500 },
        requires: ["industrialization"],
        completed: false,
        unlocks: { buildings: ["oilRefinery"], units: ["tank", "mechanizedInfantry"] },
        effect: (state) => {
            state.resources.oil = { value: 0, max: 1000, production: 0, unlocked: true };
        }
    }
};

// Validación centralizada de requisitos y costes científicos
export function canResearch(state, techKey) {
    const tech = TECHS_DATA[techKey];
    if (!tech || tech.completed) return false;

    for (const reqId of tech.requires) {
        if (!TECHS_DATA[reqId] || !TECHS_DATA[reqId].completed) return false;
    }

    for (const [resKey, amount] of Object.entries(tech.cost)) {
        if (!state.resources[resKey] || state.resources[resKey].value < amount) return false;
    }

    return true;
}

// Ejecución de la investigación y aplicación automática de desbloqueos
export function researchTech(state, techKey) {
    if (!canResearch(state, techKey)) return false;

    const tech = TECHS_DATA[techKey];

    for (const [resKey, amount] of Object.entries(tech.cost)) {
        state.resources[resKey].value -= amount;
    }

    tech.completed = true;
    
    if (typeof tech.effect === "function") {
        tech.effect(state);
    }

    state.unlockedTechs = state.unlockedTechs || {};
    state.unlockedTechs[techKey] = true;

    state.military = state.military || { unlockedUnits: [] };
    if (tech.unlocks && tech.unlocks.units) {
        tech.unlocks.units.forEach(unit => {
            if (!state.military.unlockedUnits.includes(unit)) {
                state.military.unlockedUnits.push(unit);
            }
        });
    }

    return true;
}