// Variable del estado global del sistema
window.state = window.state || {
  autoAssignUnlocked: false,
  autoAssignActive: false,
  tradeUnlocked: false,
  internationalTradeUnlocked: false,
  hasLeader: false,
  activeLeader: "",
  buildQueue: [] // Arreglo preparado para construcciones con tiempo (estilo Travian)
};

// Funciones de interacción UI para el Guardado
function exportSavePrompt() {
  const saveCode = SaveSystem.exportToString();
  navigator.clipboard.writeText(saveCode).then(() => {
    alert("¡Código de partida copiado al portapapeles!");
  }).catch(() => {
    prompt("Copia tu código de guardado manualmente:", saveCode);
  });
}

function importSavePrompt() {
  const code = prompt("Pega aquí tu código de partida guardada:");
  if (code) {
    if (SaveSystem.importFromString(code)) {
      alert("¡Partida cargada exitosamente!");
    }
  }
}

function confirmReset() {
  if (confirm("¿Estás seguro de que deseas reiniciar la partida? Se borrará todo el progreso guardado.")) {
    SaveSystem.resetGame();
  }
}

// Bucle principal del juego
function tick() {
  const now = Date.now();

  // 1. Procesar la cola de construcción (si existen obras con tiempo activo)
  if (state.buildQueue && state.buildQueue.length > 0) {
    state.buildQueue = state.buildQueue.filter(item => {
      if (now >= item.finishTime) {
        buildings[item.buildingId].count = item.targetLevel;
        log(`¡Construcción finalizada!: ${buildings[item.buildingId].name} Nivel ${item.targetLevel}`, "positive");
        return false;
      }
      return true;
    });
  }

  // 2. Lógica de desbloqueo de construcciones
  for (let k in buildings) {
    if (!buildings[k].unlocked && buildings[k].unlockCheck()) {
      buildings[k].unlocked = true;
      log(`¡Nueva opción disponible: ${buildings[k].name}!`, "positive");
    }
  }

  // 3. Crecimiento demográfico
  const totalPop = resources.popUnskilled.val + resources.popTech.val + resources.popProf.val;
  if (resources.popUnskilled.max > 0 && resources.food.val > 5 && totalPop < resources.popUnskilled.max) {
    resources.popUnskilled.progress += 0.08;
    if (resources.popUnskilled.progress >= 1.0) {
      resources.popUnskilled.val += 1;
      resources.popUnskilled.progress = 0;
      log("Un nuevo habitante se ha unido al asentamiento (+1 Obrero).", "positive");
    }
  }

  // 4. Asignación de trabajadores y graduaciones
  if (state.autoAssignActive) {
    autoAssignWorkersLogic();
  }

  // 5. Balance de Producción/Consumo por segundo
  for (let r in resources) resources[r].rate = 0;
  resources.food.rate = -(totalPop * 0.15);

  for (let k in buildings) {
    const b = buildings[k];
    if (b.count > 0 && b.baseCapacity > 0) {
      const cap = getBuildingCapacity(k);
      const efficiency = cap > 0 ? Math.min(1, b.assignedWorkers / cap) : 1;

      for (let p in b.produces) {
        resources[p].rate += b.produces[p] * b.count * efficiency;
      }
      for (let c in b.consumes) {
        resources[c].rate -= b.consumes[c] * b.count * efficiency;
      }
    }
  }

  for (let r in resources) {
    const res = resources[r];
    if (res.discovered && res.assigned === undefined) {
      res.val = Math.max(0, Math.min(res.max, res.val + res.rate));
    }
  }

  render();
}

// Inicialización de la partida al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
  if (SaveSystem.loadLocal()) {
    log("Partida previa restaurada desde almacenamiento local.");
  } else {
    log("Nueva partida iniciada.");
  }

  // Autoguardado silencioso cada 30 segundos
  setInterval(() => {
    SaveSystem.saveLocal();
  }, 30000);

  // Intentar guardar antes de que el usuario cierre la ventana
  window.addEventListener("beforeunload", () => {
    SaveSystem.saveLocal();
  });

  setInterval(tick, 1000);
});