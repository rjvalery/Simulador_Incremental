// techs.js - módulo centralizado para investigación y desbloqueos

export const TECHS_DATA = Object.freeze({
    writing: {
        id: 'writing',
        era: 'Antigua',
        name: 'Escritura',
        description: 'Introduce la capacidad de registrar transacciones, almacenar saberes y documentar ordenanzas publicas.',
        cost: { science: 25 },
        requires: [],
        unlocks: { buildings: ['library'] }
    },
    leadership: {
        id: 'leadership',
        era: 'Antigua',
        name: 'Liderazgo',
        description: 'Formaliza la autoridad, la cadena de mando y la centralizacion del poder local.',
        cost: { science: 60 },
        requires: ['writing'],
        unlocks: { buildings: ['townHall'] }
    },
    taxation: {
        id: 'taxation',
        era: 'Antigua',
        name: 'Recaudacion',
        description: 'Organiza la recoleccion de tributos y la gestion de la tesoreria local.',
        cost: { science: 80 },
        requires: ['leadership'],
        unlocks: { buildings: ['taxOffice'] }
    },
    laws: {
        id: 'laws',
        era: 'Antigua',
        name: 'Leyes basicas',
        description: 'Sistematiza las reglas de la comunidad, regulando el trabajo y la asignacion social.',
        cost: { science: 100, gold: 25 },
        requires: ['leadership'],
        unlocks: {}
    },
    agriculture: {
        id: 'agriculture',
        era: 'Antigua',
        name: 'Agricultura avanzada',
        description: 'Mejora la produccion de alimentos y formaliza las tecnicas agricolas.',
        cost: { science: 50 },
        requires: [],
        unlocks: { buildings: ['farm'] },
        effects: { productionMultiplier: { food: 1.25 } }
    },
    bronzeWorking: {
        id: 'bronzeWorking',
        era: 'Antigua',
        name: 'Metalurgia del bronce',
        description: 'Permite la extraccion eficiente de minerales e instruye las primeras milicias armadas.',
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

function normalizeValue(value) {
    if (typeof value === 'string') {
        const text = value.trim();
        if (!text) return 0;
        return Number(text.replace(/\./g, '').replace(',', '.')) || 0;
    }
    return Number(value) || 0;
}

export function isTechnologyCompleted(state, techKey) {
    return state.techs?.[techKey] === true ||
        state.techs?.[techKey]?.completed === true ||
        state.unlockedTechs?.[techKey] === true;
}

export function getTechnologyStatus(state, techKey) {
    const tech = TECHS_DATA[techKey];
    if (!tech) {
        return { exists: false, completed: false, researchable: false, missingRequirements: [], missingResources: [] };
    }

    const missingRequirements = tech.requires.filter(requirement => !isTechnologyCompleted(state, requirement));
    const missingResources = Object.entries(tech.cost)
        .filter(([resourceKey, amount]) => normalizeValue(state.resources?.[resourceKey]?.value) < Number(amount))
        .map(([resourceKey, amount]) => ({ resourceKey, amount: Number(amount), current: normalizeValue(state.resources?.[resourceKey]?.value) }));

    const completed = isTechnologyCompleted(state, techKey);
    return {
        exists: true,
        completed,
        missingRequirements,
        missingResources,
        researchable: !completed && missingRequirements.length === 0 && missingResources.length === 0
    };
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
    return getTechnologyStatus(state, techKey).researchable;
}

export function researchTech(state, techKey) {
    const status = getTechnologyStatus(state, techKey);
    if (!status.exists || status.completed || !status.researchable) return false;

    const tech = TECHS_DATA[techKey];
    state.techs = state.techs || {};
    state.unlockedTechs = state.unlockedTechs || {};
    state.military = state.military || { unlockedUnits: [] };

    for (const [resourceKey, amount] of Object.entries(tech.cost)) {
        const resource = state.resources[resourceKey];
        if (!resource) continue;
        resource.value = normalizeValue(resource.value) - Number(amount);
    }

    state.techs[techKey] = { completed: true, researchedAt: Date.now() };
    state.unlockedTechs[techKey] = true;

    for (const buildingKey of tech.unlocks?.buildings || []) {
        if (state.buildings?.[buildingKey]) state.buildings[buildingKey].unlocked = true;
    }

    for (const resourceKey of tech.unlocks?.resources || []) ensureResource(state, resourceKey);

    if (tech.effects?.productionMultiplier) {
        for (const [resourceKey, multiplier] of Object.entries(tech.effects.productionMultiplier)) {
            const resource = state.resources[resourceKey];
            if (resource) resource.productionMultiplier = multiplier;
        }
    }

    for (const unit of tech.unlocks?.units || []) {
        if (!state.military.unlockedUnits.includes(unit)) {
            state.military.unlockedUnits.push(unit);
        }
    }

    return true;
}
