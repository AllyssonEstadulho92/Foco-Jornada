const FLATICON_VERSION='3.0.0';
const CDN_MARK='cdn-uicons.flaticon.com';
let ready=false,raf=0;

const NAV={today:'home',activities:'checkbox',focus:'bullseye',history:'time-past',stats:'chart-histogram',more:'menu-dots'};
const ACTION={
  toggleTheme:'moon',screenBreak:'pause',restBreak:'bed',goFocus:'bullseye',coffee:'mug-hot',
  startWork:'play',endWork:'stop',endBreak:'check',extendBreak:'plus',startFocus:'play',pauseFocus:'pause',resumeFocus:'play',endFocus:'stop',
  startActivity:'play',pauseActivity:'pause',completeActivity:'check',editActivity:'edit',cancelActivity:'trash',
  editWork:'edit',reopenWork:'rotate-left',cancelWork:'trash'
};
const HUB={moovit:'bus',supershift:'calendar',shifts:'calendar',schedule:'clock',stats:'chart-histogram',settings:'settings',backup:'database',notifications:'bell',updates:'refresh',about:'info'};
const SP_TAB={calendar:'calendar',reports:'chart-histogram',models:'layers',more:'menu-burger'};
const SP_ACTION={
  close:'cross','prev-month':'angle-left','next-month':'angle-right','calendar-options':'settings-sliders','pick-selected':'edit','sort-models':'sort-alt',
  'add-shift':'plus','add-job':'plus','add-rotation':'plus','apply-rotation':'refresh','save-report-settings':'disk',print:'print','export-ics':'calendar-lines','export-json':'download'
};
const IDS={newActivityBtn:'plus',exportBtn:'download',importBtn:'upload',checkBtn:'shield-check',resetBtn:'trash'};

function semanticFromContext(svg){
  const nav=svg.closest('[data-nav]')?.dataset.nav;if(nav&&NAV[nav])return NAV[nav];
  const act=svg.closest('[data-action]')?.dataset.action;if(act&&ACTION[act])return ACTION[act];
  const hub=svg.closest('[data-hub-action]')?.dataset.hubAction;if(hub&&HUB[hub])return HUB[hub];
  const tab=svg.closest('[data-sp-tab]')?.dataset.spTab;if(tab&&SP_TAB[tab])return SP_TAB[tab];
  const spa=svg.closest('[data-sp-action]')?.dataset.spAction;if(spa&&SP_ACTION[spa])return SP_ACTION[spa];
  const id=svg.closest('button')?.id;if(id&&IDS[id])return IDS[id];
  if(svg.closest('.notification-bell'))return'bell';
  if(svg.closest('.hub-close')||svg.closest('.sp-close'))return'cross';
  if(svg.closest('.hub-row-arrow'))return'angle-small-right';
  if(svg.closest('.hub-future-icon'))return'apps';
  if(svg.closest('.sp-add'))return'plus';
  if(svg.closest('.sp-checkbox'))return'check';
  if(svg.closest('.logo'))return'bullseye';
  const row=svg.closest('.sp-agenda-row,.sp-model-row,.sp-more-row');
  if(row&&svg===row.querySelector(':scope > svg:last-child'))return'angle-small-right';
  return'';
}
function semanticFromPath(svg){
  const h=(svg.innerHTML||'').replace(/\s+/g,' ');
  const tests=[
    ['M3 10.5 12 3','home'],['x="3" y="4" width="18" height="16"','checkbox'],['r="8"','bullseye'],['M3 12a9 9','time-past'],
    ['M4 20V10M10 20V4','chart-histogram'],['cx="5" cy="12"','menu-dots'],['M18 8a6 6','bell'],['M12 3a9 9','moon'],
    ['M10 9v6','pause'],['M20.5 14.5','bed'],['M4 9h13','mug-hot'],['m10 8 6 4','play'],['m5 12 4 4','check'],
    ['M4 20h4L19 9','edit'],['M4 7h16M9 7V4','trash'],['M12 5v14','plus'],['M12 21V9','upload'],['M12 3 5 6','shield-check'],
    ['M5 3h12','disk'],['M9 7 4 12','rotate-left'],['M5 17h14','bus'],['M19 12a7 7','settings'],['M5 4h11','database'],
    ['M20 7v5','refresh'],['M12 7v5l3 2','clock'],['M12 11v6','info'],['m9 6 6 6','angle-small-right'],['x="3" y="3" width="7"','apps'],
    ['M4 20V11M10 20V5','chart-histogram'],['M5 5h12v14','layers'],['M4 7h16M4 12h16','menu-burger'],['m6 6 12 12','cross'],
    ['m15 18-6-6','angle-left'],['M12 3v12M8 7','share'],['M8 4v16','sort-alt'],['M14 4h6v6','external-link']
  ];
  for(const [sig,name] of tests)if(h.includes(sig))return name;
  if(h.includes('M12 3v12')&&h.includes('M5 21h14'))return'download';
  return'circle';
}
function roleName(name){return name.replace(/[^a-z0-9-]/gi,'-')}
function validPseudo(i){
  const c=getComputedStyle(i,'::before').content;
  return !!c&&c!=='none'&&c!=='normal'&&c!=='""'&&c!=="''";
}
function bindSvg(svg){
  if(!ready||!svg?.isConnected||svg.dataset.flaticonBound)return;
  const name=semanticFromContext(svg)||semanticFromPath(svg);if(!name)return;
  svg.dataset.flaticonBound=name;
  const i=document.createElement('i');
  i.className=`fi fi-rr-${name} fi-motion fi-role-${roleName(name)}`;
  i.dataset.flaticonFor=name;i.setAttribute('aria-hidden','true');
  svg.insertAdjacentElement('afterend',i);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(!i.isConnected)return;
    if(validPseudo(i)){i.classList.add('flaticon-live');svg.classList.add('flaticon-source-hidden')}
    else{i.remove();svg.classList.remove('flaticon-source-hidden');delete svg.dataset.flaticonBound}
  }));
}
function replaceTextIcons(scope=document){
  scope.querySelectorAll?.('.sp-job-icon').forEach(el=>{if(el.dataset.flaticonText)return;el.dataset.flaticonText='1';const i=document.createElement('i');i.className='fi fi-rr-briefcase fi-motion fi-role-briefcase';i.setAttribute('aria-hidden','true');el.textContent='';el.appendChild(i);requestAnimationFrame(()=>{if(validPseudo(i))i.classList.add('flaticon-live')})});
}
function enhance(scope=document){
  if(!ready)return;
  scope.querySelectorAll?.('svg.ui-svg,svg.hub-svg,svg.sp-icon').forEach(bindSvg);
  replaceTextIcons(scope);
}
function schedule(scope=document){
  if(!ready||raf)return;
  raf=requestAnimationFrame(()=>{raf=0;enhance(scope)});
}
function activate(){if(ready)return;ready=true;document.documentElement.classList.add('flaticon-ready');enhance(document)}
function stylesheetPresent(){return [...document.styleSheets].some(s=>String(s.href||'').includes(CDN_MARK))}
const link=document.querySelector('link[data-flaticon-uicons]');
if(stylesheetPresent())activate();
else if(link){link.addEventListener('load',activate,{once:true});link.addEventListener('error',()=>document.documentElement.classList.add('flaticon-fallback'),{once:true})}
new MutationObserver(mutations=>{if(!ready)return;for(const m of mutations)for(const n of m.addedNodes)if(n.nodeType===1)schedule(n)}).observe(document.body,{childList:true,subtree:true});
window.FocoFlaticon=Object.freeze({version:FLATICON_VERSION,refresh:()=>enhance(document),ready:()=>ready});
