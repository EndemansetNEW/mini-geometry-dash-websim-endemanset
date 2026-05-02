/*
  Refactored bootstrap: core game logic moved to ./game.core.js
  Tombstones indicate what was moved or extracted to separate modules.
*/

import './game.core.js';
import './game.ui.js';

// Tombstones (extracted to game.ui.js):
// removed Browse modal behaviour and loadLevelsFromEndpoint()
// removed editor UI handlers (preset, clear, export, upload)
// removed ubuntu button interaction and soggy image handling