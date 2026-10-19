(()=>{'use strict';
const panel=document.querySelector('.rotor-panel');if(!panel)return;
const disc=panel.querySelector('.rotor-disc'),wheel=panel.querySelector('.rotor-wheel'),cards=[...panel.querySelectorAll('.rotor-card')],trio=['work-01','work-15','work-09'];
const clamp=n=>Math.max(0,Math.min(1,n)),ease=t=>t*t*(3-2*t),deg=Math.PI/180;
let slots=new Map(),radius=0,perspective=0,center={x:0,y:0};
const reduce=matchMedia('(prefers-reduced-motion: reduce)');let angle=0,tween=null,raf=0,lastTime=0,paused=false,hovered=false,focused=false,active=false;
const state={count:cards.length,progress:0,flight:0,rotation:0,mode:'vertical-curved-film',visible:0,playing:false,paused:false};
const positions=[];for(let col=0;col<14;col++)for(let row=0;row<3;row++)positions.push({col,row});
const reserved=new Map([['work-01',{col:13,row:0}],['work-15',{col:0,row:1}],['work-09',{col:1,row:2}]]);
const available=positions.filter(p=>![...reserved.values()].some(v=>v.col===p.col&&v.row===p.row));let next=0;
cards.forEach(card=>{const p=reserved.get(card.dataset.workId)||available[next++];card.dataset.column=p.col;card.dataset.row=p.row;});
const surfaces=[];for(let i=0;i<56;i++){const s=document.createElement('div');s.className='rotor-surface';s.setAttribute('aria-hidden','true');wheel.prepend(s);surfaces.push(s);}
function project(slot,turn){
 const a=(slot.angle+turn)*deg,c=Math.cos(a),s=Math.sin(a);
 return [[-slot.w/2,-slot.h/2],[slot.w/2,-slot.h/2],[slot.w/2,slot.h/2],[-slot.w/2,slot.h/2]].map(([u,v])=>{
  const x=radius*s+u*c,z=radius*c-u*s-radius,k=1/(1-z/perspective);
  return {x:center.x+x*k,y:center.y+(slot.rowY+v)*k};
 });
}
function layout(w,h){
 radius=w<650?w*.88:Math.min(w*.53,h*.77);perspective=Math.max(700,w*1.25);center={x:w/2,y:h*.55};
 const wallH=Math.min(h*.60,w<650?h*.60:w*.7),pitch=wallH/3,colW=2*radius*Math.tan(Math.PI/14);
 disc.style.setProperty('--film-pitch',pitch+'px');
 Object.assign(disc.style,{width:w+'px',height:wallH+'px',left:'0px',top:center.y+'px',perspective:perspective+'px'});
 slots=new Map();
 for(const card of cards){
  const ratio=Number(card.dataset.ratio),width=Math.min(colW*.89,pitch*.74*ratio),height=width/ratio,rowY=(Number(card.dataset.row)-1)*pitch,angle=Number(card.dataset.column)*360/14;
  Object.assign(card.style,{left:'50%',top:'50%',width:width+'px',height:height+'px',marginLeft:-width/2+'px',marginTop:(rowY-height/2)+'px',transform:`rotateY(${angle}deg) translateZ(${radius}px)`});
  const slot={w:width,h:height,rowY,angle,rotation:0};slot.quad=project(slot,0);slots.set(card.dataset.workId,slot);
 }
 surfaces.forEach((s,i)=>Object.assign(s.style,{width:(2*(radius-2)*Math.tan(Math.PI/56)+.5)+'px',height:wallH+'px',marginLeft:-(radius-2)*Math.tan(Math.PI/56)+'px',marginTop:-wallH/2+'px',transform:`rotateY(${i*360/56}deg) translateZ(${radius-2}px)`}));
 state.radius=radius;state.perspective=perspective;
}
function update(a){
 const flight=ease(clamp((a-.34)/.20)),m=window.CalTour?.metrics;
 active=flight>=.999&&!!m&&scrollY>=m.arrival.y&&scrollY<m.arrival.y+m.arrival.h-innerHeight*.15;
 if(flight<.999){angle=0;if(tween){tween.resolve?.();tween=null;}}
 panel.style.opacity=ease(clamp((a-.37)/.15));panel.inert=flight<.999;
 Object.assign(state,{progress:a,flight,paused});paint();wake();return {flight,slots};
}
function paint(){
 const rotation=((angle%360)+360)%360,flight=state.flight;wheel.style.transform=`translateZ(${-radius}px) rotateY(${rotation}deg)`;
 let visible=0;
 for(const card of cards){
  const slot=slots.get(card.dataset.workId);if(!slot)continue;
  const facing=Math.cos((slot.angle+rotation)*deg)>radius/(radius+perspective)+.015,returning=trio.includes(card.dataset.workId)&&flight<.999;
  card.style.visibility=returning?'hidden':'visible';card.inert=!facing||flight<.999;card.style.pointerEvents=facing?'auto':'none';
  card.style.filter=`brightness(${.6+.4*Math.max(0,Math.cos((slot.angle+rotation)*deg))})`;
  if(facing&&!returning)visible++;slot.quad=project(slot,rotation);
 }
 Object.assign(state,{rotation,visible});
}
function canPlay(){return active&&!reduce.matches&&!document.hidden&&!document.querySelector('#viewer')?.open&&(!!tween||(!paused&&!hovered&&!focused));}
function wake(){state.playing=canPlay()&&!tween;if(canPlay()&&!raf)raf=requestAnimationFrame(tick);if(!canPlay())lastTime=0;}
function tick(now){
 raf=0;if(!canPlay()){lastTime=0;state.playing=false;return;}
 if(lastTime&&now-lastTime<30){wake();return;}
 const dt=Math.min(.06,(now-(lastTime||now))/1000);lastTime=now;
 if(tween){const t=clamp((now-tween.start)/tween.duration);angle=tween.from+(tween.to-tween.from)*ease(t);if(t>=1){const done=tween.resolve;tween=null;done?.();}}
 else angle+=dt*4.5;
 paint();wake();
}
function turn(to,duration=900){return new Promise(resolve=>{tween?.resolve?.();tween={from:angle,to,start:performance.now(),duration,resolve};wake();});}
function home(duration=650){return turn(angle+((((-angle%360)+540)%360)-180),duration).then(()=>{angle=0;paint();});}
function homography(w,h,quad){
 const source=[[0,0],[w,0],[w,h],[0,h]],rows=[];
 source.forEach(([x,y],i)=>{const X=quad[i].x,Y=quad[i].y;rows.push([x,y,1,0,0,0,-X*x,-X*y,X],[0,0,0,x,y,1,-Y*x,-Y*y,Y]);});
 for(let c=0;c<8;c++){
  let pivot=c;for(let r=c+1;r<8;r++)if(Math.abs(rows[r][c])>Math.abs(rows[pivot][c]))pivot=r;
  [rows[c],rows[pivot]]=[rows[pivot],rows[c]];const scale=rows[c][c];if(Math.abs(scale)<1e-9)return '';
  for(let k=c;k<=8;k++)rows[c][k]/=scale;
  for(let r=0;r<8;r++)if(r!==c){const f=rows[r][c];for(let k=c;k<=8;k++)rows[r][k]-=f*rows[c][k];}
 }
 const v=rows.map(r=>r[8]);return `matrix3d(${[v[0],v[3],0,v[6],v[1],v[4],0,v[7],0,0,1,0,v[2],v[5],0,1].join(',')})`;
}
function fly(element,base,t){
 const slot=slots.get(element.dataset.workId);if(!slot)return;
 if(t>=.999){element.style.opacity='0';return;}
 const angle=base.rotation*deg,c=Math.cos(angle),s=Math.sin(angle),cx=base.x+base.w/2,cy=base.y+base.h/2;
 const start=[[-base.w/2,-base.h/2],[base.w/2,-base.h/2],[base.w/2,base.h/2],[-base.w/2,base.h/2]].map(([x,y])=>({x:cx+x*c-y*s,y:cy+x*s+y*c}));
 const quad=start.map((p,i)=>({x:p.x+(slot.quad[i].x-p.x)*t,y:p.y+(slot.quad[i].y-p.y)*t})),w=base.w+(slot.w-base.w)*t,h=base.h+(slot.h-base.h)*t;
 Object.assign(element.style,{left:'0px',top:'0px',width:w+'px',height:h+'px',transformOrigin:'0 0',transform:homography(w,h,quad),borderRadius:(10-8*t)+'px',opacity:'1'});
}
function go(step){
 turn(angle+step*360/14);
}
panel.querySelector('.rotor-prev')?.addEventListener('click',()=>go(-1));panel.querySelector('.rotor-next')?.addEventListener('click',()=>go(1));
const play=panel.querySelector('.rotor-play');play?.addEventListener('click',()=>{paused=!paused;state.paused=paused;play.setAttribute('aria-pressed',String(paused));play.textContent=paused?'播放':'暂停';wake();});
let pointerX=null,pointerY=null;
cards.forEach(card=>{card.addEventListener('pointermove',e=>{if(e.pointerType==='mouse'&&(e.clientX!==pointerX||e.clientY!==pointerY)){hovered=true;wake();}});card.addEventListener('pointerleave',()=>{hovered=false;wake();});});
window.addEventListener('pointermove',e=>{pointerX=e.clientX;pointerY=e.clientY;},{passive:true});
wheel.addEventListener('focusin',e=>{focused=e.target.matches(':focus-visible');wake();});wheel.addEventListener('focusout',e=>{focused=wheel.contains(e.relatedTarget)&&e.relatedTarget.matches(':focus-visible');wake();});
new MutationObserver(wake).observe(document.querySelector('#viewer'),{attributes:true,attributeFilter:['open']});document.addEventListener('visibilitychange',wake);reduce.addEventListener('change',wake);
window.CalRotor={layout,update,fly,state,slots:()=>slots,go,home};
})();
