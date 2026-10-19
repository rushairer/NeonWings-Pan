/* RED-ORANGE P: RED's single shared five-star streak/fan system,
 * firing real ORANGE on-contact exploding bullets.
 * The fan's bullet type is fixed when a RED special first triggers.
 */
(function(root) {
  "use strict";
  const red = (typeof module === "object" && module.exports)
    ? require("./red-weapon.js") : root.NeonRedWeapon;
  const orange = (typeof module === "object" && module.exports)
    ? require("./orange-weapon.js") : root.NeonOrangeWeapon;
  if (!red || !orange) throw new Error("RED-ORANGE P requires RED and ORANGE rules");

  const RULES = Object.freeze({
    normalShots: 2,
    normalLanes: Object.freeze([-13,13]),
    normalSpeed: 1120,
    normalRadius: 8,
    normalDamage: orange.RULES.normalDamage,
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
    blastRadius: orange.RULES.radius,
    blastMultiplier: orange.RULES.damageMultiplier
  });

  function canEquip(current) {
    return current === "red" || current === "orange" || current === "redorange";
  }

  // The original ORANGE collision resolver handles the first swept contact,
  // shield and Boss mount priorities, 1.6x direct+area damage (not 1x+1.6x),
  // radius-100 splash and snapshot-before-splitter safeguards.
  function createShot(isFan = false) {
    return {
      orangeBlast: true,
      redOrangeShot: true,
      redOrangeFan: Boolean(isFan)
    };
  }

  // Called only when red.fire(...) reports a brand-new shared-star special;
  // changing P mid-special must never re-tag its original projectiles.
  function markTriggeredFan(sharedRedState) {
    if (!sharedRedState?.special) return false;
    sharedRedState.special.redOrange = true;
    return true;
  }

  function specialIsExplosive(sharedRedState) {
    return Boolean(sharedRedState?.special?.redOrange);
  }

  const api = Object.freeze({
    RULES, canEquip, createShot, markTriggeredFan, specialIsExplosive
  });
  root.NeonRedOrangeWeapon = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
