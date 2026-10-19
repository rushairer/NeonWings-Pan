/* STASIS P: augment the ordinary BOMB with a three-second global freeze.
 * Freeze applies to enemies and Bosses, NOT the player or player projectiles.
 * The game's active-combat clock owns simulation and never advances on pause.
 */
(function(root) {
  "use strict";
  const RULES = Object.freeze({ freezeSeconds: 3 });
  function activate() { return RULES.freezeSeconds; }
  function tick(remaining, dt) {
    if (!Number.isFinite(remaining) || remaining <= 0) return 0;
    if (!Number.isFinite(dt) || dt <= 0) return remaining;
    return Math.max(0, remaining - dt);
  }
  function frozen(remaining) { return Number.isFinite(remaining) && remaining > 0; }
  const api = Object.freeze({ RULES, activate, tick, frozen });
  root.NeonStasisWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
