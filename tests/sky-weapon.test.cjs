const test = require("node:test");
const assert = require("node:assert/strict");
const sky = require("../src/sky-weapon.js");

test("SKY has exactly 2.5x ordinary shots when actual hp > 3", () => {
  assert.equal(sky.readHealth({hp:4,player:{x:175,y:480}}),4);
  assert.equal(sky.readHealth({hp:3,player:{hp:7}}),3);
  for(const hp of [4,5,6]) {
    assert.deepEqual(sky.mode(hp),{boost:true,multiplier:2.5,homing:false,slow:false});
  }
  assert.ok(Math.abs(sky.RULES.normalDamage * sky.mode(4).multiplier - 2.875) < 1e-10);
});

test("SKY at exactly 3 or less uses normal damage, homing and BLACK-compatible slow", () => {
  for(const hp of [0,1,2,3]) {
    assert.deepEqual(sky.mode(hp),{boost:false,multiplier:1,homing:true,slow:true});
  }
  assert.equal(sky.RULES.seekingLifetimeSeconds,3.6);
  assert.equal(sky.RULES.bulletSpeed,1100);
});

test("SKY requires authoritative finite game.hp, not an unrelated player.hp", () => {
  assert.equal(sky.readHealth({player:{hp:5}}),null);
  assert.equal(sky.readHealth({hp:NaN,player:{hp:2}}),null);
  assert.equal(sky.readHealth({hp:0}),0);
  assert.throws(()=>sky.mode(null));
  assert.throws(()=>sky.mode(NaN));
});

test("low-hp homing reacquires nearest LIVE enemy and keeps constant bullet speed", () => {
  const bullet={x:200,y:400,vx:1100,vy:0};
  const enemies=[{x:600,y:700,hp:10},{x:300,y:100,hp:0},{x:1100,y:200,hp:50}];
  assert.equal(sky.selectTarget(bullet,enemies,null),enemies[0]);
  sky.steer(bullet,enemies,null,.05);
  assert.ok(bullet.vy>0);
  assert.ok(Math.abs(Math.hypot(bullet.vx,bullet.vy)-1100)<1e-9);
  enemies[0].hp=0;
  assert.equal(sky.selectTarget(bullet,enemies,null),enemies[2]);
});

test("low-hp homing can seek active Boss but never dead Boss or inactive targets",()=>{
  const bullet={x:200,y:400,vx:1100,vy:0};
  const boss={x:600,y:700,hp:200,active:true};
  assert.equal(sky.selectTarget(bullet,[],boss),boss);
  sky.steer(bullet,[],boss,.05);
  assert.ok(bullet.vy>0);
  const before={vx:bullet.vx,vy:bullet.vy};
  boss.hp=0;
  assert.equal(sky.selectTarget(bullet,[],boss),null);
  sky.steer(bullet,[],boss,.05);
  assert.deepEqual({vx:bullet.vx,vy:bullet.vy},before);
});
