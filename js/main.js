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

  // Funcionalidad del Modal de Configuración (Exportar / Importar / Reiniciar)
  const modal = document.getElementById('settings-modal');
  const btnSettings = document.getElementById('btn-settings');
  const closeBtn = document.getElementById('close-settings');

  const btnExport = document.getElementById('btn-export');
  const btnImport = document.getElementById('btn-import');
  const btnReset = document.getElementById('btn-reset-game');

  const ioArea = document.getElementById('import-export-area');
  const ioTextarea = document.getElementById('io-textarea');
  const btnConfirmImport = document.getElementById('btn-confirm-import');

  // Abrir y Cerrar Modal
  if (btnSettings && modal) {
    btnSettings.addEventListener('click', () => { modal.style.display = 'flex'; });
  }
  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      ioArea.style.display = 'none';
    });
  }

  // 1. Exportar Partida
  if (btnExport) {
    btnExport.addEventListener('click', () => {
      const saveData = btoa(JSON.stringify(state));
      ioArea.style.display = 'block';
      btnConfirmImport.style.display = 'none';
      ioTextarea.value = saveData;
      ioTextarea.select();
      navigator.clipboard.writeText(saveData);
      addLog('Partida exportada al portapapeles.');
    });
  }

  // 2. Importar Partida
  if (btnImport) {
    btnImport.addEventListener('click', () => {
      ioArea.style.display = 'block';
      btnConfirmImport.style.display = 'inline-block';
      ioTextarea.value = '';
      ioTextarea.placeholder = 'Pega aquí tu código de guardado...';
    });
  }

  if (btnConfirmImport) {
    btnConfirmImport.addEventListener('click', () => {
      try {
        const decodedData = JSON.parse(atob(ioTextarea.value.trim()));
        Object.assign(state, decodedData);
        renderUI(state);
        addLog('Partida importada con éxito.');
        modal.style.display = 'none';
        ioArea.style.display = 'none';
      } catch (e) {
        alert('Código de guardado inválido.');
      }
    });
  }

  // 3. Reiniciar el Juego a 0
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      if (confirm('¿Estás seguro de que deseas reiniciar todo el progreso a 0?')) {
        state.resources.food.value = 0;
        state.resources.wood.value = 0;
        state.resources.stone.value = 0;
        state.resources.gold.value = 0;
        state.resources.science.value = 0;

        state.population.total = 0;
        state.population.workers = 0;
        state.population.max = 0;

        Object.keys(state.buildings).forEach(bId => {
          state.buildings[bId].count = 0;
          if (state.buildings[bId].workers) state.buildings[bId].workers = 0;
        });

        state.techs = {};
        state.unlockedTechs = {};

        const logContainer = document.getElementById('game-log');
        if (logContainer) logContainer.innerHTML = '';

        addLog('El juego ha sido reiniciado a cero.');
        renderUI(state);
        modal.style.display = 'none';
      }
    });
  }

  // Botones de recolección manual
  const btnFood = document.getElementById('btn-collect-food');
  const btnWood = document.getElementById('btn-collect-wood');
  const btnStone = document.getElementById('btn-collect-stone');
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

  if (btnStone) {
    btnStone.addEventListener('click', () => {
      state.resources.stone.value = Math.min(state.resources.stone.max, state.resources.stone.value + 1);
      addLog('Picoteaste +1 de Piedra.');
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