import { glossary, normalizeWord, questionsForPassage } from './reading-context.js';
import { initChatOrb } from './chat-orb.js';
const article = document.querySelector('#article');
const paragraphs = [...article.querySelectorAll('.story-paragraph')];
for (const paragraph of paragraphs) {
  const text = document.createElement('span');
  text.className = 'reading-passage';
  text.append(...paragraph.childNodes); paragraph.append(text);
}
function positionParagraphMarker(paragraph) {
  if (!paragraph) return;
  const bounds = paragraph.getBoundingClientRect();
  const first = [...paragraph.querySelector('.reading-passage').getClientRects()].find(rect => rect.width && rect.height);
  paragraph.style.setProperty('--paragraph-marker-height', first ? `${first.height}px` : '0px');
  if (!first) return;
  paragraph.style.setProperty('--paragraph-marker-left', `${first.left - bounds.left - 10}px`);
  paragraph.style.setProperty('--paragraph-marker-top', `${first.top - bounds.top}px`);
}
const panel = document.createElement('aside');
panel.className = 'passage-companion'; panel.hidden = true; panel.setAttribute('role','dialog'); panel.setAttribute('aria-labelledby','companion-heading');
const heading = document.createElement('h2'); heading.id='companion-heading'; heading.textContent = 'Stay with this passage';
const close = document.createElement('button'); close.type = 'button'; close.textContent = '×'; close.className='companion-close'; close.setAttribute('aria-label','Close reading companion');
const content = document.createElement('div'); content.className='companion-content'; content.setAttribute('role','status');
const suggestions = document.createElement('div'); suggestions.className='companion-suggestions';
const answers = document.createElement('div'); answers.className='inline-answers'; answers.setAttribute('role','log'); answers.setAttribute('aria-live','polite');
panel.append(heading,close,content,suggestions,answers);
const tools = document.querySelector('.companion-tools');
panel.append(tools); tools.hidden = false;
const orb = document.createElement('button');
orb.type='button'; orb.className='pixel-chat-orb'; orb.id='pixel-chat-orb';
orb.setAttribute('aria-label','Chat with the timeline guide');
orb.setAttribute('aria-expanded','false'); orb.setAttribute('aria-controls','passage-companion');
orb.title='Timeline guide';
document.body.append(orb,panel);initChatOrb(orb);panel.id='passage-companion';
let owner = null, active = null, frame = 0, request = 0, lookupController;
function show(paragraph) {
  document.dispatchEvent(new Event('readingcompanionopen'));
  owner=paragraph; panel.hidden=false;
  orb.hidden=true;orb.setAttribute('aria-expanded','true');
  paragraphs.forEach(p=>p.classList.toggle('companion-owner',p===paragraph));
  positionParagraphMarker(paragraph);
}
function dismiss() {
  document.dispatchEvent(new Event('readingcompaniondismiss'));
  request++; lookupController?.abort(); panel.hidden=true; owner?.classList.remove('companion-owner');
  orb.hidden=false;orb.setAttribute('aria-expanded','false');
  update();orb.focus({preventScroll:true});
}
close.addEventListener('click',dismiss);
document.addEventListener('readingcompanionclose',dismiss);
panel.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dismiss();}});
function ask(question) {
  document.dispatchEvent(new CustomEvent('article-inline-question',{detail:{question,target:answers}}));
}
paragraphs.forEach(paragraph=>{paragraph.dataset.originalStory=paragraph.textContent.trim();});
orb.addEventListener('pointerdown',event=>{if(selectedWord())event.preventDefault();});
orb.addEventListener('click',()=>{
  if(selectedWord()){defineSelection();return;}
  const selected=document.querySelector('.map-article.is-selected');
  const paragraph=active||paragraphs.find(p=>p.id===selected?.dataset.eventId)||paragraphs[0];const index=paragraphs.indexOf(paragraph);
  request++;lookupController?.abort();show(paragraph);answers.dataset.passageIndex=String(index);
  answers.dataset.eventId=paragraph.id||'';
  heading.textContent='Timeline guide';content.textContent=paragraph.querySelector('.timeline-event-title')?.textContent||'Explore the events and current status. Answers come from the saved timeline and link to its sources.';
  answers.replaceChildren();suggestions.replaceChildren();
  for(const text of [...(paragraph.id?['What happened here?']:[]),...questionsForPassage(index)]) {
    const chip=document.createElement('button');chip.type='button';chip.textContent=text;
    chip.addEventListener('click',()=>ask(text));suggestions.append(chip);
  }
  suggestions.querySelector('button')?.focus({preventScroll:true});
});
function positionOrb() {
  positionParagraphMarker(active);
  if (owner && !panel.hidden) positionParagraphMarker(owner);
  paragraphs.filter(p=>p.classList.contains('mind-source')).forEach(positionParagraphMarker);
  const rect=active?.getBoundingClientRect();
  orb.hidden=!panel.hidden;
  if(!rect){orb.style.top=`${innerHeight-148}px`;orb.style.left=`${innerWidth-(orb.offsetWidth||64)-24}px`;return;}
  const size=orb.getBoundingClientRect().width || 64;
  const visibleTop=Math.max(72,rect.top),visibleBottom=Math.min(innerHeight-24,rect.bottom);
  const top=Math.max(72,Math.min(innerHeight-size-24,(visibleTop+visibleBottom-size)/2));
  const left=Math.max(8,Math.min(innerWidth-size-8,article.getBoundingClientRect().right+18));
  orb.style.top=`${top}px`;orb.style.left=`${left}px`;
}
function highlight(paragraph) {
  if(active===paragraph){positionOrb();return;}
  active?.classList.remove('reading-current');active=paragraph;active?.classList.add('reading-current');positionOrb();
}
function update() {
  frame=0;if(document.hidden){orb.hidden=true;return;}
  const line=innerHeight*.38;
  const visible=paragraphs.filter(p=>{const r=p.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight;});
  highlight(visible.sort((a,b)=>{const gap=p=>{const r=p.getBoundingClientRect();return Math.max(r.top-line,line-r.bottom,0);};return gap(a)-gap(b);})[0]||null);
}
window.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(update);},{passive:true});
window.addEventListener('resize',()=>{orb.style.transition='none';update();orb.getBoundingClientRect();orb.style.removeProperty('transition');});
const layoutObserver=new ResizeObserver(()=>{if(!frame)frame=requestAnimationFrame(update);});
layoutObserver.observe(article);
layoutObserver.observe(document.querySelector('.world-title'));
document.addEventListener('kineticstart',positionOrb);
document.addEventListener('kineticend',update);
document.addEventListener('visibilitychange',update);
article.addEventListener('pointermove',event=>{const p=event.target.closest('.story-paragraph');if(p)highlight(p);});
article.addEventListener('focusin',event=>{const p=event.target.closest('.story-paragraph');if(p)highlight(p);});
update();
document.fonts.ready.then(update);
function selectedWord() {
  const selection=window.getSelection(); const node=selection?.anchorNode;
  const paragraph=(node?.nodeType===1?node:node?.parentElement)?.closest('.story-paragraph');
  if(!paragraph||!article.contains(paragraph)||selection.isCollapsed)return null;
  const word=selection.toString().trim();
  if(!/^[A-Za-z][A-Za-z’' -]{0,59}$/.test(word))return null;
  return {word,paragraph};
}
async function defineSelection() {
  const selected=selectedWord();if(!selected)return;
  window.getSelection().removeAllRanges();
  const {word,paragraph}=selected;const key=normalizeWord(word); const token=++request;
  lookupController?.abort();lookupController=new AbortController();
  const controller=lookupController;
  show(paragraph);answers.dataset.passageIndex=String(paragraphs.indexOf(paragraph));heading.textContent=word; suggestions.replaceChildren();answers.replaceChildren();
  const definition=glossary[key];
  content.replaceChildren();const text=document.createElement('p');text.textContent=definition||'This word is not in the saved glossary. Use the dictionary link below if you want to leave this page.';content.append(text);
  const link=document.createElement('a');link.href='https://www.merriam-webster.com/dictionary/'+encodeURIComponent(key);link.target='_blank';link.rel='noopener noreferrer';link.textContent='Open dictionary entry ↗';content.append(link);

}
article.addEventListener('dblclick',event=>{if(event.target.closest('.story-paragraph'))defineSelection();});
document.querySelector('#define-selection').addEventListener('pointerdown',event=>event.preventDefault());
document.querySelector('#define-selection').addEventListener('click',()=>{
  if(selectedWord())defineSelection();else{show(active||paragraphs[0]);heading.textContent='Define a word';content.textContent='Double-click a word, or select text and click the orb. On a phone, press and hold a word to select it.';suggestions.replaceChildren();answers.replaceChildren();}
});
