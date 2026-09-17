import { TECHS_DATA, canResearch, researchTech, isTechnologyCompleted } from './techs.js';

export function renderUI(gameState) {
  const state = gameState || window.state;
  if (!state) return;

  renderResourceMonitor(state);
  renderTechPanel(state);
  renderBuildingCards(state);
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

    const card = document.createElement('div');
    card.className = `tech-card ${completed ? 'completed' : ''}`;

    card.innerHTML = `
      <h4>${tech.name}</h4>
      <p>${tech.description}</p>
      <p>Costo: ${tech.cost.science} Ciencia</p>
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
    { id: 'shelter', name: 'Refugio', desc: 'Aumenta la capacidad máxima de población.', costWood: 17, costFood: 11 },
    { id: 'farm', name: 'Granja', desc: 'Produce alimento constante con obreros.', costWood: 46 },
    { id: 'sawmill', name: 'Aserradero', desc: 'Produce madera constante.', costWood: 23 },
    { id: 'warehouse', name: 'Almacén', desc: 'Aumenta capacidad de almacenamiento.', costWood: 88, costStone: 28 },
    { id: 'library', name: 'Biblioteca', desc: 'Produce puntos de Ciencia por segundo.', costWood: 100, costStone: 50, reqTech: 'writing' }
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

        if (!state.buildings[b.id]) state.buildings[b.id] = { count: 0 };
        state.buildings[b.id].count += 1;

        renderUI(state);
        window.dispatchEvent(new CustomEvent('state:updated'));
      });
    }

    container.appendChild(card);
  });
}