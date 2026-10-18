const test = require("node:test");
const assert = require("node:assert/strict");
const darkRed = require("../src/dark-red-weapon.js");
const pink = require("../src/pink-weapon.js");
const { RULES, rollMissile, resolveHits, splashDamage } = darkRed;

test("DARK RED base shot deals guaranteed 100% then 50% chance per subsequent hit", () => {
  assert.equal(RULES.chainChance, 0.5);
  assert.equal(RULES.maxHits, 30);
  assert.equal(RULES.normalDamage, 1.15);
  assert.equal(RULES.bulletsPerVolley, 2);
  let damage = 0, rolls = 0;
  const result = resolveHits(() => { damage += RULES.normalDamage; return true; },
    () => { rolls++; return 0.5; });
  assert.deepEqual(result, {hits:1,extraHits:0,reachedCap:false});
  assert.equal(damage,1.15);
  assert.equal(rolls,1);
});

test("each accepted 50% continuation deals another FULL 100% hit", () => {
  const values = [0.01,0.49,0.499999,0.5];
  const sequence = [];
  const result = resolveHits(n => { sequence.push(n); return true; },
    () => values.shift());
  assert.deepEqual(result,{hits:4,extraHits:3,reachedCap:false});
  assert.deepEqual(sequence,[1,2,3,4]);
  assert.equal(sequence.length*1.15,4.6);
});

test("even perpetual lucky rolls cannot exceed 30 hits or roll for 31st", () => {
  let rolls = 0, hits = 0;
  const result = resolveHits(() => {hits++;return true;}, () => {rolls++;return 0;});
  assert.deepEqual(result,{hits:30,extraHits:29,reachedCap:true});
  assert.equal(hits,30);
  assert.equal(rolls,29);
});

test("death on initial hit stops further damage and skips ALL chain rolls",()=>{
  let health=1,rolls=0;
  const result=resolveHits(()=>{health-=1.15;return health>0;},()=>{rolls++;return 0;});
  assert.equal(result.hits,1);
  assert.equal(result.extraHits,0);
  assert.equal(rolls,0);
});

test("death on third hit ends chain without transferring to a new victim",()=>{
  let hp=2.5,rolls=0;
  const nums=[];
  const r=resolveHits(n=>{nums.push(n);hp-=1.15;return hp>0;},()=>{rolls++;return 0;});
  assert.deepEqual(nums,[1,2,3]);
  assert.equal(r.hits,3);
  assert.equal(rolls,2);
});

test("conditional hit probabilities compound at 50% for at most 30 hits",()=>{
  const chance=n=>Math.pow(RULES.chainChance,n-1);
  assert.equal(chance(2),0.5);
  assert.equal(chance(3),0.25);
  assert.equal(chance(4),0.125);
  assert.ok(Math.abs(chance(30)-Math.pow(0.5,29))<1e-16);
});

test("one fresh RNG is used per potential chain, not one reused decision",()=>{
  let rolls=0;
  const sequence=[0.13,0.12,0.51];
  const result=resolveHits(()=>true,()=>{rolls++;return sequence.shift();});
  assert.deepEqual(result,{hits:3,extraHits:2,reachedCap:false});
  assert.equal(rolls,3);
});

test("shield callback counts 30 separate unchanged 100%-strength damage events",()=>{
  let shield=2.3,hull=100;
  const r=resolveHits(()=>{
    let power=1.15;
    const absorbed=Math.min(shield,power);
    shield-=absorbed;
    power-=absorbed;
    hull-=power;
    return hull>0;
  },()=>0);
  assert.equal(r.hits,30);
  assert.equal(shield,0);
  assert.ok(Math.abs(hull-(100-28*1.15))<1e-8);
});

test("missile proc is 5% exactly and independent of the 50% damage chain",()=>{
  assert.equal(RULES.missileChance,0.05);
  assert.equal(RULES.missileDamageMultiplier,10);
  assert.equal(RULES.specialMissileSize,pink.RULES.specialMissileSize);
  for(const [roll,expected]of [[0,true],[0.049999,true],[0.05,false],[0.499999,false],[0.99,false]])
    assert.equal(rollMissile(()=>roll),expected);
  assert.throws(()=>rollMissile(()=>1),RangeError);
  assert.throws(()=>rollMissile(()=>-0.1),RangeError);
  assert.throws(()=>rollMissile(null),TypeError);
});

test("missile direct damage is exactly 1000%, repeated hits stay 1000%, splash 100%",()=>{
  assert.ok(Math.abs(RULES.normalDamage*RULES.missileDamageMultiplier-11.5)<1e-10);
  for(const factor of [0.5,1,1.5,2.4]){
    const normal=RULES.normalDamage*factor;
    const missile=normal*RULES.missileDamageMultiplier;
    assert.ok(Math.abs(missile/normal-10)<1e-10);
    assert.ok(Math.abs(splashDamage(missile)-normal)<1e-10);
    let power=0;
    const r=resolveHits(()=>{power+=missile;return true;},()=>0);
    assert.equal(r.hits,30);
    assert.ok(Math.abs(power-30*missile)<1e-7);
  }
});

test("invalid chain callbacks fail explicitly rather than cause runaway loops",()=>{
  assert.throws(()=>resolveHits(null),TypeError);
  assert.throws(()=>resolveHits(()=>true,5),TypeError);
});
