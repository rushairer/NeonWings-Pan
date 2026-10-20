/* PURPLE-WHITE P: five independent BROWN first-obstruction lock rays.
 * Spread as many locks over DISTINCT visible targets as possible, then
 * assign unused lanes evenly to existing targets. Fixed 5x original BROWN
 * output on one target, not an additional 5x multiply on top of 5 beams.
 * No projectiles, Canvas, random numbers or second damage clock.
 * v26.26: each 5 active firing seconds MUST be followed by 1 combat-
 * second of forced rest; only this weapon uses the firing/rest scheduler.
 */
(function(root) {
  "use strict";
  const brown = (typeof module === "object" && module.exports)
    ? require("./brown-weapon.js") : root.NeonBrownWeapon;
  if (!brown) throw new Error("PURPLE-WHITE requires BROWN rules");

  const RULES = Object.freeze({
    normalDamage: brown.RULES.normalDamage,
    secondsPerTick: brown.RULES.secondsPerTick,
    maxRange: brown.RULES.maxRange,
    muzzleOffset: brown.RULES.muzzleOffset,
    maxTicksPerFrame: brown.RULES.maxTicksPerFrame,
    beams: 5,
    firingSeconds: 5,
    cooldownSeconds: 1,
    lanes: Object.freeze([-28, -14, 0, 14, 28]),
    // At most 24 nearest goal candidates per frame; all current enemies
    // still participate in obstruction checks for every goal.
    maxGoals: 24
  });

  function canEquip(type) {
    return type === "purple" || type === "brown" || type === "purplewhite";
  }

  function alive(hit) {
    if (!hit || !(hit.target?.hp > 0)) return false;
    return hit.kind === "enemy" ? true :
      Boolean(hit.target.active) && (!hit.part || hit.part.hp > 0);
  }

  function candidates(from, enemies, boss) {
    const goals = [];
    function goal(kind, target, part, x, y) {
      if (!Number.isFinite(x) || !Number.isFinite(y)) return;
      const distance = Math.hypot(x-from.x, y-from.y);
      if (x < from.x || !(distance > 0 && distance <= RULES.maxRange)) return;
      goals.push({kind, target, part, x, y, distance});
    }
    for (const e of enemies || []) {
      if (e?.hp > 0) goal("enemy", e, null, e.x, e.y);
    }
    if (boss?.active && boss.hp > 0) {
      const parts = (boss.parts || []).filter(p => p.hp > 0);
      if (parts.length) {
        for (const p of parts)
          goal("turret", boss, p, boss.x+p.x, boss.y+p.y);
      } else if (Number.isFinite(boss.x) && Number.isFinite(boss.y) &&
          Number.isFinite(boss.rx) && Number.isFinite(boss.ry)) {
        const edgeX = Math.max(from.x, boss.x-boss.rx);
        const edgeY = Math.max(boss.y-boss.ry,
          Math.min(from.y, boss.y+boss.ry));
        goal("boss", boss, null, edgeX, edgeY);
        goal("boss", boss, null, boss.x, boss.y);
      }
    }
    goals.sort((a,b) => a.distance-b.distance);
    return goals.slice(0, RULES.maxGoals);
  }

  // Original BROWN collision/first-obstruction geometry is performed on
  // EVERY candidate route, against ALL live enemies and Boss surfaces.
  function firstContact(from, to, enemies, boss) {
    const hits = [];
    function add(t,kind,target,part) {
      if (t !== null && Number.isFinite(t))
        hits.push({t,kind,target,part:part||null});
    }
    for (const e of enemies || []) {
      if (e?.hp > 0 && Number.isFinite(e.x) && Number.isFinite(e.y))
        add(brown.circleHit(from,to,e.x,e.y,e.r||0),"enemy",e,null);
    }
    if (boss?.active && boss.hp > 0) {
      for (const p of boss.parts || []) {
        if (p.hp > 0) add(brown.circleHit(from,to,
          boss.x+p.x,boss.y+p.y,p.r||0),"turret",boss,p);
      }
      add(brown.rectHit(from,to,boss.x-boss.rx,boss.y-boss.ry,
        boss.x+boss.rx,boss.y+boss.ry),"boss",boss,null);
    }
    if (!hits.length) return null;
    // A turret and the hull often intersect at the same exact point.
    const rank = {turret:0,enemy:1,boss:2};
    hits.sort((a,b) => a.t-b.t || rank[a.kind]-rank[b.kind]);
    const first = hits[0];
    return {kind:first.kind,target:first.target,part:first.part,
      startX:from.x,startY:from.y,
      x:from.x+(to.x-from.x)*first.t,
      y:from.y+(to.y-from.y)*first.t};
  }

  // Different Boss turrets are different viable weak points. The Boss HULL
  // is considered only if there are no living turrets, matching BROWN.
  function key(hit) { return hit.part || hit.target; }

  function plan(from, enemies, boss) {
    if (!Number.isFinite(from?.x) || !Number.isFinite(from?.y))
      return [];
    const goals = candidates(from,enemies,boss);
    if (!goals.length) return [];
    const choices = RULES.lanes.map((offset,slot) => {
      const origin = {x:from.x, y:from.y+offset};
      const options = [];
      const used = new Set();
      for (const goal of goals) {
        const distance = Math.hypot(goal.x-origin.x,goal.y-origin.y);
        if (goal.x < origin.x || !(distance > 0 && distance <= RULES.maxRange))
          continue;
        const contact = firstContact(origin,goal,enemies,boss);
        if (!contact || !alive(contact) ||
            contact.kind !== goal.kind ||
            contact.target !== goal.target ||
            contact.part !== goal.part ||
            used.has(key(contact))) continue;
        used.add(key(contact));
        options.push({...contact,slot,distance});
      }
      options.sort((a,b)=>a.distance-b.distance);
      return options;
    });

    // Maximum bipartite matching gives the greatest possible number of
    // different victims before any lane is allowed to reinforce another.
    const owners = new Map();
    const assigned = Array(RULES.beams).fill(null);
    const order = [...Array(RULES.beams).keys()]
      .sort((a,b)=>choices[a].length-choices[b].length||a-b);
    function match(slot,seen) {
      for (const hit of choices[slot]) {
        const id = key(hit);
        if (seen.has(id)) continue;
        seen.add(id);
        const prev = owners.get(id);
        if (prev === undefined || match(prev,seen)) {
          owners.set(id,slot);
          assigned[slot]=hit;
          return true;
        }
      }
      return false;
    }
    for (const slot of order) match(slot,new Set());

    // Distribute any remaining laser channels evenly, with nearest hit as
    // stable tiebreaker. Five beams onto ONE visible enemy = precisely 5x.
    const count = new Map();
    for (const hit of assigned) if(hit)
      count.set(key(hit),(count.get(key(hit))||0)+1);
    for (const slot of order) {
      if (assigned[slot] || !choices[slot].length) continue;
      const selected = choices[slot].reduce((best,hit) =>
        (count.get(key(hit))||0)<(count.get(key(best))||0)?hit:best);
      assigned[slot]=selected;
      count.set(key(selected),(count.get(key(selected))||0)+1);
    }
    return assigned.filter(Boolean);
  }

  // Damage one unique target ONCE per Brown .101s clock tick, with the
  // sum of allocated slots as a multiplier. No redundant kills/weakpoint
  // bookkeeping or 5 simultaneous collision callbacks on one Boss.
  function groups(beams) {
    const index=new Map(), output=[];
    for(const beam of beams||[]) {
      if (!alive(beam)) continue;
      const id=key(beam);
      const existing=index.get(id);
      if(existing) existing.count++;
      else {
        const group={...beam,count:1};
        output.push(group);
        index.set(id,group);
      }
    }
    return output;
  }


  // Time is active combat time, not wall-clock time. "enabled" means the
  // player is holding FIRE AND at least one real target has been acquired.
  // Releasing FIRE or switching weapons cannot reset accumulated beam time.
  // A forced cooldown keeps counting during active combat even if FIRE is
  // released; pause, reward and stage transitions never call this function.
  function createDutyState() {
    return { firedSeconds: 0, restRemaining: 0 };
  }

  function cooling(state) {
    return Boolean(state && state.restRemaining > 1e-9);
  }

  // Partition dt at exact 5s/1s boundaries. onFire receives ONLY time during
  // which firing is permitted, in chronological order; onRest is invoked on
  // each entry into cooldown so the shared Brown 0.101s timer can be reset.
  // Handle a large dt spanning multiple cycles without accidentally granting
  // laser hits during the mandatory rest interval.
  function advanceDuty(state, dt, enabled, onFire = () => {}, onRest = () => {}) {
    if (!state || !Number.isFinite(state.firedSeconds) ||
        !Number.isFinite(state.restRemaining) ||
        state.firedSeconds < 0 || state.firedSeconds >= RULES.firingSeconds ||
        state.restRemaining < 0 ||
        typeof onFire !== "function" || typeof onRest !== "function")
      throw new TypeError("Valid PURPLE-WHITE duty state and callbacks required");
    let firingTime = 0;
    let restTime = 0;
    if (!(dt > 0) || !Number.isFinite(dt))
      return { firingTime, restTime, cooling: cooling(state) };
    let remaining = dt;
    // Real frames are short (< 0.1 s); cap work if an external caller passes
    // an enormous dt to avoid unbounded callbacks/ticks in one animation frame.
    const maxPhases = 128;
    for (let phase = 0; phase < maxPhases && remaining > 1e-9; phase++) {
      if (cooling(state)) {
        const slice = Math.min(remaining, state.restRemaining);
        state.restRemaining = Math.max(0, state.restRemaining - slice);
        restTime += slice;
        remaining -= slice;
        continue;
      }
      if (!enabled) break;
      const available = RULES.firingSeconds - state.firedSeconds;
      const slice = Math.min(remaining, available);
      if (slice > 0) {
        onFire(slice);
        state.firedSeconds += slice;
        firingTime += slice;
        remaining -= slice;
      }
      if (state.firedSeconds >= RULES.firingSeconds - 1e-9) {
        state.firedSeconds = 0;
        state.restRemaining = RULES.cooldownSeconds;
        onRest();
      } else if (!(slice > 0)) {
        break;
      }
    }
    return { firingTime, restTime, cooling: cooling(state) };
  }

  const api=Object.freeze({RULES,canEquip,alive,firstContact,plan,groups,
    createDutyState, cooling, advanceDuty});
  root.NeonPurpleWhiteWeapon=api;
  if(typeof module==="object"&&module.exports) module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
