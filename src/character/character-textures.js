import * as THREE from 'three';

function rendererAnisotropy(renderer, cap) {
  return Math.min(cap, renderer.capabilities.getMaxAnisotropy?.() || 1);
}

export function makeTronRunnerShadowTexture(renderer, softness = 0.9) {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const center = size * 0.5;
  const soft = THREE.MathUtils.clamp(softness, 0.2, 1.6);
  const midStop = THREE.MathUtils.clamp(0.18 + soft * 0.16, 0.18, 0.44);
  const falloffStop = THREE.MathUtils.clamp(0.52 + soft * 0.22, 0.52, 0.92);
  const gradient = ctx.createRadialGradient(center, center, size * 0.04, center, center, size * 0.49);
  gradient.addColorStop(0, 'rgb(255,255,255)');
  gradient.addColorStop(midStop, 'rgb(190,190,190)');
  gradient.addColorStop(falloffStop, 'rgb(58,58,58)');
  gradient.addColorStop(1, 'rgb(0,0,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = rendererAnisotropy(renderer, 4);
  texture.needsUpdate = true;
  return texture;
}

function configureTronRunnerSuitTexture(renderer, texture) {
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 1);
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = true;
  texture.anisotropy = rendererAnisotropy(renderer, 8);
  texture.needsUpdate = true;
  return texture;
}

export function makeTronRunnerSuitTexture(renderer) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const base = ctx.createLinearGradient(0, 0, 0, size);
  base.addColorStop(0, '#071016');
  base.addColorStop(0.45, '#04080b');
  base.addColorStop(1, '#020405');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);

  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (let i = 0; i < 1400; i += 1) {
    const x = (Math.sin(i * 17.234) * 0.5 + 0.5) * size;
    const y = (Math.sin(i * 31.741 + 3.2) * 0.5 + 0.5) * size;
    const a = 0.012 + ((i % 7) * 0.003);
    ctx.fillStyle = `rgba(91, 156, 166, ${a})`;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  ctx.restore();

  ctx.lineJoin = 'miter';
  ctx.lineCap = 'butt';
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.58)';
  ctx.lineWidth = 8;
  [
    [52, 42, 164, 176],
    [296, 42, 164, 176],
    [76, 216, 360, 108],
    [46, 360, 178, 110],
    [288, 360, 178, 110],
  ].forEach(([x, y, w, h]) => ctx.strokeRect(x, y, w, h));

  ctx.strokeStyle = 'rgba(94, 170, 184, 0.16)';
  ctx.lineWidth = 2;
  [
    [56, 46, 156, 168],
    [300, 46, 156, 168],
    [80, 220, 352, 100],
    [50, 364, 170, 102],
    [292, 364, 170, 102],
  ].forEach(([x, y, w, h]) => ctx.strokeRect(x, y, w, h));

  ctx.strokeStyle = 'rgba(82, 247, 255, 0.14)';
  ctx.lineWidth = 1.5;
  [[256, 28, 256, 482], [36, 252, 476, 252], [112, 332, 218, 464], [400, 332, 294, 464]].forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return configureTronRunnerSuitTexture(renderer, texture);
}

export function makeTronRunnerSuitEmissiveTexture(renderer) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  const body = ctx.createLinearGradient(0, 0, 0, size);
  body.addColorStop(0, '#1b2a30');
  body.addColorStop(0.5, '#0c1519');
  body.addColorStop(1, '#070a0c');
  ctx.fillStyle = body;
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = 'rgba(46, 84, 92, 0.78)';
  ctx.lineWidth = 5;
  [
    [56, 46, 156, 168],
    [300, 46, 156, 168],
    [80, 220, 352, 100],
    [50, 364, 170, 102],
    [292, 364, 170, 102],
  ].forEach(([x, y, w, h]) => ctx.strokeRect(x, y, w, h));

  ctx.fillStyle = 'rgba(32, 58, 64, 0.68)';
  [
    [70, 60, 128, 140],
    [314, 60, 128, 140],
    [96, 236, 320, 68],
    [68, 380, 132, 72],
    [312, 380, 132, 72],
  ].forEach(([x, y, w, h]) => ctx.fillRect(x, y, w, h));

  function glowLine(x1, y1, x2, y2, width = 3, alpha = 0.88) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(53, 230, 255, 0.78)';
    ctx.shadowBlur = 10;
    ctx.strokeStyle = `rgba(88, 248, 255, ${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(235, 255, 255, ${Math.min(1, alpha + 0.08)})`;
    ctx.lineWidth = Math.max(1, width * 0.38);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  glowLine(256, 30, 256, 206, 3.2, 0.9);
  glowLine(256, 250, 256, 482, 3.2, 0.9);
  glowLine(78, 116, 212, 116, 2.8, 0.72);
  glowLine(300, 116, 434, 116, 2.8, 0.72);
  glowLine(82, 252, 430, 252, 3, 0.82);
  glowLine(108, 344, 214, 456, 2.6, 0.7);
  glowLine(404, 344, 298, 456, 2.6, 0.7);
  glowLine(112, 52, 76, 196, 2.4, 0.58);
  glowLine(400, 52, 436, 196, 2.4, 0.58);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return configureTronRunnerSuitTexture(renderer, texture);
}

export function makeTronRunnerSuitLedMaskTexture(renderer) {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, size, size);

  function maskLine(x1, y1, x2, y2, width = 3, alpha = 0.9) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.shadowColor = 'rgba(120, 252, 255, 0.9)';
    ctx.shadowBlur = 14;
    ctx.strokeStyle = `rgba(164, 255, 255, ${alpha})`;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, alpha + 0.08)})`;
    ctx.lineWidth = Math.max(1, width * 0.34);
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  maskLine(256, 30, 256, 206, 3.2, 0.95);
  maskLine(256, 250, 256, 482, 3.2, 0.95);
  maskLine(78, 116, 212, 116, 2.8, 0.76);
  maskLine(300, 116, 434, 116, 2.8, 0.76);
  maskLine(82, 252, 430, 252, 3, 0.86);
  maskLine(108, 344, 214, 456, 2.6, 0.74);
  maskLine(404, 344, 298, 456, 2.6, 0.74);
  maskLine(112, 52, 76, 196, 2.4, 0.62);
  maskLine(400, 52, 436, 196, 2.4, 0.62);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return configureTronRunnerSuitTexture(renderer, texture);
}
