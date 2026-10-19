(()=>{'use strict';
const $=(s,p=document)=>p.querySelector(s),$$=(s,p=document)=>[...p.querySelectorAll(s)];
const opener=$('.mountain-opener');if(!opener)return;
const reduce=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width:650px)');
const sticky=$('.mountain-sticky'),scene=$('.mountain-scene'),distance=$('.mountain-distance'),foreground=$('.mountain-foreground'),title=$('.mountain-title'),bottom=$('.mountain-bottom'),shade=$('.mountain-shade'),destination=$('.mountain-destination'),arrival=$('.archive-arrival');
const museum={viewport:$('.museum-viewport'),room:$('.museum-room'),track:$('.museum-track'),items:$$('.museum-bay'),ui:$('.museum-ui'),prev:$('.museum-prev'),next:$('.museum-next'),number:$('.museum-current-number'),name:$('.museum-current-title'),progress:$('.museum-tour-progress i'),inspect:$('.museum-inspect')};
const handoffWork=JSON.parse($('#works-data').textContent).find(w=>w.id===$('.arrival-one').dataset.workId),handoffRatio=handoffWork.width/handoffWork.height;
let frame=0,metrics=null,active=-1,trip=null,tripFrame=0;
const clamp=(n,min=0,max=1)=>Math.min(max,Math.max(min,n)),lerp=(a,b,p)=>a+(b-a)*p,ease=p=>p*p*(3-2*p);
function measure(){
 const y=scrollY,h=sticky.clientHeight;
 const flight=reduce.matches?0:h*(mobile.matches?3:2.8),tour=reduce.matches?0:h*(museum.items.length-1)*(mobile.matches?2:1.6);
 if(reduce.matches){opener.style.height='';$('#selected').style.top='';}
 else{
  const desired=Math.round(flight+tour+h)+'px';if(opener.style.height!==desired)opener.style.height=desired;
  document.body.classList.add('linked-gallery');
  document.body.style.setProperty('--gallery-viewport',h+'px');
  $('#selected').style.top=flight+'px';
  const k=Math.max(innerWidth/2400,h/1350),pw=2400*k,ph=1350*k;
  [distance,foreground].forEach(e=>Object.assign(e.style,{width:pw+'px',height:ph+'px',left:(innerWidth-pw)/2+'px',top:(h-ph)/2+'px'}));
 }
 if(reduce.matches)document.body.classList.remove('linked-gallery');
 window.CalRotor?.layout(innerWidth,h);
 metrics={y:opener.getBoundingClientRect().top+y,flight,tour,bay:museum.items[0].offsetWidth,arrival:{y:arrival.getBoundingClientRect().top+y,h:arrival.offsetHeight}};
 window.CalTour={metrics,cancel:cancelTrip,get transition(){return trip?{index:trip.index,duration:trip.duration,started:trip.started}:null;},goTo:goToExhibit};
 request();
}
function opening(p){
 const travel=clamp((p-.04)/.73),near=1+8*Math.pow(travel,1.85),far=1+7.2*Math.pow(travel,1.85),reveal=ease(clamp((p-.38)/.34));
 foreground.style.transform=`scale(${near})`;distance.style.transform=`scale(${far})`;
 title.style.transform=`translateY(${travel*80}px) scale(${1+travel*.5})`;title.style.opacity=1-ease(clamp((p-.12)/.25));
 bottom.style.opacity=1-ease(clamp(p/.18));bottom.inert=p>.15;shade.style.opacity=1-travel;
 scene.style.opacity=1-reveal;scene.style.visibility=p>=.88?'hidden':'visible';scene.inert=p>.78;
 destination.inert=p<.7;destination.setAttribute('aria-hidden',String(p<.7));
 museum.room.style.transform=`translateZ(${-180*(1-reveal)}px) rotateY(${-5*(1-reveal)}deg)`;
  museum.ui.style.opacity=ease(clamp((p-.55)/.25));
 opener.style.setProperty('--flight-progress',p);
}
function select(index){
 if(index===active)return;active=index;
 museum.items.forEach((e,i)=>{e.classList.toggle('is-current',i===index);if(i===index)e.setAttribute('aria-current','true');else e.removeAttribute('aria-current');});
 museum.number.textContent=String(index+1).padStart(2,'0');museum.name.textContent=$('figcaption strong',museum.items[index]).textContent;const link=$('.museum-frame',museum.items[index]);museum.inspect.href=link.href;museum.inspect.dataset.workId=link.dataset.workId;
 museum.prev.disabled=index===0;museum.next.disabled=index===museum.items.length-1;
 museum.items.slice(Math.max(0,index-1),index+2).forEach(e=>{$('img',e).loading='eager';});
}
function staticOpening(){
 [distance,foreground,title,bottom,shade,scene,museum.room,museum.track,museum.ui].forEach(e=>e.style.cssText='');
 destination.inert=false;destination.removeAttribute('aria-hidden');scene.inert=false;bottom.inert=false;
}
function render(){
 frame=0;if(!metrics)return;
 window.CalAutoScenes?.watch();
 const p=clamp((scrollY-metrics.y)/Math.max(1,metrics.flight)),tour=clamp((scrollY-metrics.y-metrics.flight)/Math.max(1,metrics.tour));
 if(reduce.matches)staticOpening();
 else{
  opening(p);
  museum.track.style.transform=`translate3d(${-tour*(museum.items.length-1)*metrics.bay}px,0,0)`;
  museum.progress.style.transform=`scaleX(${tour})`;const stops=window.CalMuseum3D?.stops||[.12,.28,.44,.60,.76,.92];let nearest=0;stops.forEach((stop,i)=>{if(Math.abs(tour-stop)<Math.abs(tour-stops[nearest]))nearest=i;});select(window.CalMuseum3D?.state.ready?(window.CalMuseum3D.state.progress===undefined?nearest:stops.reduce((best,v,i)=>Math.abs(window.CalMuseum3D.state.progress-v)<Math.abs(window.CalMuseum3D.state.progress-stops[best])?i:best,0)):nearest);window.CalMuseum3D?.update({progress:tour,entrance:ease(clamp((p-.38)/.34)),visible:p>.22&&scrollY<metrics.y+opener.offsetHeight});
 }
 document.body.classList.toggle('in-museum3d',!reduce.matches&&destination.dataset['3d']==='ready'&&p>.48&&scrollY<metrics.y+opener.offsetHeight-sticky.clientHeight*.1);
 const a=clamp((scrollY-metrics.arrival.y)/Math.max(1,metrics.arrival.h-sticky.clientHeight)),board=clamp(a/.26),at=ease(board),rotor=window.CalRotor?.update(a),flight=rotor?.flight||0;
 document.body.classList.toggle('in-rotor',!reduce.matches&&a>.4&&scrollY<metrics.arrival.y+metrics.arrival.h-sticky.clientHeight*.1);
 if(reduce.matches){
  $$('.arrival-photo,.arrival-word,.arrival-caption,.arrival-sticky,.museum-3d-heading,.scroll-header,.arrival-mark').forEach(e=>{e.style.cssText='';e.inert=false;});
 }
 else{
  const exit=ease(clamp((tour-.92)/.065)),header=$('.scroll-header');
  museum.ui.style.opacity*=1-exit;$('.museum-3d-heading').style.opacity=1-exit;
  const entering=scrollY>=metrics.arrival.y-.5,cover=window.CalMuseum3D?.state.handoff?.cover;
  const valid3D=destination.dataset['3d']==='ready';
  // The incoming image keeps the exact inset size of the last gallery photograph.
  $('.arrival-sticky').style.opacity=entering&&(!valid3D||cover)?'1':'0';
  if(entering&&valid3D&&!cover)request();
  header.style.opacity=entering?ease(clamp(board/.35)):1-ease(clamp((tour-.94)/.055));header.inert=Number(header.style.opacity)<.02;
  $('.arrival-sticky').style.backgroundColor=`rgb(${lerp(238,8,flight)},${lerp(237,8,flight)},${lerp(230,8,flight)})`;
  $('.arrival-word').style.transform=`translateY(${-at*30}px) scale(${1-at*.12})`;
  $$('.arrival-photo').forEach((e,i)=>{
   e.style.transformOrigin='50% 50%';
   if(i===0){
    const w=innerWidth,h=sticky.clientHeight,endW=w*(mobile.matches ? .5 : .29),endX=w*(mobile.matches ? .42 : .55),endY=h*(mobile.matches ? .26 : .22),startW=Math.min(w*.86,h*.72*handoffRatio),startH=startW/handoffRatio,rect={x:lerp((w-startW)/2,endX,at),y:lerp((h-startH)/2,endY,at),w:lerp(startW,endW,at),h:lerp(startH,endW/1.5,at)};
    Object.assign(e.style,{left:rect.x+'px',top:rect.y+'px',width:rect.w+'px',height:rect.h+'px',borderRadius:(10*at)+'px',transform:`rotate(${6*at}deg)`,opacity:'1'});
   }else{
    // Flight writes inline geometry. Restore the whole collage pose on every return.
    const w=innerWidth,h=sticky.clientHeight,width=w*(mobile.matches ? .5 : .29);
    Object.assign(e.style,{left:w*(mobile.matches?[0,.12,.61][i]:[0,.39,.68][i])+'px',top:h*(mobile.matches?[0,.51,.60][i]:[0,.50,.57][i])+'px',width:width+'px',height:width/1.5+'px',borderRadius:'10px',transform:`translate(${(i===1?-1:1)*w*.18*(1-at)}px,${120*(1-at)}px) scale(${lerp(.65,1,at)}) rotate(${[-7,4][i-1]*at}deg)`,opacity:clamp((board-.25)/.5)});
   }
   if(flight>0&&rotor){
    const w=innerWidth,h=sticky.clientHeight,baseW=w*(mobile.matches ? .5 : .29),baseX=w*(mobile.matches?[.42,.12,.61][i]:[.55,.39,.68][i]),baseY=h*(mobile.matches?[.26,.51,.60][i]:[.22,.50,.57][i]),slot=rotor.slots.get(e.dataset.workId);
    if(slot)window.CalRotor.fly(e,{x:baseX,y:baseY,w:baseW,h:baseW/1.5,rotation:[6,-7,4][i]},flight);
   }
  });
  $('.arrival-word').style.opacity=clamp((board-.3)/.5)*(1-flight);$('.arrival-caption').style.opacity=clamp((board-.4)/.5)*(1-flight);$('.arrival-mark').style.opacity=clamp((board-.4)/.5)*(1-flight);
 }
 $('.scroll-progress').style.transform=`scaleX(${clamp(scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight))})`;
}
function request(){if(!frame)frame=requestAnimationFrame(render);}
function cancelTrip(){if(tripFrame)cancelAnimationFrame(tripFrame);tripFrame=0;trip=null;destination.removeAttribute('data-travelling');}
function goToExhibit(index,behavior='smooth'){
 index=clamp(index,0,museum.items.length-1);
 cancelTrip();
 if(reduce.matches){museum.items[index].scrollIntoView({block:'center',behavior:'instant'});return;}
 const to=metrics.y+metrics.flight+(window.CalMuseum3D?.stops||[.12,.28,.44,.60,.76,.92])[index]*metrics.tour;
 if(behavior==='instant'){scrollTo({top:to,behavior:'instant'});return;}
 const from=scrollY,duration=mobile.matches?2600:2200;
 trip={index,from,to,duration,started:performance.now()};destination.dataset.travelling='true';
 const tick=now=>{
  if(!trip)return;const t=clamp((now-trip.started)/trip.duration),k=t*t*t*(t*(t*6-15)+10);
  scrollTo({top:lerp(trip.from,trip.to,k),behavior:'instant'});
  if(t<1)tripFrame=requestAnimationFrame(tick);else cancelTrip();
 };tripFrame=requestAnimationFrame(tick);
}
// Native vertical scrolling is retained. Buttons and keys simply choose a tour position.
 museum.prev.addEventListener('click',()=>goToExhibit((trip?.index??active)-1));museum.next.addEventListener('click',()=>goToExhibit((trip?.index??active)+1));
 window.addEventListener('wheel',cancelTrip,{passive:true});window.addEventListener('touchstart',e=>{if(!e.target.closest?.('.museum-prev,.museum-next'))cancelTrip();},{passive:true});
 window.addEventListener('pointerdown',e=>{if(!e.target.closest('.museum-prev,.museum-next'))cancelTrip();},{passive:true});
 window.addEventListener('keydown',e=>{if(['Escape','PageDown','PageUp','Home','End','ArrowDown','ArrowUp',' '].includes(e.key))cancelTrip();});
 new MutationObserver(()=>{if($('#viewer')?.open)cancelTrip();}).observe($('#viewer'),{attributes:true,attributeFilter:['open']});
 destination.addEventListener('keydown',e=>{if(reduce.matches||$('#viewer')?.open||e.altKey||e.ctrlKey||e.metaKey||e.shiftKey)return;if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();goToExhibit(active+(e.key==='ArrowRight'?1:-1));}});
 destination.addEventListener('focusin',e=>{
  museum.viewport.scrollLeft=0;
  const item=e.target.closest('.museum-bay');if(!item||reduce.matches||!e.target.matches(':focus-visible'))return;
  const r=e.target.getBoundingClientRect();if(r.left<0||r.right>innerWidth)goToExhibit(museum.items.indexOf(item),'instant');
 });
 window.addEventListener('scroll',request,{passive:true});window.addEventListener('resize',measure);reduce.addEventListener('change',measure);mobile.addEventListener('change',measure);
 const ro=new ResizeObserver(measure);ro.observe(document.querySelector('main'));
 const observed=$$('[id="selected"],#works,#about,#process');
 const activeNav=new IntersectionObserver(entries=>{for(const e of entries)if(e.isIntersecting)$$('.scroll-nav a').forEach(a=>{if(a.hash==='#'+e.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});},{rootMargin:'-15% 0px -55% 0px'});observed.forEach(s=>activeNav.observe(s));
 $$('[data-filter]').forEach(b=>b.addEventListener('click',()=>requestAnimationFrame(measure)));
 // A missing cutout falls back to sky, never to the full photograph containing the city.
 const sources=[opener.dataset.maskSrc,opener.dataset.photoSrc];
 Promise.all(sources.map(src=>new Promise(resolve=>{
  const im=new Image();const timer=setTimeout(()=>resolve(false),12000);
  im.onload=()=>{clearTimeout(timer);resolve(true);};im.onerror=()=>{clearTimeout(timer);resolve(false);};im.src=src;
 }))).then(ok=>{opener.dataset.ready='true';if(ok.some(v=>!v))opener.dataset.fallback='true';measure();});
 document.addEventListener('museum:position',e=>select(e.detail));document.addEventListener('museum:ready',measure);window.addEventListener('pageshow',measure);measure();
})();
