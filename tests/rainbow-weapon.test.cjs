const test=require("node:test");
const assert=require("node:assert/strict");
const rainbow=require("../src/rainbow-weapon.js");

test("RAINBOW eight mutually exclusive outcomes sum to exactly 100%",()=>{
  assert.equal(rainbow.RULES.bulletsPerVolley,1);
  assert.equal(rainbow.RULES.shotCooldownSeconds,0.15);
  assert.equal(rainbow.RULES.normalDamage,1.15);
  const chances=rainbow.RULES.outcomeChances;
  assert.equal(Object.keys(chances).length,8);
  assert.equal(Object.values(chances).filter(x=>x===0.13).length,7);
  assert.equal(chances.missile,0.09);
  assert.ok(Math.abs(Object.values(chances).reduce((a,b)=>a+b,0)-1)<1e-12);
  assert.equal(rainbow.BANDS.at(-1).upper,1);
});

test("RAINBOW probability boundaries are lower inclusive and upper exclusive",()=>{
  const cases=[
    [0,"homing"],[.129999,"homing"],
    [.13,"slow"],[.259999,"slow"],
    [.26,"missile"],[.349999,"missile"],
    [.35,"chain"],[.479999,"chain"],
    [.48,"gray"],[.609999,"gray"],
    [.61,"conductive"],[.739999,"conductive"],
    [.74,"orbit"],[.869999,"orbit"],
    [.87,"blast"],[.999999,"blast"]
  ];
  for(const [roll,want]of cases) assert.equal(rainbow.choose(roll),want,String(roll));
});

test("RAINBOW 100,000 point grid produces exact 13%/9% distribution",()=>{
  const counts={};
  for(let i=0;i<100000;i++){
    const kind=rainbow.choose((i+.5)/100000);
    counts[kind]=(counts[kind]||0)+1;
  }
  for(const [kind,chance]of Object.entries(rainbow.RULES.outcomeChances))
    assert.equal(counts[kind],chance*100000,kind);
});

test("RAINBOW per-projectile RNG is independent of firing action and impact",()=>{
  const values=[.10,.30,.44,.57,.69,.82,.94,.18];
  let calls=0;
  const kind=values.map(()=>rainbow.fire(()=>values[calls++]));
  assert.deepEqual(kind,["homing","missile","chain","gray","conductive","orbit","blast","slow"]);
  assert.equal(calls,8);
});

test("RAINBOW rejects invalid random rolls and non-callable RNG",()=>{
  for(const x of [-1,1,NaN,Infinity,-Infinity])
    assert.throws(()=>rainbow.choose(x),RangeError);
  assert.throws(()=>rainbow.fire(null),TypeError);
  assert.throws(()=>rainbow.fire(()=>1),RangeError);
});

test("RAINBOW boundary missile 9% is not PINK 15% extra-missile proc",()=>{
  assert.equal(rainbow.choose(.26),"missile");
  assert.equal(rainbow.choose(.349999),"missile");
  assert.equal(rainbow.choose(.35),"chain");
  assert.equal(rainbow.choose(.15),"slow");
});
