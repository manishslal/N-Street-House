const fs=require('fs');
const {cap,classify}=require('./analyze.cjs');
const S=22, ox=40, oy=30; // px per ft
function svgFor(name){
  const ctx=cap.contexts[name]; const c=classify(ctx);
  const X=x=>ox+(x+1)*S, Z=z=>oy+(z+1)*S;
  let s='';
  const rect=(x0,x1,z0,z1,fill,stroke,op=1)=>`<rect x="${X(x0)}" y="${Z(z0)}" width="${(x1-x0)*S}" height="${(z1-z0)*S}" fill="${fill}" stroke="${stroke||'none'}" opacity="${op}"/>`;
  for(const p of ctx.planes) s+=rect(p.x0,p.x1,p.z0,p.z1,'#f1ead8');
  for(const b of ctx.boxes) if(b.m==='slab') s+=rect(b.x0,b.x1,b.z0,b.z1,'#f1ead8');
  for(const w of c.walls) s+=rect(w.x0,w.x1,w.z0,w.z1,w.m==='wallNew'?'#3b82c4':'#333',null,(w.y1-w.y0)>5?1:0.45);
  for(const d of c.doors) s+=rect(d.x0,d.x1,d.z0,d.z1,'#c0392b');
  for(const g of c.glass) s+=rect(g.x0,g.x1,g.z0-0.05,g.z1+0.05,'#4aa3d6');
  for(const b of ctx.boxes) if(['tread','riser','rail'].includes(b.m)) s+=rect(b.x0,b.x1,b.z0,b.z1,'#b98a57',null,0.35);
  for(const l of ctx.labels) s+=`<text x="${X(l.x)}" y="${Z(l.z)}" font-size="10" font-family="sans-serif" fill="#0a4">${l.text}</text>`;
  for(let x=0;x<=15;x+=5) s+=`<text x="${X(x)}" y="14" font-size="10">${x}</text><line x1="${X(x)}" x2="${X(x)}" y1="18" y2="${Z(33)}" stroke="#ccc" stroke-width=".5"/>`;
  for(let z=0;z<=33;z+=5) s+=`<text x="6" y="${Z(z)+3}" font-size="10">${z}</text><line y1="${Z(z)}" y2="${Z(z)}" x1="${X(0)-8}" x2="${X(15)}" stroke="#ccc" stroke-width=".5"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${ox+17*S}" height="${oy+35*S}" style="background:#fff">${s}</svg>`;
}
let html='<html><body style="margin:0;display:flex;gap:10px;background:#fff">';
for(const n of process.argv.slice(2)) html+='<div><b style="font:12px sans-serif">'+n+'</b>'+svgFor(n)+'</div>';
html+='</body></html>';
fs.writeFileSync('plan.html',html);
