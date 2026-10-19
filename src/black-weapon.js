/* Black P temporal slowing: stateless balance and per-target debuff rules.
 * Browser and Canvas independent for deterministic combat verification.
 */
(function (root) {
  "use strict";

  const RULES = Object.freeze({
    duration: 5,
    movementScale: 0.5,
    attackScale: 0.5
  });

  // BLACK defaults to 50%. Stronger variants may pass a smaller scalar.
  // Retain the strongest active effect and refresh one five-second timer.
  function apply(target, scale = RULES.movementScale) {
    if (!target || typeof target !== "object" ||
        !Number.isFinite(scale) || !(scale > 0 && scale <= 1)) return false;
    const previousScale = isSlowed(target)
      ? (Number.isFinite(target.slowScale)
        ? target.slowScale : RULES.movementScale)
      : 1;
    target.slowScale = Math.min(previousScale, scale);
    target.slowRemaining = RULES.duration;
    return true;
  }

  function isSlowed(target) {
    return Number.isFinite(target?.slowRemaining) && target.slowRemaining > 0;
  }

  // Precisely split frames crossing expiry at the target's original
  // slow strength; never modify permanent base stats or launched bullets.
  // Paused/transitional frames never call advance.
  function advance(target, dt) {
    if (!target || !Number.isFinite(dt) || dt <= 0) {
      return { movementDt: 0, attackDt: 0 };
    }
    const active = isSlowed(target);
    const slowed = Math.min(dt, active ? target.slowRemaining : 0);
    const scale = active && Number.isFinite(target.slowScale)
      ? target.slowScale : RULES.movementScale;
    if (active) {
      target.slowRemaining = Math.max(0, target.slowRemaining - dt);
      if (target.slowRemaining === 0) delete target.slowScale;
    }
    return {
      movementDt: (dt - slowed) + slowed * scale,
      attackDt: (dt - slowed) + slowed * scale
    };
  }

  const api = Object.freeze({ RULES, apply, isSlowed, advance });
  root.NeonBlackWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
