const test = require("node:test");
const assert = require("node:assert/strict");
const gray = require("../src/gray-weapon.js");
const flame = require("../src/gray-flame-weapon.js");

test("GRAY FLAME only evolves when equipped GRAY or its own same P",()=>{
  for (const weapon of [null,"blue","red","darkred","redwhite","white","solar","magnet"])
    assert.equal(flame.canEquip(weapon),false,String(weapon));
  assert.equal(flame.canEquip("gray"),true);
  assert.equal(flame.canEquip("grayflame"),true);
});

test("GRAY FLAME preserves GRAY volley schedule and separate 20/5/75 impact RNG",()=>{
  assert.equal(flame.RULES.volleySize,2);
  assert.equal(flame.RULES.volleysBeforeRest,gray.RULES.volleysBeforeRest);
  assert.equal(flame.RULES.restSeconds,gray.RULES.restSeconds);
  assert.equal(flame.RULES.baseBulletDamage,1.15);
  for(const [roll,expected] of [[0,"knockback"],[.199,"knockback"],
      [.2,"stun"],[.249,"stun"],[.25,"amplified"],[.999,"amplified"]]){
    assert.equal(gray.apply({hp:10,x:400},roll).kind,expected);
  }
});

test("GRAY FLAME ignition is strict 20% chance only on living hit targets",()=>{
  assert.equal(flame.RULES.procChance,.2);
  for (const [roll,expected] of [[0,true],[.199999,true],[.2,false],[.999,false],
      [-1,false],[1,false],[NaN,false],[Infinity,false]]) {
    assert.equal(flame.rollIgnite(roll),expected,String(roll));
  }
  const e={hp:100};
  assert.equal(flame.ignite(e,.2,1.15),false);
  assert.equal(e.grayFlame,undefined);
  assert.equal(flame.ignite({hp:0},0,1.15),false);
  assert.equal(flame.ignite(e,0,-1),false);
  assert.equal(flame.ignite(e,0,1.15),true);
  assert.equal(flame.burning(e),true);
  assert.ok(Math.abs(e.grayFlame.power-.69)<1e-12);
});

test("GRAY FLAME burns 10 times over exactly 5s for 0.6x original scaled power",()=>{
  const e={hp:100};
  flame.ignite(e,0,1.15);
  let ticks=0,damage=0;
  const tick=()=>{ticks++;damage+=e.grayFlame.power;};
  assert.equal(flame.advance(e.grayFlame,.499,tick),0);
  assert.equal(damage,0);
  assert.equal(flame.advance(e.grayFlame,.001,tick),1);
  assert.ok(Math.abs(damage-.69)<1e-12);
  assert.equal(flame.advance(e.grayFlame,3,tick),6);
  assert.equal(ticks,7);
  assert.equal(flame.advance(e.grayFlame,1.5,tick),3);
  assert.equal(ticks,10);
  assert.ok(Math.abs(damage-6.9)<1e-10);
  assert.equal(e.grayFlame.remaining,0);
  assert.equal(flame.burning(e),false);
  assert.equal(flame.advance(e.grayFlame,100,tick),0);
  assert.equal(ticks,10);
});

test("GRAY FLAME repeated proc refreshes 5s but never stacks and keeps strong damage",()=>{
  const e={hp:40};
  flame.ignite(e,0,3.45);
  assert.ok(Math.abs(e.grayFlame.power-2.07)<1e-12);
  flame.advance(e.grayFlame,1,()=>{});
  assert.equal(e.grayFlame.remaining,4);
  assert.equal(flame.ignite(e,.199,1.15),true);
  assert.equal(e.grayFlame.remaining,5);
  assert.equal(e.grayFlame.elapsed,0);
  assert.ok(Math.abs(e.grayFlame.power-2.07)<1e-12);
  assert.equal(flame.ignite(e,.2,1.15),false);
  assert.equal(e.grayFlame.remaining,5);
  const n={hp:30};
  flame.ignite(n,0,1.15);
  assert.ok(Math.abs(n.grayFlame.power-.69)<1e-12);
  flame.ignite(n,0,2.3);
  assert.ok(Math.abs(n.grayFlame.power-1.38)<1e-12);
});

test("GRAY FLAME ignores invalid/frozen delta and stops promptly when target dies",()=>{
  const e={hp:3};
  flame.ignite(e,0,1.15);
  for(const dt of [0,-1,NaN,Infinity]){
    assert.equal(flame.advance(e.grayFlame,dt,()=>{}),0);
  }
  assert.equal(e.grayFlame.remaining,5);
  let applied=0;
  flame.advance(e.grayFlame,2,()=>{
    applied++;
    e.hp=0;
    return false;
  });
  assert.equal(applied,1);
  assert.equal(flame.burning(e),false);
});
