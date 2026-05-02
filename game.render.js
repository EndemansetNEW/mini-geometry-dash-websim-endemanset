/* game.render.js
   Rendering loop and audio helpers.
*/

import { canvas, ctx, DPR } from './game.util.js';
import { state } from './game.entities.js';

let last = performance.now();
let externalFlashSetter = null;

export function setFlashSound(fn){
  externalFlashSetter = fn;
  // expose flashSound to caller modules if needed
  fn(flashSound);
}

function rectsOverlap(a,b){
  return !(a.x + a.w <= b.x || a.x >= b.x + b.w || a.y + a.h <= b.y || a.y >= b.y + b.h);
}

function circleRectCollision(circle, rect){
  const cx = circle.x + circle.r;
  const cy = circle.y + circle.r;
  const rx = rect.x;
  const ry = rect.y;
  const rw = rect.w;
  const rh = rect.h;
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return (dx*dx + dy*dy) <= (circle.r * circle.r);
}

function update(dt){
  if (!state.player) return;

  state.time += dt;
  if (state.running){
    state.spawnTimer += dt;
    state.speed += dt * 6 * DPR;
    if (state.spawnTimer > state.SPAWN_INTERVAL){
      state.spawnTimer = 0;
      spawnObstacle();
    }

    for (let i = state.obstacles.length - 1; i >= 0; i--){
      state.obstacles[i].x -= state.speed * dt;
      if (state.obstacles[i].x + state.obstacles[i].w < -50 * DPR) state.obstacles.splice(i,1);
    }

    for (let i = state.levelCircles.length - 1; i >= 0; i--){
      state.levelCircles[i].x -= state.speed * dt;
      if (state.levelCircles[i].x + state.levelCircles[i].r*2 < -80 * DPR){
        state.levelCircles[i].x += Math.round((devicePixelRatio * innerWidth) * 2.2);
      }
    }

    state.score += Math.floor(100 * dt * (state.speed / (state.BASE_SPEED * DPR)));
    const hudScore = document.getElementById('score');
    if (hudScore) hudScore.textContent = String(Math.max(0, state.score));

    if (Math.random() < 0.003) {
      const x0 = (devicePixelRatio * innerWidth) + 40 * DPR;
      state.obstacles.push({ x: x0, y: (devicePixelRatio * innerHeight) - (Math.max(24, Math.round(0.12 * innerHeight)) * DPR) - Math.round(40*DPR), w: Math.round(28*DPR), h: Math.round(40*DPR), col: '#e66bff' });
    }
  }

  // Physics
  state.player.vy += state.G * DPR * dt;
  state.player.y += state.player.vy * dt;

  const groundY = (devicePixelRatio * innerHeight) - (Math.max(24, Math.round(0.12 * innerHeight)) * DPR) - state.player.h;
  if (state.player.y >= groundY){
    state.player.y = groundY;
    state.player.vy = 0;
    state.player.grounded = true;
  } else {
    state.player.grounded = false;
  }

  // Collisions with rectangles
  for (let ob of state.obstacles){
    const oRect = { x: Math.round(ob.x), y: Math.round(ob.y), w: Math.round(ob.w), h: Math.round(ob.h) };
    const pRect = { x: Math.round(state.player.x), y: Math.round(state.player.y), w: Math.round(state.player.w), h: Math.round(state.player.h) };
    if (rectsOverlap(oRect, pRect) && state.running){
      state.player.color = '#ff3b30';
      if (!state.muted) flashSound();
      gameOver();
    }
  }

  // Collisions with circles
  const pRect = { x: Math.round(state.player.x), y: Math.round(state.player.y), w: Math.round(state.player.w), h: Math.round(state.player.h) };
  for (let c of state.levelCircles){
    if (circleRectCollision(c, pRect) && state.running){
      state.player.color = '#ff3b30';
      if (!state.muted) flashSound();
      gameOver();
    }
  }
}

function spawnObstacle(){
  const hMin = Math.max(18, Math.round(0.06 * innerHeight)) * DPR;
  const hMax = Math.max(60, Math.round(0.22 * innerHeight)) * DPR;
  const height = Math.round(hMin + Math.random() * (hMax - hMin));
  const width = Math.round((20 + Math.random()*40) * DPR);
  const y = (devicePixelRatio * innerHeight) - (Math.max(24, Math.round(0.12 * innerHeight)) * DPR) - height;
  const x = (devicePixelRatio * innerWidth) + 40 * DPR;
  state.obstacles.push({ x, y, w: width, h: height, col: '#3ddc84' });
  if (Math.random() < 0.18){
    const h2 = Math.round((hMin * 0.6) + Math.random() * (hMax * 0.6));
    state.obstacles.push({ x: x + width + Math.round(14 * DPR), y: (devicePixelRatio * innerHeight) - (Math.max(24, Math.round(0.12 * innerHeight)) * DPR) - h2, w: Math.round(20*DPR), h: h2, col: '#f5d547' });
  }
}

function gameOver(){
  state.running = false;
  const overlay = document.getElementById('overlay');
  const overlayMsg = document.getElementById('message');
  const restartBtn = document.getElementById('restart');
  const playBtn = document.getElementById('play');
  overlay.classList.remove('hidden');
  overlayMsg.textContent = 'Game Over';
  restartBtn.classList.remove('hidden');
  playBtn.classList.add('hidden');
  if (state.score > state.best){
    state.best = state.score;
    localStorage.setItem('gd_best', String(state.best));
  }
  const bestEl = document.getElementById('best');
  if (bestEl) bestEl.textContent = `Best: ${state.best}`;
}

export function renderLoop({ canvas, ctx, state: extState } = {}){
  last = performance.now();
  function loop(now){
    const dt = Math.min(0.04, (now - last) / 1000);
    last = now;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
}

function render(){
  const W = canvas.width;
  const H = canvas.height;

  ctx.fillStyle = '#05121a';
  ctx.fillRect(0,0,W,H);

  const t = performance.now() * 0.00012;
  for (let i=0;i<3;i++){
    const size = (40 + i*30) * DPR;
    ctx.fillStyle = `rgba(255,255,255,${0.02 + i*0.01})`;
    for (let x = -size*2 + ((t*(i+1)*40) % (size*3)); x < W + size*3; x += size*3){
      ctx.fillRect(x, (H*0.12) + i*(60*DPR), size*1.1, size*0.18);
    }
  }

  ctx.fillStyle = '#2c2c2c';
  ctx.fillRect(0, H - (Math.max(24, Math.round(0.12 * innerHeight)) * DPR), W, (Math.max(24, Math.round(0.12 * innerHeight)) * DPR));

  for (let c of state.levelCircles){
    const cx = Math.round(c.x + c.r);
    const cy = Math.round(c.y + c.r);
    const r = Math.round(c.r);

    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.clip();

    if (globalThis.textureImg && globalThis.textureImg.complete && globalThis.textureImg.naturalWidth) {
      const d = r * 2;
      const tx = Math.round(cx - d * 0.5);
      const ty = Math.round(cy - d * 0.5);
      ctx.drawImage(globalThis.textureImg, tx, ty, Math.round(d), Math.round(d));
    } else {
      ctx.fillStyle = '#7cc5ff';
      ctx.fillRect(Math.round(c.x), Math.round(c.y), r * 2, r * 2);
    }
    ctx.restore();

    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    ctx.arc(cx - Math.round(r*0.35), cy - Math.round(r*0.35), Math.max(1 * DPR, Math.round(r*0.45)), 0, Math.PI * 2);
    ctx.fill();
  }

  for (let ob of state.obstacles){
    const ox = Math.round(ob.x);
    const oy = Math.round(ob.y);
    const ow = Math.round(ob.w);
    const oh = Math.round(ob.h);

    if (globalThis.textureImg && globalThis.textureImg.complete && globalThis.textureImg.naturalWidth) {
      ctx.drawImage(globalThis.textureImg, ox, oy, ow, oh);
      ctx.fillStyle = 'rgba(0,0,0,0.12)';
      ctx.fillRect(ox, oy, ow, oh);
    } else {
      ctx.fillStyle = ob.col || '#3ddc84';
      ctx.fillRect(ox, oy, ow, oh);
    }

    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(ox, oy, ow, Math.max(2 * DPR, Math.round(3*DPR)));
  }

  // player & effects
  if (!state.player) return;

  ctx.save();
  const nowT = performance.now();
  const bob = Math.sin(nowT * 0.004) * (2 * DPR);
  const px = Math.round(state.player.x);
  const py = Math.round(state.player.y + bob);
  const pw = Math.round(state.player.w);
  const ph = Math.round(state.player.h);
  const cx = px + pw * 0.5;
  const cy = py + ph * 0.5;

  ctx.beginPath();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.ellipse(cx, H - (Math.max(24, Math.round(0.12 * innerHeight)) * DPR) + (6 * DPR), pw * 0.7, Math.max(6 * DPR, pw * 0.18), 0, 0, Math.PI * 2);
  ctx.fill();

  const glowRad = pw * 0.9;
  const grad = ctx.createRadialGradient(cx, cy + ph * 0.15, glowRad * 0.1, cx, cy + ph * 0.15, glowRad);
  grad.addColorStop(0, 'rgba(124,197,255,0.18)');
  grad.addColorStop(1, 'rgba(124,197,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(cx, cy + ph * 0.15, glowRad, glowRad * 0.45, 0, 0, Math.PI * 2);
  ctx.fill();

  if (state.player) {
    ctx.fillStyle = state.player.color || '#ff6b35';
    ctx.beginPath();
    ctx.ellipse(cx, cy + (ph * 0.05), pw * 0.6, ph * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.ellipse(cx, cy - ph * 0.15, pw * 0.35, ph * 0.28, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  if (state.editorActive){
    ctx.save();
    ctx.lineWidth = Math.max(1*DPR,1.5);
    ctx.strokeStyle = 'rgba(255,255,255,0.12)';
    for (let o of state.obstacles){
      ctx.strokeRect(Math.round(o.x)-1, Math.round(o.y)-1, Math.round(o.w)+2, Math.round(o.h)+2);
    }
    for (let c of state.levelCircles){
      ctx.beginPath();
      ctx.arc(Math.round(c.x + c.r), Math.round(c.y + c.r), Math.round(c.r)+1, 0, Math.PI*2);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (!state.running){
    const pulse = 1 + 0.06 * Math.sin(nowT * 0.008);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = Math.max(1 * DPR, 1.5*DPR);
    ctx.ellipse(cx, cy + ph * 0.12, (pw + 12*DPR) * pulse, (ph + 12*DPR) * pulse, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

let audioCtx = null;
export function flashSound(){
  if (state.muted) return;
  try{
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.type = 'square';
    o.frequency.value = 200 + Math.random()*220;
    g.gain.value = 0.0001;
    o.connect(g);
    g.connect(audioCtx.destination);
    const now = audioCtx.currentTime;
    g.gain.linearRampToValueAtTime(0.07, now + 0.001);
    g.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    o.start(now);
    o.stop(now + 0.13);
  }catch(e){}
}

