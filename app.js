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
let activePlatform="Porter";
let cycle=0;
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
  document.getElementById("countdown").textContent="ACTIVE";
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
  ].filter(o=>o.payout>=120&&o.distance<=3&&o.eta<=35);
  const best=candidates.sort((a,b)=>(b.payout-(b.distance*4)-(b.eta*.3))-(a.payout-(a.distance*4)-(a.eta*.3)))[0];
  if(!best){notifyRider("No eligible offer","All offers failed your preferences.");return;}
  cycle++;
  lockFor(best.platform);
  notifyRider("Best offer auto-accepted",best.platform+" · ₹"+best.payout+" · "+best.distance+" km · "+best.eta+" min");
}

function resetLock(){
  remaining=0;
  const label=document.getElementById("lockLabel"),title=document.getElementById("lockTitle"),detail=document.getElementById("lockDetail"),count=document.getElementById("countdown");
  if(!label)return;
  activePlatform=null;
  label.textContent="READY FOR OFFERS"; title.textContent="All platforms live"; detail.textContent="The engine can compare incoming offers and select the best match."; count.textContent="—";
  renderPlatforms();
}
function setLockState(){
  const label=document.getElementById("lockLabel"),title=document.getElementById("lockTitle"),detail=document.getElementById("lockDetail"),count=document.getElementById("countdown");
  label.textContent="ORDER LOCK ACTIVE"; title.textContent=activePlatform+" accepted · other platforms paused"; detail.textContent="All connected platforms are temporarily paused to prevent overlapping orders."; count.textContent=formatTime(remaining);
  renderPlatforms();
}
function formatTime(sec){return "0"+Math.floor(sec/60)+":"+String(sec%60).padStart(2,"0");}
function startExclusiveDemo(){
  const enabled=document.getElementById("exclusiveToggle")?.classList.contains("on");
  if(!enabled){showToast("Enable Exclusive Order Lock first");return;}
  if(lockTimer)clearInterval(lockTimer);
  remaining=120;
  setLockState();
  lockFor("Porter");
  notifyRider("Order accepted automatically","Porter · other platforms paused");
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
document.getElementById("simulateCancel")?.addEventListener("click",()=>{
  if(lockTimer){clearInterval(lockTimer);lockTimer=null;}
  if(!activePlatform){notifyRider("No active delivery","Cancellation demo is available after an order is accepted.");return;}
  const cancelled=activePlatform;
  activePlatform=null;
  unlockAll();
  notifyRider("Order cancelled","The "+cancelled+" order was cancelled. Reopening platforms and finding the next best offer.");
  setTimeout(autoSelectBest,500);
});
document.getElementById("simulateFromRules")?.addEventListener("click",()=>{setView("overview");setTimeout(startExclusiveDemo,250)});

document.getElementById("newRule").addEventListener("click",()=>showToast("Rule builder is ready for the next integration step"));
document.querySelectorAll(".text-btn").forEach(b=>b.addEventListener("click",e=>{if(!e.currentTarget.dataset.viewTarget && e.currentTarget.id!=="simulateFromRules")showToast("Rule editor opened in demo mode")}));
document.querySelectorAll(".filter-btn").forEach(b=>b.addEventListener("click",()=>showToast("Filter options are available in the full app")));
