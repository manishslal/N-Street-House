// Does everything fit? For every piece of furniture / cabinet run: is it inside a room, does it cut into a wall, does it overlap another piece.
// usage: node fit.cjs [exist|prop]
const fs=require('fs'),path=require('path'); const SW=require('./swing.cjs'); const {rect,sat,wallRect}=SW;
const layout=process.argv[2]||'prop'; const FT=0.3048;
const g=JSON.parse(fs.readFileSync(path.join(__dirname,'..','scenes',layout==='exist'?'house-existing.json':'house-proposed.json'),'utf8')).nodes;
const nodes=Object.values(g); const ctx=SW.context(g);
const SOFT=['rectangular-carpet','round-carpet','persian-rug','ceiling-lamp','globe-pendant','dome-pendant','recessed-light','picture','round-mirror','brass-sconce','sheer-curtain','small-indoor-plant','coffee-machine'];
const inch=(m)=>`${(m/FT).toFixed(2)}ft`;
const poly=(n)=>n.polygon; const inPoly=(p,pg)=>{let c=false;for(let i=0,j=pg.length-1;i<pg.length;j=i++){const a=pg[i],b=pg[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
const zones=nodes.filter(n=>n.type==='zone').map(z=>({z,lv:ctx.levelOf(z)}));
const pieces=ctx.items.filter(i=>i.isCab||(!SOFT.includes(i.n.asset?.id)&&(i.n.position[1]||0)<=0.3));
let bad=0; const rows=[];
for(const it of pieces){
  const name=it.n.name||'Cabinets'; const [cx,cz]=[it.poly.reduce((s,p)=>s+p[0],0)/4,it.poly.reduce((s,p)=>s+p[1],0)/4];
  const room=(zones.find(z=>z.lv===it.lv&&inPoly([cx,cz],z.z.polygon))||{}).z; const rname=room?room.name:'(no room)';
  const issues=[];
  // outside its room: any footprint corner outside the room polygon by more than 3 cm
  if(room){ const out=it.poly.filter(p=>!inPoly(p,room.polygon)); if(out.length&&!it.isCab){ issues.push(`${out.length} corner(s) outside ${rname}`);} }
  // walls
  for(const w of ctx.walls){ if(w.lv!==it.lv) continue; if(sat(it.poly,w.poly)){ // depth of intrusion along the wall normal
      const nx=-w.uz,nz=w.ux,th=(w.w.thickness||0.1)/2; const ds=it.poly.map(p=>Math.abs((p[0]-(w.w.start[0]+w.w.end[0])/2)*nx+(p[1]-(w.w.start[1]+w.w.end[1])/2)*nz));
      const pen=th-Math.min(...ds); if(pen>0.02) issues.push(`cuts into ${w.w.name||'wall'} by ${(pen*100).toFixed(0)} cm`); } }
  // other pieces
  for(const o of pieces){ if(o===it||o.lv!==it.lv||String(o.n.id)<=String(it.n.id)) continue; if(/Dining|chair|Chair/.test(name)&&/Dining|chair|Chair/.test(o.n.name||'')) continue; if(sat(it.poly,o.poly)) issues.push(`overlaps ${o.n.name||'Cabinets'}`); }
  if(issues.length){bad++; rows.push(`✗ ${rname.padEnd(22)} ${name.padEnd(24)} ${issues.join('; ')}`);}
}
console.log(`== FIT (${layout}) == ${pieces.length} floor pieces, ${bad} with problems`); rows.sort().forEach(r=>console.log(r));
// per room: floor area vs footprint area of what is in it
console.log('\nroom                     area   furniture  fill');
for(const {z,lv} of zones){ const a=Math.abs(z.polygon.reduce((s,q,i)=>{const r=z.polygon[(i+1)%z.polygon.length];return s+q[0]*r[1]-r[0]*q[1];},0))/2;
  let f=0; for(const it of pieces){ if(it.lv!==lv) continue; const cx=it.poly.reduce((s,p)=>s+p[0],0)/4,cz=it.poly.reduce((s,p)=>s+p[1],0)/4; if(inPoly([cx,cz],z.polygon)) f+=(it.W||0)*(it.D||0)||0.0; }
  if(f>0) console.log(`${z.name.padEnd(24)} ${(a/FT/FT).toFixed(0).padStart(4)}sf ${(f/FT/FT).toFixed(0).padStart(5)}sf  ${(100*f/a).toFixed(0)}%`); }
