export const UNITS_DATA = {
    recruits: {
        id: 'recruits',
        name: 'Infantería',
        desc: 'Unidad de melé básica. Buena defensa inicial.',
        cost: { food: 30, iron: 10 },
        stats: { attack: 5, defense: 8, hp: 20 },
        upkeep: { food: 0.1 }
    },
    archers: {
        id: 'archers',
        name: 'Arqueros',
        desc: 'Unidad a distancia con alto daño de ataque.',
        cost: { food: 25, wood: 20, iron: 15 },
        stats: { attack: 12, defense: 3, hp: 12 },
        upkeep: { food: 0.1, gold: 0.05 }
    },
    cavalry: {
        id: 'cavalry',
        name: 'Caballería',
        desc: 'Unidad pesada rápida y devastadora.',
        cost: { food: 60, iron: 35, gold: 20 },
        stats: { attack: 20, defense: 15, hp: 40 },
        upkeep: { food: 0.2, gold: 0.1 }
    }
};

function addLog(message) {
    const logContainer = document.getElementById('game-log');
    if (!logContainer) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

export function getMaxMilitaryCapacity(state) {
    const barracksCount = state.buildings.barracks?.count || 0;
    return barracksCount * 10;
}

export function trainUnit(state, unitId) {
    const unit = UNITS_DATA[unitId];
    if (!unit) return false;

    state.military = state.military || { recruits: 0, archers: 0, cavalry: 0 };
    const currentCapacity = Object.keys(UNITS_DATA)
        .reduce((total, id) => total + (state.military[id] || 0), 0);
    const maxCapacity = getMaxMilitaryCapacity(state);

    if (currentCapacity >= maxCapacity) {
        addLog('No tienes suficiente espacio en el Cuartel.');
        return false;
    }

    for (const [resourceKey, amount] of Object.entries(unit.cost)) {
        const resource = state.resources[resourceKey];
        const currentValue = resource?.value ?? resource ?? 0;
        if (currentValue < amount) {
            addLog(`Recursos insuficientes para entrenar ${unit.name}.`);
            return false;
        }
    }

    for (const [resourceKey, amount] of Object.entries(unit.cost)) {
        const resource = state.resources[resourceKey];
        if (typeof resource === 'object') {
            resource.value -= amount;
        } else {
            state.resources[resourceKey] -= amount;
        }
    }

    state.military[unitId] = (state.military[unitId] || 0) + 1;
    addLog(`Entrenaste un ${unit.name}.`);
    return true;
}

export function processMilitaryUpkeep(state) {
    let totalFoodUpkeep = 0;
    let totalGoldUpkeep = 0;

    for (const [unitId, count] of Object.entries(state.military || {})) {
        const unit = UNITS_DATA[unitId];
        if (!unit || count <= 0) continue;

        totalFoodUpkeep += (unit.upkeep.food || 0) * count;
        totalGoldUpkeep += (unit.upkeep.gold || 0) * count;
    }

    if (totalFoodUpkeep > 0) {
        state.resources.food.value = Math.max(0, state.resources.food.value - totalFoodUpkeep);
    }

    if (totalGoldUpkeep > 0) {
        state.resources.gold.value = Math.max(0, state.resources.gold.value - totalGoldUpkeep);
    }
}
