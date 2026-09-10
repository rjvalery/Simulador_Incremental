import { GameState } from './state.js';
import { Actions } from './actions.js';
import { Storage } from './storage.js';
import { eventBus } from './eventBus.js';

export const UI = {
  init() {
    this.bindEvents();
    this.subscribeToBus();
    this.render();
  },

  subscribeToBus() {
    eventBus.on('state:updated', () => this.render());
    eventBus.on('log:add', (msg) => this.addLogEntry(msg));
  },

  bindEvents() {
    document.querySelectorAll('.tab-bar .tab-link').forEach(btn => {
      btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab, e.target));
    });

    document.querySelectorAll('.filter-tabs .tab-link').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.filter-tabs .tab-link').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        GameState.activeBuildingFilter = e.target.dataset.filter;
        this.renderBuildings();
      });
    });

    document.getElementById('btn-harvest').addEventListener('click', () => Actions.manualHarvest());
    document.getElementById('btn-save').addEventListener('click', () => Storage.save());
    document.getElementById('btn-clear-log').addEventListener('click', () => this.clearLog());
    
    document.getElementById('btn-toggle-pause').addEventListener('click', () => {
      GameState.paused = !GameState.paused;
      document.getElementById('btn-toggle-pause').innerText = GameState.paused ? 'reanudar' : 'pausar';
    });
  },

  switchTab(tabId, element) {
    document.querySelectorAll('.tab-bar .tab-link').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));

    if (element) element.classList.add('active');
    
    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) targetSection.classList.remove('hidden');

    document.getElementById('current-tab-title').innerText = element ? element.innerText : 'Hoguera';
  },

  render() {
    this.renderResources();
    this.renderBuildings();
    this.renderJobs();
    this.renderTechs();
  },

  renderResources() {
    const container = document.getElementById('resources-container');
    container.innerHTML = '';

    for (let key in GameState.resources) {
      const res = GameState.resources[key];
      if (!res.discovered) continue;

      const row = document.createElement('div');
      row.className = 'resource-row';

      if (res.desc && res.effect) {
        row.onmouseenter = () => this.showTooltip(res.name, res.desc, res.effect);
        row.onmouseleave = () => this.clearTooltip();
      }

      if (key === 'popUnskilled') {
        const assigned = res.assigned.farm + res.assigned.woodcutter + res.assigned.quarry;
        row.innerHTML = `
          <span class="resource-name">${res.name}</span>
          <span class="resource-val">${res.val}</span>
          <span class="resource-max">/${res.max}</span>
          <span class="resource-rate">(${res.val - assigned} libres)</span>
        `;
      } else {
        const rateClass = res.rate < 0 ? 'negative' : '';
        const rateStr = res.rate !== 0 ? `${res.rate >= 0 ? '+' : ''}${res.rate.toFixed(2)}/s` : '';
        row.innerHTML = `
          <span class="resource-name">${res.name}</span>
          <span class="resource-val">${res.val.toFixed(2)}</span>
          <span class="resource-max">/${res.max}</span>
          <span class="resource-rate ${rateClass}">${rateStr}</span>
        `;
      }
      container.appendChild(row);
    }
  },

  renderBuildings() {
    const container = document.getElementById('buildings-container');
    container.innerHTML = '';

    for (let key in GameState.buildings) {
      const b = GameState.buildings[key];
      if (!b.unlocked) continue;

      const cost = Actions.getCost(b);
      const canAfford = Actions.canAfford(cost);
      const filter = GameState.activeBuildingFilter;

      if (filter === 'available' && !canAfford) continue;
      if (filter === 'enabled' && b.count === 0) continue;

      const item = document.createElement('div');
      item.className = 'building-item';

      item.onmouseenter = () => this.showTooltip(b.name, b.desc, b.effect);
      item.onmouseleave = () => this.clearTooltip();

      item.innerHTML = `
        <div class="building-info">
          <span class="building-name">${b.name} (${b.count})</span>
          <div class="building-cost">${this.formatCost(cost)}</div>
        </div>
        <div>
          <button class="btn-action btn-build" style="min-width:70px; padding:4px 8px;" ${!canAfford ? 'disabled' : ''}>Construir</button>
        </div>
      `;

      item.querySelector('.btn-build').addEventListener('click', () => Actions.buildBuilding(key));
      container.appendChild(item);
    }
  },

  renderJobs() {
    const container = document.getElementById('jobs-container');
    container.innerHTML = '';
    const res = GameState.resources.popUnskilled;
    const free = res.val - (res.assigned.farm + res.assigned.woodcutter + res.assigned.quarry);

    const jobs = [
      { key: 'farm', name: 'Granjero', building: 'farm' },
      { key: 'woodcutter', name: 'Leñador', building: 'woodcutter' },
      { key: 'quarry', name: 'Minero', building: 'quarry' }
    ];

    jobs.forEach(job => {
      if (GameState.buildings[job.building].count > 0) {
        const div = document.createElement('div');
        div.className = 'building-item';
        div.innerHTML = `
          <div class="building-info">
            <span class="building-name">${job.name}</span>
            <div class="building-cost">Asignados: ${res.assigned[job.key]}</div>
          </div>
          <div>
            <button class="btn-action btn-sub" style="min-width:30px; padding:2px 6px;">-</button>
            <button class="btn-action btn-add" style="min-width:30px; padding:2px 6px;" ${free <= 0 ? 'disabled' : ''}>+</button>
          </div>
        `;

        div.querySelector('.btn-sub').addEventListener('click', () => Actions.assignJob(job.key, -1));
        div.querySelector('.btn-add').addEventListener('click', () => Actions.assignJob(job.key, 1));
        container.appendChild(div);
      }
    });
  },

  renderTechs() {
    const container = document.getElementById('techs-container');
    container.innerHTML = '';

    for (let key in GameState.techs) {
      const tech = GameState.techs[key];
      if (tech.unlocked) continue;

      const item = document.createElement('div');
      item.className = 'building-item';
      item.innerHTML = `
        <div class="building-info">
          <span class="building-name">${tech.name}</span>
          <div class="building-cost">${tech.desc} | Costo: ${this.formatCost(tech.cost)}</div>
        </div>
        <button class="btn-action btn-tech" style="min-width:80px; padding:4px;" ${!Actions.canAfford(tech.cost) ? 'disabled' : ''}>Investigar</button>
      `;

      item.querySelector('.btn-tech').addEventListener('click', () => Actions.researchTech(key));
      container.appendChild(item);
    }
  },

  showTooltip(title, desc, effect) {
    document.getElementById('tt-title').innerText = title;
    document.getElementById('tt-desc').innerText = desc;
    document.getElementById('tt-effect').innerText = `Efecto: ${effect}`;
  },

  clearTooltip() {
    document.getElementById('tt-title').innerText = "Desglose de Estructura";
    document.getElementById('tt-desc').innerText = "Pasa el cursor sobre un edificio o empleo para ver sus detalles, efectos y costos.";
    document.getElementById('tt-effect').innerText = "";
  },

  formatCost(cost) {
    return Object.keys(cost).map(k => `${cost[k]} ${GameState.resources[k].name}`).join(', ');
  },

  addLogEntry(msg) {
    const box = document.getElementById('log-container');
    const entry = document.createElement('div');
    entry.className = 'log-entry positive';
    entry.innerText = msg;
    box.insertBefore(entry, box.firstChild);
  },

  clearLog() {
    document.getElementById('log-container').innerHTML = '';
  }
};