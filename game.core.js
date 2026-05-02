/*
  game.core.js (refactored)
  This file now orchestrates smaller modules: util, entities, physics, render.
  Tombstones mark removed code that was moved into separate modules for clarity.
*/

import './game.ui.js';
import { canvas, ctx, DPR, vw, vh, onResize as utilOnResize, textureImg, groundHeight } from './game.util.js';
import { state, initEntities, applyLevelObject } from './game.entities.js';
import { initPhysics, jump, onPointerDown, onPointerMove, onPointerUp } from './game.physics.js';
import { renderLoop, setFlashSound } from './game.render.js';

// Tombstones: removed the large monolithic implementations of:
// - initialization and resize logic (moved to game.util.js) {}
// - level/application parsing (moved to game.entities.js) {}
// - spawn/update physics & input handlers (moved to game.physics.js) {}
// - full render() impl and image drawing (moved to game.render.js) {}
// - sound helper flashSound() (moved to game.render.js) {}

window.addEventListener('resize', utilOnResize);

// wire UI elements from DOM into entity module where needed
// (applyLevelObject is exported from game.entities.js and used by game.ui.js via global scope)
window.applyLevelObject = applyLevelObject;

// initialize
initEntities({ DPR, vw, vh, groundHeight, textureImg });
initPhysics({ canvas, DPR, vw, vh, groundHeight, state, jump, onPointerDown, onPointerMove, onPointerUp });
setFlashSound((fn) => { window.flashSound = fn; }); // expose for modules that call it

// start rendering loop handled in render module (it will requestAnimationFrame)
renderLoop({ canvas, ctx, state });
