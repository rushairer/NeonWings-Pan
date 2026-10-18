const test = require("node:test");
const assert = require("node:assert/strict");
const magnet = require("../src/magnet-weapon.js");
const green = require("../src/green-weapon.js");

test("MAGNET trigger is strictly 10% on each real contact", () => {
  assert.equal(magnet.RULES.procChance, .1);
  assert.equal(magnet.triggers(0), true);
  assert.equal(magnet.triggers(.099999999), true);
  assert.equal(magnet.triggers(.1), false);
  assert.equal(magnet.triggers(.9999), false);
  for(const roll of [-1,1,NaN,Infinity]) assert.throws(()=>magnet.triggers(roll), RangeError);
});
test("MAGNET field lifetime, green-sized hit area and 2x 100-coordinate travel", () => {
  assert.equal(magnet.RULES.radius, green.RULES.radius);
  const field = magnet.createField(200,300,1.15);
  assert.deepEqual(field,{x:200,y:300,power:1.15,remaining:2});
  assert.equal(magnet.RULES.pullSpeed,100);
  const e={x:600,y:300,r:25,hp:5};
  assert.equal(magnet.pull(e,field,.5),50);
  assert.equal(e.x,550);
  assert.equal(magnet.pull(e,field,2),200);
  assert.equal(e.x,350);
  assert.equal(magnet.pull(e,field,2),150);
  assert.equal(e.x,200);
  assert.equal(magnet.pull(e,field,2),0);
  assert.throws(()=>magnet.createField(1,NaN,1),TypeError);
});
test("MAGNET selects exactly one nearest field across the visible screen",()=>{
  const a=magnet.createField(100,480,1.15);
  const b=magnet.createField(1100,480,1.15);
  const victim={x:900,y:480,r:25,hp:9};
  assert.equal(magnet.nearest([a,b],victim),b);
  assert.equal(magnet.pull(victim,b,1),100);
  assert.equal(victim.x,1000);
  b.remaining=0;
  assert.equal(magnet.nearest([a,b],victim),a);
  assert.equal(magnet.nearest([a],{x:1500,y:480,r:25,hp:9}),null);
  assert.equal(magnet.nearest([a],{x:600,y:480,r:25,hp:0}),null);
  assert.equal(magnet.nearest([a],{x:1305,y:480,r:26,hp:9}),a);
});
test("MAGNET snapshotted multiplier is enemies in damage circle times 0.6",()=>{
  assert.equal(magnet.damage(1.15,0),0);
  assert.ok(Math.abs(magnet.damage(1.15,3)-2.07)<1e-12);
  assert.equal(magnet.damage(3,5),9);
  assert.throws(()=>magnet.damage(1.15,-1),TypeError);
  assert.throws(()=>magnet.damage(NaN,1),TypeError);
});
test("MAGNET pull respects bounded Boss arena and does not stack fields",()=>{
  const field=magnet.createField(100,100,1.15);
  const boss={x:900,y:480,rx:100,ry:80,hp:500};
  assert.equal(magnet.nearest([field],boss),field);
  const before={...boss};
  const moved=magnet.pull(boss,field,1,{minX:890,maxX:1155,minY:145,maxY:815});
  assert.equal(boss.x,890);
  assert.ok(boss.y<before.y);
  assert.ok(moved<=100+1e-9);
});
