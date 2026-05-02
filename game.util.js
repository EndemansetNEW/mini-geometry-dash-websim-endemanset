/* game.util.js
   Utilities and shared DOM/canvas setup moved out of core.
*/

export const canvas = document.getElementById('game');
export const ctx = canvas.getContext('2d', { alpha: false });

export let W = devicePixelRatio * innerWidth;
export let H = devicePixelRatio * innerHeight;
canvas.width = W;
canvas.height = H;
canvas.style.width = `${innerWidth}px`;
canvas.style.height = `${innerHeight}px`;

export const DPR = devicePixelRatio || 1;
export const vw = innerWidth;
export const vh = innerHeight;

export function onResize(){
  W = devicePixelRatio * innerWidth;
  H = devicePixelRatio * innerHeight;
  canvas.width = W;
  canvas.height = H;
  canvas.style.width = `${innerWidth}px`;
  canvas.style.height = `${innerHeight}px`;
}

// shared texture used for obstacles and level circles (download (1).webp)
export const textureImg = new Image();
textureImg.src = '/download (1).webp';
textureImg.crossOrigin = 'anonymous';

export const groundHeight = Math.max(24, Math.round(0.12 * vh)) * DPR;