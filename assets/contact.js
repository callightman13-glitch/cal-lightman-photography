(()=>{'use strict';
const dialog=document.getElementById('contact-dialog');if(!dialog)return;
const address=dialog.querySelector('#contact-address'),copy=dialog.querySelector('.contact-copy'),status=dialog.querySelector('.contact-status');let origin=null;
document.documentElement.classList.add('contact-ready');
document.addEventListener('click',event=>{
 const trigger=event.target.closest('[data-contact-open]');if(!trigger)return;
 event.preventDefault();window.CalAutoScenes?.cancel();window.CalTour?.cancel();
 if(dialog.open)return;origin=trigger;status.textContent='';copy.textContent='复制邮箱地址';dialog.showModal();document.body.classList.add('contact-open');
});
dialog.querySelector('.contact-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target!==dialog)return;const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();});
dialog.addEventListener('close',()=>{document.body.classList.remove('contact-open');origin?.focus({preventScroll:true});});
copy.addEventListener('click',async()=>{
 let copied=false;
 if(window.isSecureContext&&navigator.clipboard?.writeText){try{await navigator.clipboard.writeText(address.value);copied=true;}catch{}}
 if(!copied){address.focus({preventScroll:true});address.select();address.setSelectionRange(0,address.value.length);try{copied=document.execCommand('copy');}catch{}}
 status.textContent=copied?'邮箱地址已复制。':'请长按或选中上方邮箱地址复制。';
 copy.textContent=copied?'已复制':'复制邮箱地址';
 if(copied)copy.focus({preventScroll:true});
});
})();
