const test = require("node:test");
const assert = require("node:assert/strict");
const white = require("../src/white-weapon.js");
const green = require("../src/green-weapon.js");

test("one white projectile can pierce distant targets without per-target duplicates", () => {
  const shot = white.createShot();
  const a = { hp: 4 }, b = { hp: 4 };
  assert.equal(white.markEnemy(shot, a), true);
  assert.equal(white.markEnemy(shot, a), false);
  assert.equal(white.markEnemy(shot, b), true);
  assert.equal(white.markEnemy(shot, b), false);
  assert.equal(shot.hitEnemies.length, 2);
  assert.equal(shot.whiteConductive, true);
});

test("conduction uses GREEN's exact 360 radius and touches enemy hit circles", () => {
  const shot = white.createShot();
  const center = { x: 500, y: 480 };
  const touched = { x: 890, y: 480, r: 30, hp: 10 };
  const outside = { x: 891, y: 480, r: 30, hp: 10 };
  const hits = [];
  assert.equal(green.RULES.radius, 360);
  const result = white.conduct(shot, center, [touched, outside], null, green,
    e => hits.push(e), () => {}, () => 0.99);
  assert.deepEqual(result, { enemies: 1, boss: false });
  assert.deepEqual(hits, [touched]);
  assert.equal(white.RULES.secondaryDamageFactor, 0.60);
});

test("fan-out is exactly one hop, not recursive, and targets are hit once", () => {
  const shot = white.createShot();
  const origin = { x: 0, y: 0 };
  const near = { x: 340, y: 0, r: 5, hp: 10 };
  const secondHop = { x: 680, y: 0, r: 5, hp: 10 };
  const nearHits = [];
  white.conduct(shot, origin, [near, secondHop], null, green,
    e => nearHits.push(e), () => {}, () => 0.99);
  assert.deepEqual(nearHits, [near]);
  assert.equal(near.hp, 10); // pure selector does not damage by itself
  assert.equal(shot.hitEnemies.includes(secondHop), false);
  // A later DIRECT piercing collision on a new far enemy can initiate a new,
  // distinct one-hop discharge, but previous victims are never hit twice.
  assert.equal(white.markEnemy(shot, secondHop), true);
  white.conduct(shot, { x: 680, y: 0 }, [near, secondHop], null, green,
    e => nearHits.push(e), () => {}, () => 0.99);
  assert.deepEqual(nearHits, [near]);
});

test("Boss hull is hit by conductivity at most once per white projectile", () => {
  const shot = white.createShot();
  const boss = { active: true, hp: 100, x: 790, y: 480, rx: 90, ry: 90 };
  const events = [];
  const impact = { x: 350, y: 480 };
  assert.equal(white.conduct(shot, impact, [], boss, green, () => {},
    () => events.push("boss")).boss, true);
  assert.equal(white.conduct(shot, impact, [], boss, green, () => {},
    () => events.push("boss")).boss, false);
  assert.deepEqual(events, ["boss"]);
  assert.equal(white.markBoss(shot, boss), false);
});

test("closest impact point is projected onto swept bullet path", () => {
  const shot = { previousX: 10, previousY: 100, x: 310, y: 100 };
  assert.deepEqual(white.closestPoint(shot, 160, 140), { x: 160, y: 100, t: 0.5 });
  assert.deepEqual(white.closestPoint(shot, -100, 100), { x: 10, y: 100, t: 0 });
  assert.deepEqual(white.closestPoint(shot, 500, 100), { x: 310, y: 100, t: 1 });
  assert.deepEqual(white.closestPoint({ x: 10, y: 20 }, 10, 20),
    { x: 10, y: 20, t: 0 });
});

test("non-white projectiles never fan out or mark electric victims", () => {
  const ordinary = { hitEnemies: [] };
  const e = { hp: 10, x: 0, y: 0, r: 10 };
  assert.deepEqual(white.conduct(ordinary, { x: 0, y: 0 }, [e], null,
    green, () => { throw Error("not a conductive shot"); }, () => {}),
  { enemies: 0, boss: false });
  assert.equal(ordinary.hitEnemies.length, 0);
});


test("100% hop 1, 50% hop 2 and conditional 10% hop 3", () => {
  assert.equal(white.RULES.secondHopChance, 0.5);
  assert.equal(white.RULES.thirdHopChance, 0.1);
  assert.equal(white.RULES.maxHops, 3);
  assert.equal(white.chooseDepth(() => 0.5), 1);
  assert.equal(white.chooseDepth(() => 0.499999), 2);
  const rolls = seq => { let i = 0; return () => seq[i++]; };
  assert.equal(white.chooseDepth(rolls([0.8])), 1);
  assert.equal(white.chooseDepth(rolls([0.4, 0.1])), 2);
  assert.equal(white.chooseDepth(rolls([0.4, 0.099999])), 3);
});

test("two-hop electrical propagation hits only the new second-generation targets", () => {
  const shot = white.createShot();
  const enemies = [
    { x: 340, y: 100, r: 10, hp: 10, id: "hop1" },
    { x: 690, y: 100, r: 10, hp: 10, id: "hop2" },
    { x: 1040, y: 100, r: 10, hp: 10, id: "hop3" }
  ];
  const arcs = [];
  const seq = [0.2, 0.5]; let i = 0;
  const result = white.conduct(shot, { x: 0, y: 100 }, enemies, null, green,
    (e, source, depth) => arcs.push({ target: e.id, from: source.x, depth }),
    () => {}, () => seq[i++]);
  assert.deepEqual(result, { enemies: 2, boss: false });
  assert.deepEqual(arcs, [
    { target: "hop1", from: 0, depth: 1 },
    { target: "hop2", from: 340, depth: 2 }
  ]);
  assert.equal(shot.hitEnemies.length, 2);
});

test("conditional 10% third hop extends exactly one more generation, never a fourth", () => {
  const shot = white.createShot();
  const enemies = [340, 690, 1040, 1390].map((x, i) => ({
    x, y: 100, r: 10, hp: 10, id: i+1
  }));
  const arcs=[]; const seq=[0.1,0.05]; let idx=0;
  const result=white.conduct(shot,{x:0,y:100},enemies,null,green,
    (e,source,depth)=>arcs.push([e.id,source.x,depth]),()=>{},()=>seq[idx++]);
  assert.deepEqual(result,{enemies:3,boss:false});
  assert.deepEqual(arcs,[[1,0,1],[2,340,2],[3,690,3]]);
  assert.equal(enemies[3].hp,10);
  assert.equal(shot.hitEnemies.includes(enemies[3]),false);
  assert.equal(idx,2);
});

test("a wave fans to multiple victims but cannot damage a target twice or loop backwards", () => {
  const shot=white.createShot();
  const a={x:350,y:10,r:20,hp:10,id:"a"};
  const b={x:300,y:-10,r:20,hp:10,id:"b"};
  const c={x:640,y:10,r:10,hp:10,id:"c"};
  const calls=[];
  const r=white.conduct(shot,{x:0,y:0},[a,b,c],null,green,
    (e,origin,depth)=>calls.push([e.id,depth]),()=>{},()=>0);
  assert.deepEqual(r,{enemies:3,boss:false});
  assert.deepEqual(calls.map(x=>x[0]).sort(),["a","b","c"]);
  assert.equal(shot.hitEnemies.length,3);
});

test("the same projectile ledger prevents hits on prior direct or electrical victims", () => {
  const shot=white.createShot();
  const a={x:0,y:0,r:10,hp:10},b={x:300,y:0,r:10,hp:10};
  assert.equal(white.markEnemy(shot,a),true);
  const damage=[];
  white.conduct(shot,{x:0,y:0},[a,b],null,green,
    e=>damage.push(e),()=>{},()=>0);
  assert.deepEqual(damage,[b]);
  assert.equal(white.markEnemy(shot,b),false);
  assert.equal(shot.hitEnemies.length,2);
});
