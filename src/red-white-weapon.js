/* RED-WHITE P: RED's shared star/fan state + WHITE's conductive projectiles.
 * No second star counter; a special's projectile type is captured on start,
 * so mid-fan weapon changes never recolor/replace already committed volleys.
 */
(function(root) {
  "use strict";
  const red = (typeof module === "object" && module.exports)
    ? require("./red-weapon.js") : root.NeonRedWeapon;
  const white = (typeof module === "object" && module.exports)
    ? require("./white-weapon.js") : root.NeonWhiteWeapon;
  if (!red || !white) throw new Error("RED-WHITE P requires RED and WHITE rules");

  const RULES = Object.freeze({
    normalShots: 2,
    normalLanes: Object.freeze([-13, 13]),
    normalSpeed: 1120,
    normalRadius: 9,
    normalDamage: 1.15,
    specialSpeed: 1060,
    specialRadius: 5,
    specialDamage: 0.38,
    baseVolleys: red.RULES.baseVolleys,
    maxStars: red.RULES.maxStars,
    restSeconds: red.RULES.restSeconds,
    volleySeconds: red.RULES.volleySeconds,
    specialChance: red.RULES.specialChance,
    specialShots: red.RULES.specialShots,
    specialSeconds: red.RULES.specialSeconds,
    secondaryDamageFactor: white.RULES.secondaryDamageFactor
  });

  function canEquip(current) {
    return current === "red" || current === "white" || current === "redwhite";
  }

  // Every shot is a real WHITE piercing bullet with its own WHITE ledger.
  // Emission paths and fan count are provided by RED's existing state machine.
  function createShot(isFan = false) {
    return {
      ...white.createShot(),
      redWhiteShot: true,
      redWhiteFan: Boolean(isFan)
    };
  }

  function markTriggeredFan(sharedRedState) {
    if (!sharedRedState?.special) return false;
    sharedRedState.special.redWhite = true;
    return true;
  }

  function specialIsElectric(sharedRedState) {
    return Boolean(sharedRedState?.special?.redWhite);
  }

  const api = Object.freeze({
    RULES, canEquip, createShot, markTriggeredFan, specialIsElectric
  });
  root.NeonRedWhiteWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
