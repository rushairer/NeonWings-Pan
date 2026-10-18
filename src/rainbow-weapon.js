/* RAINBOW P / PRISM: launch ONE projectile every 0.4 active seconds;
 * select ONE inherited weapon behavior per shot.
 * Seven types at exactly 13%, Pink homing missile at exactly 9%.
 * Pure deterministic distribution; combat implementation belongs in game.js.
 */
(function(root) {
  "use strict";
  const RULES=Object.freeze({
    normalDamage:1.15,
    bulletsPerVolley:1,
    shotCooldownSeconds:0.4,
    outcomeChances:Object.freeze({
      homing:0.13, slow:0.13, missile:0.09, chain:0.13,
      gray:0.13, conductive:0.13, orbit:0.13, blast:0.13
    })
  });
  // Keep explicit cumulative boundaries to avoid drift from floating-point
  // summation (e.g. exactly 0.35 MUST be CHAIN, not missile).
  const BANDS=Object.freeze([
    Object.freeze({kind:"homing",upper:0.13}),
    Object.freeze({kind:"slow",upper:0.26}),
    Object.freeze({kind:"missile",upper:0.35}),
    Object.freeze({kind:"chain",upper:0.48}),
    Object.freeze({kind:"gray",upper:0.61}),
    Object.freeze({kind:"conductive",upper:0.74}),
    Object.freeze({kind:"orbit",upper:0.87}),
    Object.freeze({kind:"blast",upper:1})
  ]);
  function choose(roll) {
    if(!Number.isFinite(roll)||roll<0||roll>=1)
      throw new RangeError("RAINBOW effect roll must be finite in [0,1)");
    for(const band of BANDS)if(roll<band.upper)return band.kind;
    throw new Error("RAINBOW distribution must cover every valid roll");
  }
  function fire(random=Math.random) {
    if(typeof random!=="function")throw new TypeError("RAINBOW RNG must be callable");
    // ONE roll for ONE physical projectile. Never re-roll on hit/frame.
    return choose(random());
  }
  const api=Object.freeze({RULES,BANDS,choose,fire});
  root.NeonRainbowWeapon=api;
  if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
