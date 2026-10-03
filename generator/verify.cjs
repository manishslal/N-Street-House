// Independent geometric check: Bethan's wall boxes vs the generated Pascal walls (with openings), sampled on a grid.
const fs=require('fs');
const {cap}=require('./analyze.cjs');
const {build}=require('./emit.cjs');
const FT=0.3048, D=34, H8=8*FT;
const STEP=0.02;
const heights=[0.3,1.0,1.8,2.2];   // metres above floor: base, below sills, window band, lintel band

function bethanOcc(ctx){
  const boxes=ctx.boxes.filter(b=>b.m==='wall'||b.m==='wallNew').map(b=>({x0:b.x0*FT,x1:b.x1*FT,z0:(D-b.z1)*FT,z1:(D-b.z0)*FT,y0:b.y0*FT,y1:b.y1*FT}));
  return (x,z,y)=>boxes.some(b=>x>=b.x0&&x<=b.x1&&z>=b.z0&&z<=b.z1&&y>=b.y0&&y<=b.y1);
}
function pascalOcc(g,levelId){
  const nodes=g.nodes, walls=Object.values(nodes).filter(n=>n.type==='wall'&&n.parentId===levelId);
  const W=walls.map(w=>{
    const [sx,sz]=w.start,[ex,ez]=w.end; const L=Math.hypot(ex-sx,ez-sz); const dx=(ex-sx)/L,dz=(ez-sz)/L;
    const ops=w.children.map(id=>nodes[id]).filter(Boolean).map(o=>({u0:o.position[0]-o.width/2,u1:o.position[0]+o.width/2,y0:o.position[1]-o.height/2,y1:o.position[1]+o.height/2}));
    // snapped ends bury into the perpendicular wall: model Pascal's mitre by extending t/2 at ends that touch another wall's centreline
    return {sx,sz,dx,dz,L,t:w.thickness,h:w.height??H8,ops,w};
  });
  // end extension (mitre approximation)
  for(const a of W){ a.ext0=0;a.ext1=0;
    for(const b of W){ if(a===b) continue;
      const near=(px,pz)=>{ // is point on b's centreline segment?
        const u=(px-b.sx)*b.dx+(pz-b.sz)*b.dz, v=(px-b.sx)*-b.dz+(pz-b.sz)*b.dx; return u>=-1e-3&&u<=b.L+1e-3&&Math.abs(v)<1e-3; };
      if(near(a.sx,a.sz)) a.ext0=Math.max(a.ext0,b.t/2);
      if(near(a.sx+a.dx*a.L,a.sz+a.dz*a.L)) a.ext1=Math.max(a.ext1,b.t/2);
    }}
  return (x,z,y)=>W.some(a=>{
    const u=(x-a.sx)*a.dx+(z-a.sz)*a.dz, v=(x-a.sx)*-a.dz+(z-a.sz)*a.dx;
    if(u<-a.ext0||u>a.L+a.ext1||Math.abs(v)>a.t/2||y>a.h) return false;
    return !a.ops.some(o=>u>=o.u0&&u<=o.u1&&y>=o.y0&&y<=o.y1);
  });
}
function cluster(pts){ // grid flood fill on mismatch cells
  const key=(i,j)=>i+','+j; const set=new Set(pts.map(p=>key(p.i,p.j))); const seen=new Set(); const out=[];
  for(const p of pts){ const k=key(p.i,p.j); if(seen.has(k)) continue; const q=[p]; seen.add(k); let n=0,minx=1e9,maxx=-1e9,minz=1e9,maxz=-1e9;
    while(q.length){const c=q.pop(); n++; minx=Math.min(minx,c.x);maxx=Math.max(maxx,c.x);minz=Math.min(minz,c.z);maxz=Math.max(maxz,c.z);
      for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const kk=key(c.i+di,c.j+dj); if(set.has(kk)&&!seen.has(kk)){seen.add(kk);q.push({i:c.i+di,j:c.j+dj,x:(c.i+di)*STEP,z:(c.j+dj)*STEP});}}}
    out.push({cells:n,area_m2:+(n*STEP*STEP).toFixed(3),x:[+minx.toFixed(2),+maxx.toFixed(2)],z:[+minz.toFixed(2),+maxz.toFixed(2)]}); }
  return out.sort((a,b)=>b.cells-a.cells);
}
let totalBad=0;
for(const layout of ['exist','prop']){
  const g=build(layout);
  for(const floor of ['main','upper']){
    const ctx=cap.contexts[`${floor}_${layout}`]; const lv=floor==='main'?'level_0':'level_1';
    const B0=bethanOcc(ctx), P=pascalOcc(g,lv);
    // Door leaves Bethan drew as flat panels on solid walls became real openings: mask their footprint (+8 cm) from the comparison.
    const leaves=ctx.boxes.filter(b=>b.m==='door'&&Math.min(b.x1-b.x0,b.z1-b.z0)<=0.06&&b.y1-b.y0>=5.5).map(b=>({x0:b.x0*FT-0.14,x1:b.x1*FT+0.14,z0:(D-b.z1)*FT-0.14,z1:(D-b.z0)*FT+0.14}));
    const masked=(x,z)=>leaves.some(l=>x>=l.x0&&x<=l.x1&&z>=l.z0&&z<=l.z1);
    const B=(x,z,y)=>B0(x,z,y)&&!masked(x,z);
    let both=0,onlyB=0,onlyP=0; const mism={};
    for(const y of heights){ const bad=[]; 
      for(let x=-0.2;x<=15.7*FT;x+=STEP) for(let z=-0.2;z<=(34.2)*FT;z+=STEP){
        if(masked(x,z)) continue; const b=B(x,z,y),p=P(x,z,y); if(b&&p) both++; else if(b){onlyB++;bad.push({i:Math.round(x/STEP),j:Math.round(z/STEP),x,z});} else if(p){onlyP++;bad.push({i:Math.round(x/STEP),j:Math.round(z/STEP),x,z});}
      }
      mism[y]=cluster(bad).filter(c=>c.area_m2>=0.004);
    }
    const tot=both+onlyB+onlyP; const iou=both/tot;
    console.log(`\n== ${layout}/${floor}: IoU=${(iou*100).toFixed(2)}%  (both ${both}, onlyBethan ${onlyB}, onlyPascal ${onlyP})`);
    for(const y of heights){ const m=mism[y]; if(m.length) {console.log(`  y=${y} m: ${m.length} mismatch region(s) >=40cm2, largest:`); m.slice(0,6).forEach(c=>console.log('    ',JSON.stringify(c)));} else console.log(`  y=${y} m: clean`);}
    totalBad+=onlyB+onlyP;
  }
}
console.log('\nTOTAL mismatching samples:',totalBad);
