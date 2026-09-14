import { ensureBuildingStates, ensureResourceStates, gameState } from './state.js?v=20260914-4';

function emitLog(message) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('log:add', { detail: { message, type: 'info' } }));
  }
}

export const Storage = {
  key: "KITTENS_GAME_SAVE",

  save({ notify = true } = {}) {
    try {
      const data = JSON.stringify(gameState);
      localStorage.setItem(this.key, btoa(encodeURIComponent(data)));
      if (notify) emitLog('Partida guardada correctamente.');
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
      ensureResourceStates(gameState);
      ensureBuildingStates(gameState);
      emitLog('Partida cargada exitosamente.');
      if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('state:updated'));
      return true;
    } catch (err) {
      console.error("Error al cargar la partida guardada:", err);
      return false;
    }
  }
};