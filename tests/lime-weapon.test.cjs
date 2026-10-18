const test = require("node:test");
const assert = require("node:assert/strict");
const lime = require("../src/lime-weapon.js");
const R = lime.RULES;

function radius(shot, center) {
  return Math.hypot(shot.x - center.x, shot.y - center.y);
}

test("LIME emits ordinary twin-lane bullets FROM the muzzle, not at radius 360", () => {
  const player = { x: 175, y: 480 };
  assert.equal(R.radius, 360);
  assert.equal(R.bulletsPerVolley, 2);
  assert.equal(R.maxOrbitingBullets, 72);
  assert.equal(R.bulletRadius, 9);
  for (const lane of R.muzzleLaneOffsets) {
    const shot = lime.createShot(player, lane);
    assert.equal(shot.x, 237);
    assert.equal(shot.y, 480 + lane);
    assert.equal(shot.vx, 1100);
    assert.equal(shot.vy, 0);
    assert.equal(shot.life, R.bulletLifetimeSeconds);
    assert.equal(shot.orbiting, true);
    assert.ok(radius(shot, player) < R.radius);
    assert.equal(shot.orbitRadius, radius(shot, player));
    assert.equal(shot.orbitAge, 0);
  }
});

test("normal projectile initially flies forward on a curved path, without teleporting", () => {
  const player = { x: 175, y: 480 };
  const bullet = lime.createShot(player, -10);
  const original = { x: bullet.x, y: bullet.y };
  const segments = lime.step(bullet, player, 0.05);
  assert.ok(segments.length >= 2);
  assert.equal(segments[0].fromX, original.x);
  assert.equal(segments[0].fromY, original.y);
  assert.ok(bullet.x > original.x);
  assert.ok(bullet.y > original.y);
  assert.ok(radius(bullet, player) > radius(original, player));
  assert.ok(radius(bullet, player) < R.radius);
  assert.ok(bullet.vx > 0);
  assert.ok(bullet.vy > 0);
  assert.ok(Math.hypot(segments[0].toX-original.x, segments[0].toY-original.y)<60);
});

test("radial travel smoothly settles at exactly 360, then keeps circling", () => {
  const player = { x: 175, y: 480 };
  const bullet = lime.createShot(player, -10);
  let prevRadius = radius(bullet, player);
  for (let i = 0; i < 10; i++) {
    lime.step(bullet, player, 0.05);
    const current = radius(bullet, player);
    assert.ok(current >= prevRadius - 1e-8);
    assert.ok(current <= R.radius + 1e-8);
    prevRadius = current;
  }
  assert.ok(Math.abs(radius(bullet, player)-360)<1e-8);
  const previousAngle = bullet.orbitAngle;
  lime.step(bullet, player, 0.16);
  assert.ok(bullet.orbitAngle > previousAngle);
  assert.ok(Math.abs(radius(bullet, player)-360)<1e-8);
  assert.ok(Math.abs(bullet.orbitRadius-360)<1e-8);
  assert.equal(lime.radiusAtAge(62,0),62);
  assert.equal(lime.radiusAtAge(62,R.outwardSeconds),360);
  assert.equal(lime.radiusAtAge(62,R.outwardSeconds+0.2),360);
});

test("moving the player sweeps orbit path continuously instead of teleporting", () => {
  const player = { x: 175, y: 480 };
  const bullet = lime.createShot(player,12);
  lime.step(bullet, player, 0.15);
  const start = { x: bullet.x, y: bullet.y };
  const nextPlayer = { x: 240, y: 550 };
  const segments = lime.step(bullet, nextPlayer, 0.1);
  assert.equal(segments[0].fromX, start.x);
  assert.equal(segments[0].fromY, start.y);
  assert.equal(segments[segments.length-1].toX, bullet.x);
  assert.equal(segments[segments.length-1].toY, bullet.y);
  assert.ok(Math.abs(radius(bullet, nextPlayer)-bullet.orbitRadius)<1e-8);
  assert.ok(segments.length>=3);
  for(let i=1;i<segments.length;i++){
    assert.equal(segments[i].fromX,segments[i-1].toX);
    assert.equal(segments[i].fromY,segments[i-1].toY);
  }
  assert.ok(Math.hypot(segments[0].toX-start.x,segments[0].toY-start.y)<R.maxSegmentLength+10);
});

test("ordinary shots use short swept arc segments to prevent collision tunneling", () => {
  const player = { x: 300, y: 480 };
  const bullet = lime.createShot(player,-10);
  const segments = lime.step(bullet,player,0.3);
  assert.ok(segments.length>=10);
  for(const s of segments){
    assert.ok(Math.hypot(s.toX-s.fromX,s.toY-s.fromY)<=R.maxSegmentLength+1);
  }
  assert.ok(radius(bullet,player)<R.radius);
});

test("bullets expire after active time, preserving the last live swept segment", () => {
  const player={x:175,y:480};
  const bullet=lime.createShot(player,-10);
  const originalLife=bullet.life;
  assert.deepEqual(lime.step(bullet,player,0),[]);
  assert.equal(bullet.life,originalLife);
  const first=lime.step(bullet,player,1.6);
  assert.ok(first.length>0);
  assert.equal(bullet.dead,undefined);
  const end=lime.step(bullet,player,1.61);
  assert.ok(end.length>0);
  assert.equal(bullet.dead,true);
  assert.equal(bullet.life,0);
  assert.deepEqual(lime.step(bullet,player,0.1),[]);
});

test("invalid delta times and absent bullets cannot corrupt firing state", () => {
  const p={x:100,y:480};
  const bullet=lime.createShot(p,12);
  const original={x:bullet.x,y:bullet.y,life:bullet.life};
  for(const dt of [-1,0,NaN,Infinity]){
    assert.deepEqual(lime.step(bullet,p,dt),[]);
  }
  assert.deepEqual({x:bullet.x,y:bullet.y,life:bullet.life},original);
  assert.deepEqual(lime.step(null,p,0.1),[]);
});

test("bullet direction rotates with the path; speed and damage remain normal", () => {
  const p={x:175,y:480};
  const bullet=lime.createShot(p,-10);
  assert.equal(R.normalDamage,1.15);
  assert.equal(R.bulletRadius,9);
  assert.equal(bullet.vy,0);
  lime.step(bullet,p,0.1);
  assert.ok(bullet.vy>0);
  assert.ok(bullet.vx>0);
  lime.step(bullet,p,0.7);
  assert.ok(bullet.vx<0);
  assert.ok(bullet.vy>0);
});


test("LIME fire cadence permits first full orbit before natural shot expiry", () => {
  const shotsDuringLifetime =
    Math.ceil(R.bulletLifetimeSeconds * R.bulletsPerVolley / 0.101);
  assert.equal(shotsDuringLifetime, 64);
  assert.ok(R.maxOrbitingBullets >= shotsDuringLifetime);
  const oneTurnSeconds = 2 * Math.PI / R.radiansPerSecond;
  assert.ok(R.bulletLifetimeSeconds > R.outwardSeconds + oneTurnSeconds);
});
