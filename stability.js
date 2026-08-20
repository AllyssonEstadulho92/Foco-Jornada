const VERSION='4.2.0';
const RUNTIME_VERSION='2.0.0';
const STORAGE_KEY='foco-jornada-v4';

function migrateCoffeeDefaults(){
  try{
    const state=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    const types=state?.settings?.coffeeTypes;
    if(!Array.isArray(types))return;
    const id=state.settings.defaultCoffeeTypeId||'espresso';
    const coffee=types.find(item=>item.id===id)||types.find(item=>item.id==='espresso');
    if(!coffee)return;
    let changed=false;
    if(coffee.priceCents===70){coffee.priceCents=40;changed=true}
    if(!coffee.name||coffee.name==='Café'){coffee.name='Café vending Sogenave';changed=true}
    if(changed){state.updatedAt=Date.now();localStorage.setItem(STORAGE_KEY,JSON.stringify(state))}
  }catch{}
}

migrateCoffeeDefaults();
await import('./app.js');

window.FocoStability=Object.freeze({
  version:VERSION,
  runtimeVersion:RUNTIME_VERSION,
  mode:'native-runtime'
});
