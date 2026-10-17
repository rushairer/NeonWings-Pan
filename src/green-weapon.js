/* Green P proximity aura: pure combat clock and hit geometry. */
(function (root) {
  "use strict";

  const RULES = Object.freeze({
    radius: 360,
    secondsPerPulse: 0.4,
    damagePerPulse: 2
  });

  function createState() {
    return { elapsed: 0 };
  }

  function switchWeapon(state) {
    state.elapsed = 0;
  }

  // This is a SINGLE global clock anchored to activation/equip of GREEN P.
  // It advances during active combat whether the ring contains zero, one, or
  // many targets; enemy contact must never reset or start a hit timer.
  // Every elapsed 0.4 seconds causes one snapshot damage pulse to current targets.
  // Disabled means the equipped weapon changed and discards the partial interval.
  // Pauses/stage transitions freeze by not calling tick at all.
  function tick(state, dt, active, onPulse) {
    if (!active) {
      switchWeapon(state);
      return 0;
    }
    if (!Number.isFinite(dt) || dt <= 0) return 0;

    const total = state.elapsed + dt;
    const pulses = Math.floor((total + 1e-9) / RULES.secondsPerPulse);
    state.elapsed = Math.max(0, total - pulses * RULES.secondsPerPulse);
    for (let i = 0; i < pulses; i++) onPulse();
    return pulses;
  }

  // The ring reaches an enemy whenever it overlaps any part of its hit circle.
  function enemyInRange(player, enemy) {
    return Math.hypot(player.x - enemy.x, player.y - enemy.y) <=
      RULES.radius + Math.max(0, enemy.r || 0);
  }

  // Boss hulls are axis-aligned rectangles, consistent with existing bullet
  // collisions. Compare against their closest point, not their far-away center.
  function bossInRange(player, boss) {
    const dx = Math.max(Math.abs(player.x - boss.x) - boss.rx, 0);
    const dy = Math.max(Math.abs(player.y - boss.y) - boss.ry, 0);
    return Math.hypot(dx, dy) <= RULES.radius;
  }

  const api = Object.freeze({
    RULES, createState, switchWeapon, tick, enemyInRange, bossInRange
  });
  root.NeonGreenWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
