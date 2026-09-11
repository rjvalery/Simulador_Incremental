// resources.js - Utilidades de formato numérico y gestión de recursos

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