// main.js - Archivo principal de arranque, eventos de UI y enlace de la Zona Activa

import { startEngine } from './engine.js';
import { renderSidebar, switchTab, addGameLog } from './ui.js';
import { gameState } from './state.js';
import { handleManualHarvest, buildStructure, researchTech, launchMilitaryAttack } from './actions.js';

window.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar el motor del juego en tiempo real (Tick / Local)
    startEngine();

    // 2. Escuchar la actualización del estado global para refrescar el Sidebar (25%)
    window.addEventListener('state:updated', (e) => {
        renderSidebar(e.detail);
    });

    // 3. Escuchar los eventos del historial para volcarlos en el log de la pestaña Resumen
    window.addEventListener('log:add', (e) => {
        addGameLog(e.detail.message, e.detail.type);
    });

    // 4. Conectar la navegación de las 5 pestañas de la Zona Activa (75%)
    setupTabNavigation();

    // 5. Conectar los botones de acción del HTML con las funciones de negocio
    setupActionListeners();

    addGameLog("Simulador inicializado correctamente. Bienvenido al asentamiento.", "success");
});

// Configura los clics para cambiar entre las pestañas modulares
function setupTabNavigation() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const targetTab = e.target.getAttribute('data-tab');
            switchTab(targetTab);
        });
    });
}

// Vincula los elementos interactivos del DOM con las funciones de actions.js
function setupActionListeners() {
    // Botón de recolección manual de comida (Pestaña Resumen)
    const btnHarvestFood = document.getElementById('btn-harvest-food');
    if (btnHarvestFood) {
        btnHarvestFood.addEventListener('click', () => {
            handleManualHarvest(gameState, 'food');
        });
    }

    // Botón de recolección manual de madera
    const btnHarvestWood = document.getElementById('btn-harvest-wood');
    if (btnHarvestWood) {
        btnHarvestWood.addEventListener('click', () => {
            handleManualHarvest(gameState, 'wood');
        });
    }

    // Botones de construcción de infraestructura (Pestaña Infraestructura)
    const btnBuildShelter = document.getElementById('btn-build-shelter');
    if (btnBuildShelter) {
        btnBuildShelter.addEventListener('click', () => {
            buildStructure(gameState, 'shelter');
        });
    }

    const btnBuildFarm = document.getElementById('btn-build-farm');
    if (btnBuildFarm) {
        btnBuildFarm.addEventListener('click', () => {
            buildStructure(gameState, 'farm');
        });
    }

    // Botones de investigación científica (Pestaña Ciencia e I+D)
    const btnResAgriculture = document.getElementById('btn-res-agriculture');
    if (btnResAgriculture) {
        btnResAgriculture.addEventListener('click', () => {
            researchTech(gameState, 'agriculture');
        });
    }

    const btnResBronze = document.getElementById('btn-res-bronze');
    if (btnResBronze) {
        btnResBronze.addEventListener('click', () => {
            researchTech(gameState, 'bronzeWorking');
        });
    }

    // Botón de incursión militar contra la IA
    const btnAttackAI = document.getElementById('btn-attack-ai');
    if (btnAttackAI) {
        btnAttackAI.addEventListener('click', () => {
            // Dificultad base de ejemplo: 2
            launchMilitaryAttack(gameState, 2);
        });
    }
}