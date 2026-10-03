// Interior-design audit of a generated scene: door swings, hall widths, furniture clearances, room sizes.
// usage: node audit.cjs [exist|prop]     (reads ../scenes/*.json, prints a report; units: feet/inches for humans)
const fs=require('fs'), path=require('path');
const FT=0.3048;
const layout=process.argv[2]||'prop';
const g=JSON.parse(fs.readFileSync(path.join(__dirname,'..','scenes',layout==='exist'?'house-existing.json':'house-proposed.json'),'utf8')).nodes;
const nodes=Object.values(g);
const inch=(m)=>Math.round(m/0.0254), ftin=(m)=>{const i=inch(m);return `${Math.floor(i/12)}'${i%12}"`;};

const SW=require('./swing.cjs'); const {rect,sat}=SW;
const ctx=SW.context(g); const {walls,items,levelOf}=ctx;
const lvName={level_0:'Main',level_1:'Upper'};

// ---- 1. door swings ----
console.log(`\n== DOOR SWINGS (${layout}) — leaf swept open 90° on each side, both hinge choices ==`);
const doors=nodes.filter(n=>n.type==='door'&&n.openingKind==='door');
for(const d of doors){
  const A=SW.analyzeDoor(ctx,d); const cur=`${d.swingDirection==='outward'?-1:1}:${d.hingesSide||'left'}`;
  const hit=A.res[cur]; const anyClear=Object.values(A.res).some(v=>!v);
  const side=(s)=>{const hs=['left','right'].map(h=>A.res[`${s}:${h}`]); return hs.every(Boolean)?'HIT '+hs[0]:'clear';};
  console.log(`${hit?'✗':'✓'} ${lvName[A.lv].padEnd(5)} ${(d.name||'Door').padEnd(11)} ${ftin(d.width).padEnd(6)} on ${String(A.W.name).padEnd(20)} hung ${d.swingDirection||'inward'}/${d.hingesSide||'left'}${hit?' → HITS '+hit:''}${hit&&!anyClear?'  (no hanging option is clear)':''} | side +: ${side(1)} | side −: ${side(-1)} | free depth + ${A.depth[1]>=9?'—':ftin(A.depth[1])} − ${A.depth[-1]>=9?'—':ftin(A.depth[-1])}`);
}

// ---- 2. halls and circulation ----
console.log('\n== HALLS / CIRCULATION (zone bounding boxes; code minimum 36", comfortable 42"+) ==');
for(const z of nodes.filter(n=>n.type==='zone'&&/hall|entry|landing|stair|pass/i.test(n.name))){
  const xs=z.polygon.map(p=>p[0]), zs=z.polygon.map(p=>p[1]);
  const wx=Math.max(...xs)-Math.min(...xs), wz=Math.max(...zs)-Math.min(...zs); const mn=Math.min(wx,wz);
  console.log(`${mn<0.9144?'✗':mn<1.07?'~':'✓'} ${lvName[levelOf(z)]||''} ${z.name.padEnd(18)} narrow dimension ${ftin(mn)} (${wx.toFixed(2)} x ${wz.toFixed(2)} m)`);
}

// ---- 3. furniture clearances ----
console.log('\n== FURNITURE: clear space in front (m) and to walls ==');
function frontClear(it){ // sample three rays across the width, march forward until hitting a wall or another item
  let best=3; const cx=it.n.position[0], cz=it.n.position[2];
  for(const off of [-0.35,0,0.35]){ const ox=cx-it.fz*it.W*off, oz=cz+it.fx*it.W*off;
    for(let s=it.D/2+0.02;s<3;s+=0.03){ const px=ox+it.fx*s, pz=oz+it.fz*s; const P=rect(px,pz,1,0,0.04,0.04);
      let hit=false; for(const o of walls){ if(o.lv===it.lv&&sat(P,o.poly)){hit=true;break;} }
      if(!hit) for(const o of items){ if(o===it||o.lv!==it.lv||!sat(P,o.poly)) continue; const a=it.n.name||'',b=o.n.name||''; if((/Dining/.test(a)&&/Dining/.test(b))||(/Sofa/.test(a)&&/Coffee/.test(b))) continue; hit=true;break; }
      if(hit){ best=Math.min(best,s-it.D/2); break; } } }
  return best; }
const want={'Bed':0.6,'Sofa':0.9,'Dining':0.9,'Washing':0.9,'Toilet':0.53,'Bathroom':0.7,'Closet':0.6};
for(const it of ctx.furniture){ const f=frontClear(it); const nm=it.n.name||it.n.asset.name;
  const k=Object.keys(want).find(k=>nm.includes(k)); const need=k?want[k]:0.6;
  if(f<need) console.log(`✗ ${lvName[it.lv]} ${nm.padEnd(22)} front clear ${ftin(f)} (want ${ftin(need)}+)`); }

// ---- 4. rooms ----
console.log('\n== ROOMS: area and shortest side ==');
const area=(p)=>Math.abs(p.reduce((s,q,i)=>{const r=p[(i+1)%p.length];return s+q[0]*r[1]-r[0]*q[1];},0))/2;
for(const z of nodes.filter(n=>n.type==='zone')){ const a=area(z.polygon)/(FT*FT); const xs=z.polygon.map(p=>p[0]), zs=z.polygon.map(p=>p[1]);
  const mn=Math.min(Math.max(...xs)-Math.min(...xs),Math.max(...zs)-Math.min(...zs));
  console.log(`${(lvName[levelOf(z)]||'').padEnd(5)} ${z.name.padEnd(24)} ${a.toFixed(0).padStart(4)} sq ft   shortest bbox side ${ftin(mn)}`); }
