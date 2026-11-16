import { scenes } from './story-symbols.js';
import { loadPixelScene, drawPixelScene } from './pixel-illustration.js';

export const illustrations = [
  {id:'cornell',label:'Cornell University seal',src:'assets/cornell-seal.png',paragraph:0,side:'left',size:220,word:/Cornell University/},
  {...scenes.find(s=>s.id==='alcohol-ketamine'),paragraph:1,side:'right',size:320,word:/alcohol and ketamine/},
  {...scenes.find(s=>s.id==='crime-alert'),paragraph:4,side:'left',size:230,word:/crime safety alert/},
  {...scenes.find(s=>s.id==='documents'),paragraph:6,side:'right',size:250,word:/documents/},
  {...scenes.find(s=>s.id==='snapchat'),paragraph:7,side:'left',size:290,word:/Snapchat/},
  {...scenes.find(s=>s.id==='interview'),paragraph:9,side:'right',size:240,word:/interview/},
  {...scenes.find(s=>s.id==='frat-house'),paragraph:11,side:'right',size:330,word:/frat house/},
  {...scenes.find(s=>s.id==='police'),paragraph:14,side:'left',size:270,word:/police/i},
  {...scenes.find(s=>s.id==='justice'),paragraph:17,side:'right',size:260,word:/special prosecutor/},
  {...scenes.find(s=>s.id==='lawsuit'),paragraph:20,side:'left',size:250,word:/lawsuit/},
  {...scenes.find(s=>s.id==='title-ix'),paragraph:21,side:'right',size:300,word:/Title IX investigation/},
  {...scenes.find(s=>s.id==='chi-phi'),paragraph:24,side:'left',size:260,word:/Chi Phi/},
  {...scenes.find(s=>s.id==='rugby'),paragraph:27,side:'right',size:270,word:/rugby club/},
  {...scenes.find(s=>s.id==='tri-delta'),paragraph:34,side:'right',size:340,word:/Delta Delta Delta/},
  {...scenes.find(s=>s.id==='community'),paragraph:39,side:'left',size:260,word:/campus/},
];

export async function initReadingMotion() {
  const article=document.querySelector('.world-story');
  if(!article)return;
  const paragraphs=[...article.querySelectorAll('.story-paragraph')];
  const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
  const loaded=await Promise.all(illustrations.map(loadPixelScene));
  const states=loaded.map(scene=>{
    const figure=document.createElement('button');
    figure.type='button';
    figure.className=`world-illustration world-${scene.side}`;
    figure.dataset.scene=scene.id;
    figure.setAttribute('aria-label',`Scatter and reform the ${scene.label.toLowerCase()} illustration`);
    figure.style.setProperty('--size',`${scene.size}px`);
    figure.style.setProperty('--shape',`url("${scene.shapeUrl}")`);
    const canvas=document.createElement('canvas');
    canvas.setAttribute('aria-hidden','true');
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=canvas.height=280*dpr;
    const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
    figure.append(canvas);
    const paragraph=paragraphs[scene.paragraph];
    paragraph.before(figure);
    const state={scene,figure,canvas,ctx,progress:0,target:0,visible:false,pointer:null,pointerTarget:null,pulseAt:-Infinity,frame:0};
    function disturb(){
      if(reducedMotion.matches)return;
      state.pulseAt=performance.now();state.target=1;figure.dataset.interaction='scatter';schedule(state);
    }
    figure.addEventListener('click',disturb);
    figure.addEventListener('pointermove',event=>{
      if(event.pointerType!=='mouse'||reducedMotion.matches)return;
      const rect=figure.getBoundingClientRect();
      state.pointerTarget={x:(event.clientX-rect.left)/rect.width*280,y:(event.clientY-rect.top)/rect.height*280};
      figure.dataset.interaction='brush';schedule(state);
    });
    figure.addEventListener('pointerleave',()=>{state.pointerTarget=null;schedule(state);});
    const walker=document.createTreeWalker(paragraph,NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){
      const text=walker.currentNode,match=text.textContent.match(scene.word);
      if(!match)continue;
      const fragment=document.createDocumentFragment();fragment.append(text.textContent.slice(0,match.index));
      const word=document.createElement('span');word.className='world-word';word.setAttribute('role','button');word.tabIndex=0;
      word.setAttribute('aria-label',`${match[0]}: disturb its illustration`);word.textContent=match[0];
      word.addEventListener('click',disturb);
      word.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();disturb();}});
      fragment.append(word,text.textContent.slice(match.index+match[0].length));text.replaceWith(fragment);break;
    }
    return state;
  });
  function schedule(state){if(!state.frame&&state.visible)state.frame=requestAnimationFrame(time=>animate(state,time));}
  function animate(state,time){
    state.frame=0;if(!state.visible||document.hidden)return;
    state.progress=reducedMotion.matches?1:state.progress+(state.target-state.progress)*.12;
    if(Math.abs(state.progress-state.target)<.002)state.progress=state.target;
    const target=state.pointerTarget;
    if(reducedMotion.matches){state.pointer=null;state.pointerTarget=null;}
    else if(target){
      state.pointer||={...target,force:0};
      state.pointer.x+=(target.x-state.pointer.x)*.2;state.pointer.y+=(target.y-state.pointer.y)*.2;
      state.pointer.force+=(1-state.pointer.force)*.16;
    }else if(state.pointer){state.pointer.force*=.83;if(state.pointer.force<.01)state.pointer=null;}
    const pulse=reducedMotion.matches?0:Math.max(0,1-(time-state.pulseAt)/1150);
    drawPixelScene(state.ctx,state.scene,state.progress,{pointer:state.pointer&&{...state.pointer,strength:state.pointer.force},pulse,time:reducedMotion.matches?0:time});
    state.figure.dataset.progress=state.progress.toFixed(2);
    const pointerMoving=state.pointer&&(target?Math.abs(state.pointer.x-target.x)+Math.abs(state.pointer.y-target.y)+(1-state.pointer.force)>.01:true);
    if(state.progress===state.target&&pulse===0&&!pointerMoving)delete state.figure.dataset.interaction;
    if(!reducedMotion.matches||state.progress!==state.target||pulse>0||pointerMoving)schedule(state);
  }
  function update(){states.forEach(state=>{
    if(!state.visible)return;
    const top=state.figure.getBoundingClientRect().top;
    state.target=reducedMotion.matches?1:Math.max(0,Math.min(1,(innerHeight*.9-top)/(innerHeight*.5)));
    schedule(state);
  });}
  let scrollFrame=0;
  window.addEventListener('scroll',()=>{if(!scrollFrame)scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;update();});},{passive:true});
  window.addEventListener('resize',update);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)update();});
  reducedMotion.addEventListener('change',update);
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const state=states.find(item=>item.figure===entry.target);state.visible=entry.isIntersecting;
      state.figure.classList.toggle('is-awake',state.visible);
      if(!state.visible){cancelAnimationFrame(state.frame);state.frame=0;}
    });update();
  },{rootMargin:'100px 0px'});
  states.forEach(state=>observer.observe(state.figure));
}
