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
    bulletLifetimeSeconds: 3.6,
    specialMissileSize: 100,
    explosionLifetimeSeconds: 0.55,
    maxExplosionEffects: 12
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

  // Reuse GREEN's circle/AABB intersection tests so the pink blast and green
  // aura can never disagree about range. Direct missile damage has already
  // been applied by the caller; exclude that same enemy or Boss from splash.
  // This is one instantaneous, non-propagating pulse. Callers provide an
  // enemy snapshot captured before direct damage to exclude split-spawned
  // minions and newly appearing wave/Boss targets.
  function splash(center, enemies, boss, directTarget, greenRules, onEnemy, onBoss) {
    if (!center || !Number.isFinite(center.x) || !Number.isFinite(center.y) ||
        !Array.isArray(enemies) || !greenRules?.enemyInRange ||
        !greenRules?.bossInRange) {
      return { enemies: 0, boss: false };
    }
    let hitCount = 0;
    for (const enemy of enemies.slice()) {
      if (!enemy || enemy === directTarget || !(enemy.hp > 0) ||
          !greenRules.enemyInRange(center, enemy)) continue;
      onEnemy(enemy);
      hitCount++;
    }
    const hitBoss = Boolean(boss?.active && boss.hp > 0 &&
      boss !== directTarget && greenRules.bossInRange(center, boss));
    if (hitBoss) onBoss(boss);
    return { enemies: hitCount, boss: hitBoss };
  }

  function splashDamage(missilePower) {
    return missilePower / RULES.missileDamageMultiplier;
  }

  const api = Object.freeze({
    RULES, createState, switchWeapon, fire, steer, splash, splashDamage
  });
  root.NeonPinkWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
