import { Engine } from './engine.js';
import { UI } from './ui.js';
import { Storage } from './storage.js';
import { eventBus } from './eventBus.js';

window.addEventListener('DOMContentLoaded', () => {
  // Inicialización de la UI
  UI.init();

  // Carga previa si existe
  Storage.load();

  // Iniciar Game Loop
  Engine.start();

  eventBus.emit('log:add', "El asentamiento ha comenzado.");
});