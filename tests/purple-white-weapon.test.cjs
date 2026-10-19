const test = require("node:test");
const assert = require("node:assert/strict");
const brown = require("../src/brown-weapon.js");
const five = require("../src/purple-white-weapon.js");

const from={x:235,y:480};
function e(x,y=480,r=25){return {x,y,r,hp:100};}

test("PURPLE-WHITE collects only from PURPLE, BROWN or itself",()=>{
  for(const p of ["purple","brown","purplewhite"])
    assert.equal(five.canEquip(p),true);
  for(const p of [null,"blue","red","brownyellow","arcLaser","white","yellow","redwhite"])
    assert.equal(five.canEquip(p),false,String(p));
});

test("PURPLE-WHITE shares EXACT BROWN base rules and five fixed laser lanes",()=>{
  for(const k of ["normalDamage","secondsPerTick","maxRange","muzzleOffset","maxTicksPerFrame"])
    assert.equal(five.RULES[k],brown.RULES[k]);
  assert.deepEqual(five.RULES.lanes,[-28,-14,0,14,28]);
  assert.equal(five.RULES.beams,5);
  assert.equal(five.RULES.normalDamage,1.15);
  assert.equal(five.RULES.secondsPerTick,.101);
  assert.equal(five.RULES.maxRange,1300);
});

test("PURPLE-WHITE returns five locks with 5x damage onto one live target",()=>{
  const lone=e(600);
  const beams=five.plan(from,[lone],null),groups=five.groups(beams);
  assert.equal(beams.length,5);
  assert.equal(groups.length,1);
  assert.equal(groups[0].count,5);
  assert.equal(groups[0].target,lone);
  assert.ok(beams.every(x=>x.kind==="enemy"&&x.target===lone));
  assert.deepEqual(beams.map(x=>x.slot).sort((a,b)=>a-b),[0,1,2,3,4]);
});

test("PURPLE-WHITE assigns 3+2 to two targets, 2+2+1 to three, 1 per target to five",()=>{
  for(const n of [2,3,4,5]){
    const enemies=Array.from({length:n},(_,i)=>e(620+i*40,280+i*105,20));
    const groups=five.groups(five.plan(from,enemies,null));
    assert.equal(groups.reduce((n,g)=>n+g.count,0),5,"five total beams");
    assert.equal(groups.length,n,"distinct first");
    const counts=groups.map(x=>x.count).sort((a,b)=>b-a);
    assert.ok(counts[0]-counts.at(-1)<=1,
      n+" targets should be fairly balanced: "+counts);
    if(n===2)assert.deepEqual(counts,[3,2]);
    if(n===3)assert.deepEqual(counts,[2,2,1]);
    if(n===5)assert.deepEqual(counts,[1,1,1,1,1]);
  }
});

test("PURPLE-WHITE cannot see behind an obstructing enemy on the same ray",()=>{
  const front=e(450,480,36),rear=e(740,480,25);
  const beams=five.plan(from,[front,rear],null);
  assert.equal(beams.length,5);
  assert.equal(five.groups(beams).length,1);
  assert.equal(five.groups(beams)[0].target,front);
  assert.equal(five.groups(beams)[0].count,5);
  assert.equal(five.firstContact({x:235,y:480},{x:740,y:480},[front,rear],null).target,front);
  front.hp=0;
  assert.equal(five.groups(five.plan(from,[front,rear],null))[0].target,rear);
});

test("PURPLE-WHITE can reach targets at different heights without penetrating their blockers",()=>{
  const a=e(450,280,24),b=e(520,490,24),c=e(600,700,24);
  const groups=five.groups(five.plan(from,[a,b,c],null));
  assert.equal(groups.length,3);
  assert.equal(groups.reduce((n,g)=>n+g.count,0),5);
  for(const g of groups)assert.ok([a,b,c].includes(g.target));
});

test("PURPLE-WHITE single Boss hull gets 5x only once, not 5x on top of five hits",()=>{
  const boss={active:true,x:870,y:480,rx:105,ry:85,hp:500,parts:[]};
  const groups=five.groups(five.plan(from,[],boss));
  assert.equal(groups.length,1);
  assert.equal(groups[0].kind,"boss");
  assert.equal(groups[0].target,boss);
  assert.equal(groups[0].count,5);
  assert.ok(five.alive(groups[0]));
  boss.hp=0;
  assert.equal(five.plan(from,[],boss).length,0);
});

test("PURPLE-WHITE distinguishes living Boss turret weakpoints, never double books hull",()=>{
  const boss={active:true,x:870,y:480,rx:100,ry:85,hp:500,
    parts:[{x:-150,y:-52,r:28,hp:100},{x:-150,y:52,r:28,hp:100}]};
  const groups=five.groups(five.plan(from,[],boss));
  assert.equal(groups.length,2);
  assert.equal(groups.reduce((n,g)=>n+g.count,0),5);
  assert.ok(groups.every(g=>g.kind==="turret"&&g.part&&g.target===boss));
  assert.notEqual(groups[0].part,groups[1].part);
  boss.parts[0].hp=0;
  assert.ok(five.groups(five.plan(from,[],boss)).every(g=>g.part===boss.parts[1]));
  boss.parts[1].hp=0;
  assert.equal(five.groups(five.plan(from,[],boss))[0].kind,"boss");
});

test("PURPLE-WHITE respects per-ray 1300 world-unit range and forward-only Brown targeting",()=>{
  const far=e(1800),behind=e(100),on=e(850);
  assert.equal(five.plan(from,[far,behind],null).length,0);
  assert.equal(five.groups(five.plan(from,[far,behind,on],null))[0].target,on);
  on.hp=0;
  assert.equal(five.plan(from,[far,behind,on],null).length,0);
});

test("PURPLE-WHITE returns no lasers or damage groups for invalid or no enemy",()=>{
  assert.deepEqual(five.plan(from,[],null),[]);
  assert.deepEqual(five.plan(null,[e(500)],null),[]);
  assert.deepEqual(five.plan({x:NaN,y:400},[e(500)],null),[]);
  assert.deepEqual(five.groups([]),[]);
});

test("PURPLE-WHITE groups five rays once even if target identity repeats with distinct hit points",()=>{
  const a=e(600,480);
  const beams=five.plan(from,[a],null);
  assert.equal(beams.length,5);
  assert.ok(new Set(beams.map(b=>b.startY)).size===5);
  assert.equal(five.groups(beams)[0].count,5);
  assert.notEqual(beams[0],beams[1]);
});

test("PURPLE-WHITE pure acquisition and grouping never mutate enemies or Boss",()=>{
  const enemies=[e(490,300),e(600,470),e(700,730)];
  const boss={active:true,x:1010,y:520,rx:100,ry:80,hp:200,
    parts:[{x:-145,y:0,r:26,hp:75}]};
  const health=enemies.map(e=>e.hp);
  const hp=boss.hp,partHp=boss.parts[0].hp;
  for(let i=0;i<4;i++)five.groups(five.plan(from,enemies,boss));
  assert.deepEqual(enemies.map(e=>e.hp),health);
  assert.equal(boss.hp,hp);
  assert.equal(boss.parts[0].hp,partHp);
});
