// Main-floor hall widening. The original artifact's hall is 1.8 ft centre to centre (about 1.4 ft clear): nobody can walk it, and the
// walkthrough capsule cannot enter. The walkthrough photos show roughly 3+ ft. Until it is measured, this moves the hall's west wall
// WEST_MOVE ft west (taking from the closets) and its east wall EAST_MOVE ft east (taking from the kitchen).
// Set HALL_WEST / HALL_EAST (ft) in the environment, or edit here, once the real width is known. Main floor only.
const WEST_MOVE=parseFloat(process.env.HALL_WEST||'0.85'), EAST_MOVE=parseFloat(process.env.HALL_EAST||'0.95');
// plan x (ft) -> moved x. Bands cover the wall centre lines (5.27, 7.1) and the zone/room edges that sit against them.
const mapX=(x)=> (x>=5.0&&x<=5.6) ? x-WEST_MOVE : (x>=7.0&&x<=7.45) ? x+EAST_MOVE : x;
const mapPt=(p)=>[mapX(p[0]),p[1]];
module.exports={mapX,mapPt,WEST_MOVE,EAST_MOVE};
