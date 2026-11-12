(function(){
const {h,$,$$,Flow}=Core;
const V=VF;
const svg=$('#net'), side=$('#side');
const CX=380, CY=320, R=250;
const ORDER=['H','U','S','G','A'];
const SUBS={H:'มหาวิทยาลัย เอกชน เครือข่าย', U:'นักวิจัย ห้องแล็บ นิสิต', S:'ยา อาหารสัตว์ เครื่องมือ', G:'อว. สอวช. BOI NIA', A:'สภา สมาคมเฉพาะทาง'};
const TYPES=Object.keys(V.edgeTypes);

/* ---------- geometry ---------- */
const pos={P:{x:CX,y:CY,circle:true,r:62}};
ORDER.forEach((id,i)=>{ const a=(-90+72*i)*Math.PI/180; pos[id]={x:CX+R*Math.cos(a),y:CY+R*Math.sin(a),w:164,h:54}; });

function boundary(n,ux,uy,pad){
  if(n.circle) return {x:n.x+ux*(n.r+pad), y:n.y+uy*(n.r+pad)};
  const t=Math.min((n.w/2)/Math.max(Math.abs(ux),1e-6),(n.h/2)/Math.max(Math.abs(uy),1e-6));
  return {x:n.x+ux*(t+pad), y:n.y+uy*(t+pad)};
}
function edgePath(e){
  const a=pos[e.f], b=pos[e.t];
  const dx=b.x-a.x, dy=b.y-a.y, L=Math.hypot(dx,dy), ux=dx/L, uy=dy/L, nx=-uy, ny=ux;
  const sign=e.f<e.t?1:-1;
  const viaP=(e.f==='P'||e.t==='P');
  const off=viaP?15:26, shift=viaP?9:11;
  const s0=boundary(a,ux,uy,3), e0=boundary(b,-ux,-uy,9);
  const sx=s0.x+nx*sign*shift, sy=s0.y+ny*sign*shift, ex=e0.x+nx*sign*shift, ey=e0.y+ny*sign*shift;
  const cx=(sx+ex)/2+nx*sign*off*1.6, cy=(sy+ey)/2+ny*sign*off*1.6;
  return `M ${sx.toFixed(1)} ${sy.toFixed(1)} Q ${cx.toFixed(1)} ${cy.toFixed(1)} ${ex.toFixed(1)} ${ey.toFixed(1)}`;
}

/* ---------- defs: arrowheads ---------- */
const defs=h('defs');
TYPES.forEach(t=>defs.append(h('marker',{id:'m-'+t,viewBox:'0 0 10 10',refX:8,refY:5,markerWidth:6.5,markerHeight:6.5,orient:'auto'},
  h('path',{d:'M0 0 L10 5 L0 10 z',style:{fill:Core.typeVar(t,true)}}))));
svg.append(defs);

/* ---------- edges ---------- */
const edgeLayer=h('g'), nodeLayer=h('g'), dotLayer=h('g',{'pointer-events':'none'});
svg.append(edgeLayer,dotLayer,nodeLayer);
const edges=V.edges.map((e,i)=>{
  const d=edgePath(e);
  const path=h('path',{class:'edge',d,'marker-end':'url(#m-'+e.type+')',style:{stroke:Core.typeVar(e.type,true),opacity:.5}});
  const hit=h('path',{class:'hit',d});
  hit.append(h('title',null,V.nodes[e.f].short+' → '+V.nodes[e.t].short+': '+e.label));
  edgeLayer.append(path,hit);
  const flow=Flow.add(path,{n:2,r:2.8,speed:52,color:Core.typeVar(e.type,true),layer:dotLayer});
  hit.addEventListener('mouseenter',()=>hover(i,true));
  hit.addEventListener('mouseleave',()=>hover(i,false));
  hit.addEventListener('click',(ev)=>{ ev.stopPropagation(); select(sel===e.f?e.t:e.f); });
  return {e,path,hit,flow,i};
});

/* ---------- nodes ---------- */
const pulse=h('circle',{class:'pulse',cx:CX,cy:CY,r:66});
nodeLayer.append(pulse);
const nodeEls={};
function mkNode(id){
  const n=pos[id], d=V.nodes[id];
  let g;
  if(id==='P'){
    g=h('g',{class:'node',tabindex:0,role:'button','aria-label':d.label,transform:`translate(${n.x} ${n.y})`},
      h('circle',{class:'body',r:n.r}),
      h('text',{class:'core','text-anchor':'middle',y:-18},'แพลตฟอร์ม'),
      h('text',{class:'core','text-anchor':'middle',y:0},'Veterinary'),
      h('text',{class:'core','text-anchor':'middle',y:18},'Discovery'),
      h('text',{class:'coresub','text-anchor':'middle',y:38},'AI + One Health'));
  } else {
    g=h('g',{class:'node',tabindex:0,role:'button','aria-label':d.label,transform:`translate(${n.x} ${n.y})`},
      h('rect',{x:-n.w/2,y:-n.h/2,width:n.w,height:n.h,rx:8}),
      h('text',{class:'nm','text-anchor':'middle',y:-3},d.short),
      h('text',{class:'sb','text-anchor':'middle',y:15},SUBS[id]));
  }
  g.addEventListener('click',ev=>{ ev.stopPropagation(); select(sel===id?null:id); });
  g.addEventListener('keydown',ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); select(sel===id?null:id); } if(ev.key==='Escape') select(null); });
  nodeLayer.append(g); nodeEls[id]=g;
}
['P',...ORDER].forEach(mkNode);
svg.addEventListener('click',()=>select(null));

/* ---------- state ---------- */
let sel=null, filt='all';
function apply(){
  edges.forEach(x=>{
    const typeOk=filt==='all'||x.e.type===filt;
    const nodeOk=!sel||x.e.f===sel||x.e.t===sel;
    const active=typeOk&&nodeOk;
    x.path.style.opacity= active? (sel?1:.55) : .07;
    x.path.style.strokeWidth= active&&sel? 2.8 : 1.9;
    x.flow.setActive(active);
  });
  Object.entries(nodeEls).forEach(([id,g])=>g.classList.toggle('sel',id===sel));
  renderSide();
}
function select(id){ sel=id; apply(); }
function hover(i,on){
  const x=edges[i];
  x.path.style.strokeWidth=on?3.4:(sel?2.8:1.9);
  const li=$('[data-edge="'+i+'"]',side); if(li) li.classList.toggle('hl',on);
}

/* ---------- side panel ---------- */
function tag(t){ return h('span',{class:'tag '+t},V.edgeTypes[t]); }
function ul(arr){ return h('ul',null,arr.map(s=>h('li',null,s))); }
function renderSide(){
  side.innerHTML='';
  if(!sel){
    side.style.setProperty('--accent','var(--navy)');
    side.append(h('h3',null,'เลือกผู้เล่นเพื่อดูรายละเอียด'),
      h('p',{class:'muted'},'ทุกเส้นคือสิ่งที่ผู้เล่นฝ่ายหนึ่งส่งให้อีกฝ่าย จุดที่วิ่งบนเส้นแสดงทิศทาง'),
      h('div',{class:'legend'},TYPES.map(t=>{
        const n=V.edges.filter(e=>e.type===t).length;
        return h('div',null,h('i',{style:{background:Core.typeVar(t)}}),V.edgeTypes[t]+' ('+n+' เส้น)');
      })));
    return;
  }
  const d=V.nodes[sel];
  side.style.setProperty('--accent', sel==='P'?'var(--red)':'var(--navy)');
  const out=edges.filter(x=>x.e.f===sel&&(filt==='all'||x.e.type===filt));
  const inn=edges.filter(x=>x.e.t===sel&&(filt==='all'||x.e.type===filt));
  const li=(x,dirTxt)=>h('li',{'data-edge':x.i,onmouseenter:()=>hover(x.i,true),onmouseleave:()=>hover(x.i,false)},
    h('span',{class:'dir'},dirTxt),tag(x.e.type),x.e.label);
  side.append(
    h('h3',null,d.label),
    h('p',{class:'muted small'},d.sub),
    h('h4',null,'ให้อะไร'),ul(d.gives),
    h('h4',null,'ได้อะไร'),ul(d.gets),
    h('h4',null,'ขอในช่วง 90 วันแรก'),ul(d.ask),
    h('h4',null,'ส่งออก ('+out.length+')'),
    h('ul',{class:'flows'},out.map(x=>li(x,'ไปยัง '+V.nodes[x.e.t].short))),
    h('h4',null,'รับเข้า ('+inn.length+')'),
    h('ul',{class:'flows'},inn.map(x=>li(x,'จาก '+V.nodes[x.e.f].short))));
}

/* ---------- type filter ---------- */
const bar=$('#types');
[['all','ทั้งหมด','--navy'],...TYPES.map(t=>[t,V.edgeTypes[t],'--c-'+t])].forEach(([id,label,c])=>{
  bar.append(h('button',{type:'button','data-id':id,'aria-pressed':id==='all'?'true':'false',style:{'--dot':'var('+c+')'},
    onclick:()=>{ filt=id; $$('button',bar).forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===id?'true':'false')); apply(); }},
    h('i'),label));
});

apply();
})();
