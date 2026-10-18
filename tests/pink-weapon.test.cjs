const test = require("node:test");
const assert = require("node:assert/strict");
const pink = require("../src/pink-weapon.js");

test("one PINK firing action always records one shot; rest follows every two", () => {
  const s = pink.createState();
  assert.deepEqual(s, { volleys: 0 });
  assert.equal(pink.RULES.volleysBeforeRest, 2);
  assert.equal(pink.RULES.restSeconds, 0.4);
  assert.deepEqual(pink.fire(s, 0.101, () => 0.5),
    { special: false, rest: false, cooldown: 0.101 });
  assert.equal(s.volleys, 1);
  assert.deepEqual(pink.fire(s, 0.101, () => 0.5),
    { special: false, rest: true, cooldown: 0.4 });
  assert.equal(s.volleys, 0);
  assert.deepEqual(pink.fire(s, 0.101, () => 0.5),
    { special: false, rest: false, cooldown: 0.101 });
});

test("5% missile roll is independent from rest schedule and has exact boundary", () => {
  const s = pink.createState();
  assert.equal(pink.RULES.missileChance, 0.05);
  assert.equal(pink.RULES.missileDamageMultiplier, 10);
  assert.equal(pink.fire(s, 0.101, () => 0).special, true);
  assert.equal(pink.fire(s, 0.101, () => 0.049999).special, true);
  assert.equal(s.volleys, 0); // special proc does not change rest count
  assert.equal(pink.fire(s, 0.101, () => 0.05).special, false);
  assert.equal(pink.fire(s, 0.101, () => 0.99).special, false);
  assert.equal(s.volleys, 0);
});

test("10,000 deterministic roll values yield 500 specials at 5%", () => {
  let count = 0;
  const s = pink.createState();
  for (let i = 0; i < 10_000; i++) {
    if (pink.fire(s, 0.101, () => i / 10_000).special) count++;
  }
  assert.equal(count, 500);
  assert.equal(s.volleys, 0);
});

test("switch resets partial streak but not an in-flight projectile state", () => {
  const state = pink.createState();
  pink.fire(state, 0.101, () => 0.2);
  const missile = { pinkSpecial: true, power: 11.5 };
  pink.switchWeapon(state);
  assert.deepEqual(state, { volleys: 0 });
  assert.deepEqual(missile, { pinkSpecial: true, power: 11.5 });
});

test("homing bullet turns toward live enemies while retaining exact speed", () => {
  const b = { x: 100, y: 400, vx: 940, vy: 0, power: 1.15 };
  const target = { x: 600, y: 100, hp: 20 };
  assert.equal(pink.steer(b, target, 0.016), true);
  assert.ok(b.vy < 0);
  assert.ok(b.vx > 0);
  assert.ok(Math.abs(Math.hypot(b.vx, b.vy) - 940) < 1e-9);
  assert.equal(b.power, 1.15);
  assert.ok(Math.abs(Math.atan2(b.vy, b.vx)) <= 8.5 * 0.016 + 1e-9);
});

test("steering handles sudden direction reversal and angle wrap without NaN", () => {
  const b = { x: 0, y: 0, vx: -940, vy: 1 };
  for (let i = 0; i < 100; i++) {
    pink.steer(b, { x: -100, y: -100, hp: 1 }, 0.016);
    assert.ok(Number.isFinite(b.vx));
    assert.ok(Number.isFinite(b.vy));
    assert.ok(Math.abs(Math.hypot(b.vx, b.vy) - 940.0005319147) < 1e-6);
  }
});

test("no target, destroyed enemy or inactive Boss preserves ballistic direction", () => {
  const b = { x: 200, y: 200, vx: 940, vy: 0 };
  const old = { vx: b.vx, vy: b.vy };
  for (const t of [null, undefined, {x:350,y:350,hp:0}, {x:350,y:350,hp:20,active:false}]) {
    assert.equal(pink.steer(b, t, 0.016), false);
  }
  assert.deepEqual({ vx:b.vx, vy:b.vy },old);
});

test("paused/invalid frame time cannot steer; invalid special RNG cannot mutate counter", () => {
  const b = { x: 100, y: 100, vx: 940, vy: 0 };
  assert.equal(pink.steer(b, {x:100,y:0,hp:5}, 0), false);
  assert.equal(pink.steer(b, {x:100,y:0,hp:5}, NaN), false);
  assert.equal(b.vy, 0);
  const s = pink.createState();
  for(const roll of [-1,1,NaN]) assert.throws(() => pink.fire(s, 0.101, () => roll),RangeError);
  for(const cd of [0,-1,NaN,Infinity]) assert.throws(() => pink.fire(s, cd, () => 0.2),TypeError);
  assert.equal(s.volleys, 0);
});
