import { state } from './state.js';
import { renderUI, addLog } from './ui.js';

window.state = state;

function gameTick() {
  // 1. Producción pasiva por trabajadores
  const farmWorkers = state.buildings.farm?.workers || 0;
  const sawmillWorkers = state.buildings.sawmill?.workers || 0;
  const libraryWorkers = state.buildings.library?.workers || 0;

  // Tasas de producción
  const foodGenerated = farmWorkers * 1.0;  // +1 alimento/s por agricultor
  const woodGenerated = sawmillWorkers * 0.8; // +0.8 madera/s por leñador
  const scienceGenerated = libraryWorkers * 0.5; // +0.5 ciencia/s por erudito

  // Consumo por población
  const foodConsumed = state.population.total * 0.1; // -0.1 alimento/s por poblador

  // Aplicar cambios respetando límites máximos
  state.resources.food.value = Math.max(0, Math.min(state.resources.food.max, state.resources.food.value + foodGenerated - foodConsumed));
  state.resources.wood.value = Math.min(state.resources.wood.max, state.resources.wood.value + woodGenerated);
  state.resources.science.value = Math.min(state.resources.science.max, state.resources.science.value + scienceGenerated);

  // 2. Crecimiento demográfico pasivo
  if (state.population.total < state.population.max && state.resources.food.value > 50) {
    // 5% de probabilidad por segundo de que nazca un nuevo aldeano
    if (Math.random() < 0.05) {
      state.population.total += 1;
      addLog('Un nuevo habitante se ha unido a la aldea.');
    }
  }

  renderUI(state);
}

document.addEventListener('DOMContentLoaded', () => {
  renderUI(state);
  addLog('Simulador de Juego iniciado correctamente.');

  // Botones de recolección manual
  const btnFood = document.getElementById('btn-collect-food');
  const btnWood = document.getElementById('btn-collect-wood');
  const btnClearLog = document.getElementById('btn-clear-log');

  if (btnFood) {
    btnFood.addEventListener('click', () => {
      state.resources.food.value = Math.min(state.resources.food.max, state.resources.food.value + 1);
      addLog('Recolectaste +1 de Alimento.');
      renderUI(state);
    });
  }

  if (btnWood) {
    btnWood.addEventListener('click', () => {
      state.resources.wood.value = Math.min(state.resources.wood.max, state.resources.wood.value + 1);
      addLog('Cortaste +1 de Madera.');
      renderUI(state);
    });
  }

  if (btnClearLog) {
    btnClearLog.addEventListener('click', () => {
      const logContainer = document.getElementById('game-log');
      if (logContainer) logContainer.innerHTML = '';
    });
  }

  // Manejo de pestañas
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');

      const targetSection = e.target.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(section => {
        section.style.display = section.id === targetSection ? 'block' : 'none';
      });
    });
  });

  window.addEventListener('state:updated', () => {
    renderUI(state);
  });

  // Bucle de juego a 1 segundo por tick
  setInterval(gameTick, 1000);
});