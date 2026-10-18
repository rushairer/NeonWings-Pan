/* LIME P / ORBIT: fire two NORMAL projectiles from the ship's muzzle.
 * The actual flight path curves smoothly outward, joins the radius-360 orbit
 * and then circles the player's MOVING position. Never spawn at the ring.
 *
 * Deterministic geometry and swept polyline segments; no Canvas/DOM access.
 */
(function (root) {
  "use strict";

  const RULES = Object.freeze({
    radius: 360,
    muzzleOffsetX: 62,
    muzzleLaneOffsets: Object.freeze([-10, 12]),
    outwardSeconds: 0.48,
    radiansPerSecond: 2.8,
    bulletLifetimeSeconds: 3.2,
    bulletRadius: 9,
    normalDamage: 1.15,
    bulletsPerVolley: 2,
    maxOrbitingBullets: 32,
    maxSegmentLength: 42,
    maxSegmentsPerStep: 128
  });

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function position(player, angle, radius = RULES.radius) {
    return {
      x: player.x + radius * Math.cos(angle),
      y: player.y + radius * Math.sin(angle)
    };
  }

  // Start from the same dual-lane muzzle as an ordinary BLUE Lv.1 bullet.
  // Do not teleport to the orbital rim or emit prepositioned "satellites".
  function createShot(player, laneOffset = 0) {
    const x = player.x + RULES.muzzleOffsetX;
    const y = player.y + laneOffset;
    const initialRadius = Math.hypot(RULES.muzzleOffsetX, laneOffset);
    return {
      x, y, vx: 1100, vy: 0,
      r: RULES.bulletRadius,
      life: RULES.bulletLifetimeSeconds,
      orbiting: true,
      orbitAngle: Math.atan2(laneOffset, RULES.muzzleOffsetX),
      orbitRadius: initialRadius,
      orbitStartRadius: initialRadius,
      orbitAge: 0,
      orbitCenterX: player.x,
      orbitCenterY: player.y
    };
  }

  // Ease-out radial travel blends into the constant-radius circular path:
  // the outward velocity smoothly tends to zero at exactly R=360.
  function radiusAtAge(startRadius, age) {
    const progress = clamp(age / RULES.outwardSeconds, 0, 1);
    const outwardFraction = 1 - (1 - progress) * (1 - progress);
    return startRadius + (RULES.radius - startRadius) * outwardFraction;
  }

  function step(shot, player, dt) {
    if (!shot?.orbiting || !player || !Number.isFinite(dt) || dt <= 0 ||
        !(shot.life > 0)) return [];
    const activeDt = Math.min(dt, shot.life);
    const expiryFraction = activeDt / dt;
    const oldCenter = {
      x: shot.orbitCenterX,
      y: shot.orbitCenterY
    };
    // The fighter may have moved since the previous simulation step.
    // Interpolate its center, rather than jumping the bullet to the new
    // circle and silently crossing nearby enemies at a teleport.
    const displacementX = (player.x - oldCenter.x) * expiryFraction;
    const displacementY = (player.y - oldCenter.y) * expiryFraction;
    const angularDelta = RULES.radiansPerSecond * activeDt;
    const oldRadius = radiusAtAge(shot.orbitStartRadius, shot.orbitAge);
    const nextRadius = radiusAtAge(shot.orbitStartRadius, shot.orbitAge + activeDt);
    const sweptLength =
      Math.abs(angularDelta) * RULES.radius +
      Math.abs(nextRadius - oldRadius) +
      Math.hypot(displacementX, displacementY);
    const count = Math.min(RULES.maxSegmentsPerStep, Math.max(
      1, Math.ceil(sweptLength / RULES.maxSegmentLength)
    ));

    const initialX = shot.x;
    const initialY = shot.y;
    let fromX = initialX, fromY = initialY;
    const segments = [];
    for (let i = 1; i <= count; i++) {
      const t = i / count;
      const age = shot.orbitAge + activeDt * t;
      const center = {
        x: oldCenter.x + displacementX * t,
        y: oldCenter.y + displacementY * t
      };
      const point = position(center,
        shot.orbitAngle + angularDelta * t,
        radiusAtAge(shot.orbitStartRadius, age)
      );
      segments.push({
        fromX, fromY,
        toX: point.x, toY: point.y
      });
      fromX = point.x;
      fromY = point.y;
    }

    shot.x = fromX;
    shot.y = fromY;
    shot.vx = (fromX - initialX) / activeDt;
    shot.vy = (fromY - initialY) / activeDt;
    shot.orbitAge += activeDt;
    shot.orbitAngle = (shot.orbitAngle + angularDelta) % (Math.PI * 2);
    shot.orbitRadius = nextRadius;
    shot.orbitCenterX = oldCenter.x + displacementX;
    shot.orbitCenterY = oldCenter.y + displacementY;
    shot.life = Math.max(0, shot.life - dt);
    if (shot.life <= 0) shot.dead = true;
    return segments;
  }

  const api = Object.freeze({
    RULES, position, createShot, radiusAtAge, step
  });
  root.NeonLimeWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
