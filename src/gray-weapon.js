/* Gray P: a direct projectile hit either knocks back or stuns its target.
 * Pure deterministic rules; the caller supplies a single random roll per hit.
 */
(function (root) {
  "use strict";

  const RULES = Object.freeze({
    knockbackChance: 0.5,
    knockbackDistance: 100,
    stunSeconds: 1
  });

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function isStunned(target) {
    return Number.isFinite(target?.grayStunRemaining) &&
      target.grayStunRemaining > 0;
  }

  // For an ordinary enemy, move 100 logical units in the incoming projectile
  // direction (away from the player). Bosses also shift the scripted arena
  // anchor so their knockback is not overwritten by the next position update.
  // Arena boundaries cap displacement instead of ejecting bosses from view.
  function apply(target, roll, options = {}) {
    if (!target || !(target.hp > 0) || !Number.isFinite(roll)) {
      return { kind: "none", distance: 0 };
    }
    if (roll < RULES.knockbackChance) {
      const direction = options.direction === -1 ? -1 : 1;
      const minX = Number.isFinite(options.minX) ? options.minX : -120;
      const maxX = Number.isFinite(options.maxX) ? options.maxX : 1400;
      const desired = RULES.knockbackDistance * direction;
      const origin = options.boss && Number.isFinite(target.targetX)
        ? target.targetX : target.x;
      const displaced = clamp(origin + desired, minX, maxX) - origin;
      if (Number.isFinite(target.targetX) && options.boss) {
        target.targetX += displaced;
      }
      target.x = clamp(target.x + displaced, minX, maxX);
      return { kind: "knockback", distance: Math.abs(displaced) };
    }
    target.grayStunRemaining = RULES.stunSeconds;
    return { kind: "stun", distance: 0 };
  }

  // Consume one second of REAL combat time during which neither movement nor
  // attacks advance. BLACK slow's 5s countdown must still expire during stun;
  // first consume the frozen portion, then advance the remaining portion with
  // the BLACK speed multiplier. No overwriting permanent enemy base stats.
  function advance(target, dt, blackRules) {
    if (!target || !Number.isFinite(dt) || dt <= 0) {
      return { movementDt: 0, attackDt: 0 };
    }
    const stunned = Math.min(dt, isStunned(target) ? target.grayStunRemaining : 0);
    target.grayStunRemaining = Math.max(0,
      (isStunned(target) ? target.grayStunRemaining : 0) - dt);
    if (blackRules) {
      if (stunned > 0) blackRules.advance(target, stunned);
      return blackRules.advance(target, dt - stunned);
    }
    return { movementDt: dt - stunned, attackDt: dt - stunned };
  }

  const api = Object.freeze({ RULES, apply, advance, isStunned });
  root.NeonGrayWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
