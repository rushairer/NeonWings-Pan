const test = require("node:test");
const assert = require("node:assert/strict");
const arc = require("../src/arc-laser-weapon.js");
const brown = require("../src/brown-weapon.js");

test("ARC LASER unlocks only from BROWN or while already equipped",()=>{
  for(const current of ["blue","white","magnet","stasis","rainbow","yellow",null])
    assert.equal(arc.canEquip(current),false,current);
  assert.equal(arc.canEquip("brown"),true);
  assert.equal(arc.canEquip("arcLaser"),true);
});
test("ARC LASER extends BROWN lock through aligned live enemies, never behind muzzle",()=>{
  const from={x:240,y:480};
  const a={x:400,y:480,r:28,hp:10};
  const b={x:650,y:480,r:28,hp:10};
  const c={x:900,y:480,r:28,hp:10};
  const behind={x:100,y:480,r:20,hp:10};
  const offRay={x:750,y:630,r:20,hp:10};
  const ray=arc.trace(from,[c,b,offRay,behind,a],null,brown);
  assert.equal(ray.arcLaser,true);
  assert.ok(Math.abs(Math.hypot(ray.x-from.x,ray.y-from.y)-1300)<1e-8);
  assert.deepEqual(ray.hits.map(h=>h.target),[a,b,c]);
  assert.ok(ray.hits.every(h=>h.kind==="enemy"));
  assert.equal(arc.trace(from,[],null,brown),null);
});
test("ARC LASER prioritizes one living Boss turret, then uses hull when broken",()=>{
  const from={x:240,y:480};
  const boss={active:true,hp:100,x:800,y:480,rx:120,ry:90,
    parts:[{x:-150,y:0,r:25,hp:30},{x:0,y:0,r:25,hp:30}]};
  let ray=arc.trace(from,[{x:450,y:480,r:20,hp:10}],boss,brown);
  assert.equal(ray.hits.length,2);
  assert.equal(ray.hits[1].kind,"turret");
  assert.equal(ray.hits[1].part,boss.parts[0]);
  boss.parts[0].hp=0;
  ray=arc.trace(from,[],boss,brown);
  assert.equal(ray.hits.length,1);
  assert.equal(ray.hits[0].part,boss.parts[1]);
  boss.parts[1].hp=0;
  ray=arc.trace(from,[],boss,brown);
  assert.equal(ray.hits.length,1);
  assert.equal(ray.hits[0].kind,"boss");
});
test("ARC LASER excludes dead targets, does not target behind player, and inherits Brown lock range",()=>{
  const from={x:200,y:200};
  assert.equal(arc.trace(from,[{x:700,y:200,hp:0,r:30}],null,brown),null);
  assert.equal(arc.trace(from,[{x:1800,y:200,hp:10,r:30}],null,brown),null);
  assert.equal(arc.RULES.maxRange,brown.RULES.maxRange);
  assert.equal(arc.RULES.normalDamage,brown.RULES.normalDamage);
});
