const test = require("node:test");
const assert = require("node:assert/strict");
const green = require("../src/green-weapon.js");

test("green aura pulses exactly once for each full second of active combat", () => {
  const state = green.createState();
  let hits = 0;
  for (let i = 0; i < 9; i++) {
    assert.equal(green.tick(state, 0.1, true, () => { hits++; }), 0);
  }
  assert.equal(hits, 0);
  assert.equal(green.tick(state, 0.1, true, () => { hits++; }), 1);
  assert.equal(hits, 1);
  assert.equal(green.tick(state, 2.25, true, () => { hits++; }), 2);
  assert.equal(hits, 3);
  assert.ok(Math.abs(state.elapsed - 0.25) < 1e-9);
  assert.equal(green.RULES.secondsPerPulse, 1);
  assert.equal(green.RULES.damagePerPulse, 2);
});

test("a weapon switch discards partial aura accumulation and disables hits", () => {
  const state = green.createState();
  green.tick(state, 0.75, true, () => {});
  assert.equal(green.tick(state, 4, false, () => { throw Error("cannot pulse while unequipped"); }), 0);
  assert.equal(state.elapsed, 0);
  let hits = 0;
  green.tick(state, 0.9, true, () => { hits++; });
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

test("proximity includes a target's hit radius and excludes outside enemies", () => {
  const player = { x: 500, y: 500 };
  assert.equal(green.enemyInRange(player, { x: 695, y: 500, r: 15 }), true);
  assert.equal(green.enemyInRange(player, { x: 696, y: 500, r: 15 }), false);
  assert.equal(green.enemyInRange(player, { x: 500, y: 300, r: 20 }), true);
  assert.equal(green.enemyInRange(player, { x: 500, y: 299, r: 20 }), false);
});

test("boss hull contact checks nearest rectangle edge instead of center", () => {
  const boss = { x: 800, y: 470, rx: 100, ry: 75 };
  assert.equal(green.bossInRange({ x: 525, y: 470 }, boss), true);
  assert.equal(green.bossInRange({ x: 519, y: 470 }, boss), false);
  assert.equal(green.bossInRange({ x: 800, y: 220 }, boss), true);
  assert.equal(green.bossInRange({ x: 800, y: 214 }, boss), false);
});
