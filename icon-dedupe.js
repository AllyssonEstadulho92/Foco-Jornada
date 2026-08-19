let raf=0;
const $all=(s,r=document)=>[...r.querySelectorAll(s)];

function cleanIconBox(box){
  const svg=box.querySelector(':scope > svg.hub-svg');
  const icons=$all(':scope > i.fi-motion',box);
  const keep=icons.find(i=>i.classList.contains('flaticon-live'))||icons[0]||null;
  icons.forEach(i=>{if(i!==keep)i.remove()});
  if(!svg)return;
  if(keep&&keep.classList.contains('flaticon-live')){
    svg.hidden=true;
    svg.style.setProperty('display','none','important');
  }else{
    svg.hidden=false;
    svg.style.removeProperty('display');
    svg.classList.remove('flaticon-source-hidden');
  }
}

function cleanArrow(arrow){
  $all(':scope > i.fi-motion',arrow).forEach(i=>i.remove());
  const svg=arrow.querySelector(':scope > svg.hub-svg');
  if(!svg)return;
  svg.hidden=false;
  svg.classList.remove('flaticon-source-hidden');
  svg.style.setProperty('display','block','important');
  svg.dataset.flaticonBound='static-chevron';
}

function cleanHubIcons(){
  $all('#appHub .hub-item-icon').forEach(cleanIconBox);
  $all('#appHub .hub-item-arrow').forEach(cleanArrow);
}

function schedule(){
  if(raf)return;
  raf=requestAnimationFrame(()=>{raf=0;cleanHubIcons()});
}

schedule();
new MutationObserver(schedule).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
window.addEventListener('pageshow',schedule);
window.FocoIconDedupe=Object.freeze({refresh:cleanHubIcons});
