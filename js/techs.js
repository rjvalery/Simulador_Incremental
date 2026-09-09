// Estado global del juego
const state = {
  tradeUnlocked: false,
  internationalTradeUnlocked: false,
  hasLeader: false,
  activeLeader: null,
  autoAssignUnlocked: false, // Habilitado vía investigación
  autoAssignActive: false    // Control del Botón Toggle
};

const techs = {
  localTrade: {
    name: "Comercio Local y Ferias",
    desc: "Permite la compra y venta de alimentos y productos básicos por Bolívares.",
    cost: { food: 25 },
    researched: false,
    unlockCheck: () => buildings.farm.count >= 1,
    onResearch: () => {
      state.tradeUnlocked = true;
      discoverResource("ves");
      log("¡Módulo de Comercio Local activado!", "positive");
    }
  },
  councilElection: {
    name: "Fundar Consejo Comunal",
    desc: "Nombra al primer Líder del Asentamiento para desbloquear la Pestaña de Leyes.",
    cost: { food: 40, ves: 50 },
    researched: false,
    unlockCheck: () => (resources.popUnskilled.val + resources.popTech.val) >= 8 && state.tradeUnlocked,
    onResearch: () => {
      state.hasLeader = true;
      state.activeLeader = "Líder Agrícola (+10% producción de alimentos)";
      log("¡Líder designado! Se ha desbloqueado la pestaña de Leyes y Gobernanza.", "positive");
    }
  },
  laborPlanning: {
    name: "Oficina de Planificación Laboral",
    desc: "Desbloquea la Automatización de Empleo mediante un interruptor (Toggle).",
    cost: { ves: 120, food: 30 },
    researched: false,
    unlockCheck: () => state.hasLeader && buildings.lumberMill.count >= 1,
    onResearch: () => {
      state.autoAssignUnlocked = true;
      state.autoAssignActive = true; // Activar automatización automáticamente al investigar
      log("¡Oficina de Trabajo fundada! Se ha habilitado la asignación automática de empleo.", "positive");
    }
  },
  foreignTrade: {
    name: "Comercio Exterior y Exportaciones",
    desc: "Habilita la venta de hidrocarburos para la obtención de Divisas ($USD).",
    cost: { science: 60 },
    researched: false,
    unlockCheck: () => buildings.oilWell.count >= 1,
    onResearch: () => {
      state.internationalTradeUnlocked = true;
      discoverResource("usd");
      log("¡Módulo de Comercio Exterior activado!", "positive");
    }
  },
  basicAgro: {
    name: "Agronomía Técnica",
    desc: "Reduce los costos de construcción generales en un 10%.",
    cost: { science: 50 },
    researched: false,
    unlockCheck: () => resources.science.discovered,
    onResearch: () => { costDiscount += 0.10; }
  }
};

const laws = {
  agrarianLaw: {
    name: "Ley de Tierras y Producción",
    desc: "Otorga un bono permanente de +25% a la producción de alimentos.",
    cost: { ves: 100 },
    active: false,
    enact: function() {
      if (resources.ves.val >= this.cost.ves && !this.active) {
        resources.ves.val -= this.cost.ves;
        this.active = true;
        log("Ley promulgada: Ley de Tierras y Producción.", "positive");
        render();
      }
    }
  }
};

function research(key) {
  const t = techs[key];
  if (!t.researched && checkCosts(t.cost, 0)) {
    payCosts(t.cost, 0);
    t.researched = true;
    t.onResearch();
    render();
  }
}

function toggleAutoAssign() {
  state.autoAssignActive = !state.autoAssignActive;
  log(`Asignación Automática de Empleo: ${state.autoAssignActive ? "ACTIVADA" : "DESACTIVADA"}`, "positive");
  render();
}