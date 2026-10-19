const test = require("node:test");
const assert = require("node:assert/strict");
const brown = require("../src/brown-weapon.js");
const by = require("../src/brown-yellow-weapon.js");

test("BROWN-YELLOW only evolves from BROWN or itself",()=>{
  assert.equal(by.canEquip("brown"),true);
  assert.equal(by.canEquip("brownyellow"),true);
  for(const x of ["blue","yellow","arcLaser","white","red",null,"redorange"])
    assert.equal(by.canEquip(x),false,String(x));
});

test("BROWN-YELLOW inherits unmodified BROWN range, tick, damage and no additional bounce",()=>{
  for(const key of ["normalDamage","secondsPerTick","maxRange",
    "muzzleOffset","laserRadius","maxTicksPerFrame"])
    assert.equal(by.RULES[key],brown.RULES[key],key);
  assert.equal(by.RULES.secondsPerTick,.101);
  assert.equal(by.RULES.normalDamage,1.15);
  assert.equal(by.RULES.maxRange,1300);
  assert.equal(by.RULES.maxRefractions,1);
});

test("BROWN-YELLOW chooses closest different enemy and can turn backward",()=>{
  const first={x:460,y:480,r:25,hp:50};
  const back={x:360,y:550,r:20,hp:50};
  const farther={x:740,y:480,r:25,hp:50};
  const hit=brown.acquire({x:235,y:480},[first,back,farther],null);
  assert.equal(hit.target,back,"ordinary BROWN aims nearest muzzle target");
  // Supply a fixed real first-contact geometry to test secondary backward.
  const primary={kind:"enemy",target:first,x:435,y:480};
  const bounce=by.refract(primary,[first,back,farther],null);
  assert.equal(bounce.target,back);
  assert.equal(bounce.kind,"enemy");
  assert.equal(bounce.startX,435);
  assert.equal(bounce.startY,480);
  assert.ok(bounce.x<435 && bounce.y>480);
  assert.equal(by.refract(primary,[first],null),null);
});

test("BROWN-YELLOW's second segment still stops at first obstruction",()=>{
  const first={x:460,y:480,r:25,hp:100};
  const goal={x:740,y:480,r:24,hp:100};
  const blocker={x:600,y:480,r:30,hp:100};
  const primary={kind:"enemy",target:first,x:435,y:480};
  assert.equal(by.refract(primary,[first,blocker,goal],null).target,blocker);
  assert.equal(by.refract(primary,[first,goal],null).target,goal);
  assert.ok(by.refract(primary,[first,blocker,goal],null).x<=600);
  blocker.hp=0;
  assert.equal(by.refract(primary,[first,blocker,goal],null).target,goal);
});

test("BROWN-YELLOW respects second segment 1300 limit, dead targets and single living target",()=>{
  const first={x:430,y:400,r:25,hp:100};
  const far={x:1800,y:400,r:25,hp:100};
  const primary={kind:"enemy",target:first,x:410,y:400};
  assert.equal(by.refract(primary,[first,far],null),null);
  far.x=1620;
  assert.equal(by.refract(primary,[first,far],null).target,far);
  far.hp=0;
  assert.equal(by.refract(primary,[first,far],null),null);
  first.hp=0;
  assert.equal(by.refract(primary,[first,{x:500,y:300,r:20,hp:100}],null),null);
  assert.equal(by.refract(null,[first,far],null),null);
});

test("BROWN-YELLOW refraction targets a new Boss, never the original Boss twice",()=>{
  const e={x:460,y:480,r:20,hp:100};
  const boss={active:true,x:880,y:480,rx:100,ry:75,hp:200,
    parts:[{x:-150,y:0,r:24,hp:80}]};
  const fromEnemy={kind:"enemy",target:e,x:440,y:480};
  const ref=by.refract(fromEnemy,[e],boss);
  assert.ok(ref);
  assert.equal(ref.target,boss);
  assert.ok(["boss","turret"].includes(ref.kind));
  assert.ok(ref.startX===440 && ref.startY===480);
  const fromBoss={kind:"turret",target:boss,part:boss.parts[0],x:705,y:480};
  assert.equal(by.refract(fromBoss,[e],boss).target,e);
  assert.equal(by.refract(fromBoss,[],boss),null,
    "second ray cannot double hit Boss hull or another mount");
  boss.active=false;
  assert.equal(by.refract(fromEnemy,[e],boss),null);
});

test("BROWN-YELLOW secondary picks one normal enemy even when others coincide",()=>{
  const first={x:460,y:480,r:25,hp:20};
  const tiedA={x:700,y:480,r:20,hp:100};
  const tiedB={x:700,y:480,r:20,hp:100};
  const primary={kind:"enemy",target:first,x:435,y:480};
  const second=by.refract(primary,[first,tiedA,tiedB],null);
  assert.equal(second.target,tiedA);
  assert.notEqual(second.target,first);
});
