/* WHITE P: penetrating bolts with probabilistic, capped conductive hops.
 * Geometry reuses NeonGreenWeapon exactly, not a duplicated radius constant.
 */
(function (root) {
  "use strict";

  const RULES = Object.freeze({
    secondaryDamageFactor: 0.60,
    secondHopChance: 0.50,
    thirdHopChance: 0.10,
    maxHops: 3,
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

  // Each DIRECT impact always produces hop 1. A single roll decides whether
  // it gets hop 2 (50%); only then a second independent roll can unlock hop 3
  // (10% conditional, 5% overall). All recipients of a hop are valid origins
  // for the next hop, but no hop may re-damage a victim of this projectile.
  // This is a true bounded breadth-first chain, never uncontrolled recursion.
  function chooseDepth(random = Math.random) {
    if (random() >= RULES.secondHopChance) return 1;
    return random() < RULES.thirdHopChance ? 3 : 2;
  }

  // Apply one 360-radius neighborhood from each source in the current wave.
  // Targets are snapshot before the direct hit, so newly spawned children
  // cannot be hit in that same impact. Callbacks apply normal combat damage
  // and draw only a visual lightning arc from the source to the victim.
  function conduct(shot, impact, enemies, boss, greenRules, onEnemy, onBoss,
      random = Math.random) {
    if (!shot?.whiteConductive || !greenRules?.RULES) {
      return { enemies: 0, boss: false };
    }

    const maxDepth = chooseDepth(random);
    let frontier = [{ x: impact.x, y: impact.y }];
    let count = 0;
    let bossConnected = false;
    for (let depth = 1; depth <= maxDepth && frontier.length; depth++) {
      const next = [];
      for (const source of frontier) {
        for (const enemy of enemies) {
          if (enemy?.hp > 0 && greenRules.enemyInRange(source, enemy) &&
              markEnemy(shot, enemy)) {
            const nextSource = { x: enemy.x, y: enemy.y };
            next.push(nextSource);
            onEnemy(enemy, source, depth);
            count += 1;
          }
        }
        if (boss?.active && boss.hp > 0 &&
            greenRules.bossInRange(source, boss) && markBoss(shot, boss)) {
          next.push({ x: boss.x, y: boss.y });
          onBoss(boss, source, depth);
          bossConnected = true;
        }
      }
      frontier = next;
    }
    return { enemies: count, boss: bossConnected };
  }

  const api = Object.freeze({
    RULES, createShot, markEnemy, markBoss, closestPoint, chooseDepth, conduct
  });
  root.NeonWhiteWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
