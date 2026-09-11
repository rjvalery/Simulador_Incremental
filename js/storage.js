import { gameState } from './state.js';
import { eventBus } from './eventBus.js';

export const Storage = {
  key: "KITTENS_GAME_SAVE",

  save() {
    try {
      const data = JSON.stringify(gameState);
      localStorage.setItem(this.key, btoa(data));
      eventBus.emit('log:add', "Partida guardada correctamente.");
    } catch (err) {
      console.error("Error al guardar la partida:", err);
    }
  },

  load() {
    const saved = localStorage.getItem(this.key);
    if (!saved) return false;

    try {
      const parsed = JSON.parse(atob(saved));
      Object.assign(gameState, parsed);
      eventBus.emit('log:add', "Partida cargada exitosamente.");
      eventBus.emit('state:updated');
      return true;
    } catch (err) {
      console.error("Error al cargar la partida guardada:", err);
      return false;
    }
  }
};