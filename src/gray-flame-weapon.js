/* GRAY FLAME P: GRAY-exclusive red/gray gradient evolution.
 * Normal hits use unmodified GRAY RNG. Each surviving real bullet contact
 * adds an INDEPENDENT 20% ignition roll; burns are non-stacking 5-second DoTs.
 */
(function(root) {
  "use strict";
  const gray = (typeof module === "object" && module.exports)
    ? require("./gray-weapon.js") : root.NeonGrayWeapon;
  if (!gray) throw new Error("GRAY FLAME requires GRAY rules");

  const RULES = Object.freeze({
    procChance: 0.20,
    durationSeconds: 5,
    tickSeconds: 0.5,
    normalDamageFactor: 0.6,
    baseBulletDamage: 1.15,
    normalBulletSpeed: 1100,
    normalBulletRadius: 9,
    volleySize: 2,
    maxTicks: 10,
    volleysBeforeRest: gray.RULES.volleysBeforeRest,
    restSeconds: gray.RULES.restSeconds
  });

  function canEquip(weapon) {
    return weapon === "gray" || weapon === "grayflame";
  }

  function rollIgnite(roll) {
    return Number.isFinite(roll) && roll >= 0 && roll < RULES.procChance;
  }

  // shotPower = unamplified ordinary projectile damage (with fighter/
  // Overdrive scale captured at emission), NEVER GRAY's 1.5x RNG outcome.
  // Repeated ignitions refresh one status; retain the greater scaled power,
  // never multiply active layers and never make a weaker refresh downgrade it.
  function ignite(target, roll, shotPower) {
    if (!(target?.hp > 0) || !rollIgnite(roll) ||
        !Number.isFinite(shotPower) || shotPower <= 0) return false;
    const strength = shotPower * RULES.normalDamageFactor;
    const current = target.grayFlame;
    target.grayFlame = {
      remaining: RULES.durationSeconds,
      elapsed: 0,
      power: Math.max(strength,
        current && current.remaining > 0 ? current.power : 0)
    };
    return true;
  }

  // Fixed, frame-rate-independent accumulator. A five-second status produces
  // exactly ten ticks, including its last 5.0s tick, never one at application.
  // Caller advances ONLY during active combat, and checks target liveness
  // between ticks (including after splitter/Boss death stage transitions).
  function advance(status, dt, onTick) {
    if (!status || !(status.remaining > 0) ||
        !Number.isFinite(dt) || dt <= 0) return 0;
    const elapsed = Math.min(dt, status.remaining);
    const total = (status.elapsed || 0) + elapsed;
    const ticks = Math.min(RULES.maxTicks,
      Math.floor((total + 1e-9) / RULES.tickSeconds));
    status.elapsed = Math.max(0, total - ticks * RULES.tickSeconds);
    status.remaining = Math.max(0, status.remaining - elapsed);
    for (let i = 0; i < ticks; i++) {
      if (onTick() === false) break;
    }
    return ticks;
  }

  function burning(target) {
    return !!(target?.hp > 0 && target.grayFlame?.remaining > 0);
  }

  const api = Object.freeze({
    RULES, canEquip, rollIgnite, ignite, advance, burning
  });
  root.NeonGrayFlameWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
