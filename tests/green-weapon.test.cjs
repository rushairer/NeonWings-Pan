const test = require("node:test");
const assert = require("node:assert/strict");
const green = require("../src/green-weapon.js");

test("green aura pulses every 0.4 seconds, including multiple pulses after a long frame", () => {
  const state = green.createState();
  let hits = 0;
  for (let i = 0; i < 3; i++) {
    assert.equal(green.tick(state, 0.1, true, () => { hits++; }), 0);
  }
  assert.equal(hits, 0);
  assert.equal(green.tick(state, 0.1, true, () => { hits++; }), 1);
  assert.equal(hits, 1);
  assert.equal(green.tick(state, 0.85, true, () => { hits++; }), 2);
  assert.equal(hits, 3);
  assert.ok(Math.abs(state.elapsed - 0.05) < 1e-9);
  assert.equal(green.tick(state, 0.34, true, () => { hits++; }), 0);
  assert.equal(green.tick(state, 0.01, true, () => { hits++; }), 1);
  assert.equal(hits, 4);
  assert.equal(green.RULES.secondsPerPulse, 0.4);
  assert.equal(green.RULES.damagePerPulse, 2);
});

test("a weapon switch discards partial aura accumulation and disables hits", () => {
  const state = green.createState();
  green.tick(state, 0.30, true, () => {});
  assert.equal(green.tick(state, 4, false, () => { throw Error("cannot pulse while unequipped"); }), 0);
  assert.equal(state.elapsed, 0);
  let hits = 0;
  green.tick(state, 0.3, true, () => { hits++; });
  assert.equal(hits, 0);
  green.tick(state, 0.1, true, () => { hits++; });
  assert.equal(hits, 1);
  green.switchWeapon(state);
  assert.equal(state.elapsed, 0);
});

test("invalid time does not advance green aura or award free hits", () => {
  const state = green.createState();
  for (const dt of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.equal(green.tick(state, dt, true, () => { throw Error("must not pulse"); }), 0);
  }
  assert.equal(state.elapsed, 0);
});

test("the doubled 360-radius halo includes touching enemies but excludes out-of-range ones", () => {
  const player = { x: 500, y: 500 };
  assert.equal(green.RULES.radius, 360);
  assert.equal(green.enemyInRange(player, { x: 875, y: 500, r: 15 }), true);
  assert.equal(green.enemyInRange(player, { x: 876, y: 500, r: 15 }), false);
  assert.equal(green.enemyInRange(player, { x: 500, y: 120, r: 20 }), true);
  assert.equal(green.enemyInRange(player, { x: 500, y: 119, r: 20 }), false);
});

test("boss hull contact checks nearest rectangle edge instead of center", () => {
  const boss = { x: 800, y: 470, rx: 100, ry: 75 };
  assert.equal(green.bossInRange({ x: 340, y: 470 }, boss), true);
  assert.equal(green.bossInRange({ x: 339, y: 470 }, boss), false);
  assert.equal(green.bossInRange({ x: 800, y: 35 }, boss), true);
  assert.equal(green.bossInRange({ x: 800, y: 34 }, boss), false);
});


test("0.4-second aura clock starts on equip, independently of target contact", () => {
  const state = green.createState();
  const pulses = [];
  let targetsPresent = false;
  const pulse = () => pulses.push(targetsPresent);
  // No enemies for the first .30s, but time still accumulates.
  assert.equal(green.tick(state, 0.30, true, pulse), 0);
  assert.ok(Math.abs(state.elapsed - 0.30) < 1e-9);
  // Enemy arrives at t=.30, takes damage at global t=.40 (not .70).
  targetsPresent = true;
  assert.equal(green.tick(state, 0.09, true, pulse), 0);
  assert.equal(green.tick(state, 0.01, true, pulse), 1);
  assert.deepEqual(pulses, [true]);
  // No enemy for second interval; pulse still occurs at t=.80.
  targetsPresent = false;
  assert.equal(green.tick(state, 0.40, true, pulse), 1);
  assert.deepEqual(pulses, [true, false]);
  // Returning at t=1.10 is hit at t=1.20, not t=1.50.
  assert.equal(green.tick(state, 0.30, true, pulse), 0);
  targetsPresent = true;
  assert.equal(green.tick(state, 0.10, true, pulse), 1);
  assert.deepEqual(pulses, [true, false, true]);
});
