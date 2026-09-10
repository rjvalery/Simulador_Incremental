import { TECH_DATABASE, researchTech } from './techs.js';

let currentBranch = 'civil';

// Sincronización inicial con el estado global
if (window.GameState) {
  if (!window.GameState.techs) {
    window.GameState.techs = TECH_DATABASE;
  }
}

// Cambiar de sub-pestaña (Civil vs Militar)
window.switchTechBranch = function(branch) {
  currentBranch = branch;
  
  const btnCivil = document.getElementById('btn-subtab-civil');
  const btnMilitar = document.getElementById('btn-subtab-militar');

  if (btnCivil) btnCivil.classList.toggle('active', branch === 'civil');
  if (btnMilitar) btnMilitar.classList.toggle('active', branch === 'militar');

  renderTechTree();
};

// Comprar tecnología y refrescar interfaz/guardado
window.buyTechnology = function(techId) {
  if (!window.GameState) return;

  const success = researchTech(techId, window.GameState);
  if (success) {
    if (window.Game && typeof window.Game.updateUI === 'function') {
      window.Game.updateUI();
    }
    if (window.SaveSystem && typeof window.SaveSystem.saveLocal === 'function') {
      window.SaveSystem.saveLocal();
    }
    renderTechTree();
  } else {
    alert("No cumples con los recursos necesarios o la tecnología ya fue investigada.");
  }
};

// Dibujar la grilla de tecnologías activas
function renderTechTree() {
  const container = document.getElementById('tech-grid');
  if (!container || !window.GameState) return;
  container.innerHTML = '';

  const currentEra = window.GameState.era || 1;
  const techs = window.GameState.techs || TECH_DATABASE;

  Object.values(techs)
    .filter(tech => tech.branch === currentBranch && tech.era === currentEra)
    .forEach(tech => {
      const card = document.createElement('div');
      card.className = `tech-card ${tech.unlocked ? 'unlocked' : ''}`;

      const costsText = Object.entries(tech.cost)
        .map(([res, val]) => `${val} ${res}`)
        .join(', ');

      card.innerHTML = `
        <div>
          <div class="tech-title">${tech.name}</div>
          <div class="tech-desc">${tech.desc}</div>
          <div class="tech-effect">${tech.effectDesc}</div>
        </div>
        <div>
          <div class="tech-costs"><strong>Costo:</strong> ${costsText}</div>
          <button class="btn-action" 
                  ${tech.unlocked ? 'disabled' : ''} 
                  onclick="buyTechnology('${tech.id}')">
            ${tech.unlocked ? 'Investigado' : 'Investigar'}
          </button>
        </div>
      `;

      container.appendChild(card);
    });
}

// Inicialización limpia
document.addEventListener('DOMContentLoaded', () => {
  renderTechTree();
});