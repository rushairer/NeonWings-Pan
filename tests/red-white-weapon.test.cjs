const test = require("node:test");
const assert = require("node:assert/strict");
const combo = require("../src/red-white-weapon.js");
const red = require("../src/red-weapon.js");
const white = require("../src/white-weapon.js");

test("RED-WHITE P requires currently equipped RED, WHITE or RED-WHITE",()=>{
  assert.equal(combo.canEquip("red"),true);
  assert.equal(combo.canEquip("white"),true);
  assert.equal(combo.canEquip("redwhite"),true);
  for(const weapon of [null,"blue","darkred","stasis","solar","eclipse","arcLaser"])
    assert.equal(combo.canEquip(weapon),false, String(weapon));
});

test("RED-WHITE inherits EXACT RED action and fan counts, rest, chance and shared stars",()=>{
  assert.equal(combo.RULES.normalShots,2);
  assert.deepEqual(combo.RULES.normalLanes,[-13,13]);
  for(const key of ["baseVolleys","maxStars","restSeconds","volleySeconds",
    "specialChance","specialShots","specialSeconds"])
    assert.equal(combo.RULES[key],red.RULES[key],key);
  assert.equal(combo.RULES.normalDamage,1.15);
  assert.equal(combo.RULES.specialDamage,0.38);
  assert.equal(combo.RULES.specialShots,250);
  assert.equal(combo.RULES.secondaryDamageFactor,
    white.RULES.secondaryDamageFactor);
});

test("RED-WHITE produces real WHITE persistent piercing conductive projectiles",()=>{
  const a=combo.createShot(),b=combo.createShot(true);
  for(const shot of [a,b]){
    assert.equal(shot.redWhiteShot,true);
    assert.equal(shot.whiteConductive,true);
    assert.deepEqual(shot.hitEnemies,[]);
    assert.equal(shot.whiteBossHit,false);
  }
  assert.equal(a.redWhiteFan,false);
  assert.equal(b.redWhiteFan,true);
  assert.notEqual(a.hitEnemies,b.hitEnemies,
    "Every bullet needs its own immutable victim accounting");
  const e={hp:2};
  assert.equal(white.markEnemy(a,e),true);
  assert.equal(white.markEnemy(a,e),false);
  assert.equal(white.markEnemy(b,e),true);
});

test("RED-WHITE flags only its OWN active fan while preserving shared RED star progression",()=>{
  const state=red.createState();
  assert.equal(combo.markTriggeredFan(state),false);
  assert.equal(combo.specialIsElectric(state),false);
  const trigger=red.fire(state,0);
  assert.equal(trigger.triggered,true);
  assert.equal(combo.markTriggeredFan(state),true);
  assert.equal(combo.specialIsElectric(state),true);
  let emitted=0;
  const done=red.tick(state,3,()=>emitted++);
  assert.equal(emitted,250);
  assert.equal(done.completed,true);
  assert.equal(done.upgraded,true);
  assert.equal(state.special,null);
  assert.equal(state.stars,1);
  assert.equal(combo.specialIsElectric(state),false);
  const subsequent=red.fire(state,0);
  assert.equal(subsequent.triggered,true);
  assert.equal(combo.specialIsElectric(state),false,
    "Ordinary RED special must not inherit last RED-WHITE fan tag");
});

test("RED-WHITE shares RED cooldown thresholds at stars 0 through 5",()=>{
  const state=red.createState();
  for(let stars=0;stars<=red.RULES.maxStars;stars++){
    state.stars=stars;
    red.switchWeapon(state);
    for(let i=0;i<red.RULES.baseVolleys+stars;i++){
      const v=red.fire(state,.99);
      assert.equal(v.cooldown, i===red.RULES.baseVolleys+stars-1 ?
        .4 : .1);
    }
    assert.equal(state.volleys,0);
  }
});
