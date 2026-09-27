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
function resetLock(){
  remaining=0;
  const label=document.getElementById("lockLabel"),title=document.getElementById("lockTitle"),detail=document.getElementById("lockDetail"),count=document.getElementById("countdown");
  if(!label)return;
  label.textContent="READY FOR OFFERS"; title.textContent="All platforms live"; detail.textContent="The engine can compare incoming offers and select the best match."; count.textContent="—";
  document.querySelectorAll(".platform-pill").forEach(p=>p.classList.remove("locked"));
}
function setLockState(){
  const label=document.getElementById("lockLabel"),title=document.getElementById("lockTitle"),detail=document.getElementById("lockDetail"),count=document.getElementById("countdown");
  label.textContent="ORDER LOCK ACTIVE"; title.textContent="Porter accepted · other platforms paused"; detail.textContent="All connected platforms are temporarily off to prevent overlapping orders."; count.textContent=formatTime(remaining);
  document.querySelectorAll(".platform-pill").forEach(p=>p.classList.add("locked"));
  const porter=[...document.querySelectorAll(".platform-pill")].find(p=>p.textContent.includes("Porter"));
  if(porter) porter.classList.remove("locked");
}
function formatTime(sec){return "0"+Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");}
function startExclusiveDemo(){
  const enabled=document.getElementById("exclusiveToggle")?.classList.contains("on");
  if(!enabled){showToast("Enable Exclusive Order Lock first");return;}
  if(lockTimer)clearInterval(lockTimer);
  remaining=120;
  setLockState();
  showToast("Porter order accepted · all other apps paused");
  lockTimer=setInterval(()=>{
    remaining--;
    if(remaining>0){
      setLockState();
      if(remaining===10)showToast("Release window opens in 10 seconds");
      return;
    }
    clearInterval(lockTimer);lockTimer=null;
    document.getElementById("lockLabel").textContent="RELEASE WINDOW";
    document.getElementById("lockTitle").textContent="All platforms live again";
    document.getElementById("lockDetail").textContent="Comparing new offers… best eligible order will be accepted automatically.";
    document.getElementById("countdown").textContent="LIVE";
    document.querySelectorAll(".platform-pill").forEach(p=>p.classList.remove("locked"));
    showToast("Platforms reopened · best eligible offer selected");
    setTimeout(()=>showToast("Demo: highest-scoring eligible offer auto-accepted"),900);
  },1000);
}
document.getElementById("simulateOrder")?.addEventListener("click",startExclusiveDemo);
document.getElementById("simulateFromRules")?.addEventListener("click",()=>{setView("overview");setTimeout(startExclusiveDemo,250)});

document.getElementById("newRule").addEventListener("click",()=>showToast("Rule builder is ready for the next integration step"));
document.querySelectorAll(".text-btn").forEach(b=>b.addEventListener("click",e=>{if(!e.currentTarget.dataset.viewTarget && e.currentTarget.id!=="simulateFromRules")showToast("Rule editor opened in demo mode")}));
document.querySelectorAll(".filter-btn").forEach(b=>b.addEventListener("click",()=>showToast("Filter options are available in the full app")));
