/* SKY P: adaptive light-blue twin-shot weapon.
 * Read the actual game.hp (player object is positional state only).
 * At >3 hearts bullets deal 2.5x; at <=3 hearts bullets seek and slow.
 */
(function(root) {
  "use strict";
  const RULES = Object.freeze({
    thresholdHp: 3,
    normalDamage: 1.15,
    boostMultiplier: 2.5,
    bulletSpeed: 1100,
    seekingLifetimeSeconds: 3.6,
    turnRadiansPerSecond: 7.0,
    muzzleYOffsets: Object.freeze([-10, 12])
  });
  function mode(hp) {
    if (!Number.isFinite(hp)) throw new Error("SKY mode requires finite game.hp");
    return hp > RULES.thresholdHp
      ? { boost: true, multiplier: RULES.boostMultiplier, homing: false, slow: false }
      : { boost: false, multiplier: 1, homing: true, slow: true };
  }
  function readHealth(game) {
    return Number.isFinite(game?.hp) ? game.hp : null;
  }
  function selectTarget(bullet, enemies, boss) {
    let target = null, nearest = Infinity;
    for (const enemy of enemies || []) {
      if (!(enemy?.hp > 0)) continue;
      const d = (enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2;
      if (d < nearest) { nearest = d; target = enemy; }
    }
    if (boss?.active && boss.hp > 0) {
      const d = (boss.x - bullet.x) ** 2 + (boss.y - bullet.y) ** 2;
      if (d < nearest) target = boss;
    }
    return target;
  }
  function steer(bullet, enemies, boss, dt) {
    if (!bullet || !(dt > 0) || !Number.isFinite(dt)) return;
    const target = selectTarget(bullet, enemies, boss);
    if (!target) return;
    const speed = Math.hypot(bullet.vx, bullet.vy) || RULES.bulletSpeed;
    const previous = Math.atan2(bullet.vy, bullet.vx);
    const desired = Math.atan2(target.y - bullet.y, target.x - bullet.x);
    const delta = Math.atan2(Math.sin(desired - previous), Math.cos(desired - previous));
    const max = RULES.turnRadiansPerSecond * dt;
    const angle = previous + Math.max(-max, Math.min(max, delta));
    bullet.vx = speed * Math.cos(angle);
    bullet.vy = speed * Math.sin(angle);
  }
  const api = Object.freeze({ RULES, mode, readHealth, selectTarget, steer });
  root.NeonSkyWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
