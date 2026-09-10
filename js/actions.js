import { GameState } from './state.js';
import { eventBus } from './eventBus.js';

export const Actions = {
  getCost(building) {
    const cost = {};
    for (let resourceKey in building.baseCost) {
      cost[resourceKey] = Math.floor(
        building.baseCost[resourceKey] * Math.pow(building.multiplier, building.count)
      );
    }
    return cost;
  },

  canAfford(cost) {
    for (let resourceKey in cost) {
      if (!GameState.resources[resourceKey] || GameState.resources[resourceKey].val < cost[resourceKey]) {
        return false;
      }
    }
    return true;
  },

  manualHarvest() {
    const res = GameState.resources;
    res.food.val = Math.min(res.food.max, res.food.val + 1);

    if (Math.random() < 0.35) {
      res.wood.val = Math.min(res.wood.max, res.wood.val + 1);
      res.wood.discovered = true;
    }

    if (Math.random() < 0.20) {
      res.stone.val = Math.min(res.stone.max, res.stone.val + 1);
      res.stone.discovered = true;
    }

    if (!GameState.buildings.housing.unlocked && (res.wood.val >= 3 || res.stone.val >= 1)) {
      GameState.buildings.housing.unlocked = true;
      eventBus.emit('log:add', "Has descubierto materiales para construir Viviendas.");
    }

    eventBus.emit('state:updated');
  },

  buildBuilding(key) {
    const building = GameState.buildings[key];
    const cost = this.getCost(building);

    if (this.canAfford(cost)) {
      for (let resourceKey in cost) {
        GameState.resources[resourceKey].val -= cost[resourceKey];
      }
      building.count++;
      eventBus.emit('log:add', `Construido: ${building.name} (${building.count})`);

      if (key === 'housing') {
        GameState.resources.popUnskilled.max += 2;
        GameState.resources.popUnskilled.discovered = true;
        if (building.count === 1) {
          GameState.resources.popUnskilled.val = 1;
          eventBus.emit('log:add', "Un nuevo habitante ha llegado al asentamiento.");
          GameState.buildings.farm.unlocked = true;
          GameState.buildings.woodcutter.unlocked = true;
          GameState.buildings.quarry.unlocked = true;
        }
      }

      eventBus.emit('state:updated');
    }
  },

  assignJob(key, amount) {
    const res = GameState.resources.popUnskilled;
    const totalAssigned = res.assigned.farm + res.assigned.woodcutter + res.assigned.quarry;

    if (amount > 0 && res.val > totalAssigned) {
      res.assigned[key]++;
    } else if (amount < 0 && res.assigned[key] > 0) {
      res.assigned[key]--;
    }

    eventBus.emit('state:updated');
  },

  researchTech(key) {
    const tech = GameState.techs[key];
    if (this.canAfford(tech.cost)) {
      for (let resourceKey in tech.cost) {
        GameState.resources[resourceKey].val -= tech.cost[resourceKey];
      }
      tech.unlocked = true;
      eventBus.emit('log:add', `Investigado: ${tech.name}`);
      eventBus.emit('state:updated');
    }
  }
};