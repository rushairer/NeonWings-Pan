const test = require("node:test");
const assert = require("node:assert/strict");
const red = require("../src/red-weapon.js");
const five = require("../src/red-blue-weapon.js");

const R = five.RULES;
const player = {x:175,y:480};
const close = (actual, expected, eps=1e-8) =>
  assert.ok(Math.abs(actual-expected)<eps, "expected "+expected+", got "+actual);

test("RED-BLUE is only an evolution from ordinary YELLOW/RED or itself",()=>{
  for(const name of ["yellow","red","redblue"])
    assert.equal(five.canEquip(name),true,name);
  for(const name of ["blue","redwhite","redorange","darkred","rainbow","pink",null])
    assert.equal(five.canEquip(name),false,String(name));
});

test("RED-BLUE fires five symmetric actual 1.15-power bullets once per second",()=>{
  assert.equal(R.volleySeconds,1);
  assert.equal(R.normalDamage,1.15);
  assert.deepEqual(R.spreadDegrees,[-60,-30,0,30,60]);
  const bullets=five.volley(player);
  assert.equal(bullets.length,5);
  assert.ok(bullets.every(b=>b.redBlueShot&&!b.redBlueSpecial &&
    b.redBluePhase==="outward" && b.power===1.15 &&
    b.redBlueOriginX===player.x && b.redBlueOriginY===player.y));
  close(bullets[2].x,player.x+62);
  close(bullets[2].y,player.y);
  close(bullets[2].vx,R.outwardSpeed);
  close(bullets[2].vy,0);
  assert.equal(five.volley({x:NaN,y:0}).length,0);
});

test("RED-BLUE snapshots launch anchor and arms exactly at 360 from old player location",()=>{
  const bullet=five.volley(player)[2];
  const until=(R.outboundDistance-62)/R.outwardSpeed;
  const last=five.advanceShot(bullet,until-.01,()=>null);
  assert.equal(last.length,1);
  assert.equal(last[0].phase,"outward");
  assert.equal(bullet.redBluePhase,"outward");
  assert.ok(Math.hypot(bullet.x-player.x,bullet.y-player.y)<360);
  player.x+=100; // the bullet must never follow the moving player
  const later=five.advanceShot(bullet,.01,()=>null);
  assert.equal(bullet.redBluePhase,"homing");
  assert.equal(later[0].phase,"outward");
  close(Math.hypot(bullet.x-175,bullet.y-480),R.outboundDistance);
  close(bullet.life,R.homingLifetimeSeconds);
  close(Math.hypot(bullet.vx,bullet.vy),R.homingSpeed);
  player.x-=100;
  const homing=five.advanceShot(bullet,.1,()=>null);
  assert.equal(homing[0].phase,"homing");
  close(bullet.life,R.homingLifetimeSeconds-.1);
});

test("RED-BLUE handles a large dt crossing outward and finite homing in the SAME update",()=>{
  const b=five.volley(player)[2];
  const segments=five.advanceShot(b,.5,()=>({x:1100,y:700,hp:100}));
  assert.equal(segments.length,2);
  assert.deepEqual(segments.map(s=>s.phase),["outward","homing"]);
  close(Math.hypot(segments[0].toX-175,segments[0].toY-480),360);
  assert.equal(b.redBluePhase,"homing");
  assert.ok(b.life<3.6&&b.life>3.4);
  assert.ok(Number.isFinite(b.vx)&&Number.isFinite(b.vy));
});

test("RED-BLUE homing has a strict 3.6-active-second secondary TTL",()=>{
  const b=five.volley(player)[2];
  const segs=five.advanceShot(b,5,()=>null);
  assert.equal(segs.length,2);
  assert.equal(b.redBluePhase,"homing");
  assert.equal(b.life,0);
  assert.deepEqual(five.advanceShot(b,1,()=>null),[]);
});


test("RED-BLUE R360 remaining path is cached once, decreases monotonically and arms at exact circle edge",()=>{
  const origins=[{x:175,y:480},{x:640,y:480}];
  for(const origin of origins){
    const bullets=[
      ...five.volley(origin),
      five.radial(origin)[0],
      five.radial(origin)[90],
      five.radial(origin)[179],
      five.radial(origin)[270],
      five.radial(origin)[359]
    ];
    for(const b of bullets){
      assert.ok(Number.isFinite(b.redBlueOutwardRemaining));
      assert.ok(b.redBlueOutwardRemaining>0);
      const initial=b.redBlueOutwardRemaining;
      let last=initial,frames=0;
      while(b.redBluePhase==="outward" && frames++<1000){
        const before=b.redBlueOutwardRemaining;
        five.advanceShot(b,1/240,()=>null);
        assert.ok(b.redBlueOutwardRemaining<=before+1e-9);
        assert.ok(b.redBlueOutwardRemaining>=0);
        last=b.redBlueOutwardRemaining;
      }
      assert.equal(b.redBluePhase,"homing");
      assert.equal(last,0);
      assert.ok(Math.abs(Math.hypot(b.x-b.redBlueOriginX,
        b.y-b.redBlueOriginY)-360)<1e-7,
        "must transition at exact 360, not nearby render/radius sample");
      assert.ok(initial>0);
    }
  }
});

test("RED-BLUE Starfall has 360 exact unique 1-degree radial rays with immutable impact origin",()=>{
  const center={x:920,y:480};
  const bolts=five.radial(center);
  assert.equal(R.specialShotCount,360);
  assert.equal(bolts.length,360);
  assert.ok(bolts.every(b=>b.redBlueSpecial&&b.redBlueShot &&
    b.redBluePhase==="outward"&&b.redBlueOriginX===center.x &&
    b.redBlueOriginY===center.y&&b.power===R.specialBulletDamage));
  for(let i=0;i<360;i++){
    const a=i*Math.PI/180;
    close(bolts[i].vx,R.outwardSpeed*Math.cos(a));
    close(bolts[i].vy,R.outwardSpeed*Math.sin(a));
  }
  const sample=bolts[270];
  const chunks=five.advanceShot(sample,R.outboundDistance/R.outwardSpeed,()=>null);
  assert.equal(chunks.length,1);
  assert.equal(chunks[0].phase,"outward");
  close(Math.hypot(sample.x-center.x,sample.y-center.y),360);
  assert.equal(sample.redBluePhase,"homing");
  close(sample.life,R.homingLifetimeSeconds);
});

test("RED-BLUE starfall explosion multiplier is 10x normal but radial bullets stay 0.38 base",()=>{
  assert.equal(R.starfallMultiplier,10);
  assert.equal(R.normalDamage*R.starfallMultiplier,11.5);
  assert.equal(R.specialBulletDamage,.38);
  assert.equal(R.specialChance,red.RULES.specialChance);
  assert.equal(R.specialChance,.10);
  assert.equal(R.maxStars,red.RULES.maxStars);
  assert.ok(R.maxBullets>=R.specialShotCount);
});

test("RED-BLUE uses ONE existing RED special slot; chance strictly below 10%",()=>{
  const shared=red.createState();
  assert.equal(five.tryStartSpecial(shared,.1),false);
  assert.equal(five.tryStartSpecial(shared,.099999),true);
  assert.equal(shared.special.redBlue,true);
  assert.equal(five.tryStartSpecial(shared,0),false);
  assert.equal(red.tick(shared,3,()=>{throw Error("Red 250 fan must not fire");}).fired,0);
  assert.equal(shared.special.redBlue,true);
  assert.deepEqual(five.finishSpecial(shared),{completed:true,upgraded:true});
  assert.equal(shared.stars,1);
  assert.equal(shared.special,null);
  assert.deepEqual(five.finishSpecial(shared),{completed:false,upgraded:false});
  // Regular RED fans occupy the shared slot and block another falling star.
  assert.equal(red.fire(shared,0).triggered,true);
  assert.equal(five.tryStartSpecial(shared,0),false);
  red.tick(shared,3,()=>{});
  assert.equal(shared.stars,2);
  shared.stars=5;
  assert.equal(five.tryStartSpecial(shared,0),true);
  assert.deepEqual(five.finishSpecial(shared),{completed:true,upgraded:false});
  assert.equal(shared.stars,5);
  assert.equal(red.takeHit(shared),4,"real HP damage still decrements ONE shared star");
});

test("RED-BLUE star chooses a valid arena landing point and animates from above",()=>{
  const target={x:800,y:600,hp:50};
  assert.deepEqual(five.landing([target],null),{x:800,y:600});
  const boss={active:true,hp:300,x:990,y:420};
  assert.deepEqual(five.landing([target],boss),{x:990,y:420});
  assert.deepEqual(five.landing([],null),{x:1280*.73,y:480});
  const far={x:5000,y:-500,hp:100};
  assert.deepEqual(five.landing([far],null),{x:1180,y:100});
  const star={x:800,y:600,elapsed:0};
  assert.deepEqual(five.starPosition(star),{x:800,y:-105});
  star.elapsed=.8;
  close(five.starPosition(star).y,600);
  star.elapsed=10;
  close(five.starPosition(star).y,600);
  assert.equal(five.starPosition(null),null);
});
