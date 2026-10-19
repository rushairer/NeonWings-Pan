/* ECLIPSE P: dark-red-gated, full 360-degree penetrating shockwaves.
 * Pure simulation geometry, no Canvas or DOM, one hit per live target per wave.
 */
(function(root) {
  "use strict";
  const RULES = Object.freeze({
    normalDamage: 1.15,
    cooldownSeconds: 0.1,
    expandSpeed: 1600,
    maxRadius: 1500,
    maxWaves: 12
  });
  function canEquip(weapon) {
    return weapon === "darkred" || weapon === "eclipse";
  }
  function createWave(origin, power) {
    if (!origin || !Number.isFinite(origin.x) || !Number.isFinite(origin.y) ||
        !Number.isFinite(power) || power <= 0) {
      throw new TypeError("Shockwave requires a finite origin and positive power");
    }
    return {
      x: origin.x, y: origin.y, power, radius: 0, previousRadius: 0,
      hitEnemies: [], hitBoss: false
    };
  }
  function advance(wave, dt) {
    if (!wave || !Number.isFinite(dt) || dt <= 0) return false;
    wave.previousRadius = wave.radius;
    wave.radius = Math.min(RULES.maxRadius, wave.radius + RULES.expandSpeed * dt);
    return wave.radius > wave.previousRadius;
  }
  // Swept ANNULUS means no angular gaps or tunnelling at low FPS.
  function crossesCircle(wave, x, y, radius = 0) {
    if (!wave || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    const d = Math.hypot(x - wave.x, y - wave.y);
    const r = Math.max(0, radius || 0);
    return wave.radius >= Math.max(0, d - r) &&
      wave.previousRadius <= d + r;
  }
  function crossesEnemy(wave, enemy) {
    return enemy && enemy.hp > 0 && crossesCircle(
      wave, enemy.x, enemy.y, enemy.r);
  }
  function crossesBoss(wave, boss) {
    if (!boss?.active || !(boss.hp > 0) || !wave) return false;
    const dx = Math.abs(wave.x - boss.x), dy = Math.abs(wave.y - boss.y);
    const low = Math.hypot(Math.max(dx - boss.rx, 0),
      Math.max(dy - boss.ry, 0));
    const high = Math.hypot(dx + boss.rx, dy + boss.ry);
    return wave.radius >= low && wave.previousRadius <= high;
  }
  function markEnemy(wave, enemy) {
    if (!crossesEnemy(wave, enemy) || wave.hitEnemies.includes(enemy)) return false;
    wave.hitEnemies.push(enemy);
    return true;
  }
  function markBoss(wave, boss) {
    if (wave.hitBoss || !crossesBoss(wave, boss)) return false;
    wave.hitBoss = true;
    return true;
  }
  const api = Object.freeze({
    RULES, canEquip, createWave, advance, crossesCircle, crossesEnemy,
    crossesBoss, markEnemy, markBoss
  });
  root.NeonEclipseWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
