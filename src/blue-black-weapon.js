/* BLUE-BLACK P: BLACK-only stronger slowing projectile.
 * 90% movement and attack-frequency reduction for five active seconds.
 * Reuses BLACK's single target status and movement/attack clock.
 */
(function(root){
  "use strict";
  const black=(typeof module==="object"&&module.exports)
    ?require("./black-weapon.js"):root.NeonBlackWeapon;
  if(!black)throw new Error("BLUE-BLACK requires BLACK rules");
  const RULES=Object.freeze({
    duration:black.RULES.duration,
    movementScale:0.1,attackScale:0.1,reduction:0.90,
    normalDamage:1.15,speed:1100,radius:9,
    muzzleOffsets:Object.freeze([-10,12]),volleySize:2
  });
  function canEquip(type){
    return type==="black"||type==="blueblack";
  }
  function createShot(){
    return {blackSlow:true,blueBlackSlow:true};
  }
  function apply(target){
    return black.apply(target,RULES.movementScale);
  }
  function isEnhanced(target){
    return black.isSlowed(target)&&Number.isFinite(target.slowScale)&&
      target.slowScale<=RULES.movementScale+1e-10;
  }
  const api=Object.freeze({RULES,canEquip,createShot,apply,isEnhanced});
  root.NeonBlueBlackWeapon=api;
  if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
