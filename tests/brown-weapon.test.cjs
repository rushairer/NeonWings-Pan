const test=require("node:test");
const assert=require("node:assert/strict");
const brown=require("../src/brown-weapon.js");
const {RULES}=brown;
const at=(x,y=480)=>({x,y});
test("laser damage uses 0.101 combat-second ticks and halts outside firing",()=>{
  assert.equal(RULES.normalDamage,1.15);
  const state=brown.createState();let hits=0;
  assert.equal(brown.tick(state,0.1,true,()=>hits++),0);
  assert.equal(brown.tick(state,0.001,true,()=>hits++),1);
  assert.equal(hits,1);
  assert.equal(brown.tick(state,0.303,true,()=>hits++),3);
  assert.equal(hits,4);
  assert.equal(brown.tick(state,0,false,()=>hits++),0);
  assert.equal(state.elapsed,0);
  assert.equal(brown.tick(state,0.05,true,()=>hits++),0);
  assert.equal(hits,4);
});
test("laser only selects forward living enemies and clips at front circle",()=>{
  const from=at(230),near={...at(480),r:25,hp:10};
  const far={...at(730),r:30,hp:10};
  const behind={...at(170),r:20,hp:20};
  const hit=brown.acquire(from,[behind,far,near],null);
  assert.equal(hit.kind,"enemy");
  assert.equal(hit.target,near);
  assert.equal(hit.x,455);
  assert.equal(hit.y,480);
  assert.equal(brown.acquire(from,[{...near,hp:0},far],null).target,far);
  assert.equal(brown.acquire(from,[behind],null),null);
});
test("laser auto aims to diagonal enemy but stops at intervening circular obstruction",()=>{
  const from=at(230);
  const farther={x:780,y:560,r:30,hp:15};
  const blocker={x:500,y:520,r:50,hp:15};
  const hit=brown.acquire(from,[farther,blocker],null);
  assert.equal(hit.target,blocker);
  assert.ok(hit.x<500);
});
test("laser prefers turret over Boss hull and may switch to hull after turrets fall",()=>{
  const boss={active:true,hp:100,x:1020,y:480,rx:125,ry:100,
    parts:[{x:-145,y:-35,r:28,hp:100},{x:-145,y:35,r:28,hp:100}]};
  const hit=brown.acquire(at(230),[],boss);
  assert.equal(hit.kind,"turret");
  assert.equal(hit.target,boss);
  assert.equal(hit.part,boss.parts[0]);
  boss.parts.forEach(p=>p.hp=0);
  const hull=brown.acquire(at(230),[],boss);
  assert.equal(hull.kind,"boss");
  assert.equal(hull.part,null);
  assert.equal(hull.x,895);
});
test("laser cannot see through front target toward a rear Boss",()=>{
  const boss={active:true,hp:100,x:1020,y:480,rx:125,ry:100,parts:[]};
  const enemy={x:600,y:480,r:35,hp:10};
  const hit=brown.acquire(at(230),[enemy],boss);
  assert.equal(hit.target,enemy);
  assert.equal(hit.x,565);
});
test("laser ignores dead/inactive Boss and out-of-range targets",()=>{
  assert.equal(brown.acquire(at(230),[],null),null);
  assert.equal(brown.acquire(at(230),[],{active:false,hp:10}),null);
  assert.equal(brown.acquire(at(230),[{x:4000,y:480,r:20,hp:1}],null),null);
  assert.equal(brown.acquire(at(230),[{x:700,y:480,r:20,hp:0}],null),null);
});
test("rectangle and circle collision math protects nonpenetration edges",()=>{
  const a=at(100),b=at(600);
  assert.equal(brown.circleHit(a,b,400,480,25),0.55);
  assert.equal(brown.circleHit(a,b,400,500,5),null);
  assert.equal(brown.rectHit(a,b,300,440,450,520),0.4);
  assert.equal(brown.rectHit(a,b,300,540,450,600),null);
  assert.equal(brown.rectHit(a,b,0,440,200,520),0);
});
test("brown beam never exceeds tick budget on abnormal dt",()=>{
  const s=brown.createState();let calls=0;
  brown.tick(s,30,true,()=>calls++);
  assert.equal(calls,RULES.maxTicksPerFrame);
  assert.ok(s.elapsed>=0&&s.elapsed<RULES.secondsPerTick);
});
