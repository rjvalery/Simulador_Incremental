import { TECHS_DATA, canResearch, researchTech, isTechnologyCompleted } from './techs.js';

export function addLog(message) {
  const logContainer = document.getElementById('game-log');
  if (!logContainer) return;

  const timeStr = new Date().toLocaleTimeString();
  const entry = document.createElement('div');
  entry.className = 'log-entry';
  entry.textContent = `[${timeStr}] ${message}`;

  logContainer.appendChild(entry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

export function renderUI(gameState) {
  const state = gameState || window.state;
  if (!state) return;

  renderResourceMonitor(state);
  renderTechPanel(state);
  renderBuildingCards(state);
  renderPopulationControls(state);
}

export function setupSettingsModal({ onExport, onImport, onReset }) {
  const modal = document.getElementById('settings-modal');
  const openButton = document.getElementById('btn-settings');
  const closeButton = document.getElementById('close-settings');
  const exportButton = document.getElementById('btn-export');
  const importButton = document.getElementById('btn-import');
  const resetButton = document.getElementById('btn-reset-game');
  const confirmImportButton = document.getElementById('btn-confirm-import');
  const importExportArea = document.getElementById('import-export-area');
  const ioLabel = document.getElementById('io-label');
  const ioTextarea = document.getElementById('io-textarea');

  if (!modal || !openButton) return;

  const closeModal = () => {
    modal.style.display = 'none';
  };

  openButton.addEventListener('click', () => {
    modal.style.display = 'flex';
  });

  closeButton?.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });

  exportButton?.addEventListener('click', () => {
    importExportArea.style.display = 'block';
    ioLabel.textContent = 'Código de Guardado:';
    ioTextarea.value = onExport();
    confirmImportButton.style.display = 'none';
  });

  importButton?.addEventListener('click', () => {
    importExportArea.style.display = 'block';
    ioLabel.textContent = 'Pega el Código de Guardado:';
    ioTextarea.value = '';
    confirmImportButton.style.display = 'inline-block';
    ioTextarea.focus();
  });

  confirmImportButton?.addEventListener('click', () => {
    if (onImport(ioTextarea.value)) closeModal();
  });

  resetButton?.addEventListener('click', () => {
    if (window.confirm('¿Reiniciar toda la partida a 0?')) {
      onReset();
      closeModal();
    }
  });
}

function renderResourceMonitor(state) {
  const getVal = (res) => (typeof res === 'object' ? res.value : res);
  const getMax = (res) => (typeof res === 'object' ? res.max : 0);

  const foodEl = document.getElementById('res-food');
  const woodEl = document.getElementById('res-wood');
  const stoneEl = document.getElementById('res-stone');
  const goldEl = document.getElementById('res-gold');
  const scienceEl = document.getElementById('res-science');
  const popEl = document.getElementById('res-pop');
  const workersEl = document.getElementById('res-workers');

  if (foodEl) foodEl.textContent = `${getVal(state.resources.food).toFixed(1)} / ${getMax(state.resources.food)}`;
  if (woodEl) woodEl.textContent = `${getVal(state.resources.wood).toFixed(1)} / ${getMax(state.resources.wood)}`;
  if (stoneEl) stoneEl.textContent = `${getVal(state.resources.stone).toFixed(0)} / ${getMax(state.resources.stone)}`;
  if (goldEl) goldEl.textContent = `${getVal(state.resources.gold).toFixed(0)} / ${getMax(state.resources.gold)}`;
  if (scienceEl) scienceEl.textContent = `${getVal(state.resources.science).toFixed(0)} / ${getMax(state.resources.science)}`;
  if (popEl) popEl.textContent = `${state.population.total} / ${state.population.max}`;
  if (workersEl) workersEl.textContent = `${state.population.workers} / ${state.population.total}`;
}

export function renderTechPanel(state) {
  const container = document.getElementById('tech-container');
  if (!container) return;

  container.innerHTML = '';

  Object.keys(TECHS_DATA).forEach(techId => {
    const tech = TECHS_DATA[techId];
    const completed = isTechnologyCompleted(state, techId);
    const available = canResearch(state, techId);

    const hasPrereqs = tech.requires.every(reqId => isTechnologyCompleted(state, reqId));
    if (!hasPrereqs && !completed) return;

    // Construcción dinámica del texto de costo
    const costEntries = Object.entries(tech.cost || {});
    const costText = costEntries.map(([resKey, amount]) => {
      const nameMap = {
        food: 'Alimento',
        wood: 'Madera',
        stone: 'Piedra',
        science: 'Ciencia',
        gold: 'Oro'
      };
      return `${amount} ${nameMap[resKey] || resKey}`;
    }).join(', ');

    const card = document.createElement('div');
    card.className = `tech-card ${completed ? 'completed' : ''}`;

    card.innerHTML = `
      <h4>${tech.name}</h4>
      <p>${tech.description}</p>
      <p>Costo: ${costText || 'Gratis'}</p>
      <button 
        class="btn-tech" 
        data-tech="${techId}"
        ${!available || completed ? 'disabled' : ''}>
        ${completed ? '✓ Investigado' : 'Investigar'}
      </button>
    `;

    const button = card.querySelector('.btn-tech');
    if (button && !completed) {
      button.addEventListener('click', () => {
        const success = researchTech(state, techId);
        if (success) {
          addLog(`Investigaste la tecnología: ${tech.name}`);
          renderUI(state);
          window.dispatchEvent(new CustomEvent('state:updated'));
        }
      });
    }

    container.appendChild(card);
  });
}

export function renderBuildingCards(state) {
  const container = document.getElementById('buildings-container');
  if (!container) return;

  container.innerHTML = '';

  const buildingsData = [
    { id: 'shelter', name: 'Refugio', desc: 'Aumenta la capacidad de población (+2).', costWood: 17, costFood: 11, popBonus: 2 },
    { id: 'farm', name: 'Granja', desc: 'Produce alimento constante con obreros.', costWood: 46 },
    { id: 'sawmill', name: 'Aserradero', desc: 'Produce madera constante con obreros.', costWood: 23 },
    { id: 'warehouse', name: 'Almacén', desc: 'Aumenta la capacidad de almacenamiento (+100 Alimento, +100 Madera, +50 Piedra).', costWood: 88, costStone: 28, storageBonus: { food: 100, wood: 100, stone: 50 } },
    { id: 'library', name: 'Biblioteca', desc: 'Produce puntos de Ciencia por segundo.', costWood: 100, costStone: 50, reqTech: 'writing' },
    { id: 'communal_house', name: 'Casa Comunal', desc: 'Centro de mando para la gestión de la aldea y elección de un Líder.', costWood: 150, costStone: 80, reqTech: 'leadership' }
  ];

  buildingsData.forEach(b => {
    // Si requiere tecnología y no está investigada, no lo mostramos aún
    if (b.reqTech && !isTechnologyCompleted(state, b.reqTech)) return;

    const count = state.buildings[b.id]?.count || 0;
    const woodVal = state.resources.wood.value ?? state.resources.wood;
    const stoneVal = state.resources.stone.value ?? state.resources.stone;
    const foodVal = state.resources.food.value ?? state.resources.food;

    let hasResources = true;
    if (b.costWood && woodVal < b.costWood) hasResources = false;
    if (b.costStone && stoneVal < b.costStone) hasResources = false;
    if (b.costFood && foodVal < b.costFood) hasResources = false;

    const card = document.createElement('div');
    card.className = 'building-card';

    let costText = '';
    if (b.costWood) costText += `${b.costWood} Madera `;
    if (b.costStone) costText += `${b.costStone} Piedra `;
    if (b.costFood) costText += `${b.costFood} Alimento `;

    card.innerHTML = `
      <h4>${b.name} (Poseídos: ${count})</h4>
      <p>${b.desc}</p>
      <p>Costo: ${costText}</p>
      <button class="btn-build" ${!hasResources ? 'disabled' : ''}>
        ${hasResources ? 'Construir' : 'Faltan materiales'}
      </button>
    `;

    const btn = card.querySelector('.btn-build');
    if (btn && hasResources) {
      btn.addEventListener('click', () => {
        if (b.costWood) state.resources.wood.value -= b.costWood;
        if (b.costStone) state.resources.stone.value -= b.costStone;
        if (b.costFood) state.resources.food.value -= b.costFood;

        if (!state.buildings[b.id]) state.buildings[b.id] = { count: 0, workers: 0 };
        state.buildings[b.id].count += 1;

        if (b.popBonus) {
          state.population.max += b.popBonus;
        }

        // Incremento de capacidad de almacenamiento para los recursos
        if (b.storageBonus) {
          for (const [resKey, bonusAmount] of Object.entries(b.storageBonus)) {
            if (state.resources[resKey] && typeof state.resources[resKey] === 'object') {
              state.resources[resKey].max += bonusAmount;
            }
          }
        }

        addLog(`Construiste: ${b.name}`);
        renderUI(state);
        window.dispatchEvent(new CustomEvent('state:updated'));
      });
    }

    container.appendChild(card);
  });
}

export function renderPopulationControls(state) {
  const container = document.getElementById('population-controls');
  if (!container) return;

  container.innerHTML = '';

  const jobBuildings = [
    { id: 'farm', name: 'Granja', jobName: 'Agricultores', maxPerBuilding: 2 },
    { id: 'sawmill', name: 'Aserradero', jobName: 'Leñadores', maxPerBuilding: 2 },
    { id: 'library', name: 'Biblioteca', jobName: 'Eruditos', maxPerBuilding: 1, reqTech: 'writing' }
  ];

  jobBuildings.forEach(job => {
    const building = state.buildings[job.id];
    if (!building || building.count <= 0) return;
    if (job.reqTech && !isTechnologyCompleted(state, job.reqTech)) return;

    const currentWorkers = building.workers || 0;
    const maxCapacity = building.count * job.maxPerBuilding;
    const unassigned = state.population.total - state.population.workers;

    const card = document.createElement('div');
    card.className = 'building-card';
    card.innerHTML = `
      <h4>${job.name} - ${job.jobName}</h4>
      <p>Asignados: ${currentWorkers} / ${maxCapacity}</p>
      <div style="display: flex; gap: 10px;">
        <button class="btn-add-worker" ${unassigned <= 0 || currentWorkers >= maxCapacity ? 'disabled' : ''}>+ Asignar</button>
        <button class="btn-remove-worker" ${currentWorkers <= 0 ? 'disabled' : ''}>- Quitar</button>
      </div>
    `;

    const btnAdd = card.querySelector('.btn-add-worker');
    const btnRemove = card.querySelector('.btn-remove-worker');

    if (btnAdd && unassigned > 0 && currentWorkers < maxCapacity) {
      btnAdd.addEventListener('click', () => {
        state.buildings[job.id].workers = currentWorkers + 1;
        state.population.workers += 1;
        addLog(`Asignaste 1 obrero a ${job.name}`);
        renderUI(state);
        window.dispatchEvent(new CustomEvent('state:updated'));
      });
    }

    if (btnRemove && currentWorkers > 0) {
      btnRemove.addEventListener('click', () => {
        state.buildings[job.id].workers = currentWorkers - 1;
        state.population.workers -= 1;
        addLog(`Quitaste 1 obrero de ${job.name}`);
        renderUI(state);
        window.dispatchEvent(new CustomEvent('state:updated'));
      });
    }

    container.appendChild(card);
  });
}