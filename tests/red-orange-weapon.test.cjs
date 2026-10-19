const test = require("node:test");
const assert = require("node:assert/strict");
const combo = require("../src/red-orange-weapon.js");
const red = require("../src/red-weapon.js");
const orange = require("../src/orange-weapon.js");

test("RED-ORANGE P requires current RED, ORANGE or same RED-ORANGE P",()=>{
  for(const current of ["red","orange","redorange"])
    assert.equal(combo.canEquip(current),true);
  for(const current of [null,"white","redwhite","gray","grayflame","darkred",
    "rainbow","blue","solar"])
    assert.equal(combo.canEquip(current),false,String(current));
});

test("RED-ORANGE inherits exact RED two normal lanes, 5-star shared volley timing and 250-shot fan",()=>{
  assert.equal(combo.RULES.normalShots,2);
  assert.deepEqual(combo.RULES.normalLanes,[-13,13]);
  assert.equal(combo.RULES.normalSpeed,1120);
  assert.equal(combo.RULES.normalRadius,8);
  assert.equal(combo.RULES.normalDamage,1.15);
  assert.equal(combo.RULES.specialDamage,.38);
  assert.equal(combo.RULES.specialSpeed,1060);
  assert.equal(combo.RULES.specialRadius,5);
  for(const key of ["baseVolleys","maxStars","restSeconds","volleySeconds",
    "specialChance","specialShots","specialSeconds"])
    assert.equal(combo.RULES[key],red.RULES[key],key);
  assert.equal(combo.RULES.specialShots,250);
  assert.equal(combo.RULES.blastRadius,orange.RULES.radius);
  assert.equal(combo.RULES.blastRadius,100);
  assert.equal(combo.RULES.blastMultiplier,orange.RULES.damageMultiplier);
  assert.equal(combo.RULES.blastMultiplier,1.6);
});

test("RED-ORANGE ordinary and 250-fan projectiles use true ORANGE first-impact blasts",()=>{
  const normal=combo.createShot(),fan=combo.createShot(true);
  for(const bullet of [normal,fan]){
    assert.equal(bullet.orangeBlast,true);
    assert.equal(bullet.redOrangeShot,true);
    assert.equal(bullet.whiteConductive,undefined);
    assert.equal(bullet.redNormal,undefined);
    assert.equal(bullet.grayImpact,undefined);
  }
  assert.equal(normal.redOrangeFan,false);
  assert.equal(fan.redOrangeFan,true);
  assert.notEqual(normal,fan);
});

test("RED-ORANGE tags only its freshly triggered fan on the ONE shared RED star state",()=>{
  const state=red.createState();
  assert.equal(combo.markTriggeredFan(state),false);
  assert.equal(combo.specialIsExplosive(state),false);
  const result=red.fire(state,0);
  assert.equal(result.triggered,true);
  assert.equal(combo.markTriggeredFan(state),true);
  assert.equal(combo.specialIsExplosive(state),true);
  let count=0;
  const done=red.tick(state,3,()=>count++);
  assert.equal(count,250);
  assert.equal(done.completed,true);
  assert.equal(done.upgraded,true);
  assert.equal(state.stars,1);
  assert.equal(state.special,null);
  const redFan=red.fire(state,0);
  assert.equal(redFan.triggered,true);
  assert.equal(combo.specialIsExplosive(state),false,
    "RED fan must never accidentally inherit an earlier RED-ORANGE projectile tag");
});

test("RED-ORANGE volley and pause thresholds track shared RED stars 0–5",()=>{
  const state=red.createState();
  for(let stars=0;stars<=5;stars++){
    state.stars=stars;
    red.switchWeapon(state);
    for(let i=0;i<5+stars;i++){
      const shot=red.fire(state,.99);
      assert.equal(shot.cooldown,i===4+stars ? .4 : .1);
    }
    assert.equal(state.volleys,0);
  }
  assert.equal(state.stars,5);
  assert.equal(red.takeHit(state),4);
});
