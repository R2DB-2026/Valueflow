(function(){
const {h,$,$$,Flow,tween,lerp}=Core;
const V=VF, S=V.streams, N=S.length;
const svg=$('#sk');

/* ---------- constants ---------- */
const X0=292, BW=14, XP=508, PW=22, XR=742;
const TOP=44, AVAIL=520, FLOW_H=300, MIN_SLOT=30, GAP_L=6, GAP_R=22;
const GREEN='var(--green-lt)', BLUE='var(--navy-lt)';

/* ---------- state ---------- */
const flags={}; S.forEach(s=>flags[s.id]=s.platform);
const zero={}; S.forEach(s=>zero[s.id]=0);
const cur={w:Object.assign({},zero),bs:35,sp:50};
const tgt={w:Object.assign({},V.presets.scale.w),bs:35,sp:50};
let ver=0;

/* ---------- build svg ---------- */
const ribLayer=h('g'), dotLayer=h('g',{'pointer-events':'none'}), nodeLayer=h('g');
svg.append(ribLayer,dotLayer,nodeLayer);
svg.append(h('text',{class:'colh',x:X0+BW,y:24,'text-anchor':'end'},'ช่องทางรายได้'),
           h('text',{class:'colh',x:XP+PW/2,y:24,'text-anchor':'middle'},'ก้อนรายได้รวม'),
           h('text',{class:'colh',x:XR,y:24},'ผู้รับ'));

const src=S.map((s,i)=>{
  const g=h('g',{tabindex:0,'aria-label':s.name});
  const bar=h('rect',{class:'nodebar',x:X0,width:BW,rx:2});
  const nm=h('text',{class:'nm',x:X0-10,'text-anchor':'end'},s.name);
  const vl=h('text',{class:'vl',x:X0-10,'text-anchor':'end'},'');
  g.append(bar,nm,vl); nodeLayer.append(g);
  const rib=h('path',{class:'rib'}); ribLayer.append(rib);
  const flow=Flow.add(rib,{n:3,r:2.5,speed:58,color:'#fff',opacity:.85,layer:dotLayer});
  const row=()=>$('#streamtable tbody tr:nth-child('+(i+1)+')');
  const on=b=>{ const r=row(); if(r) r.classList.toggle('hl',b); g.classList.toggle('hot',b); };
  g.addEventListener('mouseenter',()=>on(true)); g.addEventListener('mouseleave',()=>on(false));
  g.addEventListener('focus',()=>on(true)); g.addEventListener('blur',()=>on(false));
  return {s,g,bar,nm,vl,rib,flow};
});
const poolE=h('rect',{class:'nodebar',x:XP,width:PW,rx:2,style:{fill:GREEN}});
const poolR=h('rect',{class:'nodebar',x:XP,width:PW,rx:2,style:{fill:BLUE}});
nodeLayer.append(poolE,poolR);

const OUT=[
  {id:'D',name:'เจ้าของข้อมูลและโรงพยาบาล',col:GREEN},
  {id:'U',name:'มหาวิทยาลัยและนักวิจัย',col:GREEN},
  {id:'R',name:'ผู้พัฒนาและผู้ลงทุน',col:BLUE}
].map(o=>{
  const rib=h('path',{class:'rib'}); ribLayer.append(rib);
  const flow=Flow.add(rib,{n:3,r:2.5,speed:58,color:'#fff',opacity:.85,layer:dotLayer});
  const bar=h('rect',{class:'nodebar',x:XR,width:BW,rx:2,style:{fill:o.col}});
  const nm=h('text',{class:'nm',x:XR+BW+10},o.name);
  const vl=h('text',{class:'vl',x:XR+BW+10},'');
  nodeLayer.append(bar,nm,vl);
  return Object.assign(o,{rib,flow,bar,nm,vl});
});

/* ---------- compute + render ---------- */
function compute(c){
  const w=S.map(s=>Math.max(0,c.w[s.id]));
  const total=w.reduce((a,b)=>a+b,0);
  const elig=S.reduce((a,s,i)=>a+(flags[s.id]?w[i]:0),0);
  const B=elig*c.bs/100, D=B*c.sp/100, U=B-D, R=total-B;
  return {w,total,elig,B,D,U,R};
}
const fmt=n=>(Math.round(n*10)/10).toFixed(1);
const ribbon=(x0,y0,x1,y1)=>{ const xm=(x0+x1)/2; return `M ${x0} ${y0} C ${xm} ${y0}, ${xm} ${y1}, ${x1} ${y1}`; };

function render(){
  const m=compute(cur);
  const k=m.total>0? FLOW_H/m.total : 0;
  /* left stack */
  const slots=m.w.map(v=>Math.max(v*k,MIN_SLOT));
  const leftH=slots.reduce((a,b)=>a+b,0)+GAP_L*(N-1);
  let yL=TOP+(AVAIL-leftH)/2;
  const poolTop=TOP+(AVAIL-FLOW_H)/2;
  /* ลำดับในก้อนรวม: เข้าเกณฑ์ก่อน */
  const order=[...S.keys()].sort((a,b)=>(flags[S[b].id]?1:0)-(flags[S[a].id]?1:0)||a-b);
  const poolCenter={}; let py=poolTop;
  order.forEach(i=>{ const t=m.w[i]*k; poolCenter[i]=py+t/2; py+=t; });
  src.forEach((x,i)=>{
    const t=m.w[i]*k, yc=yL+slots[i]/2;
    x.bar.setAttribute('y',(yc-Math.max(t,3)/2).toFixed(1)); x.bar.setAttribute('height',Math.max(t,3).toFixed(1));
    x.bar.style.fill=flags[x.s.id]?GREEN:BLUE; x.bar.style.opacity=m.w[i]>0.05?1:.35;
    x.nm.setAttribute('y',(yc-2).toFixed(1)); x.vl.setAttribute('y',(yc+14).toFixed(1));
    x.nm.style.opacity=m.w[i]>0.05?1:.5;
    x.vl.textContent=fmt(m.w[i])+' หน่วย';
    x.rib.setAttribute('d',ribbon(X0+BW,yc,XP,poolCenter[i]));
    x.rib.style.stroke=flags[x.s.id]?GREEN:BLUE; x.rib.style.opacity=.5;
    x.rib.style.strokeWidth=Math.max(t,0.01).toFixed(2);
    x.flow.refresh(); x.flow.setActive(t>2);
    yL+=slots[i]+GAP_L;
  });
  /* pool */
  poolE.setAttribute('y',poolTop.toFixed(1)); poolE.setAttribute('height',(m.elig*k).toFixed(1));
  poolR.setAttribute('y',(poolTop+m.elig*k).toFixed(1)); poolR.setAttribute('height',((m.total-m.elig)*k).toFixed(1));
  /* right */
  const vals={D:m.D,U:m.U,R:m.R};
  const rs=OUT.map(o=>Math.max(vals[o.id]*k,MIN_SLOT));
  const rightH=rs.reduce((a,b)=>a+b,0)+GAP_R*(OUT.length-1);
  let yR=TOP+(AVAIL-rightH)/2, segTop=poolTop;
  OUT.forEach((o,i)=>{
    const t=vals[o.id]*k, yc=yR+rs[i]/2, segC=segTop+t/2;
    o.bar.setAttribute('y',(yc-Math.max(t,3)/2).toFixed(1)); o.bar.setAttribute('height',Math.max(t,3).toFixed(1));
    o.nm.setAttribute('y',(yc-2).toFixed(1)); o.vl.setAttribute('y',(yc+15).toFixed(1));
    o.vl.textContent=fmt(vals[o.id])+' หน่วย · '+(m.total>0?Math.round(vals[o.id]/m.total*100):0)+'%';
    o.rib.setAttribute('d',ribbon(XP+PW,segC,XR,yc));
    o.rib.style.stroke=o.col; o.rib.style.opacity=.5; o.rib.style.strokeWidth=Math.max(t,0.01).toFixed(2);
    o.flow.refresh(); o.flow.setActive(t>2);
    segTop+=t; yR+=rs[i]+GAP_R;
  });
}

/* ---------- animate to target ---------- */
function animate(ms){
  const from={w:Object.assign({},cur.w),bs:cur.bs,sp:cur.sp}; const my=++ver;
  tween(ms||500,e=>{
    if(my!==ver) return;
    S.forEach(s=>cur.w[s.id]=lerp(from.w[s.id],tgt.w[s.id],e));
    cur.bs=lerp(from.bs,tgt.bs,e); cur.sp=lerp(from.sp,tgt.sp,e);
    render();
  });
  readout();
}

/* ---------- read-out ---------- */
function readout(){
  const m=compute(tgt); const pct=n=>m.total>0?Math.round(n/m.total*100):0;
  const box=$('#read'); box.innerHTML='';
  const stat=(big,lab)=>h('div',null,h('b',{class:'big'},big),h('span',{class:'lab'},lab));
  box.append(
    stat(fmt(m.total),'รายได้รวมทุกช่องทาง (หน่วยสมมติ)'),
    stat(fmt(m.elig)+'  ('+pct(m.elig)+'%)','ส่วนที่ใช้ข้อมูลหรือ IP ของแพลตฟอร์ม จึงเข้าเกณฑ์แบ่งปัน'),
    stat(fmt(m.B)+'  ('+pct(m.B)+'%)','ส่วนแบ่งที่หมุนกลับสู่เจ้าของข้อมูลและงานวิจัย'));
  let msg;
  if(m.total===0) msg='ยังไม่มีรายได้ ลองเลือกสถานการณ์ตั้งต้นหรือเลื่อนแถบรายได้';
  else if(m.elig/m.total<0.4) msg='รายได้ส่วนใหญ่มาจากผลิตภัณฑ์ที่ไม่ผูกกับข้อมูลของแพลตฟอร์ม ส่วนแบ่งที่หมุนกลับจึงเป็นเพียง '+pct(m.B)+'% ของรายได้รวม ถ้าอยากให้งานวิจัยและเจ้าของข้อมูลมีทุนต่อเนื่อง ต้องเพิ่มสัดส่วนไลเซนส์ ค่าเข้าถึง และบริการวิจัยที่ใช้ข้อมูลกลาง';
  else msg='รายได้ส่วนใหญ่มาจากข้อมูลและ IP ของแพลตฟอร์ม ส่วนแบ่งที่หมุนกลับจึงสูงถึง '+pct(m.B)+'% ของรายได้รวม ซึ่งเป็นแรงจูงใจให้โรงพยาบาลส่งข้อมูล แต่ทำให้ความยินยอมของเจ้าของข้อมูลและความโปร่งใสของบัญชีสำคัญมากขึ้น';
  box.append(h('div',{class:'insight'},h('b',null,'ข้อสังเกตจากแบบจำลอง: '),msg));
}

/* ---------- controls ---------- */
const presets=$('#presets');
Object.entries(V.presets).forEach(([id,p])=>presets.append(h('button',{type:'button','data-id':id,'aria-pressed':id==='scale'?'true':'false',onclick:()=>{
  S.forEach(s=>{ tgt.w[s.id]=p.w[s.id]; const inp=$('#sl-'+s.id); inp.value=p.w[s.id]; $('#ov-'+s.id).textContent=p.w[s.id]; });
  $$('button',presets).forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===id?'true':'false'));
  animate(650);
}},h('i',{style:{background:'var(--green)'}}),p.name)));

const sl=$('#sliders');
S.forEach(s=>{
  const out=h('output',{id:'ov-'+s.id},String(tgt.w[s.id]));
  const input=h('input',{type:'range',id:'sl-'+s.id,min:0,max:50,step:1,value:tgt.w[s.id],'aria-label':s.name,style:{'--thumb':flags[s.id]?'var(--green)':'var(--blue)'},
    oninput:e=>{ tgt.w[s.id]=+e.target.value; out.textContent=e.target.value; $$('button',presets).forEach(b=>b.setAttribute('aria-pressed','false')); animate(350); }});
  const chk=h('input',{type:'checkbox',id:'ck-'+s.id,checked:s.platform?'checked':null,
    onchange:e=>{ flags[s.id]=e.target.checked; input.style.setProperty('--thumb',flags[s.id]?'var(--green)':'var(--blue)'); render(); readout(); }});
  sl.append(h('div',{class:'srow'},
    h('div',{class:'top'},h('label',{for:'sl-'+s.id},s.name),out),
    input,
    h('label',{class:'chk',for:'ck-'+s.id},chk,'ใช้ข้อมูลหรือ IP ของแพลตฟอร์ม (เข้าเกณฑ์แบ่งปัน)')));
});

$('#bs').addEventListener('input',e=>{ tgt.bs=+e.target.value; $('#bsv').textContent=tgt.bs+'%'; animate(300); });
$('#split').addEventListener('input',e=>{ tgt.sp=+e.target.value; $('#spv').textContent=tgt.sp+' : '+(100-tgt.sp); animate(300); });
$('#bsv').textContent=tgt.bs+'%'; $('#spv').textContent=tgt.sp+' : '+(100-tgt.sp);

/* ---------- table ---------- */
const tb=$('#streamtable tbody');
S.forEach(s=>tb.append(h('tr',null,h('td',null,s.name),h('td',null,s.payer),h('td',null,s.ex),h('td',null,s.src))));

render(); animate(1100);
})();
