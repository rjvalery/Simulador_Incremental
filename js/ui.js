// ui.js - Orquestador de Interfaz y Renderizado Reactivo (Layout de 2 Columnas)

import { formatNumber } from './resources.js?v=20260911-5';
import { calculateMaxHousing, getTotalPopulation } from './state.js?v=20260911-5';

// Renderiza el Sidebar de Recursos (25% derecho)
export function renderSidebar(state) {
    const sidebarContainer = document.getElementById('sidebar-resources');
    if (!sidebarContainer) return;

    let html = '<h3>Monitor de Recursos</h3><ul class="resource-list">';

    for (const [key, res] of Object.entries(state.resources)) {
        if (res.unlocked !== false) {
            html += `
                <li>
                    <span class="res-name">${res.name || key}:</span>
                    <span class="res-val">${formatNumber(res.value)} / ${formatNumber(res.max)}</span>
                    <span class="res-rate">(${res.production >= 0 ? '+' : ''}${formatNumber(res.production)}/s)</span>
                </li>`;
        }
    }

    // Añadir resumen demográfico en el sidebar
    const maxHousing = calculateMaxHousing(state);
    const totalPop = getTotalPopulation(state);
    html += `
        <li class="pop-monitor">
            <span class="res-name">Población:</span>
            <span class="res-val">${totalPop} / ${maxHousing}</span>
        </li>`;

    html += '</ul>';
    sidebarContainer.innerHTML = html;
}

// Orquestador principal de pestañas de la Zona Activa (75% izquierdo)
export function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        if (tab.id === `tab-${tabId}`) {
            tab.style.display = 'block';
        } else {
            tab.style.display = 'none';
        }
    });
}

// Añadir mensajes al historial de eventos (game-log)
export function addGameLog(message, type = "info") {
    const logContainer = document.getElementById('game-log');
    if (!logContainer) return;

    const p = document.createElement('p');
    p.className = `log-item log-${type}`;
    p.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;

    logContainer.appendChild(p);

    // Limitar el historial a 50 líneas
    if (logContainer.children.length > 50) {
        logContainer.removeChild(logContainer.firstChild);
    }

    logContainer.scrollTop = logContainer.scrollHeight;
}