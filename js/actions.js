// actions.js - Lógica de negocio para interacciones, construcción e investigación

import { deductCost } from './resources.js';
import { calculateBuildingCost, BUILDINGS_DATA } from './buildings.js';

// Recolección manual unificada en el botón de comida con probabilidad de acierto para madera y piedra
export function handleManualHarvest(state, actionKey) {
    if (actionKey === 'food') {
        // La comida siempre se recolecta de forma garantizada al hacer clic
        if (state.resources.food) {
            state.resources.food.value += 1;
        }

        let mensajeLog = "Has recolectado Comida.";

        // Probabilidad de acierto para la madera (ej. 50%)
        const woodChance = 0.50;
        const woodRoll = Math.random();
        if (woodRoll <= woodChance && state.resources.wood) {
            state.resources.wood.value += 1;
            mensajeLog += ` Has encontrado Madera (${Math.round(woodRoll * 100)}%).`;
        }

        // Probabilidad de acierto para la piedra (ej. 35%)
        const stoneChance = 0.35;
        const stoneRoll = Math.random();
        if (stoneRoll <= stoneChance && state.resources.stone) {
            state.resources.stone.value += 1;
            mensajeLog += ` ¡Y hallaste un filón de Piedra (${Math.round(stoneRoll * 100)}%)!`;
        }

        window.dispatchEvent(new CustomEvent('log:add', {
            detail: { message: mensajeLog, type: woodRoll <= woodChance || stoneRoll <= stoneChance ? 'success' : 'info' }
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

// Investigación científica
export function researchTech(state, techKey) {
    if (state.techs && state.techs[techKey]) {
        if (state.techs[techKey].unlocked) return;
        state.techs[techKey].unlocked = true;
        window.dispatchEvent(new CustomEvent('log:add', {
            detail: { message: `¡Investigación completada: ${techKey}!`, type: 'success' }
        }));
    }
}

// Ataque militar
export function launchMilitaryAttack(state, difficulty) {
    window.dispatchEvent(new CustomEvent('log:add', {
        detail: { message: `Incursión militar lanzada (Dificultad: ${difficulty}).`, type: 'danger' }
    }));
}