// engine.js - Motor de Juego (Game Loop y Migración)
import { gameState, calculateMaxHousing, getTotalPopulation } from './state.js';

let lastTickTime = performance.now();
let migrationTimer = 0; // Temporizador para controlar el flujo de migración (ej. cada 5 segundos)

export function gameLoop(timestamp) {
    const deltaTime = (timestamp - lastTickTime) / 1000;
    lastTickTime = timestamp;

    if (deltaTime > 0) {
        updateGameTick(deltaTime);
    }

    requestAnimationFrame(gameLoop);
}

function updateGameTick(dt) {
    // 1. Procesar producción y consumo por segundo
    processProduction(dt);

    // 2. Gestionar la migración demográfica periódica
    migrationTimer += dt;
    if (migrationTimer >= 5.0) { // Cada 5 segundos evalúa la llegada de habitantes
        handleMigration(gameState);
        migrationTimer = 0;
    }

    // 3. Emitir evento de actualización para la UI
    const updateEvent = new CustomEvent('state:updated', { detail: gameState });
    window.dispatchEvent(updateEvent);
}

function handleMigration(state) {
    const maxHousing = calculateMaxHousing(state);
    const currentPop = getTotalPopulation(state);

    // Si hay espacio en las viviendas, un nuevo habitante migra como mano de obra libre
    if (currentPop < maxHousing) {
        state.population.unskilled += 1;
        
        // Registrar en el log del sistema si está disponible
        const logEvent = new CustomEvent('log:add', { 
            detail: { message: "Un nuevo habitante ha migrado al asentamiento.", type: "info" } 
        });
        window.dispatchEvent(logEvent);
    }
}

function processProduction(dt) {
    // Cálculo básico de recursos según trabajadores asignados
    // (Ajustado de manera limpia para respetar tasas netas /s)
    const farmProd = gameState.buildings.farm.count * 1.0;
    const woodProd = gameState.buildings.woodcutter.count * 0.8;
    
    // Producción de comida
    gameState.resources.food.value = Math.min(
        gameState.resources.food.max,
        gameState.resources.food.value + (farmProd * dt)
    );
    gameState.resources.food.production = farmProd;

    // Producción de madera
    gameState.resources.wood.value = Math.min(
        gameState.resources.wood.max,
        gameState.resources.wood.value + (woodProd * dt)
    );
    gameState.resources.wood.production = woodProd;
}

export function startEngine() {
    requestAnimationFrame(gameLoop);
}