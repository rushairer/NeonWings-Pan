const test = require("node:test");
const assert = require("node:assert/strict");
const red = require("../src/red-weapon.js");

test("red weapon fires in two-line volleys, resting after five plus its stars", () => {
  const state = red.createState();
  assert.equal(state.stars, 0);
  for (let i = 0; i < 4; i++) {
    assert.equal(red.fire(state, 0.9).cooldown, 0.1);
  }
  assert.deepEqual(red.fire(state, 0.9), {
    cooldown: 0.4, rest: true, triggered: false
  });
  assert.equal(state.volleys, 0);

  state.stars = 3;
  for (let i = 0; i < 7; i++) assert.equal(red.fire(state, 0.9).rest, false);
  assert.equal(red.fire(state, 0.9).cooldown, 0.4);
  assert.equal(state.volleys, 0);
});

test("special trigger uses 10% roll per volley, with no overlapping streams", () => {
  const state = red.createState();
  assert.equal(red.fire(state, 0.1).triggered, false);
  assert.equal(red.fire(state, 0.099999).triggered, true);
  assert.equal(red.fire(state, 0).triggered, false);
  assert.equal(state.special.emitted, 0);
});

test("special fires exactly 250 shots in +/-10 degrees over three active seconds", () => {
  const state = red.createState();
  red.fire(state, 0);
  const angles = [];
  const emit = (angle) => angles.push(angle);
  assert.equal(red.tick(state, 0, emit).fired, 0);
  assert.equal(red.tick(state, 1, emit).fired, 83);
  assert.equal(angles.length, 83);
  assert.equal(state.stars, 0);
  assert.equal(red.tick(state, 1, emit).fired, 83);
  assert.equal(red.tick(state, 0.999, emit).fired, 83);
  assert.equal(angles.length, 249);
  const result = red.tick(state, 0.001, emit);
  assert.deepEqual(result, { fired: 1, completed: true, upgraded: true });
  assert.equal(angles.length, 250);
  assert.equal(state.stars, 1);
  assert.equal(state.special, null);
  assert.ok(angles.every(a => a >= -Math.PI / 18 - 1e-10 &&
    a <= Math.PI / 18 + 1e-10));
  assert.ok(Math.min(...angles) <= -Math.PI / 18);
  assert.ok(Math.max(...angles) >= Math.PI / 18);
});

test("special remains time-based across uneven frames and cannot exceed five stars", () => {
  const state = red.createState();
  let count = 0;
  for (let cycle = 0; cycle < 7; cycle++) {
    assert.equal(red.fire(state, 0).triggered, true);
    const before = count;
    const outcome = red.tick(state, 4, () => { count += 1; });
    assert.equal(count - before, 250);
    assert.equal(outcome.completed, true);
    assert.equal(outcome.upgraded, cycle < 5);
    assert.equal(state.stars, Math.min(5, cycle + 1));
  }
});

test("weapon switching keeps earned stars, while damage reduces them once", () => {
  const state = red.createState();
  state.stars = 4;
  state.volleys = 3;
  red.fire(state, 0);
  red.switchWeapon(state);
  assert.equal(state.volleys, 0);
  assert.equal(state.stars, 4);
  assert.ok(state.special);
  assert.equal(red.takeHit(state), 3);
  assert.equal(state.stars, 3);
  red.tick(state, 3, () => {});
  assert.equal(state.stars, 4);
  for (let i = 0; i < 9; i++) red.takeHit(state);
  assert.equal(state.stars, 0);
});

test("invalid or zero dt never consumes special time or launches bullets", () => {
  const state = red.createState();
  red.fire(state, 0);
  for (const dt of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    red.tick(state, dt, () => { throw Error("must not emit"); });
  }
  assert.equal(state.special.emitted, 0);
  assert.equal(state.special.elapsed, 0);
});
