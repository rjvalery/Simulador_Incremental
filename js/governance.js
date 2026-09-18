// governance.js - Liderazgo y decretos del asentamiento

import { isTechnologyCompleted } from './techs.js';

export const LEADERS = Object.freeze({
    agrarian: {
        id: 'agrarian',
        name: 'Agrario',
        description: '+15% a la produccion de alimento.'
    },
    industrial: {
        id: 'industrial',
        name: 'Industrial',
        description: '+15% a la produccion de madera.'
    },
    scientific: {
        id: 'scientific',
        name: 'Científico',
        description: '+20% a la produccion de ciencia.'
    },
    hunter: {
        id: 'hunter',
        name: 'Lider Capataz',
        description: '+15% a la velocidad de recoleccion manual de recursos.'
    },
    scholar: {
        id: 'scholar',
        name: 'Lider Sabio / Erudito',
        description: '+20% a la ciencia pasiva de las bibliotecas.'
    },
    builder: {
        id: 'builder',
        name: 'Lider Arquitecto',
        description: '-5% al coste de nuevas estructuras.'
    }
});

export const POLICIES = Object.freeze({
    rationing: {
        id: 'rationing',
        name: 'Racionamiento de Emergencia',
        description: '-20% al consumo de comida.',
        requires: 'laws'
    },
    extendedWorkday: {
        id: 'extendedWorkday',
        name: 'Jornada Prolongada',
        description: '+10% a la producción de madera y piedra, con +15% de consumo de comida.',
        requires: 'laws'
    },
    capitationTax: {
        id: 'capitationTax',
        name: 'Impuesto de Capitación',
        description: 'Recauda oro por cada habitante libre u obrero.',
        requires: 'taxation'
    }
});

export function ensureGovernance(state) {
    state.governance = state.governance || {};
    state.governance.unlocked = state.governance.unlocked === true;
    state.governance.leader = LEADERS[state.governance.leader] ? state.governance.leader : null;
    state.governance.policies = Array.isArray(state.governance.policies)
        ? state.governance.policies.filter(policy => POLICIES[policy])
        : [];
}

export function governanceIsAvailable(state) {
    return state.governance?.unlocked === true &&
        ((state.buildings.communal_house?.count || 0) > 0 || (state.buildings.townHall?.count || 0) > 0) &&
        isTechnologyCompleted(state, 'leadership');
}

export function constructionCostMultiplier(state) {
    return state.governance?.leader === 'builder' ? 0.95 : 1;
}

export function getLeaderBonusMultiplier(state) {
    const communalCount = state.buildings.communal_house?.count || 0;
    const leader = state.leader ?? state.governance?.leader;
    if (communalCount === 0 || !leader || leader === 'none') return 1.0;

    const bonus = 0.10 + (communalCount - 1) * 0.05;
    return 1.0 + bonus;
}

export function productionMultiplier(state, resourceKey, passive = false) {
    let multiplier = 1;
    if (state.governance?.policies?.includes('extendedWorkday') && ['wood', 'stone'].includes(resourceKey)) {
        multiplier *= 1.1;
    }
    if (resourceKey === 'food' && state.governance?.leader === 'agrarian') multiplier *= 1.15;
    if (resourceKey === 'wood' && state.governance?.leader === 'industrial') multiplier *= 1.15;
    if (passive && resourceKey === 'science' && ['scientific', 'scholar'].includes(state.governance?.leader)) multiplier *= 1.2;
    return multiplier;
}

export function manualHarvestMultiplier(state) {
    return state.governance?.leader === 'hunter' ? 1.15 : 1;
}

export function foodConsumptionMultiplier(state) {
    let multiplier = 1;
    if (state.governance?.policies?.includes('rationing')) multiplier *= 0.8;
    if (state.governance?.policies?.includes('extendedWorkday')) multiplier *= 1.1;
    return multiplier;
}