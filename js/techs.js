// techs.js - Arbol tecnologico persistente y basado en el estado de la partida

export const TECHS_DATA = Object.freeze({
    writing: {
        id: 'writing',
        era: 'Antigua',
        name: 'Escritura',
        description: 'Registra transacciones, saberes y ordenanzas publicas.',
        cost: { science: 25 },
        requires: [],
        unlocks: { buildings: ['library'] }
    },
    leadership: {
        id: 'leadership',
        era: 'Antigua',
        name: 'Liderazgo',
        description: 'Formaliza la autoridad y la cadena de mando local.',
        cost: { science: 60 },
        requires: ['writing'],
        unlocks: { buildings: ['townHall'] }
    },
    taxation: {
        id: 'taxation',
        era: 'Antigua',
        name: 'Recaudacion',
        description: 'Organiza la recaudacion de tributos y desbloquea la tesoreria.',
        cost: { science: 80 },
        requires: ['leadership'],
        unlocks: { buildings: ['taxOffice'] }
    },
    laws: {
        id: 'laws',
        era: 'Antigua',
        name: 'Leyes basicas',
        description: 'Sistematiza las reglas de trabajo y asignacion social.',
        cost: { science: 100, gold: 25 },
        requires: ['leadership'],
        unlocks: {}
    },
    agriculture: {
        id: 'agriculture',
        era: 'Antigua',
        name: 'Agricultura avanzada',
        description: 'Mejora la produccion de alimentos y formaliza la agricultura.',
        cost: { science: 50 },
        requires: [],
        unlocks: { buildings: ['farm'] },
        effects: { productionMultiplier: { food: 1.25 } }
    },
    bronzeWorking: {
        id: 'bronzeWorking',
        era: 'Antigua',
        name: 'Metalurgia del bronce',
        description: 'Permite extraer piedra y prepara la transicion industrial.',
        cost: { science: 120 },
        requires: ['agriculture'],
        unlocks: { buildings: ['quarry'], units: ['spearman'] }
    },
    industrialization: {
        id: 'industrialization',
        era: 'Industrial',
        name: 'Industrializacion',
        description: 'Desbloquea la fabrica y genera ciencia mediante procesos industriales.',
        cost: { science: 500 },
        requires: ['bronzeWorking'],
        unlocks: { buildings: ['factory'], resources: ['iron'], units: ['infantry'] }
    },
    mechanizedWarfare: {
        id: 'mechanizedWarfare',
        era: 'Moderna',
        name: 'Guerra mecanizada',
        description: 'Desbloquea la refineria y el uso estrategico del petroleo.',
        cost: { science: 1500 },
        requires: ['industrialization'],
        unlocks: { buildings: ['oilRefinery'], resources: ['oil'], units: ['tank', 'mechanizedInfantry'] }
    }
});

function isCompleted(state, techKey) {
    return state.techs?.[techKey] === true ||
        state.techs?.[techKey]?.completed === true ||
        state.unlockedTechs?.[techKey] === true;
}

function resourceValue(state, resourceKey) {
    const rawValue = state.resources?.[resourceKey]?.value;
    if (typeof rawValue === 'string') {
        const normalizedText = rawValue.trim();
        const normalizedValue = /^[\d.,]+$/.test(normalizedText) && /[.,]\d{3}$/.test(normalizedText)
            ? normalizedText.replace(/[.,]/g, '')
            : normalizedText.replace(',', '.');
        return Number(normalizedValue);
    }
    return Number(rawValue);
}

function ensureResource(state, resourceKey) {
    if (!state.resources[resourceKey]) {
        state.resources[resourceKey] = {
            name: resourceKey,
            value: 0,
            max: 500,
            production: 0,
            consumption: 0,
            unlocked: true
        };
    }
    state.resources[resourceKey].unlocked = true;
}

export function canResearch(state, techKey) {
    const tech = TECHS_DATA[techKey];
    if (!tech || isCompleted(state, techKey)) return false;
    if (tech.requires.some(requirement => !isCompleted(state, requirement))) return false;

    return Object.entries(tech.cost).every(([resourceKey, amount]) => {
        return resourceValue(state, resourceKey) >= amount;
    });
}

export function researchTech(state, techKey) {
    if (!canResearch(state, techKey)) return false;

    const tech = TECHS_DATA[techKey];
    state.techs = state.techs || {};
    state.unlockedTechs = state.unlockedTechs || {};
    state.military = state.military || { unlockedUnits: [] };
    for (const [resourceKey, amount] of Object.entries(tech.cost)) {
        state.resources[resourceKey].value -= amount;
    }

    state.techs[techKey] = { completed: true, researchedAt: Date.now() };
    state.unlockedTechs[techKey] = true;

    for (const buildingKey of tech.unlocks?.buildings || []) {
        if (state.buildings[buildingKey]) state.buildings[buildingKey].unlocked = true;
    }
    for (const resourceKey of tech.unlocks?.resources || []) ensureResource(state, resourceKey);

    if (tech.effects?.productionMultiplier) {
        for (const [resourceKey, multiplier] of Object.entries(tech.effects.productionMultiplier)) {
            const resource = state.resources[resourceKey];
            if (resource) resource.productionMultiplier = multiplier;
        }
    }

    state.military.unlockedUnits.push(...(tech.unlocks?.units || []).filter(unit => {
        return !state.military.unlockedUnits.includes(unit);
    }));

    return true;
}
