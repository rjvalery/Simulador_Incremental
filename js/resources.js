// resources.js - Utilidades de formato numérico y gestión de recursos

import { BUILDINGS_DATA } from './buildings.js';

const WAREHOUSE_CAPPED_RESOURCES = new Set(['food', 'wood', 'stone', 'science']);

export function calculateResourceCap(state, resourceKey) {
    const resource = state.resources[resourceKey];
    if (!resource || !WAREHOUSE_CAPPED_RESOURCES.has(resourceKey)) return resource?.baseMax ?? resource?.max;

    const warehouseCount = state.buildings.warehouse?.count || 0;
    const warehouseBonus = (BUILDINGS_DATA.warehouse.storageCapacity || 0) * warehouseCount;
    const baseMax = resource.baseMax ?? resource.max - warehouseBonus;
    resource.baseMax = baseMax;
    return baseMax + warehouseBonus;
}

export function refreshResourceCaps(state) {
    for (const [resourceKey, resource] of Object.entries(state.resources)) {
        const cap = calculateResourceCap(state, resourceKey);
        if (cap !== undefined) resource.max = cap;
    }
}

// Función de formato numérico limpio para la UI y el Sidebar
export function formatNumber(value) {
    if (value === undefined || value === null) return "0";
    if (value === Infinity) return "∞";
    if (value >= 1e6) {
        return (value / 1e6).toFixed(2) + "M";
    } else if (value >= 1e3) {
        return (value / 1e3).toFixed(1) + "k";
    }
    return Math.floor(value).toLocaleString();
}

// Validación y descuento seguro de costes
export function canAfford(state, costObj) {
    for (const [resKey, amount] of Object.entries(costObj)) {
        if (!state.resources[resKey] || state.resources[resKey].value < amount) {
            return false;
        }
    }
    return true;
}

export function deductCost(state, costObj) {
    if (!canAfford(state, costObj)) return false;
    for (const [resKey, amount] of Object.entries(costObj)) {
        state.resources[resKey].value -= amount;
    }
    return true;
}