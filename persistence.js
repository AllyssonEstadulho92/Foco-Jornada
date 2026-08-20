(function(){
'use strict';
const VERSION='1.3.0';
const APP_KEY='foco-jornada-v4';
const FEATURE_KEY='foco-jornada-features-v2';
const RECOVERY_KEY='foco-jornada-recovery-v1';
const DB_NAME='foco-jornada-safe-v1';
const DB_STORE='snapshots';
const AUX_KEYS=new Set(['foco-jornada-notifications-v1','foco-jornada-notification-preference-v1']);
const TRACKED=new Set([APP_KEY,FEATURE_KEY,...AUX_KEYS]);
const originalSet=Storage.prototype.setItem;
const originalRemove=Storage.prototype.removeItem;
const originalClear=Storage.prototype.clear;
let dbPromise=null,lastFingerprints=new Map(),mirrorTimers=new Map(),restored=false;

function parse(raw){try{return raw?JSON.parse(raw):null}catch{return null}}
function appUseful(v){if(!v||typeof v!=='object')return false;return ['workSessions','activities','focusSessions','coffeeEntries','breakSessions'].some(k=>Array.isArray(v[k]))&&v.settings&&typeof v.settings==='object'}
function featureUseful(v){return !!v&&typeof v==='object'&&!Array.isArray(v)}
function appScore(v){if(!appUseful(v))return 0;return ['workSessions','breakSessions','activities','activitySegments','focusSessions','coffeeEntries','events'].reduce((sum,k)=>sum+(Array.isArray(v[k])?v[k].length:0),0)}
function featureScore(v){if(!featureUseful(v))return 0;const p=v.shiftPlanner||{};return Object.keys(p.assignments||{}).length*3+(p.templates||[]).length+(p.jobs||[]).length+(p.rotations||[]).length}
function meaningful(raw,key){const v=parse(raw);if(v===null)return String(raw||'');if(key===APP_KEY){const x={...v};delete x.updatedAt;delete x.appVersion;return JSON.stringify(x)}return JSON.stringify(v)}
function readRecovery(storage=localStorage){const rec=parse(storage.getItem(RECOVERY_KEY));return rec&&typeof rec==='object'?{version:VERSION,savedAt:0,app:null,features:null,appPrevious:null,featuresPrevious:null,aux:{},...rec,aux:rec.aux&&typeof rec.aux==='object'?rec.aux:{}}:{version:VERSION,savedAt:0,app:null,features:null,appPrevious:null,featuresPrevious:null,aux:{}}}
function rawForKey(key){try{return localStorage.getItem(key)}catch{return null}}
function writeRecovery(key,raw){try{const rec=readRecovery();rec.version=VERSION;rec.savedAt=Date.now();if(key===APP_KEY){const before=parse(rec.app),after=parse(raw);if(appUseful(before)&&appUseful(after)&&appScore(after)+2<appScore(before)&&before.createdAt!==after.createdAt)rec.appPrevious=rec.app;rec.app=raw}else if(key===FEATURE_KEY){const before=parse(rec.features),after=parse(raw);if(featureUseful(before)&&featureUseful(after)&&featureScore(after)+2<featureScore(before))rec.featuresPrevious=rec.features;rec.features=raw}else if(AUX_KEYS.has(key))rec.aux[key]=raw;originalSet.call(localStorage,RECOVERY_KEY,JSON.stringify(rec))}catch{}}
function preserveFeatureBranches(raw){const incoming=parse(raw);if(!featureUseful(incoming))return raw;const current=parse(rawForKey(FEATURE_KEY));if(!featureUseful(current))return raw;for(const key of ['shiftPlanner','places','schedule','dailyClosures','closedDays','recentTrips','focusMode'])if(incoming[key]===undefined&&current[key]!==undefined)incoming[key]=current[key];return JSON.stringify(incoming)}
function restoreLocal(){try{const rec=readRecovery();let currentApp=rawForKey(APP_KEY),currentFeature=rawForKey(FEATURE_KEY),backupApp=rec.app,backupFeature=rec.features;const appObj=parse(currentApp),backupAppObj=parse(backupApp),previousAppObj=parse(rec.appPrevious);if(!appUseful(appObj)&&appUseful(backupAppObj)){originalSet.call(localStorage,APP_KEY,backupApp);restored=true;currentApp=backupApp}else if(appUseful(appObj)&&appScore(appObj)===0&&appUseful(previousAppObj)&&appScore(previousAppObj)>0&&appObj.createdAt!==previousAppObj.createdAt){originalSet.call(localStorage,APP_KEY,rec.appPrevious);restored=true;currentApp=rec.appPrevious}const featureObj=parse(currentFeature),backupFeatureObj=parse(backupFeature),previousFeatureObj=parse(rec.featuresPrevious);if(!featureUseful(featureObj)&&featureUseful(backupFeatureObj)){originalSet.call(localStorage,FEATURE_KEY,backupFeature);restored=true;currentFeature=backupFeature}else if(featureUseful(featureObj)&&featureScore(featureObj)===0&&featureUseful(previousFeatureObj)&&featureScore(previousFeatureObj)>0&&!featureObj.shiftPlanner){featureObj.shiftPlanner=previousFeatureObj.shiftPlanner;originalSet.call(localStorage,FEATURE_KEY,JSON.stringify(featureObj));restored=true;currentFeature=JSON.stringify(featureObj)}for(const key of AUX_KEYS)if(rawForKey(key)==null&&rec.aux?.[key]!=null){originalSet.call(localStorage,key,rec.aux[key]);restored=true}}catch{}}
function openDb(){if(!('indexedDB'in window))return Promise.resolve(null);if(dbPromise)return dbPromise;dbPromise=new Promise(resolve=>{try{const req=indexedDB.open(DB_NAME,1);req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(DB_STORE))req.result.createObjectStore(DB_STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>resolve(null)}catch{resolve(null)}});return dbPromise}
async function idbPut(key,raw){const db=await openDb();if(!db||raw==null)return;try{await new Promise(resolve=>{const tx=db.transaction(DB_STORE,'readwrite');tx.objectStore(DB_STORE).put({raw,savedAt:Date.now()},key);tx.oncomplete=resolve;tx.onerror=resolve;tx.onabort=resolve})}catch{}}
async function idbGet(key){const db=await openDb();if(!db)return null;try{return await new Promise(resolve=>{const tx=db.transaction(DB_STORE,'readonly'),req=tx.objectStore(DB_STORE).get(key);req.onsuccess=()=>resolve(req.result?.raw??null);req.onerror=()=>resolve(null)})}catch{return null}}
function queueMirror(key,raw){const old=mirrorTimers.get(key);if(old)clearTimeout(old);const timer=setTimeout(()=>{mirrorTimers.delete(key);idbPut(key,raw)},180);mirrorTimers.set(key,timer)}
function commitKey(key,raw,force=false){if(raw==null)return;const fp=meaningful(raw,key);if(!force&&lastFingerprints.get(key)===fp)return;lastFingerprints.set(key,fp);writeRecovery(key,raw);queueMirror(key,raw)}
function snapshot(force=false){for(const key of TRACKED){const raw=rawForKey(key);if(raw!=null)commitKey(key,raw,force)}}
async function restoreFromIndexedDb(){let changed=false;const currentApp=rawForKey(APP_KEY),currentFeature=rawForKey(FEATURE_KEY);if(!appUseful(parse(currentApp))){const raw=await idbGet(APP_KEY);if(appUseful(parse(raw))){originalSet.call(localStorage,APP_KEY,raw);writeRecovery(APP_KEY,raw);changed=true}}if(!featureUseful(parse(currentFeature))){const raw=await idbGet(FEATURE_KEY);if(featureUseful(parse(raw))){originalSet.call(localStorage,FEATURE_KEY,raw);writeRecovery(FEATURE_KEY,raw);changed=true}}for(const key of AUX_KEYS)if(rawForKey(key)==null){const raw=await idbGet(key);if(raw!=null){originalSet.call(localStorage,key,raw);writeRecovery(key,raw);changed=true}}if(changed&&!restored){restored=true;location.reload()}return changed}
function installStorageGuard(){if(window.__focoPersistencePatched)return;window.__focoPersistencePatched=true;Storage.prototype.setItem=function(key,value){let raw=String(value);if(this===localStorage&&key===FEATURE_KEY)raw=preserveFeatureBranches(raw);const result=originalSet.call(this,key,raw);if(this===localStorage&&TRACKED.has(key))commitKey(key,raw);return result};Storage.prototype.removeItem=function(key){const result=originalRemove.call(this,key);if(this===localStorage&&TRACKED.has(key)){lastFingerprints.delete(key);try{const rec=readRecovery();if(key===APP_KEY){rec.app=null;rec.appPrevious=null}if(key===FEATURE_KEY){rec.features=null;rec.featuresPrevious=null}if(AUX_KEYS.has(key)&&rec.aux)delete rec.aux[key];rec.savedAt=Date.now();originalSet.call(localStorage,RECOVERY_KEY,JSON.stringify(rec))}catch{}}return result};Storage.prototype.clear=function(){const result=originalClear.call(this);if(this===localStorage)lastFingerprints.clear();return result}}
async function persistentStatus(){if(!navigator.storage?.persisted)return{supported:false,persisted:false};try{return{supported:true,persisted:await navigator.storage.persisted()}}catch{return{supported:true,persisted:false}}}
async function requestPersistentStorage(){if(!navigator.storage?.persist)return{supported:false,persisted:false};try{const persisted=await navigator.storage.persist();return{supported:true,persisted:!!persisted}}catch{return{supported:true,persisted:false}}}
function initFingerprints(){for(const key of TRACKED){const raw=rawForKey(key);if(raw!=null)lastFingerprints.set(key,meaningful(raw,key))}}

restoreLocal();
installStorageGuard();
initFingerprints();
snapshot(true);
restoreFromIndexedDb();
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')snapshot(true)});
window.addEventListener('pagehide',()=>snapshot(true));
window.addEventListener('foco-shift-planner-change',()=>snapshot(true));
window.addEventListener('foco-notification-preference-change',()=>snapshot(true));
window.addEventListener('appinstalled',()=>snapshot(true));
window.FocoPersistence=Object.freeze({version:VERSION,snapshot:()=>snapshot(true),persistentStatus,requestPersistentStorage,keys:{app:APP_KEY,features:FEATURE_KEY,recovery:RECOVERY_KEY,aux:[...AUX_KEYS]}});
})();
