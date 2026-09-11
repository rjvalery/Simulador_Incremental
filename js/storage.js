import { gameState } from './state.js';

function emitLog(message) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('log:add', { detail: { message, type: 'info' } }));
  }
}

export const Storage = {
  key: "KITTENS_GAME_SAVE",

  save() {
    try {
      const data = JSON.stringify(gameState);
      localStorage.setItem(this.key, btoa(encodeURIComponent(data)));
      emitLog('Partida guardada correctamente.');
      return true;
    } catch (err) {
      console.error("Error al guardar la partida:", err);
    }
  },

  load() {
    const saved = localStorage.getItem(this.key);
    if (!saved) return false;

    try {
      const parsed = JSON.parse(decodeURIComponent(atob(saved)));
      Object.assign(gameState, parsed);
      emitLog('Partida cargada exitosamente.');
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('state:updated'));
      return true;
    } catch (err) {
      console.error("Error al cargar la partida guardada:", err);
      return false;
    }
  }
};