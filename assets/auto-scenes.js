(()=>{'use strict';
const reduced=matchMedia('(prefers-reduced-motion: reduce)');let running=null,raf=0,cooldown=0,navigationUntil=0,lastY=scrollY;
const state={running:false,kind:null,progress:0,completed:[],cancelled:false};
const ease=t=>t*t*t*(t*(t*6-15)+10),clamp=n=>Math.max(0,Math.min(1,n));
function cancel(){if(raf)cancelAnimationFrame(raf);raf=0;running=null;cooldown=0;state.running=false;state.cancelled=true;document.body.classList.remove('scene-playing');lastY=scrollY;}
async function play(kind,to,duration=2400,prelude){
 if(running||reduced.matches||document.querySelector('#viewer')?.open)return;
 window.CalTour?.cancel();const token={kind};running=token;Object.assign(state,{running:true,kind,progress:0,cancelled:false});document.body.classList.add('scene-playing');
 if(prelude)await prelude();if(running!==token)return;
 const from=scrollY,start=performance.now();
 function tick(now){
  if(running!==token)return;const t=clamp((now-start)/duration);state.progress=t;scrollTo({top:from+(to()-from)*ease(t),behavior:'instant'});
  if(t<1)raf=requestAnimationFrame(tick);else{raf=0;running=null;state.running=false;state.completed.push(kind);cooldown=performance.now()+350;document.body.classList.remove('scene-playing');lastY=scrollY;}
 }raf=requestAnimationFrame(tick);
}
function watch(){
 const m=window.CalTour?.metrics;if(!m)return;const y=scrollY,previousY=lastY,dy=y-lastY;lastY=y;if(reduced.matches||running||performance.now()<cooldown||performance.now()<navigationUntil||Math.abs(dy)<.5||document.querySelector('#viewer')?.open)return;
 const p=(y-m.y)/m.flight,tour=(y-m.y-m.flight)/m.tour,span=m.arrival.h-document.querySelector('.mountain-sticky').clientHeight,a=(y-m.arrival.y)/span;
 if(dy>0&&p>.025&&p<.92)play('mountains-to-gallery',()=>CalTour.metrics.y+CalTour.metrics.flight,2300);
 else if(dy<0&&p<.97&&p>.05)play('gallery-to-mountains',()=>CalTour.metrics.y,2300);
 else if(dy>0&&tour>.928&&a<.26)play('gallery-to-collage',()=>CalTour.metrics.arrival.y+(CalTour.metrics.arrival.h-document.querySelector('.mountain-sticky').clientHeight)*.29,2900);
 else if(dy<0&&a<.26&&tour>.9&&(previousY-m.arrival.y)/span>=.26)play('collage-to-gallery',()=>CalTour.metrics.y+CalTour.metrics.flight+CalTour.metrics.tour*.92,2600);
 else if(dy>0&&a>.32&&a<.54)play('collage-to-film',()=>CalTour.metrics.arrival.y+(CalTour.metrics.arrival.h-document.querySelector('.mountain-sticky').clientHeight)*.56,2600);
 else if(dy<0&&a<.555&&a>.3&&(previousY-m.arrival.y)/span>=.54)play('film-to-collage',()=>CalTour.metrics.arrival.y+(CalTour.metrics.arrival.h-document.querySelector('.mountain-sticky').clientHeight)*.29,2400,()=>{scrollTo({top:m.arrival.y+span*.56,behavior:'instant'});window.CalRotor?.update(.56);return window.CalRotor?.home();});
}
const blocked=()=>!!running||performance.now()<cooldown;
window.addEventListener('wheel',e=>{if(blocked())e.preventDefault();},{passive:false,capture:true});
window.addEventListener('touchmove',e=>{if(blocked())e.preventDefault();},{passive:false,capture:true});
window.addEventListener('keydown',e=>{if(e.key==='Escape'&&running){cancel();return;}if(blocked()&&['ArrowDown','ArrowUp','PageDown','PageUp',' ','Home','End'].includes(e.key))e.preventDefault();},{capture:true});
document.querySelector('.scroll-cue')?.addEventListener('click',e=>{if(reduced.matches)return;e.preventDefault();play('mountains-to-gallery',()=>CalTour.metrics.y+CalTour.metrics.flight,2300);});
document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a||a.classList.contains('scroll-cue')||!document.getElementById(a.getAttribute('href').slice(1)))return;cancel();navigationUntil=performance.now()+1800;},{capture:true});
new MutationObserver(()=>{if(document.querySelector('#viewer')?.open)cancel();}).observe(document.querySelector('#viewer'),{attributes:true,attributeFilter:['open']});
reduced.addEventListener('change',()=>{if(reduced.matches)cancel();});
window.CalAutoScenes={state,watch,play,cancel};
})();
