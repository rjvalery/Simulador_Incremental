// actions.js - Lógica de negocio para interacciones, construcción, investigación y combate

import { deductCost } from './resources.js';
import { calculateBuildingCost, BUILDINGS_DATA } from './buildings.js';

// Recolección manual de recursos
export function handleManualHarvest(state, resourceKey) {
    if (state.resources[resourceKey]) {
        state.resources[resourceKey].value += 1;
        // Lanzar evento o registrar log si es necesario
        window.dispatchEvent(new CustomEvent('log:add', {
            detail: { message: `Has recolectado 1 de ${resourceKey}.`, type: 'info' }
        }));
    }
}

// Construcción de infraestructura
export function buildStructure(state, buildingKey) {
    const building = BUILDINGS_DATA[buildingKey];
    if (!building) return;

    const currentCount = state.buildings[buildingKey] || 0;
    const cost = calculateBuildingCost(buildingKey, currentCount);

    if (deductCost(state, cost)) {
        state.buildings[buildingKey] = currentCount + 1;
        window.dispatchEvent(new CustomEvent('log:add', {
            detail: { message: `Has construido un/a ${building.name}.`, type: 'success' }
        }));
    } else {
        window.dispatchEvent(new CustomEvent('log:add', {
            detail: { message: `No tienes suficientes recursos para construir ${building.name}.`, type: 'warning' }
        }));
    }
}

// Investigación científica (Soluciona el error actual)
export function researchTech(state, techKey) {
    if (state.techs && state.techs[techKey]) {
        if (state.techs[techKey].unlocked) {
            window.dispatchEvent(new CustomEvent('log:add', {
                detail: { message: `La tecnología ya ha sido investigada.`, type: 'info' }
            }));
            return;
        }
        
        state.techs[techKey].unlocked = true;
        window.dispatchEvent(new CustomEvent('log:add', {
            detail: { message: `¡Investigación completada con éxito: ${techKey}!`, type: 'success' }
        }));
    }
}

// Ataque militar contra la IA
export function launchMilitaryAttack(state, difficulty) {
    window.dispatchEvent(new CustomEvent('log:add', {
        detail: { message: `Incursión militar lanzada contra el campamento vecino (Dificultad: ${difficulty}).`, type: 'danger' }
    }));
}