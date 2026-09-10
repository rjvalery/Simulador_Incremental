// Base de datos modular de tecnologías (Era 1: Civil y Militar)
export const TECH_DATABASE = {
  // RAMA CIVIL
  agricultura_basica: {
    id: 'agricultura_basica',
    name: '🌾 Agricultura Básica',
    branch: 'civil',
    era: 1,
    desc: 'Técnicas fundamentales de cultivo para asegurar el alimento del pueblo.',
    effectDesc: '+10% producción de Alimento',
    cost: { ciencia: 20, madera: 30 },
    unlocked: false,
    reqs: []
  },
  herramientas_piedra: {
    id: 'herramientas_piedra',
    name: '🪨 Herramientas de Piedra',
    branch: 'civil',
    era: 1,
    desc: 'Mejora la recolección de materiales básicos.',
    effectDesc: '+15% recolección de Madera y Piedra',
    cost: { ciencia: 35, piedra: 40 },
    unlocked: false,
    reqs: ['agricultura_basica']
  },
  comercio_local: {
    id: 'comercio_local',
    name: '🪙 Comercio Local',
    branch: 'civil',
    era: 1,
    desc: 'Establece mercados locales para generar los primeros ingresos pasivos.',
    effectDesc: 'Desbloquea generación pasiva de Dinero',
    cost: { ciencia: 50, alimento: 60 },
    unlocked: false,
    reqs: ['agricultura_basica']
  },

  // RAMA MILITAR
  garrotes_y_lanzas: {
    id: 'garrotes_y_lanzas',
    name: '🗡️ Garrotes y Lanzas',
    branch: 'militar',
    era: 1,
    desc: 'Organiza las primeras milicias para la defensa del asentamiento.',
    effectDesc: '+5 Poder Militar',
    cost: { ciencia: 25, madera: 50 },
    unlocked: false,
    reqs: []
  },
  empalizadas: {
    id: 'empalizadas',
    name: '🪵 Empalizadas de Madera',
    branch: 'militar',
    era: 1,
    desc: 'Estructuras defensivas simples para proteger las reservas.',
    effectDesc: '+10 Defensas de la Ciudad',
    cost: { ciencia: 40, madera: 80 },
    unlocked: false,
    reqs: ['garrotes_y_lanzas']
  },
  tacticas_caza: {
    id: 'tacticas_caza',
    name: '🎯 Tácticas de Caza',
    branch: 'militar',
    era: 1,
    desc: 'Aplica técnicas de rastreo tanto para suministro como para combate.',
    effectDesc: '+10% Eficiencia Militar',
    cost: { ciencia: 60, alimento: 100 },
    unlocked: false,
    reqs: ['garrotes_y_lanzas']
  }
};

// Función auxiliar para verificar si se puede pagar una tecnología
export function canAfford(cost, resources) {
  if (!resources) return false;
  for (const [res, amount] of Object.entries(cost)) {
    if ((resources[res] || 0) < amount) return false;
  }
  return true;
}

// Función pura para procesar la investigación
export function researchTech(techId, gameState) {
  const tech = gameState.techs?.[techId];
  if (!tech || tech.unlocked) return false;

  if (canAfford(tech.cost, gameState.resources)) {
    // Descontar costo
    for (const [res, amount] of Object.entries(tech.cost)) {
      gameState.resources[res] -= amount;
    }
    tech.unlocked = true;
    return true;
  }
  return false;
}