const test = require("node:test");
const assert = require("node:assert/strict");
const gray = require("../src/gray-weapon.js");
const black = require("../src/black-weapon.js");

test("first 20% of hit rolls knock a regular enemy 100 units away from player", () => {
  const enemy = { hp: 30, x: 600, vx: -200, shootCd: 2 };
  assert.deepEqual(gray.apply(enemy, 0), { kind: "knockback", distance: 100 });
  assert.equal(enemy.x, 700);
  assert.deepEqual(gray.apply(enemy, 0.199999), { kind: "knockback", distance: 100 });
  assert.equal(enemy.x, 800);
  assert.equal(enemy.vx, -200);
  assert.equal(enemy.shootCd, 2);
  assert.equal(gray.isStunned(enemy), false);
  assert.equal(gray.RULES.knockbackChance, 0.2);
  assert.equal(gray.RULES.stunChance, 0.05);
  assert.equal(gray.RULES.amplifiedDamageChance, 0.75);
  assert.equal(gray.RULES.amplifiedDamageMultiplier, 1.5);
  assert.equal(gray.RULES.knockbackDistance, 100);
});

test("next 5% of hits stun for half a second and freeze movement and attacks", () => {
  const enemy = { hp: 10, x: 550, vx: -100, shootCd: 2 };
  assert.deepEqual(gray.apply(enemy, 0.2), { kind: "stun", distance: 0 });
  assert.equal(enemy.grayStunRemaining, 0.5);
  assert.deepEqual(gray.advance(enemy, 0.3, black),
    { movementDt: 0, attackDt: 0 });
  assert.ok(Math.abs(enemy.grayStunRemaining - 0.2) < 1e-9);
  const step = gray.advance(enemy, 0.4, black);
  assert.ok(Math.abs(step.movementDt - 0.2) < 1e-9);
  assert.ok(Math.abs(step.attackDt - 0.2) < 1e-9);
  assert.equal(gray.isStunned(enemy), false);
  assert.deepEqual(gray.advance(enemy, 0.4, black),
    { movementDt: 0.4, attackDt: 0.4 });
  assert.equal(gray.RULES.stunSeconds, 0.5);
});

test("another stun refreshes to 0.5 seconds; knockback retains stun", () => {
  const enemy = { hp: 5, x: 400 };
  gray.apply(enemy, 0.22);
  gray.advance(enemy, 0.4, black);
  assert.deepEqual(gray.apply(enemy, 0.22), { kind: "stun", distance: 0 });
  assert.equal(enemy.grayStunRemaining, 0.5);
  gray.apply(enemy, 0.1);
  assert.equal(enemy.x, 500);
  assert.equal(enemy.grayStunRemaining, 0.5);
});

test("half-second GRAY stun and BLACK slow both expire in real combat time", () => {
  const enemy = { hp: 10, x: 600 };
  black.apply(enemy);
  gray.apply(enemy, 0.22);
  assert.deepEqual(gray.advance(enemy, 0.3, black),
    { movementDt: 0, attackDt: 0 });
  assert.ok(Math.abs(enemy.slowRemaining - 4.7) < 1e-9);
  const crossing = gray.advance(enemy, 1, black);
  assert.ok(Math.abs(crossing.movementDt - 0.4) < 1e-9);
  assert.ok(Math.abs(crossing.attackDt - 0.4) < 1e-9);
  assert.ok(Math.abs(enemy.slowRemaining - 3.7) < 1e-9);
  assert.equal(enemy.grayStunRemaining, 0);
  const after = gray.advance(enemy, 3.7, black);
  assert.ok(Math.abs(after.movementDt - 1.85) < 1e-9);
  assert.ok(Math.abs(after.attackDt - 1.85) < 1e-9);
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
  assert.equal(gray.apply(boss, 0.22).kind, "stun");
});

test("invalid time, invalid targets, and pauses cause no effects", () => {
  assert.deepEqual(gray.apply(null, 0), { kind: "none", distance: 0 });
  assert.deepEqual(gray.apply({ hp: 0, x: 200 }, 0), { kind: "none", distance: 0 });
  assert.deepEqual(gray.apply({ hp: 10, x: 200 }, NaN),
    { kind: "none", distance: 0 });
  const enemy = { hp: 10, x: 300 };
  gray.apply(enemy, 0.22);
  for (const dt of [0, -1, NaN, Infinity]) {
    assert.deepEqual(gray.advance(enemy, dt, black),
      { movementDt: 0, attackDt: 0 });
  }
  assert.equal(enemy.grayStunRemaining, 0.5);
});


test("last 75% of hit rolls amplify damage to exactly 1.5x without applying control", () => {
  const enemy = { hp: 20, x: 500, shootCd: 2 };
  for (const roll of [0.25, 0.5, 0.8, 0.999999]) {
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

test("probability partitions are disjoint at 0.2 and 0.25", () => {
  const enemy = { hp: 30, x: 600 };
  for (const [roll, kind] of [
    [0, "knockback"],
    [0.1999999999, "knockback"],
    [0.2, "stun"],
    [0.2499999999, "stun"],
    [0.25, "amplified"],
    [0.9999999999, "amplified"]
  ]) {
    const result = gray.apply(enemy, roll);
    assert.equal(result.kind, kind, "roll " + roll);
    assert.equal(gray.damageMultiplier(result), kind === "amplified" ? 1.5 : 1);
  }
  assert.equal(gray.apply(enemy, -0.00001).kind, "none");
  assert.equal(gray.apply(enemy, 1).kind, "none");
  assert.equal(gray.apply(enemy, Infinity).kind, "none");
});

test("deterministic 10,000 sample grid partitions as exactly 20/5/75 percent", () => {
  const counts = { knockback: 0, stun: 0, amplified: 0 };
  const enemy = { hp: 100, x: 500 };
  for (let i = 0; i < 10000; i++) {
    const outcome = gray.apply(enemy, i / 10000);
    counts[outcome.kind]++;
  }
  assert.deepEqual(counts, { knockback: 2000, stun: 500, amplified: 7500 });
});


test("every fifth two-bullet volley rests for 0.4 seconds then resets", () => {
  const state = gray.createState();
  assert.deepEqual(state, { volleys: 0 });
  assert.equal(gray.RULES.volleysBeforeRest, 5);
  assert.equal(gray.RULES.restSeconds, 0.4);
  for (let i = 1; i <= 4; i++) {
    assert.deepEqual(gray.fire(state, 0.101), { rest: false, cooldown: 0.101 });
    assert.equal(state.volleys, i);
  }
  assert.deepEqual(gray.fire(state, 0.101), { rest: true, cooldown: 0.4 });
  assert.equal(state.volleys, 0);
  assert.deepEqual(gray.fire(state, 0.101), { rest: false, cooldown: 0.101 });
  assert.equal(state.volleys, 1);
});

test("volley counter is independent of damage roll, reset on switch and cyclic", () => {
  const state = gray.createState();
  for(let i = 0; i < 3; i++) gray.fire(state, 0.101);
  gray.apply({x:400,hp:100}, 0.9);
  assert.equal(state.volleys, 3);
  gray.switchWeapon(state);
  assert.equal(state.volleys, 0);
  for(let i=0;i<12;i++) {
    const volley = gray.fire(state, 0.101);
    assert.equal(volley.rest, i % 5 === 4);
    assert.equal(volley.cooldown, i % 5 === 4 ? 0.4 : 0.101);
  }
  assert.equal(state.volleys, 2);
});

test("invalid regular cooldown cannot corrupt gray streak", () => {
  const state = gray.createState();
  for (const cooldown of [0, -1, NaN, Infinity]) {
    assert.throws(() => gray.fire(state, cooldown), TypeError);
  }
  assert.equal(state.volleys, 0);
});
