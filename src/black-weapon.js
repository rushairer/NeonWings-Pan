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

  // Subsequent hits refresh the five-second expiry without multiplying the
  // penalty. The debuff remains on the target after the player swaps weapons.
  function apply(target) {
    if (!target || typeof target !== "object") return false;
    target.slowRemaining = RULES.duration;
    return true;
  }

  function isSlowed(target) {
    return Number.isFinite(target?.slowRemaining) && target.slowRemaining > 0;
  }

  // Precisely split a frame that crosses the 5s expiry: the slow segment runs
  // at half speed and the normal remainder runs at full speed. This ensures
  // 50% movement AND 50% attack frequency, without modifying base stats.
  // Paused/transitional frames never call advance, so the timer is frozen.
  function advance(target, dt) {
    if (!target || !Number.isFinite(dt) || dt <= 0) {
      return { movementDt: 0, attackDt: 0 };
    }
    const slowed = Math.min(dt, isSlowed(target) ? target.slowRemaining : 0);
    target.slowRemaining = Math.max(0, (isSlowed(target) ? target.slowRemaining : 0) - dt);
    return {
      movementDt: (dt - slowed) + slowed * RULES.movementScale,
      attackDt: (dt - slowed) + slowed * RULES.attackScale
    };
  }

  const api = Object.freeze({ RULES, apply, isSlowed, advance });
  root.NeonBlackWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
