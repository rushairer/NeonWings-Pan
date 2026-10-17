/* WHITE P: piercing conductive projectiles, one non-recursive splash per direct hit.
 * Geometry reuses NeonGreenWeapon exactly, not a duplicated radius constant.
 */
(function (root) {
  "use strict";

  const RULES = Object.freeze({
    secondaryDamageFactor: 0.55,
    arcLife: 0.18,
    maxArcEffects: 96
  });

  function createShot() {
    return { whiteConductive: true, hitEnemies: [], whiteBossHit: false };
  }

  // Targets struck directly OR by conduction share the same per-projectile
  // ledger. A target may receive at most one damage event from that projectile.
  function markEnemy(shot, target) {
    if (!shot || !target || target.hp <= 0) return false;
    if (!shot.hitEnemies) shot.hitEnemies = [];
    if (shot.hitEnemies.includes(target)) return false;
    shot.hitEnemies.push(target);
    return true;
  }

  function markBoss(shot, boss) {
    if (!shot || !boss || !boss.active || boss.hp <= 0 || shot.whiteBossHit) return false;
    shot.whiteBossHit = true;
    return true;
  }

  function closestPoint(shot, x, y) {
    const ax = shot.previousX ?? shot.x, ay = shot.previousY ?? shot.y;
    const dx = shot.x - ax, dy = shot.y - ay;
    const len2 = dx * dx + dy * dy;
    const t = len2 > 0 ? Math.max(0, Math.min(1,
      ((x - ax) * dx + (y - ay) * dy) / len2)) : 0;
    return { x: ax + dx * t, y: ay + dy * t, t };
  }

  // A single fan-out from the direct impact. The callbacks apply ordinary
  // damage; NONE may invoke conduct again. Capture the enemy list before
  // applying the direct hit so freshly spawned splitter children cannot get
  // electrical damage in the same impact.
  function conduct(shot, impact, enemies, boss, greenRules, onEnemy, onBoss) {
    if (!shot?.whiteConductive || !greenRules?.RULES) {
      return { enemies: 0, boss: false };
    }
    let count = 0;
    for (const enemy of enemies) {
      if (enemy?.hp > 0 && greenRules.enemyInRange(impact, enemy) &&
          markEnemy(shot, enemy)) {
        onEnemy(enemy);
        count += 1;
      }
    }
    let bossConnected = false;
    if (boss?.active && boss.hp > 0 && greenRules.bossInRange(impact, boss) &&
        markBoss(shot, boss)) {
      onBoss(boss);
      bossConnected = true;
    }
    return { enemies: count, boss: bossConnected };
  }

  const api = Object.freeze({
    RULES, createShot, markEnemy, markBoss, closestPoint, conduct
  });
  root.NeonWhiteWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
