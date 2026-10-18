/* DARK RED P: independent 10% repeat of each full-strength landed hit.
 * The first hit always occurs after a real projectile collision. Each
 * subsequent hit is earned by a fresh 10% roll. Strictly max 10 total hits.
 * No target acquisition, Canvas/DOM, or on-hit global effects in these rules.
 */
(function(root) {
  "use strict";
  const RULES = Object.freeze({
    chainChance: 0.10,
    maxHits: 10,
    normalDamage: 1.15,
    bulletsPerVolley: 2
  });

  // applyHit(hitNumber) applies ONE full original-shot damage event to the
  // already-struck target. It may return false if this target died / its Boss
  // turret was destroyed. No random roll follows an invalidated victim.
  function resolveHits(applyHit, random = Math.random) {
    if(typeof applyHit !== "function" || typeof random !== "function")
      throw new TypeError("DARK RED requires a hit callback and RNG");
    let hits = 0;
    for(let n=1; n<=RULES.maxHits; n++) {
      const stillViable = applyHit(n);
      hits++;
      if(stillViable === false) break;
      if(n === RULES.maxHits) break;
      if(!(random() < RULES.chainChance)) break;
    }
    return {hits, extraHits: hits - 1, reachedCap: hits === RULES.maxHits};
  }

  const api = Object.freeze({RULES,resolveHits});
  root.NeonDarkRedWeapon = api;
  if(typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
