/* Red P weapon timing and progression, independent of Canvas and browser input. */
(function (root) {
  "use strict";

  const RULES = Object.freeze({
    baseVolleys: 5,
    maxStars: 5,
    restSeconds: 0.4,
    volleySeconds: 0.10,
    specialChance: 0.10,
    specialShots: 250,
    specialSeconds: 3,
    halfAngle: Math.PI / 18
  });

  function createState() {
    return { stars: 0, volleys: 0, special: null };
  }

  // A weapon change resets only the ordinary firing streak, not earned stars or
  // an already-triggered special volley.
  function switchWeapon(state) {
    state.volleys = 0;
  }

  function fire(state, roll) {
    state.volleys += 1;
    const rest = state.volleys >= RULES.baseVolleys + state.stars;
    if (rest) state.volleys = 0;

    // Exactly one random trial per ordinary two-line volley. While a special
    // is active, a second 250-shot stream may not be started.
    const triggered = !state.special && Number.isFinite(roll) &&
      roll >= 0 && roll < RULES.specialChance;
    if (triggered) state.special = { elapsed: 0, emitted: 0 };

    return { cooldown: rest ? RULES.restSeconds : RULES.volleySeconds, rest, triggered };
  }

  // Emits an exact total of 250 shots across 3 seconds of active combat time.
  // The co-prime fan index interleaves angles across the complete +/-10 degree
  // cone instead of sweeping all shots monotonically from top to bottom.
  function tick(state, dt, emit) {
    if (!state.special || !Number.isFinite(dt) || dt <= 0) {
      return { fired: 0, completed: false, upgraded: false };
    }
    const special = state.special;
    // RED-BLUE owns the SAME special slot but resolves it when the falling
    // five-point star lands; it must never emit a RED-family 250-shot fan.
    if (special.redBlue)
      return { fired: 0, completed: false, upgraded: false };
    const before = special.emitted;
    special.elapsed = Math.min(RULES.specialSeconds, special.elapsed + dt);
    const target = special.elapsed >= RULES.specialSeconds
      ? RULES.specialShots
      : Math.min(RULES.specialShots, Math.floor(
        special.elapsed * RULES.specialShots / RULES.specialSeconds + 1e-9
      ));

    for (let index = before; index < target; index++) {
      const slot = (index * 73) % RULES.specialShots;
      const angle = (2 * slot / (RULES.specialShots - 1) - 1) * RULES.halfAngle;
      emit(angle, index);
    }
    special.emitted = target;

    if (target === RULES.specialShots) {
      state.special = null;
      const previousStars = state.stars;
      state.stars = Math.min(RULES.maxStars, state.stars + 1);
      return {
        fired: target - before,
        completed: true,
        upgraded: state.stars > previousStars
      };
    }
    return { fired: target - before, completed: false, upgraded: false };
  }

  function takeHit(state) {
    state.stars = Math.max(0, state.stars - 1);
    return state.stars;
  }

  const api = Object.freeze({ RULES, createState, switchWeapon, fire, tick, takeHit });
  root.NeonRedWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
