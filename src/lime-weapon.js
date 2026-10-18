/* LIME P / ORBIT: each active bullet follows a player-relative radius-360
 * circle. Segment samples approximate its circular arc for swept hit testing.
 */
(function(root){
  "use strict";
  const RULES=Object.freeze({
    radius:360,
    radiansPerSecond:2.8,
    bulletLifetimeSeconds:3.2,
    bulletRadius:10,
    normalDamage:1.15,
    bulletsPerVolley:2,
    maxOrbitingBullets:32,
    maxRadiansPerStep:0.16
  });
  function position(player,angle){
    return {
      x:player.x+RULES.radius*Math.cos(angle),
      y:player.y+RULES.radius*Math.sin(angle)
    };
  }
  function createShot(player,angle) {
    const p=position(player,angle);
    return {x:p.x,y:p.y,vx:0,vy:0,r:RULES.bulletRadius,
      life:RULES.bulletLifetimeSeconds,orbiting:true,orbitAngle:angle};
  }
  function step(shot,player,dt){
    if(!shot?.orbiting||!player||!Number.isFinite(dt)||dt<=0)return [];
    const delta=RULES.radiansPerSecond*dt;
    const steps=Math.min(64,Math.max(1,
      Math.ceil(Math.abs(delta)/RULES.maxRadiansPerStep)));
    const segments=[];
    let angle=shot.orbitAngle;
    let from=position(player,angle);
    for(let i=1;i<=steps;i++){
      const to=position(player,angle+delta*i/steps);
      segments.push({fromX:from.x,fromY:from.y,toX:to.x,toY:to.y});
      from=to;
    }
    angle+=delta;
    shot.orbitAngle=angle%(Math.PI*2);
    shot.x=from.x;shot.y=from.y;
    shot.life-=dt;
    if(shot.life<=0)shot.dead=true;
    return segments;
  }
  const api=Object.freeze({RULES,position,createShot,step});
  root.NeonLimeWeapon=api;
  if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
