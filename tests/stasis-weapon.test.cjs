const test = require("node:test");
const assert = require("node:assert/strict");
const stasis = require("../src/stasis-weapon.js");

test("STASIS BOMB freezes for precisely 3 active seconds",()=>{
  assert.equal(stasis.activate(),3);
  assert.equal(stasis.frozen(3),true);
  assert.equal(stasis.tick(3,1),2);
  assert.equal(stasis.tick(2,1.5),.5);
  assert.equal(stasis.tick(.5,.5),0);
  assert.equal(stasis.tick(.5,1),0);
  assert.equal(stasis.frozen(0),false);
  assert.equal(stasis.tick(2,0),2);
  assert.equal(stasis.tick(2,-1),2);
});
test("STASIS independent reactivation refreshes, never stacks duration",()=>{
  let state=stasis.activate();
  state=stasis.tick(state,2);
  assert.equal(state,1);
  state=stasis.activate();
  assert.equal(state,3);
  assert.equal(stasis.tick(state,10),0);
});
