const test=require("node:test");
const assert=require("node:assert/strict");
const w=require("../src/dark-red-gold-weapon.js");
const original=require("../src/dark-red-weapon.js");
const orange=require("../src/orange-weapon.js");

test("DARK RED-GOLD only collects when currently DARK RED or same P",()=>{
  for(const p of ["darkred","darkredgold"])assert.equal(w.canEquip(p),true);
  for(const p of [null,"red","redorange","orange","eclipse","redwhite",
    "grayflame","rainbow","purple","white"])assert.equal(w.canEquip(p),false,String(p));
});
test("DARK RED-GOLD uses DARK RED twin ordinary bullets and ORANGE true 3x blast",()=>{
  assert.equal(w.RULES.bulletsPerVolley,original.RULES.bulletsPerVolley);
  assert.deepEqual(w.RULES.muzzleOffsets,[-10,12]);
  assert.equal(w.RULES.normalDamage,original.RULES.normalDamage);
  assert.equal(w.RULES.normalDamage,1.15);
  assert.equal(w.RULES.bulletSpeed,1100);
  assert.equal(w.RULES.bulletRadius,9);
  assert.equal(w.RULES.blastRadius,orange.RULES.radius);
  assert.equal(w.RULES.blastMultiplier,orange.RULES.damageMultiplier);
  assert.equal(w.RULES.blastLifetime,.35);
  assert.equal(w.RULES.knockbackDistance,40);
});
test("DARK RED-GOLD bullets are ORANGE explosions only, no DARK RED chain/missile",()=>{
  for(const shot of [w.createShot(),w.createShot()]){
    assert.deepEqual(shot,{orangeBlast:true,darkRedGoldShot:true});
    assert.equal(shot.darkRedChain,undefined);
    assert.equal(shot.darkRedSpecial,undefined);
  }
  assert.notEqual(w.createShot(),w.createShot());
});
test("DARK RED-GOLD ordinary enemy moves EXACTLY 40 logical X units per real hit",()=>{
  const e={x:450,hp:100};
  assert.equal(w.knockback(e,{direction:1,minX:-120,maxX:1400}),40);
  assert.equal(e.x,490);
  assert.equal(w.knockback(e,{direction:-1,minX:-120,maxX:1400}),40);
  assert.equal(e.x,450);
  assert.equal(e.hp,100);
});
test("DARK RED-GOLD knockback clamps to arena; never ejects enemy across bounds",()=>{
  const e={x:1390,hp:100};
  assert.equal(w.knockback(e,{direction:1,maxX:1400}),10);
  assert.equal(e.x,1400);
  assert.equal(w.knockback(e,{direction:1,maxX:1400}),0);
  const b={x:-110,hp:100};
  assert.equal(w.knockback(b,{direction:-1,minX:-120}),10);
  assert.equal(b.x,-120);
});
test("DARK RED-GOLD Boss displacement moves scripted targetX anchor and actual X",()=>{
  const boss={active:true,x:990,targetX:980,hp:200};
  assert.equal(w.knockback(boss,{boss:true,direction:1,minX:850,maxX:1155}),40);
  assert.equal(boss.x,1030);
  assert.equal(boss.targetX,1020);
  assert.equal(w.knockback(boss,{boss:true,direction:-1,minX:850,maxX:1155}),40);
  assert.equal(boss.x,990);
  assert.equal(boss.targetX,980);
});
test("DARK RED-GOLD never moves dead/enemy invalid/inactive Boss victims",()=>{
  for(const e of [null,{}, {hp:0,x:300}, {hp:-1,x:300},
    {hp:3,x:NaN}, {active:false,hp:10,x:300}]){
    const x=e?.x;
    assert.equal(w.knockback(e,{boss:true}),0);
    assert.equal(e?.x,x);
  }
});
