const IMPORTANT = [
  'expressed dismay over how the authorities handled the case',
  'like, it wasn’t handled',
  'information was not referred to the local prosecutor',
  'None of the seven has been criminally charged',
  'denied to NBC News',
  'independent review',
  'reopen his inquiry',
  'range of sanctions',
  'support for Doe',
  'frustration and anger',
];
const PAUSE = 5500;

export function initLivingText() {
  const article = document.querySelector('.world-story');
  if (!article || article.dataset.livingText) return;
  article.dataset.livingText = 'ready';
  const paragraphs = [...article.querySelectorAll('.story-paragraph')];
  const body = document.body;
  let focused = null, readingTarget = null, lastReading = null;
  let idleTimer = 0, scrollFrame = 0;
  let fontScrollUntil = 0;
  let away = document.hidden || !document.hasFocus();

  for (const paragraph of paragraphs) {
    const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
      if (node.parentElement.closest('.world-word, a, .story-emphasis')) continue;
      const text = node.textContent;
      const hits = IMPORTANT.flatMap(phrase => {
        const start = text.indexOf(phrase);
        return start < 0 ? [] : [{start, end: start + phrase.length}];
      }).sort((a, b) => a.start - b.start);
      if (!hits.length) continue;
      const fragment = document.createDocumentFragment();
      let offset = 0;
      for (const hit of hits) {
        if (hit.start < offset) continue;
        fragment.append(text.slice(offset, hit.start));
        const emphasis = document.createElement('span');
        emphasis.className = 'story-emphasis';
        emphasis.textContent = text.slice(hit.start, hit.end);
        fragment.append(emphasis);
        offset = hit.end;
      }
      fragment.append(text.slice(offset));
      node.replaceWith(fragment);
    }
  }

  function measure() {
    // Capture each paragraph's own size, including the smaller support note.
    if (focused) fontScrollUntil = performance.now() + 700;
    article.classList.add('attention-measuring');
    focused?.classList.remove('reading-focus');
    for (const paragraph of paragraphs) {
      paragraph.style.setProperty('--attention-base-size', getComputedStyle(paragraph).fontSize);
    }
    focused?.classList.add('reading-focus');
    void article.offsetHeight;
    article.classList.remove('attention-measuring');
  }

  function pickParagraph() {
    const line = innerHeight * .38;
    let closest = null, distance = Infinity;
    for (const paragraph of paragraphs) {
      const rect = paragraph.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= innerHeight) continue;
      const gap = Math.max(rect.top - line, line - rect.bottom, 0);
      if (gap < distance) {closest = paragraph; distance = gap;}
    }
    return closest;
  }

  function updateTarget() {
    readingTarget = pickParagraph();
    if (!focused && readingTarget) lastReading = readingTarget;
  }

  function enlarge(paragraph, attention) {
    if (focused !== paragraph) fontScrollUntil = performance.now() + 700;
    focused?.classList.remove('reading-focus');
    focused = paragraph;
    focused?.classList.add('reading-focus');
    if (focused) lastReading = focused;
    body.dataset.readingAttention = attention;
  }

  function restartTimer() {
    clearTimeout(idleTimer);
    if (away || body.classList.contains('type-water-active')) return;
    idleTimer = setTimeout(() => {
      if (away || document.hidden || body.classList.contains('type-water-active')) return;
      updateTarget();
      enlarge(readingTarget, 'paused');
    }, PAUSE);
  }

  function activity() {
    if (away || body.classList.contains('type-water-active')) return;
    if (focused) fontScrollUntil = performance.now() + 700;
    focused?.classList.remove('reading-focus');
    focused = null;
    body.dataset.readingAttention = 'reading';
    updateTarget();
    restartTimer();
  }

  function leave() {
    if (!away) {
      updateTarget();
      lastReading = focused || readingTarget || lastReading;
    }
    away = true;
    clearTimeout(idleTimer);
    body.dataset.readingAttention = 'away';
  }

  function returnToReading() {
    if (document.hidden || !document.hasFocus() || !away) return;
    away = false;
    if (body.classList.contains('type-water-active')) return;
    updateTarget();
    const rect = lastReading?.getBoundingClientRect();
    enlarge(rect && rect.bottom > 0 && rect.top < innerHeight ? lastReading : readingTarget, 'returned');
    restartTimer();
  }

  window.addEventListener('wheel', activity, {passive: true});
  window.addEventListener('touchmove', activity, {passive: true});
  window.addEventListener('keydown', event => {
    if (!['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(event.key)) return;
    if (event.target.closest?.('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key === ' ' && event.target.closest?.('button, [role="button"]')) return;
    activity();
  });
  window.addEventListener('scroll', () => {
    // Font transitions can cause scroll anchoring; other scrolling is reader activity.
    if (!scrollFrame && !away) scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      if (away) return;
      if (performance.now() < fontScrollUntil) updateTarget();
      else activity();
    });
  }, {passive: true});
  window.addEventListener('resize', () => {measure(); updateTarget();});
  window.addEventListener('blur', leave);
  window.addEventListener('focus', returnToReading);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) leave(); else returnToReading();
  });
  document.addEventListener('kineticstart', () => {
    clearTimeout(idleTimer);
    body.dataset.readingAttention = 'water';
  });
  document.addEventListener('kineticend', activity);

  measure();
  updateTarget();
  body.dataset.readingAttention = away ? 'away' : 'reading';
  restartTimer();
}
