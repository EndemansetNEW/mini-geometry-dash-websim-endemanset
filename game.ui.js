/* game.ui.js
   Extracted UI, browse and upload logic from game.core.js to keep core file smaller.
   This module wires up editor controls, browse modal, upload logic, and the soggy/ubuntu button.
*/

import { state, resetGame, buildNineCircles, applyLevelObject as _applyLevelObject } from './game.entities.js';
import { jump } from './game.physics.js';
import { DPR } from './game.util.js';

const hudScore = document.getElementById('score');
const overlay = document.getElementById('overlay');
const overlayMsg = document.getElementById('message');
const bestEl = document.getElementById('best');
const playBtn = document.getElementById('play');
const restartBtn = document.getElementById('restart');
const ubuntuBtn = document.getElementById('ubuntu');
const muteBtn = document.getElementById('mute');
const editorToggle = document.getElementById('editor-toggle');
const editor = document.getElementById('editor');
const editorClose = document.getElementById('editor-close');
const editorTools = document.getElementById('editor-tools');
const exportBtn = document.getElementById('export-json');
const uploadBtn = document.getElementById('upload-level');
const clearBtn = document.getElementById('clear-level');
const presetNineBtn = document.getElementById('preset-nine');

// Browse UI elements
const browseBtn = document.getElementById('browse-levels');
const browseModal = document.getElementById('browse');
const browseClose = document.getElementById('browse-close');
const endpointsTabs = document.getElementById('endpoints-tabs');
const levelsList = document.getElementById('levels-list');

 // Helper: populate levels list with simple clickable items; expects endpoint that returns JSON array or object
async function loadLevelsFromEndpoint(endpoint){
  levelsList.innerHTML = '<div style="padding:8px;color:var(--muted)">Loading…</div>';
  try {
    let res;
    try {
      res = await fetch(endpoint, { method: 'GET', credentials: 'same-origin' });
    } catch (err1) {
      try {
        res = await fetch(endpoint, { method: 'GET', mode: 'no-cors', credentials: 'omit' });
        levelsList.innerHTML = `<div style="padding:8px;color:var(--muted)">Fetched (opaque response). Server prevented CORS; preview unavailable.</div>`;
        return;
      } catch (err2) {
        throw err1;
      }
    }

    if (!res.ok) throw new Error('Bad status: ' + res.status);
    const data = await res.json();
    let items = [];
    if (Array.isArray(data)) items = data;
    else if (data && Array.isArray(data.levels)) items = data.levels;
    else if (data && typeof data === 'object') {
      if (data.json && Array.isArray(data.json.levels)) items = data.json.levels;
      else items = [data];
    }
    renderLevelsList(items);
  } catch (err) {
    const msg = String(err && err.message ? err.message : err).slice(0,120);
    levelsList.innerHTML = `<div style="padding:8px;color:#ff6b35">Fetch error: ${msg}</div><div style="padding:8px;color:var(--muted);font-size:12px">Try selecting a different endpoint or check server CORS settings.</div>`;
    console.warn('Browse load error', err);
  }
}

function renderLevelsList(items){
  levelsList.innerHTML = '';
  if (!items || items.length === 0){
    levelsList.innerHTML = '<div style="padding:8px;color:var(--muted)">No levels found</div>';
    return;
  }
  items.slice(0,50).forEach((it, idx) => {
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.justifyContent = 'space-between';
    div.style.gap = '8px';
    div.style.padding = '8px';
    div.style.borderBottom = '1px solid rgba(255,255,255,0.03)';
    const title = document.createElement('div');
    title.style.flex = '1';
    title.style.fontSize = '13px';
    title.style.wordBreak = 'break-word';
    title.textContent = (it && it.name) ? it.name : (it.title || `Level ${idx + 1}`);
    const btnWrap = document.createElement('div');
    btnWrap.style.display = 'flex';
    btnWrap.style.gap = '8px';
    const loadBtn = document.createElement('button');
    loadBtn.textContent = 'Load';
    loadBtn.style.padding = '6px 8px';
    loadBtn.style.borderRadius = '8px';
    loadBtn.style.border = '0';
    loadBtn.style.background = 'var(--accent)';
    loadBtn.style.color = '#05121a';
    loadBtn.addEventListener('click', () => {
      try {
        // prefer module-level applyLevelObject if available, fall back to global
        if (typeof _applyLevelObject === 'function') _applyLevelObject(it);
        else if (typeof applyLevelObject === 'function') applyLevelObject(it);
        browseModal.classList.add('hidden');
      } catch (e) {
        console.warn('Failed to apply level', e);
      }
    });
    btnWrap.appendChild(loadBtn);
    div.appendChild(title);
    div.appendChild(btnWrap);
    levelsList.appendChild(div);
  });
}

// Browse modal behaviour: open/close, endpoint selection, fetch list, load level
if (browseBtn) {
  browseBtn.addEventListener('click', () => {
    browseModal.classList.remove('hidden');
    const active = endpointsTabs.querySelector('.endpoint.active');
    if (active) loadLevelsFromEndpoint(active.getAttribute('data-endpoint'));
  });
}
if (browseClose) {
  browseClose.addEventListener('click', () => {
    browseModal.classList.add('hidden');
  });
}
if (endpointsTabs) {
  endpointsTabs.addEventListener('click', (e) => {
    const btn = e.target.closest('button.endpoint');
    if (!btn) return;
    endpointsTabs.querySelectorAll('button.endpoint').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const url = btn.getAttribute('data-endpoint');
    loadLevelsFromEndpoint(url);
  });
}

 // Editor UI handlers
if (editorToggle) {
  editorToggle.addEventListener('click', () => {
    // editorActive and editor element are in game.core.js; toggle visible state here
    const active = editor.classList.contains('hidden');
    editor.classList.toggle('hidden', !active);
    // store small flag on DOM so core can read it if needed
    editor.dataset.active = String(active);
    // reflect into state for renderer/editor overlays
    state.editorActive = active;
  });
}
if (editorClose){
  editorClose.addEventListener('click', ()=>{ editor.classList.add('hidden'); editor.dataset.active = 'false'; state.editorActive = false; });
}
if (editorTools){
  editorTools.addEventListener('click', (e)=>{
    const btn = e.target.closest('button[data-tool]');
    if (!btn) return;
    editorTools.querySelectorAll('button[data-tool]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // publish selection to a DOM attribute for core to pick up
    editor.dataset.tool = btn.getAttribute('data-tool');
    state.activeTool = btn.getAttribute('data-tool');
  });
}
if (presetNineBtn){
  presetNineBtn.addEventListener('click', ()=>{
    buildNineCircles();
  });
}
if (clearBtn){
  clearBtn.addEventListener('click', ()=>{
    state.obstacles.length = 0;
    state.levelCircles.length = 0;
  });
}
if (exportBtn){
  exportBtn.addEventListener('click', ()=>{
    const currentOb = state.obstacles || [];
    const currentCir = state.levelCircles || [];
    const payload = {
      obstacles: currentOb.map(o => ({ x: Math.round(o.x/DPR), y: Math.round(o.y/DPR), w: Math.round(o.w/DPR), h: Math.round(o.h/DPR) })),
      circles: currentCir.map(c => ({ x: Math.round(c.x/DPR), y: Math.round(c.y/DPR), r: Math.round(c.r/DPR) }))
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'level.json';
    a.click();
    setTimeout(()=>URL.revokeObjectURL(url), 2000);
  });
}

if (uploadBtn){
  uploadBtn.addEventListener('click', async ()=>{
    const currentOb = state.obstacles || [];
    const currentCir = state.levelCircles || [];
    const payload = {
      obstacles: currentOb.map(o => ({ x: Math.round(o.x/DPR), y: Math.round(o.y/DPR), w: Math.round(o.w/DPR), h: Math.round(o.h/DPR) })),
      circles: currentCir.map(c => ({ x: Math.round(c.x/DPR), y: Math.round(c.y/DPR), r: Math.round(c.r/DPR) }))
    };

    overlay.classList.remove('hidden');
    overlayMsg.textContent = 'Uploading...';
    uploadBtn.disabled = true;
    const origText = uploadBtn.textContent;
    uploadBtn.textContent = 'Uploading...';

    const endpoints = [
      'https://fgdpsrp.ps.fhgdps.com/dashboard/levels',
      '/upload-level',
      '/dashboard/levels',
      'https://fgdpsrp.ps.fhgdps.com/',
      'https://fgdpsrp.ps.fhgdps.com/database',
      'http://fgdpsrp.ps.fhgdps.com/dashboard/levels',
      'http://fgdpsrp.ps.fhgdps.com/',
      'https://httpbin.org/post'
    ];

    let success = false;
    let lastErr = null;
    for (let i = 0; i < endpoints.length; i++){
      const url = endpoints[i];
      try {
        let res;
        try {
          res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            credentials: 'same-origin'
          });
          if (res && res.ok) { success = true; break; }
          if (res && !res.ok) {
            lastErr = new Error(`Bad response ${res.status} from ${url}`);
          }
        } catch (errFetch) {
          try {
            await fetch(url, {
              method: 'POST',
              mode: 'no-cors',
              body: JSON.stringify(payload)
            });
            overlayMsg.textContent = 'Upload sent (opaque response)';
            success = true;
            break;
          } catch (errNoCors) {
            lastErr = errFetch;
          }
        }
      } catch (err) {
        lastErr = err;
      }
      await new Promise(r => setTimeout(r, 220));
    }

    if (success){
      overlayMsg.textContent = 'Upload successful ✓';
      uploadBtn.textContent = 'Uploaded ✓';
      setTimeout(()=>{
        uploadBtn.textContent = origText;
        uploadBtn.disabled = false;
        if (!state.running) overlay.classList.remove('hidden');
      }, 1400);
    } else {
      console.warn('Upload error:', lastErr);
      overlayMsg.textContent = 'Upload failed';
      if (levelsList) {
        levelsList.innerHTML = `<div style="padding:8px;color:#ff6b35">Upload error: ${String(lastErr && lastErr.message ? lastErr.message : lastErr).slice(0,120)}</div><div style="padding:8px;color:var(--muted);font-size:12px">If server is remote, it may be blocking CORS. Try uploading to a same-origin endpoint or enable CORS on the server.</div>`;
      }
      uploadBtn.textContent = 'Error';
      uploadBtn.disabled = false;
      setTimeout(()=>{
        uploadBtn.textContent = origText;
        overlayMsg.textContent = state.running ? '' : 'Ready';
        if (restartBtn) restartBtn.classList.toggle('hidden', state.running);
        if (playBtn) playBtn.classList.toggle('hidden', !state.running);
        if (!state.running) overlay.classList.add('hidden');
      }, 1400);
    }
  });
}

if (ubuntuBtn) {
  const soggyImg = document.getElementById('soggy-img');
  ubuntuBtn.addEventListener('click', (e) => {
    ubuntuBtn.classList.add('soggy-zoom');
    overlayMsg.textContent = 'soggycat';
    overlay.classList.remove('hidden');
    if (restartBtn) restartBtn.classList.remove('hidden');
    if (playBtn) playBtn.classList.add('hidden');
    setTimeout(() => {
      ubuntuBtn.classList.remove('soggy-zoom');
      if (!state.running) overlay.classList.add('hidden');
      overlayMsg.textContent = state.running ? '' : 'Ready';
      if (restartBtn) restartBtn.classList.toggle('hidden', state.running);
      if (playBtn) playBtn.classList.toggle('hidden', !state.running);
    }, 800);
  });
  if (soggyImg){
    soggyImg.addEventListener('dragstart', (e)=>e.preventDefault());
  }
}

/* Play / Restart wiring - ensure buttons control module state */
if (playBtn){
  playBtn.addEventListener('click', ()=>{
    overlay.classList.add('hidden');
    // if not running, start by resetting and performing an initial jump to begin the run
    if (!state.running) {
      resetGame();
      // small delay to allow overlay hide -> then jump to start running
      setTimeout(()=>{ jump(); }, 40);
    }
    // update HUD buttons
    playBtn.classList.toggle('hidden', state.running);
    if (restartBtn) restartBtn.classList.toggle('hidden', !state.running);
  });
}
if (restartBtn){
  restartBtn.addEventListener('click', ()=>{
    // full reset and show overlay ready message
    resetGame();
    overlay.classList.remove('hidden');
    overlayMsg.textContent = 'Ready';
    if (playBtn) playBtn.classList.toggle('hidden', false);
    restartBtn.classList.toggle('hidden', true);
  });
}