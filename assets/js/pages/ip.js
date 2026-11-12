(function(){
const {h,$,$$,reduce}=Core;
const V=VF;

/* =============== 1) orbit =============== */
const svg=$('#orbit'), side=$('#ipside');
const CX=380, CY=280, RX=290, RY=196, W=170, HH=46;
const A=V.ipAssets, N=A.length;
const OMEGA=0.10; // rad/s
let t0=0, paused=false, sel=null, last=performance.now();

svg.append(h('ellipse',{class:'track',cx:CX,cy:CY,rx:RX,ry:RY}));
const link=h('line',{class:'link',x1:CX,y1:CY,x2:CX,y2:CY,opacity:0});
svg.append(link);
svg.append(h('g',{class:'core'},
  h('circle',{cx:CX,cy:CY,r:74}),
  h('text',{x:CX,y:CY-14,'text-anchor':'middle'},'University Holding'),
  h('text',{x:CX,y:CY+6,'text-anchor':'middle'},'Company'),
  h('text',{class:'cs',x:CX,y:CY+28,'text-anchor':'middle'},'นิติบุคคลกลางของ IP')));

const els=A.map((a,i)=>{
  const g=h('g',{class:'asset',tabindex:0,role:'button','aria-label':a.name},
    h('rect',{x:-W/2,y:-HH/2,width:W,height:HH,rx:23}),
    h('text',{'text-anchor':'middle',y:5},a.name));
  g.addEventListener('mouseenter',()=>paused=true);
  g.addEventListener('mouseleave',()=>{ paused=false; });
  g.addEventListener('focus',()=>paused=true);
  g.addEventListener('blur',()=>paused=false);
  g.addEventListener('click',()=>choose(sel===i?null:i));
  g.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); choose(sel===i?null:i); } });
  svg.append(g); return g;
});
function posOf(i,t){ const a=(-Math.PI/2)+(2*Math.PI/N)*i+t*OMEGA; return [CX+RX*Math.cos(a), CY+RY*Math.sin(a)]; }
function place(){
  els.forEach((g,i)=>{ const [x,y]=posOf(i,t0); g.setAttribute('transform',`translate(${x.toFixed(1)} ${y.toFixed(1)})`); });
  if(sel!==null){ const [x,y]=posOf(sel,t0); link.setAttribute('x2',x.toFixed(1)); link.setAttribute('y2',y.toFixed(1)); }
}
function tick(now){
  const dt=Math.min(.05,(now-last)/1000); last=now;
  if(!paused) t0+=dt;
  place(); requestAnimationFrame(tick);
}
place();
if(!reduce) requestAnimationFrame(tick);

function choose(i){
  sel=i;
  els.forEach((g,k)=>g.classList.toggle('sel',k===i));
  link.setAttribute('opacity',i===null?0:.85);
  if(i!==null && reduce) place();
  renderSide();
}
function renderSide(){
  side.innerHTML=''; side.style.setProperty('--accent','var(--red)');
  if(sel===null){
    side.append(h('h3',null,'IP ทั้งหกชนิด'),
      h('p',{class:'muted'},'แต่ละดวงคือสินทรัพย์ที่เกิดจากข้อมูลและงานวิจัยของแพลตฟอร์ม ทุกดวงโคจรรอบนิติบุคคลกลาง เพราะต้องมีที่เดียวที่ถือสิทธิ์ เจรจาไลเซนส์ และแบ่งผลประโยชน์'),
      h('ul',null,A.map((a,i)=>h('li',null,h('b',null,a.name),' ',h('span',{class:'muted'},a.ex)))));
    return;
  }
  const a=A[sel], st=V.streams.find(s=>s.id===a.rev);
  side.append(h('h3',null,a.name),h('p',{class:'muted small'},a.ex),
    h('dl',{class:'kv'},
      h('dt',null,'ใครสร้าง'),h('dd',null,a.made),
      h('dt',null,'ใครถือสิทธิ์ (ข้อเสนอ)'),h('dd',null,a.owner),
      h('dt',null,'เส้นทางไลเซนส์'),h('dd',null,a.path),
      h('dt',null,'รายได้ที่เกี่ยวข้อง'),h('dd',null,st?st.name:'-',' ',h('span',{class:'tag revenue'},'รายได้')),
      h('dt',null,'เกราะป้องกัน'),h('dd',null,a.guard)));
}
renderSide();

/* =============== 2) patent race =============== */
const rs=$('#race'), ST=V.ipSteps, K=44, X0=130, YA=130, YN=190;
const dur=ST.map(s=>s.dur), totalDur=dur.reduce((a,b)=>a+b,0);
const cum=dur.reduce((a,v,i)=>(a.push((a[i-1]||0)+v),a),[]); // cumulative width units
const PROTECT=2; // index ของขั้น "คุ้มครอง" (ยื่นสิทธิบัตร)
let cutPct=40, raf=null, tRace=0, running=false;

/* segments */
let x=X0;
ST.forEach((s,i)=>{
  const w=dur[i]*K;
  rs.append(h('rect',{class:'seg-bg'+(i===PROTECT?' p':''),x:x+2,y:50,width:w-4,height:30,rx:4}),
            h('text',{class:'sn',x:x+w/2,y:42},s.name));
  x+=w;
});
const xPat=X0+cum[PROTECT]*K;
rs.append(h('line',{class:'mark',x1:xPat,y1:88,x2:xPat,y2:214}),h('text',{class:'ml',x:xPat,y:232},'ยื่นสิทธิบัตร'));
[['ทีมใช้ AI ช่วย',YA],['ทีมไม่ใช้ AI',YN]].forEach(([n,y])=>{
  rs.append(h('line',{class:'lane',x1:X0,y1:y,x2:X0+totalDur*K,y2:y}),h('text',{class:'lt',x:X0-12,y:y+5},n));
});
const runA=h('circle',{class:'run',r:11,fill:'var(--red-lt)',cx:X0,cy:YA});
const runN=h('circle',{class:'run',r:11,fill:'var(--navy-lt)',cx:X0,cy:YN});
const ftA=h('text',{class:'ft',x:X0+totalDur*K+8,y:YA+5},'');
const ftN=h('text',{class:'ft',x:X0+totalDur*K+8,y:YN+5},'');
rs.append(runA,runN);

/* เวลาที่ใช้แต่ละขั้นของแต่ละทีม */
function times(ai){ return ST.map((s,i)=>s.dur*((ai&&(i===0||i===2))?(1-cutPct/100):1)); }
function xAt(t,tm){ // ตำแหน่ง x ที่เวลา t
  let acc=0;
  for(let i=0;i<tm.length;i++){
    if(t<=acc+tm[i]) return X0+((cum[i]-dur[i])+(t-acc)/tm[i]*dur[i])*K;
    acc+=tm[i];
  }
  return X0+totalDur*K;
}
const sum=a=>a.reduce((p,c)=>p+c,0);
function finishInfo(){
  const ta=times(true), tn=times(false);
  return {pa:sum(ta.slice(0,PROTECT+1)), pn:sum(tn.slice(0,PROTECT+1)), ea:sum(ta), en:sum(tn)};
}
function frame(t){
  const ta=times(true), tn=times(false);
  runA.setAttribute('cx',xAt(t,ta).toFixed(1)); runN.setAttribute('cx',xAt(t,tn).toFixed(1));
}
function showResult(){
  const f=finishInfo();
  $('#result').textContent='ทีมที่ใช้ AI ยื่นสิทธิบัตรที่เวลา '+f.pa.toFixed(1)+' ส่วนอีกทีมที่เวลา '+f.pn.toFixed(1)+' เร็วกว่า '+(f.pn-f.pa).toFixed(1)+' หน่วย และถึงปลายทางเร็วกว่า '+(f.en-f.ea).toFixed(1)+' หน่วย';
}
function stopRace(){ running=false; if(raf) cancelAnimationFrame(raf); raf=null; }
function resetRace(){ stopRace(); tRace=0; frame(0); $('#result').textContent='กดเริ่มแข่ง'; $('#go').textContent='เริ่มแข่ง'; }
function startRace(){
  stopRace();
  if(reduce){ tRace=totalDur; frame(totalDur); showResult(); return; }
  tRace=0; running=true; $('#go').textContent='แข่งอยู่';
  let prev=performance.now();
  (function step(now){
    const dt=(now-prev)/1000; prev=now; tRace+=dt*2; // 1 วินาทีจริง = 2 หน่วย
    frame(tRace);
    if(tRace<totalDur+0.2 && running) raf=requestAnimationFrame(step);
    else { running=false; frame(totalDur); showResult(); $('#go').textContent='แข่งอีกครั้ง'; }
  })(prev);
}
$('#go').addEventListener('click',startRace);
$('#reset').addEventListener('click',resetRace);
$('#cut').addEventListener('input',e=>{ cutPct=+e.target.value; $('#cutv').textContent=cutPct+'%'; if(!running){ frame(tRace>=totalDur?totalDur:0); if(tRace>=totalDur) showResult(); } });
frame(0);

const ol=$('#steps');
ST.forEach((s,i)=>ol.append(h('li',{class:i===PROTECT?'p':null},h('b',null,s.name),h('span',null,s.d))));

/* =============== 3) licence table =============== */
const tb=$('#lictable tbody'), lic=$('#lic');
V.licenses.forEach((l,i)=>{
  tb.append(h('tr',null,h('td',null,l.m),h('td',null,l.pay),h('td',null,l.rev),h('td',null,l.bs),h('td',null,l.ex)));
  lic.append(h('button',{type:'button','data-i':i,'aria-pressed':'false',onclick:()=>{
    const on=lic.children[i].getAttribute('aria-pressed')==='true';
    $$('button',lic).forEach((b,k)=>b.setAttribute('aria-pressed',(!on&&k===i)?'true':'false'));
    $$('tr',tb).forEach((r,k)=>r.classList.toggle('hl',!on&&k===i));
  }},l.m));
});
})();
