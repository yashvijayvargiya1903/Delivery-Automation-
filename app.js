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
  if(sw.id==="engineToggle"){const running=sw.classList.contains("on");document.getElementById("engineText").textContent=running?"Running smoothly":"Automation paused";showToast(running?"Automation engine resumed":"Automation engine paused")}
  else showToast(sw.classList.contains("on")?"Setting enabled":"Setting disabled");
}));
document.getElementById("newRule").addEventListener("click",()=>showToast("Rule builder is ready for the next integration step"));
document.querySelectorAll(".text-btn").forEach(b=>b.addEventListener("click",e=>{if(!e.currentTarget.dataset.viewTarget)showToast("Rule editor opened in demo mode")}));
document.querySelectorAll(".filter-btn").forEach(b=>b.addEventListener("click",()=>showToast("Filter options are available in the full app")));
