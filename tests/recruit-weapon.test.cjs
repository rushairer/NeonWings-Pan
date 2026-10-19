const test = require("node:test");
const assert = require("node:assert/strict");
const r = require("../src/recruit-weapon.js");

test("RECRUIT converts only ordinary wave enemies and caps the army",()=>{
  const e={x:300,y:400,kind:"scout",r:22};
  assert.equal(r.canConvert(e,"WAVE",0),true);
  assert.equal(r.canConvert(e,"WAVE",r.RULES.maxAllies),false);
  assert.equal(r.canConvert(e,"BOSS",0),false);
  assert.equal(r.canConvert({...e,friendly:true},"WAVE",0),false);
  assert.equal(r.canConvert({...e,recruited:true},"WAVE",0),false);
  assert.equal(r.canConvert({x:Infinity,y:400,kind:"scout",r:22},"WAVE",0),false);
});
test("RECRUIT retains defeated fighter silhouette with cyan/pink friendly palette",()=>{
  const ally=r.createAlly({x:340,y:600,kind:"bomber",r:34,color:"#fa3",core:"#bbb",hp:-2});
  assert.equal(ally.friendly,true);
  assert.equal(ally.kind,"bomber");
  assert.equal(ally.color,"#ff80d8");
  assert.equal(ally.core,"#87caff");
  assert.ok(ally.life>0);
  assert.equal(ally.shootCd,.15);
  assert.equal(ally.slowRemaining,0);
  assert.throws(()=>r.createAlly({x:Infinity,y:2}),TypeError);
});
test("RECRUIT flies to the RIGHT, fires to the RIGHT, expires deterministically",()=>{
  const a=r.createAlly({x:200,y:480,kind:"drone",r:24});
  const shot=r.createShot(a,2);
  assert.ok(shot.vx>0);
  assert.equal(shot.friendlyShot,true);
  assert.equal(shot.power,r.RULES.shotDamage*2);
  assert.equal(shot.y,a.y);
  r.advance(a,1);
  assert.equal(a.x,200+r.RULES.moveSpeed);
  assert.equal(a.life,r.RULES.lifetimeSeconds-1);
  assert.equal(a.shootCd,-.85);
  const before=a.x;
  r.advance(a,0);
  assert.equal(a.x,before);
});
