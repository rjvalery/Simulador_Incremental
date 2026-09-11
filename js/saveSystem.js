import { gameState } from './state.js';

const SaveSystem = {
  SAVE_KEY: "incremental_vzla_save_v1",

  // 1. Recopila todo el estado global actual
  getGameState() {
    return {
      version: "1.0.0",
      timestamp: Date.now(),
      state: gameState
    };
  },

  // 2. Guardar en LocalStorage
  saveLocal() {
    try {
      const data = JSON.stringify(this.getGameState());
      localStorage.setItem(this.SAVE_KEY, data);
      log("Juego guardado automáticamente.", "positive");
      return true;
    } catch (e) {
      console.error("Error al guardar localmente:", e);
      return false;
    }
  },

  // 3. Cargar desde LocalStorage
  loadLocal() {
    try {
      const raw = localStorage.getItem(this.SAVE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      this.applyGameState(data);
      return true;
    } catch (e) {
      console.error("Error al cargar la partida:", e);
      return false;
    }
  },

  // 4. Exportar a código Base64
  exportToString() {
    const jsonString = JSON.stringify(this.getGameState());
    return btoa(encodeURIComponent(jsonString));
  },

  // 5. Importar desde código Base64
  importFromString(code) {
    try {
      const jsonString = decodeURIComponent(atob(code.trim()));
      const data = JSON.parse(jsonString);

      if (!data.resources || !data.buildings) {
        throw new Error("Estructura de guardado no válida");
      }

      this.applyGameState(data);
      this.saveLocal();
      return true;
    } catch (e) {
      alert("El código de importación es inválido o está corrupto.");
      return false;
    }
  },

  // 6. Restaurar variables globales
  applyGameState(data) {
    if (data.state) Object.assign(gameState, data.state);
  },

  // 7. Reiniciar partida
  resetGame() {
    localStorage.removeItem(this.SAVE_KEY);
    location.reload();
  }
};