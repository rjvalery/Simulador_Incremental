renderTechs() {
    const container = document.getElementById('techs-container');
    container.innerHTML = '';

    // Si tu estructura en state.js agrupa por eras o tiene una propiedad de era:
    for (let eraKey in GameState.techsByEra || { General: GameState.techs }) {
      const eraTechs = GameState.techsByEra ? GameState.techsByEra[eraKey] : GameState.techs;

      // Encabezado de la Era
      const eraHeader = document.createElement('div');
      eraHeader.className = 'building-item';
      eraHeader.style.background = 'rgba(255, 255, 255, 0.05)';
      eraHeader.style.fontWeight = 'bold';
      eraHeader.innerHTML = `<div class="building-info"><span class="building-name">Era: ${eraKey}</span></div>`;
      container.appendChild(eraHeader);

      for (let key in eraTechs) {
        const tech = eraTechs[key];
        
        const item = document.createElement('div');
        item.className = 'building-item';

        if (tech.unlocked) {
          item.innerHTML = `
            <div class="building-info">
              <span class="building-name" style="color: #4ade80;">✔ ${tech.name}</span>
              <div class="building-cost">${tech.desc}</div>
            </div>
            <span style="color: #4ade80; font-size: 0.9em; font-weight: bold; align-self: center;">Completado</span>
          `;
        } else {
          const canAfford = Actions.canAfford(tech.cost);
          item.innerHTML = `
            <div class="building-info">
              <span class="building-name">${tech.name}</span>
              <div class="building-cost">${tech.desc} | Costo: ${this.formatCost(tech.cost)}</div>
            </div>
            <button class="btn-action btn-tech" style="min-width:80px; padding:4px;" ${!canAfford ? 'disabled' : ''}>Investigar</button>
          `;

          item.querySelector('.btn-tech').addEventListener('click', () => Actions.researchTech(key));
        }

        container.appendChild(item);
      }
    }
  },