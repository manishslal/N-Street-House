// Furniture placed from Bethan's furniture footprints (feet, her plan coords) using Pascal's built-in catalog.
// yaw convention (verified in the walkthrough and in Pascal's own furnish_room): an item's front faces (sin yaw, cos yaw) in world X/Z.
// NOTE: Pascal's Z is flipped from Bethan's plan z (front of house z=0 is the south, +Z): S = toward her front wall (smaller z), N = toward the rear (larger z).
const PI=Math.PI, N=PI, S=0, E=PI/2, Wst=-PI/2;
// [catalogId, centreX, centreZ, yaw, footprint? {w:ft along item-local x, d:ft along item-local z} | scale | null]
const main=[
  ['sofa',13.6,7.2,Wst,{scale:0.7}],
  ['coffee-table',9.0,6.9,S,{w:2.6,d:2.4}],
  ['dining-table',9.0,27.3,S,{w:4.0,d:3.4,only:'exist'}],
  ['dining-chair',8.7,24.6,N,{only:'exist'}],['dining-chair',10.5,24.6,N,{only:'exist'}],
  ['dining-chair',8.7,30.0,S,{only:'exist'}],['dining-chair',10.5,30.0,S,{only:'exist'}],
  // proposed dining nook from the render: round pedestal table, bentwood chairs, curved boucle sofa under sheer curtains, brass dome pendant
  ['round-table',8.6,26.4,S,{only:'prop',free:true}],
  ['bentwood-chair',8.6,24.35,N,{only:'prop',free:true}],['bentwood-chair',6.55,26.4,E,{only:'prop',free:true}],['bentwood-chair',8.6,28.45,S,{only:'prop',free:true}],
  ['curved-sofa',12.3,31.0,S,{only:'prop',free:true}],
  ['sheer-curtain',9.0,32.6,S,{only:'prop',free:true}],['sheer-curtain',14.55,32.6,S,{only:'prop',free:true}],
  ['monstera',14.3,29.6,0,{only:'prop',free:true}],
  ['brass-sconce',14.9,25.6,Wst,{y:2.0,only:'prop',free:true}],
  // from the reference renders (proposed only): rugs, pendants, recessed lights, plants, art
  ['persian-rug',8.6,26.4,S,{only:'prop',free:true}],
  ['persian-rug',9.5,7.0,S,{scale:1.2,only:'prop',free:true}],
  ['dome-pendant',8.6,26.4,0,{only:'prop',free:true}],
  ['globe-pendant',10.5,15.4,0,{only:'prop',free:true}],['globe-pendant',10.5,18.2,0,{only:'prop',free:true}],
  ['recessed-light',8.2,15.0,0,{only:'prop',free:true}],['recessed-light',8.2,18.6,0,{only:'prop',free:true}],['recessed-light',12.4,15.0,0,{only:'prop',free:true}],['recessed-light',12.4,18.6,0,{only:'prop',free:true}],
  ['recessed-light',5.5,3.0,0,{only:'prop',free:true}],['recessed-light',9.0,3.0,0,{only:'prop',free:true}],['recessed-light',13.0,3.0,0,{only:'prop',free:true}],
  ['recessed-light',5.5,8.5,0,{only:'prop',free:true}],['recessed-light',9.0,8.5,0,{only:'prop',free:true}],['recessed-light',13.0,8.5,0,{only:'prop',free:true}],
  ['small-indoor-plant',14.5,24.5,0,{scale:1.0,y:1.62,only:'prop',free:true}],
  ['coffee-machine',14.25,26.7,Wst,{scale:1.5,y:0.96,only:'prop',free:true}],
  ['picture',11.0,22.0,N,{scale:0.75,y:1.5,only:'prop',free:true}],
  ['floor-lamp',14.3,11.2,Wst,{only:'prop',free:true}],['indoor-plant',14.3,1.2,0,{only:'prop',free:true}],
  ['washing-machine',0.9,25.4,E,{w:2.2,d:2.2}],
  ['toilet',2.05,23.0,S,{w:1.45,d:2.3}],['bathroom-sink',1.6,19.6,N,{w:2.0,d:1.75}],
];
const upper=[
  ['double-bed',12.0,6.2,Wst,{w:5.2,d:6.6}],
  ['closet',0.6,3.0,E,{w:5.0,d:1.2}],
  ['double-bed',3.2,30.4,E,{w:4.5,d:6.3}],
  ['single-bed',12.2,30.0,Wst,{w:3.25,d:6.3}],
  ['toilet',10.4,16.65,E,{w:1.45,d:2.3}],['bathroom-sink',10.4,14.9,E,{w:2.0,d:1.75}],['bathtub',13.75,14.85,Wst,{w:5.0,d:2.5}],
  ['toilet',14.4,21.6,Wst,{w:1.45,d:2.3}],['bathroom-sink',14.4,19.2,Wst,{w:2.0,d:1.75}],['shower-square',11.2,21.4,S,{w:3,d:3}],
];
// Backyard patio set (assumed layout from the reference renders; positions are plan feet, y is set to the yard grade)
const yard=[
  ['dining-table',10.0,50.0,S,{w:4.5,d:3.0}],
  ['dining-chair',6.8,50.0,E,{only:'exist'}],['dining-chair',9.0,47.6,N,{only:'exist'}],['dining-chair',11.2,47.6,N,{only:'exist'}],
  ['rattan-chair',7.0,50.0,E,{only:'prop'}],['rattan-chair',9.0,47.8,N,{only:'prop'}],['rattan-chair',11.2,47.8,N,{only:'prop'}],
  ['tomato-trellis',1.6,41.6,S,{y:0.52,only:'prop'}],['tomato-trellis',1.6,48.6,S,{y:0.52,only:'prop'}],
];
yard.push(
  ['tree',13.4,41.0,S,{scale:0.9,only:'prop'}],
  ...[[1.0,40.0],[2.2,42.0],[1.2,43.6],[1.0,47.0],[2.2,49.0],[1.0,50.6]].map(([x,z])=>['small-indoor-plant',x,z,S,{scale:1.25,y:0.52,only:'prop'}]),
);
module.exports={main,upper,yard};
