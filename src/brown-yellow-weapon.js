/* BROWN-YELLOW P: a BROWN-only one-hop refracting lock laser.
 * First hit remains brown.acquire's unmodified nearest forward obstruction.
 * The secondary segment starts at that first contact and terminates on ONE
 * different live target, with BROWN's own first-obstruction geometry.
 * Pure rules: no Canvas, projectiles, particles or independent damage clock.
 */
(function(root) {
  "use strict";
  const brown = (typeof module === "object" && module.exports)
    ? require("./brown-weapon.js") : root.NeonBrownWeapon;
  if (!brown) throw new Error("BROWN-YELLOW requires BROWN rules");

  const RULES = Object.freeze({
    normalDamage: brown.RULES.normalDamage,
    secondsPerTick: brown.RULES.secondsPerTick,
    maxRange: brown.RULES.maxRange,
    muzzleOffset: brown.RULES.muzzleOffset,
    laserRadius: brown.RULES.laserRadius,
    maxTicksPerFrame: brown.RULES.maxTicksPerFrame,
    maxRefractions: 1
  });

  function canEquip(type) {
    return type === "brown" || type === "brownyellow";
  }

  function isAlive(hit) {
    if (!hit || !(hit.target?.hp > 0)) return false;
    if (hit.kind === "enemy") return true;
    return Boolean(hit.target.active) &&
      (!hit.part || hit.part.hp > 0);
  }

  function refract(first, enemies, boss) {
    if (!isAlive(first) || !Number.isFinite(first.x) ||
        !Number.isFinite(first.y)) return null;
    const origin = {x:first.x, y:first.y};
    const goals = [];
    function goal(x,y) {
      if(!Number.isFinite(x)||!Number.isFinite(y))return;
      const d=Math.hypot(x-origin.x,y-origin.y);
      if(d>0 && d<=RULES.maxRange)goals.push({x,y,d});
    }
    // Unlike the initial BROWN ray, this AFTER-CONTACT ray may turn upward,
    // downward, forward or backward. An existing victim cannot be hit twice.
    for(const e of enemies||[]) {
      if(e?.hp>0 && e!==first.target)goal(e.x,e.y);
    }
    if(boss?.active && boss.hp>0 && boss!==first.target){
      const parts=(boss.parts||[]).filter(p=>p.hp>0);
      if(parts.length) {
        for(const p of parts)goal(boss.x+p.x,boss.y+p.y);
      } else {
        // Pick the nearest point on an exposed boss hull before its center.
        goal(Math.max(boss.x-boss.rx,Math.min(origin.x,boss.x+boss.rx)),
             Math.max(boss.y-boss.ry,Math.min(origin.y,boss.y+boss.ry)));
        goal(boss.x,boss.y);
      }
    }
    if(!goals.length)return null;
    goals.sort((a,b)=>a.d-b.d);
    const dest=goals[0], hits=[];
    function collect(t,kind,target,part=null){
      if(t===null||!Number.isFinite(t))return;
      const d=dest.d*t;
      // BROWN range applies independently to this single second segment.
      if(d<=RULES.maxRange+1e-9)hits.push({t,kind,target,part});
    }
    // Check all obstacles, not only the intended goal: a closer living
    // body on the refracted segment takes the ONE permitted second hit.
    for(const e of enemies||[]){
      if(e?.hp>0 && e!==first.target)
        collect(brown.circleHit(origin,dest,e.x,e.y,e.r||0),"enemy",e);
    }
    if(boss?.active && boss.hp>0 && boss!==first.target){
      for(const part of boss.parts||[]) {
        if(part.hp>0) collect(brown.circleHit(origin,dest,
          boss.x+part.x,boss.y+part.y,part.r||0),"turret",boss,part);
      }
      collect(brown.rectHit(origin,dest,boss.x-boss.rx,boss.y-boss.ry,
        boss.x+boss.rx,boss.y+boss.ry),"boss",boss);
    }
    if(!hits.length)return null;
    hits.sort((a,b)=>a.t-b.t ||
      (a.kind==="turret"?-1:a.kind==="boss"?1:0));
    const hit=hits[0];
    return {
      kind:hit.kind, target:hit.target, part:hit.part,
      startX:origin.x,startY:origin.y,
      x:origin.x+(dest.x-origin.x)*hit.t,
      y:origin.y+(dest.y-origin.y)*hit.t
    };
  }

  const api=Object.freeze({RULES,canEquip,isAlive,refract});
  root.NeonBrownYellowWeapon=api;
  if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
