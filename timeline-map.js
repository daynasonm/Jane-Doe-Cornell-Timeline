import { animate } from './vendor/anime-4.5.0.esm.min.js';

export function newestFirst(events) { return [...events].reverse(); }
export function eventTrack(event) {
  if (/lawyer|rally|assaults|sit-in/i.test(event.title)) return 'Community';
  if (/prosecut|criminal|DA |Police report/i.test(event.title)) return 'Criminal';
  if (/lawsuit filed|civil filings|public statements/i.test(event.title)) return 'Civil';
  return 'University';
}
export function projectPoint(point, view) {
  const c=Math.cos(view.yaw),s=Math.sin(view.yaw);
  const x=point.x*c+point.z*s;
  const y=point.y-view.offset;
  const z=-point.x*s+point.z*c+Math.max(0,y)*.85;
  const scale=view.zoom*1000/Math.max(700,1000+z);
  return {x:(view.centerX ?? view.width*.5)+x*scale,y:(view.anchorY ?? 180)+Math.max(-50,y)*scale,z,scale};
}
export function spiralPoint(index, spacing, radius=110) {
  const angle=index*Math.PI/2;
  return {x:Math.sin(angle)*radius,y:index*spacing,z:-Math.cos(angle)*radius};
}
export function articleSide(index, mobile=false) { return mobile || index%2===0 ? 'right' : 'left'; }
export function smoothOffset(current,target,elapsed) {
  if(Math.abs(target-current)<.25)return target;
  return current+(target-current)*(1-Math.exp(-elapsed/85));
}

const root=typeof document!=='undefined' && document.querySelector('#timeline-map');
if(root) {
  const data=JSON.parse(document.querySelector('#timeline-data').textContent);
  const all=newestFirst(data.events),canvas=root.querySelector('canvas'),ctx=canvas.getContext('2d');
  const stage=root.querySelector('.map-stage'),viewport=root.querySelector('.map-viewport'),articles=root.querySelector('.map-articles');
  let events=all,selected=all[0].id,cards=[],visible=[],frame=0,drag=null,mobile=false,spacing=700;
  let travel=null,turn=null,entrance=null,destination=null;
  let targetOffset=0,lastFrame=0;
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  const view={width:0,height:0,yaw:0,zoom:1,offset:0,centerX:0};
  const worlds=()=>events.map((event,i)=>({event,index:i,...spiralPoint(i,spacing,mobile?22:110)}));
  function line(a,b,color,width=1){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function updateSelection(id){
    const changed=selected!==id;
    selected=id;
    cards.forEach(card=>card.node.classList.toggle('is-selected',card.event.id===id));
    const index=events.findIndex(e=>e.id===id);
    root.querySelector('[data-map-newer]').disabled=index===0;
    root.querySelector('[data-map-older]').disabled=index===events.length-1;
    root.querySelector('.map-counter').textContent=String(index+1).padStart(2,'0')+' / '+events.length;
    if(changed&&!motion.matches){
      entrance?.revert();
      entrance=animate(cards[index].node.children,{
        translateX:[articleSide(index,mobile)==='left'?-18:18,0],
        translateY:[10,0],opacity:[.6,1],duration:560,ease:'outCubic',
        delay:(_,i)=>i*35,
      });
    }
  }
  function makeCards(){articles.replaceChildren();cards=events.map((event,i)=>{const node=document.createElement('article');node.className='map-article';node.dataset.eventId=event.id;const date=document.createElement('p');date.className='map-article-date';date.textContent=event.date;const title=document.createElement('h3');const button=document.createElement('button');button.type='button';button.textContent=event.title;button.addEventListener('click',()=>{go(i);});title.append(button);const text=document.createElement('p');text.className='map-article-body';text.textContent=event.body;const sources=document.createElement('div');sources.className='map-article-sources';for(const source of event.sources){const link=document.createElement('a');link.textContent=source.title+' ↗';link.href=source.url;link.target='_blank';link.rel='noopener noreferrer';sources.append(link);}const category=document.createElement('p');category.className='map-article-category';category.textContent=eventTrack(event)+(i===0?' · LATEST':'');node.append(category,date,title,text,sources);articles.append(node);return {node,event};});}
  function draw(time){
    frame=0;
    ctx.clearRect(0,0,view.width,view.height);
    visible=[];
    if(motion.matches){cards.forEach(card=>{card.node.hidden=false;card.node.removeAttribute('style');card.node.classList.remove('is-distant');});return;}
    const elapsed=lastFrame?Math.min(64,time-lastFrame):1000/60;
    lastFrame=time;
    view.offset=smoothOffset(view.offset,targetOffset,elapsed);
    const selectedIndex=Math.max(0,Math.min(events.length-1,Math.round(view.offset/spacing)));
    updateSelection(events[selectedIndex].id);
    const scene=view;
    const progress=view.offset/spacing;
    const points=worlds();
    if(mobile)points.sort((a,b)=>a.event.id===selected?-1:b.event.id===selected?1:Math.abs(a.index-progress)-Math.abs(b.index-progress));
    // A continuous helix connects the events; scrolling brings each turn toward the reader.
    let previous;
    for(let t=Math.max(0,progress-.8);t<Math.min(events.length-1,progress+5);t+=.025){
      const p=projectPoint(spiralPoint(t,spacing,mobile?22:110),scene);
      if(previous)line(previous,p,'#c8c8c860',Math.max(.6,p.scale*1.5));
      previous=p;
    }
    const occupied=[];
    for(const point of points){
      const p=projectPoint(point,scene),card=cards[point.index];
      const distance=point.index-progress;
      const scale=Math.min(1,Math.max(.28,p.scale));
      const side=articleSide(point.index,mobile);
      const width=mobile?view.width-78:Math.min(390,view.width*.34);
      const gap=(mobile?22:65)*scale;
      const edge=view.centerX+(side==='right'?1:-1)*(mobile?22:110)*scale;
      const cardX=side==='right'?edge+gap:edge-gap-width*scale;
      card.node.style.width=width+'px';
      card.node.style.left=Math.max(0,Math.min(view.width-width*scale,cardX))+'px';
      card.node.style.top=(p.y-20*scale)+'px';
      card.node.style.transform='scale('+scale+')';
      card.node.style.opacity=String(Math.max(.45,Math.min(1,scale)));
      card.node.style.zIndex=String(Math.round(scale*100));
      card.node.dataset.side=side;
      card.node.classList.toggle('is-distant',distance>1.4);
      let show=distance>-.9&&distance<3&&p.y>65&&p.y<view.height-100;
      card.node.hidden=!show;
      if(show&&mobile){
        const top=p.y-20*scale,bottom=top+card.node.offsetHeight*scale;
        show=!occupied.some(([start,end])=>top<end+28&&bottom>start-28);
        card.node.hidden=!show;
        if(show)occupied.push([top,bottom]);
      }
      if(p.y<-100||p.y>view.height+100||distance<-.6||distance>5)continue;
      const active=point.event.id===selected;
      const radius=3*p.scale;
      ctx.font=(11*Math.min(1,p.scale))+'px "Akzidenz Grotesk", sans-serif';
      ctx.textAlign='center';ctx.fillStyle='#aaa';ctx.fillText(String(point.index+1).padStart(2,'0'),p.x,p.y+28*p.scale);
      if(show){
        const endpoint={x:side==='right'?cardX-10:cardX+width*scale+10,y:p.y};
        line({x:p.x+(side==='right'?radius:-radius),y:p.y},endpoint,active?'#d0d0d099':'#77777755');
      }
      visible.push({...p,event:point.event,radius:Math.max(25,radius+8)});
    }
    const pearl=projectPoint(spiralPoint(progress,spacing,mobile?22:110),scene);
    const radius=15*pearl.scale;
    const silver=ctx.createRadialGradient(pearl.x-radius*.3,pearl.y-radius*.4,1,pearl.x,pearl.y,radius);
    silver.addColorStop(0,'#fff');silver.addColorStop(.35,'#e5e5e5');silver.addColorStop(.7,'#919191');silver.addColorStop(1,'#303030');
    ctx.shadowColor='#ffffff70';ctx.shadowBlur=24;ctx.fillStyle=silver;
    ctx.beginPath();ctx.arc(pearl.x,pearl.y,radius,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;
    const fade=ctx.createLinearGradient(0,view.height-80,0,view.height);
    fade.addColorStop(0,'#08080800');fade.addColorStop(1,'#080808');ctx.fillStyle=fade;ctx.fillRect(0,view.height-80,view.width,80);
    if(view.offset!==targetOffset)schedule();else lastFrame=0;
  }
  function schedule(){if(!frame)frame=requestAnimationFrame(draw);}
  function scrollPosition(){if(motion.matches)return;targetOffset=Math.max(0,Math.min((events.length-1)*spacing,-stage.getBoundingClientRect().top));schedule();}
  function stopTravel(){travel?.cancel();travel=null;destination=null;}
  function resize(){stopTravel();lastFrame=0;view.width=viewport.clientWidth;view.height=viewport.clientHeight;mobile=view.width<700;spacing=Math.max(700,...cards.map(card=>card.node.offsetHeight+250));view.zoom=1;view.centerX=mobile?28:view.width*.5;view.anchorY=mobile?120:180;root.classList.toggle('map-reduced-motion',motion.matches);stage.style.height=motion.matches?'auto':((events.length-1)*spacing+view.height)+'px';const dpr=Math.min(devicePixelRatio||1,2);canvas.width=view.width*dpr;canvas.height=view.height*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);scrollPosition();view.offset=targetOffset;schedule();}
  function go(index){
    index=Math.max(0,Math.min(events.length-1,index));
    stopTravel();
    if(motion.matches){cards[index].node.scrollIntoView({block:'start',behavior:'instant'});updateSelection(events[index].id);return;}
    const top=window.scrollY+stage.getBoundingClientRect().top+index*spacing;
    const position={y:window.scrollY};
    destination=events[index].id;
    travel=animate(position,{
      y:top,duration:Math.min(1200,650+Math.abs(top-position.y)*.12),ease:'inOutCubic',
      onUpdate:()=>window.scrollTo({top:position.y,behavior:'instant'}),
      onComplete:()=>{travel=null;destination=null;scrollPosition();},
    });
  }
  function rotate(yaw){turn?.cancel();if(motion.matches){view.yaw=yaw;schedule();return;}turn=animate(view,{yaw,duration:850,ease:'inOutCubic',onUpdate:schedule,onComplete:()=>{turn=null;}});}
  function filter(value){stopTravel();entrance?.revert();entrance=null;events=value==='all'?all:all.filter(e=>e.date.includes(value));makeCards();root.querySelectorAll('[data-map-year]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mapYear===value)));resize();updateSelection(events[0].id);if(stage.getBoundingClientRect().top<0)go(0);}
  root.querySelectorAll('[data-map-year]').forEach(b=>b.addEventListener('click',()=>filter(b.dataset.mapYear)));
  root.querySelector('[data-map-reset]').addEventListener('click',()=>{filter('all');rotate(0);go(0);});
  root.querySelector('[data-map-rotate]').addEventListener('click',()=>rotate(view.yaw>.3?-.5:view.yaw+.35));
  const navigationIndex=()=>events.findIndex(e=>e.id===(destination??selected));
  root.querySelector('[data-map-newer]').addEventListener('click',()=>go(navigationIndex()-1));
  root.querySelector('[data-map-older]').addEventListener('click',()=>go(navigationIndex()+1));
  canvas.addEventListener('pointerdown',event=>{stopTravel();turn?.cancel();turn=null;drag={x:event.clientX,y:event.clientY,yaw:view.yaw,moved:false};canvas.setPointerCapture(event.pointerId);});
  canvas.addEventListener('pointermove',event=>{if(!drag)return;const dx=event.clientX-drag.x;drag.moved||=Math.abs(dx)>5;view.yaw=Math.max(-.7,Math.min(.7,drag.yaw+dx*.003));schedule();});
  canvas.addEventListener('pointerup',event=>{if(drag&&!drag.moved){const bounds=canvas.getBoundingClientRect(),x=event.clientX-bounds.left,y=event.clientY-bounds.top;const hit=visible.find(p=>Math.hypot(p.x-x,p.y-y)<p.radius);if(hit)go(events.findIndex(e=>e.id===hit.event.id));}drag=null;schedule();});
  canvas.addEventListener('pointercancel',()=>{drag=null;});
  canvas.addEventListener('keydown',event=>{if(event.key==='ArrowDown'||event.key==='ArrowUp'){event.preventDefault();go(navigationIndex()+(event.key==='ArrowDown'?1:-1));}});
  window.addEventListener('wheel',stopTravel,{passive:true});
  window.addEventListener('touchstart',stopTravel,{passive:true});
  window.addEventListener('keydown',event=>{if(['PageDown','PageUp','Home','End',' '].includes(event.key))stopTravel();});
  motion.addEventListener('change',()=>{turn?.cancel();turn=null;entrance?.revert();entrance=null;resize();});
  window.addEventListener('scroll',scrollPosition,{passive:true});new ResizeObserver(resize).observe(viewport);document.fonts.ready.then(resize);filter('all');
}
