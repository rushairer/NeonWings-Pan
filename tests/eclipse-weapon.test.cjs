const test = require("node:test");
const assert = require("node:assert/strict");
const w = require("../src/eclipse-weapon.js");
test("0.1 second cooldown",()=>assert.equal(w.RULES.cooldownSeconds,.1));

test("ECLIPSE only equips from DARK RED or itself",()=>{
  for(const type of ["blue","red","magnet","arcLaser","recruit",null])
    assert.equal(w.canEquip(type),false);
  assert.equal(w.canEquip("darkred"),true);
  assert.equal(w.canEquip("eclipse"),true);
});
test("ECLIPSE radial front sweeps through all angles and hits each enemy only once",()=>{
  const wave=w.createWave({x:500,y:480},1.15);
  assert.ok(w.advance(wave,.25));
  const targets=[
    {x:900,y:480,r:20,hp:2},
    {x:100,y:480,r:20,hp:2},
    {x:500,y:880,r:20,hp:2},
    {x:500,y:80,r:20,hp:2},
    {x:500+400/Math.sqrt(2),y:480+400/Math.sqrt(2),r:20,hp:2}
  ];
  for(const e of targets){assert.equal(w.markEnemy(wave,e),true);assert.equal(w.markEnemy(wave,e),false);}
  assert.equal(wave.hitEnemies.length,targets.length);
  assert.equal(w.markEnemy(wave,{x:1000,y:480,r:10,hp:0}),false);
  assert.equal(w.advance(wave,.25),true);
  for(const e of targets)assert.equal(w.markEnemy(wave,e),false);
  assert.equal(wave.radius,800);
});
test("ECLIPSE frame-step 360 degree annulus does not tunnel at low frame rate",()=>{
  const wave=w.createWave({x:100,y:100},2);
  w.advance(wave,.75);
  assert.equal(wave.radius,1200);
  for(const [x,y] of [[1100,100],[-900,100],[100,1100],[100,-900]])
    assert.equal(w.crossesCircle(wave,x,y,15),true);
  assert.equal(w.crossesCircle(wave,1400,100,1),false);
  w.advance(wave,.5);
  assert.equal(wave.radius,1500);
  assert.equal(w.crossesCircle(wave,1400,100,1),true);
  assert.equal(w.advance(wave,.1),false);
});
test("ECLIPSE swept ring catches hull at closest edge and one Boss per wave",()=>{
  const wave=w.createWave({x:200,y:480},1.15);
  const boss={active:true,hp:100,x:900,y:480,rx:120,ry:80};
  w.advance(wave,.3); // R=480: edge 580
  assert.equal(w.markBoss(wave,boss),false);
  w.advance(wave,.1); // R=640: reaches edge
  assert.equal(w.markBoss(wave,boss),true);
  assert.equal(w.markBoss(wave,boss),false);
  const dead={...boss,hp:0};
  assert.equal(w.markBoss(w.createWave({x:200,y:480},1.15),dead),false);
});
test("ECLIPSE invalid power and dt cannot poison wave state",()=>{
  assert.throws(()=>w.createWave(null,1.15),TypeError);
  assert.throws(()=>w.createWave({x:0,y:NaN},1.15),TypeError);
  assert.throws(()=>w.createWave({x:0,y:0},-2),TypeError);
  const wave=w.createWave({x:0,y:0},1.15);
  assert.equal(w.advance(wave,-1),false);
  assert.equal(w.advance(wave,Infinity),false);
  assert.equal(wave.radius,0);
});
