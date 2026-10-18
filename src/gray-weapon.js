/* Gray P: mutually exclusive knockback, stun, or amplified damage per hit.
 * Pure deterministic rules; the caller supplies a single random roll per hit.
 */
(function (root) {
  "use strict";

  const RULES = Object.freeze({
    knockbackChance: 0.20,
    stunChance: 0.05,
    amplifiedDamageChance: 0.75,
    amplifiedDamageMultiplier: 1.5,
    knockbackDistance: 100,
    stunSeconds: 0.5,
    volleysBeforeRest: 5,
    restSeconds: 0.4
  });

  // One firing action is a two-bullet volley. Following every fifth volley,
  // pause for 0.4 seconds, then start a fresh five-volley sequence.
  function createState() {
    return { volleys: 0 };
  }

  function switchWeapon(state) {
    if (state) state.volleys = 0;
  }

  function fire(state, regularCooldown) {
    if (!state || !Number.isFinite(regularCooldown) || regularCooldown <= 0) {
      throw new TypeError("Gray volley state and regular cooldown are required");
    }
    state.volleys += 1;
    const rest = state.volleys >= RULES.volleysBeforeRest;
    if (rest) state.volleys = 0;
    return { rest, cooldown: rest ? RULES.restSeconds : regularCooldown };
  }

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
    if (!target || !(target.hp > 0) || !Number.isFinite(roll) || roll < 0 || roll >= 1) {
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
    if (roll < RULES.knockbackChance + RULES.stunChance) {
      target.grayStunRemaining = RULES.stunSeconds;
      return { kind: "stun", distance: 0 };
    }
    // Remaining 75% of hits get normal impact behavior with 1.5x damage.
    // No knockback or stun is attached in this outcome.
    return { kind: "amplified", distance: 0 };
  }

  function damageMultiplier(outcome) {
    return outcome?.kind === "amplified" ? RULES.amplifiedDamageMultiplier : 1;
  }

  // Consume up to half a second of REAL combat time during which neither movement nor
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

  const api = Object.freeze({ RULES, createState, switchWeapon, fire, apply, advance, isStunned, damageMultiplier });
  root.NeonGrayWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
