(function(){
const {h,$,$$,Flow,reduce}=Core;
const V=VF;
const svg=$('#flow');
const XS=[90,290,500,710,910], YS=[205,145,205,145,205];
const LENSES=['all','revenue','talent','ip','events'];
const PARTICLE={ all:{n:5,r:3.4,speed:75}, revenue:{n:6,r:4.4,speed:90}, talent:{n:10,r:2.6,speed:70}, ip:{n:4,r:3.6,speed:55}, events:{n:3,r:5.2,speed:115} };
let lens='all', mainFlow=null, loopFlow=null;

/* ---- geometry ---- */
function seg(i){ // cubic segment node i -> i+1
  const dx=(XS[i+1]-XS[i])/2;
  return `C ${XS[i]+dx} ${YS[i]}, ${XS[i+1]-dx} ${YS[i+1]}, ${XS[i+1]} ${YS[i+1]}`;
}
const mainD='M '+XS[0]+' '+YS[0]+' '+[0,1,2,3].map(seg).join(' ');
const loopD=`M ${XS[4]} ${YS[4]+28} C ${XS[4]} 372, ${XS[0]} 372, ${XS[0]} ${YS[0]+28}`;

const base=h('path',{class:'base draw-in',d:mainD});
const loop=h('path',{class:'loop flowline',d:loopD});
const loopLbl=h('text',{class:'looplbl',x:500,y:372});
svg.append(base,loop,loopLbl);

const nodes=V.stages.map((s,i)=>{
  const up = YS[i]<200; // ป้ายอยู่เหนือโหนดเสมอ
  const inner=h('g',{class:'pop',style:{animationDelay:(0.5+i*0.18)+'s'}},
    h('circle',{class:'ring',r:22,fill:'#0B1F4B',stroke:'var(--navy-lt)','stroke-width':3}),
    h('text',{x:0,y:6,'text-anchor':'middle',fill:'#fff','font-weight':700,'font-size':17},String(i+1)),
    h('text',{class:'lbl',x:0,y:-50,'text-anchor':'middle'},s.name),
    h('text',{class:'sub',x:0,y:-33,'text-anchor':'middle'},s.sub));
  const g=h('g',{class:'node',tabindex:0,role:'button','aria-label':s.name+' '+s.sub,transform:`translate(${XS[i]} ${YS[i]})`},inner);
  g.addEventListener('mouseenter',()=>focus(i));
  g.addEventListener('focus',()=>focus(i));
  g.addEventListener('mouseleave',()=>focus(-1));
  g.addEventListener('blur',()=>focus(-1));
  return g;
});
nodes.forEach(n=>svg.append(n));

/* ---- captions ---- */
const capBox=$('#captions');
const caps=V.stages.map((s,i)=>{
  const c=h('div',{class:'cap'},h('h4',null,s.name),h('p',null,''));
  capBox.append(c); return c;
});

function focus(i){
  caps.forEach((c,k)=>c.classList.toggle('on',k===i));
  nodes.forEach((n,k)=>n.classList.toggle('on',k===i));
}

/* ---- lens ---- */
function setLens(id,first){
  lens=id;
  const L=V.lenses[id];
  $$('#lens button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===id?'true':'false'));
  caps.forEach((c,i)=>{
    const p=$('p',c); p.textContent=V.stages[i][id];
    if(!first){ p.classList.remove('swap'); void p.offsetWidth; p.classList.add('swap'); }
    $('h4',c).style.color=id==='all'?'#fff':'var('+L.lt+')';
  });
  loopLbl.textContent=V.loop[id];
  nodes.forEach(n=>$('circle.ring',n).style.stroke='var('+L.lt+')');
  if(mainFlow) mainFlow.remove();
  const P=PARTICLE[id];
  mainFlow=Flow.add(base,{n:P.n,r:P.r,speed:P.speed,color:'var('+L.lt+')',layer:svg});
}

/* ---- build UI ---- */
const seg0=$('#lens');
LENSES.forEach(id=>{
  const L=V.lenses[id];
  seg0.append(h('button',{type:'button','data-id':id,'aria-pressed':'false',style:{'--dot':'var('+L.css+')'},onclick:()=>setLens(id)},h('i'),L.name));
});

/* path length สำหรับแอนิเมชันวาดเส้น */
try{ base.style.setProperty('--len',Math.ceil(base.getTotalLength())+''); }catch(e){}

setLens('all',true);
loopFlow=Flow.add(loop,{n:6,r:3.6,speed:80,color:'var(--red-lt)',layer:svg});

/* ---- nav rows ---- */
const ROWS=[
  ['players.html','ผู้เล่นและการส่งต่อคุณค่า','คลิกผู้เล่นเพื่อดูว่าให้อะไร ได้อะไร และอะไรไหลระหว่างกัน','--navy'],
  ['revenue.html','ช่องทางรายได้และวงจรแบ่งปัน','ปรับสัดส่วนรายได้และเกณฑ์ 30–40% แล้วดูว่าเงินไหลไปไหน','--c-revenue'],
  ['talent.html','บุคลากร: จากปริญญาสู่ผู้ประกอบการ','ดูพีระมิด 3 ระดับ เรดาร์ทักษะ และเส้นทางสู่ spin-off','--c-talent'],
  ['ip.html','ทรัพย์สินทางปัญญา: จากการค้นพบสู่ไลเซนส์','ดูวงโคจรของ IP ทั้งหกชนิด และแข่งความเร็วจดสิทธิ์','--c-ip'],
  ['events.html','กิจกรรมที่ทำให้คุณค่าหมุน','กรองตามผู้เล่นและมุมมอง ดูบนวงล้อหรือไทม์ไลน์','--navy'],
  ['roadmap.html','แผนที่นำทาง 2569–2573','กดเล่นแล้วดูคุณค่าที่ถูกปลดล็อกในแต่ละเฟส','--red']
];
const rows=$('#rows');
ROWS.forEach(([href,t,d,c])=>rows.append(h('a',{href,style:{'--bar':'var('+c+')'}},
  h('span',{class:'bar'}),h('div',null,h('strong',null,t),h('span',{class:'d'},d)),h('span',{class:'go'},'เปิดดู'))));
})();
