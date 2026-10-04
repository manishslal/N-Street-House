// Finishes, kitchen cabinetry and backyard (assumptions flagged in names where not measured).
// Palette comes from the owners' first-floor reference renders: warm white walls, terracotta accent,
// sage shaker cabinets, marble tops, brass hardware, wood floors, terrazzo kitchen floor, cedar fence.
const HALL=require('./hall.cjs');
const FT=0.3048, D=34;
const m=(v)=>Math.round(v*FT*10000)/10000;
const r3=(v)=>Math.round(v*1000)/1000;
const P=(x,z)=>[m(x),m(D-z)];

// How far the main floor sits above the yard. ASSUMED from the photos (about 7 risers of 7.5 in); measure on site.
const GROUND_DROP=1.34; // metres

const MAT={
  wood:'library:wood-woodplank48', terrazzo:'library:flooring-tile79', bathTile:'library:flooring-lightceramic24',
  marble:'library:flooring-statuarettowhite', sage:'library:preset-sage', brass:'library:metal-brass',
  terracotta:'scene:mat_terracotta', cream:'library:preset-cream', white:'scene:mat_white',
  concrete:'library:concrete-polished', cedar:'#c8a165', lawn:'library:preset-forest', soil:'library:preset-espresso',
  steel:'library:preset-midgrey', olive:'scene:mat_olive', walnut:'scene:mat_walnut', stainless:'#b9bcc0', plaster:'scene:mat_plaster', gravel:'scene:mat_gravel', stone:'scene:mat_stone', pillowOlive:'library:preset-olive', pillowSage:'library:preset-sage', pillowBlush:'library:preset-cream', siding:'scene:mat_siding',
};

// Existing house as photographed (walkthrough frames): dark grey plank floor, beige vinyl tile and brown wood cabinets with
// black marble-look tops in the kitchen, brown/beige vinyl in the powder room, bare plywood subfloor upstairs, grey plank in the baths.
const EXIST={base:{main:'scene:mat_dark_plank',upper:'scene:mat_plywood'},kitchenFloor:'library:flooring-tile20',powder:'scene:mat_powder_vinyl',bath:'scene:mat_bath_grey',
  cab:'scene:mat_exist_cab',top:'scene:mat_black_top',hw:'library:metal-brass'};
// Flat paint colours as scene materials (library:preset-white is the unpainted-drywall texture: grey with white dots).
// Wall colours are read from the walkthrough photos: warm white, slightly cream.
const PAINT={
  mat_wall:{name:'Wall paint (warm white)',color:'#fffaf0',roughness:0.92},
  mat_trim:{name:'Trim (white)',color:'#f8f6f0',roughness:0.6},
  mat_ceiling:{name:'Ceiling (white)',color:'#f6f4ef',roughness:0.95},
  mat_siding:{name:'Vinyl siding (beige)',color:'#d6cbb3',roughness:0.8},
  mat_white:{name:'White',color:'#f4f1ea',roughness:0.7},
  mat_terracotta:{name:'Terracotta paint',color:'#d4805a',roughness:0.92},
  mat_olive:{name:'Olive paint',color:'#86915a',roughness:0.92},
  mat_plaster:{name:'Plaster',color:'#f1ece1',roughness:0.95},
  mat_dark_plank:{name:'Dark grey plank floor (existing)',color:'#4a4850',roughness:0.6},
  mat_plywood:{name:'Plywood subfloor (existing)',color:'#c49a6a',roughness:0.9},
  mat_powder_vinyl:{name:'Brown vinyl (existing powder room)',color:'#8c7b69',roughness:0.7},
  mat_bath_grey:{name:'Grey plank (existing baths)',color:'#8d8d90',roughness:0.6},
  mat_exist_cab:{name:'Brown wood cabinets (existing)',color:'#8a5a2b',roughness:0.6},
  mat_black_top:{name:'Black marble-look top (existing)',color:'#1d1d20',roughness:0.3},
  mat_walnut:{name:'Walnut',color:'#6b4630',roughness:0.5},
  mat_gravel:{name:'Gravel',color:'#b8b1a4',roughness:1},
  mat_stone:{name:'Stepping stone',color:'#c9c4b8',roughness:0.95},
  mat_lavender:{name:'Lavender paint',color:'#cdb4d8',roughness:0.92},
};
const sceneMaterials=()=>Object.fromEntries(Object.entries(PAINT).map(([id,m])=>[id,{id,name:m.name,material:{preset:'custom',properties:{color:m.color,roughness:m.roughness,metalness:0,opacity:1,transparent:false,side:'front'}}}]));
let LAYOUT='prop';
function setLayout(l){LAYOUT=l;}
const isExist=()=>LAYOUT==='exist';
function baseFloor(floor){return isExist()?EXIST.base[floor]:MAT.wood;}

// ---- floors: room-specific finishes cut out of the base wood slab (rectangles in plan feet)
function floorRooms(floor){
  const rs=floorRoomsRaw(floor);
  return floor==='main'?rs.map(r=>({...r,pts:r.pts.map(HALL.mapPt)})):rs;
}
function floorRoomsRaw(floor){
  if(isExist()){
    if(floor==='main') return [
      {name:'Kitchen floor',pts:[[7.3,12.35],[15,12.35],[15,21.6],[7.3,21.6]],surface:EXIST.kitchenFloor},
      {name:'Powder room floor',pts:[[0,18.6],[3.3,18.6],[3.3,23.9],[0,23.9]],surface:EXIST.powder},
    ];
    return [
      {name:'En suite floor',pts:[[9.7,12.35],[15,12.35],[15,17.35],[9.7,17.35]],surface:EXIST.bath},
      {name:'Shower bath floor',pts:[[9.7,17.7],[15,17.7],[15,22.85],[9.7,22.85]],surface:EXIST.bath},
    ];
  }
  if(floor==='main') return [
    {name:'Kitchen floor',pts:[[7.3,12.35],[15,12.35],[15,21.6],[7.3,21.6]],surface:MAT.terrazzo},
    {name:'Powder room floor',pts:[[0,18.6],[3.3,18.6],[3.3,23.9],[0,23.9]],surface:MAT.bathTile},
  ];
  return [
    {name:'En suite floor',pts:[[9.7,12.35],[15,12.35],[15,17.35],[9.7,17.35]],surface:MAT.bathTile},
    {name:'Shower bath floor',pts:[[9.7,17.7],[15,17.7],[15,22.85],[9.7,22.85]],surface:MAT.bathTile},
  ];
}

// ---- kitchen: parametric Pascal cabinets (positions in plan feet, Pascal yaw convention)
function kitchen({add,L0}){
  const out=[];
  let n=0;
  const slots=isExist()?{front:EXIST.cab,carcass:EXIST.cab,plinth:EXIST.cab,countertop:EXIST.top,hardware:EXIST.hw}
    :{front:MAT.sage,carcass:MAT.sage,plinth:MAT.sage,countertop:MAT.marble,hardware:MAT.brass};
  const run=(name,tier,origin,yaw,len,depth,mods,extra={})=>{
    n++; const id=`cabinet_k${n}`;
    const y=extra.y||0;
    const SL={...(extra.slots||slots),...(extra.appliance?{appliance:extra.appliance}:{})};
    const kids=[]; let x=0;
    mods.forEach((md,i)=>{
      const mid=`cabinet-module_k${n}_${i+1}`; const w=md.w;
      add({object:'node',id:mid,type:'cabinet-module',parentId:id,cabinetType:tier==='tall'?'tall':'base',
        position:[r3(x+w/2),tier==='base'?0.1:0,0],rotation:0,width:r3(w),depth,carcassHeight:extra.carcass||(tier==='base'?0.8:0.8),
        frontStyle:'shaker',handleStyle:'knob',withCountertop:tier==='base',slots:SL,stack:md.stack.map((s,j)=>({id:`k${n}m${i}c${j}`,...s})),metadata:{}});
      kids.push(mid); x+=w;
    });
    add({object:'node',id:id,type:'cabinet',name,parentId:L0.id,runTier:tier,position:[m(origin[0]),y,m(D-origin[1])],rotation:yaw,
      width:r3(len),depth,carcassHeight:extra.carcass||0.8,frontStyle:'shaker',handleStyle:'knob',withCountertop:tier==='base',slots:SL,children:kids,metadata:{}});
    L0.children.push(id); out.push(id);
  };
  const d=0.61, PI=Math.PI;
  // south run under the pass-through window (west -> east: dishwasher, double sink, drawers); yaw pi so local +x runs west from the east end
  run('Kitchen sink run','base',[15,13.35],PI,2.0,d,[
    {w:0.45,stack:[{type:'drawer',drawerCount:3}]},
    {w:1.0,stack:[{type:'sink',sinkLayout:'double'},{type:'door',doorType:'double'}]},
    {w:0.55,stack:[{type:'dishwasher'}]},
  ],{appliance:isExist()?'library:preset-white':'library:preset-sage'});
  // east run: range then base cabinet (yaw -pi/2: local +x runs south from the north end)
  run('Kitchen range run','base',[14.0,19.6],-PI/2,1.6,d,[
    {w:0.76,stack:[{type:'cooktop-gas',cooktopLayout:'gas-4burner'},{type:'oven'}]},
    {w:0.84,stack:[{type:'door',doorType:'double'}]},
  ],{appliance:isExist()?'library:preset-nearblack':'library:preset-cream'});
  // north run
  run('Kitchen north run','base',[10.5,20.6],0,1.35,d,[
    {w:0.45,stack:[{type:'door',doorType:'double'}]},
    {w:0.45,stack:[{type:'drawer',drawerCount:3}]},
    {w:0.45,stack:[{type:'door',doorType:'single-left'}]},
  ]);
  // fridge
  run('Kitchen refrigerator','tall',[HALL.mapX(7.35),20.45],0,0.655,0.7,[
    {w:0.655,stack:[{type:'fridge-double'}]},
  ],{carcass:1.8,appliance:isExist()?'library:preset-nearblack':'library:metal-polished'});
  // upper glass-front cabinets over the north run
  run('Kitchen upper cabinets','wall',[10.5,21.025],0,1.35,0.35,[
    {w:0.45,stack:[{type:'door',doorType:'glass'}]},
    {w:0.45,stack:[{type:'door',doorType:'glass'}]},
    {w:0.45,stack:[{type:'door',doorType:'glass'}]},
  ],{y:1.45,carcass:0.762});
  // range hood (proposed: smooth plaster hood as a slab box, built in details())
  if(isExist()) run('Range hood','wall',[14.18,19.6],-PI/2,0.76,0.5,[
    {w:0.76,stack:[{type:'hood-pyramid'}]},
  ],{y:1.5,carcass:0.7});
  if(!isExist()){
    // dining sideboard against the terracotta east wall (plan z 28.6 -> 22.6), echoing the render's built-in
    run('Dining sideboard','base',[14.25,28.6],-PI/2,1.83,0.45,[
      {w:0.61,stack:[{type:'door',doorType:'single-left'}]},
      {w:0.61,stack:[{type:'drawer',drawerCount:3}]},
      {w:0.61,stack:[{type:'door',doorType:'single-right'}]},
    ],{slots:{front:MAT.walnut,carcass:MAT.walnut,plinth:MAT.walnut,countertop:MAT.walnut,hardware:MAT.brass}});
  }
  return out;
}

// ---- backyard, deck, stairs, front steps (ASSUMED geometry from the photos, to be measured)
function yard({add,L0}){
  const G=-GROUND_DROP;               // yard grade, level-local metres
  const poly=(pts)=>pts.map(p=>P(...p));
  const slab=(id,name,pts,elev,thick,surface,holes=[])=>{
    add({object:'node',id,type:'slab',name,parentId:L0.id,polygon:poly(pts),holes:holes.map(poly),holeMetadata:holes.map(()=>({source:'manual'})),
      elevation:r3(elev),thickness:thick,slots:{surface,side:surface},metadata:{}});
    L0.children.push(id);
  };
  const YARD_BACK=56;                // plan z of the back fence
  // lawn, patio, planters, bench
  slab('slab_yard_lawn','Lawn (assumed)',[[-0.25,33.45],[15.25,33.45],[15.25,YARD_BACK],[-0.25,YARD_BACK]],G+0.005,0.3,MAT.lawn);
  slab('slab_yard_patio','Concrete patio (assumed)',[[7.5,46],[15,46],[15,YARD_BACK-0.3],[7.5,YARD_BACK-0.3]],G+0.02,0.12,MAT.concrete);
  [[0.15,38.5,3.1,44.5],[0.15,45.5,3.1,51.5]].forEach(([x0,z0,x1,z1],i)=>{
    slab(`slab_yard_bed${i+1}`,`Raised bed ${i+1} (assumed)`,[[x0,z0],[x1,z0],[x1,z1],[x0,z1]],G+0.45,0.45,MAT.steel);
    slab(`slab_yard_soil${i+1}`,`Bed soil ${i+1}`,[[x0+0.2,z0+0.2],[x1-0.2,z0+0.2],[x1-0.2,z1-0.2],[x0+0.2,z1-0.2]],G+0.47,0.05,MAT.soil);
  });
  slab('slab_yard_bench','Built-in L bench (assumed)',[[9,YARD_BACK-0.3],[15,YARD_BACK-0.3],[15,47],[13,47],[13,YARD_BACK-2.3],[9,YARD_BACK-2.3]],G+0.45,0.45,MAT.white);
  slab('slab_yard_cushion','Bench cushion',[[9.2,YARD_BACK-0.5],[14.8,YARD_BACK-0.5],[14.8,47.2],[13.2,47.2],[13.2,YARD_BACK-2.1],[9.2,YARD_BACK-2.1]],G+0.57,0.1,MAT.cream);
  // rear deck at floor level, outside the rear door (rear wall outer face at plan z 33.2)
  slab('slab_deck','Rear deck (assumed)',[[4.0,33.45],[9.0,33.45],[9.0,38.45],[4.0,38.45]],0.0,0.15,MAT.wood);
  // deck stairs down to the yard (low end at plan z 44.3, travelling toward the house: yaw 0 = +Z)
  const stairs=(id,name,origin,yaw,width,len,rise,steps,rail)=>{
    const sid=`stair_${id}`, gid=`sseg_${id}`;
    add({object:'node',id:sid,type:'stair',name,parentId:L0.id,position:[m(origin[0]),r3(G),m(D-origin[1])],rotation:yaw,stairType:'straight',
      fromLevelId:null,toLevelId:null,slabOpeningMode:'none',width:m(width),totalRise:r3(rise),stepCount:steps,thickness:0.25,fillToFloor:true,
      railingMode:rail,railingHeight:0.92,children:[gid],metadata:{}});
    add({object:'node',id:gid,type:'stair-segment',parentId:sid,segmentType:'stair',width:m(width),length:m(len),height:r3(rise),stepCount:steps,
      attachmentSide:'front',fillToFloor:true,thickness:0.25,metadata:{}});
    L0.children.push(sid);
  };
  stairs('deck','Deck stairs (assumed)',[6.5,38.45+7*0.833],0,3,7*0.833,GROUND_DROP,7,'both');
  // deck guard rails (open sides; wall side and stair opening left clear)
  let fn=0;
  const guard=(a,b)=>{ fn++; const id=`fence_deck${fn}`;
    add({object:'node',id,type:'fence',name:'Deck guard',parentId:L0.id,start:P(...a),end:P(...b),height:0.914,thickness:0.08,style:'slat',
      baseStyle:'grounded',supportSlabId:'slab_deck',color:'#b98a57',metadata:{}}); L0.children.push(id); };
  guard([4.0,33.45],[4.0,38.45]); guard([9.0,33.45],[9.0,38.45]); guard([4.0,38.45],[5.0,38.45]); guard([8.0,38.45],[9.0,38.45]);
  // front steps (ASSUMED same grade drop as the rear): landing + 7 steps, climbing north into the front door
  slab('slab_stoop','Front landing (assumed)',[[0.2,-3.5],[3.3,-3.5],[3.3,-0.5],[0.2,-0.5]],0.0,0.15,MAT.concrete);
  slab('slab_front_walk','Front walk (assumed)',[[0.0,-10.5],[3.45,-10.5],[3.45,-0.5],[0.0,-0.5]],G+0.01,0.12,MAT.concrete);
  stairs('front','Front steps (assumed)',[1.725,-3.5-7*0.833],Math.PI,3,7*0.833,GROUND_DROP,7,'both');
  // cedar privacy fence around the yard (side lines and back)
  const fence=(id,name,a,b)=>{ add({object:'node',id,type:'fence',name,parentId:L0.id,start:P(...a),end:P(...b),height:1.83,thickness:0.05,style:'privacy',
      supportOffset:r3(G),color:MAT.cedar,metadata:{}}); L0.children.push(id); };
  fence('fence_back','Back fence (assumed)',[-0.25,YARD_BACK],[15.25,YARD_BACK]);
  fence('fence_west','West yard fence (assumed)',[-0.25,33.45],[-0.25,YARD_BACK]);
  fence('fence_east','East yard fence (assumed)',[15.25,33.45],[15.25,YARD_BACK]);
}

// ---- extra built-ins from the reference renders (proposed only): dining shelves, plaster hood, stepping stones, gravel, pillows, fence shelf
function details({add,L0}){
  if(isExist()) return;
  const G=-GROUND_DROP, poly=(pts)=>pts.map(p=>P(...p));
  const slab=(id,name,pts,elev,thick,surface)=>{
    add({object:'node',id,type:'slab',name,parentId:L0.id,polygon:poly(pts),holes:[],holeMetadata:[],elevation:r3(elev),thickness:thick,slots:{surface,side:surface},metadata:{}});
    L0.children.push(id); };
  // dining: two floating walnut shelves inside the arched niche (east wall face at plan x 15.0)
  [['slab_shelf1',1.30],['slab_shelf2',1.60]].forEach(([id,e])=>slab(id,'Niche shelf',[[14.25,23.5],[14.97,23.5],[14.97,27.7],[14.25,27.7]],e,0.03,MAT.walnut));
  // dining: olive arched niche on the east wall, built from 7 thin wall strips of stepped height (1.0.3 has no per-region wall paint)
  { const zc=25.6, wd=1.28, r=wd/2, n=7, step=wd/n, spring=1.45, x=15.0-0.03;
    for(let k=0;k<n;k++){ const dz=(-r+(k+0.5)*step), hh=Math.sqrt(Math.max(r*r-dz*dz,0))*0.94, z0=zc*FT+(-r+k*step), z1=z0+step; // metres along plan z
      const id=`wall_niche${k+1}`;
      add({object:'node',id,type:'wall',name:'Niche arch strip',parentId:L0.id,start:[m(x),r3(D*FT-z0)],end:[m(x),r3(D*FT-z1)],thickness:0.04,height:r3(spring+hh),
        children:[],frontSide:'interior',backSide:'interior',slots:{interior:MAT.olive,exterior:MAT.olive},metadata:{}}); L0.children.push(id); } }
  // kitchen: smooth plaster hood over the range (box from 1.5 m to 2.35 m)
  slab('slab_hood','Plaster range hood',[[13.3,16.85],[14.97,16.85],[14.97,19.85],[13.3,19.85]],2.35,0.85,MAT.plaster);
  // backyard
  [[5.6,45.2],[6.8,46.5],[5.4,47.6]].forEach(([x,z],i)=>{ const r=0.55, pts=[...Array(10)].map((_,k)=>[x+r*Math.cos(k*Math.PI/5),z+r*Math.sin(k*Math.PI/5)]);
    slab(`slab_stone${i+1}`,'Stepping stone (assumed)',pts,G+0.035,0.05,MAT.stone); });
  slab('slab_yard_gravel','Gravel strip (assumed)',[[3.1,38.4],[4.5,38.4],[4.5,51.6],[3.1,51.6]],G+0.012,0.05,MAT.gravel);
  [[10.0,MAT.pillowOlive],[11.3,MAT.pillowSage],[14.6,MAT.pillowBlush]].forEach(([x,mat],i)=>
    slab(`slab_pillow${i+1}`,'Bench pillow',[[x,55.1],[x+0.9,55.1],[x+0.9,55.45],[x,55.45]],G+0.67+0.35,0.35,mat));
  slab('slab_yard_shelf','Fence shelf (assumed)',[[9.5,55.5],[13.5,55.5],[13.5,55.95],[9.5,55.95]],G+1.65,0.03,MAT.walnut);
}

// ---- wall finishes. Pascal 1.0.3 walls take paint through slots `interior` / `exterior` (+ band slots when faceBands is on); a
// wall's frontSide / backSide say which of its faces uses which slot (front = face a = the +normal side). There are no per-region
// paints in 1.0.3, so the accent wall is a whole face painted through the `exterior` slot of a partition wall.
const PAINT_WALL=process.env.PAINT||'scene:mat_wall';      // #ebe7df, warm white like the photos
function wallSlots(){ return {interior:PAINT_WALL,exterior:MAT.siding,skirtingInterior:'library:preset-white',skirtingExterior:'library:preset-softwhite'}; }
function wallFinish(wall,w){
  if(isExist()) return;
  const along=Math.abs(w.start[1]-w.end[1])<1e-6?'x':'z';
  if(along==='x'&&Math.abs(w.start[1]-21.77)<0.05&&w.start[0]<9){
    // wall between kitchen (south, back face) and dining (north, front face a): terracotta on the dining side, marble splash on the kitchen side
    wall.frontSide='interior'; wall.backSide='exterior';
    wall.slots.exterior=MAT.terracotta;
    wall.faceBands={enabled:true,count:3,lowerHeight:0.84,middleHeight:0.61,upperHeight:0.61};
    wall.slots.lowerInterior=PAINT_WALL; wall.slots.middleInterior=MAT.marble; wall.slots.upperInterior=PAINT_WALL;
    wall.slots.lowerExterior=MAT.terracotta; wall.slots.middleExterior=MAT.terracotta; wall.slots.upperExterior=MAT.terracotta;
  }
}
// which faces are outside, from the wall's role: front wall a=in, rear a=out, west party a=out, east party a=in, everything else in/in
function wallSides(wall){
  const n=wall.name;
  if(n==='Front wall'||n==='East party wall') return ['exterior','interior'];
  if(n==='Rear wall'||n==='West party wall') return ['interior','exterior'];
  return ['interior','interior'];
}

module.exports={wallSlots,wallSides,sceneMaterials,details,setLayout,baseFloor,isExist,EXIST,GROUND_DROP,MAT,floorRooms,kitchen,yard,wallFinish};
