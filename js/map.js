export const MAP_SIZE = 8;
export const mapGrid = [];

const BIOMES = ['grass', 'forest', 'mountain', 'water'];

function addLog(message) {
    const logContainer = document.getElementById('game-log');
    if (!logContainer) return;

    const entry = document.createElement('div');
    entry.className = 'log-entry';
    entry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logContainer.appendChild(entry);
    logContainer.scrollTop = logContainer.scrollHeight;
}

export function initMap(state) {
    if (state.mapData && state.mapData.length > 0) {
        state.mapData.forEach(row => row.forEach(cell => {
            cell.isFog = cell.isFog ?? !cell.revealed;
        }));
        mapGrid.length = 0;
        mapGrid.push(...state.mapData);
        return;
    }

    const newMap = [];
    for (let rowIndex = 0; rowIndex < MAP_SIZE; rowIndex++) {
        const row = [];
        for (let columnIndex = 0; columnIndex < MAP_SIZE; columnIndex++) {
            if (rowIndex === 3 && columnIndex === 3) {
                row.push({
                    row: rowIndex,
                    col: columnIndex,
                    biome: 'grass',
                    type: 'player_village',
                    revealed: true,
                    isFog: false,
                    name: 'Nuestra Aldea'
                });
                continue;
            }

            const biome = BIOMES[Math.floor(Math.random() * BIOMES.length)];
            let type = 'empty';
            let enemyData = null;

            if (biome !== 'water' && Math.random() < 0.15) {
                type = 'barbarian_camp';
                enemyData = {
                    level: 1,
                    power: 15,
                    maxPower: 100,
                    growthTimer: 0
                };
            }

            row.push({
                row: rowIndex,
                col: columnIndex,
                biome,
                type,
                revealed: Math.abs(rowIndex - 3) <= 1 && Math.abs(columnIndex - 3) <= 1,
                isFog: Math.abs(rowIndex - 3) > 1 || Math.abs(columnIndex - 3) > 1,
                enemy: enemyData
            });
        }
        newMap.push(row);
    }

    state.mapData = newMap;
    mapGrid.length = 0;
    mapGrid.push(...newMap);
}

export function processEnemyAI(state) {
    if (!state.mapData) return;

    state.mapData.forEach(row => {
        row.forEach(cell => {
            if (cell.type !== 'barbarian_camp' || !cell.enemy) return;

            cell.enemy.growthTimer += 1;
            if (cell.enemy.growthTimer >= 20) {
                cell.enemy.growthTimer = 0;
                if (cell.enemy.power < cell.enemy.maxPower) {
                    cell.enemy.power += 10;
                    if (cell.enemy.power >= 50 && cell.enemy.level === 1) {
                        cell.enemy.level = 2;
                    }
                }
            }
        });
    });
}

export function attackCamp(state, rowIndex, columnIndex) {
    const cell = state.mapData?.[rowIndex]?.[columnIndex];
    if (!cell || cell.type !== 'barbarian_camp' || !cell.enemy) return false;

    const military = state.military || {};
    const playerPower = (military.infantry || 0) * 5
        + (military.recruits || 0) * 5
        + (military.archers || 0) * 12
        + (military.cavalry || 0) * 20;

    if (playerPower <= 0) {
        addLog('¡No tienes tropas para enviar a la batalla!');
        return false;
    }

    const enemyPower = cell.enemy.power;
    if (playerPower >= enemyPower) {
        const goldLoot = cell.enemy.level * 25;
        const ironLoot = cell.enemy.level * 15;

        state.resources.gold.value = Math.min(state.resources.gold.max, state.resources.gold.value + goldLoot);
        state.resources.iron.value = Math.min(state.resources.iron.max, state.resources.iron.value + ironLoot);
        cell.type = 'ruins';
        cell.enemy = null;

        if (military.infantry > 0) military.infantry -= 1;
        else if (military.recruits > 0) military.recruits -= 1;
        addLog(`¡Victoria! Has destruido el campamento bárbaro. Botín: +${goldLoot} Oro, +${ironLoot} Hierro.`);
    } else {
        military.recruits = Math.floor((military.recruits || 0) * 0.5);
        military.archers = Math.floor((military.archers || 0) * 0.5);
        military.cavalry = Math.floor((military.cavalry || 0) * 0.5);
        addLog('¡Derrota! Tus fuerzas sufrieron grandes bajas en la emboscada.');
    }

    window.dispatchEvent(new CustomEvent('state:updated'));
    return true;
}

export function exploreCell(state, rowIndex, columnIndex) {
    return exploreTile(state, columnIndex, rowIndex);
}

export function exploreTile(state, x, y) {
    const tile = state.map?.[y]?.[x] || state.mapData?.[y]?.[x];
    if (!tile) return false;

    const isFog = tile.isFog ?? !tile.revealed;
    if (!isFog) return false;

    const scoutsAvailable = state.military?.scout || 0;
    if (scoutsAvailable < 1) {
        window.dispatchEvent(new CustomEvent('log:add', {
            detail: { message: 'Necesitas al menos 1 Explorador para adentrarte en la niebla.', type: 'warning' }
        }));
        return false;
    }

    tile.isFog = false;
    tile.revealed = true;
    state.military.scout -= 1;

    window.dispatchEvent(new CustomEvent('log:add', {
        detail: { message: `¡Casilla (${x}, ${y}) explorada!`, type: 'info' }
    }));
    window.dispatchEvent(new CustomEvent('state:updated'));
    return true;
}
