// Edificios con seguimiento de asignación manual de trabajadores (assignedWorkers)
const buildings = {
  housing: { 
    name: "Refugio / Vivienda", count: 0, cost: { food: 10 }, 
    baseCapacity: 0, reqSkill: "none", unlocked: false, assignedWorkers: 0,
    unlockCheck: () => resources.food.val >= 10 || buildings.housing.count > 0,
    produces: {}, consumes: {} 
  },
  farm: { 
    name: "Huerto Comunitario", count: 0, cost: { food: 15 }, 
    baseCapacity: 2, reqSkill: "popUnskilled", unlocked: false, assignedWorkers: 0,
    unlockCheck: () => (resources.popUnskilled.max > 0 && resources.food.val >= 12) || buildings.farm.count > 0,
    produces: { food: 1.5 }, consumes: {} 
  },
  lumberMill: {
    name: "Aserradero / Leñera", count: 0, cost: { food: 20 },
    baseCapacity: 2, reqSkill: "popUnskilled", unlocked: false, assignedWorkers: 0,
    unlockCheck: () => buildings.farm.count >= 1 || buildings.lumberMill.count > 0,
    produces: { wood: 1 }, consumes: {},
    onBuild: () => discoverResource("wood")
  },
  taxOffice: { 
    name: "Oficina del SENIAT", count: 0, cost: { food: 30, ves: 50 }, 
    baseCapacity: 1, reqSkill: "popProf", unlocked: false, assignedWorkers: 0,
    unlockCheck: () => resources.ves.discovered || buildings.taxOffice.count > 0,
    produces: { ves: 5 }, consumes: {} 
  },
  technicalSchool: { 
    name: "Escuela Técnica (INCES)", count: 0, cost: { food: 40, wood: 20 }, 
    baseCapacity: 0, reqSkill: "none", unlocked: false, assignedWorkers: 0,
    unlockCheck: () => buildings.lumberMill.count >= 1 || buildings.technicalSchool.count > 0,
    produces: {}, consumes: { food: 1 },
    onBuild: () => {
      discoverResource("popTech");
      discoverResource("science");
    }
  },
  powerGrid: { 
    name: "Cuadrilla Eléctrica", count: 0, cost: { food: 50, wood: 30 }, 
    baseCapacity: 2, reqSkill: "popTech", unlocked: false, assignedWorkers: 0,
    unlockCheck: () => resources.popTech.val > 0 || buildings.powerGrid.count > 0,
    produces: { power: 15 }, consumes: {},
    onBuild: () => discoverResource("power")
  },
  university: { 
    name: "Universidad Central", count: 0, cost: { ves: 200, usd: 10 }, 
    baseCapacity: 0, reqSkill: "none", unlocked: false, assignedWorkers: 0,
    unlockCheck: () => buildings.technicalSchool.count >= 1 || buildings.university.count > 0,
    produces: {}, consumes: { ves: 5, power: 2 },
    onBuild: () => discoverResource("popProf")
  },
  oilWell: { 
    name: "Pozo Petrolero (PDVSA)", count: 0, cost: { ves: 250, usd: 15 }, 
    baseCapacity: 2, reqSkill: "popTech", unlocked: false, assignedWorkers: 0,
    unlockCheck: () => resources.power.val > 5 || buildings.oilWell.count > 0,
    produces: { oil: 2 }, consumes: { power: 3 },
    onBuild: () => discoverResource("oil")
  }
};

function getBuildingCapacity(key) {
  const b = buildings[key];
  if (b.baseCapacity === 0 || b.count === 0) return 0;
  let totalCap = 0;
  for (let i = 1; i <= b.count; i++) {
    totalCap += Math.floor(b.baseCapacity * Math.pow(1.5, i - 1));
  }
  return totalCap;
}

function assignWorker(buildingKey, amount) {
  const b = buildings[buildingKey];
  const reqRes = resources[b.reqSkill];
  if (!reqRes) return;

  const maxCap = getBuildingCapacity(buildingKey);
  const unassigned = Math.floor(reqRes.val) - reqRes.assigned;

  if (amount > 0) {
    // Asignar
    const toAdd = Math.min(amount, unassigned, maxCap - b.assignedWorkers);
    if (toAdd > 0) {
      b.assignedWorkers += toAdd;
      reqRes.assigned += toAdd;
    }
  } else if (amount < 0) {
    // Desasignar
    const toRemove = Math.min(Math.abs(amount), b.assignedWorkers);
    b.assignedWorkers -= toRemove;
    reqRes.assigned -= toRemove;
  }
  render();
}

function build(key) {
  const b = buildings[key];
  if (checkCosts(b.cost, b.count)) {
    payCosts(b.cost, b.count);
    b.count++;
    
    if (key === 'housing') {
      resources.popUnskilled.max += 5;
    }

    if (b.onBuild) b.onBuild();
    
    log(`Construido: ${b.name} (Nivel ${b.count})`, "positive");
    render();
  }
}