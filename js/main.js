import { state } from './state.js';
import { renderUI } from './ui.js';

window.state = state;

document.addEventListener('DOMContentLoaded', () => {
  renderUI(state);

  // Botones de recolección manual
  const btnFood = document.getElementById('btn-collect-food');
  const btnWood = document.getElementById('btn-collect-wood');

  if (btnFood) {
    btnFood.addEventListener('click', () => {
      state.resources.food.value = Math.min(state.resources.food.max, state.resources.food.value + 1);
      renderUI(state);
    });
  }

  if (btnWood) {
    btnWood.addEventListener('click', () => {
      state.resources.wood.value = Math.min(state.resources.wood.max, state.resources.wood.value + 1);
      renderUI(state);
    });
  }

  // Cambio de pestañas
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', (e) => {
      tabs.forEach(t => t.classList.remove('active'));
      e.target.classList.add('active');

      const targetSection = e.target.getAttribute('data-tab');
      document.querySelectorAll('.tab-content').forEach(section => {
        section.style.display = section.id === targetSection ? 'block' : 'none';
      });
    });
  });

  window.addEventListener('state:updated', () => {
    renderUI(state);
  });

  setInterval(() => {
    renderUI(state);
  }, 1000);
});