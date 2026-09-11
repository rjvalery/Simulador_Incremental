// main.js - Punto de entrada principal, gestión de pestañas, bucle (tick) y renderizado UI

import { state } from './resources.js';
import { handleManualHarvest, buildStructure, researchTech, launchMilitaryAttack } from './actions.js';

document.addEventListener('DOMContentLoaded', () => {
    setupTabs();
    setupEventListeners();
    startGameLoop();
});

function setupTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.getAttribute('data-tab');
            
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            document.querySelectorAll('.tab-content').forEach(section => {
                section.style.display = 'none';
            });
            const activeSection = document.getElementById(`tab-${targetTab}`);
            if (activeSection) {
                activeSection.style.display = 'flex';
            }
        });
    });
}

function setupEventListeners() {
    // Vincular el botón único de recolección manual (comida, madera y probabilidad de piedra)
    const btnHarvestFood = document.getElementById('btn-harvest-food');
    if (btnHarvestFood) {
        btnHarvestFood.addEventListener('click', () => {
            handleManualHarvest(state, 'food');
            renderResources();
        });
    }

    // Escuchar eventos globales para el Registro Histórico (Game-Log)
    window.addEventListener('log:add', (e) => {
        const { message, type } = e.detail;
        appendLog(message, type);
    });

    // Botón para vaciar el log
    const btnClearLog = document.getElementById('btn-clear-log');
    if (btnClearLog) {
        btnClearLog.addEventListener('click', () => {
            document.getElementById('game-log').innerHTML = '';
        });
    }
}

function appendLog(message, type = 'info') {
    const logContainer = document.getElementById('game-log');
    if (!logContainer) return;

    const div = document.createElement('div');
    div.style.marginBottom = '4px';
    if (type === 'success') div.style.color = '#4CAF50';
    if (type === 'warning') div.style.color = '#FF9800';
    if (type === 'danger') div.style.color = '#F44336';
    
    div.textContent = `> ${message}`;
    logContainer.prepend(div);
}

function renderResources() {
    const container = document.getElementById('sidebar-resources');
    if (!container) return;

    container.innerHTML = '';
    for (const [key, res] of Object.entries(state.resources)) {
        const div = document.createElement('div');
        div.style.marginBottom = '8px';
        div.style.fontSize = '0.9rem';
        div.innerHTML = `<strong>${res.name || key}:</strong> ${Math.floor(res.value)} / ${res.max || '∞'}`;
        container.appendChild(div);
    }
}

function startGameLoop() {
    setInterval(() => {
        // Ciclo del motor por segundo (Tick)
        renderResources();
    }, 1000);
}