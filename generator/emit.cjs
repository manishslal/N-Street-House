// Emits a Pascal scene envelope for one layout ('exist' | 'prop') from Bethan's geometry.
const fs=require('fs');
const {levelWalls,FT,FH,r3}=require('./plan.cjs');
const HALL=require('./hall.cjs');
const FURN=require('./furniture.cjs');
const FIN=require('./finish.cjs');
const MODEL_BASE=process.env.MODEL_BASE||'http://localhost:8765';
const resolveAsset=(u)=>u.startsWith('@models/')?`${MODEL_BASE}/${u.slice(8)}`:(process.env.ASSET_BASE||'')+u;
const CATALOG=Object.fromEntries(require('./catalog.json').map(a=>[a.id,a]));
const D=34; // plan z (front=0) is flipped to Pascal Z so the house keeps its handedness (x east, front faces south)
const m=(v)=>Math.round(v*FT*10000)/10000;
const P=(x,z)=>[m(x),m(D-z)];
const R=FH/15; // riser, ft
const LEVEL_H=m(FH);

function zonesFor(layout,floor){
  const Z=(name,pts,role='room')=>({name,pts,role});
  if(floor==='main'){
    const common=[
      Z('Kitchen',[[7.3,12.35],[15,12.35],[15,21.6],[7.3,21.6]]),
      Z('Dining',[[7.1,21.95],[15,21.95],[15,32.7],[3.65,32.7],[3.65,23.9],[7.1,23.9]]),
      Z('Powder',[[0,18.6],[5.1,18.6],[5.1,20.3],[3.3,20.3],[3.3,23.9],[0,23.9]]),
      Z('Hall',[[5.45,12.35],[7.1,12.35],[7.1,21.95],[5.45,21.95]]),
      Z('Pantry',[[3.65,20.65],[5.1,20.65],[5.1,23.55],[3.65,23.55]]),
      Z('Laundry',[[0,24.2],[3.3,24.2],[3.3,28.8],[0,28.8]]),
      Z('Utility',[[0,29.2],[3.3,29.2],[3.3,32.7],[0,32.7]]),
    ];
    if(layout==='exist') return [
      Z('Entry',[[0,0],[2.6,0],[2.6,3.04],[0,3.04]]),
      Z('Living room',[[2.6,0],[15,0],[15,12],[2.6,12]]),
      Z('Stairs up',[[0,3.04],[2.23,3.04],[2.23,12],[0,12]]),
      Z('Coat closet',[[1.75,12.4],[5.1,12.4],[5.1,14.8],[1.75,14.8]]),
      Z('Storage (under stairs)',[[1.4,15.1],[5.1,15.1],[5.1,18.2],[1.4,18.2]]),
      ...common];
    return [
      Z('Entry',[[0,0],[3,0],[3,3.25],[0,3.25]]),
      Z('Living room',[[3,0],[15,0],[15,12],[3.35,12],[3.35,3.25],[3,3.25]]),
      Z('Stairs up',[[0,3.25],[3,3.25],[3,12],[0,12]]),
      Z('Stair landing',[[0,12],[5.45,12],[5.45,15],[0,15]]),
      Z('Storage closet',[[2.55,15.35],[5.1,15.35],[5.1,18.2],[2.55,18.2]]),
      ...common];
  }
  const common=[
    Z('Walk-in',[[0,0],[4.6,0],[4.6,6.0],[0,6.0]]),
    Z('En suite',[[9.7,12.35],[15,12.35],[15,17.35],[9.7,17.35]]),
    Z('Shower bath',[[9.7,17.7],[15,17.7],[15,22.85],[9.7,22.85]]),
    Z('Closet',[[11.6,23.2],[15,23.2],[15,25.2],[11.6,25.2]]),
    Z('Bedroom 3',[[7.35,23.2],[11.25,23.2],[11.25,25.55],[15,25.55],[15,32.7],[7.35,32.7]]),
  ];
  if(layout==='exist') return [
    Z('Primary bedroom',[[4.95,0],[15,0],[15,12],[3.3,12],[3.3,6.35],[4.95,6.35]]),
    Z('Stair opening',[[0,6.35],[3.3,6.35],[3.3,12],[0,12]],'generic'),
    Z('Stairs arrive here',[[0,12],[3.3,12],[3.3,15.25],[0,15.25]]),
    Z('Towel closet',[[3.65,12.35],[5.65,12.35],[5.65,14.9],[3.65,14.9]]),
    Z('Landing / hall',[[0,15.25],[6,15.25],[6,12.35],[9.35,12.35],[9.35,22.85],[0,22.85]]),
    Z('Closet (Bedroom 2)',[[0,23.2],[3.2,23.2],[3.2,25.3],[0,25.3]]),
    Z('Bedroom 2',[[3.55,23.2],[7.0,23.2],[7.0,32.7],[0,32.7],[0,25.65],[3.55,25.65]]),
    ...common];
  return [
    Z('Primary bedroom',[[4.95,0],[15,0],[15,12],[3.35,12],[3.35,6.35],[4.95,6.35]]),
    Z('Stair opening',[[0,6.35],[3,6.35],[3,12],[5.45,12],[5.45,15],[0,15]],'generic'),
    Z('Hall',[[5.45,12.35],[9.35,12.35],[9.35,22.85],[6.0,22.85],[6.0,15],[5.45,15]]),
    Z('Bedroom 2 closet',[[0,15.35],[3.4,15.35],[3.4,17.4],[0,17.4]]),
    Z('Linen',[[3.75,15.35],[5.65,15.35],[5.65,17.4],[3.75,17.4]]),
    Z('Bedroom 2 (extended)',[[0,17.75],[5.65,17.75],[5.65,23.2],[7.0,23.2],[7.0,32.7],[0,32.7]]),
    ...common];
}


// Eye-level saved cameras per room (feet, Bethan plan coords). Hand-tuned entries mirror her named views.
const EYE=5.3;
const CAM_OVERRIDE={
  'main:Entry':{pos:[1.6,EYE,0.7],tgt:[1.5,EYE+0.1,7]},
  'main:Living room':{pos:[12.8,EYE,1.6],tgt:[3,4,10]},
  'main:Stairs up':{pos:[2.6,5.4,1.2],tgt:[1.2,9.5,10.5]},
  'main:Stair landing':{pos:[0.9,12.0,12.3],tgt:[4.4,11.2,13.5]},
  'main:Kitchen':{pos:[7.8,EYE,21.0],tgt:[13,3,15]},
  'main:Dining':{pos:[11.5,EYE,22.6],tgt:[8.5,3,30.5]},
  'upper:Hall':{pos:[8.2,EYE,22.0],tgt:[6.8,3.5,13.5]},
  'upper:Stair opening':{pos:[6.9,EYE,14.2],tgt:[2.3,1.5,10.5]},
  'upper:Primary bedroom':{pos:[5.5,EYE,11.5],tgt:[12,2,6]},
  'upper:Bedroom 2 (extended)':{pos:[1.0,EYE,18.3],tgt:[4,3.2,27]},
  'upper:Bedroom 3':{pos:[7.7,EYE,23.6],tgt:[12,3,29.5]},
};
function cameraFor(floor,z){
  const o=CAM_OVERRIDE[floor+':'+z.name];
  const base=floor==='upper'?FH:0;
  const W=(p)=>[m(p[0]),r3((base+p[1])*FT),m(D-p[2])];
  if(o) return {position:W(o.pos),target:W(o.tgt),mode:'perspective'};
  // small rooms: high-angle "dollhouse" view from the front, over the 8 ft walls, aimed at the room centre
  const xs=z.pts.map(p=>p[0]), zs=z.pts.map(p=>p[1]);
  const cx=(Math.min(...xs)+Math.max(...xs))/2, cz=(Math.min(...zs)+Math.max(...zs))/2;
  return {position:W([cx,17,cz-6]),target:W([cx,1.5,cz]),mode:'perspective'};
}

function slabFor(layout,floor){
  const outer=[[0,0],[15,0],[15,32.7],[0,32.7]];
  if(floor==='main') return {outer,holes:[]};
  if(layout==='exist') return {outer,holes:[[[0,6.35],[3.3,6.35],[3.3,12],[0,12]]]};
  return {outer,holes:[[[0,6.35],[3,6.35],[3,12],[5.45,12],[5.45,15],[0,15]]]};
}

// which Pascal rail side ('left'|'right') lands on the plan's west wall / south (front-ward) edge for the stair yaw used
const RAIL_WEST=process.env.RAIL_WEST||'left', RAIL_SOUTH=process.env.RAIL_SOUTH||'right';
function stairsFor(layout){
  const yaw=(a)=>a;
  const out=[];
  const flight=(id,name,origin,y,rot,width,len,rise,steps,seg='stair',extra={})=>({id,name,origin,y,rot,width,len,rise,steps,seg,...extra});
  if(layout==='exist'){
    out.push(flight('a','Existing stair',[2.23/2,3.04],0,Math.PI,2.23,14*(8.96/14),14*R,14,'stair',{from:true,rail:RAIL_WEST}));
  } else {
    out.push(flight('a','Stair, lower run',[1.5,3.25],0,Math.PI,3,11*0.875,11*R,11,'stair',{from:true,rail:RAIL_WEST}));
    out.push(flight('b','Stair landing',[1.5,3.25+11*0.875],11*R,Math.PI,3,15-(3.25+11*0.875),0,0,'landing',{rail:RAIL_WEST}));
    out.push(flight('c','Stair, upper run',[3,13.5],11*R,Math.PI/2,3,2.45,3*R,3,'stair',{rail:RAIL_SOUTH}));
  }
  return out;
}

function build(layout){
  FIN.setLayout(layout);
  const nodes={}; const add=(n)=>{nodes[n.id]=n; return n;};
  const site=add({object:'node',id:'site_main',type:'site',parentId:null,children:['building_main'],
    polygon:{type:'polygon',points:[[-2,-8],[6.6,-8],[6.6,14.5],[-2,14.5]]},metadata:{}});
  const bld=add({object:'node',id:'building_main',type:'building',parentId:site.id,children:['level_0','level_1'],metadata:{}});
  const L0=add({object:'node',id:'level_0',type:'level',parentId:bld.id,level:0,baseElevation:FIN.GROUND_DROP,height:LEVEL_H,name:'Main floor',children:[],metadata:{}});
  const L1=add({object:'node',id:'level_1',type:'level',parentId:bld.id,level:1,baseElevation:0,height:LEVEL_H,name:'Upper floor',children:[],metadata:{}});
  const lv={main:L0,upper:L1};
  for(const floor of ['main','upper']){
    const L=lv[floor]; const name=`${floor}_${layout==='exist'?'exist':'prop'}`;
    // walls
    let wn=0;
    for(const w of levelWalls(name)){
      if(floor==='main'){ // widen the hall (see hall.cjs); keep openings at the same absolute x on walls whose start moved
        const ox=w.start[0], dir=Math.sign(w.end[0]-w.start[0])||1, horiz=Math.abs(w.start[1]-w.end[1])<1e-6;
        const nsx=HALL.mapX(w.start[0]), nex=HALL.mapX(w.end[0]);
        if(horiz&&w.openings) for(const o of w.openings){ const a0=ox+dir*o.u0, a1=ox+dir*o.u1; const n0=dir*(a0-nsx), n1=dir*(a1-nsx); o.u0=Math.min(n0,n1); o.u1=Math.max(n0,n1); }
        w.start=[nsx,w.start[1]]; w.end=[nex,w.end[1]];
      }
      wn++; const id=`wall_${floor[0]}${wn}`;
      const len=Math.hypot(w.end[0]-w.start[0],w.end[1]-w.start[1])*FT;
      const exterior=w.thickness>=0.5;
      const height=exterior&&floor==='main'?LEVEL_H:m(w.height);
      const wall=add({object:'node',id,type:'wall',parentId:L.id,start:P(...w.start),end:P(...w.end),thickness:m(w.thickness),height,children:[],metadata:{isNew:!!w.isNew,half:!!w.half},frontSide:'unknown',backSide:'unknown'});
      const along=Math.abs(w.start[1]-w.end[1])<1e-6?'x':'z', cc=along==='x'?w.start[1]:w.start[0];
      wall.name=w.isNew?'New wall (proposed)':w.half?'Half wall':exterior
        ?(along==='x'?(cc<10?'Front wall':'Rear wall'):(cc<5?'West party wall':'East party wall')):'Interior wall';
      wall.slots=FIN.wallSlots();
      [wall.frontSide,wall.backSide]=FIN.wallSides(wall);
      FIN.wallFinish(wall,w);                                                     // accent wall + marble splash (proposed only)
      if(exterior&&floor==='main') wall.fillToTerrain=true;                       // the main floor sits above the yard; close the walls down to grade
      L.children.push(id);
      let on=0;
      for(const o of w.openings){
        on++;
        const width=(o.u1-o.u0)*FT, cx=((o.u0+o.u1)/2)*FT;
        if(o.kind==='window'){
          const sill=o.sill*FT, hgt=(o.head-o.sill)*FT;
          const wid=`window_${floor[0]}${wn}_${on}`;
          add({object:'node',id:wid,type:'window',name:(wall.name==='Interior wall'?'Pass-through':'Window'),parentId:id,wallId:id,position:[r3(cx),r3(sill+hgt/2),0],rotation:[0,0,0],width:r3(width),height:r3(hgt),windowType:'fixed',metadata:{}});
          wall.children.push(wid);
        } else {
          const hgt=Math.min(o.kind==='gap'?w.height*FT:o.head*FT, height-0.001);
          const cased=o.kind==='gap'||o.kind==='arch';
          const did=`door_${floor[0]}${wn}_${on}`;
          add({object:'node',id:did,type:'door',name:(cased?'Opening':(wall.name==='Front wall'?'Front door':wall.name==='Rear wall'?'Rear door':'Door')),parentId:id,wallId:id,position:[r3(cx),r3(hgt/2),0],rotation:[0,0,0],width:r3(width),height:r3(hgt),
            openingKind:cased?'opening':'door',...(!cased&&width>1.15?{doorType:'double'}:{}),metadata:{}});
          wall.children.push(did);
        }
      }
    }
    // slab
    const s=slabFor(layout,floor);
    const rooms=FIN.floorRooms(floor), thick=floor==='main'?0.1:m(FH-8);
    const allHoles=[...s.holes,...rooms.map(r=>r.pts)];
    const slab=add({object:'node',id:`slab_${floor[0]}`,type:'slab',name:floor==='main'?'Main floor (wood)':'Upper floor (wood)',parentId:L.id,polygon:s.outer.map(p=>P(...p)),holes:allHoles.map(h=>h.map(p=>P(...p))),
      holeMetadata:allHoles.map(()=>({source:'manual'})),elevation:0.01,thickness:thick,slots:{surface:FIN.baseFloor(floor),side:'library:preset-lightgrey'},metadata:{}});
    L.children.push(slab.id);
    rooms.forEach((r,i)=>{ const rid=`slab_${floor[0]}_room${i+1}`;
      add({object:'node',id:rid,type:'slab',name:r.name,parentId:L.id,polygon:r.pts.map(p=>P(...p)),holes:[],holeMetadata:[],elevation:0.01,thickness:thick,slots:{surface:r.surface,side:'library:preset-lightgrey'},metadata:{}});
      L.children.push(rid); });
    // ceiling at the wall-top height; the main-floor ceiling is open over the stairwell
    const cl=add({object:'node',id:`ceiling_${floor[0]}`,type:'ceiling',parentId:L.id,name:floor==='main'?'Main floor ceiling':'Upper floor ceiling',
      polygon:s.outer.map(p=>P(...p)),holes:floor==='main'?s.holes.map(h=>h.map(p=>P(...p))):[],height:m(8),children:[],slots:{surface:'library:preset-softwhite'},metadata:{}});
    L.children.push(cl.id);
    // zones
    zonesFor(layout,floor).forEach((z,i)=>{
      const id=`zone_${floor[0]}${i+1}`;
      add({object:'node',id,type:'zone',parentId:L.id,name:z.name,polygon:z.pts.map(p=>P(...(floor==='main'?HALL.mapPt(p):p))),spaceRole:z.role,camera:cameraFor(floor,z),metadata:{}});
      L.children.push(id);
    });
  }
  // stairs on the main level
  const segs=[];
  for(const f of stairsFor(layout)){
    const sid=`stair_${f.id}`, gid=`sseg_${f.id}`;
    const st=add({object:'node',id:sid,type:'stair',parentId:L0.id,name:f.name,position:[m(f.origin[0]),r3(f.y*FT),m(D-f.origin[1])],rotation:f.rot,
      stairType:'straight',fromLevelId:f.from?'level_0':null,toLevelId:f.from?'level_1':null,slabOpeningMode:'none',width:m(f.width),
      totalRise:r3(f.rise*FT),stepCount:Math.max(f.steps,1),thickness:0.25,fillToFloor:true,railingMode:f.rail||'none',railingHeight:0.92,children:[gid],metadata:{}});
    add({object:'node',id:gid,type:'stair-segment',parentId:sid,segmentType:f.seg,width:m(f.width),length:m(f.len),height:r3(f.rise*FT),stepCount:f.seg==='landing'?0:f.steps,
      attachmentSide:'front',fillToFloor:true,thickness:f.seg==='landing'?0.32:0.25,metadata:{}});
    L0.children.push(sid);
  }

  FIN.kitchen({add,L0});
  FIN.yard({add,L0});
  FIN.details({add,L0});

  // furniture from the built-in catalog (floor items are children of their level)
  for(const floor of ['main','upper','yard']){
    const L=floor==='upper'?L1:L0; let n=0; const yOff=floor==='yard'?-FIN.GROUND_DROP:0;
    for(const [id,cx,cz,yaw,fit] of FURN[floor]){
      if(fit&&fit.only&&fit.only!==layout) continue;
      if(process.env.NOLIGHT&&CATALOG[id]&&CATALOG[id].attachTo==='ceiling') continue;
      const a=CATALOG[id]; if(!a) throw new Error('unknown catalog item '+id);
      n++; const [dw,dh,dd]=a.dimensions; let sc=[1,1,1];
      if(fit&&fit.scale){ sc=[fit.scale,fit.scale,fit.scale]; }
      else if(fit&&fit.w&&fit.d){ // non-rotated footprint in item space: w along local x, d along local z (feet -> metres)
        const sx=(fit.w*FT)/dw, sz=(fit.d*FT)/dd; const u=fit.byWidth?sx:Math.min(sx,sz);
        // keep proportions unless the catalog piece is far off (tables/counters/rugs are stretched, everything else scales uniformly)
        sc=(id==='kitchen-counter'||id==='dining-table'||id==='tv-stand'||id==='closet'||id==='rectangular-carpet')?[r3(sx),id==='rectangular-carpet'?1:1,r3(sz)]:[r3(u),r3(u),r3(u)];
      }
      // keep the footprint inside the house shell (centre-placed pieces can poke a few cm into a wall)
      const hw=Math.abs(Math.cos(yaw))*dw*sc[0]/2+Math.abs(Math.sin(yaw))*dd*sc[2]/2, hd=Math.abs(Math.sin(yaw))*dw*sc[0]/2+Math.abs(Math.cos(yaw))*dd*sc[2]/2;
      const free=floor==='yard'||(fit&&fit.free);
      const px=free?m(cx):Math.min(Math.max(m(cx),hw),15*FT-hw), pz=free?m(D-cz):Math.min(Math.max(m(D-cz),(D-32.7)*FT+hd),D*FT-hd);
      const nid=`item_${floor==='yard'?'y':floor[0]}${n}`;
      const ceil=a.attachTo==='ceiling'; const host=ceil?nodes[`ceiling_${floor[0]}`]:L;
      const py=ceil?(a.recessed?0:-r3(dh*sc[1])):r3(yOff+((fit&&fit.y)||0));
      const extra={}; for(const k of ['attachTo','recessed','interactive','surface']) if(a[k]!==undefined) extra[k]=a[k];
      add({object:'node',id:nid,type:'item',parentId:host.id,name:a.name,position:[r3(px),py,r3(pz)],rotation:[0,yaw,0],scale:sc,
        asset:{id:a.id,category:a.category,name:a.name,thumbnail:resolveAsset(a.thumbnail),src:resolveAsset(a.src),dimensions:a.dimensions,offset:a.offset||[0,0,0],rotation:a.rotation||[0,0,0],scale:a.scale||[1,1,1],tags:a.tags,...extra},children:[],metadata:{}});
      host.children.push(nid);
    }
  }
  // walkthrough start: just inside the front door, facing into the house
  add({object:'node',id:'spawn_entry',type:'spawn',parentId:L0.id,name:'Front door',position:[P(...(process.env.SPAWN_XZ||'1.6,1.4').split(',').map(Number))[0],0,P(...(process.env.SPAWN_XZ||'1.6,1.4').split(',').map(Number))[1]],rotation:parseFloat(process.env.SPAWN_YAW||String(0)),metadata:{}});
  L0.children.push('spawn_entry');
  require('./swing.cjs').chooseSwings(nodes);   // hang every hinged door so it opens into free space
  return {nodes,rootNodeIds:[site.id],collections:{},materials:FIN.sceneMaterials(),installedPlugins:[]};
}
module.exports={build};
if(require.main===module){
  const outDir=process.env.OUT_DIR||'../scenes'; fs.mkdirSync(outDir,{recursive:true});
  for(const [layout,file] of [['exist','house-existing.json'],['prop','house-proposed.json']]){
    const g=build(layout); fs.writeFileSync(`${outDir}/${file}`,JSON.stringify(g,null,1));
    const t={}; Object.values(g.nodes).forEach(n=>t[n.type]=(t[n.type]||0)+1); console.log(file,JSON.stringify(t));
  }
}
