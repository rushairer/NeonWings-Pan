/* ARC LASER P: BROWN-locked direction with through-target WHITE conduction.
 * Geometry and unlock rules are deterministic; combat/Canvas remain in game.js.
 */
(function(root) {
  "use strict";
  const RULES = Object.freeze({
    normalDamage: 1.15,
    maxRange: 1300,
    laserRadius: 3
  });

  // This is a BROWN P upgrade only, never an ordinary color-switch pickup.
  // Once equipped, another copy can replenish its normal P level.
  function canEquip(current) {
    return current === "brown" || current === "arcLaser";
  }

  function trace(from, enemies, boss, brownRules) {
    const lock = brownRules.acquire(from, enemies, boss);
    if (!lock) return null;
    let dx = lock.x - from.x, dy = lock.y - from.y;
    // If a muzzle is inside a target, point at that target's actual center.
    if (Math.hypot(dx, dy) < 1e-8) {
      const target = lock.target;
      dx = target === boss
        ? boss.x + (lock.part?.x || 0) - from.x : target.x - from.x;
      dy = target === boss
        ? boss.y + (lock.part?.y || 0) - from.y : target.y - from.y;
    }
    const d = Math.hypot(dx, dy);
    if (!(d > 0)) return null;
    const end = {
      x: from.x + dx / d * RULES.maxRange,
      y: from.y + dy / d * RULES.maxRange
    };
    const hits = [];
    for (const enemy of enemies || []) {
      if (!(enemy?.hp > 0)) continue;
      const t = brownRules.circleHit(from, end,
        enemy.x, enemy.y, Math.max(0, enemy.r || 0) + RULES.laserRadius);
      if (t === null) continue;
      hits.push({
        kind: "enemy", target: enemy, part: null, t,
        x: from.x + (end.x - from.x) * t,
        y: from.y + (end.y - from.y) * t
      });
    }
    if (boss?.active && boss.hp > 0) {
      const mounts = [];
      for (const part of boss.parts || []) {
        if (!(part.hp > 0)) continue;
        const t = brownRules.circleHit(from, end,
          boss.x + part.x, boss.y + part.y,
          Math.max(0, part.r || 0) + RULES.laserRadius);
        if (t !== null) mounts.push({t,part});
      }
      mounts.sort((a,b)=>a.t-b.t);
      // Exactly one Boss direct hit per tick: the earliest living mount takes
      // priority over hull. Do not leak a destroyed mount into a hull hit.
      const turret = mounts[0];
      const hullT = brownRules.rectHit(from, end,
        boss.x - boss.rx - RULES.laserRadius,
        boss.y - boss.ry - RULES.laserRadius,
        boss.x + boss.rx + RULES.laserRadius,
        boss.y + boss.ry + RULES.laserRadius);
      const t = turret ? turret.t : hullT;
      if (t !== null && t !== undefined) {
        hits.push({
          kind: turret ? "turret" : "boss",
          target: boss, part: turret?.part || null, t,
          x: from.x + (end.x - from.x) * t,
          y: from.y + (end.y - from.y) * t
        });
      }
    }
    hits.sort((a,b)=>a.t-b.t);
    return {
      startX: from.x, startY: from.y, x: end.x, y: end.y,
      hits, arcLaser: true
    };
  }
  const api = Object.freeze({ RULES, canEquip, trace });
  root.NeonArcLaserWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
