import { GameState } from './state.js';
import { eventBus } from './eventBus.js';

export const Engine = {
  intervalId: null,

  start() {
    if (this.intervalId) return;
    this.intervalId = setInterval(() => this.tick(), 1000);
  },

  stop() {
    clearInterval(this.intervalId);
    this.intervalId = null;
  },

  tick() {
    if (GameState.paused) return;
    this.updateEconomy();
    this.checkPopulationGrowth();
    eventBus.emit('state:updated');
  },

  updateEconomy() {
    const res = GameState.resources;
    
    // Reset completo de tasas de producción para todos los recursos
    res.food.rate = 0; 
    res.wood.rate = 0; 
    res.stone.rate = 0; 
    res.money.rate = 0;
    res.science.rate = 0;

    // Consumo de alimento por población
    const totalPop = res.popUnskilled.val;
    if (totalPop > 0) {
      res.food.rate -= totalPop * 0.20;
    }

    // Producción por asignación de empleos
    res.food.rate += res.popUnskilled.assigned.farm * 0.40;
    res.wood.rate += res.popUnskilled.assigned.woodcutter * 0.35;
    res.stone.rate += res.popUnskilled.assigned.quarry * 0.25;

    // Aplicación de cambios respetando límites máximos y mínimos
    for (let k in res) {
      if (res[k].val !== undefined && res[k].rate !== undefined) {
        res[k].val = Math.max(0, Math.min(res[k].max || Infinity, res[k].val + res[k].rate));
      }
    }
  },

  checkPopulationGrowth() {
    const pop = GameState.resources.popUnskilled;
    
    // Solo crecemos si ya se descubrió la población y hay espacio libre
    if (!pop.discovered || pop.val >= pop.max) return;

    // Probabilidad del 2.5% cada segundo de que llegue un habitante si hay alimento suficiente
    if (GameState.resources.food.val > 10 && Math.random() < 0.025) {
      pop.val++;
      eventBus.emit('log:add', "Un nuevo habitante ha llegado al asentamiento atraído por las condiciones.");
    }
  }
};