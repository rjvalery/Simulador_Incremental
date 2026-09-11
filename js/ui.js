// ui.js - Orquestador de Interfaz y Renderizado Reactivo (Layout de 2 Columnas)

import { formatNumber } from './resources.js?v=20260911-7';
import { calculateMaxHousing, getTotalPopulation } from './state.js?v=20260911-7';
import { BUILDINGS_DATA } from './buildings.js?v=20260911-7';

// Renderiza el Sidebar de Recursos (25% derecho)
export function renderSidebar(state) {
    const sidebarContainer = document.getElementById('sidebar-resources');
    if (!sidebarContainer) return;

    let html = '<h3>Monitor de Recursos</h3><ul class="resource-list">';

    const totalJobCapacity = Object.entries(state.buildings || {}).reduce((total, [buildingKey, buildingState]) => {
        const buildingInfo = BUILDINGS_DATA[buildingKey];
        return total + (buildingState.count || 0) * (buildingInfo?.jobsPerBuilding || 0);
    }, 0);
    const occupiedJobs = Object.values(state.population?.assignments || {})
        .reduce((total, assigned) => total + (Number(assigned) || 0), 0);

    for (const [key, res] of Object.entries(state.resources)) {
        if (res.unlocked !== false) {
            const productionRate = Number(res.production) || 0;
            const consumptionRate = Number(res.consumption) || 0;
            const rateText = key === 'wood'
                ? `(${productionRate >= 0 ? '+' : ''}${formatNumber(productionRate)}/s)`
                : consumptionRate > 0
                ? `(+${formatNumber(productionRate)}/s, -${formatNumber(consumptionRate)}/s)`
                : `(${productionRate >= 0 ? '+' : ''}${formatNumber(productionRate)}/s)`;
            const tooltip = key === 'wood'
                ? `Producción: ${productionRate >= 0 ? '+' : ''}${formatNumber(productionRate)}/s | Consumo: ${formatNumber(consumptionRate)}/s`
                : '';
            html += `
                <li>
                    <span class="res-name${tooltip ? ' resource-tooltip' : ''}"${tooltip ? ` data-tooltip="${tooltip}"` : ''}>${res.name || key}:</span>
                    <span class="res-val">${formatNumber(res.value)} / ${formatNumber(res.max)}</span>
                    <span class="res-rate">${rateText}</span>
                </li>`;
        }
    }

    // Añadir resumen demográfico en el sidebar
    const maxHousing = calculateMaxHousing(state);
    const totalPop = getTotalPopulation(state);
    html += `
        <li class="pop-monitor">
            <span class="res-name">Obreros:</span>
            <span class="res-val">${state.population?.workers || 0}</span>
            <span class="res-rate">Puestos: ${occupiedJobs} / ${totalJobCapacity}</span>
        </li>
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