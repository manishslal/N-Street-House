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
  steel:'library:preset-midgrey', siding:'library:siding-lap-white',
};

// ---- floors: room-specific finishes cut out of the base wood slab (rectangles in plan feet)
function floorRooms(floor){
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
  const slots={front:MAT.sage,carcass:MAT.sage,plinth:MAT.sage,countertop:MAT.marble,hardware:MAT.brass};
  const run=(name,tier,origin,yaw,len,depth,mods,extra={})=>{
    n++; const id=`cabinet_k${n}`;
    const y=extra.y||0;
    const kids=[]; let x=0;
    mods.forEach((md,i)=>{
      const mid=`cabinet-module_k${n}_${i+1}`; const w=md.w;
      add({object:'node',id:mid,type:'cabinet-module',parentId:id,cabinetType:tier==='tall'?'tall':'base',
        position:[r3(x+w/2),tier==='base'?0.1:0,0],rotation:0,width:r3(w),depth,carcassHeight:extra.carcass||(tier==='base'?0.8:0.8),
        frontStyle:'shaker',handleStyle:'knob',withCountertop:tier==='base',slots,stack:md.stack.map((s,j)=>({id:`k${n}m${i}c${j}`,...s})),metadata:{}});
      kids.push(mid); x+=w;
    });
    add({object:'node',id:id,type:'cabinet',name,parentId:L0.id,runTier:tier,position:[m(origin[0]),y,m(D-origin[1])],rotation:yaw,
      width:r3(len),depth,carcassHeight:extra.carcass||0.8,frontStyle:'shaker',handleStyle:'knob',withCountertop:tier==='base',slots,children:kids,metadata:{}});
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
  ],{carcass:1.8});
  // upper glass-front cabinets over the north run
  run('Kitchen upper cabinets','wall',[9.6,21.025],0,1.646,0.35,[
    {w:0.6,stack:[{type:'door',doorType:'glass'}]},
    {w:0.6,stack:[{type:'door',doorType:'glass'}]},
    {w:0.446,stack:[{type:'door',doorType:'glass'}]},
  ],{y:1.45,carcass:0.762});
  // range hood
  run('Range hood','wall',[14.18,19.6],-PI/2,0.76,0.5,[
    {w:0.76,stack:[{type:'hood-pyramid'}]},
  ],{y:1.5,carcass:0.7});
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

// accent paint: terracotta on the east party wall through the dining area (interior face a, u in metres from wall start)
function dining_accent(wall){
  // wall start is the front end (plan z = -0.25); dining spans plan z 21.95..32.7
  const u0=r3((21.95+0.25)*FT), u1=r3((32.7+0.25)*FT);
  wall.faceRegions=[{id:'accent_dining',face:'a',u0,u1,v0:0,v1:2.44,finish:MAT.terracotta}];
}

module.exports={GROUND_DROP,MAT,floorRooms,kitchen,yard,dining_accent};
