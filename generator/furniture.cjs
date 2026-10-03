// Furniture placed from Bethan's furniture footprints (feet, her plan coords) using Pascal's built-in catalog.
// yaw convention (verified in the walkthrough and in Pascal's own furnish_room): an item's front faces (sin yaw, cos yaw) in world X/Z.
// NOTE: Pascal's Z is flipped from Bethan's plan z (front of house z=0 is the south, +Z): S = toward her front wall (smaller z), N = toward the rear (larger z).
const PI=Math.PI, N=PI, S=0, E=PI/2, Wst=-PI/2;
// [catalogId, centreX, centreZ, yaw, footprint? {w:ft along item-local x, d:ft along item-local z} | scale | null]
const main=[
  ['sofa',13.6,7.2,Wst,{scale:0.7}],
  ['coffee-table',9.0,6.9,S,{w:2.6,d:2.4}],
  ['dining-table',9.0,27.3,S,{w:4.0,d:3.4}],
  ['dining-chair',8.7,24.6,N],['dining-chair',10.5,24.6,N],
  ['dining-chair',8.7,30.0,S],['dining-chair',10.5,30.0,S],
  ['kitchen-counter',11.15,13.35,N,{w:7.7,d:2.0}],
  ['kitchen-counter',14.0,15.5,Wst,{w:2.1,d:2.0}],
  ['kitchen-counter',12.3,20.6,S,{w:5.4,d:2.0}],
  ['fridge',8.4,20.25,S,{w:2.1,d:2.1,byWidth:true}],
  ['stove',14.0,17.75,Wst,{w:2.1,d:2.1}],
  ['washing-machine',0.9,25.4,E,{w:2.2,d:2.2}],
  ['toilet',2.05,23.0,S,{w:2.2,d:1.4}],['bathroom-sink',4.3,19.8,N,{w:1.8,d:1.5}],
];
const upper=[
  ['double-bed',12.0,6.2,Wst,{w:5.2,d:6.6}],
  ['closet',0.6,3.0,E,{w:5.0,d:1.2}],
  ['double-bed',2.3,29.7,E,{w:5.0,d:4.6}],
  ['double-bed',12.7,29.7,Wst,{w:5.0,d:4.6}],
  ['toilet',10.4,16.65,E,{w:2.2,d:1.4}],['bathroom-sink',10.4,14.9,E,{w:1.8,d:1.5}],['bathtub',13.75,14.85,Wst,{w:5.0,d:2.5}],
  ['toilet',14.4,21.6,Wst,{w:2.2,d:1.4}],['bathroom-sink',14.4,19.2,Wst,{w:1.8,d:1.5}],['shower-square',11.2,21.4,S,{w:3,d:3}],
];
module.exports={main,upper};
