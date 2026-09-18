import { state } from './state.js';
import { renderUI, addLog } from './ui.js';
import { getLeaderBonusMultiplier, productionMultiplier } from './governance.js';
import { UNITS_DATA, processMilitaryUpkeep } from './military.js';
import { initMap, processEnemyAI } from './map.js';

window.state = state;

function gameTick() {
  const rates = {
    food: 0,
    wood: 0,
    stone: 0,
    gold: 0,
    science: 0,
    iron: 0,
    coal: 0
  };

  // 1. Producción pasiva por trabajadores
  const farmWorkers = state.buildings.farm?.workers || 0;
  const sawmillWorkers = state.buildings.sawmill?.workers || 0;
  const libraryWorkers = state.buildings.library?.workers || 0;
  const mineWorkers = state.buildings.mine?.workers || 0;
  const forgeWorkers = state.buildings.forge?.workers || 0;

  rates.food += farmWorkers * 1.0;
  rates.wood += sawmillWorkers * 0.8;
  rates.science += libraryWorkers * 0.5;

  if (mineWorkers > 0) {
    rates.stone += mineWorkers * 0.5;
    rates.coal += mineWorkers * 0.2;
    rates.iron += mineWorkers * 0.1;
  }

  if (forgeWorkers > 0) {
    const coalReq = forgeWorkers * 0.2;
    const stoneReq = forgeWorkers * 0.4;
    if (state.resources.coal.value >= coalReq && state.resources.stone.value >= stoneReq) {
      rates.coal -= coalReq;
      rates.stone -= stoneReq;
      rates.iron += forgeWorkers * 0.15;
    }
  }

  const communalHouses = state.buildings.communal_house?.count || 0;
  if (communalHouses > 0 && state.population.total > 0) {
    rates.gold += state.population.total * 0.02 * communalHouses;
  }

  rates.food -= state.population.total * 0.2;

  for (const [unitId, count] of Object.entries(state.military || {})) {
    if (count > 0 && UNITS_DATA[unitId]) {
      if (UNITS_DATA[unitId].upkeep.food) rates.food -= UNITS_DATA[unitId].upkeep.food * count;
      if (UNITS_DATA[unitId].upkeep.gold) rates.gold -= UNITS_DATA[unitId].upkeep.gold * count;
    }
  }

  state.resourceRates = rates;

  // Tasas de producción
  const foodGenerated = farmWorkers * 1.0 * productionMultiplier(state, 'food', true);  // +1 alimento/s por agricultor
  const woodGenerated = sawmillWorkers * 0.8 * productionMultiplier(state, 'wood', true); // +0.8 madera/s por leñador
  const scienceGenerated = libraryWorkers * 0.5 * productionMultiplier(state, 'science', true); // +0.5 ciencia/s por erudito

  // Consumo por población
  const foodConsumed = state.population.total * 0.1; // -0.1 alimento/s por poblador

  // Aplicar cambios respetando límites máximos
  state.resources.food.value = Math.max(0, Math.min(state.resources.food.max, state.resources.food.value + foodGenerated - foodConsumed));
  state.resources.wood.value = Math.min(state.resources.wood.max, state.resources.wood.value + woodGenerated);
  state.resources.science.value = Math.min(state.resources.science.max, state.resources.science.value + scienceGenerated);

  // Producción de recursos por mineros asignados a la mina
  if (mineWorkers > 0) {
    const stonePerWorker = 0.5;
    const coalPerWorker = 0.2;
    const ironPerWorker = 0.1;

    if (state.resources.stone) {
      state.resources.stone.value = Math.min(
        state.resources.stone.max,
        state.resources.stone.value + (mineWorkers * stonePerWorker)
      );
    }

    if (state.resources.coal) {
      state.resources.coal.value = Math.min(
        state.resources.coal.max,
        state.resources.coal.value + (mineWorkers * coalPerWorker)
      );
    }

    if (state.resources.iron) {
      state.resources.iron.value = Math.min(
        state.resources.iron.max,
        state.resources.iron.value + (mineWorkers * ironPerWorker)
      );
    }
  }

  if (forgeWorkers > 0) {
    const coalNeeded = forgeWorkers * 0.2;
    const stoneNeeded = forgeWorkers * 0.4;

    if (state.resources.coal.value >= coalNeeded && state.resources.stone.value >= stoneNeeded) {
      state.resources.coal.value -= coalNeeded;
      state.resources.stone.value -= stoneNeeded;
      state.resources.iron.value = Math.min(
        state.resources.iron.max,
        state.resources.iron.value + (forgeWorkers * 0.15)
      );
    }
  }

  // Generación pasiva de Oro por las Casas Comunales
  const communalHouses = state.buildings.communal_house?.count || 0;
  const leaderEffectiveness = getLeaderBonusMultiplier(state);
  if (communalHouses > 0 && state.population.total > 0) {
    const goldIncome = state.population.total * 0.02 * communalHouses;
    state.resources.gold.value = Math.min(
      state.resources.gold.max,
      state.resources.gold.value + goldIncome
    );
  }

  state.resources.food.value = Math.max(0, Math.min(
    state.resources.food.max,
    state.resources.food.value + (foodGenerated * leaderEffectiveness) - foodGenerated
  ));
  state.resources.wood.value = Math.min(
    state.resources.wood.max,
    state.resources.wood.value + (woodGenerated * leaderEffectiveness) - woodGenerated
  );
  state.resources.science.value = Math.min(
    state.resources.science.max,
    state.resources.science.value + (scienceGenerated * leaderEffectiveness) - scienceGenerated
  );

  processMilitaryUpkeep(state);
  processEnemyAI(state);

  // 2. Crecimiento demográfico pasivo (Equilibrado a 25 de alimento)
  const foodAmount = state.resources.food.value ?? state.resources.food;

  if (state.population.total < state.population.max && foodAmount >= 25) {
    // 10% de probabilidad por segundo de que se una un nuevo habitante
    if (Math.random() < 0.10) {
      state.population.total += 1;
      addLog('Un nuevo habitante se ha unido a la aldea.');
    }
  }

  renderUI(state);
}

document.addEventListener('DOMContentLoaded', () => {
  initMap(state);
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
        initMap(state);
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
        state.resources.iron.value = 0;
        state.resources.coal.value = 0;

        state.population.total = 0;
        state.population.workers = 0;
        state.population.max = 0;

        Object.keys(state.buildings).forEach(bId => {
          state.buildings[bId].count = 0;
          if (state.buildings[bId].workers) state.buildings[bId].workers = 0;
        });

        state.military = { recruits: 0, archers: 0, cavalry: 0 };
        state.mapData = [];
        initMap(state);

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