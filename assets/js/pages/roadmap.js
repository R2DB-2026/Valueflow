(function(){
const {h,$,$$,reduce}=Core;
const V=VF, G=$('#gantt');
const TH=['เฟส 0 · จัดแนวร่วม','เฟส 1 · นำร่อง','เฟส 2 · ขยายผล','เฟส 2 · ขยายผล','เฟส 3 · ผู้นำภูมิภาค'];
const LV=['ยังไม่เริ่ม','เริ่มต้น','ตั้งต้นใช้งาน','โตต่อเนื่อง','ระดับภูมิภาค'];
const LENS=[['revenue','รายได้'],['talent','บุคลากร'],['ip','ทรัพย์สินทางปัญญา'],['events','กิจกรรม']];
let p=0, phase=0, selMs=null, playing=false, raf=null;

/* ---------- build gantt ---------- */
G.append(h('div',{class:'g-head'},h('div',null,'สายงาน'),...V.phases.map((ph,i)=>h('div',{style:{background:'var('+ph.col+')'}},TH[i],h('small',null,ph.range)))));

const markers=V.milestones.map((m,i)=>{
  const b=h('button',{type:'button',class:'mk',style:{left:(m.at*100)+'%'},'aria-label':m.id+' '+m.title,onclick:()=>{ stop(); setP(m.at); select(i); }},h('i'),h('span',null,m.id));
  return b;
});
G.append(h('div',{class:'g-ms'},h('div',{class:'lab'},'หมุดหมาย'),h('div',{class:'track'},markers)));

const barEls=[];
V.workstreams.forEach((name,w)=>{
  const row=h('div',{class:'g-row'},h('div',{class:'lab',style:{gridColumn:1,gridRow:1}},name));
  for(let c=0;c<5;c++) row.append(h('div',{class:'bg',style:{gridColumn:c+2}}));
  V.bars.filter(b=>b.ws===w).forEach(b=>{
    const el=h('div',{class:'bar future b'+b.from,style:{gridColumn:(b.from+2)+' / '+(b.to+3)}},b.t);
    barEls.push({b,el}); row.append(el);
  });
  G.append(row);
});
const head=h('div',{class:'playhead'}); G.append(head);

/* ---------- state ---------- */
const nowBox=$('#now'), msBox=$('#ms');
function renderNow(){
  const ph=V.phases[phase];
  nowBox.innerHTML='';
  const active=V.workstreams.map((w,i)=>{
    const b=V.bars.find(x=>x.ws===i&&x.from<=phase&&phase<=x.to); return b?[w,b.t]:null; }).filter(Boolean);
  nowBox.append(
    h('h2',null,TH[phase]),h('p',{class:'rng'},ph.range),
    h('h3',{style:{fontSize:'.95rem',color:'#9DB1E0'}},'สายงานที่กำลังทำงาน'),
    h('ul',null,active.map(([w,t])=>h('li',null,h('b',null,w+': '),t))),
    h('div',{class:'meters'},
      h('h3',{style:{fontSize:'.95rem',color:'#9DB1E0'}},'คุณค่าที่ปลดล็อกแล้ว (เชิงคุณภาพ)'),
      ...LENS.map(([k,n])=>{
        const lv=V.unlock[k][phase];
        return h('div',{class:'meter'},
          h('span',null,n),
          h('div',{class:'sg',style:{'--c':'var(--c-'+k+'-lt)'}},[0,1,2,3].map(i=>h('i',{class:lv>=i+1?'on':null}))),
          h('small',null,LV[lv]));
      })));
}
function select(i){
  selMs=i; msBox.innerHTML=''; msBox.style.setProperty('--accent','var(--red)');
  markers.forEach((m,k)=>m.classList.toggle('sel',k===i));
  if(i===null){
    msBox.append(h('h3',null,'หมุดหมาย'),h('p',{class:'muted'},'คลิกเพชรบนแถบหมุดหมายเพื่อข้ามไปยังช่วงนั้น หรือกดเล่นแล้วดูรายละเอียดเปลี่ยนตามเวลา'));
    return;
  }
  const m=V.milestones[i];
  msBox.append(h('h3',null,m.id+' · '+m.title),h('p',{class:'muted small'},m.when),
    h('h4',null,'ผลลัพธ์ที่ตรวจสอบได้'),h('ul',null,m.out.map(x=>h('li',null,x))),
    h('h4',null,'เกณฑ์ไปต่อ (Stage Gate)'),h('div',{class:'gate'},m.gate));
  msBox.classList.remove('swap'); void msBox.offsetWidth; msBox.classList.add('swap');
}
function setP(v){
  p=Math.max(0,Math.min(1,v));
  G.style.setProperty('--p',p);
  $('#scrub').value=Math.round(p*1000);
  const np=Math.min(4,Math.floor(p*5));
  if(np!==phase||!barEls[0].el.dataset.ready){
    phase=np; renderNow();
    barEls.forEach(({b,el})=>{
      el.dataset.ready='1';
      el.classList.remove('future','done','active');
      el.classList.add(b.to<phase?'done':(b.from<=phase?'active':'future'));
    });
  }
  let last=-1;
  V.milestones.forEach((m,i)=>{ const r=m.at<=p+0.0001; markers[i].classList.toggle('reached',r); if(r) last=i; });
  if(playing && last>=0 && last!==selMs) select(last);
}

/* ---------- play ---------- */
function stop(){ playing=false; if(raf) cancelAnimationFrame(raf); raf=null; const b=$('#play'); b.textContent='เล่น'; b.setAttribute('aria-pressed','false'); }
function play(){
  if(reduce){ setP(1); select(V.milestones.length-1); return; }
  if(p>=0.999) setP(0);
  playing=true; const b=$('#play'); b.textContent='หยุด'; b.setAttribute('aria-pressed','true');
  let prev=performance.now();
  (function step(now){
    const dt=(now-prev)/1000; prev=now; setP(p+dt/20);
    if(p<1&&playing) raf=requestAnimationFrame(step); else stop();
  })(prev);
}
$('#play').addEventListener('click',()=>playing?stop():play());
$('#reset').addEventListener('click',()=>{ stop(); setP(0); select(null); });
$('#scrub').addEventListener('input',e=>{ stop(); setP(+e.target.value/1000); });

setP(0); select(null);
})();
