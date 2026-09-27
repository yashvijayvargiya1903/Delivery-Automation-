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
 smart:[["minPayout","Minimum payout","choice",["₹80","₹100","₹120","₹140","₹160","₹180","₹200"]],["maxDistance","Maximum pickup distance","choice",["1 km","2 km","3 km","4 km","5 km","6 km"]],["maxEta","Maximum delivery time","choice",["15 min","20 min","25 min","30 min","35 min","40 min","45 min","60 min"]],["preferredOnly","Preferred areas only","choice",["Yes","No"]]],
 peak:[["start","Start time","choice",["12:00","14:00","16:00","17:00","18:00","19:00","20:00"]],["end","End time","choice",["18:00","19:00","20:00","21:00","22:00","23:00","00:00"]],["minPayout","Minimum payout","choice",["₹100","₹120","₹140","₹160","₹180","₹200","₹250"]],["maxDistance","Maximum pickup distance","choice",["1 km","2 km","3 km","4 km","5 km","6 km"]]],
 areas:[["areas","Choose preferred areas","multi",["Adajan","Vesu","City Light","Athwa","Pal","Varachha","Katargam","Piplod","Udhna","Majura Gate"]]],
 exclusive:[["releaseMinutes","Reopen platforms before completion","choice",["1 min","2 min","3 min","4 min","5 min"]]]
};
let editingRule=null;
function openRuleEditor(key){
 if(!ruleSchemas[key])return;
 editingRule=key;const cfg=ruleConfig[key]||RULE_DEFAULTS[key];
 document.getElementById("ruleModalTitle").textContent="Edit "+cfg.name;
 const fields=document.getElementById("ruleFields");fields.innerHTML="";
 ruleSchemas[key].forEach(([name,label,type,options])=>{
   const wrap=document.createElement("label");wrap.className="rule-field"+(type==="multi"?" multi-field":"");
   const title=document.createElement("span");title.textContent=label;wrap.appendChild(title);
   if(type==="choice"){
     const select=document.createElement("select");select.name=name;
     options.forEach(option=>{const opt=document.createElement("option");opt.value=option;opt.textContent=option;select.appendChild(opt);});
     const current=String(cfg[name]);const match=[...select.options].find(o=>o.value===current||o.value.startsWith(current+" ")||o.value.replace(/[^0-9.]/g,"")===current);
     if(match)select.value=match.value;
     wrap.appendChild(select);
   } else if(type==="multi"){
     const selected=String(cfg[name]||"").split(",").map(s=>s.trim()).filter(Boolean);
     options.forEach(option=>{
       const item=document.createElement("label");item.className="area-chip";
       const input=document.createElement("input");input.type="checkbox";input.name=name;input.value=option;input.checked=selected.includes(option);
       const text=document.createElement("span");text.textContent=option;item.append(input,text);wrap.appendChild(item);
     });
   }
   fields.appendChild(wrap);
 });
 document.getElementById("ruleModal").classList.add("open");
 document.getElementById("ruleModal").setAttribute("aria-hidden","false");
}
function closeRuleEditor(){
 const modal=document.getElementById("ruleModal");
 modal.classList.remove("open");modal.setAttribute("aria-hidden","true");
 editingRule=null;
}
document.getElementById("closeRuleModal").addEventListener("click",closeRuleEditor);
document.getElementById("cancelRuleEdit").addEventListener("click",closeRuleEditor);
document.getElementById("ruleModal").addEventListener("click",e=>{if(e.target.id==="ruleModal")closeRuleEditor();});
document.getElementById("ruleForm").addEventListener("submit",e=>{
 e.preventDefault();
 if(!editingRule)return;
 const updated={...ruleConfig[editingRule]};
 for(const [name,label,type] of ruleSchemas[editingRule]){
   if(type==="choice"){
     const value=e.currentTarget.elements.namedItem(name).value;
     updated[name]=name==="preferredOnly"?value==="Yes":(Number(value.replace(/[^0-9.]/g,""))||value);
   }else if(type==="multi"){
     updated[name]=[...e.currentTarget.querySelectorAll('input[name="'+name+'"]:checked')].map(el=>el.value).join(", ");
   }
 }
 ruleConfig[editingRule]={...updated};
 saveRuleConfig();
 closeRuleEditor();
 showToast("Rule settings saved");
});
document.querySelectorAll("[data-rule-edit]").forEach(b=>b.addEventListener("click",()=>openRuleEditor(b.dataset.ruleEdit)));
document.querySelectorAll("[data-rule-toggle]").forEach(b=>b.addEventListener("click",()=>{
 b.classList.toggle("on");
 showToast(b.classList.contains("on")?"Rule enabled":"Rule paused");
}));
document.getElementById("ruleModal").addEventListener("keydown",e=>{if(e.key==="Escape")closeRuleEditor();});
