/* game.entities.js
   Holds all game state, level parsing and basic entity helpers.
*/

import { DPR, vw, vh, groundHeight } from './game.util.js';

export const state = {
  running: false,
  muted: false,
  G: 1400,
  BASE_SPEED: 520,
  SPAWN_INTERVAL: 1.05,
  PLAYER_SIZE: Math.min(vw, vh) * 0.07,
  player: null,
  obstacles: [],
  levelCircles: [],
  spawnTimer: 0,
  speed: 520 * DPR,
  time: 0,
  score: 0,
  best: parseInt(localStorage.getItem('gd_best') || '0', 10) || 0,
  editorActive: false,
  activeTool: 'place-rect'
};

export function initEntities(opts = {}){
  state.speed = state.BASE_SPEED * DPR;
  state.best = parseInt(localStorage.getItem('gd_best') || '0', 10) || 0;
  state.player = null;
  resetGame();
}

export function applyLevelObject(obj){
  if (!obj) return;
  const toNumber = v => (typeof v === 'number' ? v : parseInt(v,10) || 0);
  const mapObstacles = (arr) => (Array.isArray(arr) ? arr.map(o => ({
    x: Math.round(toNumber(o.x) * DPR),
    y: Math.round(toNumber(o.y) * DPR),
    w: Math.round(toNumber(o.w) * DPR),
    h: Math.round(toNumber(o.h) * DPR),
    col: o.col || undefined
  })) : []);
  const mapCircles = (arr) => (Array.isArray(arr) ? arr.map(c => ({
    x: Math.round(toNumber(c.x) * DPR),
    y: Math.round(toNumber(c.y) * DPR),
    r: Math.round(toNumber(c.r) * DPR)
  })) : []);
  if (obj.obstacles || obj.circles) {
    state.obstacles = mapObstacles(obj.obstacles || []);
    state.levelCircles = mapCircles(obj.circles || []);
    return;
  }
  if (obj.blocks || obj.level || obj.data) {
    state.obstacles = mapObstacles(obj.blocks || obj.level || obj.data || []);
    state.levelCircles = mapCircles(obj.circles || []);
    return;
  }
  if (obj.x !== undefined && obj.w !== undefined){
    state.obstacles.push({ x: Math.round(toNumber(obj.x) * DPR), y: Math.round(toNumber(obj.y) * DPR), w: Math.round(toNumber(obj.w) * DPR), h: Math.round(toNumber(obj.h) * DPR) });
    return;
  }
  if (Array.isArray(obj)){
    const sample = obj[0];
    if (sample && sample.r !== undefined) state.levelCircles = mapCircles(obj);
    else if (sample && sample.w !== undefined) state.obstacles = mapObstacles(obj);
  }
}

export function buildNineCircles(baseX = Math.round((devicePixelRatio * innerWidth) * 0.9)) {
  state.levelCircles = [];
  const spacing = Math.round((devicePixelRatio * innerWidth * 0.9) / 6);
  const radii = [
    Math.round(18 * DPR),
    Math.round(22 * DPR),
    Math.round(20 * DPR),
    Math.round(26 * DPR),
    Math.round(18 * DPR),
    Math.round(24 * DPR),
    Math.round(20 * DPR),
    Math.round(28 * DPR),
    Math.round(22 * DPR)
  ];
  const offsets = [0, -8, -4, -12, 0, -6, -3, -14, -5].map(o => Math.round(o * DPR));
  for (let i = 0; i < 9; i++){
    const r = radii[i];
    const x = baseX + i * spacing + Math.round(i * 14 * DPR);
    const y = (devicePixelRatio * innerHeight) - groundHeight - r * 2 + offsets[i];
    state.levelCircles.push({ x, y, r });
  }
}

export function resetGame(){
  const size = Math.round(state.PLAYER_SIZE * DPR);
  state.player = {
    x: Math.round(0.12 * devicePixelRatio * innerWidth),
    y: (devicePixelRatio * innerHeight) - groundHeight - size,
    w: size,
    h: size,
    vy: 0,
    grounded: true,
    color: '#ff6b35'
  };
  state.obstacles = [];
  buildNineCircles();
  state.spawnTimer = 0;
  state.time = 0;
  state.score = 0;
  state.speed = state.BASE_SPEED * DPR;
  state.running = false;
}