/* RED-BLUE P: 5-way volley -> 360-distance seeking shots; a falling
 * five-point star triggers a full-field 10x blast and 360 unique rays.
 * ALL four red-star weapons use the ONE original redWeapon.stars counter.
 */
(function(root) {
  "use strict";
  const red = typeof module === "object" && module.exports
    ? require("./red-weapon.js") : root.NeonRedWeapon;
  const pink = typeof module === "object" && module.exports
    ? require("./pink-weapon.js") : root.NeonPinkWeapon;
  if (!red || !pink) throw Error("RED-BLUE requires RED and PINK guidance");

  const RULES = Object.freeze({
    normalDamage: 1.15,
    specialBulletDamage: 0.38,
    starfallMultiplier: 10,
    volleySeconds: 1,
    normalShotCount: 5,
    spreadDegrees: Object.freeze([-60,-30,0,30,60]),
    outboundDistance: 360,
    outwardSpeed: 960,
    homingSpeed: 940,
    homingLifetimeSeconds: 3.6,
    starfallSeconds: 0.8,
    specialShotCount: 360,
    specialChance: red.RULES.specialChance,
    maxStars: red.RULES.maxStars,
    // Independent from the shared 360 ordinary-bullet quota. Never truncate
    // the exact 360-degree star burst. Its 3.6s homing TTL bounds retention.
    maxBullets: 1800,
    bulletRadius: 8,
    specialRadius: 5
  });

  function canEquip(type) {
    return type === "yellow" || type === "red" || type === "redblue";
  }

  function shot(x,y,angle,power,anchorX,anchorY,isSpecial=false) {
    const ux=Math.cos(angle), uy=Math.sin(angle);
    // Compute the exact ray-circle intersection only ONCE at emission.
    // The 360-pellet Starfall can otherwise repeat this square root for
    // every live pellet on every rendering frame during outward travel.
    const ox=x-anchorX,oy=y-anchorY;
    const projection=ox*ux+oy*uy;
    const toR360=Math.max(0,Math.sqrt(Math.max(0,
      projection*projection+RULES.outboundDistance**2-ox*ox-oy*oy
    ))-projection);
    return {
      x,y, vx: ux*RULES.outwardSpeed,
      vy: uy*RULES.outwardSpeed,
      r: isSpecial ? RULES.specialRadius : RULES.bulletRadius,
      power, c: isSpecial ? "#a9c3ff" : "#e05b8a",
      redBlueShot:true, redBlueSpecial: Boolean(isSpecial),
      redBluePhase:"outward", redBlueOriginX:anchorX,
      redBlueOriginY:anchorY, redBlueOutwardRemaining:toR360,
      life:0
    };
  }

  function volley(player,power=RULES.normalDamage) {
    if (!Number.isFinite(player?.x) || !Number.isFinite(player?.y))
      return [];
    return RULES.spreadDegrees.map(deg=>shot(
      player.x+62,player.y,deg*Math.PI/180,power,player.x,player.y));
  }

  function radial(center,power=RULES.specialBulletDamage) {
    if (!Number.isFinite(center?.x) || !Number.isFinite(center?.y))
      return [];
    return Array.from({length:RULES.specialShotCount},(_,degree)=>
      shot(center.x,center.y,degree*Math.PI/180,power,center.x,center.y,true));
  }

  // A once-per-volley chance, never once per bullet; prevent simultaneous
  // RED normal fans, RED-WHITE electric fans and RED-ORANGE explosive fans.
  function tryStartSpecial(sharedRedState,roll) {
    if (!sharedRedState || sharedRedState.special ||
        !Number.isFinite(roll) || roll < 0 || roll >= 1) return false;
    if (roll >= RULES.specialChance) return false;
    sharedRedState.special={redBlue:true,elapsed:0,emitted:0};
    return true;
  }

  function finishSpecial(sharedRedState) {
    if (!sharedRedState?.special?.redBlue) return {completed:false,upgraded:false};
    sharedRedState.special=null;
    const previous=sharedRedState.stars;
    sharedRedState.stars=Math.min(RULES.maxStars,sharedRedState.stars+1);
    return {completed:true,upgraded:sharedRedState.stars>previous};
  }

  // The star visually descends into the visible playfield. Prefer the Boss,
  // then the nearest living enemy to the center-right, then an arena anchor.
  function landing(enemies,boss,w=1280,h=960) {
    let chosen=boss?.active && boss.hp>0?boss:null,nearest=Infinity;
    if (!chosen) for(const e of enemies||[]) {
      if (!(e?.hp>0) || !Number.isFinite(e.x) || !Number.isFinite(e.y))continue;
      const d=(e.x-w*.73)**2+(e.y-h*.5)**2;
      if (d<nearest){nearest=d;chosen=e;}
    }
    const x=chosen?.x ?? w*.73, y=chosen?.y ?? h*.5;
    const clamp=(v,low,high)=>Math.max(low,Math.min(high,v));
    return {x:clamp(x,w*.35,w-100), y:clamp(y,100,h-100)};
  }

  function starPosition(star) {
    if (!star) return null;
    const t=Math.max(0,Math.min(1,star.elapsed/RULES.starfallSeconds));
    return {x:star.x,y:-105+(star.y+105)*t*t};
  }

  // Return up to TWO swept segments: outward-to-r360 and then homing.
  // The origin is captured at firing, so moving the player cannot move the
  // switch threshold. The exact outward distance is cached at emission.
  // The remainder of a long dt is NOT dropped. Collisions
  // are resolved only for ARMED/homing segments after radius 360.
  function advanceShot(b,dt,selectTarget) {
    if (!b || !b.redBlueShot || !(dt>0) || !Number.isFinite(dt) ||
        typeof selectTarget!=="function") return [];
    const segments=[];
    function step(seconds,phase) {
      if (!(seconds>0)) return;
      const fromX=b.x,fromY=b.y;
      b.x+=b.vx*seconds;b.y+=b.vy*seconds;
      segments.push({fromX,fromY,toX:b.x,toY:b.y,phase});
    }
    let remaining=dt;
    if (b.redBluePhase==="outward") {
      const outwardLeft=Math.max(0,b.redBlueOutwardRemaining);
      const until=outwardLeft/RULES.outwardSpeed;
      const outTime=Math.min(remaining,until);
      step(outTime,"outward");
      b.redBlueOutwardRemaining=Math.max(0,
        outwardLeft-outTime*RULES.outwardSpeed);
      remaining-=outTime;
      if (b.redBlueOutwardRemaining<=1e-7) {
        b.redBlueOutwardRemaining=0;
        b.redBluePhase="homing";
        b.life=RULES.homingLifetimeSeconds;
        const angle=Math.atan2(b.vy,b.vx);
        b.vx=Math.cos(angle)*RULES.homingSpeed;
        b.vy=Math.sin(angle)*RULES.homingSpeed;
      } else {
        return segments;
      }
    }
    if(b.redBluePhase==="homing" && b.life>0 && remaining>0){
      const homingTime=Math.min(remaining,b.life);
      pink.steer(b,selectTarget(b),homingTime);
      step(homingTime,"homing");
      b.life=Math.max(0,b.life-homingTime);
    }
    return segments;
  }

  const api=Object.freeze({RULES,canEquip,volley,radial,tryStartSpecial,
    finishSpecial,landing,starPosition,advanceShot});
  root.NeonRedBlueWeapon=api;
  if(typeof module==="object"&&module.exports)module.exports=api;
})(typeof globalThis!=="undefined"?globalThis:this);
