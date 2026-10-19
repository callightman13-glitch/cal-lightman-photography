(()=>{'use strict';
const $=(s,p=document)=>p.querySelector(s), $$=(s,p=document)=>[...p.querySelectorAll(s)];
document.documentElement.classList.remove('no-js');
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const data=$('#works-data');const works=data?JSON.parse(data.textContent):[];
const menu=$('.menu-toggle'),panel=$('#site-menu');
function closeMenu(){if(!menu||!panel)return;panel.hidden=true;menu.setAttribute('aria-expanded','false');}
menu?.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));panel.hidden=!open;if(open){userPaused=true;updatePause();if(menu.matches(':focus-visible'))$('a',panel)?.focus();}});
document.addEventListener('click',e=>{if(panel&&!e.target.closest('.header'))closeMenu();});
panel?.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel&&!panel.hidden){closeMenu();menu.focus();}});
let userPaused=false,focused=false,hidden=document.hidden,overlayOpen=false,inView=true,pointerActive=false,scenePaused=false;
let mode='',modeCleanup=()=>{},raf=0,measureFrame=0,position=0,groupWidth=0,last=0;
const band=$('.photo-band'),mosaic=$('.mosaic'),controls=$$('[data-motion]');
const primaryGroup=$('.band-group[data-original]');
let motionPossible=true;const autoplayAfter=performance.now()+2100;
function paused(){return userPaused||focused||hidden||overlayOpen||!inView||pointerActive||scenePaused||reduced.matches;}
function updatePause(){mosaic?.classList.toggle('paused',paused());controls.forEach(b=>{const stop=paused();b.setAttribute('aria-pressed',String(stop));b.textContent=reduced.matches?'已减少动态效果':(stop?'继续播放':'暂停动画');b.disabled=reduced.matches||!motionPossible;});}
controls.forEach(b=>b.addEventListener('click',()=>{userPaused=!userPaused;focused=false;closeMenu();updatePause();last=0;}));
function readMode(){return getComputedStyle(document.documentElement).getPropertyValue('--mode').trim();}
function loadImage(im){if(im.dataset.src){im.src=im.dataset.src;delete im.dataset.src;}if(im.dataset.srcset){im.srcset=im.dataset.srcset;delete im.dataset.srcset;}}
function cloneGroup(group){const clone=group.cloneNode(true);clone.removeAttribute('data-original');clone.setAttribute('aria-hidden','true');clone.dataset.clone='';$$('[id]',clone).forEach(e=>e.removeAttribute('id'));$$('a',clone).forEach(a=>{const span=document.createElement('div');for(const at of [...a.attributes])if(at.name!=='href'&&at.name!=='id')span.setAttribute(at.name,at.value);span.innerHTML=a.innerHTML;a.replaceWith(span);});return clone;}
function measure(){if(!band||!primaryGroup)return;const previous=groupWidth;groupWidth=primaryGroup.getBoundingClientRect().width+13;if(groupWidth<=band.clientWidth){motionPossible=false;$$('[data-clone]',band).forEach(n=>n.remove());position=band.scrollLeft=0;}else{motionPossible=true;if(!previous){position=groupWidth;band.scrollLeft=position;}else{position=groupWidth+(position%previous)/previous*groupWidth;band.scrollLeft=position;}}updatePause();}
function frame(t){raf=requestAnimationFrame(frame);if(mode!=='mobile'||reduced.matches||!motionPossible||t<autoplayAfter)return;if(paused()){last=0;position=band.scrollLeft;return;}if(!last){last=t;position=band.scrollLeft;return;}const dt=Math.min((t-last)/1000,.05);last=t;position+=dt*25;if(position>=groupWidth*2)position-=groupWidth;if(position<groupWidth)position+=groupWidth;band.scrollLeft=position;}
let normalizeTimer=0,down=null,suppressClickUntil=0,lastTouch=0;
function setupMobile(){if(!band||!primaryGroup)return()=>{};$$('img',primaryGroup).forEach(loadImage);groupWidth=0;position=0;
if(!reduced.matches){band.prepend(cloneGroup(primaryGroup));band.append(cloneGroup(primaryGroup));measure();raf=requestAnimationFrame(frame);}else{band.scrollLeft=0;motionPossible=true;updatePause();}
const ro=new ResizeObserver(()=>{cancelAnimationFrame(measureFrame);measureFrame=requestAnimationFrame(()=>{if(!reduced.matches)measure();});});ro.observe(primaryGroup);
const io=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;last=0;updatePause();},{threshold:.05});io.observe(band);
const onScroll=()=>{if(paused()){position=band.scrollLeft;clearTimeout(normalizeTimer);normalizeTimer=setTimeout(()=>{if(pointerActive||focused||reduced.matches||!groupWidth||!motionPossible)return;let p=band.scrollLeft;if(p<groupWidth*.5)p+=groupWidth;if(p>groupWidth*2.5)p-=groupWidth;band.scrollLeft=position=p;},180);}};
band.addEventListener('scroll',onScroll,{passive:true});
return()=>{cancelAnimationFrame(raf);cancelAnimationFrame(measureFrame);clearTimeout(normalizeTimer);ro.disconnect();io.disconnect();band.removeEventListener('scroll',onScroll);$$('[data-clone]',band).forEach(e=>e.remove());};}
band?.addEventListener('pointerdown',e=>{userPaused=true;pointerActive=true;down={x:e.clientX,y:e.clientY,scroll:band.scrollLeft};updatePause();},{passive:true});
band?.addEventListener('pointermove',e=>{if(down&&(Math.hypot(e.clientX-down.x,e.clientY-down.y)>8||Math.abs(band.scrollLeft-down.scroll)>8))suppressClickUntil=performance.now()+600;},{passive:true});
const pointerEnd=()=>{pointerActive=false;if(down&&Math.abs(band.scrollLeft-down.scroll)>8)suppressClickUntil=performance.now()+600;down=null;updatePause();};
window.addEventListener('pointerup',pointerEnd,{passive:true});window.addEventListener('pointercancel',pointerEnd,{passive:true});
band?.addEventListener('touchstart',()=>{lastTouch=performance.now();userPaused=true;updatePause();},{passive:true});
band?.addEventListener('wheel',()=>{userPaused=true;updatePause();},{passive:true});
band?.addEventListener('focusin',()=>{focused=true;userPaused=true;updatePause();});band?.addEventListener('focusout',()=>{focused=false;updatePause();});
document.addEventListener('visibilitychange',()=>{hidden=document.hidden;last=0;updatePause();});
document.addEventListener('scene:progress',e=>{scenePaused=!!e.detail?.paused;last=0;updatePause();});
function fit(){const next=readMode();const stage=$('.home .stage');if(stage&&next==='desktop'){const s=Math.min(innerWidth/1280,innerHeight/800);const w=innerWidth/s,h=innerHeight/s;stage.style.setProperty('--scale',s);stage.style.setProperty('--canvas-w',w);stage.style.setProperty('--canvas-h',h);document.documentElement.classList.remove('ex1','ex2','ex3');const extra=Math.min(1,Math.max(0,Math.floor((w-1294)/218.33)));if(extra)document.documentElement.classList.add('ex'+extra);if(mosaic)$$('img',mosaic).filter(im=>im.getClientRects().length).forEach(loadImage);}
if(next!==mode){modeCleanup();mode=next;document.documentElement.dataset.mode=mode;inView=true;focused=false;last=0;if(mode==='desktop'){if(mosaic)$$('img',mosaic).filter(im=>im.getClientRects().length).forEach(loadImage);modeCleanup=()=>{};}else modeCleanup=setupMobile();updatePause();}}
let resizeFrame=0;window.addEventListener('resize',()=>{cancelAnimationFrame(resizeFrame);resizeFrame=requestAnimationFrame(fit);});reduced.addEventListener('change',()=>{modeCleanup();mode='';fit();updatePause();});
fit();updatePause();
if(!reduced.matches){document.documentElement.classList.add('intro-anim');setTimeout(()=>document.documentElement.dataset.entrance='done',2100);}
const filters=$$('[data-filter]'),cards=$$('[data-category]');filters.forEach(b=>b.addEventListener('click',()=>{filters.forEach(f=>f.setAttribute('aria-pressed',String(f===b)));let n=0;cards.forEach(c=>{c.hidden=b.dataset.filter!=='all'&&c.dataset.category!==b.dataset.filter;if(!c.hidden)n++;});const count=$('.work-count');if(count)count.textContent=String(n).padStart(2,'0')+' PHOTOGRAPHS';}));
const preset=new URLSearchParams(location.search).get('view');if(preset==='landscape')$('[data-filter="风光"]')?.click();if(preset==='everyday')$('[data-filter="日常"]')?.click();
const viewer=$('#viewer');if(!viewer||!works.length)return;
let active=-1,origin=null,openedFromPage=false,loadingToken=0,savedY=0,closingFromUI=false,restorationBeforePhoto='auto';
function preparePhotoHistory(){if(!viewer.open){restorationBeforePhoto=history.scrollRestoration;history.scrollRestoration='manual';}}
const viewerImg=$('.viewer-image',viewer),loading=$('.viewer-loading',viewer),error=$('.viewer-error',viewer);
function setImage(index){active=(index+works.length)%works.length;const w=works[active],token=++loadingToken;$('.viewer-counter',viewer).textContent=`${String(active+1).padStart(2,'0')} / ${String(works.length).padStart(2,'0')}`;$('.viewer-title',viewer).textContent=w.title;$('.viewer-caption',viewer).textContent=w.caption;viewerImg.alt=w.alt;loading.hidden=false;error.hidden=true;viewerImg.style.visibility='hidden';
const next=new Image();next.onload=()=>{if(token!==loadingToken)return;viewerImg.src=next.src;viewerImg.width=w.derivatives.large.width;viewerImg.height=w.derivatives.large.height;viewerImg.style.visibility='visible';loading.hidden=true;};next.onerror=()=>{if(token!==loadingToken)return;loading.hidden=true;error.hidden=false;};next.src=w.derivatives.large.src;}
function openIndex(index,fromPage=false){if(index<0)return;if(!viewer.open){if(!fromPage)preparePhotoHistory();savedY=scrollY;origin=document.activeElement;viewer.showModal();document.body.classList.add('viewer-open');overlayOpen=true;updatePause();$('.viewer-close',viewer).focus();}if(fromPage)openedFromPage=true;setImage(index);}
function syncHash(){const id=decodeURIComponent(location.hash.slice(1));const index=works.findIndex(w=>w.id===id);if(index>=0){openIndex(index);return;}if(viewer.open)closeActual();}
function closeActual(){++loadingToken;viewer.close();document.body.classList.remove('viewer-open');overlayOpen=false;updatePause();const y=savedY,returnFocus=origin;scrollTo({top:y,behavior:'instant'});if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});requestAnimationFrame(()=>{scrollTo({top:y,behavior:'instant'});if(returnFocus?.isConnected)returnFocus.focus({preventScroll:true});history.scrollRestoration=restorationBeforePhoto;});openedFromPage=false;closingFromUI=false;}
function requestClose(){if(!viewer.open||closingFromUI)return;closingFromUI=true;if(openedFromPage){history.back();}else{history.replaceState(null,'',location.pathname+location.search);closeActual();}}
document.addEventListener('click',e=>{const target=e.target.closest('[data-work-id]');if(!target)return;if(target.closest('.photo-band')&&performance.now()<suppressClickUntil){e.preventDefault();return;}if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;const i=works.findIndex(w=>w.id===target.dataset.workId);if(i<0)return;e.preventDefault();if(target.closest('.photo-band'))userPaused=true;preparePhotoHistory();history.pushState({photo:true},'',`#${works[i].id}`);openIndex(i,true);});
$('.viewer-close',viewer).addEventListener('click',requestClose);viewer.addEventListener('cancel',e=>{e.preventDefault();requestClose();});
function advance(delta){setImage(active+delta);history.replaceState({photo:true},'',`#${works[active].id}`);}
$('.viewer-prev',viewer).addEventListener('click',()=>advance(-1));$('.viewer-next',viewer).addEventListener('click',()=>advance(1));$('.viewer-retry',viewer).addEventListener('click',()=>setImage(active));
viewer.addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();advance(1);}if(e.key==='ArrowLeft'){e.preventDefault();advance(-1);}});
window.addEventListener('hashchange',syncHash);window.addEventListener('popstate',syncHash);syncHash();
})();
