// Matriz Unificada de Recursos
const resources = {
  // Población (val es entero, progress acumula el crecimiento de 0 a 1)
  // popTech y popProf tienen max: Infinity para no mostrar límites /0 erróneos
  popUnskilled: { name: "Obreros", val: 0, max: 0, rate: 0, progress: 0, discovered: true, assigned: 0 },
  popTech: { name: "Técnicos", val: 0, max: Infinity, rate: 0, progress: 0, discovered: false, assigned: 0 },
  popProf: { name: "Profesionales", val: 0, max: Infinity, rate: 0, progress: 0, discovered: false, assigned: 0 },
  science: { name: "Ciencia / I+D", val: 0, max: 500, rate: 0, discovered: false },

  // Agroalimentario y Forestal
  food: { name: "Alimentos", val: 0, max: 200, rate: 0, discovered: true },
  wood: { name: "Madera", val: 0, max: 100, rate: 0, discovered: false },

  // Energéticos e Hidrocarburos
  power: { name: "Electricidad (MW)", val: 0, max: 50, rate: 0, discovered: false },
  oil: { name: "Petróleo Crudo", val: 0, max: 100, rate: 0, discovered: false },
  gas: { name: "Gas Natural", val: 0, max: 100, rate: 0, discovered: false },

  // Monedas
  ves: { name: "Bolívares (Bs)", val: 0, max: 1000, rate: 0, discovered: false },
  usd: { name: "Divisas ($USD)", val: 0, max: 50, rate: 0, discovered: false }
};

let costDiscount = 0;

function formatNum(num) {
  if (num === Infinity) return "∞";
  if (num >= 1000000) return (num / 1000000).toFixed(2) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "k";
  return Number.isInteger(num) ? num.toString() : num.toFixed(1);
}

function gatherFood(amount) {
  resources.food.val = Math.min(resources.food.max, resources.food.val + amount);
  log(`Recolectaste +${amount} de Alimentos.`, "positive");
  render();
}

function discoverResource(key) {
  if (resources[key] && !resources[key].discovered) {
    resources[key].discovered = true;
    log(`¡Nuevo recurso descubierto: ${resources[key].name}!`, "positive");
  }
}

function tradeResource(type, action) {
  if (type === 'food') {
    if (action === 'sell' && resources.food.val >= 5) {
      resources.food.val -= 5;
      resources.ves.val = Math.min(resources.ves.max, resources.ves.val + 15);
      log("Mercado: Vendiste 5 Alimentos por 15 Bs.", "positive");
    } else if (action === 'buy' && resources.ves.val >= 20) {
      resources.ves.val -= 20;
      resources.food.val = Math.min(resources.food.max, resources.food.val + 5);
      log("Mercado: Compraste 5 Alimentos por 20 Bs.", "positive");
    }
  } else if (type === 'oil' && action === 'sell' && resources.oil.val >= 2) {
    resources.oil.val -= 2;
    resources.usd.val = Math.min(resources.usd.max, resources.usd.val + 5);
    log("Exportación: Vendiste 2 Petróleo por 5 $USD.", "positive");
  } else if (type === 'gas' && action === 'sell' && resources.gas.val >= 2) {
    resources.gas.val -= 2;
    resources.ves.val = Math.min(resources.ves.max, resources.ves.val + 30);
    log("Mercado: Vendiste 2 Gas por 30 Bs.", "positive");
  }
  render();
}

function getBuildingCost(costObj, count) {
  const finalCosts = {};
  for (let res in costObj) {
    finalCosts[res] = Math.floor(costObj[res] * Math.pow(1.15, count) * (1 - costDiscount));
  }
  return finalCosts;
}

function checkCosts(costObj, count) {
  const costs = getBuildingCost(costObj, count);
  for (let res in costs) {
    if (!resources[res] || resources[res].val < costs[res]) return false;
  }
  return true;
}

function payCosts(costObj, count) {
  const costs = getBuildingCost(costObj, count);
  for (let res in costs) {
    resources[res].val -= costs[res];
  }
}
// resources.js - Utilidades de formato numérico y gestión de recursos

// Función de formato numérico limpio para la UI y el Sidebar
export function formatNumber(value) {
    if (value === undefined || value === null) return "0";
    if (value >= 1e6) {
        return (value / 1e6).toFixed(2) + "M";
    } else if (value >= 1e3) {
        return (value / 1e3).toFixed(1) + "k";
    }
    return Math.floor(value).toLocaleString();
}

// Validación y descuento seguro de costes
export function canAfford(state, costObj) {
    for (const [resKey, amount] of Object.entries(costObj)) {
        if (!state.resources[resKey] || state.resources[resKey].value < amount) {
            return false;
        }
    }
    return true;
}

export function deductCost(state, costObj) {
    if (!canAfford(state, costObj)) return false;
    for (const [resKey, amount] of Object.entries(costObj)) {
        state.resources[resKey].value -= amount;
    }
    return true;
}