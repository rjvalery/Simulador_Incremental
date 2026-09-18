/**
 * Clase que gestiona el estado global del juego (ES6+)
 */
export class GameStateManager {
    constructor() {
        this.SAVE_KEY = 'simulador_incremental_save';
        this.state = this.getInitialState();
        this.load();
    }

    /**
     * Estado base inicial con todos los valores en 0
     */
    getInitialState() {
        return {
            resources: {
                food: { value: 0, max: 300 },
                wood: { value: 0, max: 250 },
                stone: { value: 0, max: 200 },
                gold: { value: 0, max: 1000 },
                science: { value: 0, max: 600 },
                iron: { value: 0, max: 50 },
                coal: { value: 0, max: 50 }
            },
            resourceRates: {
                food: 0, wood: 0, stone: 0, gold: 0, science: 0, iron: 0, coal: 0
            },
            buildings: {
                farm: { count: 0, workers: 0 },
                sawmill: { count: 0, workers: 0 },
                communal_house: { count: 0 },
                library: { count: 0, workers: 0 },
                mine: { count: 0, workers: 0 },
                forge: { count: 0, workers: 0 },
                barracks: { count: 0 }
            },
            population: { total: 0, workers: 0, max: 5 },
            unlockedTechs: {},
            military: { scout: 0, infantry: 0, archers: 0, cavalry: 0 },
            governance: { leader: null }
        };
    }

    /**
     * Modifica el valor de un recurso de forma segura y respeta el límite máximo
     */
    addResource(key, amount) {
        const res = this.state.resources[key];
        if (!res) return;

        if (typeof res === 'object') {
            res.value = Math.min(res.max ?? Infinity, Math.max(0, res.value + amount));
        } else {
            this.state.resources[key] = Math.max(0, res + amount);
        }
        this.notifyUpdate();
    }

    /**
     * Descuenta recursos si el jugador tiene suficiente saldo
     */
    consumeResources(costs) {
        // 1. Validar si dispone de todos los recursos requeridos
        for (const [key, amount] of Object.entries(costs)) {
            const currentVal = this.state.resources[key]?.value ?? this.state.resources[key] ?? 0;
            if (currentVal < amount) return false;
        }

        // 2. Restar los recursos
        for (const [key, amount] of Object.entries(costs)) {
            this.addResource(key, -amount);
        }

        this.notifyUpdate();
        return true;
    }

    /**
     * Guarda el estado actual en localStorage
     */
    save() {
        try {
            localStorage.setItem(this.SAVE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.error('Error al guardar en localStorage:', e);
        }
    }

    /**
     * Carga la partida guardada si existe
     */
    load() {
        try {
            const saved = localStorage.getItem(this.SAVE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                // Fusión profunda para mantener referencias iniciales si faltan claves
                this.state = { ...this.getInitialState(), ...parsed };
            }
        } catch (e) {
            console.error('Error al cargar localStorage, usando estado por defecto:', e);
        }
    }

    /**
     * Resetea el juego por completo
     */
    reset() {
        localStorage.removeItem(this.SAVE_KEY);
        this.state = this.getInitialState();
        this.notifyUpdate();
    }

    /**
     * Emite el evento global para sincronizar la interfaz de usuario
     */
    notifyUpdate() {
        this.save();
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('state:updated', { detail: this.state }));
        }
    }
}

// Instancia única (Singleton) exportada para la aplicación
export const gameState = new GameStateManager();
export const state = gameState.state; // Compatibilidad hacia atrás

/**
 * Calcula la capacidad máxima de viviendas disponibles.
 */
export function calculateMaxHousing(state) {
    const baseHousing = 5;
    const houseCount = state.buildings?.communal_house?.count || state.buildings?.shelter?.count || 0;
    const capacityPerHouse = 5;

    return baseHousing + (houseCount * capacityPerHouse);
}

/**
 * Valida y asegura la estructura del objeto de edificios en el estado.
 */
export function ensureBuildingStates(state) {
    if (!state.buildings) state.buildings = {};
    return state.buildings;
}

/**
 * Valida y asegura la estructura del objeto de población en el estado.
 */
export function ensurePopulationStates(state) {
    if (!state.population) {
        state.population = { total: 0, workers: 0, max: calculateMaxHousing(state) };
    }
    return state.population;
}

/**
 * Valida y asegura la estructura del objeto de recursos en el estado.
 */
export function ensureResourceStates(state) {
    if (!state.resources) state.resources = {};
    return state.resources;
}