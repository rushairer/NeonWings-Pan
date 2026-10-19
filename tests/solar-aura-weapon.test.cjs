const test = require("node:test");
const assert = require("node:assert/strict");
const green = require("../src/green-weapon.js");
const solar = require("../src/solar-aura-weapon.js");

test("SOLAR AURA requires currently equipped GREEN or SOLAR for upgrades", () => {
  for (const weapon of ["blue", "red", "yellow", "eclipse", "darkred", "recruit", null])
    assert.equal(solar.canEquip(weapon), false, String(weapon));
  assert.equal(solar.canEquip("green"), true);
  assert.equal(solar.canEquip("solar"), true);
});

test("SOLAR reuses GREEN 360 hit geometry and precisely 2 damage per 0.1s", () => {
  assert.equal(solar.RULES.radius, green.RULES.radius);
  assert.equal(solar.RULES.radius, 360);
  assert.equal(solar.RULES.damagePerPulse, green.RULES.damagePerPulse);
  assert.equal(solar.RULES.damagePerPulse, 2);
  assert.equal(solar.RULES.secondsPerPulse, 0.1);
  assert.equal(green.RULES.secondsPerPulse, 0.4);
  const p = { x: 500, y: 480 };
  const e = { x: 882, y: 480, r: 22, hp: 10 };
  assert.equal(solar.enemyInRange(p,e), green.enemyInRange(p,e));
  assert.equal(solar.enemyInRange(p,e), true);
  e.x = 883;
  assert.equal(solar.enemyInRange(p,e), false);
  assert.equal(solar.bossInRange(p,{x:960,y:480,rx:100,ry:90}),
    green.bossInRange(p,{x:960,y:480,rx:100,ry:90}));
});

test("SOLAR ticks on one global 0.1s clock, including frames without targets", () => {
  const state = green.createState();
  let count = 0;
  const pulse = () => count++;
  assert.equal(solar.tick(state,.09,true,pulse),0);
  assert.equal(count,0);
  assert.equal(solar.tick(state,.01,true,pulse),1);
  assert.equal(count,1);
  assert.ok(Math.abs(state.elapsed)<1e-9);
  assert.equal(solar.tick(state,.35,true,pulse),3);
  assert.equal(count,4);
  assert.ok(Math.abs(state.elapsed-.05)<1e-9);
  assert.equal(solar.tick(state,.05,true,pulse),1);
  assert.equal(count,5);
  assert.equal(solar.tick(state,.5,true,pulse),5);
  assert.equal(count,10);
  assert.ok(Math.abs(state.elapsed)<1e-9);
});

test("SOLAR clock ignores nonpositive/nonfinite dt, and resets on weapon change", () => {
  const state = green.createState();
  let count = 0;
  solar.tick(state,.08,true,()=>count++);
  for(const dt of [0,-1,NaN,Infinity]) {
    assert.equal(solar.tick(state,dt,true,()=>count++),0);
  }
  assert.equal(count,0);
  assert.ok(Math.abs(state.elapsed-.08)<1e-9);
  solar.tick(state,30,false,()=>count++);
  assert.equal(state.elapsed,0);
  assert.equal(count,0);
  assert.equal(solar.tick(state,.1,true,()=>count++),1);
  assert.equal(count,1);
});

test("SOLAR pulses four times faster than GREEN without changing GREEN ticks", () => {
  const original = green.createState(), upgraded = green.createState();
  let g = 0, s = 0;
  for(let i=0;i<20;i++){
    green.tick(original,.025,true,()=>g++);
    solar.tick(upgraded,.025,true,()=>s++);
  }
  assert.equal(g,1);
  assert.equal(s,5);
  assert.ok(Math.abs(original.elapsed-.1)<1e-9);
  assert.ok(Math.abs(upgraded.elapsed)<1e-9);
});
