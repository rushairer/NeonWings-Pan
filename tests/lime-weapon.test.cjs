const test=require("node:test");
const assert=require("node:assert/strict");
const lime=require("../src/lime-weapon.js");
const R=lime.RULES;
test("lime shot starts exactly radius 360 from player",()=>{
  assert.equal(R.radius,360);
  assert.equal(R.bulletsPerVolley,2);
  assert.equal(R.maxOrbitingBullets,32);
  const player={x:175,y:480};
  for(const a of [0,Math.PI/2,Math.PI,3*Math.PI/2]){
    const b=lime.createShot(player,a);
    assert.equal(b.orbiting,true);
    assert.ok(Math.abs(Math.hypot(b.x-player.x,b.y-player.y)-360)<1e-8);
    assert.equal(b.life,R.bulletLifetimeSeconds);
    assert.equal(b.r,R.bulletRadius);
  }
});
test("lime orbits move clockwise while following player translation exactly",()=>{
  const player={x:175,y:480};
  const b=lime.createShot(player,0);
  const seg=lime.step(b,player,0.1);
  assert.ok(seg.length>=1);
  assert.ok(b.y>480);
  assert.ok(Math.abs(Math.hypot(b.x-175,b.y-480)-360)<1e-8);
  const before=b.orbitAngle;
  lime.step(b,{x:350,y:600},0.05);
  assert.ok(b.orbitAngle>before);
  assert.ok(Math.abs(Math.hypot(b.x-350,b.y-600)-360)<1e-8);
});
test("each orbital arc subdivision stays short for reliable swept hit testing",()=>{
  const b=lime.createShot({x:300,y:480},0);
  const segments=lime.step(b,{x:300,y:480},0.3);
  assert.ok(segments.length>=5);
  for(const s of segments){
    assert.ok(Math.hypot(s.toX-s.fromX,s.toY-s.fromY)<R.radius*R.maxRadiansPerStep+1e-8);
  }
  assert.ok(Math.abs(Math.hypot(b.x-300,b.y-480)-360)<1e-8);
});
test("orbit shots expire after 3.2 active seconds and do not advance during pauses",()=>{
  const b=lime.createShot({x:175,y:480},0);
  const life=b.life;
  assert.deepEqual(lime.step(b,{x:175,y:480},0),[]);
  assert.equal(b.life,life);
  lime.step(b,{x:175,y:480},1.6);
  assert.equal(b.dead,undefined);
  lime.step(b,{x:175,y:480},1.61);
  assert.equal(b.dead,true);
});
test("invalid time and absent bullet cannot corrupt orbit geometry",()=>{
  const p={x:100,y:480};
  const b=lime.createShot(p,Math.PI);
  const x=b.x,life=b.life;
  for(const dt of [-1,0,NaN,Infinity]){
    assert.deepEqual(lime.step(b,p,dt),[]);
  }
  assert.equal(b.x,x);
  assert.equal(b.life,life);
  assert.deepEqual(lime.step(null,p,0.1),[]);
});
