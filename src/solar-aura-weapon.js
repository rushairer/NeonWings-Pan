/* SOLAR AURA P: GREEN-only evolution with a 0.1-second radial pulse.
 * Keep GREEN's original 0.4-second logic and geometry unchanged.
 * This is simulation-only; drawing a glowing ring never deals damage.
 */
(function(root) {
  "use strict";
  const green = (typeof module === "object" && module.exports)
    ? require("./green-weapon.js") : root.NeonGreenWeapon;
  if (!green) throw new Error("SOLAR AURA requires GREEN rules");

  const RULES = Object.freeze({
    radius: green.RULES.radius,
    secondsPerPulse: 0.1,
    damagePerPulse: green.RULES.damagePerPulse
  });

  // Only the currently equipped GREEN P can evolve into SOLAR AURA.
  // Recollecting SOLAR while already equipped replenishes its P level.
  function canEquip(current) {
    return current === "green" || current === "solar";
  }

  // One global timer starts on equip and continues with or without targets.
  // The caller only ticks during active WAVE/BOSS gameplay. Switching from
  // GREEN to SOLAR resets the shared aura phase; recollecting SOLAR does not.
  function tick(state, dt, active, onPulse) {
    if (!active) {
      green.switchWeapon(state);
      return 0;
    }
    if (!Number.isFinite(dt) || dt <= 0) return 0;
    const total = state.elapsed + dt;
    const pulses = Math.floor((total + 1e-9) / RULES.secondsPerPulse);
    state.elapsed = Math.max(0, total - pulses * RULES.secondsPerPulse);
    for (let i = 0; i < pulses; i++) onPulse();
    return pulses;
  }

  const api = Object.freeze({
    RULES, canEquip, tick,
    enemyInRange: green.enemyInRange,
    bossInRange: green.bossInRange
  });
  root.NeonSolarAuraWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
