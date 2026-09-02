/* Deauville 2026 · V2.1 UX layer */
(function(){
  const WISH_KEY="deauville2026-wishlist-v200";

  function canonical(title){
    const raw=String(title||"");
    return (window.DATA?.aliases||{})[raw]||raw;
  }
  function norm(s){
    return String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[’']/g,"'").replace(/[^a-z0-9]+/g," ").trim();
  }
  function save(){localStorage.setItem(WISH_KEY,JSON.stringify(window.wishes||[]))}

  /* Keep the session sheet open when adding/removing a film from Envies. */
  window.toggleWish=function(title){
    const c=canonical(title);
    const current=Array.isArray(window.wishes)?window.wishes:[];
    const wanted=norm(c);
    if(current.some(x=>norm(x)===wanted)) window.wishes=current.filter(x=>norm(x)!==wanted);
    else window.wishes=[...current,c];
    save();
    const wishedNow=window.wishes.some(x=>norm(x)===wanted);
    document.querySelectorAll(".wishBtn").forEach(b=>{
      b.textContent=wishedNow?"♥ Retirer de mes envies":"♡ Ajouter à mes envies";
    });
  };

  function enhance(){
    /* Navigation belongs only to the fixed bottom bar. */
    document.querySelectorAll(".exploreSwitch").forEach(el=>el.style.display="none");

    /* Clear button in the Explorer search field. */
    const wrap=document.querySelector(".searchWrap");
    const input=document.getElementById("search");
    if(wrap&&input&&!wrap.querySelector(".searchClear")){
      const clear=document.createElement("button");
      clear.type="button";
      clear.className="searchClear";
      clear.setAttribute("aria-label","Effacer la recherche");
      clear.textContent="×";
      clear.onclick=function(){
        window.filters.search="";
        if(typeof window.render==="function") window.render();
      };
      wrap.appendChild(clear);
      const sync=()=>clear.style.display=input.value?"flex":"none";
      sync();
      input.addEventListener("input",sync);
    }

    /* Make it explicit that the action concerns one session, not the film. */
    document.querySelectorAll(".sheet .btn.primary").forEach(b=>{
      const t=b.textContent.trim();
      if(t==="Ajouter à mon planning") b.textContent="Ajouter cette séance à mon planning";
      if(t==="Ajouter quand même à mon planning") b.textContent="Ajouter cette séance quand même à mon planning";
    });
  }

  const style=document.createElement("style");
  style.textContent=`
    .searchWrap{position:relative}
    .searchWrap input{padding-right:42px}
    .searchClear{position:absolute;right:8px;top:50%;transform:translateY(-50%);width:30px;height:30px;border:0;border-radius:50%;background:transparent;color:inherit;font-size:24px;line-height:1;align-items:center;justify-content:center;cursor:pointer;opacity:.65}
    .searchClear:hover{opacity:1}
  `;
  document.head.appendChild(style);

  const observer=new MutationObserver(enhance);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState!=="loading") enhance();
  else document.addEventListener("DOMContentLoaded",enhance);
})();
