(function(){
const {h,$,$$,Flow}=Core;
const V=VF;
const VL={revenue:'รายได้',talent:'บุคลากร',ip:'ทรัพย์สินทางปัญญา',trust:'ความร่วมมือและมาตรฐาน'};
const KEYS=Object.keys(VL);
const EV=V.events.map((e,i)=>Object.assign({idx:i},e)).sort((a,b)=>Math.min(...a.ph)-Math.min(...b.ph)||a.idx-b.idx);
const dom=e=>KEYS.reduce((best,k)=>e.w[k]>e.w[best]?k:best,KEYS[0]);
const total=e=>KEYS.reduce((s,k)=>s+e.w[k],0);
let view='wheel', lens='all', aud='all', sel=null;

/* ---------- filters ---------- */
function seg(id,items,get,set){
  const box=$(id);
  items.forEach(([key,label,col])=>box.append(h('button',{type:'button','data-k':key,'aria-pressed':key===get()?'true':'false',style:col?{'--dot':'var('+col+')'}:null,
    onclick:()=>{ set(key); $$('button',box).forEach(b=>b.setAttribute('aria-pressed',b.dataset.k===key?'true':'false')); update(); }},col?h('i'):null,label)));
}
seg('#view',[['wheel','วงล้อ'],['time','ไทม์ไลน์']],()=>view,k=>{ view=k; $('#wheelbox').hidden=k!=='wheel'; $('#timeline').hidden=k!=='time'; });
seg('#lens',[['all','ทุกมุมมอง','--navy'],...KEYS.map(k=>[k,VL[k],'--c-'+k])],()=>lens,k=>lens=k);
seg('#aud',[['all','ทุกฝ่าย'],...Object.entries(V.audiences)],()=>aud,k=>aud=k);

const match=e=>(lens==='all'||e.w[lens]>=2)&&(aud==='all'||e.aud.includes(aud));

/* ---------- wheel ---------- */
const svg=$('#wheel'), CX=450, CY=320, R=205, N=EV.length;
const ringD=`M ${CX+R} ${CY} A ${R} ${R} 0 1 1 ${CX-R} ${CY} A ${R} ${R} 0 1 1 ${CX+R} ${CY}`;
const ring=h('path',{class:'ringline',d:ringD});
svg.append(ring);
const hubH2=h('text',{class:'h2',x:CX,y:CY+22},'');
svg.append(h('g',{class:'hub'},h('text',{class:'h1',x:CX,y:CY-4},'วงล้อกิจกรรม'),hubH2));
function wrap(s,max){
  const words=s.split(' '), lines=[]; let cur='';
  words.forEach(w=>{ if((cur+' '+w).trim().length>max && cur){ lines.push(cur); cur=w; } else cur=(cur+' '+w).trim(); });
  if(cur) lines.push(cur); return lines;
}
const wheelEls=EV.map((e,i)=>{
  const a=(-90+360/N*i)*Math.PI/180, x=CX+R*Math.cos(a), y=CY+R*Math.sin(a);
  const r=15+total(e)*1.4, c=Math.cos(a), s=Math.sin(a);
  const anchor=c>0.25?'start':(c<-0.25?'end':'middle');
  const lx=CX+(R+r+12)*c, ly=CY+(R+r+12)*s;
  const lines=wrap(e.name,18);
  const t=h('text',{class:'l','text-anchor':anchor,x:lx.toFixed(1),y:(ly+(s>0.7?12:(s<-0.7?-6*lines.length:0))-(lines.length>1&&Math.abs(s)<0.7?8:0)).toFixed(1)});
  lines.forEach((ln,k)=>t.append(h('tspan',{x:lx.toFixed(1),dy:k?19:0},ln)));
  const g=h('g',{class:'ev',tabindex:0,role:'button','aria-label':e.name},
    h('circle',{class:'b',cx:x.toFixed(1),cy:y.toFixed(1),r:r,style:{fill:'var(--c-'+dom(e)+')'}}),t);
  g.querySelector('circle').style.fill='var(--c-'+dom(e)+'-lt)';
  g.addEventListener('click',()=>choose(sel===e.id?null:e.id));
  g.addEventListener('keydown',ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); choose(sel===e.id?null:e.id); } });
  svg.append(g); return g;
});
Flow.add(ring,{n:9,r:3.2,speed:70,color:'var(--red-lt)',layer:svg});

/* ---------- timeline ---------- */
const tl=$('#timeline');
const TH=['เฟส 0','เฟส 1','เฟส 2','เฟส 2','เฟส 3'];
const head=h('div',{class:'tl-head'},h('div',null,'กิจกรรม'),...V.phases.map((p,i)=>h('div',{style:{background:'var('+p.col+')'}},TH[i],h('small',null,p.range))));
tl.append(head);
const rows=EV.map(e=>{
  const r=h('div',{class:'tl-row',tabindex:0,role:'button','aria-label':e.name},
    h('div',{class:'nm'},e.name,h('small',null,e.sub)),
    ...V.phases.map((p,i)=>h('div',{class:'cell'},e.ph.includes(i)?h('i',{style:{'--bc':'var(--c-'+dom(e)+')'}}):null)));
  r.addEventListener('click',()=>choose(sel===e.id?null:e.id));
  r.addEventListener('keydown',ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); choose(sel===e.id?null:e.id); } });
  tl.append(r); return r;
});

/* ---------- state ---------- */
function choose(id){ sel=id; update(); }
function update(){
  let n=0;
  EV.forEach((e,i)=>{
    const m=match(e); if(m) n++;
    wheelEls[i].classList.toggle('dim',!m); rows[i].classList.toggle('dim',!m);
    wheelEls[i].classList.toggle('sel',e.id===sel); rows[i].classList.toggle('sel',e.id===sel);
  });
  hubH2.textContent=n+' จาก '+N+' กิจกรรม';
  $('#count').textContent='แสดง '+n+' จาก '+N+' กิจกรรม'+(lens!=='all'?' ที่ป้อนคุณค่าด้าน'+VL[lens]+'เป็นหลัก':'')+(aud!=='all'?' และเกี่ยวกับ'+V.audiences[aud]:'');
  renderSide();
}

/* ---------- side ---------- */
const side=$('#evside');
function renderSide(){
  side.innerHTML='';
  if(!sel){
    side.style.setProperty('--accent','var(--navy)');
    side.append(h('h3',null,'เลือกกิจกรรม'),
      h('p',{class:'muted'},'ขนาดของวงกลมคือน้ำหนักรวมของคุณค่าที่กิจกรรมนั้นป้อนให้ระบบ สีคือคุณค่าด้านที่เด่นที่สุด จุดสีแดงที่วิ่งรอบวงคือคุณค่าที่หมุนต่อจากกิจกรรมหนึ่งไปอีกกิจกรรมหนึ่ง'),
      h('div',{class:'legend2'},KEYS.map(k=>h('div',null,h('i',{style:{background:'var(--c-'+k+')'}}),VL[k]))));
    return;
  }
  const e=EV.find(x=>x.id===sel), d=dom(e);
  side.style.setProperty('--accent','var(--c-'+d+')');
  side.append(h('h3',null,e.name),h('p',{class:'muted small'},e.sub),h('p',null,e.d),
    h('div',null,e.aud.map(a=>h('span',{class:'tag line'},V.audiences[a]))),
    h('h4',null,'ช่วงเวลา'),h('p',null,e.ph.map(i=>V.phases[i].range).filter((v,i,a)=>a.indexOf(v)===i).join(' · ')),
    h('h4',null,'ใส่เข้าไป'),h('ul',null,e.inp.map(x=>h('li',null,x))),
    h('h4',null,'ได้ออกมา'),h('ul',null,e.out.map(x=>h('li',null,x))),
    h('h4',null,'ป้อนคุณค่าให้'),
    ...KEYS.map(k=>h('div',{class:'vbar'},h('span',null,VL[k]),h('div',{class:'tr'},h('i',{style:{width:(e.w[k]/3*100)+'%',background:'var(--c-'+k+')'}})))),
    h('div',{class:'kpi'},h('b',null,'ตัวชี้วัด: '),e.kpi));
}
update();
})();
