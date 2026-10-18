const test=require("node:test");
const assert=require("node:assert/strict");
const darkRed=require("../src/dark-red-weapon.js");
const {RULES,resolveHits}=darkRed;

test("DARK RED always makes one normal 100% hit before rolling a 10% continuation",()=>{
  assert.equal(RULES.chainChance,0.10);
  assert.equal(RULES.maxHits,10);
  assert.equal(RULES.normalDamage,1.15);
  assert.equal(RULES.bulletsPerVolley,2);
  let damage=0,rolls=0;
  const result=resolveHits(()=>{damage+=RULES.normalDamage;return true;},()=>{rolls++;return 0.10;});
  assert.deepEqual(result,{hits:1,extraHits:0,reachedCap:false});
  assert.equal(damage,1.15);
  assert.equal(rolls,1);
});

test("each accepted 10% continuation deals the SAME full initial damage",()=>{
  const values=[0.02,0.09,0.099999,0.10];
  const sequence=[];
  const result=resolveHits(n=>{sequence.push(n);return true;},()=>values.shift());
  assert.deepEqual(result,{hits:4,extraHits:3,reachedCap:false});
  assert.deepEqual(sequence,[1,2,3,4]);
  assert.equal(sequence.length * 1.15,4.6);
});

test("even perpetual lucky rolls cannot exceed ten hits or roll for an eleventh",()=>{
  let rolls=0,hits=0;
  const result=resolveHits(()=>{hits++;return true;},()=>{rolls++;return 0;});
  assert.deepEqual(result,{hits:10,extraHits:9,reachedCap:true});
  assert.equal(hits,10);
  assert.equal(rolls,9);
});

test("death on initial hit stops further damage and skips all RNG",()=>{
  let health=1,rolls=0;
  const result=resolveHits(()=>{health-=1.15;return health>0;},()=>{rolls++;return 0;});
  assert.equal(result.hits,1);
  assert.equal(result.extraHits,0);
  assert.equal(rolls,0);
});

test("death after the third hit ends streak without damaging a new victim",()=>{
  let hp=2.5,rolls=0;
  const hitNums=[];
  const r=resolveHits(n=>{hitNums.push(n);hp-=1.15;return hp>0;},()=>{rolls++;return 0;});
  assert.deepEqual(hitNums,[1,2,3]);
  assert.equal(r.hits,3);
  assert.equal(rolls,2);
});

test("the probability of 2nd, 3rd and 4th hits is 10%, 1%, 0.1%",()=>{
  const p=n=>Math.pow(RULES.chainChance,n-1);
  assert.equal(p(2),0.1);
  assert.ok(Math.abs(p(3)-0.01)<1e-12);
  assert.ok(Math.abs(p(4)-0.001)<1e-12);
  assert.ok(Math.abs(p(10)-0.000000001)<1e-17);
});

test("each successive roll is independent and fresh (no reused initial decision)",()=>{
  let attempts=0;
  const sequence=[0.01,0.01,0.31];
  const result=resolveHits(()=>true,()=>{attempts++;return sequence.shift();});
  assert.deepEqual(result,{hits:3,extraHits:2,reachedCap:false});
  assert.equal(attempts,3);
});

test("shield-compatible callback counts distinct 100% damage events",()=>{
  let shield=2.3,hull=10;
  const result=resolveHits(()=>{
    let power=1.15;
    const absorbed=Math.min(shield,power);shield-=absorbed;power-=absorbed;
    hull-=power;
    return hull>0;
  },()=>0);
  assert.equal(result.hits,10);
  assert.equal(shield,0);
  assert.ok(Math.abs(hull-10+8*1.15)<1e-9);
});

test("invalid callbacks are rejected, avoiding silent no-op or runaway chains",()=>{
  assert.throws(()=>resolveHits(null),TypeError);
  assert.throws(()=>resolveHits(()=>true,5),TypeError);
});
