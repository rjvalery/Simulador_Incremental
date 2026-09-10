export const GameState = {
  paused: false,
  activeBuildingFilter: 'all', // Controla el filtro activo ('all', 'available', 'enabled')
  resources: {
    food: { name: "Alimento", val: 0, max: 100, rate: 0, discovered: true },
    wood: { name: "Madera", val: 0, max: 100, rate: 0, discovered: false },
    stone: { name: "Piedra", val: 0, max: 100, rate: 0, discovered: false },
    money: { name: "Dinero", val: 0, max: 1000, rate: 0, discovered: false },
    science: { name: "Ciencia", val: 0, max: 200, rate: 0, discovered: false },
    popUnskilled: { 
      name: "Habitantes", 
      val: 0, 
      max: 0, 
      assigned: { farm: 0, quarry: 0, woodcutter: 0 }, 
      discovered: false,
      desc: "Población libre y capacitada de tu asentamiento disponible para desempeñar labores.",
      effect: "Permite asignar trabajadores a producción o mantener la mano de obra del pueblo."
    }
  },

  buildings: {
    housing: { 
      name: "Viviendas", 
      count: 0, 
      maxLevel: 10, 
      baseCost: { wood: 15, stone: 5 }, 
      multiplier: 1.25, 
      unlocked: false,
      desc: "Proporciona cobijo para atraer nuevos habitantes a tu asentamiento.",
      effect: "+2 a la capacidad máxima de población."
    },
    silo: { 
      name: "Granero", 
      count: 0, 
      maxLevel: 10, 
      baseCost: { wood: 40, stone: 20 }, 
      multiplier: 1.25, 
      unlocked: false,
      desc: "Estructura de almacenamiento de alimentos a gran escala.",
      effect: "+150 al límite máximo de Alimento almacenable."
    },
    farm: { 
      name: "Granja", 
      count: 0, 
      maxLevel: 20, 
      baseCost: { wood: 25, stone: 15 }, 
      multiplier: 1.20, 
      maxWorkers: 5, 
      unlocked: false,
      desc: "Permite asignar habitantes para cultivar campos de alimento.",
      effect: "Habilita puestos de trabajo de Granjero (+0.40 Alimento/s por trabajador)."
    },
    woodcutter: { 
      name: "Aserradero", 
      count: 0, 
      maxLevel: 20, 
      baseCost: { wood: 20, stone: 30 }, 
      multiplier: 1.20, 
      maxWorkers: 5, 
      unlocked: false,
      desc: "Instalación para talar y procesar madera de forma organizada.",
      effect: "Habilita puestos de trabajo de Leñador (+0.35 Madera/s por trabajador)."
    },
    quarry: { 
      name: "Cantera", 
      count: 0, 
      maxLevel: 20, 
      baseCost: { wood: 50, stone: 20 }, 
      multiplier: 1.25, 
      maxWorkers: 5, 
      unlocked: false,
      desc: "Zona de extracción de roca y piedra mineral.",
      effect: "Habilita puestos de trabajo de Minero (+0.25 Piedra/s por trabajador)."
    }
  },

  techs: {
    basicScience: { 
      name: "Investigación Básica", 
      cost: { science: 20 }, 
      unlocked: false, 
      desc: "Desbloquea conocimientos científicos." 
    }
  }
};