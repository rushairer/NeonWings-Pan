/* MAGNET P: pure probability, attraction and field-damage rules.
 * Canvas, collision resolution and score accounting stay in game.js.
 */
(function(root) {
  "use strict";
  const RULES = Object.freeze({
    normalDamage: 1.15,
    bulletsPerVolley: 2,
    procChance: 0.10,
    radius: 360,               // Exactly GREEN P's halo radius.
    pullSpeed: 100,            // Game coordinates per active movement second.
    pullSeconds: 2,
    damagePerTargetFactor: 0.6,
    maxFields: 8,
    burstSeconds: 0.35,
    maxBursts: 8
  });
  function triggers(roll) {
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1)
      throw new RangeError("MAGNET trigger roll must be finite in [0,1)");
    return roll < RULES.procChance;
  }
  function createField(x, y, power) {
    if (![x, y, power].every(Number.isFinite) || power <= 0)
      throw new TypeError("MAGNET field requires finite impact coordinates and positive shot power");
    return { x, y, power, remaining: RULES.pullSeconds };
  }
  // Pull EVERY on-screen enemy from any distance, not only enemies already
  // inside the damage circle. Unspawned/offscreen enemies are excluded.
  function visible(target, width = 1280, height = 960) {
    if (!target || !(target.hp > 0)) return false;
    const rx = Math.max(0, target.rx ?? target.r ?? 0);
    const ry = Math.max(0, target.ry ?? target.r ?? 0);
    return Number.isFinite(target.x) && Number.isFinite(target.y) &&
      target.x + rx >= 0 && target.x - rx <= width &&
      target.y + ry >= 0 && target.y - ry <= height;
  }
  // Overlapping fields do NOT stack attraction speed; each enemy follows
  // the nearest center for this frame, with one unambiguous 100/s velocity.
  function nearest(fields, target, width = 1280, height = 960) {
    if (!visible(target, width, height)) return null;
    let chosen = null, score = Infinity;
    for (const field of fields) {
      if (!(field.remaining > 0)) continue;
      const d = (field.x - target.x) ** 2 + (field.y - target.y) ** 2;
      if (d < score) { chosen = field; score = d; }
    }
    return chosen;
  }
  function pull(target, field, movementSeconds, limits = {}) {
    if (!target || !field || !Number.isFinite(movementSeconds) || movementSeconds <= 0)
      return 0;
    const dx = field.x - target.x, dy = field.y - target.y;
    const d = Math.hypot(dx, dy);
    if (!d) return 0;
    const step = Math.min(d, RULES.pullSpeed * movementSeconds);
    const x = target.x, y = target.y;
    const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
    target.x = clamp(x + dx * step / d,
      limits.minX ?? -Infinity, limits.maxX ?? Infinity);
    target.y = clamp(y + dy * step / d,
      limits.minY ?? -Infinity, limits.maxY ?? Infinity);
    return Math.hypot(target.x - x, target.y - y);
  }
  // One simultaneous snapshot at field expiry. Every in-range living target
  // (a Boss hull counts as ONE) receives the SAME N*0.6 shot-strength hit.
  function damage(power, count) {
    if (!Number.isFinite(power) || power <= 0 ||
        !Number.isSafeInteger(count) || count < 0)
      throw new TypeError("MAGNET damage requires shot power and nonnegative target count");
    return power * count * RULES.damagePerTargetFactor;
  }
  const api = Object.freeze({
    RULES, triggers, createField, visible, nearest, pull, damage
  });
  root.NeonMagnetWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
