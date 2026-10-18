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

test("10% missile roll is independent from rest schedule and has exact boundary", () => {
  const s = pink.createState();
  assert.equal(pink.RULES.missileChance, 0.10);
  assert.equal(pink.RULES.missileDamageMultiplier, 10);
  assert.equal(pink.fire(s, 0.101, () => 0).special, true);
  assert.equal(pink.fire(s, 0.101, () => 0.099999).special, true);
  assert.equal(s.volleys, 0); // special proc does not change rest count
  assert.equal(pink.fire(s, 0.101, () => 0.10).special, false);
  assert.equal(pink.fire(s, 0.101, () => 0.99).special, false);
  assert.equal(s.volleys, 0);
});

test("10,000 deterministic roll values yield 1000 specials at 10%", () => {
  let count = 0;
  const s = pink.createState();
  for (let i = 0; i < 10_000; i++) {
    if (pink.fire(s, 0.101, () => i / 10_000).special) count++;
  }
  assert.equal(count, 1000);
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


const green = require("../src/green-weapon.js");

test("PINK special missile is 100 logical units across and has a bounded blast lifetime", () => {
  assert.equal(pink.RULES.specialMissileSize, 100);
  assert.equal(pink.RULES.explosionLifetimeSeconds, 0.55);
  assert.equal(pink.RULES.maxExplosionEffects, 12);
  assert.equal(green.RULES.radius, 360);
  assert.equal(pink.splashDamage(11.5), pink.RULES.normalDamage);
  assert.ok(Math.abs(pink.splashDamage(34.5) - pink.RULES.normalDamage * 3) < 1e-10);
});

test("blast reaches the exact GREEN halo radius, including circular target hitboxes", () => {
  const center = {x:500,y:480};
  const direct = {x:510,y:480,r:10,hp:100};
  const touching = {x:885,y:480,r:25,hp:10};
  const outside = {x:886,y:480,r:25,hp:10};
  const behind = {x:145,y:480,r:12,hp:10};
  const hit = [];
  const result = pink.splash(center,[direct,touching,outside,behind],null,direct,
    green,e=>hit.push(e),()=>{throw Error("No Boss")});
  assert.deepEqual(result,{enemies:2,boss:false});
  assert.deepEqual(hit,[touching,behind]);
  assert.equal(hit.includes(direct),false);
  assert.equal(hit.includes(outside),false);
});

test("splash damages each nearby other enemy exactly once without chain propagation", () => {
  const center={x:100,y:480}, direct={x:100,y:480,r:10,hp:10};
  const first={x:420,y:480,r:10,hp:10};
  const unreachable={x:750,y:480,r:10,hp:10};
  let calls=0;
  const hit=[];
  pink.splash(center,[direct,first,unreachable],null,direct,green,e=>{
    calls++;
    hit.push(e);
    e.hp-=pink.splashDamage(11.5);
  },()=>{});
  assert.equal(calls,1);
  assert.deepEqual(hit,[first]);
  assert.equal(first.hp,8.85);
  assert.equal(unreachable.hp,10);
  assert.equal(direct.hp,10);
});

test("Boss can take nearby explosion once, but never on its own direct hit", () => {
  const boss={active:true,x:790,y:480,rx:90,ry:80,hp:100};
  const center={x:360,y:480};
  const effects=[];
  const r=pink.splash(center,[],boss,null,green,()=>{},b=>effects.push(b));
  assert.deepEqual(r,{enemies:0,boss:true});
  assert.deepEqual(effects,[boss]);
  assert.deepEqual(pink.splash(center,[],boss,boss,green,()=>{},
    ()=>{throw Error("No double Boss hit")}),{enemies:0,boss:false});
  boss.active=false;
  assert.equal(pink.splash(center,[],boss,null,green,()=>{},()=>{}).boss,false);
});

test("snapshot victims only and never splash freshly-created minions or dead targets", () => {
  const direct={x:400,y:480,r:30,hp:10};
  const neighbor={x:550,y:480,r:20,hp:10};
  const dead={x:600,y:480,r:20,hp:0};
  const snapshot=[direct,neighbor,dead];
  const spawned={x:630,y:480,r:10,hp:5};
  const hit=[];
  pink.splash({x:420,y:480},snapshot,null,direct,green,e=>{
    hit.push(e); snapshot.push(spawned);
  },()=>{});
  assert.deepEqual(hit,[neighbor]);
  assert.equal(spawned.hp,5);
  assert.deepEqual(pink.splash(null,snapshot,null,direct,green,()=>{},()=>{}),
    {enemies:0,boss:false});
});
