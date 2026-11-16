// Sphere projection and dotted lattice adapted from thinking-orbs by Jakub Antalik.
// MIT license: vendor/thinking-orbs-LICENSE.txt. https://github.com/Jakubantalik/Libraries.dev
const SIZE = 64;

export function orbDots(time, attention = 0) {
  const dots = [], yaw = time * .28, tilt = .4 + .06 * Math.sin(time * .35);
  const sy = Math.sin(yaw), cy = Math.cos(yaw), st = Math.sin(tilt), ct = Math.cos(tilt);
  const radius = 25 * (1 + .025 * Math.sin(time * .8));
  for (let ring = 0; ring <= 13; ring++) {
    const latitude = -Math.PI / 2 + ring / 13 * Math.PI;
    const cosLat = Math.cos(latitude), sinLat = Math.sin(latitude);
    const count = Math.max(1, Math.round(Math.abs(cosLat) * 36));
    const wave = 1 + attention * .09 * Math.sin(time * 2.1 - ring * .52);
    for (let dot = 0; dot < count; dot++) {
      const longitude = dot / count * Math.PI * 2;
      const x = cosLat * Math.cos(longitude), y = sinLat, z = cosLat * Math.sin(longitude);
      const rx = x * cy + z * sy, rz = -x * sy + z * cy;
      const ry = y * ct - rz * st, depthZ = y * st + rz * ct;
      const depth = (depthZ + 1) / 2;
      dots.push({x: SIZE / 2 + rx * radius * wave, y: SIZE / 2 - ry * radius * wave,
        z: depthZ, radius: .32 + .9 * depth, silver: Math.round(65 + 175 * depth)});
    }
  }
  return dots.sort((a, b) => a.z - b.z);
}

export function drawOrb(context, time, attention = 0) {
  context.clearRect(0, 0, SIZE, SIZE);
  for (const dot of orbDots(time, attention)) {
    context.fillStyle = `rgb(${dot.silver},${dot.silver},${dot.silver})`;
    context.beginPath();
    context.arc(dot.x, dot.y, dot.radius, 0, Math.PI * 2);
    context.fill();
  }
}

export function initChatOrb(button) {
  const canvas = document.createElement('canvas');
  canvas.className = 'orb-sphere'; canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (!context) {button.textContent = '◉'; return;}
  const dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = canvas.height = SIZE * dpr;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  button.append(canvas);
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0, lastPaint = 0, attention = 0, hovering = false, focused = false;
  const visible = () => !button.hidden && !document.hidden && !document.querySelector('dialog[open]');
  function animate(time) {
    frame = 0;
    if (!visible() || reducedMotion.matches) return;
    // One small canvas at 30fps is enough for the slow orbit.
    if (time - lastPaint >= 1000 / 30) {
      attention += ((hovering || focused ? 1 : 0) - attention) * .12;
      drawOrb(context, time / 1000, attention);
      lastPaint = time;
    }
    frame = requestAnimationFrame(animate);
  }
  function sync() {
    if (!visible() || reducedMotion.matches) {
      cancelAnimationFrame(frame); frame = 0;
      if (reducedMotion.matches) drawOrb(context, 0);
    } else if (!frame) frame = requestAnimationFrame(animate);
  }
  button.addEventListener('pointerenter', () => {hovering = true;});
  button.addEventListener('pointerleave', () => {hovering = false;});
  button.addEventListener('focus', () => {focused = true;});
  button.addEventListener('blur', () => {focused = false;});
  const observer = new MutationObserver(sync);
  observer.observe(button, {attributes: true, attributeFilter: ['hidden']});
  for (const dialog of document.querySelectorAll('dialog')) observer.observe(dialog, {attributes: true, attributeFilter: ['open']});
  document.addEventListener('visibilitychange', sync);
  reducedMotion.addEventListener('change', sync);
  drawOrb(context, 0); sync();
}
