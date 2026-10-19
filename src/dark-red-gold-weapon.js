/* DARK RED-GOLD P: DARK RED-gated fixed 40-unit on-contact knockback
 * with real ORANGE radius-100, 1.6x damage first-impact explosions.
 * Does NOT inherit DARK RED's recursive 30-hit chain / bonus guided rocket:
 * this upgrade is a separate impact+explosion P, as specified by its effect.
 */
(function(root){
  "use strict";
  const darkRed = typeof module==="object" && module.exports
    ? require("./dark-red-weapon.js") : root.NeonDarkRedWeapon;
  const orange = typeof module==="object" && module.exports
    ? require("./orange-weapon.js") : root.NeonOrangeWeapon;
  if(!darkRed||!orange)throw new Error("DARK RED-GOLD requires DARK RED and ORANGE");
  const RULES=Object.freeze({
    knockbackDistance:40,
    normalDamage:darkRed.RULES.normalDamage,
    bulletsPerVolley:darkRed.RULES.bulletsPerVolley,
    muzzleOffsets:Object.freeze([-10,12]),
    bulletSpeed:1100,
    bulletRadius:9,
    blastRadius:orange.RULES.radius,
    blastMultiplier:orange.RULES.damageMultiplier,
    blastLifetime:orange.RULES.explosionLifetimeSeconds
  });
  function canEquip(type){
    return type==="darkred"||type==="darkredgold";
  }
  function createShot(){
    // Uses the EXISTING orangeBlast collision pipeline, not DARK RED chain.
    return {orangeBlast:true,darkRedGoldShot:true};
  }
  function knockback(target,opts={}){
    if(!target||!(target.hp>0)||opts.boss&&target.active===false||
        !Number.isFinite(target.x))return 0;
    const dir=opts.direction===-1?-1:1;
    const min=Number.isFinite(opts.minX)?opts.minX:-120;
    const max=Number.isFinite(opts.maxX)?opts.maxX:1400;
    if(min>max)return 0;
    const anchor=opts.boss&&Number.isFinite(target.targetX)
      ?target.targetX:target.x;
    const shifted=Math.max(min,Math.min(max,anchor+dir*RULES.knockbackDistance));
    const delta=shifted-anchor;
    if(opts.boss&&Number.isFinite(target.targetX))target.targetX+=delta;
    target.x=Math.max(min,Math.min(max,target.x+delta));
    // Some enemies are sine-path scripted in Y. Preserve their existing
    // positions and baseY; only shift their actual X coordinate.
    return Math.abs(delta);
  }
  const api=Object.freeze({RULES,canEquip,createShot,knockback});
  root.NeonDarkRedGoldWeapon=api;
  if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
