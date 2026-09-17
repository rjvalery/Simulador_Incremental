import { state } from './state.js';
import { renderUI } from './ui.js';

window.state = state;

document.addEventListener('DOMContentLoaded', () => {
  renderUI(state);

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