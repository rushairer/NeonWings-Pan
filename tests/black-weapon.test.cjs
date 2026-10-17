const test = require("node:test");
const assert = require("node:assert/strict");
const black = require("../src/black-weapon.js");

test("black projectile hit reduces both attack and movement progression by 50%", () => {
  const enemy = { vx: -200, shootCd: 2 };
  assert.equal(black.apply(enemy), true);
  assert.equal(black.isSlowed(enemy), true);
  const { movementDt, attackDt } = black.advance(enemy, 1);
  assert.equal(movementDt, 0.5);
  assert.equal(attackDt, 0.5);
  assert.equal(enemy.slowRemaining, 4);
  assert.equal(black.RULES.duration, 5);
  assert.equal(black.RULES.movementScale, 0.5);
  assert.equal(black.RULES.attackScale, 0.5);
  assert.equal(enemy.vx, -200);
  assert.equal(enemy.shootCd, 2);
});

test("repeated hits refresh exactly five seconds and never stack slowdown", () => {
  const enemy = {};
  black.apply(enemy);
  black.advance(enemy, 3);
  assert.equal(enemy.slowRemaining, 2);
  black.apply(enemy);
  assert.equal(enemy.slowRemaining, 5);
  const step = black.advance(enemy, 1);
  assert.deepEqual(step, { movementDt: 0.5, attackDt: 0.5 });
  assert.equal(enemy.slowRemaining, 4);
  black.apply(enemy);
  assert.equal(enemy.slowRemaining, 5);
});

test("effect restores normal speeds exactly after five seconds", () => {
  const enemy = {};
  black.apply(enemy);
  const steps = [1, 1, 1, 1, 0.9];
  for (const dt of steps) assert.equal(black.advance(enemy, dt).movementDt, dt * 0.5);
  assert.ok(Math.abs(enemy.slowRemaining - 0.1) < 1e-9);
  const cross = black.advance(enemy, 0.3);
  assert.ok(Math.abs(cross.movementDt - 0.25) < 1e-9);
  assert.ok(Math.abs(cross.attackDt - 0.25) < 1e-9);
  assert.equal(black.isSlowed(enemy), false);
  assert.deepEqual(black.advance(enemy, 1), { movementDt: 1, attackDt: 1 });
});

test("pause and between-stage transitions do not advance the target timer", () => {
  const boss = {};
  black.apply(boss);
  const before = boss.slowRemaining;
  assert.deepEqual(black.advance(boss, 0), { movementDt: 0, attackDt: 0 });
  assert.deepEqual(black.advance(boss, -1), { movementDt: 0, attackDt: 0 });
  assert.deepEqual(black.advance(boss, Number.NaN), { movementDt: 0, attackDt: 0 });
  assert.equal(boss.slowRemaining, before);
  black.advance(boss, 0.4);
  assert.ok(Math.abs(boss.slowRemaining - 4.6) < 1e-9);
});

test("invalid targets cannot be debuffed or counted as slowed", () => {
  assert.equal(black.apply(null), false);
  assert.equal(black.apply(undefined), false);
  assert.equal(black.isSlowed({ slowRemaining: -4 }), false);
  assert.equal(black.isSlowed({ slowRemaining: Number.NaN }), false);
  assert.deepEqual(black.advance(null, 1), { movementDt: 0, attackDt: 0 });
  assert.deepEqual(black.advance({}, 0.5), { movementDt: 0.5, attackDt: 0.5 });
});
