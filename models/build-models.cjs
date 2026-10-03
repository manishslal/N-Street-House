// Procedural furniture/lighting models for the scene (no dependencies). Writes binary glTF (.glb) files next to this script.
// Conventions (match Pascal's catalog items): metres, model centred on x/z, bottom at y=0, front faces +z.
// usage: node build-models.cjs
const fs=require('fs'), path=require('path');
const OUT=__dirname;

// ---------- tiny geometry kit ----------
const V=(x,y,z)=>[x,y,z];
class Geo{ constructor(){this.p=[];this.n=[];this.uv=[];this.i=[];}
  tri(a,b,c,na,nb,nc,ua=[0,0],ub=[0,0],uc=[0,0]){const k=this.p.length/3;this.p.push(...a,...b,...c);this.n.push(...na,...nb,...nc);this.uv.push(...ua,...ub,...uc);this.i.push(k,k+1,k+2);}
  quad(a,b,c,d,n,uvs){ // a,b,c,d counter-clockwise seen from the normal side
    const u=uvs||[[0,0],[1,0],[1,1],[0,1]];this.tri(a,b,c,n,n,n,u[0],u[1],u[2]);this.tri(a,c,d,n,n,n,u[0],u[2],u[3]);}
  apply(fn){ for(let k=0;k<this.p.length;k+=3){const q=fn([this.p[k],this.p[k+1],this.p[k+2]]);this.p[k]=q[0];this.p[k+1]=q[1];this.p[k+2]=q[2];} return this; }
  merge(g){const base=this.p.length/3;this.p.push(...g.p);this.n.push(...g.n);this.uv.push(...g.uv);for(const i of g.i)this.i.push(i+base);return this;}
}
function rotY(v,a){const c=Math.cos(a),s=Math.sin(a);return [v[0]*c+v[2]*s,v[1],-v[0]*s+v[2]*c];}
function rotX(v,a){const c=Math.cos(a),s=Math.sin(a);return [v[0],v[1]*c-v[2]*s,v[1]*s+v[2]*c];}
function rotZ(v,a){const c=Math.cos(a),s=Math.sin(a);return [v[0]*c-v[1]*s,v[0]*s+v[1]*c,v[2]];}
const T=(g,x,y,z)=>g.apply(p=>[p[0]+x,p[1]+y,p[2]+z]);
const RY=(g,a)=>g.apply(p=>rotY(p,a)), RX=(g,a)=>g.apply(p=>rotX(p,a)), RZ=(g,a)=>g.apply(p=>rotZ(p,a));
// box centred at origin with size sx,sy,sz (uv: top face 0..1 for textures)
function box(sx,sy,sz){const g=new Geo();const x=sx/2,y=sy/2,z=sz/2;
  g.quad(V(-x,-y,z),V(x,-y,z),V(x,y,z),V(-x,y,z),[0,0,1]);
  g.quad(V(x,-y,-z),V(-x,-y,-z),V(-x,y,-z),V(x,y,-z),[0,0,-1]);
  g.quad(V(x,-y,z),V(x,-y,-z),V(x,y,-z),V(x,y,z),[1,0,0]);
  g.quad(V(-x,-y,-z),V(-x,-y,z),V(-x,y,z),V(-x,y,-z),[-1,0,0]);
  g.quad(V(-x,y,z),V(x,y,z),V(x,y,-z),V(-x,y,-z),[0,1,0],[[0,1],[1,1],[1,0],[0,0]]);
  g.quad(V(-x,-y,-z),V(x,-y,-z),V(x,-y,z),V(-x,-y,z),[0,-1,0]);
  return g;}
// frustum / cylinder along y from y0 to y1 with radii r0 (bottom) r1 (top)
function cyl(r0,r1,h,seg=28,capTop=true,capBot=true){const g=new Geo();
  for(let k=0;k<seg;k++){const a0=k/seg*2*Math.PI,a1=(k+1)/seg*2*Math.PI;
    const p00=V(Math.cos(a0)*r0,0,Math.sin(a0)*r0),p10=V(Math.cos(a1)*r0,0,Math.sin(a1)*r0),p01=V(Math.cos(a0)*r1,h,Math.sin(a0)*r1),p11=V(Math.cos(a1)*r1,h,Math.sin(a1)*r1);
    const sl=Math.atan2(r0-r1,h), nA=V(Math.cos(a0)*Math.cos(sl),Math.sin(sl),Math.sin(a0)*Math.cos(sl)), nB=V(Math.cos(a1)*Math.cos(sl),Math.sin(sl),Math.sin(a1)*Math.cos(sl));
    g.tri(p00,p01,p11,nA,nA,nB);g.tri(p00,p11,p10,nA,nB,nB);
    if(capTop&&r1>0){g.tri(V(0,h,0),p11,p01,[0,1,0],[0,1,0],[0,1,0]);}
    if(capBot&&r0>0){g.tri(V(0,0,0),p00,p10,[0,-1,0],[0,-1,0],[0,-1,0]);}
  } return g;}
function sphere(r,seg=20,rings=12,y0=0,y1=Math.PI){const g=new Geo();
  for(let i=0;i<rings;i++){const t0=y0+(y1-y0)*i/rings,t1=y0+(y1-y0)*(i+1)/rings;
    for(let k=0;k<seg;k++){const a0=k/seg*2*Math.PI,a1=(k+1)/seg*2*Math.PI;
      const P=(t,a)=>V(Math.sin(t)*Math.cos(a)*r,Math.cos(t)*r,Math.sin(t)*Math.sin(a)*r);
      const N=(t,a)=>V(Math.sin(t)*Math.cos(a),Math.cos(t),Math.sin(t)*Math.sin(a));
      g.tri(P(t0,a0),P(t1,a0),P(t1,a1),N(t0,a0),N(t1,a0),N(t1,a1));g.tri(P(t0,a0),P(t1,a1),P(t0,a1),N(t0,a0),N(t1,a1),N(t0,a1));}}
  return g;}
// ring (torus) in the xy plane, major radius R, tube radius r
function torus(R,r,seg=36,tube=8,arc=2*Math.PI,start=0){const g=new Geo();
  const P=(u,v)=>{const a=start+u*arc,b=v*2*Math.PI;return V((R+r*Math.cos(b))*Math.cos(a),(R+r*Math.cos(b))*Math.sin(a),r*Math.sin(b));};
  const N=(u,v)=>{const a=start+u*arc,b=v*2*Math.PI;return V(Math.cos(b)*Math.cos(a),Math.cos(b)*Math.sin(a),Math.sin(b));};
  for(let i=0;i<seg;i++)for(let j=0;j<tube;j++){const u0=i/seg,u1=(i+1)/seg,v0=j/tube,v1=(j+1)/tube;
    g.tri(P(u0,v0),P(u1,v0),P(u1,v1),N(u0,v0),N(u1,v0),N(u1,v1));g.tri(P(u0,v0),P(u1,v1),P(u0,v1),N(u0,v0),N(u1,v1),N(u0,v1));}
  return g;}
// arc block: annular sector in the xz plane (angles measured from +x toward +z), from y0 to y1
function arcBlock(rIn,rOut,a0,a1,y0,y1,seg=24){const g=new Geo();
  for(let k=0;k<seg;k++){const s=a0+(a1-a0)*k/seg,e=a0+(a1-a0)*(k+1)/seg;
    const pt=(r,a,y)=>V(Math.cos(a)*r,y,Math.sin(a)*r);
    g.quad(pt(rOut,s,y0),pt(rOut,e,y0),pt(rOut,e,y1),pt(rOut,s,y1),V(Math.cos((s+e)/2),0,Math.sin((s+e)/2)));
    g.quad(pt(rIn,e,y0),pt(rIn,s,y0),pt(rIn,s,y1),pt(rIn,e,y1),V(-Math.cos((s+e)/2),0,-Math.sin((s+e)/2)));
    g.quad(pt(rIn,s,y1),pt(rOut,s,y1),pt(rOut,e,y1),pt(rIn,e,y1),[0,1,0]);
    g.quad(pt(rIn,e,y0),pt(rOut,e,y0),pt(rOut,s,y0),pt(rIn,s,y0),[0,-1,0]);}
  const ends=(a,sgn)=>{const n=V(-Math.sin(a)*sgn,0,Math.cos(a)*sgn);const pt=(r,y)=>V(Math.cos(a)*r,y,Math.sin(a)*r);
    if(sgn>0) g.quad(pt(rIn,y0),pt(rOut,y0),pt(rOut,y1),pt(rIn,y1),n); else g.quad(pt(rOut,y0),pt(rIn,y0),pt(rIn,y1),pt(rOut,y1),n);};
  ends(a0,-1);ends(a1,1);
  return g;}

// ---------- glb writer ----------
const hex=(c)=>{const n=parseInt(c.slice(1),16);return [(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];};
const srgb2lin=(c)=>c<=0.04045?c/12.92:Math.pow((c+0.055)/1.055,2.4);
function mat(color,{rough=0.7,metal=0,alpha=1,emissive=null,tex=null}={}){const c=hex(color).map(srgb2lin);
  return {color:[...c,alpha],rough,metal,alpha,emissive:emissive?hex(emissive).map(srgb2lin):null,tex};}
function writeGlb(name,parts){ // parts: [{geo,mat}]
  const bin=[];let off=0;const bufferViews=[],accessors=[],meshPrims=[],materials=[],images=[],textures=[],samplers=[];
  const push=(buf,target)=>{const pad=(4-(buf.length%4))%4;bufferViews.push({buffer:0,byteOffset:off,byteLength:buf.length,...(target?{target}:{})});bin.push(buf,Buffer.alloc(pad));off+=buf.length+pad;return bufferViews.length-1;};
  const mats=new Map();
  for(const part of parts){const g=part.geo; if(!g.i.length) continue;
    const pos=Buffer.from(new Float32Array(g.p).buffer), nor=Buffer.from(new Float32Array(g.n).buffer), uv=Buffer.from(new Float32Array(g.uv).buffer), idx=Buffer.from(new Uint32Array(g.i).buffer);
    let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(let k=0;k<g.p.length;k+=3)for(let a=0;a<3;a++){mn[a]=Math.min(mn[a],g.p[k+a]);mx[a]=Math.max(mx[a],g.p[k+a]);}
    const ap=accessors.push({bufferView:push(pos,34962),componentType:5126,count:g.p.length/3,type:'VEC3',min:mn,max:mx})-1;
    const an=accessors.push({bufferView:push(nor,34962),componentType:5126,count:g.n.length/3,type:'VEC3'})-1;
    const au=accessors.push({bufferView:push(uv,34962),componentType:5126,count:g.uv.length/2,type:'VEC2'})-1;
    const ai=accessors.push({bufferView:push(idx,34963),componentType:5125,count:g.i.length,type:'SCALAR'})-1;
    const m=part.mat; const key=JSON.stringify(m); let mi=mats.get(key);
    if(mi===undefined){const pbr={baseColorFactor:m.color,metallicFactor:m.metal,roughnessFactor:m.rough};
      if(m.tex){const bv=push(fs.readFileSync(m.tex));images.push({bufferView:bv,mimeType:'image/png'});if(!samplers.length)samplers.push({magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497});textures.push({sampler:0,source:images.length-1});pbr.baseColorTexture={index:textures.length-1};pbr.baseColorFactor=[1,1,1,1];}
      const mm={pbrMetallicRoughness:pbr,doubleSided:true};if(m.alpha<1)mm.alphaMode='BLEND';if(m.emissive)mm.emissiveFactor=m.emissive;
      materials.push(mm);mi=materials.length-1;mats.set(key,mi);}
    meshPrims.push({attributes:{POSITION:ap,NORMAL:an,TEXCOORD_0:au},indices:ai,material:mi});}
  const json={asset:{version:'2.0',generator:'n-street-house build-models'},scene:0,scenes:[{nodes:[0]}],nodes:[{mesh:0,name}],meshes:[{primitives:meshPrims}],materials,accessors,bufferViews,buffers:[{byteLength:off}],...(images.length?{images,textures,samplers}:{})};
  let js=Buffer.from(JSON.stringify(json));js=Buffer.concat([js,Buffer.alloc((4-(js.length%4))%4,0x20)]);
  const bn=Buffer.concat(bin);const total=12+8+js.length+8+bn.length;const h=Buffer.alloc(12);h.writeUInt32LE(0x46546C67,0);h.writeUInt32LE(2,4);h.writeUInt32LE(total,8);
  const jh=Buffer.alloc(8);jh.writeUInt32LE(js.length,0);jh.writeUInt32LE(0x4E4F534A,4);const bh=Buffer.alloc(8);bh.writeUInt32LE(bn.length,0);bh.writeUInt32LE(0x004E4942,4);
  fs.writeFileSync(path.join(OUT,name+'.glb'),Buffer.concat([h,jh,js,bh,bn]));
  let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];for(const a of accessors) if(a.min){for(let k=0;k<3;k++){mn[k]=Math.min(mn[k],a.min[k]);mx[k]=Math.max(mx[k],a.max[k]);}}
  return {w:+(mx[0]-mn[0]).toFixed(3),h:+(mx[1]-mn[1]).toFixed(3),d:+(mx[2]-mn[2]).toFixed(3)};}

// ---------- materials ----------
const OAK=mat('#d6b583',{rough:0.55}), WALNUT=mat('#6b4630',{rough:0.5}), CREAM=mat('#efe6d3',{rough:0.95}), BOUCLE=mat('#f1ebe0',{rough:1}),
  BRASS=mat('#c9a24b',{rough:0.3,metal:1}), CANE=mat('#d7b27a',{rough:0.9}), CANEDARK=mat('#b88a52',{rough:0.9}),
  AMBER=mat('#e3a53c',{rough:0.1,alpha:0.72,emissive:'#ffb347'}), TERRA=mat('#b4623f',{rough:0.95}), GREEN=mat('#4f7a3a',{rough:0.8}), GREEN2=mat('#6a9a4c',{rough:0.8}),
  POT=mat('#b9714f',{rough:0.9}), SHEER=mat('#fbf8f1',{rough:1,alpha:0.5}), DARK=mat('#2b2a28',{rough:0.6}), WARMLIGHT=mat('#fff1d0',{rough:0.5,emissive:'#ffe3a8'});
const out={};
const rec=(id,name,cat,dims,extra={})=>{out[id]={id,name,category:cat,dimensions:[dims.w,dims.h,dims.d],...extra};};

// 1 round pedestal dining table, 1.0 m diameter
{ const p=[]; const top=T(cyl(0.5,0.5,0.04,40),0,0.73,0), ped=T(cyl(0.2,0.12,0.69,28,false,false),0,0.04,0), base=cyl(0.3,0.3,0.04,32);
  rec('round-table','Round pedestal table','furniture',writeGlb('round_table',[{geo:top,mat:OAK},{geo:ped,mat:OAK},{geo:base,mat:OAK},...p]),{tags:['floor','table','dining']}); }

// 2 bentwood dining chair (front faces +z, back at -z)
function chairParts(seatMat,legMat,backMat,ring){
  const parts=[]; const seat=T(cyl(0.22,0.22,0.05,32),0,0.43,0); parts.push({geo:seat,mat:seatMat});
  for(const [x,z,s] of [[-0.17,0.17,0],[0.17,0.17,0],[-0.17,-0.17,1],[0.17,-0.17,1]]){ parts.push({geo:T(cyl(0.014,0.011,0.44,10),x,0,z),mat:legMat}); }
  if(!ring){ parts.push({geo:T(box(0.03,0.40,0.025),-0.17,0.48,-0.2),mat:backMat}); parts.push({geo:T(box(0.03,0.40,0.025),0.17,0.48,-0.2),mat:backMat});
    parts.push({geo:RX(T(box(0.40,0.1,0.02),0,0.78,-0.21),-0.12),mat:backMat}); }
  else { parts.push({geo:T(RX(T(torus(0.2,0.012,30,6),0,0,0),Math.PI/2*0),0,0.7,-0.2),mat:backMat});
    parts.push({geo:T(box(0.022,0.28,0.022),-0.15,0.5,-0.2),mat:legMat}); parts.push({geo:T(box(0.022,0.28,0.022),0.15,0.5,-0.2),mat:legMat}); }
  return parts; }
rec('bentwood-chair','Bentwood chair','furniture',writeGlb('bentwood_chair',chairParts(CREAM,WALNUT,WALNUT,false)),{tags:['floor','seating','dining']});
rec('rattan-chair','Rattan chair','furniture',writeGlb('rattan_chair',chairParts(CANE,CANEDARK,CANE,true)),{tags:['floor','seating','outdoor']});

// 3 curved boucle sofa: 150 degree arc, front (seating side) faces +z
{ const a0=Math.PI*(0.5-150/360-0.0), a1=Math.PI*(0.5+150/360); // arc centred on +z... build around origin then shift
  const parts=[]; const seatArc=arcBlock(0.45,0.98,Math.PI/2-1.3,Math.PI/2+1.3,0.14,0.43,28); // seat mass opens toward +z (angle pi/2 = +z)
  const back=arcBlock(0.78,1.0,Math.PI/2-1.3,Math.PI/2+1.3,0.43,0.78,28);
  const plinth=arcBlock(0.5,0.92,Math.PI/2-1.3,Math.PI/2+1.3,0,0.14,28);
  // flip so the open side faces +z: arc centred at +z means the block bulges toward +z; mirror z so the back is at -z
  const fl=(g)=>g.apply(p=>[p[0],p[1],-p[2]]);
  // after mirroring, the back arc is at -z and the open (concave) side faces +z
  const sh=(g)=>T(fl(g),0,0,0.35);
  parts.push({geo:sh(seatArc),mat:BOUCLE},{geo:sh(back),mat:BOUCLE},{geo:sh(plinth),mat:WALNUT});
  parts.push({geo:T(RY(RZ(box(0.42,0.38,0.12),0.15),-0.2),-0.55,0.58,-0.3),mat:TERRA},{geo:T(RY(RZ(box(0.4,0.36,0.12),-0.1),0.3),-0.18,0.58,-0.45),mat:TERRA});
  rec('curved-sofa','Curved boucle sofa','furniture',writeGlb('curved_sofa',parts),{tags:['floor','seating','sofa']}); }

// 4 globe pendant (amber glass) — bottom at y=0, hangs from y=H (ceiling item)
{ const H=1.1; const parts=[{geo:T(sphere(0.13,24,14),0,0.13,0),mat:AMBER},{geo:T(cyl(0.035,0.035,0.06,16),0,0.255,0),mat:BRASS},{geo:T(cyl(0.004,0.004,H-0.31,8),0,0.315,0),mat:BRASS},{geo:T(cyl(0.05,0.05,0.025,20),0,H-0.025,0),mat:BRASS},
    {geo:T(sphere(0.045,12,8),0,0.13,0),mat:WARMLIGHT}];
  rec('globe-pendant','Amber globe pendant','furniture',writeGlb('globe_pendant',parts),{tags:['ceiling','light'],attachTo:'ceiling'}); }
// 5 brass dome pendant
{ const H=1.15; const parts=[{geo:T(RX(sphere(0.23,32,10,0,Math.PI/2),Math.PI),0,0.2,0),mat:BRASS},{geo:T(sphere(0.06,12,8),0,0.07,0),mat:WARMLIGHT},{geo:T(cyl(0.012,0.012,0.08,10),0,0.2,0),mat:BRASS},{geo:T(cyl(0.004,0.004,H-0.28,8),0,0.28,0),mat:BRASS},{geo:T(cyl(0.05,0.05,0.025,20),0,H-0.025,0),mat:BRASS}];
  rec('dome-pendant','Brass dome pendant','furniture',writeGlb('dome_pendant',parts),{tags:['ceiling','light'],attachTo:'ceiling'}); }
// 6 oak bar stool
{ const parts=[{geo:T(cyl(0.17,0.17,0.04,24),0,0.64,0),mat:OAK}]; for(const [x,z] of [[-1,-1],[1,-1],[-1,1],[1,1]]){ parts.push({geo:T(RZ(RX(cyl(0.014,0.012,0.66,8),z*0.1),-x*0.1),x*0.13,0,z*0.13),mat:OAK}); } parts.push({geo:T(RX(torus(0.14,0.01,24,6),Math.PI/2),0,0.3,0),mat:OAK});
  rec('oak-stool','Oak stool','furniture',writeGlb('oak_stool',parts),{tags:['floor','seating']}); }
// 7 potted monstera
{ const parts=[{geo:cyl(0.17,0.13,0.28,20),mat:POT},{geo:T(cyl(0.165,0.165,0.02,20),0,0.27,0),mat:mat('#3a2a1f')}];
  for(let k=0;k<9;k++){ const a=k/9*2*Math.PI, r=0.12+((k*37)%5)*0.03; const leaf=T(RY(RZ(RX(sphere(0.16,12,8),0),0.3),a),Math.cos(a)*r,0.55+((k*13)%7)*0.07,Math.sin(a)*r); leaf.apply(p=>[p[0],p[1],p[2]]);
    // flatten leaf: scale y
    const base=[Math.cos(a)*r,0.55+((k*13)%7)*0.07,Math.sin(a)*r]; leaf.apply(p=>[p[0],base[1]+(p[1]-base[1])*0.35,p[2]]); parts.push({geo:leaf,mat:k%2?GREEN:GREEN2});
    parts.push({geo:T(RZ(cyl(0.008,0.008,0.3,6),0.0),Math.cos(a)*r*0.5,0.28,Math.sin(a)*r*0.5),mat:GREEN}); }
  rec('monstera','Potted plant','furniture',writeGlb('monstera',parts),{tags:['floor','plant']}); }
// 8 sheer curtain panel (hangs from y=2.4)
{ const parts=[{geo:T(box(0.62,2.35,0.03),0,1.175,0),mat:SHEER},{geo:T(RZ(cyl(0.012,0.012,0.7,10),Math.PI/2),0.35,2.42,0),mat:BRASS}];
  rec('sheer-curtain','Sheer curtain panel','furniture',writeGlb('sheer_curtain',parts),{tags:['floor','decor']}); }
// 9 woven rug with pattern (texture built by make-rug-texture.py)
{ const tex=path.join(OUT,'rug_persian.png'); const parts=[{geo:T(box(2.4,0.015,1.7),0,0.0075,0),mat:mat('#ffffff',{rough:1,tex:fs.existsSync(tex)?tex:null})}];
  rec('persian-rug','Patterned rug','furniture',writeGlb('persian_rug',parts),{tags:['floor','rug']}); }
// 10 wall sconce (brass dome on a bracket); mounts on the wall at the item's back (-z)
{ const parts=[{geo:T(RX(sphere(0.1,20,8,0,Math.PI/2),-Math.PI/2),0,0,0.14),mat:BRASS},{geo:T(box(0.02,0.02,0.12),0,0.0,0.06),mat:BRASS},{geo:T(box(0.06,0.12,0.015),0,0,0.01),mat:BRASS},{geo:T(sphere(0.03,10,6),0,0,0.17),mat:WARMLIGHT}];
  rec('brass-sconce','Brass wall sconce','furniture',writeGlb('brass_sconce',parts.map(p=>({geo:T(p.geo,0,0.1,0),mat:p.mat}))),{tags:['wall','light']}); }
// 11 olive-green wall niche shelf bracket set not needed. 12 planter trellis with tomatoes (backyard)
{ const parts=[]; for(const x of [-0.45,0,0.45]) parts.push({geo:T(cyl(0.008,0.008,1.6,6),x,0,0),mat:CANEDARK}); parts.push({geo:T(box(1.0,0.01,0.01),0,1.1,0),mat:CANEDARK},{geo:T(box(1.0,0.01,0.01),0,0.6,0),mat:CANEDARK});
  for(let k=0;k<22;k++){ const x=((k*53)%100)/100-0.5, y=0.1+((k*29)%100)/100*1.3; parts.push({geo:T(sphere(0.07+((k*7)%4)*0.012,10,6),x*0.9,y,0.02+((k%3)-1)*0.04),mat:k%5==0?TERRA:(k%2?GREEN:GREEN2)}); }
  rec('tomato-trellis','Tomato trellis','outdoor',writeGlb('tomato_trellis',parts),{tags:['floor','plant','outdoor']}); }
fs.writeFileSync(path.join(OUT,'models.json'),JSON.stringify(out,null,1));
console.log(Object.values(out).map(o=>`${o.id} ${o.dimensions.join('x')}`).join('\n'));
