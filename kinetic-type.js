import { palette } from './palette.js';

const GATHER_TIME = 900, UNFURL_TIME = 1800;
const smooth = value => {const t = Math.max(0, Math.min(1, value)); return t * t * (3 - 2 * t);};
const random = index => {const n = Math.sin(index * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n);};

export function initKineticType() {
  const body = document.body;
  const story = document.querySelector('.world-story');
  if (!story || body.dataset.kineticType) return;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const scene = document.createElement('div');
  scene.className = 'kinetic-type-scene';
  scene.setAttribute('aria-hidden', 'true');
  const tank = document.createElement('canvas');
  tank.className = 'kinetic-type-tank';
  const context = tank.getContext('2d', {alpha: true});
  if (!context) return;
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);
  scene.append(tank);
  const read = document.createElement('button');
  read.className = 'kinetic-type-read';
  read.textContent = 'Read ↓';
  read.setAttribute('aria-label', 'Return the letters to the article');
  body.append(scene, read);

  let letters = [], sources = [], wakes = [], phase = '', frame = 0, previousTime = 0;
  let away = document.hidden || !document.hasFocus() || performance.getEntriesByType('navigation')[0]?.type === 'back_forward';
  let gatherAt = 0, startedAt = 0, previousFocus;
  const pointer = {x: 0, y: 0, time: 0};
  body.dataset.kineticType = reducedMotion.matches ? 'reduced' : 'ready';

  function finish() {
    cancelAnimationFrame(frame);
    frame = 0;
    const wasActive = Boolean(phase);
    const restoreControl = document.activeElement === read;
    phase = '';
    for (const source of sources) source.classList.remove('water-source');
    sources = []; letters = []; wakes = [];
    clear();
    body.classList.remove('type-water-active');
    delete body.dataset.kineticPointer;
    delete body.dataset.kineticLetters;
    body.dataset.kineticType = reducedMotion.matches ? 'reduced' : 'ready';
    if (wasActive) document.dispatchEvent(new Event('kineticend'));
    if (restoreControl) (previousFocus?.isConnected && previousFocus !== body ? previousFocus : story).focus({preventScroll: true});
  }

  function captureLetters() {
    tank.width = Math.ceil(innerWidth * pixelRatio); tank.height = Math.ceil(innerHeight * pixelRatio);
    const range = document.createRange(), captured = [];
    for (const source of document.querySelectorAll('.world-title, .world-story .story-paragraph')) {
      const bounds = source.getBoundingClientRect();
      if (bounds.bottom <= 0 || bounds.top >= innerHeight) continue;
      const walker = document.createTreeWalker(source, NodeFilter.SHOW_TEXT);
      let hasVisibleLetters = false;
      while (walker.nextNode()) {
        const node = walker.currentNode, style = getComputedStyle(node.parentElement);
        let offset = 0;
        for (const glyph of node.textContent) {
          const start = offset;
          offset += glyph.length;
          if (/\s/u.test(glyph)) continue;
          range.setStart(node, start); range.setEnd(node, offset);
          const rect = range.getBoundingClientRect();
          if (!rect.width || rect.bottom <= 0 || rect.top >= innerHeight) continue;
          captured.push({glyph, font: style.fontStyle + ' ' + style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily,
            size: parseFloat(style.fontSize), width: rect.width,
            homeX: rect.left + rect.width / 2 + scrollX, homeY: (rect.top + rect.bottom) / 2 + scrollY});
          hasVisibleLetters = true;
        }
      }
      if (hasVisibleLetters) sources.push(source);
    }
    const count = Math.min(captured.length, innerWidth < 650 ? 320 : 620);
    const textures = new Map();
    letters = Array.from({length: count}, (_, index) => {
      const letter = captured[Math.floor(index * captured.length / count)];
      const colour = index % 3, key = letter.glyph + letter.font + colour;
      if (!textures.has(key)) {
        const image = document.createElement('canvas');
        const width = Math.ceil(letter.width + letter.size * .3), height = Math.ceil(letter.size * 1.4);
        image.width = Math.ceil(width * pixelRatio); image.height = Math.ceil(height * pixelRatio);
        const ink = image.getContext('2d');
        ink.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
        ink.font = letter.font; ink.textAlign = 'center'; ink.textBaseline = 'middle';
        const gradient = ink.createLinearGradient(0, 0, width, 0);
        for (let stop = 0; stop < 5; stop++) gradient.addColorStop(stop / 4, palette[(colour * 3 + stop) % palette.length]);
        ink.fillStyle = gradient; ink.fillText(letter.glyph, width / 2, height / 2);
        textures.set(key, {image, width, height});
      }
      const depth = random(index + 31);
      const size = (innerWidth < 650 ? 11 : 13) + depth ** 2 * (innerWidth < 650 ? 28 : 44);
      return {...letter, texture: textures.get(key), depth, targetScale: size / letter.size,
        targetOpacity: .24 + depth * .72,
        waterX: innerWidth * (.055 + random(index + 1) * .89),
        waterY: innerHeight * (.075 + random(index + 701) * .81),
        vx: 0, vy: 0, turn: 0, rotation: (random(index + 1201) - .5) * Math.PI * 2,
        drift: (random(index + 1701) - .5) * .12,
        x: letter.homeX - scrollX, y: letter.homeY - scrollY, angle: 0, scale: 1, opacity: 1};
    });
  }

  function clear() {
    context.setTransform(1, 0, 0, 1, 0, 0);
    context.clearRect(0, 0, tank.width, tank.height);
  }

  function draw() {
    clear();
    for (const letter of letters) {
      const scale = pixelRatio * letter.scale, cos = Math.cos(letter.angle), sin = Math.sin(letter.angle);
      context.setTransform(scale * cos, scale * sin, -scale * sin, scale * cos, pixelRatio * letter.x, pixelRatio * letter.y);
      context.globalAlpha = letter.opacity;
      const {image, width, height} = letter.texture;
      context.drawImage(image, -width / 2, -height / 2, width, height);
    }
  }

  function swim(letter, dt, now) {
    const t = (now - startedAt) / 1000, mobility = .55 + letter.depth * .65;
    const x = letter.waterX / innerWidth, y = letter.waterY / innerHeight;
    // Broad, overlapping currents; no fixed orbit or attraction back to a layout.
    const sx = Math.sin(x * Math.PI), sy = Math.sin(y * Math.PI);
    const cx = Math.cos(x * Math.PI), cy = Math.cos(y * Math.PI);
    const waveX = x * Math.PI * 2 + t * .17, waveY = y * Math.PI * 2 - t * .13;
    const current = Math.cos(waveX) + Math.sin(waveY);
    const strength = 6 * mobility * Math.min(innerWidth, innerHeight);
    // Curl of a stream function: currents turn before the glass rather than collecting at its edges.
    const flowX = strength / innerHeight * sx ** 2 * (2 * sy * cy * current + 2 * sy ** 2 * Math.cos(waveY));
    const flowY = -strength / innerWidth * sy ** 2 * (2 * sx * cx * current - 2 * sx ** 2 * Math.sin(waveX));
    const drag = 1 - Math.exp(-dt * 1.05);
    letter.vx += (flowX - letter.vx) * drag; letter.vy += (flowY - letter.vy) * drag;
    letter.turn *= Math.exp(-dt * 1.4);
    for (const wake of wakes) {
      const along = Math.max(0, Math.min(1, ((letter.waterX - wake.x0) * wake.dx + (letter.waterY - wake.y0) * wake.dy) / wake.lengthSquared));
      const dx = letter.waterX - wake.x0 - wake.dx * along, dy = letter.waterY - wake.y0 - wake.dy * along;
      const distance = Math.hypot(dx, dy);
      if (distance >= wake.radius) continue;
      const force = (1 - distance / wake.radius) ** 2 * wake.fade * mobility * dt;
      const radial = wake.speed * .65 / Math.max(distance, 18);
      letter.vx += (wake.vx * 2.8 + dx * radial) * force;
      letter.vy += (wake.vy * 2.8 + dy * radial) * force;
      letter.turn += (wake.vx * dy - wake.vy * dx) / (wake.radius ** 2) * force * 3;
    }
    // A soft wall keeps the water populated without visibly bouncing off a box.
    const margin = Math.min(65, innerWidth * .09);
    letter.vx += (Math.max(0, margin - letter.waterX) - Math.max(0, letter.waterX - innerWidth + margin)) * dt * 2;
    letter.vy += (Math.max(0, margin - letter.waterY) - Math.max(0, letter.waterY - innerHeight + margin)) * dt * 2;
    const speed = Math.hypot(letter.vx, letter.vy);
    if (speed > 420) {letter.vx *= 420 / speed; letter.vy *= 420 / speed;}
    letter.waterX += letter.vx * dt; letter.waterY += letter.vy * dt;
    if (letter.waterX < -30 || letter.waterX > innerWidth + 30) {
      letter.waterX = Math.max(-30, Math.min(innerWidth + 30, letter.waterX)); letter.vx *= -.4;
    }
    if (letter.waterY < -30 || letter.waterY > innerHeight + 30) {
      letter.waterY = Math.max(-30, Math.min(innerHeight + 30, letter.waterY)); letter.vy *= -.4;
    }
    letter.turn = Math.max(-2.4, Math.min(2.4, letter.turn));
    letter.rotation += (letter.drift + letter.turn) * dt;
  }

  function render(now) {
    frame = 0;
    if (!phase || document.hidden || !document.hasFocus()) return;
    const dt = Math.min((now - previousTime) / 1000, .04) || 1 / 60;
    previousTime = now;
    const gathering = phase === 'gathering';
    const mix = smooth((now - (gathering ? gatherAt : startedAt)) / (gathering ? GATHER_TIME : UNFURL_TIME));
    wakes = wakes.filter(wake => now - wake.time < 1700);
    for (const wake of wakes) wake.fade = Math.exp(-(now - wake.time) / 520);
    if (now - pointer.time > 250) delete body.dataset.kineticPointer;
    for (const letter of letters) {
      const homeX = letter.homeX - scrollX, homeY = letter.homeY - scrollY;
      if (gathering) {
        letter.x = letter.from.x + (homeX - letter.from.x) * mix; letter.y = letter.from.y + (homeY - letter.from.y) * mix;
        letter.angle = letter.from.angle * (1 - mix); letter.scale = letter.from.scale + (1 - letter.from.scale) * mix;
        letter.opacity = letter.from.opacity + (1 - letter.from.opacity) * mix;
      } else {
        swim(letter, dt, now);
        letter.x = homeX + (letter.waterX - homeX) * mix; letter.y = homeY + (letter.waterY - homeY) * mix;
        letter.angle = letter.rotation * mix; letter.scale = 1 + (letter.targetScale - 1) * mix;
        letter.opacity = 1 + (letter.targetOpacity - 1) * mix;
      }
    }
    draw();
    if (gathering && now - gatherAt >= GATHER_TIME) finish();
    else frame = requestAnimationFrame(render);
  }

  function start() {
    if (phase) return;
    if (reducedMotion.matches || document.querySelector('dialog[open], .passage-companion:not([hidden])')) {
      body.dataset.kineticType = reducedMotion.matches ? 'reduced' : 'ready';
      return;
    }
    previousFocus = document.activeElement;
    body.classList.add('type-water-active');
    document.dispatchEvent(new Event('kineticstart'));
    captureLetters();
    if (!letters.length) {phase = 'water'; finish(); return;}
    phase = 'water';
    for (const source of sources) source.classList.add('water-source');
    draw();
    body.dataset.kineticType = 'water'; body.dataset.kineticLetters = String(letters.length);
    pointer.time = 0; previousTime = startedAt = performance.now();
    frame = requestAnimationFrame(render);
  }

  function gather() {
    if (phase !== 'water') return;
    phase = 'gathering'; gatherAt = performance.now(); wakes = [];
    for (const letter of letters) letter.from = {x: letter.x, y: letter.y, angle: letter.angle,
      scale: letter.scale, opacity: letter.opacity};
    body.dataset.kineticType = 'gathering';
  }

  function leave() {
    away = true;
    pointer.time = 0; cancelAnimationFrame(frame); frame = 0;
    if (!reducedMotion.matches) body.dataset.kineticType = 'away';
  }

  function returnToPage() {
    if (document.hidden || !document.hasFocus() || !away) return;
    away = false;
    if (phase) {
      body.dataset.kineticType = phase; previousTime = performance.now(); frame = requestAnimationFrame(render);
    } else start();
  }

  window.addEventListener('pointermove', event => {
    if (phase !== 'water' || event.target.closest?.('button')) return;
    const now = performance.now();
    if (pointer.time && now - pointer.time < 120) {
      const dx = event.clientX - pointer.x, dy = event.clientY - pointer.y, distance = Math.hypot(dx, dy);
      const dt = Math.max((now - pointer.time) / 1000, .008);
      if (distance > 1) {
        const speed = Math.min(1600, distance / dt);
        wakes.push({x0: pointer.x, y0: pointer.y, dx, dy, lengthSquared: dx * dx + dy * dy,
          vx: dx / distance * speed, vy: dy / distance * speed, speed,
          radius: Math.min(innerWidth * .28, 90 + speed * .04), time: now});
        if (wakes.length > 8) wakes.shift();
        body.dataset.kineticPointer = 'swishing';
      }
    }
    pointer.x = event.clientX; pointer.y = event.clientY; pointer.time = now;
  }, {passive: true});
  read.addEventListener('click', gather);
  window.addEventListener('pointerout', event => {if (!event.relatedTarget) pointer.time = 0;});
  window.addEventListener('wheel', gather, {passive: true});
  window.addEventListener('scroll', () => {if (performance.now() - startedAt > 200) gather();}, {passive: true});
  window.addEventListener('keydown', event => {
    if (!phase) return;
    if (event.key === 'Tab') finish();
    else if (['Escape', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) gather();
  });
  window.addEventListener('blur', leave); window.addEventListener('focus', returnToPage);
  window.addEventListener('pagehide', leave); window.addEventListener('pageshow', returnToPage);
  document.addEventListener('visibilitychange', () => {if (document.hidden) leave(); else returnToPage();});
  window.addEventListener('resize', finish); reducedMotion.addEventListener('change', finish);
  document.addEventListener('readingcompanionopen', finish);
  const dialogs = new MutationObserver(() => {if (phase && document.querySelector('dialog[open]')) finish();});
  for (const dialog of document.querySelectorAll('dialog')) dialogs.observe(dialog, {attributes: true, attributeFilter: ['open']});
  returnToPage();
}
