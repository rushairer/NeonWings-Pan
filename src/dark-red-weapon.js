/* DARK RED P: 50% independently repeated FULL hits, capped at 30 events.
 * Each two-bullet firing action separately rolls a 5% guided 10x missile.
 * Pure deterministic rules; game engine owns projectile creation/collisions.
 */
(function (root) {
  "use strict";
  const RULES = Object.freeze({
    chainChance: 0.50,
    maxHits: 30,
    normalDamage: 1.15,
    bulletsPerVolley: 2,
    missileChance: 0.05,
    missileDamageMultiplier: 10,
    specialMissileSize: 100
  });

  // ONE independent roll per actual firing action. Missile impact and every
  // recursive hit must never re-roll the special-missile launch chance.
  function rollMissile(random = Math.random) {
    if (typeof random !== "function") throw new TypeError("DARK RED missile RNG must be callable");
    const roll = random();
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
      throw new RangeError("DARK RED missile roll must be in [0, 1)");
    }
    return roll < RULES.missileChance;
  }

  // First event is guaranteed after REAL collision, each subsequent event
  // needs a FRESH 50% roll; never more than 30 FULL-strength events.
  // Stop immediately on target death, Boss turret break or Boss defeat.
  // The callback always applies exactly the original projectile's power.
  function resolveHits(applyHit, random = Math.random) {
    if (typeof applyHit !== "function" || typeof random !== "function")
      throw new TypeError("DARK RED requires a hit callback and RNG");
    let hits = 0;
    for (let n = 1; n <= RULES.maxHits; n++) {
      const stillViable = applyHit(n);
      hits++;
      if (stillViable === false || n === RULES.maxHits) break;
      if (!(random() < RULES.chainChance)) break;
    }
    return { hits, extraHits: hits - 1, reachedCap: hits === RULES.maxHits };
  }

  // Pink-compatible splash stays ordinary 1x damage; only the directly
  // impacted victim can chain its original 10x missile hit.
  function splashDamage(missilePower) {
    return missilePower / RULES.missileDamageMultiplier;
  }

  const api = Object.freeze({ RULES, rollMissile, resolveHits, splashDamage });
  root.NeonDarkRedWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
