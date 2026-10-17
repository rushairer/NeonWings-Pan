const test = require("node:test");
const assert = require("node:assert/strict");
const gray = require("../src/gray-weapon.js");
const black = require("../src/black-weapon.js");

test("first 10% of hit rolls knock a regular enemy 100 units away from player", () => {
  const enemy = { hp: 30, x: 600, vx: -200, shootCd: 2 };
  assert.deepEqual(gray.apply(enemy, 0), { kind: "knockback", distance: 100 });
  assert.equal(enemy.x, 700);
  assert.deepEqual(gray.apply(enemy, 0.099999), { kind: "knockback", distance: 100 });
  assert.equal(enemy.x, 800);
  assert.equal(enemy.vx, -200);
  assert.equal(enemy.shootCd, 2);
  assert.equal(gray.isStunned(enemy), false);
  assert.equal(gray.RULES.knockbackChance, 0.1);
  assert.equal(gray.RULES.stunChance, 0.1);
  assert.equal(gray.RULES.amplifiedDamageChance, 0.8);
  assert.equal(gray.RULES.amplifiedDamageMultiplier, 1.5);
  assert.equal(gray.RULES.knockbackDistance, 100);
});

test("next 10% of hit rolls stun for one second and freeze attack and movement", () => {
  const enemy = { hp: 10, x: 550, vx: -100, shootCd: 2 };
  assert.deepEqual(gray.apply(enemy, 0.1), { kind: "stun", distance: 0 });
  assert.equal(enemy.grayStunRemaining, 1);
  assert.deepEqual(gray.advance(enemy, 0.8, black),
    { movementDt: 0, attackDt: 0 });
  assert.ok(Math.abs(enemy.grayStunRemaining - 0.2) < 1e-9);
  const step = gray.advance(enemy, 0.4, black);
  assert.ok(Math.abs(step.movementDt - 0.2) < 1e-9);
  assert.ok(Math.abs(step.attackDt - 0.2) < 1e-9);
  assert.equal(gray.isStunned(enemy), false);
  assert.deepEqual(gray.advance(enemy, 0.4, black),
    { movementDt: 0.4, attackDt: 0.4 });
  assert.equal(gray.RULES.stunSeconds, 1);
});

test("stun refreshes to one second, knockback does not silently clear stun", () => {
  const enemy = { hp: 5, x: 400 };
  gray.apply(enemy, 0.15);
  gray.advance(enemy, 0.7, black);
  assert.deepEqual(gray.apply(enemy, 0.15), { kind: "stun", distance: 0 });
  assert.equal(enemy.grayStunRemaining, 1);
  gray.apply(enemy, 0.05);
  assert.equal(enemy.x, 500);
  assert.equal(enemy.grayStunRemaining, 1);
});

test("stun and black slow consume real time, with no double slowdown or extended status", () => {
  const enemy = { hp: 10, x: 600 };
  black.apply(enemy);
  gray.apply(enemy, 0.15);
  assert.deepEqual(gray.advance(enemy, 0.6, black),
    { movementDt: 0, attackDt: 0 });
  assert.ok(Math.abs(enemy.slowRemaining - 4.4) < 1e-9);
  assert.deepEqual(gray.advance(enemy, 1, black),
    { movementDt: 0.3, attackDt: 0.3 });
  assert.ok(Math.abs(enemy.slowRemaining - 3.4) < 1e-9);
  assert.equal(enemy.grayStunRemaining, 0);
  assert.deepEqual(gray.advance(enemy, 3.7, black),
    { movementDt: 2.0, attackDt: 2.0 });
  assert.equal(enemy.slowRemaining, 0);
});

test("boss knockback shifts both hull and target position but honors arena bounds", () => {
  const boss = { hp: 100, x: 1040, targetX: 1040 };
  assert.deepEqual(gray.apply(boss, 0.09, { boss: true, minX: 890, maxX: 1155 }),
    { kind: "knockback", distance: 100 });
  assert.equal(boss.x, 1140);
  assert.equal(boss.targetX, 1140);
  assert.deepEqual(gray.apply(boss, 0, { boss: true, minX: 890, maxX: 1155 }),
    { kind: "knockback", distance: 15 });
  assert.equal(boss.targetX, 1155);
  assert.equal(boss.x, 1155);
  assert.equal(gray.apply(boss, 0.15).kind, "stun");
});

test("invalid time, invalid targets, and pauses cause no effects", () => {
  assert.deepEqual(gray.apply(null, 0), { kind: "none", distance: 0 });
  assert.deepEqual(gray.apply({ hp: 0, x: 200 }, 0), { kind: "none", distance: 0 });
  assert.deepEqual(gray.apply({ hp: 10, x: 200 }, NaN),
    { kind: "none", distance: 0 });
  const enemy = { hp: 10, x: 300 };
  gray.apply(enemy, 0.15);
  for (const dt of [0, -1, NaN, Infinity]) {
    assert.deepEqual(gray.advance(enemy, dt, black),
      { movementDt: 0, attackDt: 0 });
  }
  assert.equal(enemy.grayStunRemaining, 1);
});


test("last 80% of hit rolls amplify damage to exactly 1.5x without applying control", () => {
  const enemy = { hp: 20, x: 500, shootCd: 2 };
  for (const roll of [0.2, 0.5, 0.8, 0.999999]) {
    const outcome = gray.apply(enemy, roll);
    assert.deepEqual(outcome, { kind: "amplified", distance: 0 });
    assert.equal(gray.damageMultiplier(outcome), 1.5);
    assert.equal(enemy.x, 500);
    assert.equal(enemy.shootCd, 2);
    assert.equal(gray.isStunned(enemy), false);
  }
  assert.equal(gray.damageMultiplier(null), 1);
  assert.equal(gray.damageMultiplier({ kind: "knockback" }), 1);
  assert.equal(gray.damageMultiplier({ kind: "stun" }), 1);
  assert.equal(gray.damageMultiplier({ kind: "none" }), 1);
});

test("probability boundaries are disjoint: [0,.1), [.1,.2), [.2,1)", () => {
  const enemy = { hp: 30, x: 600 };
  for (const [roll, expected] of [
    [0, "knockback"],
    [0.0999999999, "knockback"],
    [0.1, "stun"],
    [0.1999999999, "stun"],
    [0.2, "amplified"],
    [0.9999999999, "amplified"]
  ]) {
    const result = gray.apply(enemy, roll);
    assert.equal(result.kind, expected, "roll " + roll);
    assert.equal(gray.damageMultiplier(result), expected === "amplified" ? 1.5 : 1);
  }
  assert.equal(gray.apply(enemy, -0.00001).kind, "none");
  assert.equal(gray.apply(enemy, 1).kind, "none");
  assert.equal(gray.apply(enemy, Infinity).kind, "none");
});

test("deterministic 10,000 sample grid partitions as exactly 10/10/80 percent", () => {
  const counts = { knockback: 0, stun: 0, amplified: 0 };
  const enemy = { hp: 100, x: 500 };
  for (let i = 0; i < 10000; i++) {
    const outcome = gray.apply(enemy, i / 10000);
    counts[outcome.kind]++;
  }
  assert.deepEqual(counts, { knockback: 1000, stun: 1000, amplified: 8000 });
});
