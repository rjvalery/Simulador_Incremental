import { TECHS_DATA, canResearch, researchTech, isTechnologyCompleted } from './techs.js';

export function renderUI(gameState) {
    const state = gameState || window.state;
    if (!state) return;

    renderResourceMonitor(state);
    renderTechPanel(state);
}

function renderResourceMonitor(state) {
    const getVal = (res) => (typeof res === 'object' ? res.value : res);
    const getMax = (res) => (typeof res === 'object' ? res.max : 0);

    const foodEl = document.getElementById('res-food');
    const woodEl = document.getElementById('res-wood');
    const stoneEl = document.getElementById('res-stone');
    const goldEl = document.getElementById('res-gold');
    const scienceEl = document.getElementById('res-science');
    const popEl = document.getElementById('res-pop');
    const workersEl = document.getElementById('res-workers');

    if (foodEl) foodEl.textContent = `${getVal(state.resources.food).toFixed(1)} / ${getMax(state.resources.food)}`;
    if (woodEl) woodEl.textContent = `${getVal(state.resources.wood).toFixed(1)} / ${getMax(state.resources.wood)}`;
    if (stoneEl) stoneEl.textContent = `${getVal(state.resources.stone).toFixed(0)} / ${getMax(state.resources.stone)}`;
    if (goldEl) goldEl.textContent = `${getVal(state.resources.gold).toFixed(0)} / ${getMax(state.resources.gold)}`;
    if (scienceEl) scienceEl.textContent = `${getVal(state.resources.science).toFixed(0)} / ${getMax(state.resources.science)}`;
    if (popEl) popEl.textContent = `${state.population.total} / ${state.population.max}`;
    if (workersEl) workersEl.textContent = `${state.population.workers} / ${state.population.total}`;
}

export function renderTechPanel(state) {
    const container = document.getElementById('tech-container');
    if (!container) return;

    container.innerHTML = '';

    Object.keys(TECHS_DATA).forEach(techId => {
        const tech = TECHS_DATA[techId];
        const completed = isTechnologyCompleted(state, techId);
        const available = canResearch(state, techId);

        const hasPrereqs = tech.requires.every(reqId => isTechnologyCompleted(state, reqId));
        if (!hasPrereqs && !completed) return;

        const card = document.createElement('div');
        card.className = `tech-card ${completed ? 'completed' : ''}`;

        card.innerHTML = `
            <h4>${tech.name}</h4>
            <p>${tech.description}</p>
            <p>Costo: ${tech.cost.science} Ciencia</p>
            <button 
                class="btn-tech" 
                data-tech="${techId}"
                ${!available || completed ? 'disabled' : ''}>
                ${completed ? '✓ Investigado' : 'Investigar'}
            </button>
        `;

        const button = card.querySelector('.btn-tech');
        if (button && !completed) {
            button.addEventListener('click', () => {
                const success = researchTech(state, techId);
                if (success) {
                    renderUI(state);
                    window.dispatchEvent(new CustomEvent('state:updated'));
                }
            });
        }

        container.appendChild(card);
    });
}