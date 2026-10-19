const test = require("node:test");
const assert = require("node:assert/strict");
const orange = require("../src/orange-weapon.js");

test("orange P explosion radius is exactly 100 units and damage multiplier is 1.6", () => {
  assert.equal(orange.RULES.radius, 100);
  assert.equal(orange.RULES.damageMultiplier, 1.6);
  assert.equal(orange.RULES.normalDamage, 1.15);
  assert.ok(Math.abs(orange.RULES.normalDamage * orange.RULES.damageMultiplier - 1.84) < 1e-10);
  assert.equal(orange.RULES.maxExplosionEffects, 48);
  assert.equal(orange.RULES.explosionLifetimeSeconds, 0.35);
});

test("orange explosion uses target circle intersection, including exact edge", () => {
  const center = { x: 500, y: 480 };
  assert.equal(orange.enemyInRange(center, { x: 630, y: 480, r: 30, hp: 10 }), true);
  assert.equal(orange.enemyInRange(center, { x: 631, y: 480, r: 30, hp: 10 }), false);
  assert.equal(orange.enemyInRange(center, { x: 500, y: 600, r: 20, hp: 10 }), true);
  assert.equal(orange.enemyInRange(center, { x: 500, y: 600, r: 20, hp: 0 }), false);
});

test("orange explosion intersects Boss rectangular hull, including exact edge", () => {
  const boss = { active: true, hp: 100, x: 600, y: 480, rx: 75, ry: 60 };
  assert.equal(orange.bossInRange({ x: 425, y: 480 }, boss), true);
  assert.equal(orange.bossInRange({ x: 424, y: 480 }, boss), false);
  assert.equal(orange.bossInRange({ x: 600, y: 640 }, boss), true);
  assert.equal(orange.bossInRange({ x: 600, y: 641 }, boss), false);
  assert.equal(orange.bossInRange({ x: 600, y: 480 }, { ...boss, active: false }), false);
  assert.equal(orange.bossInRange({ x: 600, y: 480 }, { ...boss, hp: 0 }), false);
});

test("circle contact resolves earliest swept intersection, not end of frame", () => {
  const shot = { previousX: 100, previousY: 200, x: 400, y: 200 };
  const impact = orange.circleImpact(shot, { x: 250, y: 200 }, 30);
  assert.deepEqual(impact, { x: 220, y: 200, t: 0.4 });
  assert.deepEqual(orange.circleImpact(shot, { x: 100, y: 200 }, 10),
    { x: 100, y: 200, t: 0 });
  assert.deepEqual(orange.circleImpact({ x: 200, y: 300 }, { x: 200, y: 300 }, 20),
    { x: 200, y: 300, t: 0 });
});

test("Boss hull impact resolves entry to expanded rectangle", () => {
  const shot = { previousX: 100, previousY: 300, x: 400, y: 300 };
  const boss = { x: 300, y: 300, rx: 60, ry: 70 };
  const impact = orange.bossImpact(shot, boss, 9);
  assert.ok(Math.abs(impact.x - 231) < 1e-10);
  assert.ok(Math.abs(impact.t - 131 / 300) < 1e-10);
  assert.equal(impact.y, 300);
  assert.equal(orange.bossImpact({ previousX: 100, previousY: 100, x: 400, y: 100 }, boss, 9), null);
});

test("blast excludes the direct target, hits each other target once and never chains", () => {
  const direct = { x: 400, y: 480, r: 10, hp: 50 };
  const neighbor = { x: 500, y: 480, r: 10, hp: 50 };
  const secondHop = { x: 700, y: 480, r: 10, hp: 50 };
  const hit = [];
  const result = orange.splash({ x: 390, y: 480 },
    [direct, neighbor, secondHop], null, direct,
    e => { hit.push(e); e.hp -= 1.84; }, () => {});
  assert.deepEqual(result, { enemies: 1, boss: false });
  assert.deepEqual(hit, [neighbor]);
  assert.ok(Math.abs(neighbor.hp - 48.16) < 1e-10);
  assert.equal(direct.hp, 50);
  assert.equal(secondHop.hp, 50);
});

test("secondary explosion can hit a non-direct Boss once, but never the direct Boss", () => {
  const boss = { active: true, hp: 100, x: 560, y: 480, rx: 70, ry: 50 };
  let hits = 0;
  const result = orange.splash({ x: 390, y: 480 }, [], boss, null,
    () => {}, () => hits++);
  assert.deepEqual(result, { enemies: 0, boss: true });
  assert.equal(hits, 1);
  const direct = orange.splash({ x: 390, y: 480 }, [], boss, boss,
    () => {}, () => hits++);
  assert.deepEqual(direct, { enemies: 0, boss: false });
  assert.equal(hits, 1);
});

test("secondary blast never hits newly generated minions from callback mutation", () => {
  const center = { x: 400, y: 480 };
  const direct = { x: 420, y: 480, r: 10, hp: 10 };
  const neighbor = { x: 490, y: 480, r: 10, hp: 10 };
  const minion = { x: 520, y: 480, r: 10, hp: 10 };
  const targets = [direct, neighbor];
  const hit = [];
  orange.splash(center, targets, null, direct, e => {
    hit.push(e);
    targets.push(minion);
  }, () => {});
  assert.deepEqual(hit, [neighbor]);
  assert.equal(minion.hp, 10);
});

test("invalid, dead and inactive targets cannot receive orange blast damage", () => {
  assert.equal(orange.enemyInRange(null, { x: 0, y: 0, hp: 1 }), false);
  assert.equal(orange.enemyInRange({ x: 0, y: 0 }, null), false);
  assert.equal(orange.bossInRange(null, { active: true, hp: 1 }), false);
  assert.deepEqual(orange.splash(null, [], null, null, () => {}, () => {}),
    { enemies: 0, boss: false });
});
