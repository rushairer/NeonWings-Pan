const test=require("node:test");
const assert=require("node:assert/strict");
const black=require("../src/black-weapon.js");
const blue=require("../src/blue-black-weapon.js");

test("BLUE-BLACK only upgrades currently equipped BLACK or itself",()=>{
  for(const p of ["black","blueblack"])assert.equal(blue.canEquip(p),true);
  for(const p of [null,"blue","purple","white","red","darkred",
      "rainbow","sky","stasis","arcLaser","brownyellow"])
    assert.equal(blue.canEquip(p),false,String(p));
});

test("BLUE-BLACK inherits BLACK's five seconds and twin shot geometry",()=>{
  assert.equal(blue.RULES.duration,black.RULES.duration);
  assert.equal(blue.RULES.duration,5);
  assert.equal(blue.RULES.reduction,.9);
  assert.equal(blue.RULES.movementScale,.1);
  assert.equal(blue.RULES.attackScale,.1);
  assert.equal(blue.RULES.normalDamage,1.15);
  assert.equal(blue.RULES.speed,1100);
  assert.equal(blue.RULES.radius,9);
  assert.equal(blue.RULES.volleySize,2);
  assert.deepEqual(blue.RULES.muzzleOffsets,[-10,12]);
  assert.deepEqual(blue.createShot(),{blackSlow:true,blueBlackSlow:true});
  assert.notEqual(blue.createShot(),blue.createShot());
});

test("a genuine BLUE-BLACK hit slows movement and attacks by exactly 90%",()=>{
  const e={vx:-200,shootCd:2};
  assert.equal(blue.apply(e),true);
  assert.equal(blue.isEnhanced(e),true);
  assert.equal(black.isSlowed(e),true);
  assert.equal(e.slowRemaining,5);
  assert.equal(e.slowScale,.1);
  assert.deepEqual(black.advance(e,1),{movementDt:.1,attackDt:.1});
  assert.equal(e.slowRemaining,4);
  assert.equal(e.vx,-200);
  assert.equal(e.shootCd,2);
});

test("original BLACK/SKY/RAINBOW retain unchanged 50% slow for 5 seconds",()=>{
  const e={};
  black.apply(e);
  assert.equal(e.slowRemaining,5);
  assert.equal(e.slowScale,.5);
  assert.equal(blue.isEnhanced(e),false);
  assert.deepEqual(black.advance(e,1),{movementDt:.5,attackDt:.5});
  assert.equal(e.slowRemaining,4);
});

test("normal BLACK refresh does not downgrade active 90% slow",()=>{
  const e={};
  blue.apply(e);
  assert.equal(black.advance(e,2).movementDt,.2);
  black.apply(e);
  assert.equal(e.slowRemaining,5);
  assert.equal(e.slowScale,.1);
  assert.equal(blue.isEnhanced(e),true);
  assert.deepEqual(black.advance(e,1),{movementDt:.1,attackDt:.1});
});

test("BLUE-BLACK upgrades prior 50% slow and refreshes rather than stacks",()=>{
  const e={};
  black.apply(e);
  black.advance(e,4);
  assert.equal(e.slowRemaining,1);
  blue.apply(e);
  assert.equal(e.slowRemaining,5);
  assert.equal(e.slowScale,.1);
  assert.deepEqual(black.advance(e,1),{movementDt:.1,attackDt:.1});
  blue.apply(e);
  assert.equal(e.slowRemaining,5);
  assert.equal(e.slowScale,.1);
});

test("90% slow expires at 5s, crossing expiry at 0.1 speed then 1.0",()=>{
  const e={};
  blue.apply(e);
  const near=black.advance(e,4.9);
  assert.ok(Math.abs(near.movementDt-.49)<1e-9);
  assert.ok(Math.abs(near.attackDt-.49)<1e-9);
  assert.ok(Math.abs(e.slowRemaining-.1)<1e-9);
  const crossed=black.advance(e,.3);
  assert.ok(Math.abs(crossed.movementDt-.21)<1e-9);
  assert.ok(Math.abs(crossed.attackDt-.21)<1e-9);
  assert.equal(e.slowRemaining,0);
  assert.equal(e.slowScale,undefined);
  assert.equal(blue.isEnhanced(e),false);
  assert.deepEqual(black.advance(e,1),{movementDt:1,attackDt:1});
  black.apply(e);
  assert.equal(e.slowScale,.5);
  assert.deepEqual(black.advance(e,1),{movementDt:.5,attackDt:.5});
});

test("invalid and paused frames never advance BLUE-BLACK status",()=>{
  const e={};
  blue.apply(e);
  for(const dt of [0,-1,NaN,Infinity])
    assert.deepEqual(black.advance(e,dt),{movementDt:0,attackDt:0});
  assert.equal(e.slowRemaining,5);
  assert.equal(blue.isEnhanced(e),true);
});

test("GRAY stun freezes motion but BLUE-BLACK slow expires with active time",()=>{
  const gray=require("../src/gray-weapon.js");
  const e={hp:40,x:500,grayStunRemaining:0};
  blue.apply(e);
  gray.apply(e,.22);
  assert.equal(e.grayStunRemaining,.5);
  assert.deepEqual(gray.advance(e,.25,black),{movementDt:0,attackDt:0});
  assert.equal(e.slowRemaining,4.75);
  const step=gray.advance(e,.5,black);
  assert.ok(Math.abs(step.movementDt-.025)<1e-9);
  assert.ok(Math.abs(step.attackDt-.025)<1e-9);
  assert.equal(e.slowRemaining,4.25);
});

test("invalid scale and invalid targets do not change BLACK status",()=>{
  const e={};
  assert.equal(black.apply(null),false);
  assert.equal(blue.apply(null),false);
  for(const n of [0,-.1,1.1,NaN,Infinity])
    assert.equal(black.apply(e,n),false);
  assert.equal(e.slowRemaining,undefined);
  assert.equal(blue.isEnhanced(e),false);
});
