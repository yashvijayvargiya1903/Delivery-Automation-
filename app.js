const views=["overview","automations","orders","analytics","settings"];
const titles={overview:"Overview",automations:"Automations",orders:"Orders",analytics:"Analytics",settings:"Settings"};
const toast=document.getElementById("toast");
function showToast(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(window._toast);window._toast=setTimeout(()=>toast.classList.remove("show"),2200)}
function setView(view){
  if(!views.includes(view)) return;
  views.forEach(v=>document.getElementById("view-"+v).classList.toggle("active-view",v===view));
  document.querySelectorAll("[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));
  document.getElementById("pageTitle").textContent=titles[view];
  window.scrollTo({top:0,behavior:"smooth"});
  document.querySelector(".sidebar").classList.remove("open");
}
document.querySelectorAll("[data-view]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.view)));
document.querySelectorAll("[data-view-target]").forEach(b=>b.addEventListener("click",()=>setView(b.dataset.viewTarget)));
document.getElementById("menuBtn").addEventListener("click",()=>document.querySelector(".sidebar").classList.toggle("open"));
document.getElementById("bellBtn").addEventListener("click",()=>showToast("No new alerts"));

document.querySelectorAll(".switch").forEach(sw=>sw.addEventListener("click",()=>{
  sw.classList.toggle("on");
  if(sw.id==="engineToggle"){
    const running=sw.classList.contains("on");
    document.getElementById("engineText").textContent=running?"Running smoothly":"Automation paused";
    showToast(running?"Automation engine resumed":"Automation engine paused");
  } else if(["exclusiveToggle","builderExclusiveToggle","settingsExclusiveToggle"].includes(sw.id)){
    const enabled=sw.classList.contains("on");
    syncExclusiveToggles(enabled,sw.id);
    showToast(enabled?"Exclusive Order Lock enabled":"Exclusive Order Lock disabled");
  } else {
    showToast(sw.classList.contains("on")?"Setting enabled":"Setting disabled");
  }
}));

function syncExclusiveToggles(enabled, source){
  ["exclusiveToggle","builderExclusiveToggle","settingsExclusiveToggle"].forEach(id=>{
    const el=document.getElementById(id);
    if(el && id!==source) el.classList.toggle("on",enabled);
  });
  if(!enabled && lockTimer){clearInterval(lockTimer);lockTimer=null;}
  if(!enabled) resetLock();
}

let lockTimer=null;
let remaining=0;
let activePlatform=null;
const platforms=["Porter","Swiggy","Zomato","Rapido"];
function notifyRider(title,detail){
  showToast(title+" · "+detail);
  const toastEl=document.getElementById("toast");
  toastEl.setAttribute("role","alert");
  if("Notification" in window && Notification.permission==="granted"){
    try{new Notification(title,{body:detail,tag:"delivery-automation"});}catch(e){}
  }
}
function renderPlatforms(){
  document.querySelectorAll(".platform-pill").forEach(p=>{
    const name=platforms.find(n=>p.textContent.includes(n));
    p.classList.toggle("locked",Boolean(activePlatform)&&name!==activePlatform);
    p.classList.toggle("live",!activePlatform||name===activePlatform);
  });
}
function lockFor(platform){
  activePlatform=platform;
  document.getElementById("lockLabel").textContent="ORDER LOCK ACTIVE";
  document.getElementById("lockTitle").textContent=platform+" accepted · other platforms paused";
  document.getElementById("lockDetail").textContent="Exclusive lock is active. Other connected platforms are paused to prevent overlapping orders.";
  renderPlatforms();
}
function unlockAll(){
  activePlatform=null;
  document.getElementById("lockLabel").textContent="SEARCHING FOR OFFERS";
  document.getElementById("lockTitle").textContent="All platforms live again";
  document.getElementById("lockDetail").textContent="Comparing available offers against the rider's preferences.";
  document.getElementById("countdown").textContent="LIVE";
  renderPlatforms();
}
function autoSelectBest(){
  const candidates=[
    {platform:"Porter",payout:168,distance:2.2,eta:24},
    {platform:"Swiggy",payout:142,distance:1.4,eta:28},
    {platform:"Zomato",payout:126,distance:2.6,eta:31},
    {platform:"Rapido",payout:154,distance:3.4,eta:22}
  ].filter(o=>o.payout>=ruleConfig.smart.minPayout&&o.distance<=ruleConfig.smart.maxDistance&&o.eta<=ruleConfig.smart.maxEta&&(!ruleConfig.smart.preferredOnly||ruleConfig.areas.areas.toLowerCase().split(",").some(a=>a.trim()&&("vesu city light adajan").includes(a.trim().toLowerCase()))));
  const best=candidates.sort((a,b)=>(b.payout-(b.distance*4)-(b.eta*.3))-(a.payout-(a.distance*4)-(a.eta*.3)))[0];
  if(!best){notifyRider("No eligible offer","All offers failed your preferences.");return;}
  lockFor(best.platform);
  document.getElementById("countdown").textContent="ACTIVE";
  notifyRider("Best offer auto-accepted",best.platform+" · ₹"+best.payout+" · "+best.distance+" km · "+best.eta+" min");
}
function resetLock(){
  remaining=0;activePlatform=null;
  const label=document.getElementById("lockLabel"),title=document.getElementById("lockTitle"),detail=document.getElementById("lockDetail"),count=document.getElementById("countdown");
  if(!label)return;
  label.textContent="READY FOR OFFERS";title.textContent="All platforms live";detail.textContent="The engine can compare incoming offers and select the best match.";count.textContent="—";
  renderPlatforms();
}
function setLockState(){
  document.getElementById("lockLabel").textContent="ORDER LOCK ACTIVE";
  document.getElementById("lockTitle").textContent=activePlatform+" accepted · other platforms paused";
  document.getElementById("lockDetail").textContent="All connected platforms are temporarily paused to prevent overlapping orders.";
  document.getElementById("countdown").textContent=formatTime(remaining);
  renderPlatforms();
}
function formatTime(sec){return "0"+Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");}
function startExclusiveDemo(){
  if(!document.getElementById("exclusiveToggle")?.classList.contains("on")){showToast("Enable Exclusive Order Lock first");return;}
  if(lockTimer)clearInterval(lockTimer);
  remaining=Math.max(1,Number(ruleConfig.exclusive.releaseMinutes)||2)*60;lockFor("Porter");setLockState();
  notifyRider("Order accepted automatically","Porter · other platforms paused");
  lockTimer=setInterval(()=>{
    remaining--;
    if(remaining>0){setLockState();if(remaining===10)showToast("Release window opens in 10 seconds");return;}
    clearInterval(lockTimer);lockTimer=null;unlockAll();
    notifyRider("Release window opened","Searching all platforms for the best eligible offer");
    setTimeout(autoSelectBest,800);
  },1000);
}
document.getElementById("simulateOrder")?.addEventListener("click",startExclusiveDemo);
document.getElementById("simulateCancel")?.addEventListener("click",()=>{
  if(lockTimer){clearInterval(lockTimer);lockTimer=null;}
  if(!activePlatform){notifyRider("No active delivery","Accept a demo order before simulating cancellation.");return;}
  const cancelled=activePlatform;
  unlockAll();
  notifyRider("Order cancelled","The "+cancelled+" order was cancelled. Platforms reopened; searching for the next best offer.");
  setTimeout(autoSelectBest,500);
});

document.getElementById("simulateFromRules")?.addEventListener("click",()=>{setView("overview");setTimeout(startExclusiveDemo,250)});

document.getElementById("newRule").addEventListener("click",()=>openRuleEditor("smart"));
document.querySelectorAll(".text-btn").forEach(b=>b.addEventListener("click",e=>{if(!e.currentTarget.dataset.viewTarget && e.currentTarget.id!=="simulateFromRules")showToast("Rule editor opened in demo mode")}));
document.querySelectorAll(".filter-btn").forEach(b=>b.addEventListener("click",()=>showToast("Filter options are available in the full app")));


const RULE_DEFAULTS={
  smart:{name:"Smart Auto Accept",enabled:true,minPayout:120,maxDistance:3,maxEta:35,preferredOnly:true},
  peak:{name:"Peak Hour Mode",enabled:false,start:"17:00",end:"22:00",minPayout:160,maxDistance:4},
  areas:{name:"Preferred Areas",enabled:false,areas:"Adajan, Vesu, City Light"},
  exclusive:{name:"Exclusive Order Lock",enabled:true,releaseMinutes:2}
};
let ruleConfig={...RULE_DEFAULTS};
try{ruleConfig={...RULE_DEFAULTS,...JSON.parse(localStorage.getItem("deliveryRuleConfig")||"{}")};}catch(e){}
function saveRuleConfig(){try{localStorage.setItem("deliveryRuleConfig",JSON.stringify(ruleConfig));}catch(e){}}
const ruleSchemas={
 smart:[["name","Rule name","text"],["minPayout","Minimum payout (₹)","number"],["maxDistance","Maximum pickup distance (km)","number"],["maxEta","Maximum delivery ETA (min)","number"],["preferredOnly","Only accept preferred areas","checkbox"]],
 peak:[["name","Rule name","text"],["start","Start time","time"],["end","End time","time"],["minPayout","Minimum payout (₹)","number"],["maxDistance","Maximum pickup distance (km)","number"]],
 areas:[["name","Rule name","text"],["areas","Preferred areas (comma-separated)","text"]],
 exclusive:[["name","Rule name","text"],["releaseMinutes","Reopen platforms before completion (minutes)","number"]]
};
let editingRule=null;
function openRuleEditor(key){
 if(!ruleSchemas[key])return;
 editingRule=key;const cfg=ruleConfig[key]||RULE_DEFAULTS[key];
 document.getElementById("ruleModalTitle").textContent="Edit "+cfg.name;
 const fields=document.getElementById("ruleFields");fields.innerHTML="";
 ruleSchemas[key].forEach(([name,label,type])=>{
   const wrap=document.createElement("label");wrap.className="rule-field"+(type==="checkbox"?" checkbox-field":"");
   const title=document.createElement("span");title.textContent=label;wrap.appendChild(title);
   const input=document.createElement("input");input.name=name;input.type=type;
   if(type==="checkbox"){input.checked=Boolean(cfg[name]);}
   else{input.value=cfg[name]??"";if(type==="number"){input.min="0";input.step="any";}}
   wrap.appendChild(input);fields.appendChild(wrap);
 });
 const modal=document.getElementById("ruleModal");modal.classList.add("open");modal.setAttribute("aria-hidden","false");
}
function closeRuleEditor(){const modal=document.getElementById("ruleModal");modal.classList.remove("open");modal.setAttribute("aria-hidden","true");editingRule=null;}
document.querySelectorAll("[data-rule-edit]").forEach(b=>b.addEventListener("click",()=>openRuleEditor(b.dataset.ruleEdit)));
document.getElementById("closeRuleModal").addEventListener("click",closeRuleEditor);
document.getElementById("cancelRuleEdit").addEventListener("click",closeRuleEditor);
document.getElementById("ruleModal").addEventListener("click",e=>{if(e.target.id==="ruleModal")closeRuleEditor();});
document.getElementById("ruleForm").addEventListener("submit",e=>{
 e.preventDefault();if(!editingRule)return;
 const form=new FormData(e.currentTarget);const updated={...ruleConfig[editingRule]};
 for(const [key,label,type] of ruleSchemas[editingRule]){
   const el=e.currentTarget.elements.namedItem(key);
   updated[key]=type==="checkbox"?el.checked:type==="number"?Number(el.value):el.value.trim();
 }
 if(!updated.name){showToast("Please enter a rule name");return;}
 if(Object.values(updated).some(v=>typeof v==="number"&&(!Number.isFinite(v)||v<0))){showToast("Enter valid non-negative limits");return;}
 ruleConfig[editingRule]=updated;saveRuleConfig();renderRuleSettings();closeRuleEditor();showToast("Rule changes saved");
});
function renderRuleSettings(){
 const smart=ruleConfig.smart,peak=ruleConfig.peak,areas=ruleConfig.areas,ex=ruleConfig.exclusive;
 const cards=[["smart",smart,[smart.minPayout+"₹ minimum","Pickup ≤ "+smart.maxDistance+" km","ETA ≤ "+smart.maxEta+" min",smart.preferredOnly?"Preferred areas only":"Any area"]],
 ["peak",peak,[peak.start+"–"+peak.end,peak.minPayout+"₹ minimum","Pickup ≤ "+peak.maxDistance+" km"]],
 ["areas",areas,areas.areas.split(",").map(s=>s.trim()).filter(Boolean)]];
 const containers=document.querySelectorAll("#view-automations .automation-card");
 const cardIndexes=[1,2,3];
 cards.forEach(([key,cfg,conditions],i)=>{
  const card=containers[cardIndexes[i]];if(!card)return;
  const title=card.querySelector("h3");if(title)title.textContent=cfg.name;
  const tags=card.querySelectorAll(".conditions span");tags.forEach((el,n)=>{el.textContent=conditions[n]||"";el.hidden=!conditions[n];});
  const tag=card.querySelector(".live-tag,.draft-tag");if(tag){tag.textContent=cfg.enabled?"LIVE":"PAUSED";tag.className=cfg.enabled?"live-tag":"draft-tag";}
  const sw=card.querySelector(".rule-switch");if(sw)sw.classList.toggle("on",Boolean(cfg.enabled));
 });
 const core=containers[0];if(core){core.querySelector("h3").textContent=ex.name;const tags=core.querySelectorAll(".conditions span");if(tags[1])tags[1].textContent="Release window = "+ex.releaseMinutes+" min";}
 document.querySelectorAll("#view-overview .rule-list .rule").forEach((el,i)=>{
   const cfg=[smart,smart,smart][i];const small=el.querySelector("small");
   if(i===0)small.textContent="Accept only ₹"+smart.minPayout+" or more";
   if(i===1)small.textContent="Pickup under "+smart.maxDistance+" km";
   if(i===2)small.textContent="Estimated time under "+smart.maxEta+" min";
 });
}

renderRuleSettings();

document.querySelectorAll("[data-rule-toggle]").forEach(sw=>sw.addEventListener("click",()=>{
 const key=sw.dataset.ruleToggle;ruleConfig[key].enabled=sw.classList.contains("on");saveRuleConfig();renderRuleSettings();
}));
