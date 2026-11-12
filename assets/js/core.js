/* core.js — เครื่องมือกลาง: สร้าง DOM/SVG, ระบบอนุภาคไหลตามเส้น, tween, header/footer */
(function(){
'use strict';
const NS='http://www.w3.org/2000/svg';
const SVG_TAGS=new Set(['svg','g','path','circle','rect','line','text','tspan','defs','marker','polygon','ellipse','linearGradient','radialGradient','stop','clipPath','title','polyline']);
const reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

const $ = (s,r=document)=>r.querySelector(s);
const $$ = (s,r=document)=>Array.from(r.querySelectorAll(s));

/* h('div',{class:'x',onclick:fn},child...) สร้าง HTML หรือ SVG */
function h(tag,attrs,...kids){
  const e = SVG_TAGS.has(tag)? document.createElementNS(NS,tag) : document.createElement(tag);
  for(const [k,v] of Object.entries(attrs||{})){
    if(v===null||v===undefined||v===false) continue;
    if(k==='style' && typeof v==='object'){ for(const [sk,sv] of Object.entries(v)){ if(sk.startsWith('--')) e.style.setProperty(sk,sv); else e.style[sk]=sv; } }
    else if(k==='html') e.innerHTML=v;
    else if(k.startsWith('on') && typeof v==='function') e.addEventListener(k.slice(2),v);
    else e.setAttribute(k,v===true?'':v);
  }
  kids.flat(Infinity).forEach(c=>{ if(c===null||c===undefined||c===false) return; e.append(c.nodeType? c : document.createTextNode(c)); });
  return e;
}

/* ---------- tween ---------- */
function tween(ms,fn,done){
  if(reduce){ fn(1); if(done) done(); return; }
  const t0=performance.now();
  (function step(t){
    const k=Math.min(1,(t-t0)/ms), e=1-Math.pow(1-k,3);
    fn(e);
    if(k<1) requestAnimationFrame(step); else if(done) done();
  })(t0);
}
const lerp=(a,b,t)=>a+(b-a)*t;

/* ---------- Flow: อนุภาคไหลตามเส้นทาง SVG ---------- */
const Flow=(function(){
  const flows=[]; let raf=null,last=0;
  function draw(fl){
    if(!fl.len) fl.refresh();
    const L=fl.len; if(!L) return;
    for(const d of fl.dots){
      let pt; try{ pt=fl.path.getPointAtLength(d.p*L); }catch(e){ return; }
      d.c.setAttribute('cx',pt.x.toFixed(1)); d.c.setAttribute('cy',pt.y.toFixed(1));
    }
  }
  function tick(ts){
    const dt=Math.min(.05,(ts-last)/1000); last=ts;
    for(const fl of flows){
      if(!fl.o.active) continue;
      if(!fl.len){ fl.refresh(); continue; }
      const dp=fl.o.speed*dt/fl.len;
      for(const d of fl.dots) d.p=(d.p+dp)%1;
      draw(fl);
    }
    raf=requestAnimationFrame(tick);
  }
  function start(){
    if(reduce){ flows.forEach(draw); return; }
    if(!raf){ last=performance.now(); raf=requestAnimationFrame(tick); }
  }
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden){ cancelAnimationFrame(raf); raf=null; } else if(flows.length) start();
  });
  function add(path,opts){
    const o=Object.assign({n:3,r:3,speed:60,color:'#fff',opacity:.95,active:true,layer:null},opts||{});
    const layer=o.layer||path.ownerSVGElement;
    const dots=[];
    for(let i=0;i<o.n;i++){
      const c=document.createElementNS(NS,'circle');
      c.setAttribute('r',o.r); c.setAttribute('pointer-events','none');
      c.style.fill=o.color; c.style.opacity=0;
      layer.appendChild(c); dots.push({c,p:i/o.n});
    }
    const fl={path,o,dots,len:0,
      refresh(){ try{ fl.len=path.getTotalLength(); }catch(e){ fl.len=0; } },
      setActive(b){ o.active=b; dots.forEach(d=>d.c.style.opacity=b?o.opacity:0); if(b){ fl.refresh(); draw(fl); } },
      setColor(c){ o.color=c; dots.forEach(d=>d.c.style.fill=c); },
      setSpeed(s){ o.speed=s; },
      remove(){ dots.forEach(d=>d.c.remove()); const i=flows.indexOf(fl); if(i>=0) flows.splice(i,1); }
    };
    flows.push(fl); fl.refresh(); fl.setActive(o.active); start();
    return fl;
  }
  return {add,flows};
})();

/* ---------- lens helpers ---------- */
const lensVar=(id,lt)=>'var('+(window.VF.lenses[id]? (lt?window.VF.lenses[id].lt:window.VF.lenses[id].css) : '--navy')+')';
const typeVar=(t,lt)=>'var(--c-'+t+(lt?'-lt':'')+')';

/* ---------- header / footer ---------- */
function mountChrome(){
  const page=document.body.getAttribute('data-page')||'';
  const hd=document.getElementById('site-header');
  if(hd){
    hd.className='site-header';
    const links=window.VF.nav.map(([href,label])=>h('a',{href, 'aria-current': href.replace('.html','')===page?'page':null},label));
    const nav=h('nav',{class:'site-nav',id:'site-nav','aria-label':'เมนูหลัก'},links);
    const btn=h('button',{class:'menu-btn','aria-expanded':'false','aria-controls':'site-nav',onclick:()=>{
      const o=nav.classList.toggle('open'); btn.setAttribute('aria-expanded',o?'true':'false'); }},'เมนู');
    const icon=h('svg',{viewBox:'0 0 26 26','aria-hidden':'true'},
      h('circle',{cx:13,cy:13,r:12,fill:'none',stroke:'#FF8F86','stroke-width':1.6}),
      h('path',{d:'M4 17 C9 17 9 9 13 9 S17 17 22 17',fill:'none',stroke:'#fff','stroke-width':2,'stroke-linecap':'round'}),
      h('circle',{cx:22,cy:17,r:2,fill:'#6FD6A3'}));
    hd.append(h('div',{class:'wrap'},h('a',{class:'brand',href:'index.html'},icon,'Value Flow · VCAC 2026'),btn,nav));
  }
  const ft=document.getElementById('site-footer');
  if(ft){
    ft.className='site-footer';
    ft.append(h('div',{class:'wrap'},
      h('p',null,h('strong',null,'ข้อควรทราบ '),window.VF.disclaimer)));
  }
  document.title=(document.title? document.title+' · ':'')+'Value Flow VCAC 2026';
}
document.addEventListener('DOMContentLoaded',mountChrome);

window.Core={h,$,$$,reduce,tween,lerp,Flow,lensVar,typeVar,NS};
})();
