/* ALLIANCE P: turn defeated normal enemies into right-moving friendly units.
 * Friendlies never enter enemy collections or enemy projectile collision paths.
 */
(function(root) {
  "use strict";
  const RULES = Object.freeze({
    normalDamage: 1.15,
    maxAllies: 24,
    lifetimeSeconds: 10,
    moveSpeed: 245,
    shootIntervalSeconds: 0.65,
    shootSpeed: 960,
    shotDamage: 1.15,
    maxAllyBullets: 120,
    shotLifetimeSeconds: 2.1
  });
  function canConvert(enemy, currentStageMode, currentAllyCount) {
    return !!enemy && Number.isFinite(enemy.x) && Number.isFinite(enemy.y) &&
      currentStageMode === "WAVE" && currentAllyCount < RULES.maxAllies &&
      enemy.r > 0 && typeof enemy.kind === "string" &&
      enemy.friendly !== true && enemy.recruited !== true;
  }
  // Preserve original enemy shape/kind for a recognizable conversion, but no
  // hostile status, shield, score or enemy attack timers carry across teams.
  function createAlly(enemy) {
    if (!enemy || !Number.isFinite(enemy.x) || !Number.isFinite(enemy.y))
      throw new TypeError("A defeated enemy is required");
    return {
      friendly: true, kind: enemy.kind, minion: !!enemy.minion,
      sizeMul: enemy.sizeMul || 1,
      x: enemy.x, y: enemy.y, r: Math.max(12, enemy.r || 18),
      hp: 1, maxHp: 1, color: "#ff80d8", core: "#87caff",
      life: RULES.lifetimeSeconds, shootCd: 0.15,
      wave: enemy.wave || 0, t: enemy.t || 0,
      slowRemaining: 0, grayStunRemaining: 0,
      shieldHp: 0, shieldMax: 0
    };
  }
  function advance(ally, dt) {
    if (!ally || !Number.isFinite(dt) || dt <= 0) return;
    ally.x += RULES.moveSpeed * dt;
    ally.t += dt;
    ally.life -= dt;
    ally.shootCd -= dt;
  }
  function createShot(ally, damageScale = 1) {
    return {
      friendlyShot: true, x: ally.x + ally.r * .65,
      y: ally.y, previousX: ally.x + ally.r * .65,
      previousY: ally.y, vx: RULES.shootSpeed, vy: 0,
      r: 8, power: RULES.shotDamage * damageScale,
      life: RULES.shotLifetimeSeconds
    };
  }
  const api = Object.freeze({ RULES, canConvert, createAlly, advance, createShot });
  root.NeonRecruitWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
