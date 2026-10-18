/* PINK P: single homing bolt with a 5% bonus 10x homing missile.
 * Independent two-volley burst clock and steering rules (Node/browser).
 */
(function (root) {
  "use strict";

  const RULES = Object.freeze({
    normalDamage: 1.15,
    missileDamageMultiplier: 10,
    missileChance: 0.05,
    volleysBeforeRest: 2,
    restSeconds: 0.4,
    bulletSpeed: 940,
    turnRadiansPerSecond: 8.5,
    bulletLifetimeSeconds: 3.6
  });

  function createState() {
    return { volleys: 0 };
  }

  function switchWeapon(state) {
    if (state) state.volleys = 0;
  }

  // Called exactly once per player firing action, not per projectile impact,
  // missile collision, or frame. Each action always fires one normal pink bolt.
  // The independent special roll may add ONE missile (subject to shared cap).
  function fire(state, regularCooldown, random = Math.random) {
    if (!state || !Number.isInteger(state.volleys) || state.volleys < 0 ||
        !Number.isFinite(regularCooldown) || regularCooldown <= 0 ||
        typeof random !== "function") {
      throw new TypeError("Valid PINK volley state, cooldown, and RNG required");
    }
    const roll = random();
    if (!Number.isFinite(roll) || roll < 0 || roll >= 1) {
      throw new RangeError("PINK special roll must be in [0, 1)");
    }
    state.volleys += 1;
    const rest = state.volleys >= RULES.volleysBeforeRest;
    if (rest) state.volleys = 0;
    return {
      special: roll < RULES.missileChance,
      rest,
      cooldown: rest ? RULES.restSeconds : regularCooldown
    };
  }

  function normalizeAngle(angle) {
    // [-PI, PI], including wrap around straight left.
    return Math.atan2(Math.sin(angle), Math.cos(angle));
  }

  // Homing changes ONLY direction, not the underlying shot's damage/speed.
  // Missing/dead/inactive target => continue with the previous velocity.
  // Caller uses swept-segment collisions after updating position.
  function steer(bullet, target, dt) {
    if (!bullet || !(dt > 0) || !Number.isFinite(dt) ||
        !target || !(target.hp > 0) || target.active === false ||
        !Number.isFinite(target.x) || !Number.isFinite(target.y)) return false;

    const dx = target.x - bullet.x, dy = target.y - bullet.y;
    if (dx === 0 && dy === 0) return false;
    const speed = Math.hypot(bullet.vx, bullet.vy);
    if (!(speed > 0) || !Number.isFinite(speed)) return false;

    const current = Math.atan2(bullet.vy, bullet.vx);
    const desired = Math.atan2(dy, dx);
    const maxDelta = RULES.turnRadiansPerSecond * dt;
    const delta = Math.max(-maxDelta, Math.min(maxDelta, normalizeAngle(desired - current)));
    const direction = current + delta;
    bullet.vx = Math.cos(direction) * speed;
    bullet.vy = Math.sin(direction) * speed;
    return true;
  }

  const api = Object.freeze({ RULES, createState, switchWeapon, fire, steer });
  root.NeonPinkWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
