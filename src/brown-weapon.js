/* BROWN P / LOCK LASER: forward-facing, single-target, first-obstruction ray.
 * Pure geometry and fixed-tick damage scheduling; no Canvas/DOM access.
 */
(function(root) {
  "use strict";
  const RULES=Object.freeze({
    normalDamage:1.15,
    secondsPerTick:0.101,
    maxRange:1300,
    muzzleOffset:60,
    laserRadius:3,
    maxTicksPerFrame:16
  });
  function createState(){ return {elapsed:0}; }
  function reset(state){if(state) state.elapsed=0;}
  function tick(state,dt,enabled,onTick) {
    if(!enabled){reset(state);return 0;}
    if(!(dt>0)||!Number.isFinite(dt))return 0;
    const total=state.elapsed+dt;
    const count=Math.min(RULES.maxTicksPerFrame,
      Math.floor((total+1e-10)/RULES.secondsPerTick));
    state.elapsed=Math.max(0,total-Math.floor((total+1e-10)/RULES.secondsPerTick)*RULES.secondsPerTick);
    for(let i=0;i<count;i++)onTick();
    return count;
  }
  function circleHit(from,to,cx,cy,radius) {
    if(!(radius>=0)) return null;
    const dx=to.x-from.x,dy=to.y-from.y;
    const ox=from.x-cx,oy=from.y-cy;
    const a=dx*dx+dy*dy;
    const c=ox*ox+oy*oy-radius*radius;
    if(c<=0)return 0;
    if(!(a>0))return null;
    const b=2*(ox*dx+oy*dy);
    const d=b*b-4*a*c;
    if(d<0)return null;
    const t=(-b-Math.sqrt(d))/(2*a);
    return t>=0&&t<=1?t:null;
  }
  function rectHit(from,to,x1,y1,x2,y2) {
    const dx=to.x-from.x,dy=to.y-from.y;
    let entry=0,exit=1;
    for(const [p,v,low,high] of [[from.x,dx,x1,x2],[from.y,dy,y1,y2]]){
      if(v===0){if(p<low||p>high)return null;continue;}
      const t1=(low-p)/v,t2=(high-p)/v;
      entry=Math.max(entry,Math.min(t1,t2));
      exit=Math.min(exit,Math.max(t1,t2));
      if(entry>exit)return null;
    }
    return entry>=0&&entry<=1?entry:null;
  }
  // Choose an initial goal by shortest distance from the muzzle, considering
  // available Boss turrets before its hull. Then trace the actual segment
  // against ALL intervening enemies/turrets/Boss hull and clip at first hit.
  function acquire(from,enemies,boss) {
    if(!from||!Number.isFinite(from.x)||!Number.isFinite(from.y))return null;
    const goals=[];
    function goal(x,y){
      const d=Math.hypot(x-from.x,y-from.y);
      if(x>=from.x && d<=RULES.maxRange && d>0)goals.push({x,y,d});
    }
    for(const e of enemies||[]) {
      if(e?.hp>0 && Number.isFinite(e.x) && Number.isFinite(e.y))goal(e.x,e.y);
    }
    if(boss?.active&&boss.hp>0){
      const turrets=(boss.parts||[]).filter(p=>p.hp>0);
      if(turrets.length){
        for(const p of turrets)goal(boss.x+p.x,boss.y+p.y);
      } else {
        goal(Math.max(from.x,boss.x-boss.rx),Math.max(boss.y-boss.ry,Math.min(boss.y+boss.ry,from.y)));
        goal(boss.x,boss.y);
      }
    }
    if(!goals.length)return null;
    goals.sort((a,b)=>a.d-b.d);
    const to={x:goals[0].x,y:goals[0].y};
    const hits=[];
    function collect(t,kind,target,part){
      if(t===null||!Number.isFinite(t))return;
      hits.push({t,kind,target,part:part||null});
    }
    for(const e of enemies||[]){
      if(e?.hp>0)collect(circleHit(from,to,e.x,e.y,e.r||0),'enemy',e);
    }
    if(boss?.active&&boss.hp>0){
      for(const part of boss.parts||[]){
        if(part.hp>0)collect(circleHit(from,to,boss.x+part.x,boss.y+part.y,part.r||0),'turret',boss,part);
      }
      collect(rectHit(from,to,boss.x-boss.rx,boss.y-boss.ry,
        boss.x+boss.rx,boss.y+boss.ry),'boss',boss);
    }
    if(!hits.length)return null;
    // Tie-break: a turret is more specific than the hull; no beam pierces
    // between first obstruction and the originally chosen target.
    hits.sort((a,b)=>a.t-b.t||
      (a.kind==="turret"?-1:a.kind==="boss"?1:0));
    const first=hits[0];
    return {kind:first.kind,target:first.target,part:first.part,
      x:from.x+(to.x-from.x)*first.t,
      y:from.y+(to.y-from.y)*first.t,
      startX:from.x,startY:from.y};
  }
  const api=Object.freeze({RULES,createState,reset,tick,circleHit,rectHit,acquire});
  root.NeonBrownWeapon=api;
  if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
