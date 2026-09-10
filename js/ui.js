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
  
  // ... resto de tus métodos de UI ...
  
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
  }
};