/* ORANGE P: 100-unit blast on the FIRST projectile impact.
 * Gameplay rules have no Canvas/DOM dependency and can be unit-tested.
 */
(function (root) {
  "use strict";

  const RULES = Object.freeze({
    radius: 100,
    damageMultiplier: 3,
    normalDamage: 1.15,
    explosionLifetimeSeconds: 0.35,
    maxExplosionEffects: 48
  });

  const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

  function enemyInRange(center, enemy) {
    if (!center || !enemy || !(enemy.hp > 0)) return false;
    const r = RULES.radius + Math.max(0, enemy.r || 0);
    return (enemy.x - center.x) ** 2 + (enemy.y - center.y) ** 2 <= r * r;
  }

  function bossInRange(center, boss) {
    if (!center || !boss?.active || !(boss.hp > 0)) return false;
    const dx = Math.max(0, Math.abs(center.x - boss.x) - boss.rx);
    const dy = Math.max(0, Math.abs(center.y - boss.y) - boss.ry);
    return dx * dx + dy * dy <= RULES.radius ** 2;
  }

  // Earliest point of intersection, not the projectile's END-OF-FRAME
  // position. This avoids detonating behind nearby targets at large frame dt.
  // Call only for a target already confirmed hit by swept collision.
  function circleImpact(shot, target, combinedRadius) {
    const x0 = shot.previousX ?? shot.x;
    const y0 = shot.previousY ?? shot.y;
    const dx = shot.x - x0, dy = shot.y - y0;
    const ox = x0 - target.x, oy = y0 - target.y;
    const a = dx * dx + dy * dy;
    const c = ox * ox + oy * oy - combinedRadius * combinedRadius;
    let t = 0;
    if (c > 0 && a > 0) {
      const b = 2 * (ox * dx + oy * dy);
      const d = b * b - 4 * a * c;
      if (d >= 0) {
        t = clamp((-b - Math.sqrt(d)) / (2 * a), 0, 1);
      } else {
        t = clamp(-(ox * dx + oy * dy) / a, 0, 1);
      }
    }
    return { x: x0 + t * dx, y: y0 + t * dy, t };
  }

  function bossImpact(shot, boss, bulletRadius = 0) {
    const x0 = shot.previousX ?? shot.x;
    const y0 = shot.previousY ?? shot.y;
    const vx = shot.x - x0, vy = shot.y - y0;
    const minX = boss.x - boss.rx - bulletRadius;
    const maxX = boss.x + boss.rx + bulletRadius;
    const minY = boss.y - boss.ry - bulletRadius;
    const maxY = boss.y + boss.ry + bulletRadius;
    let enter = 0, exit = 1;
    for (const [origin, velocity, low, high] of [
      [x0, vx, minX, maxX], [y0, vy, minY, maxY]
    ]) {
      if (velocity === 0) {
        if (origin < low || origin > high) return null;
        continue;
      }
      const a = (low - origin) / velocity;
      const b = (high - origin) / velocity;
      enter = Math.max(enter, Math.min(a, b));
      exit = Math.min(exit, Math.max(a, b));
      if (enter > exit) return null;
    }
    if (enter > 1 || exit < 0) return null;
    const t = clamp(enter, 0, 1);
    return { x: x0 + t * vx, y: y0 + t * vy, t };
  }

  // Direct target has ALREADY been dealt exactly 3x normal-shot damage.
  // These callbacks process only OTHER targets. Snapshot the list to prevent
  // newly spawned splitter children from being hit by the same explosion.
  // Damage is strictly one event per target and never triggers another blast.
  function splash(center, enemies, boss, directTarget, onEnemy, onBoss) {
    if (!center || !Array.isArray(enemies)) return { enemies: 0, boss: false };
    let count = 0;
    for (const enemy of enemies.slice()) {
      if (enemy === directTarget || !enemyInRange(center, enemy)) continue;
      onEnemy(enemy);
      count++;
    }
    const bossConnected = boss !== directTarget && bossInRange(center, boss);
    if (bossConnected) onBoss(boss);
    return { enemies: count, boss: bossConnected };
  }

  const api = Object.freeze({
    RULES, enemyInRange, bossInRange, circleImpact, bossImpact, splash
  });
  root.NeonOrangeWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
