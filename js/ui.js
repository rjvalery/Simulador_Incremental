import { TECHS_DATA, canResearch, researchTech, isTechnologyCompleted } from './techs.js';
import { setLeader } from './actions.js';
import { LEADERS, ensureGovernance } from './governance.js';
import { UNITS_DATA, getMaxMilitaryCapacity, trainUnit } from './military.js';
import { initMap, attackCamp, exploreCell, MAP_SIZE } from './map.js';

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

  renderResources(state);
  renderResourceMonitor(state);
  renderTechPanel(state);
  renderBuildingCards(state);
}

export function renderResources(state) {
  const container = document.getElementById('resources-container');
  if (!container) return;

  const resourceKeys = ['food', 'wood', 'stone', 'gold', 'science', 'iron', 'coal'];
  const resourceNames = {
    food: 'Comida', wood: 'Madera', stone: 'Piedra',
    gold: 'Oro', science: 'Ciencia', iron: 'Hierro', coal: 'Carbón'
  };

  let html = '<h3>Recursos</h3><ul class="resource-list">';

  resourceKeys.forEach(key => {
    const res = state.resources[key];
    if (!res) return;

    const value = Number(res.value ?? res);
    const val = value.toFixed(1);
    const max = res.max ?? '∞';
    const rate = state.resourceRates?.[key] || 0;
    const rateClass = rate > 0 ? 'rate-positive' : rate < 0 ? 'rate-negative' : 'rate-neutral';
    const rateSign = rate > 0 ? '+' : '';
    const rateText = rate !== 0
      ? `<span class="${rateClass}">(${rateSign}${rate.toFixed(1)}/s)</span>`
      : '';

    html += `
      <li class="resource-item">
        <span class="res-name"><strong>${resourceNames[key]}:</strong></span>
        <span class="res-value">${val} / ${max}</span>
        <span class="res-rate">${rateText}</span>
      </li>
    `;
  });

  html += '</ul>';
  container.innerHTML = html;
}

function renderResourceMonitor(state) {
  const getVal = (res) => (typeof res === 'object' ? res.value : res);
  const getMax = (res) => (typeof res === 'object' ? res.max : 0);
  const resourcesToDisplay = ['food', 'wood', 'stone', 'gold', 'science', 'iron', 'coal'];
  const resourceNames = {
    food: 'Alimentos',
    wood: 'Madera',
    stone: 'Piedra',
    gold: 'Oro',
    science: 'Ciencia',
    iron: 'Hierro',
    coal: 'Carbón'
  };
  const popEl = document.getElementById('res-pop');
  const workersEl = document.getElementById('res-workers');

  const resourceList = document.querySelector('.resource-group ul');
  if (resourceList) {
    for (const resourceKey of resourcesToDisplay) {
      let resourceElement = document.getElementById(`res-${resourceKey}`);
      if (!resourceElement) {
        const item = document.createElement('li');
        item.innerHTML = `${resourceNames[resourceKey]}: <span id="res-${resourceKey}"></span>`;
        resourceList.appendChild(item);
        resourceElement = item.querySelector(`#res-${resourceKey}`);
      }

      const resource = state.resources[resourceKey];
      if (resourceElement && resource) {
        const decimals = ['food', 'wood'].includes(resourceKey) ? 1 : 0;
        const rate = state.resourceRates?.[resourceKey] || 0;
        const rateText = `${rate >= 0 ? '+' : ''}${rate.toFixed(2)}/s`;
        resourceElement.textContent = `${getVal(resource).toFixed(decimals)} / ${getMax(resource)} (${rateText})`;
      }
    }
  }
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
        gold: 'Oro',
        iron: 'Hierro',
        coal: 'Carbón'
      };
      return `${amount} ${nameMap[resKey] || resKey}`;
    }).join(', ');

    const card = document.createElement('div');
    card.className = `tech-card ${completed ? 'completed' : ''}`;
    card.dataset.tooltip = tech.description;
        card.innerHTML = \`
          <h4>${tech.name}</h4>
          <p><strong>Costo:</strong> ${costText || 'Gratis'} Ciencia</p>
          <button 
            class="btn-tech" 
            data-tech="${tech.id}"
            ${!available || completed ? 'disabled' : ''}>
            ${completed ? '✓ Investigado' : 'Investigar'}
          </button>
        \`;
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
    // --- ERA ANTIGUA ---
    { id: 'shelter', name: 'Refugio', desc: 'Beneficios: +2 Capacidad de Población.', costWood: 17, costFood: 11, popBonus: 2 },
    { id: 'farm', name: 'Granja', desc: 'Beneficios: Habilita el empleo de Granjeros para producir Alimento constante.', costWood: 46 },
    { id: 'sawmill', name: 'Aserradero', desc: 'Beneficios: Habilita el empleo de Leñadores para producir Madera constante.', costWood: 23 },
    { id: 'warehouse', name: 'Almacén', desc: 'Beneficios: +100 Alimento, +100 Madera, +50 Piedra, +25 Hierro, +25 Carbón a la capacidad máxima.', costWood: 88, costStone: 28, storageBonus: { food: 100, wood: 100, stone: 50, iron: 25, coal: 25 } },
    { id: 'library', name: 'Biblioteca', desc: 'Beneficios: Habilita el empleo de Sabios para generar Ciencia pasiva.', costWood: 100, costStone: 50, reqTech: 'writing' },
    { id: 'communal_house', name: 'Casa Comunal', desc: 'Beneficios: Desbloquea elección de Líder, +50 Capacidad de Oro y +5% de eficacia al bono del Líder por nivel.', costWood: 150, costStone: 80, reqTech: 'leadership', storageBonus: { gold: 50 } },

    // --- ERA CLÁSICA ---
    { id: 'mine', name: 'Mina', desc: 'Beneficios: Habilita el empleo de Mineros para extraer Piedra, Carbón e Hierro.', costWood: 120, costStone: 60, reqTech: 'mining' },
    { id: 'forge', name: 'Forja', desc: 'Beneficios: Procesa automaticamente Carbón y Piedra en Hierro refinado.', costWood: 150, costStone: 100, reqTech: 'metallurgy' },
    { id: 'barracks', name: 'Cuartel', desc: 'Beneficios: +10 Espacio para tropas militares y desbloquea el entrenamiento de unidades.', costWood: 200, costStone: 150, costIron: 30, reqTech: 'tactics' }
  ];

  buildingsData.forEach(b => {
    // Si requiere tecnología y no está investigada, no lo mostramos aún
    if (b.reqTech && !isTechnologyCompleted(state, b.reqTech)) return;

    const count = state.buildings[b.id]?.count || 0;
    const woodVal = state.resources.wood.value ?? state.resources.wood;
    const stoneVal = state.resources.stone.value ?? state.resources.stone;
    const foodVal = state.resources.food.value ?? state.resources.food;
    const ironVal = state.resources.iron.value ?? state.resources.iron;
    const coalVal = state.resources.coal.value ?? state.resources.coal;
    const goldVal = state.resources.gold.value ?? state.resources.gold;

    let hasResources = true;
    if (b.costWood && woodVal < b.costWood) hasResources = false;
    if (b.costStone && stoneVal < b.costStone) hasResources = false;
    if (b.costFood && foodVal < b.costFood) hasResources = false;
    if (b.costIron && ironVal < b.costIron) hasResources = false;
    if (b.costCoal && coalVal < b.costCoal) hasResources = false;
    if (b.costGold && goldVal < b.costGold) hasResources = false;

    const card = document.createElement('div');
    card.className = 'building-card';
    card.dataset.tooltip = b.desc;

    let costText = '';
    if (b.costWood) costText += `${b.costWood} Madera `;
    if (b.costStone) costText += `${b.costStone} Piedra `;
    if (b.costFood) costText += `${b.costFood} Alimento `;
    if (b.costIron) costText += `${b.costIron} Hierro `;
    if (b.costCoal) costText += `${b.costCoal} Carbón `;
    if (b.costGold) costText += `${b.costGold} Oro `;

    const levelText = b.id === 'communal_house' ? ` - Nivel ${count}` : '';
    card.innerHTML = `
      <h4>${b.name}${levelText} (Poseídos: ${count})</h4>
      <p><strong>Costo:</strong> ${costText}</p>
      <button class="btn-build" data-building="${b.id}" ${!hasResources ? 'disabled' : ''}>
        ${hasResources ? 'Construir' : 'Faltan materiales'}
      </button>
    `;

    const btn = card.querySelector('.btn-build');
    if (btn && hasResources) {
      btn.addEventListener('click', () => {
        if (b.costWood) state.resources.wood.value -= b.costWood;
        if (b.costStone) state.resources.stone.value -= b.costStone;
        if (b.costFood) state.resources.food.value -= b.costFood;
        if (b.costIron) state.resources.iron.value -= b.costIron;
        if (b.costCoal) state.resources.coal.value -= b.costCoal;
        if (b.costGold) state.resources.gold.value -= b.costGold;

        if (!state.buildings[b.id]) state.buildings[b.id] = { count: 0, workers: 0 };
        state.buildings[b.id].count += 1;

        if (b.id === 'communal_house') {
          state.governance = state.governance || { unlocked: false, leader: null, policies: [] };
          state.governance.unlocked = true;
        }

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

export function renderMilitaryPanel(state) {
  const container = document.getElementById('military-container');
  if (!container) return;

  if (!isTechnologyCompleted(state, 'tactics')) {
    container.innerHTML = '<p class="text-muted">Investiga Táctica Militar para entrenar tropas.</p>';
    return;
  }

  if (!state.buildings.barracks?.count) {
    container.innerHTML = '<p class="text-muted">Construye un Cuartel para entrenar tropas.</p>';
    return;
  }

  const military = state.military || {};
  const currentCapacity = Object.keys(UNITS_DATA)
    .reduce((total, unitId) => total + (military[unitId] || 0), 0);
  const maxCapacity = getMaxMilitaryCapacity(state);

  container.innerHTML = `
    <h3>Gestión Militar (${currentCapacity}/${maxCapacity} Soldados)</h3>
    <div class="military-units-grid">
    ${Object.values(UNITS_DATA).map(unit => `
      <div class="unit-card" data-tooltip="${unit.desc} | Atq: ${unit.stats.attack} Def: ${unit.stats.defense}">
        <h4>${unit.name} (${military[unit.id] || 0})</h4>
        <p><strong>Costo:</strong> ${Object.entries(unit.cost).map(([resourceKey, amount]) => `${amount} ${resourceKey}`).join(', ')}</p>
        <button class="btn-train" data-unit="${unit.id}">Entrenar</button>
      </div>
    `).join('')}
    </div>
  `;

  container.querySelectorAll('.btn-train').forEach(button => {
    button.addEventListener('click', () => {
      if (trainUnit(state, button.dataset.unit)) {
        renderUI(state);
      }
    });
  });
}

export function renderMapPanel(state) {
  const container = document.getElementById('map-container');
  if (!container) return;

  if (!state.unlockedTechs?.cartography) {
    container.innerHTML = '<p class="text-muted">Investiga <strong>Cartografía</strong> para desbloquear el Mapa de Exploración.</p>';
    return;
  }

  initMap(state);

  let html = `
    <h3>Mapa de la Región</h3>
    <div class="map-grid">
  `;

  for (let rowIndex = 0; rowIndex < MAP_SIZE; rowIndex++) {
    for (let columnIndex = 0; columnIndex < MAP_SIZE; columnIndex++) {
      const cell = state.mapData[rowIndex][columnIndex];

      if (!cell.revealed) {
        html += `<div class="map-tile fog" data-r="${rowIndex}" data-c="${columnIndex}" title="Casilla sin explorar (Click para explorar)">🌫️</div>`;
      } else if (cell.type === 'player_village') {
        html += '<div class="map-tile village" title="Nuestra Aldea">🏰</div>';
      } else if (cell.type === 'barbarian_camp') {
        const levelName = cell.enemy.level === 1 ? 'Campamento' : 'Fortín Bárbaro';
        html += `<div class="map-tile enemy" data-r="${rowIndex}" data-c="${columnIndex}" title="${levelName} (Poder: ${cell.enemy.power})">🏕️</div>`;
      } else if (cell.type === 'ruins') {
        html += '<div class="map-tile ruins" title="Ruinas Saqueadas">🏛️</div>';
      } else {
        const icon = cell.biome === 'forest' ? '🌲'
          : cell.biome === 'mountain' ? '⛰️'
            : cell.biome === 'water' ? '🌊' : '🌾';
        html += `<div class="map-tile biome-${cell.biome}">${icon}</div>`;
      }
    }
  }

  html += '</div>';
  container.innerHTML = html;

  container.querySelectorAll('.map-tile').forEach(tile => {
    tile.addEventListener('click', event => {
      const clickedTile = event.currentTarget;
      const rowIndex = Number.parseInt(clickedTile.getAttribute('data-r'), 10);
      const columnIndex = Number.parseInt(clickedTile.getAttribute('data-c'), 10);

      if (Number.isNaN(rowIndex) || Number.isNaN(columnIndex)) return;

      const cell = state.mapData[rowIndex][columnIndex];
      if (!cell.revealed) {
        exploreCell(state, rowIndex, columnIndex);
        renderUI(state);
      } else if (cell.type === 'barbarian_camp'
        && window.confirm(`¿Desplegar tropas para atacar el Campamento Bárbaro? (Poder Enemigo: ${cell.enemy.power})`)) {
        attackCamp(state, rowIndex, columnIndex);
        renderUI(state);
      }
    });
  });
}

function renderDefenseAlerts(state) {
  if (!state.mapData) return;

  let container = document.getElementById('defense-alerts');
  if (!container) {
    container = document.createElement('div');
    container.id = 'defense-alerts';
    container.className = 'building-card';
    document.querySelector('.main-content')?.prepend(container);
  }

  const military = state.military || {};
  const defensePower = (military.recruits || 0) * 8
    + (military.archers || 0) * 3
    + (military.cavalry || 0) * 15;
  const threats = state.mapData.flat().filter(cell => cell.type === 'barbarian_camp' && cell.enemy);

  if (threats.length === 0) {
    container.innerHTML = '<strong>Defensa:</strong> No hay amenazas detectadas.';
    container.className = 'building-card defense-alert defense-clear';
    return;
  }

  const dangerousThreats = threats.filter(cell => cell.enemy.power > defensePower);
  container.className = `building-card defense-alert ${dangerousThreats.length ? 'defense-warning' : 'defense-ready'}`;
  container.innerHTML = dangerousThreats.length
    ? `<strong>⚠️ Alerta de defensa:</strong> ${dangerousThreats.length} campamento(s) superan tu defensa (${defensePower}).`
    : `<strong>Defensa:</strong> Tus fuerzas pueden enfrentarse a las amenazas detectadas (${defensePower}).`;
}

export function renderPopulationControls(state) {
  const container = document.getElementById('population-controls');
  if (!container) return;

  // No reconstruir el panel mientras el usuario interactúa con el selector.
  const selectElement = document.getElementById('leader-select');
  if (selectElement && document.activeElement === selectElement) return;

  container.innerHTML = '';

  const communalHouses = state.buildings.communal_house?.count || 0;
  if (communalHouses > 0) {
    ensureGovernance(state);
    state.governance.unlocked = true;

    const governanceCard = document.createElement('div');
    governanceCard.className = 'building-card';
    governanceCard.innerHTML = `
      <h4>Gestión de la Aldea</h4>
      <p>Selecciona el rasgo del Líder para mejorar una línea de producción.</p>
      <label for="leader-select">Rasgo del Líder</label>
      <select id="leader-select">
        <option value="">Sin líder</option>
        ${Object.values(LEADERS).filter(leader => ['agrarian', 'industrial', 'scientific'].includes(leader.id)).map(leader => `
          <option value="${leader.id}" ${state.governance.leader === leader.id ? 'selected' : ''}>
            ${leader.name} - ${leader.description}
          </option>
        `).join('')}
      </select>
    `;

    const leaderSelect = governanceCard.querySelector('#leader-select');
    leaderSelect?.addEventListener('change', event => {
      const leaderKey = event.target.value;
      state.governance.leader = leaderKey || null;
      if (leaderKey) {
        setLeader(state, leaderKey);
      }
      renderUI(state);
      window.dispatchEvent(new CustomEvent('state:updated'));
    });

    container.appendChild(governanceCard);
  }

  const jobBuildings = [
    { id: 'farm', name: 'Granja', jobName: 'Agricultores', maxPerBuilding: 2 },
    { id: 'sawmill', name: 'Aserradero', jobName: 'Leñadores', maxPerBuilding: 2 },
    { id: 'library', name: 'Biblioteca', jobName: 'Eruditos', maxPerBuilding: 1, reqTech: 'writing' },
    { id: 'mine', name: 'Mina', jobName: 'Mineros', maxPerBuilding: 2 }
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