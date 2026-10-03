// Finishes, kitchen cabinetry and backyard (assumptions flagged in names where not measured).
// Palette comes from the owners' first-floor reference renders: warm white walls, terracotta accent,
// sage shaker cabinets, marble tops, brass hardware, wood floors, terrazzo kitchen floor, cedar fence.
const FT=0.3048, D=34;
const m=(v)=>Math.round(v*FT*10000)/10000;
const r3=(v)=>Math.round(v*1000)/1000;
const P=(x,z)=>[m(x),m(D-z)];

// How far the main floor sits above the yard. ASSUMED from the photos (about 7 risers of 7.5 in); measure on site.
const GROUND_DROP=1.34; // metres

const MAT={
  wood:'library:wood-woodplank48', terrazzo:'library:flooring-terrazzo19', bathTile:'library:flooring-lightceramic24',
  marble:'library:flooring-statuarettowhite', sage:'library:preset-sage', brass:'library:metal-brass',
  terracotta:'library:preset-terracotta', cream:'library:preset-cream', white:'library:preset-white',
  concrete:'library:concrete-polished', cedar:'#c8a165', lawn:'library:preset-forest', soil:'library:preset-espresso',
  steel:'library:preset-midgrey', olive:'library:preset-olive', walnut:'#6b4630', stainless:'#b9bcc0', plaster:'library:preset-white', gravel:'#b8b1a4', stone:'#c9c4b8', pillowOlive:'library:preset-olive', pillowSage:'library:preset-sage', pillowBlush:'library:preset-cream', siding:'library:siding-lap-white',
};

// Existing house as photographed (walkthrough frames): dark grey plank floor, beige vinyl tile and brown wood cabinets with
// black marble-look tops in the kitchen, brown/beige vinyl in the powder room, bare plywood subfloor upstairs, grey plank in the baths.
const EXIST={base:{main:'#3e3c42',upper:'#b9895a'},kitchenFloor:'#d9cfb0',powder:'#8c7b69',bath:'#8a8a8c',
  cab:'#8a5a2b',top:'#1d1d20',hw:'library:metal-brass'};
let LAYOUT='prop';
function setLayout(l){LAYOUT=l;}
const isExist=()=>LAYOUT==='exist';
function baseFloor(floor){return isExist()?EXIST.base[floor]:MAT.wood;}

// ---- floors: room-specific finishes cut out of the base wood slab (rectangles in plan feet)
function floorRooms(floor){
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
    const kids=[]; let x=0;
    mods.forEach((md,i)=>{
      const mid=`cabinet-module_k${n}_${i+1}`; const w=md.w;
      add({object:'node',id:mid,type:'cabinet-module',parentId:id,cabinetType:tier==='tall'?'tall':'base',
        position:[r3(x+w/2),tier==='base'?0.1:0,0],rotation:0,width:r3(w),depth,carcassHeight:extra.carcass||(tier==='base'?0.8:0.8),
        frontStyle:'shaker',handleStyle:'knob',withCountertop:tier==='base',slots:extra.slots||slots,stack:md.stack.map((s,j)=>({id:`k${n}m${i}c${j}`,...s})),metadata:{}});
      kids.push(mid); x+=w;
    });
    add({object:'node',id:id,type:'cabinet',name,parentId:L0.id,runTier:tier,position:[m(origin[0]),y,m(D-origin[1])],rotation:yaw,
      width:r3(len),depth,carcassHeight:extra.carcass||0.8,frontStyle:'shaker',handleStyle:'knob',withCountertop:tier==='base',slots:extra.slots||slots,children:kids,metadata:{}});
    L0.children.push(id); out.push(id);
  };
  const d=0.61, PI=Math.PI;
  // south run under the pass-through window (west -> east: dishwasher, double sink, drawers); yaw pi so local +x runs west from the east end
  run('Kitchen sink run','base',[15,13.35],PI,2.347,d,[
    {w:0.64,stack:[{type:'drawer',drawerCount:3}]},
    {w:1.097,stack:[{type:'sink',sinkLayout:'double'}]},
    {w:0.61,stack:[{type:'dishwasher'}]},
  ]);
  // east run: range then base cabinet (yaw -pi/2: local +x runs south from the north end)
  run('Kitchen range run','base',[14.0,19.6],-PI/2,1.6,d,[
    {w:0.76,stack:[{type:'cooktop-gas',cooktopLayout:'gas-4burner'},{type:'oven'}]},
    {w:0.84,stack:[{type:'door',doorType:'double'}]},
  ]);
  // north run
  run('Kitchen north run','base',[9.6,20.6],0,1.646,d,[
    {w:0.6,stack:[{type:'door',doorType:'double'}]},
    {w:0.6,stack:[{type:'drawer',drawerCount:3}]},
    {w:0.446,stack:[{type:'door',doorType:'single-left'}]},
  ]);
  // fridge
  run('Kitchen refrigerator','tall',[7.35,20.45],0,0.655,0.7,[
    {w:0.655,stack:[{type:'fridge-double'}]},
  ],{carcass:1.8,slots:isExist()?undefined:{front:MAT.stainless,carcass:MAT.stainless,plinth:MAT.stainless,countertop:MAT.stainless,hardware:MAT.stainless}});
  // upper glass-front cabinets over the north run
  run('Kitchen upper cabinets','wall',[9.6,21.025],0,1.646,0.35,[
    {w:0.6,stack:[{type:'door',doorType:'glass'}]},
    {w:0.6,stack:[{type:'door',doorType:'glass'}]},
    {w:0.446,stack:[{type:'door',doorType:'glass'}]},
  ],{y:1.45,carcass:0.762});
  // range hood (proposed: smooth plaster hood as a slab box, built in details())
  if(isExist()) run('Range hood','wall',[14.18,19.6],-PI/2,0.76,0.5,[
    {w:0.76,stack:[{type:'hood-pyramid'}]},
  ],{y:1.5,carcass:0.7});
  if(!isExist()){
    // dining sideboard against the terracotta east wall (plan z 28.6 -> 22.6), echoing the render's built-in
    run('Dining sideboard','base',[14.65,28.6],-PI/2,1.83,0.45,[
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

// ---- wall finishes, proposed layout only (the existing house keeps its plain white walls)
// faceRegions are rectangles in (u along the wall from its start, v up from the floor) on face 'a' or 'b'.
const regionId=(()=>{let k=0;return(p)=>`${p}${++k}`;})();
function wallFinish(wall,w){
  if(isExist()) return;
  const along=Math.abs(w.start[1]-w.end[1])<1e-6?'x':'z';
  const regs=[];
  if(wall.name==='East party wall'){
    // olive arched niche behind the dining sideboard (the render's green arch), built from thin strips so the arch top is round
    const zc=25.6, wd=1.28, r=wd/2, uc=(zc+0.25)*FT, spring=1.45, n=7, step=wd/n;  // Pascal allows at most 8 paint regions per wall face
    regs.push({id:regionId('niche'),face:'a',u0:r3(uc-r),u1:r3(uc+r),v0:0.05,v1:spring,finish:MAT.olive});
    for(let k=0;k<n;k++){ const u0=uc-r+k*step,u1=u0+step,dx=(u0+u1)/2-uc,hh=Math.sqrt(Math.max(r*r-dx*dx,0))*0.92;
      if(hh>0.01) regs.push({id:regionId('arch'),face:'a',u0:r3(u0),u1:r3(u1),v0:spring,v1:r3(spring+hh),finish:MAT.olive}); }
  } else if(along==='x'&&Math.abs(w.start[1]-21.77)<0.05&&w.start[0]<8){
    // wall between kitchen (face b) and dining (face a): terracotta accent on the dining side, marble splash behind the north run
    regs.push({id:regionId('accent'),face:'a',u0:0,u1:r3((15.25-7.1)*FT),v0:0,v1:2.44,finish:MAT.terracotta});
    regs.push({id:regionId('splash'),face:'b',u0:r3((9.6-7.1)*FT),u1:r3((15.25-7.1)*FT),v0:0.94,v1:1.45,finish:MAT.marble});
  }
  if(regs.length) wall.faceRegions=regs;
}

module.exports={details,setLayout,baseFloor,isExist,EXIST,GROUND_DROP,MAT,floorRooms,kitchen,yard,wallFinish};
