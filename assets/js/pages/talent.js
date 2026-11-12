(function(){
const {h,$,$$,tween,lerp,reduce}=Core;
const V=VF;
const FEED={revenue:'รายได้',talent:'บุคลากร',ip:'ทรัพย์สินทางปัญญา',events:'กิจกรรม',trust:'มาตรฐานและความเชื่อมั่น'};
const tags=arr=>arr.map(t=>h('span',{class:'tag '+t},FEED[t]));

/* =============== 1) pyramid + radar =============== */
const pyr=$('#pyr'), radar=$('#radar'), lvlBox=$('#lvl');
const xl=y=>210-190*(y-22)/330;
const RANGES=[[250,352],[140,242],[22,132]]; // L1 ล่าง, L2 กลาง, L3 บน
const SHORT=['Professional Standards','AI & Research Mastery','Leadership'];
let lvl=0, auto=null;

const layers=V.levels.map((L,i)=>{
  const [y0,y1]=RANGES[i];
  const pts=[[xl(y0),y0],[420-xl(y0),y0],[420-xl(y1),y1],[xl(y1),y1]].map(p=>p.map(n=>n.toFixed(1)).join(',')).join(' ');
  const mid=(y0+y1)/2+(i===2?18:0);
  const g=h('g',{class:'layer',tabindex:0,role:'button','aria-label':'ระดับ '+L.id+' '+L.name},
    h('polygon',{points:pts}),
    h('text',{class:'t1','text-anchor':'middle',x:210,y:mid-2},'ระดับ '+L.id),
    h('text',{class:'t2','text-anchor':'middle',x:210,y:mid+16},SHORT[i]));
  g.addEventListener('click',()=>{ stopAuto(); setLvl(i); });
  g.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); stopAuto(); setLvl(i); } });
  pyr.append(g); return g;
});

/* radar geometry */
const RC={x:260,y:205}, RR=118, NA=6;
const ang=i=>(-90+360/NA*i)*Math.PI/180;
const pt=(i,r)=>[RC.x+r*Math.cos(ang(i)), RC.y+r*Math.sin(ang(i))];
const poly=arr=>arr.map((s,i)=>pt(i,RR*s/5).map(n=>n.toFixed(1)).join(',')).join(' ');
for(let k=1;k<=5;k++){
  radar.append(h('polygon',{class:'ring',points:poly(Array(NA).fill(k))}));
}
const LBL=[['ทักษะคลินิก'],['One Health','และ Biosecurity'],['AI และข้อมูล'],['วิจัยเชิงลึก','(Omics)'],['กฎระเบียบและ IP'],['ความเป็น','ผู้ประกอบการ']];
V.radarAxes.forEach((a,i)=>{
  const [x2,y2]=pt(i,RR);
  radar.append(h('line',{class:'axis',x1:RC.x,y1:RC.y,x2:x2.toFixed(1),y2:y2.toFixed(1)}));
  const [lx,ly]=pt(i,RR+18), c=Math.cos(ang(i)), s=Math.sin(ang(i));
  const anchor=c>0.3?'start':(c<-0.3?'end':'middle');
  const t=h('text',{class:'al','text-anchor':anchor,x:lx.toFixed(1),y:(ly+(s<-0.8?-6:(s>0.8?10:4))-(LBL[i].length-1)*9).toFixed(1)});
  LBL[i].forEach((ln,k)=>t.append(h('tspan',{x:lx.toFixed(1),dy:k?19:0},ln)));
  radar.append(t);
});
const ghost=h('polygon',{class:'shape',fill:'none',stroke:'rgba(255,255,255,.35)','stroke-width':1.5,'stroke-dasharray':'4 4'});
const ghost2=h('polygon',{class:'shape',fill:'none',stroke:'rgba(255,255,255,.35)','stroke-width':1.5,'stroke-dasharray':'4 4'});
const shape=h('polygon',{class:'shape',fill:'rgba(134,161,245,.38)',stroke:'var(--blue-lt)','stroke-width':2.6});
const dots=Array.from({length:NA},()=>h('circle',{r:4.5,fill:'#fff',stroke:'var(--blue-lt)','stroke-width':2}));
radar.append(ghost,ghost2,shape,...dots);
let cv=V.levels[0].radar.slice();
function drawRadar(){
  shape.setAttribute('points',poly(cv));
  dots.forEach((d,i)=>{ const [x,y]=pt(i,RR*cv[i]/5); d.setAttribute('cx',x.toFixed(1)); d.setAttribute('cy',y.toFixed(1)); });
}
drawRadar();

function setLvl(i){
  lvl=i;
  layers.forEach((g,k)=>g.classList.toggle('sel',k===i));
  ghost.setAttribute('points',i>=1?poly(V.levels[0].radar):'');
  ghost2.setAttribute('points',i>=2?poly(V.levels[1].radar):'');
  const from=cv.slice(), to=V.levels[i].radar;
  tween(650,e=>{ cv=from.map((v,k)=>lerp(v,to[k],e)); drawRadar(); });
  renderLvl();
}
function renderLvl(){
  const L=V.levels[lvl];
  lvlBox.innerHTML=''; lvlBox.style.setProperty('--accent','var(--blue)');
  lvlBox.append(
    h('span',{class:'lv-id'},'ระดับ '+L.id),
    h('h3',null,L.name),
    h('p',{class:'muted small'},L.th+' · '+L.who),
    h('h4',null,'ทำอะไรได้'),h('ul',null,L.can.map(x=>h('li',null,x))),
    h('h4',null,'เรียนรู้ผ่านอะไร'),h('ul',null,L.vehicle.map(x=>h('li',null,x))),
    h('h4',null,'คุณค่าที่ป้อนให้ระบบ'),h('p',{class:'big'},L.value),
    h('div',null,tags(L.feeds)));
  lvlBox.classList.remove('swap'); void lvlBox.offsetWidth; lvlBox.classList.add('swap');
}
function stopAuto(){ if(auto){ clearInterval(auto); auto=null; } }
if(!reduce){ auto=setInterval(()=>setLvl((lvl+1)%3),5200); }
setLvl(0);

/* =============== 2) path stepper =============== */
const ps=$('#path'), STEPS=V.talentSteps, N=STEPS.length;
const XS=STEPS.map((_,i)=>80+168*i), YS=STEPS.map((_,i)=>i%2?72:128);
const dPath='M '+XS[0]+' '+YS[0]+' '+XS.slice(1).map((x,i)=>{ const dx=(x-XS[i])/2; return `C ${XS[i]+dx} ${YS[i]}, ${x-dx} ${YS[i+1]}, ${x} ${YS[i+1]}`; }).join(' ');
const base=h('path',{class:'base',d:dPath}), trail=h('path',{class:'trail',d:dPath});
ps.append(base,trail);
const TL=base.getTotalLength();
trail.style.strokeDasharray=TL+' '+TL;
/* ความยาวเส้นถึงแต่ละโหนด */
const nodeLen=XS.map(x=>{ let l=0; while(l<TL && base.getPointAtLength(l).x<x-0.5) l+=1; return l; });
const lenAt=p=>{ const a=Math.floor(p), b=Math.min(N-1,a+1); return lerp(nodeLen[a],nodeLen[b],p-a); };
const nodes=STEPS.map((s,i)=>{
  const g=h('g',{class:'pn',tabindex:0,role:'button','aria-label':'จุดที่ '+(i+1)+' '+s.name,transform:`translate(${XS[i]} ${YS[i]})`},
    h('circle',{class:'c',r:20}),
    h('text',{class:'n','text-anchor':'middle',y:6,'font-weight':700,'font-size':16},String(i+1)),
    h('text',{class:'pl','text-anchor':'middle',y:48},s.name));
  g.addEventListener('click',()=>{ stopPlay(); goStep(i); });
  g.addEventListener('keydown',e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); stopPlay(); goStep(i); } });
  ps.append(g); return g;
});
const token=h('circle',{class:'token',r:9});
ps.append(token);

let step=0, prog=0, playT=null;
function placeToken(p){
  const l=lenAt(p), pt=base.getPointAtLength(l);
  token.setAttribute('cx',pt.x.toFixed(1)); token.setAttribute('cy',pt.y.toFixed(1));
  trail.style.strokeDashoffset=(TL-l).toFixed(1);
}
function goStep(i){
  step=i; $('#step').value=i;
  const from=prog;
  tween(900,e=>{ prog=lerp(from,i,e); placeToken(prog); });
  nodes.forEach((g,k)=>{ g.classList.toggle('done',k<i); g.classList.toggle('cur',k===i); });
  const sk=$('#skills'); sk.innerHTML='';
  STEPS.slice(0,i+1).forEach(s=>sk.append(h('span',null,s.gets)));
  const s=STEPS[i], box=$('#stepinfo'); box.innerHTML='';
  box.append(
    h('div',null,h('h4',null,'จุดแวะที่ '+(i+1)),h('p',{class:'big'},s.name),h('p',{class:'muted'},s.note)),
    h('div',null,h('h4',null,'อยู่ที่ไหน'),h('p',null,s.where),h('h4',{style:{marginTop:'8px'}},'ได้อะไร'),h('p',null,s.gets)),
    h('div',null,h('h4',null,'ป้อนคุณค่าให้'),h('div',null,tags(s.feeds))));
}
function stopPlay(){ if(playT){ clearInterval(playT); playT=null; } const b=$('#play'); b.textContent='เล่น'; b.setAttribute('aria-pressed','false'); }
$('#play').addEventListener('click',()=>{
  if(playT){ stopPlay(); return; }
  const b=$('#play'); b.textContent='หยุด'; b.setAttribute('aria-pressed','true');
  if(step>=N-1) goStep(0);
  playT=setInterval(()=>{ if(step>=N-1){ stopPlay(); return; } goStep(step+1); },2600);
});
$('#step').addEventListener('input',e=>{ stopPlay(); goStep(+e.target.value); });
placeToken(0); goStep(0);

/* =============== 3) roles =============== */
const flagBar=$('#flag'), list=$('#roles');
const FL=[['all','ทั้งหมด'],...Object.entries(V.flagships)];
function renderRoles(f){
  list.innerHTML='';
  V.roles.filter(r=>f==='all'||r.f===f).forEach(r=>list.append(h('li',null,
    h('i',{style:{background:'var(--c-'+r.lens+')'}}),h('div',null,r.n,h('small',null,V.flagships[r.f])))));
}
FL.forEach(([id,label])=>flagBar.append(h('button',{type:'button','data-id':id,'aria-pressed':id==='all'?'true':'false',onclick:()=>{
  $$('button',flagBar).forEach(b=>b.setAttribute('aria-pressed',b.dataset.id===id?'true':'false')); renderRoles(id); }},label)));
$('#lenskey').append(...[['revenue','รายได้'],['ip','ทรัพย์สินทางปัญญา'],['talent','บุคลากร'],['trust','มาตรฐานและกำกับดูแล']].map(([k,n])=>h('span',null,h('i',{style:{background:'var(--c-'+k+')'}}),n)));
renderRoles('all');
})();
