// actions.js - Lógica de Negocio, Construcción, Empleo y Acciones Militares/IA

import { deductCost, canAfford } from './resources.js';
import { BUILDINGS_DATA, calculateBuildingCost } from './buildings.js';
import { researchTech, canResearch } from './techs.js';
import { calculateMaxHousing, getTotalPopulation } from './state.js';

// Recolección manual con probabilidad de descubrimiento de ciencia
export function handleManualHarvest(state, resourceKey) {
    if (!state.resources[resourceKey]) return;

    const res = state.resources[resourceKey];
    res.value = Math.min(res.max, res.value + 1);

    // Probabilidad de descubrir ciencia de forma manual en fase inicial (ej. 10%)
    if (Math.random() < 0.10 && state.resources.science) {
        state.resources.science.value = Math.min(state.resources.science.max, state.resources.science.value + 1);
        
        const logEvent = new CustomEvent('log:add', { 
            detail: { message: "¡Has descubierto un destello de conocimiento científico durante la recolección!", type: "success" } 
        });
        window.dispatchEvent(logEvent);
    }
}

// Construcción de edificios con escalado exponencial 1.15^N
export function buildStructure(state, buildingKey) {
    const building = BUILDINGS_DATA[buildingKey];
    if (!building) return false;

    const currentCount = state.buildings[buildingKey] ? state.buildings[buildingKey].count : 0;
    const cost = calculateBuildingCost(buildingKey, currentCount);

    if (canAfford(state, cost)) {
        deductCost(state, cost);
        
        if (!state.buildings[buildingKey]) {
            state.buildings[buildingKey] = { count: 0 };
        }
        state.buildings[buildingKey].count += 1;

        // Emitir log de evento
        const logEvent = new CustomEvent('log:add', { 
            detail: { message: `Has construido un/a ${building.name}.`, type: "info" } 
        });
        window.dispatchEvent(logEvent);
        return true;
    }
    return false;
}

// Asignación y gestión de empleos (prevención de trabajadores fantasma)
export function assignWorker(state, fromJob, toJob) {
    if (state.population[fromJob] > 0) {
        state.population[fromJob]--;
        state.population[toJob]++;
        return true;
    }
    return false;
}

// Lanzamiento de incursión militar contra aldea o campamento de IA
export function launchMilitaryAttack(state, targetDifficulty) {
    state.military = state.military || { units: { spearman: 0, infantry: 0, tank: 0 } };
    
    // Cálculo básico de poder militar del jugador
    const playerPower = (state.military.units.spearman || 0) * 5 + 
                        (state.military.units.infantry || 0) * 15 + 
                        (state.military.units.tank || 0) * 50;

    const enemyPower = targetDifficulty * 20;

    if (playerPower <= 0) {
        const logEvent = new CustomEvent('log:add', { 
            detail: { message: "No tienes tropas reclutadas para enviar a la batalla.", type: "warning" } 
        });
        window.dispatchEvent(logEvent);
        return false;
    }

    if (playerPower >= enemyPower) {
        // Victoria: Botín de recursos
        state.resources.gold = state.resources.gold || { value: 0, max: 2000 };
        state.resources.gold.value = Math.min(state.resources.gold.max, state.resources.gold.value + (targetDifficulty * 50));
        
        const logEvent = new CustomEvent('log:add', { 
            detail: { message: `¡Victoria aplastante contra el campamento de IA! Botín asegurado.`, type: "success" } 
        });
        window.dispatchEvent(logEvent);
        return true;
    } else {
        // Derrota: Pérdida de tropas
        if (state.military.units.spearman > 0) state.military.units.spearman = Math.max(0, state.military.units.spearman - 1);
        
        const logEvent = new CustomEvent('log:add', { 
            detail: { message: `La incursión falló. Las defensas enemigas superaban a tus tropas.`, type: "danger" } 
        });
        window.dispatchEvent(logEvent);
        return false;
    }
}