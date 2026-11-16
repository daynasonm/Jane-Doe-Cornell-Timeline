import { initArticleTypesetting } from './article-typesetting.js';

const articleUrl = location.origin + '/';
const articleTitle = 'Jane Doe at Cornell — The unfolding timeline';
const dialog = document.querySelector('#exit-dialog');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const statusNote = document.querySelector('#current-status');
const timelineMap = document.querySelector('#timeline-map');
function dismissStatus() { statusNote.hidden = true; }
document.querySelector('[data-dismiss-status]').addEventListener('click', () => {
  dismissStatus();
  document.querySelector('[data-show-status]').focus({preventScroll:true});
});
document.querySelector('[data-enter-timeline]').addEventListener('click', () => {
  dismissStatus();
  timelineMap.scrollIntoView({behavior:reducedMotion.matches?'instant':'smooth',block:'start'});
  timelineMap.querySelector('[data-map-year="all"]').focus({preventScroll:true});
});
document.querySelector('[data-show-status]').addEventListener('click', () => { statusNote.hidden = false; });
let previousScrollY = scrollY;
window.addEventListener('scroll', () => {
  if (!statusNote.hidden && scrollY>previousScrollY && scrollY>20 && timelineMap.getBoundingClientRect().top<=80) dismissStatus();
  previousScrollY = scrollY;
}, {passive:true});
const toast = document.querySelector('.toast');
const linkDialog = document.querySelector('.link-dialog');
const manualLink = document.querySelector('#manual-link');
let toastTimer, closeTimer, previousFocus, leaving = false, hasRead = false;
const arrivedAt = Date.now();
document.addEventListener('visibilitychange', () => {
  document.documentElement.classList.toggle('palette-paused', document.hidden);
});
// ponytail: exit intent is a cursor heuristic; browsers cannot animate a real tab close.
let shownAutomatically = false;
try { shownAutomatically = sessionStorage.getItem('timeline-motion-seen') === 'yes'; } catch {}

function notify(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3600);
}

function markSeen() {
  shownAutomatically = true;
  try { sessionStorage.setItem('timeline-motion-seen', 'yes'); } catch {}
}

function openMotion() {
  if (dialog.open) return;
  markSeen();
  clearTimeout(closeTimer);
  previousFocus = document.activeElement;
  leaving = false;
  dialog.className = '';
  dialog.showModal();
  void dialog.offsetWidth;
  dialog.classList.add('arriving');
}

function finishClosing() {
  dialog.close();
  dialog.className = '';
  leaving = false;
  if (previousFocus?.isConnected) previousFocus.focus({preventScroll: true});
}

function closeMotion() {
  if (!dialog.open || leaving) return;
  leaving = true;
  dialog.classList.remove('arriving');
  dialog.classList.add('departing');
  if (reducedMotion.matches) return finishClosing();
  closeTimer = setTimeout(finishClosing, 350);
}

function automaticMotion() {
  if (shownAutomatically || document.querySelector('dialog[open]') || document.body.classList.contains('type-water-active') || Date.now() - arrivedAt < 10000 || !hasRead) return;
  openMotion();
}

function manualCopy() {
  linkDialog.showModal();
  manualLink.focus();
  manualLink.select();
}

async function copyArticle() {
  try {
    await navigator.clipboard.writeText(articleUrl);
    markSeen();
    closeMotion();
    notify('Article link copied. Pass it on.');
  } catch {
    manualCopy();
  }
}

async function shareArticle(event) {
  if (!navigator.share) return copyArticle();
  const button = event.currentTarget;
  button.disabled = true;
  try {
    // Call while the click's user activation is live, before awaiting any motion.
    await navigator.share({title: articleTitle, text: 'A story worth reading and carrying forward.', url: articleUrl});
    markSeen();
    closeMotion();
    notify('Thank you for carrying the story forward.');
  } catch (error) {
    if (error.name === 'AbortError') notify('Sharing cancelled. The story is still here.');
    else manualCopy();
  } finally {
    button.disabled = false;
  }
}

document.querySelectorAll('[data-preview]').forEach(button => button.addEventListener('click', openMotion));
document.querySelectorAll('[data-share]').forEach(button => button.addEventListener('click', shareArticle));
document.querySelectorAll('[data-copy]').forEach(button => button.addEventListener('click', copyArticle));
document.querySelector('.dialog-close').addEventListener('click', closeMotion);
document.querySelector('.dismiss-prompt').addEventListener('click', closeMotion);
dialog.addEventListener('cancel', event => {event.preventDefault(); closeMotion();});
document.querySelector('#close-link').addEventListener('click', () => {linkDialog.close(); closeMotion();});

document.documentElement.addEventListener('mouseleave', event => {
  if (event.clientY <= 5 && !event.relatedTarget && matchMedia('(hover: hover) and (pointer: fine)').matches) automaticMotion();
});
function updateReading() {
  if (scrollY > document.querySelector('#article').offsetTop - innerHeight * .65) hasRead = true;
}
window.addEventListener('scroll', updateReading, {passive: true});
new IntersectionObserver(entries => {
  if (entries[0].isIntersecting && matchMedia('(hover: none)').matches) automaticMotion();
}, {threshold: .5}).observe(document.querySelector('.endnote'));
await document.fonts.load('700 100px "Akzidenz Grotesk"');
await document.fonts.ready;
updateReading();


initArticleTypesetting();

