export const TECHS_DATA = {
    writing: {
        id: 'writing',
        name: 'Escritura',
        cost: { food: 50 },
        requires: [],
        description: 'Permite el registro de conocimientos y habilita la construcción de Bibliotecas.'
    },
    leadership: {
        id: 'leadership',
        name: 'Liderazgo',
        cost: { science: 50 },
        requires: ['writing'],
        description: 'Habilita la Casa Comunal y la gestión centralizada de la aldea.'
    },
    laws: {
        id: 'laws',
        name: 'Leyes Básicas',
        cost: { science: 100 },
        requires: ['leadership'],
        description: 'Permite la promulgación de decretos y políticas sociales.'
    }
};

function getCurrentState(gameState) {
    return gameState || (typeof window !== 'undefined' ? window.state : undefined);
}

export function isTechnologyCompleted(gameState, techId) {
    const currentState = getCurrentState(gameState);
    return Boolean(currentState?.techs?.[techId]?.completed || currentState?.unlockedTechs?.[techId]);
}

export function canResearch(gameState, techId) {
    const currentState = getCurrentState(gameState);
    const tech = TECHS_DATA[techId];
    if (!tech || isTechnologyCompleted(currentState, techId)) return false;

    const hasPrereqs = tech.requires.every(reqId => isTechnologyCompleted(currentState, reqId));
    if (!hasPrereqs) return false;

    for (const [resourceKey, requiredAmount] of Object.entries(tech.cost)) {
        const resource = currentState?.resources?.[resourceKey];
        const currentValue = resource?.value ?? resource ?? 0;
        if (currentValue < requiredAmount) return false;
    }

    return true;
}

export function getTechnologyStatus(gameState, techId) {
    const currentState = getCurrentState(gameState);
    const tech = TECHS_DATA[techId];
    if (!tech) {
        return { exists: false, completed: false, researchable: false, missingRequirements: [], missingResources: [] };
    }

    const missingRequirements = tech.requires.filter(requirement => !isTechnologyCompleted(currentState, requirement));
    const missingResources = Object.entries(tech.cost)
        .map(([resourceKey, requiredAmount]) => {
            const resource = currentState?.resources?.[resourceKey];
            const currentValue = resource?.value ?? resource ?? 0;
            return currentValue < requiredAmount
                ? { resourceKey, amount: requiredAmount, current: currentValue }
                : null;
        })
        .filter(Boolean);
    const completed = isTechnologyCompleted(currentState, techId);
    return {
        exists: true,
        completed,
        missingRequirements,
        missingResources,
        researchable: !completed && missingRequirements.length === 0 && missingResources.length === 0
    };
}

export function researchTech(gameState, techId) {
    const currentState = getCurrentState(gameState);
    if (!canResearch(currentState, techId)) return false;

    const tech = TECHS_DATA[techId];
    for (const [resourceKey, requiredAmount] of Object.entries(tech.cost)) {
        const resource = currentState.resources[resourceKey];
        if (typeof resource === 'object') {
            resource.value -= requiredAmount;
        } else {
            currentState.resources[resourceKey] -= requiredAmount;
        }
    }

    if (!currentState.techs) currentState.techs = {};
    if (!currentState.unlockedTechs) currentState.unlockedTechs = {};

    currentState.techs[techId] = { completed: true };
    currentState.unlockedTechs[techId] = true;

    return true;
}
