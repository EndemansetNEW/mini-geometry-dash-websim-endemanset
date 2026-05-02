/* game.physics.js
   Contains physics/update loop helpers and input wiring.
*/

import { DPR, groundHeight } from './game.util.js';
import { state } from './game.entities.js';

export function initPhysics({ canvas, DPR: dpr = DPR, vw, vh, groundHeight, state: extState, jump: extJump, onPointerDown: extDown, onPointerMove: extMove, onPointerUp: extUp } = {}){
  // wire pointer events to exported handlers below
  canvas.addEventListener('mousedown', onPointerDown);
  canvas.addEventListener('touchstart', onPointerDown, {passive:false});
  canvas.addEventListener('mousemove', onPointerMove);
  canvas.addEventListener('touchmove', onPointerMove, {passive:false});
  canvas.addEventListener('mouseup', onPointerUp);
  canvas.addEventListener('touchend', onPointerUp);

  window.addEventListener('keydown', (e)=>{
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW'){
      e.preventDefault();
      jump();
    }
  });
}

export function jump(){
  if (!state.player) return;
  if (state.player.grounded || state.running === false){
    state.player.vy = -740 * DPR;
    state.player.grounded = false;
    if (!state.running) {
      state.running = true;
      state.player.vy = -680 * DPR;
    }
  }
}

// Pointer helpers (editor interaction depends on DOM-managed editorActive/activeTool stored in DOM)
function getPointerPos(e){
  const rect = document.getElementById('game').getBoundingClientRect();
  let clientX = 0, clientY = 0;
  if (e.touches && e.touches[0]) { clientX = e.touches[0].clientX; clientY = e.touches[0].clientY; }
  else { clientX = e.clientX; clientY = e.clientY; }
  const x = (clientX - rect.left) * DPR;
  const y = (clientY - rect.top) * DPR;
  return { x, y };
}
function findItemAt(x,y){
  for (let i = state.obstacles.length - 1; i >= 0; i--){
    const o = state.obstacles[i];
    if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) return { type: 'rect', idx: i, item: o };
  }
  for (let i = state.levelCircles.length - 1; i >= 0; i--){
    const c = state.levelCircles[i];
    const cx = c.x + c.r, cy = c.y + c.r;
    const d2 = (x - cx)*(x - cx) + (y - cy)*(y - cy);
    if (d2 <= c.r * c.r) return { type: 'circle', idx: i, item: c };
  }
  return null;
}

let dragItem = null;
let dragOffset = { x: 0, y: 0 };
let pressTimer = null;

export function onPointerDown(e){
  if (e.cancelable) e.preventDefault();
  const p = getPointerPos(e);
  const editorEl = document.getElementById('editor');
  const editorActive = editorEl && editorEl.dataset.active === 'true';
  if (!editorActive){
    jump();
    return;
  }
  const activeTool = (editorEl && editorEl.dataset.tool) ? editorEl.dataset.tool : 'place-rect';
  const hit = findItemAt(p.x, p.y);
  if (activeTool === 'erase' && hit){
    if (hit.type === 'rect') state.obstacles.splice(hit.idx,1);
    else state.levelCircles.splice(hit.idx,1);
    dragItem = null;
    return;
  }
  if (activeTool === 'place-rect'){
    const w = Math.round(36 * DPR), h = Math.round(36 * DPR);
    const x = Math.round(p.x - w * 0.5);
    const y = Math.round(Math.min((devicePixelRatio * innerHeight) - groundHeight - h, Math.max(0, p.y - h * 0.5)));
    state.obstacles.push({ x, y, w, h });
    return;
  }
  if (activeTool === 'place-circle'){
    const r = Math.round(18 * DPR);
    const x = Math.round(p.x - r);
    const y = Math.round(Math.min((devicePixelRatio * innerHeight) - groundHeight - r*2, Math.max(0, p.y - r)));
    state.levelCircles.push({ x, y, r });
    return;
  }
  if (hit){
    dragItem = hit;
    dragOffset.x = p.x - hit.item.x;
    dragOffset.y = p.y - hit.item.y;
    pressTimer = setTimeout(()=>{
      if (dragItem) {
        if (dragItem.type === 'rect') state.obstacles.splice(dragItem.idx,1);
        else state.levelCircles.splice(dragItem.idx,1);
        dragItem = null;
      }
    }, 700);
  } else {
    dragItem = null;
  }
}
export function onPointerMove(e){
  if (e.cancelable) e.preventDefault();
  const editorEl = document.getElementById('editor');
  const editorActive = editorEl && editorEl.dataset.active === 'true';
  if (!editorActive) return;
  if (!dragItem) return;
  if (pressTimer){ clearTimeout(pressTimer); pressTimer = null; }
  const p = getPointerPos(e);
  const nx = Math.round(p.x - dragOffset.x);
  const ny = Math.round(p.y - dragOffset.y);
  if (dragItem.type === 'rect'){
    const item = state.obstacles[dragItem.idx];
    if (!item) { dragItem = null; return; }
    item.x = Math.max(-200*DPR, Math.min((devicePixelRatio * innerWidth) + 200*DPR, nx));
    item.y = Math.max(0, Math.min((devicePixelRatio * innerHeight) - groundHeight - item.h, ny));
  } else {
    const item = state.levelCircles[dragItem.idx];
    if (!item) { dragItem = null; return; }
    item.x = Math.max(-200*DPR, Math.min((devicePixelRatio * innerWidth) + 200*DPR, nx));
    item.y = Math.max(0, Math.min((devicePixelRatio * innerHeight) - groundHeight - item.r*2, ny));
  }
}
export function onPointerUp(e){
  if (e.cancelable) e.preventDefault();
  if (pressTimer){ clearTimeout(pressTimer); pressTimer = null; }
  dragItem = null;
}