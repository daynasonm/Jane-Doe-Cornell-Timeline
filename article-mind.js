import { getChatAnswer, renderChatAnswer, hasPresetQuestion } from './article-chat.js';
const dialog=document.querySelector('#article-dialog');
const conversation=document.querySelector('#article-conversation');
const question=document.querySelector('[data-question]');
const pending=new Map();
let previousFocus;
function openQuestions(){if(dialog.open)return;previousFocus=document.activeElement;dialog.showModal();question.focus();}
document.querySelectorAll('[data-ask-article]').forEach(button=>button.addEventListener('click',openQuestions));
document.querySelector('#article-dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{pending.get(conversation)?.abort();previousFocus?.focus({preventScroll:true});});
function message(text,reader,target){const node=document.createElement('div');node.className='article-message '+(reader?'article-message-reader':'article-message-mind');const label=document.createElement('span');label.textContent=reader?'YOU':'TIMELINE GUIDE';const body=document.createElement('p');body.textContent=text;node.append(label,body);target.append(node);return body;}
async function ask(value,target=conversation){const text=value.trim().slice(0,500);if(!hasPresetQuestion(text)||pending.has(target))return;message(text,true,target);const body=message('Finding the dated records…',false,target);const controller=new AbortController();pending.set(target,controller);target.setAttribute('aria-busy','true');try{const answer=await getChatAnswer(text,[],null,controller.signal,target.dataset.eventId);renderChatAnswer(body,answer);}catch(error){if(!controller.signal.aborted)body.textContent=error.message;}finally{pending.delete(target);target.setAttribute('aria-busy','false');target.scrollTop=target.scrollHeight;}}
document.querySelectorAll('[data-question]').forEach(button=>button.addEventListener('click',()=>ask(button.dataset.question)));
document.addEventListener('article-inline-question',event=>{if(event.detail?.target instanceof HTMLElement)ask(event.detail.question,event.detail.target);});
for(const name of ['readingcompanionclose','readingcompaniondismiss'])document.addEventListener(name,()=>pending.get(document.querySelector('.inline-answers'))?.abort());
