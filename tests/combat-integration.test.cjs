const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const platform = require("../src/platform.js");
const controller = require("../src/controller.js");
const combat = require("../src/combat.js");
const redWeapon = require("../src/red-weapon.js");
const greenWeapon = require("../src/green-weapon.js");
const blackWeapon = require("../src/black-weapon.js");
const whiteWeapon = require("../src/white-weapon.js");
const grayWeapon = require("../src/gray-weapon.js");
const pinkWeapon = require("../src/pink-weapon.js");
const orangeWeapon = require("../src/orange-weapon.js");
const brownWeapon = require("../src/brown-weapon.js");
const limeWeapon = require("../src/lime-weapon.js");
const skyWeapon = require("../src/sky-weapon.js");
const collision = require("../src/collision.js");
const enemyBehaviors = require("../src/enemy-behaviors.js");
const worlds = require("../src/worlds.js");
const bossParts = require("../src/boss-parts.js");
const modes = require("../src/modes.js");
const records = require("../src/records.js");
const selectLayout = require("../src/select-layout.js");

const gameSource = fs.readFileSync(path.join(__dirname, "../src/game.js"), "utf8");

function makeCanvasContext() {
  const gradient = () => ({ addColorStop() {} });
  return new Proxy({ createLinearGradient: gradient, createRadialGradient: gradient }, {
    get(target, key) {
      return target[key] ?? (() => {});
    }
  });
}

function boot() {
  const ctx = makeCanvasContext();
  const events = new Map();
  const documentEvents = new Map();
  const canvas = { style: {}, getContext: () => ctx };
  const storage = new Map();
  const window = {
    NeonPlatform: platform, NeonController: controller, NeonCombat: combat, NeonRedWeapon: redWeapon, NeonGreenWeapon: greenWeapon, NeonBlackWeapon: blackWeapon, NeonWhiteWeapon: whiteWeapon, NeonGrayWeapon: grayWeapon, NeonPinkWeapon: pinkWeapon, NeonOrangeWeapon: orangeWeapon, NeonBrownWeapon: brownWeapon, NeonLimeWeapon: limeWeapon, NeonSkyWeapon: skyWeapon, NeonCollision: collision, NeonEnemyBehaviors: enemyBehaviors, NeonWorlds: worlds, NeonBossParts: bossParts, NeonModes: modes, NeonRecords: records, NeonSelectLayout: selectLayout,
    innerWidth: 1280, innerHeight: 960,
    addEventListener: (name, fn) => events.set(name, fn)
  };
  const document = {
    hidden: false,
    getElementById: () => canvas,
    addEventListener: (name, fn) => documentEvents.set(name, fn)
  };
  const context = vm.createContext({
    window, document, console,
    navigator: { getGamepads: () => [] },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value))
    },
    requestAnimationFrame: () => {},
    setTimeout: () => {},
    setInterval: () => 1,
    clearInterval: () => {},
    performance: { now: () => 100 }
  });
  vm.runInContext(gameSource, context, { filename: "src/game.js" });
  return { events, documentEvents, eval: code => vm.runInContext(code, context) };
}

test("grazing a bullet outside the hitbox charges exactly once without damage", () => {
  const app = boot();
  app.eval(`game.state = "PLAYING";
    game.player.x = 100; game.player.y = 100;
    game.enemyBullets = [{ x: 100, y: 155, vx: 0, vy: 0, r: 8, life: 3 }]`);
  app.eval("updateEnemyBullets(0); updateEnemyBullets(0)");
  assert.equal(app.eval("game.combat.energy"), 10);
  assert.equal(app.eval("game.combat.grazes"), 1);
  assert.equal(app.eval("game.hp"), 3);
  assert.equal(app.eval("game.enemyBullets[0].grazed"), true);
});

test("a real enemy bullet hit never gives graze charge, even when nearby", () => {
  const app = boot();
  app.eval(`game.state = "PLAYING";
    game.player.x = 100; game.player.y = 100;
    game.enemyBullets = [{ x: 100, y: 121, vx: 0, vy: 0, r: 8, life: 3 }];
    updateEnemyBullets(0)`);
  assert.equal(app.eval("game.hp"), 2);
  assert.equal(app.eval("game.combat.grazes"), 0);
  assert.equal(app.eval("game.combat.energy"), 0);
});

test("six normal enemy kills progress chain and points, and hitting player resets chain", () => {
  const app = boot();
  app.eval(`game.state = "PLAYING";
    for (let i = 0; i < 6; i++) {
      const e = { hp: 1, maxHp: 1, r: 28, x: 400, y: 400, score: 100, kind: "scout", color: "#ffffff", core: "#eeeeee" };
      damageEnemy(e, 3, 400, 400);
    }`);
  assert.equal(app.eval("game.stats.kills"), 6);
  assert.equal(app.eval("game.combat.combo"), 6);
  assert.equal(app.eval("game.score"), 700);
  assert.equal(app.eval("game.combat.maxCombo"), 6);
  app.eval("damagePlayer()");
  assert.equal(app.eval("game.combat.combo"), 0);
  assert.equal(app.eval("game.hp"), 2);
});

test("bomb kills count toward wave clear without farming combo or energy", () => {
  const app = boot();
  app.eval(`game.state = "PLAYING";
    game.waveKills = killTarget() - 1;
    game.enemies = [{hp: 1, maxHp: 1, r: 28, x: 700, y: 500, score: 40, kind: "scout", color: "#ffffff", core: "#eeeeee"}];
    useBomb()`);
  assert.equal(app.eval("game.stats.kills"), 1);
  assert.equal(app.eval("game.combat.combo"), 0);
  assert.equal(app.eval("game.combat.energy"), 0);
  assert.equal(app.eval("game.stageMode"), "BOSS");
  assert.equal(app.eval("game.bomb"), 1);
});

test("overdrive is manually activated and freezes in pause / stage transition", () => {
  const app = boot();
  app.eval('game.state = "PLAYING"; game.combat.energy = 100');
  assert.equal(app.eval("activateOverdrive()"), true);
  assert.equal(app.eval("game.combat.active"), 6);
  assert.equal(app.eval("game.combat.energy"), 0);
  app.eval("pauseGame()");
  assert.equal(app.eval("game.state"), "PAUSED");
  assert.equal(app.eval("game.combat.active"), 6);
  app.eval('game.state = "PLAYING"; game.stageMode = "TRANSITION"; updatePlaying(0.02)');
  assert.equal(app.eval("game.combat.active"), 6);
  app.eval('game.stageMode = "WAVE"; updatePlaying(0.02)');
  assert.ok(app.eval("game.combat.active") < 6);
});

test("Vanguard Overdrive first guard blocks real damage, second hit cancels drive", () => {
  const app = boot();
  app.eval(`menu.selectedShip = 1; game = newGame(); game.state = "PLAYING";
    game.combat.energy = 100; activateOverdrive(); damagePlayer()`);
  assert.equal(app.eval("game.hp"), 4);
  assert.equal(app.eval("game.combat.guard"), 0);
  assert.equal(app.eval("game.combat.active"), 7);
  assert.equal(app.eval("game.stats.damageTaken"), 0);
  app.eval("game.invuln = 0; damagePlayer()");
  assert.equal(app.eval("game.hp"), 3);
  assert.equal(app.eval("game.combat.active"), 0);
  assert.equal(app.eval("game.stats.damageTaken"), 1);
});

test("blue Overdrive lance hits each enemy once, up to three distinct targets", () => {
  const app = boot();
  app.eval(`game.state = "PLAYING"; game.combat.energy = 100;
    activateOverdrive(); game.weaponType = "blue"; firePlayerWeapons();
    const lance = game.bullets.find(b => b.lance);
    game.enemies = Array.from({length: 3}, (_, i) => ({
      hp: 20, maxHp: 20, r: 35, x: lance.x + 14, y: lance.y, score: 40,
      kind: "scout", color: "#ffffff", core: "#eeeeee"
    }));
    updatePlayerBullets(0.01)`);
  assert.equal(app.eval("game.enemies.every(e => e.hp < 20)"), true);
  assert.equal(app.eval("game.bullets.some(b => b.lance)"), false);
});

test("purple Overdrive enhances close-range hit damage", () => {
  const app = boot();
  app.eval(`game.state = "PLAYING"; game.combat.energy = 100; activateOverdrive();
    game.weaponType = "purple"; firePlayerWeapons();
    const bullet = game.bullets[0];
    game.enemies = [{hp: 20, maxHp: 20, r: 35, x: bullet.x, y: bullet.y,
      score: 40, kind: "scout", color: "#ffffff", core: "#eeeeee"}];
    updatePlayerBullets(0)`);
  // All spread shots begin at the same muzzle position; the close target absorbs five.
  assert.equal(app.eval("game.bullets.length"), 0);
  assert.ok(app.eval("game.enemies[0].hp") < 14);
});

test("yellow Overdrive missiles are distributed among nearby targets", () => {
  const app = boot();
  app.eval(`game.state = "PLAYING"; game.combat.energy = 100; activateOverdrive();
    game.weaponType = "yellow";
    game.enemies = [0, 1, 2].map(i => ({
      hp: 20, maxHp: 20, x: 550 + 90 * i, y: 370 + i * 120, r: 25
    }));
    firePlayerWeapons()`);
  assert.ok(app.eval("game.missiles.length") >= 4);
  assert.equal(app.eval("game.missiles.every(m => m.overdrive)"), true);
  assert.ok(app.eval("new Set(game.missiles.map(m => findMissileTarget(m))).size") >= 2);
});

test("title, active gameplay, paused controller options and game over render without errors", () => {
  const app = boot();
  app.eval("drawFrame(0.016)");
  app.eval('game.state = "PLAYING"; game.combat.energy = 100; activateOverdrive(); drawFrame(0.016)');
  app.eval('game.state = "PAUSED"; pauseMenu.page = "controls"; drawFrame(0.016)');
  app.eval('game.state = "GAME_OVER"; drawFrame(0.016)');
});

test("fast blue shot crosses a target between frame endpoints without tunneling", () => {
  const app = boot();
  app.eval(`game.state = "PLAYING";
    game.enemies = [{kind:"scout", x:350, y:500, r:10, hp:3, maxHp:3,
      score:30, color:"#f88", core:"#fff"}];
    game.bullets = [{x:250, y:500, vx:1200, vy:0, r:8, power:1, c:"#0ff"}];
    updatePlayerBullets(0.16)`);
  assert.ok(app.eval("game.enemies[0].hp") < 3);
  assert.equal(app.eval("game.bullets.length"), 0);
});

test("fast enemy bullet crossing the ship causes damage even when both endpoints are safe", () => {
  const app = boot();
  app.eval(`game.state="PLAYING";
    game.player.x=100; game.player.y=100;
    game.enemyBullets=[{x:0,y:100,vx:600,vy:0,r:8,life:2}];
    updateEnemyBullets(0.32)`);
  assert.equal(app.eval("game.hp"), 2);
  assert.equal(app.eval("game.combat.grazes"), 0);
});

test("simultaneous lethal hit overrides near-miss graze regardless of bullet list order", () => {
  const app = boot();
  app.eval(`game.state="PLAYING";
    game.player.x=100; game.player.y=100;
    game.enemyBullets=[
      {x:100,y:150,vx:0,vy:0,r:8,life:2},
      {x:100,y:115,vx:0,vy:0,r:8,life:2}
    ];
    updateEnemyBullets(0)`);
  assert.equal(app.eval("game.hp"), 2);
  assert.equal(app.eval("game.combat.grazes"), 0);
  assert.equal(app.eval("game.combat.energy"), 0);
});

test("large particle and bullet volleys have strict bounded memory budgets", () => {
  const app = boot();
  app.eval(`game.state="PLAYING";
    for(let i=0; i<1500; i++) addParticle(100,100,0,0,1,"#fff");
    for(let i=0; i<500; i++) addPlayerShot(100,100,100,0);
    for(let i=0; i<520; i++) aimAtPlayer(600,500,300,8,"#f00","#fff");
    for(let i=0; i<120; i++) addMissile(100,100,1,2)`);
  assert.equal(app.eval("game.particles.length"), 800);
  assert.equal(app.eval("game.bullets.length"), 360);
  assert.equal(app.eval("game.enemyBullets.length"), 340);
  assert.equal(app.eval("game.missiles.length"), 48);
});

test("F3 debug HUD toggles without affecting gameplay or overriding held keys", () => {
  const app = boot();
  app.eval('game.state="PLAYING"');
  assert.equal(app.eval("performanceOverlay"), false);
  app.events.get("keydown")({ code:"F3", repeat:false, preventDefault() {} });
  assert.equal(app.eval("performanceOverlay"), true);
  app.eval("drawFrame(0.016)");
  app.events.get("keydown")({ code:"F3", repeat:true, preventDefault() {} });
  assert.equal(app.eval("performanceOverlay"), true);
  app.events.get("keydown")({ code:"F3", repeat:false, preventDefault() {} });
  assert.equal(app.eval("performanceOverlay"), false);
});

test("shield absorbs frontal damage before hull damage, visibly breaks after depletion", () => {
  const app = boot();
  app.eval(`game.state="PLAYING"; game.stageIndex=2;
    spawnEnemyOfKind("shield", 600, 480, {vx:0, vy:0})`);
  const hp=app.eval("game.enemies[0].hp");
  const shield=app.eval("game.enemies[0].shieldHp");
  app.eval("damageEnemy(game.enemies[0], 2, 570, 480)");
  assert.equal(app.eval("game.enemies[0].hp"), hp);
  assert.equal(app.eval("game.enemies[0].shieldHp"), shield-2);
  app.eval("damageEnemy(game.enemies[0], 99, 570, 480)");
  assert.equal(app.eval("game.enemies[0].shieldHp"), 0);
  assert.equal(app.eval("game.enemies[0].hp <= 0"), true);
});

test("flanking around a shield unit damages its hull without consuming armor", () => {
  const app = boot();
  app.eval(`game.state="PLAYING"; game.stageIndex=2;
    spawnEnemyOfKind("shield", 600, 480, {vx:0, vy:0});
    game.player.x=750`);
  const hp=app.eval("game.enemies[0].hp");
  const shield=app.eval("game.enemies[0].shieldHp");
  app.eval("damageEnemy(game.enemies[0], 2, 605, 480)");
  assert.equal(app.eval("game.enemies[0].hp"), hp-2);
  assert.equal(app.eval("game.enemies[0].shieldHp"), shield);
});

test("splitters produce exactly two smaller drones, but child kills cannot farm chain, charge or wave progress", () => {
  const app = boot();
  app.eval(`game.state="PLAYING"; game.stageIndex=3;
    spawnEnemyOfKind("splitter", 630, 440, {vx:0, vy:0});
    damageEnemy(game.enemies[0], game.enemies[0].hp + 1, 620, 440)`);
  assert.equal(app.eval("game.enemies.filter(e => e.minion).length"), 2);
  assert.equal(app.eval("game.waveKills"), 1);
  assert.equal(app.eval("game.combat.energy"), 3);
  assert.equal(app.eval("game.combat.combo"), 1);
  app.eval(`for (const e of game.enemies.filter(e=>e.minion))
    damageEnemy(e, e.hp + 1, e.x, e.y)`);
  assert.equal(app.eval("game.waveKills"), 1);
  assert.equal(app.eval("game.combat.energy"), 3);
  assert.equal(app.eval("game.combat.combo"), 1);
  assert.equal(app.eval("game.stats.kills"), 3);
});

test("carriers launch at most three escorts with a per-carrier live-escort limit", () => {
  const app = boot();
  app.eval(`game.state="PLAYING"; game.stageIndex=4;
    spawnEnemyOfKind("carrier", 900, 480, {vx:0,vy:0,shootCd:9})`);
  app.eval("updateEnemies(1.1)");
  assert.equal(app.eval("game.enemies.filter(e => e.minion).length"), 1);
  assert.equal(app.eval("game.enemies[0].launchedEscorts"), 1);
  app.eval("updateEnemies(3.0); updateEnemies(3.0); updateEnemies(3.0)");
  assert.equal(app.eval("game.enemies[0].launchedEscorts"), 3);
  assert.ok(app.eval("game.enemies.filter(e => e.minion).length") <= 2);
});

test("first stage formations never spawn late-game shield enemies and enemy count is bounded", () => {
  const app = boot();
  app.eval(`game.state="PLAYING"; game.stageIndex=0; game.loop=1; game.t=21;
    spawnFormation()`);
  assert.equal(app.eval("game.enemies.every(e => stageDef().enemies.includes(e.kind))"), true);
  assert.ok(app.eval("game.enemies.some(e => e.kind === 'gunner')"));
  app.eval("for(let i=0;i<500;i++) spawnEnemyOfKind('scout',600,480)");
  assert.equal(app.eval("game.enemies.length"), 84);
});

test("BOMB immediately destroys a splitter without causing a second enemy wave", () => {
  const app = boot();
  app.eval(`game.state="PLAYING"; game.stageIndex=3; game.bomb=2;
    spawnEnemyOfKind("splitter", 700, 480, {vx:0,vy:0});
    useBomb()`);
  assert.equal(app.eval("game.enemies.filter(e => e.minion).length"), 0);
  assert.equal(app.eval("game.enemies.length"), 0);
  assert.equal(app.eval("game.waveKills"), 1);
  assert.equal(app.eval("game.combat.energy"), 0);
});

test("shield and carrier visual telegraphs render in Canvas smoke environment", () => {
  const app = boot();
  app.eval(`game.state="PLAYING"; game.stageIndex=4;
    spawnEnemyOfKind("shield", 750, 440, {vx:0,vy:0});
    spawnEnemyOfKind("carrier", 880, 530, {vx:0,vy:0});
    game.enemies[1].launchCooldown=0.55;
    drawFrame(0.016)`);
});

test("world warning activates on schedule and HUD/render remains safe for all five stages", () => {
  const app = boot();
  app.eval('game.state = "PLAYING"; game.stageIntro=0; game.world.time=0.01; updatePlaying(0.016)');
  assert.equal(app.eval('game.world.phase'), 'warning');
  assert.equal(app.eval('game.world.stageIndex'), 0);
  assert.equal(app.eval('game.world.hazard.kind'), 'rail');
  assert.equal(app.eval('game.hp'), 3);
  app.eval('game.world.time = 0.01; updatePlaying(0.016)');
  assert.equal(app.eval('game.world.phase'), 'active');
  app.eval('for(let i=0;i<5;i++){ game.stageIndex=i; game.world=worlds.createState(i); game.world.phase="warning"; game.world.hazard=worlds.geometryFor(i,game.player,0); drawFrame(0.016); game.world.phase="active"; drawFrame(0.016); }');
});

test("a player exposed to active arena hazard takes damage only once while invulnerable", () => {
  const app = boot();
  app.eval('game.state="PLAYING"; game.stageIndex=1; game.world=worlds.createState(1); game.world.phase="active"; game.world.time=0.60; game.world.hazard=worlds.geometryFor(1,{x:350,y:480},0); game.player.x=game.world.hazard.x; game.player.y=game.world.hazard.y; game.stageIntro=0; game.spawnTimer=500; game.formationTimer=500; updatePlaying(0.016)');
  assert.equal(app.eval('game.hp'), 2);
  assert.ok(app.eval('game.invuln') > 0);
  app.eval('updatePlaying(0.016)');
  assert.equal(app.eval('game.hp'), 2);
});

test("arena hazard clocks freeze on pause and Boss reward, then reset for next stage", () => {
  const app = boot();
  app.eval('game.state = "PLAYING"; game.world.time=3; pauseGame()');
  app.eval('updatePlaying(1)');
  assert.equal(app.eval('game.world.time'), 3);
  app.eval('game.state="PLAYING"; game.stageMode="BOSS_REWARD"; game.rewardTimer=100; updatePlaying(1)');
  assert.equal(app.eval('game.world.time'), 3);
  app.eval('game.pendingStageAdvance={loop:1,stageIndex:1,text:"STAGE CLEAR"}; finishBossReward()');
  assert.equal(app.eval('game.world.stageIndex'), 1);
  assert.equal(app.eval('game.world.time'), 7);
  assert.equal(app.eval('game.world.phase'), 'idle');
});

test("all five bosses spawn two glowing destroyable weapon mounts", () => {
  const app = boot();
  for (let stage=0; stage<5; stage++) {
    app.eval(`game.state="PLAYING"; game.stageIndex=${stage}; game.stageMode="WAVE"; game.boss=null; spawnBoss()`);
    assert.equal(app.eval("game.boss.parts.length"),2);
    assert.equal(app.eval("bossParts.intact(game.boss.parts)"),2);
  }
});

test("swept blue weapon shot breaks a Boss turret and reduces Boss core HP", () => {
  const app=boot();
  app.eval(`game.state="PLAYING"; game.stageMode="WAVE"; spawnBoss();
    game.boss.active=true; game.boss.x=900; game.boss.y=460;
    const p=game.boss.parts[0];
    game.bullets=[{x:300,y:game.boss.y+p.y,vx:1800,vy:0,r:9,power:200,c:"#8ef7ff"}];
    updatePlayerBullets(0.40)`);
  assert.equal(app.eval("game.boss.parts[0].hp"), 0);
  assert.equal(app.eval("game.boss.hp < game.boss.maxHp"), true);
  assert.equal(app.eval("game.boss.parts[1].hp > 0"), true);
  assert.equal(app.eval("bossParts.attackDelayMultiplier(game.boss)"), 1.32);
  assert.equal(app.eval("game.bullets.length"), 0);
});

test("aiming away from weapon mounts still damages the Boss hull", () => {
  const app=boot();
  app.eval(`game.state="PLAYING"; spawnBoss();
    game.boss.active=true; game.boss.x=900;game.boss.y=460;
    game.bullets=[{x:300,y:460,vx:1800,vy:0,r:9,power:20,c:"#fff"}];
    updatePlayerBullets(.40)`);
  assert.equal(app.eval("game.boss.hp"), 630);
  assert.equal(app.eval("game.boss.parts.every(p => p.hp === p.maxHp)"),true);
});

test("first five-stage clear stops simulation, saves high score and waits for Start", () => {
  const app=boot();
  app.eval(`game.state="PLAYING"; game.stageIndex=4; game.loop=1;
    game.score=12345;game.pendingStageAdvance={loop:2,stageIndex:0,text:"LOOP 2 START"};
    game.stageMode="BOSS_REWARD"; finishBossReward()`);
  assert.equal(app.eval("game.state"), "ENDING");
  assert.equal(app.eval("game.highScore"),12345);
  assert.equal(app.eval("game.stageIndex"),4);
  assert.equal(app.eval("game.firstClearAcknowledged"),true);
  app.eval("drawFrame(.016)");
  app.eval("updatePlaying(5)");
  assert.equal(app.eval("game.stageIndex"),4);
  app.events.get("keydown")({code:"Enter",repeat:false,preventDefault(){}});
  assert.equal(app.eval("game.state"),"PLAYING");
  assert.equal(app.eval("game.loop"),2);
  assert.equal(app.eval("game.stageIndex"),0);
  assert.equal(app.eval("game.world.stageIndex"),0);
  assert.equal(app.eval("game.stageMode"),"TRANSITION");
});

test("later loops continue straight to next stage without replaying the first-clear ending", () => {
  const app=boot();
  app.eval(`game.state="PLAYING";game.loop=2;game.stageIndex=4;
    game.firstClearAcknowledged=true;
    game.pendingStageAdvance={loop:3,stageIndex:0,text:"LOOP 3 START"};
    finishBossReward()`);
  assert.equal(app.eval("game.state"),"PLAYING");
  assert.equal(app.eval("game.loop"),3);
  assert.equal(app.eval("game.stageIndex"),0);
  assert.equal(app.eval("game.stageMode"),"TRANSITION");
});

test("Boss part-break reward cannot be claimed more than once", () => {
  const app=boot();
  app.eval(`game.state="PLAYING";spawnBoss();game.boss.active=true;
    const part=game.boss.parts[0];damageBoss(200,game.boss.x+part.x,game.boss.y+part.y,"#fff",part)`);
  const score=app.eval("game.score");
  assert.ok(score>0);
  app.eval(`damageBoss(200,game.boss.x+game.boss.parts[0].x,game.boss.y+game.boss.parts[0].y,"#fff",game.boss.parts[0])`);
  assert.equal(app.eval("game.score"),score);
});

test("keyboard mode and stage choices lead to a selectable Training run", () => {
  const app=boot();
  const press=code=>{
    app.events.get("keydown")({code,repeat:false,preventDefault(){}});
    app.events.get("keyup")({code});
  };
  press("Enter");
  assert.equal(app.eval("game.state"),"SELECT");
  press("ArrowDown");
  assert.equal(app.eval("menu.selectedMode"),"bossRush");
  press("ArrowDown");
  assert.equal(app.eval("menu.selectedMode"),"training");
  press("KeyE");
  assert.equal(app.eval("menu.trainingStage"),1);
  press("ArrowRight");
  assert.equal(app.eval("menu.selectedShip"),1);
  press("Enter");
  assert.equal(app.eval("game.state"),"PLAYING");
  assert.equal(app.eval("game.mode"),"training");
  assert.equal(app.eval("game.stageIndex"),1);
  assert.equal(app.eval("game.hp"),6);
  assert.equal(app.eval("game.bomb"),3);
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("killTarget()"),10);
  app.eval("drawFrame(.016)");
});

test("Boss Rush begins on Boss 1 without a wave or regular spawn timer", () => {
  const app=boot();
  app.eval('menu.selectedMode="bossRush";startSelectedGame()');
  assert.equal(app.eval("game.mode"),"bossRush");
  assert.equal(app.eval("game.stageIndex"),0);
  assert.equal(app.eval("game.stageMode"),"BOSS");
  assert.equal(app.eval("game.weaponLevel"),2);
  assert.equal(app.eval("game.boss.parts.length"),2);
  app.eval("game.spawnTimer=0;updatePlaying(.016)");
  assert.equal(app.eval("game.enemies.length"),0);
  assert.equal(app.eval("game.stageMode"),"BOSS");
});

test("Boss Rush passes through all five bosses and completes without classic ending", () => {
  const app=boot();
  app.eval('menu.selectedMode="bossRush";startSelectedGame()');
  for(let stage=0;stage<5;stage++){
    assert.equal(app.eval("game.stageIndex"),stage);
    assert.equal(app.eval("game.boss !== null"),true);
    app.eval("game.boss.active=true;killBoss()");
    assert.equal(app.eval("game.stats.bossesDefeated"),stage+1);
    assert.equal(app.eval("game.stageMode"),"BOSS_REWARD");
    app.eval("finishBossReward()");
    if(stage<4){
      assert.equal(app.eval("game.stageMode"),"TRANSITION");
      assert.equal(app.eval("game.stageIndex"),stage+1);
      app.eval("game.transition=0;updatePlaying(.016)");
      assert.equal(app.eval("game.stageMode"),"BOSS");
      assert.equal(app.eval("game.enemies.length"),0);
    }
  }
  assert.equal(app.eval("game.state"),"RUSH_CLEAR");
  assert.equal(app.eval("game.stats.bossesDefeated"),5);
  assert.equal(app.eval("game.firstClearAcknowledged"),false);
  app.eval("drawFrame(.016)");
  app.events.get("keydown")({code:"Enter",repeat:false,preventDefault(){}});
  assert.equal(app.eval("game.state"),"TITLE");
});

test("Boss Rush Game Over saves separate best and never pollutes Classic high score", () => {
  const app=boot();
  app.eval('saveHighScore(5000);menu.selectedMode="bossRush";startSelectedGame();game.score=1234;gameOver()');
  assert.equal(app.eval("game.highScore"),1234);
  assert.equal(app.eval('modeHighScore("bossRush")'),1234);
  assert.equal(app.eval('modeHighScore("classic")'),5000);
  app.eval("drawFrame(.016)");
});

test("Training fatal damage restores drill equipment without reaching a Game Over state", () => {
  const app=boot();
  app.eval('menu.selectedMode="training";menu.trainingStage=2;startSelectedGame();game.hp=1;game.bomb=0;game.weaponLevel=1;damagePlayer()');
  assert.equal(app.eval("game.state"),"PLAYING");
  assert.equal(app.eval("game.hp"),5);
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("game.bomb"),3);
  assert.equal(app.eval("game.stats.trainingResets"),1);
  assert.equal(app.eval("game.stats.damageTaken"),1);
  assert.equal(app.eval('modeHighScore("training")'),0);
  assert.equal(app.eval('saveModeHighScore("training",99999)'),0);
});

test("Training Boss clear restarts the selected stage and never enters classic epilogue", () => {
  const app=boot();
  app.eval('menu.selectedMode="training";menu.trainingStage=4;startSelectedGame();game.waveKills=9;spawnEnemyOfKind("elite",700,460);damageEnemy(game.enemies[0],999,700,460)');
  assert.equal(app.eval("game.stageMode"),"BOSS");
  app.eval("game.boss.active=true;killBoss();finishBossReward()");
  assert.equal(app.eval("game.trainingRounds"),1);
  assert.equal(app.eval("game.stageIndex"),4);
  assert.equal(app.eval("game.stageMode"),"TRANSITION");
  assert.equal(app.eval("game.firstClearAcknowledged"),false);
  assert.equal(app.eval("game.hp"),5);
  assert.equal(app.eval("game.weaponLevel"),3);
  app.eval("game.transition=0;updatePlaying(.016)");
  assert.equal(app.eval("game.stageMode"),"WAVE");
  assert.equal(app.eval("game.boss"),null);
});

test("Classic first-clear epilogue is unchanged when selecting Classic explicitly", () => {
  const app=boot();
  app.eval('menu.selectedMode="classic";startSelectedGame();game.stageIndex=4;game.stageMode="BOSS_REWARD";game.pendingStageAdvance={kind:"advance",loop:2,stageIndex:0,text:"LOOP 2"};finishBossReward()');
  assert.equal(app.eval("game.state"),"ENDING");
  app.events.get("keydown")({code:"Enter",repeat:false,preventDefault(){}});
  assert.equal(app.eval("game.loop"),2);
  assert.equal(app.eval("game.stageIndex"),0);
});

test("Classic Game Over writes one graded ranked run to Classic-only local Top Five", () => {
  const app=boot();
  app.eval('menu.selectedMode="classic";startSelectedGame();game.score=500;game.stats.reachedStage=3;gameOver()');
  assert.equal(app.eval("game.resultGrade"),"B");
  assert.equal(app.eval('recordStore.top("classic").length'),1);
  assert.equal(app.eval('recordStore.top("classic")[0].score'),500);
  assert.equal(app.eval('recordStore.top("bossRush").length'),0);
  assert.equal(app.eval('recordStore.achievements().filter(b=>b.unlocked).length'),1);
  app.eval("drawFrame(.016)");
});

test("Boss Rush clear persists a grade and flawless-clear achievements", () => {
  const app=boot();
  app.eval('menu.selectedMode="bossRush";startSelectedGame();game.score=9000;game.stats.bossesDefeated=5;game.stats.damageTaken=0;game.pendingStageAdvance={kind:"complete",stageIndex:4,loop:1,text:"CLEAR"};finishBossReward()');
  assert.equal(app.eval("game.state"),"RUSH_CLEAR");
  assert.equal(app.eval("game.resultGrade"),"S");
  assert.equal(app.eval('recordStore.top("bossRush").length'),1);
  assert.equal(app.eval('recordStore.top("bossRush")[0].grade'),"S");
  assert.equal(app.eval('recordStore.achievements().find(b=>b.id==="untouchable").unlocked'),true);
  assert.equal(app.eval('recordStore.achievements().find(b=>b.id==="titanSlayer").unlocked'),true);
  app.eval("drawFrame(.016)");
});

test("First Classic clear unlocks FIRST DAWN without adding an incomplete Top Five record", () => {
  const app=boot();
  app.eval('menu.selectedMode="classic";startSelectedGame();game.stageIndex=4;game.stats.reachedStage=5;game.pendingStageAdvance={kind:"advance",stageIndex:0,loop:2,text:"LOOP 2"};finishBossReward()');
  assert.equal(app.eval("game.state"),"ENDING");
  assert.equal(app.eval('recordStore.top("classic").length'),0);
  assert.equal(app.eval('recordStore.achievements().find(b=>b.id==="firstDawn").unlocked'),true);
});

test("Training can never write Top Five history or farm permanent achievements", () => {
  const app=boot();
  app.eval('menu.selectedMode="training";startSelectedGame();game.score=99999;game.stats.bossesDefeated=5;game.combat.grazes=100;game.combat.maxCombo=40');
  assert.equal(app.eval('archiveRankedRun(true)'),undefined);
  assert.equal(app.eval('recordStore.top("classic").length'),0);
  assert.equal(app.eval('recordStore.top("bossRush").length'),0);
  assert.equal(app.eval('recordStore.achievements().filter(b=>b.unlocked).length'),0);
});

test("Local records screen opens with H, renders and closes using Enter", () => {
  const app=boot();
  app.events.get("keydown")({code:"KeyH",repeat:false,preventDefault(){}});
  assert.equal(app.eval("game.state"),"RECORDS");
  app.eval("drawFrame(.016)");
  app.events.get("keyup")({code:"KeyH"});
  app.events.get("keydown")({code:"Enter",repeat:false,preventDefault(){}});
  assert.equal(app.eval("game.state"),"TITLE");
});

test("Records remain in memory if browser localStorage writes are unavailable", () => {
  const app=boot();
  app.eval('menu.selectedMode="classic";startSelectedGame();game.score=200;gameOver()');
  assert.equal(app.eval('recordStore.top("classic").length'),1);
  app.eval('returnToTitle()');
  assert.equal(app.eval('recordStore.top("classic")[0].score'),200);
});

test("selection Canvas uses shared safe geometry for all modes and either active fighter", () => {
  const app = boot();
  const expected = selectLayout.create(1280, 960);
  for (const mode of ["classic", "bossRush", "training"]) {
    for (const ship of [0, 1]) {
      const actual = app.eval(`(() => {
        const drawnRects = [], labels = [], transforms = [], scales = [];
        const previous = {
          strokeRect:ctx.strokeRect, fillText:ctx.fillText,
          translate:ctx.translate, scale:ctx.scale
        };
        ctx.strokeRect = (...args) => drawnRects.push(args);
        ctx.fillText = (...args) => labels.push(args);
        ctx.translate = (...args) => transforms.push(args);
        ctx.scale = (...args) => scales.push(args);
        game.state="SELECT";
        menu.selectedMode="${mode}";
        menu.selectedShip=${ship};
        drawFrame(0.016);
        Object.assign(ctx, previous);
        return { drawnRects, labels, transforms, scales };
      })()`);
      const boxes = actual.drawnRects.map(([x,y,w,h]) => ({x,y,w,h}));
      assert.ok(boxes.some(r =>
        r.x === expected.mode.x && r.y === expected.mode.y &&
        r.w === expected.mode.width && r.h === expected.mode.height
      ), `Missing ${mode} selector rectangle / ship ${ship}`);
      assert.ok(actual.transforms.some(([x,y]) =>
        x === expected.preview.leftX && y === expected.preview.y
      ), "Left fighter preview transform missing");
      assert.ok(actual.transforms.some(([x,y]) =>
        x === expected.preview.rightX && y === expected.preview.y
      ), "Right fighter preview transform missing");
      assert.ok(actual.scales.some(([value]) => value === expected.preview.selectedScale),
        "Selected fighter scale mismatch");
      assert.ok(actual.scales.some(([value]) => value === expected.preview.normalScale),
        "Unselected fighter scale mismatch");
      assert.ok(actual.labels.some(([value,,y]) =>
        value === "SELECT FIGHTER & MODE" && y === expected.titleY
      ), "Header must use shared layout");
      if (mode === "training") {
        assert.ok(actual.labels.some(([value,,y]) =>
          String(value).includes("PRACTICE") && y === expected.trainingHintY
        ), "Training hint must stay in its reserved gap");
      }
      const clearance = selectLayout.verticalGaps(expected, ship);
      assert.ok(clearance.modeToShip >= 40);
      assert.ok(clearance.captionToDetail >= 14);
    }
  }
});


test("red P is a collectible fourth weapon and fires exactly two parallel red lines", () => {
  const app = boot();
  app.eval('game.state="PLAYING"; collectPowerup({type:"P_RED",x:200,y:400,life:1})');
  assert.equal(app.eval('game.weaponType'), "red");
  assert.equal(app.eval('weaponMeta().color'), "#ff3d5f");
  app.eval("game.bullets.length=0;firePlayerWeapons()");
  assert.equal(app.eval("game.bullets.length"), 2);
  assert.equal(app.eval("game.bullets[0].y"), app.eval("game.player.y") - 13);
  assert.equal(app.eval("game.bullets[1].y"), app.eval("game.player.y") + 13);
  assert.equal(app.eval("game.bullets.every(b => b.vx===1120 && b.vy===0 && b.redNormal)"), true);
  app.eval('game.weaponType="blue";game.bullets.length=0;firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.some(b=>b.redNormal)"), false);
  app.eval('Math.random=()=>0.25');
  assert.equal(app.eval("randomPowerType()"), "P_RED");
});

test("five red volleys pause for 0.4 seconds and stars extend only red streaks", () => {
  const app = boot();
  app.eval('game.state="PLAYING";game.stageMode="WAVE";game.spawnTimer=100;game.formationTimer=100;game.weaponType="red";keys.Space=true;Math.random=()=>0.99');
  for (let i=0; i<5; i++) app.eval("game.fireCooldown=0;updatePlaying(0.001)");
  assert.equal(app.eval("game.redWeapon.volleys"), 0);
  assert.equal(app.eval("game.fireCooldown"), 0.4);
  app.eval("game.redWeapon.stars=2");
  for(let i=0;i<6;i++)app.eval("game.fireCooldown=0;updatePlaying(0.001)");
  assert.equal(app.eval("game.fireCooldown"), 0.1);
  app.eval("game.fireCooldown=0;updatePlaying(0.001)");
  assert.equal(app.eval("game.fireCooldown"), 0.4);
  app.eval('keys.Space=false;collectPowerup({type:"P_PURPLE",x:600,y:400,life:1})');
  assert.equal(app.eval("game.redWeapon.stars"), 2);
  assert.equal(app.eval("getFireCooldown()"), app.eval("Math.max(0.10,0.145-game.weaponLevel*0.012)"));
  app.eval('collectPowerup({type:"P_RED",x:600,y:400,life:1})');
  assert.equal(app.eval("game.redWeapon.stars"), 2);
  assert.equal(app.eval("game.redWeapon.volleys"), 0);
});

test("a triggered red fan completes its 250 projectiles and star only after active combat time", () => {
  const app = boot();
  app.eval('game.state="PLAYING";game.stageMode="WAVE";game.invuln=99;game.spawnTimer=999;game.formationTimer=999;game.weaponType="red";game.fireCooldown=0;keys.Space=true;Math.random=()=>0;updatePlaying(0.01);keys.Space=false');
  assert.equal(app.eval("game.redWeapon.special !== null"), true);
  assert.equal(app.eval("game.redWeapon.stars"), 0);
  const before = app.eval("game.redWeapon.special.emitted");
  app.eval('game.state="PAUSED";updatePlaying(1)');
  assert.equal(app.eval("game.redWeapon.special.emitted"), before);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=10;updatePlaying(1)');
  assert.equal(app.eval("game.redWeapon.special.emitted"), before);
  app.eval('game.stageMode="WAVE";collectPowerup({type:"P_BLUE",x:600,y:400,life:1})');
  assert.equal(app.eval("game.weaponType"), "blue");
  app.eval("updatePlaying(1)");
  assert.equal(app.eval("game.redWeapon.stars"), 0);
  assert.ok(app.eval("game.bullets.some(b=>b.redSpecial)"));
  app.eval("updatePlaying(2)");
  assert.equal(app.eval("game.redWeapon.stars"), 1);
  assert.equal(app.eval("game.redWeapon.special"), null);
  assert.equal(app.eval("game.weaponType"), "blue");
});

test("250 special shots fit the bounded projectiles budget, with real bullets and fan angles", () => {
  const app = boot();
  const stats = app.eval([
    '(() => {',
    '  game.weaponType="red"; redRules.fire(game.redWeapon,0); const sample=[];',
    '  const outcome=redRules.tick(game.redWeapon,3,(angle,index)=>{',
    '    sample.push(angle);',
    '    addPlayerShot(game.player.x+60,game.player.y,Math.cos(angle)*1060,Math.sin(angle)*1060,5,.38,"#ff4264",{redSpecial:true});',
    '  }); return {outcome, count:game.bullets.length, sample};',
    '})()'
  ].join("\n"));
  assert.equal(stats.outcome.completed, true);
  assert.equal(stats.count, 250);
  assert.equal(stats.sample.length, 250);
  assert.ok(stats.sample.every(a=>Math.abs(a)<=Math.PI/18+1e-12));
});

test("damage reduces only stored red stars; Vanguard's absorbed hit does not", () => {
  const app = boot();
  app.eval('menu.selectedShip=1;game=newGame();game.state="PLAYING";game.weaponType="yellow";game.redWeapon.stars=3;game.combat.energy=100;activateOverdrive();damagePlayer()');
  assert.equal(app.eval("game.redWeapon.stars"), 3);
  assert.equal(app.eval("game.hp"), 4);
  app.eval("game.invuln=0;damagePlayer()");
  assert.equal(app.eval("game.redWeapon.stars"), 2);
  assert.equal(app.eval("game.stats.damageTaken"), 1);
  app.eval("damagePlayer()");
  assert.equal(app.eval("game.redWeapon.stars"), 2);
  app.eval("game.invuln=0;damagePlayer()");
  assert.equal(app.eval("game.redWeapon.stars"), 1);
  assert.equal(app.eval("game.weaponType"), "yellow");
});

test("red stars remain stored but HUD is visible ONLY while RED P is equipped", () => {
  const app = boot();
  const labels = app.eval([
    '(() => {',
    'game.state="PLAYING";game.weaponType="blue";game.redWeapon.stars=4;',
    'const values=[];ctx.fillText=(label)=>values.push(String(label));',
    'drawHud();return values;',
    '})()'
  ].join("\n"));
  assert.equal(labels.some(text=>text.includes("RED P")),false);
  assert.equal(app.eval("game.redWeapon.stars"),4);
  assert.equal(app.eval("getFireCooldown()"),app.eval("Math.max(.07,.115-game.weaponLevel*.014)"));
  const redLabels=app.eval([
    '(() => {game.weaponType="red";const values=[];',
    'ctx.fillText=(label)=>values.push(String(label));drawHud();return values;})()'
  ].join("\n"));
  assert.ok(redLabels.some(text=>text.includes("RED P")&&text.includes("★★★★☆")));
  app.eval('collectPowerup({type:"P_SKY",x:600,y:400,life:1})');
  assert.equal(app.eval("game.redWeapon.stars"),4);
  const skyLabels=app.eval([
    '(() => {const values=[];ctx.fillText=(label)=>values.push(String(label));',
    'drawHud();return values;})()'
  ].join("\n"));
  assert.equal(skyLabels.some(text=>text.includes("RED P")),false);
  app.eval('collectPowerup({type:"P_RED",x:600,y:400,life:1})');
  assert.equal(app.eval("game.redWeapon.stars"),4);
  const again=app.eval([
    '(() => {const values=[];ctx.fillText=(label)=>values.push(String(label));',
    'drawHud();return values;})()'
  ].join("\n"));
  assert.ok(again.some(text=>text.includes("RED P")&&text.includes("★★★★☆")));
});

test("green P pickup fires precisely the unupgraded starter bullets at every weapon level", () => {
  const app = boot();
  app.eval('game.state="PLAYING";game.weaponType="blue";game.weaponLevel=1;firePlayerWeapons()');
  const starter = app.eval('JSON.stringify(game.bullets.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,r:b.r,power:b.power,c:b.c})))');
  app.eval('game.bullets=[];collectPowerup({type:"P_GREEN",x:350,y:400,life:1});game.weaponLevel=3;firePlayerWeapons()');
  assert.equal(app.eval('game.weaponType'), "green");
  assert.equal(app.eval('weaponMeta().color'), "#43ff87");
  assert.equal(app.eval('JSON.stringify(game.bullets.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,r:b.r,power:b.power,c:b.c})))'), starter);
  assert.equal(app.eval('game.missiles.length'), 0);
  assert.ok(Math.abs(app.eval("getFireCooldown()") - 0.101) < 1e-10);

  app.eval('game.combat.energy=100;activateOverdrive();game.bullets=[];firePlayerWeapons()');
  assert.equal(app.eval('game.bullets.length'), 2);
  assert.equal(app.eval('game.bullets.some(b=>b.lance)'), false);
  app.eval('Math.random=()=>0.35');
  assert.equal(app.eval('randomPowerType()'), "P_GREEN");
});

test("green aura deals two HP every 0.4s to all nearby enemies, not distant ones", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="green";',
    'game.player.x=500;game.player.y=480;',
    'game.enemies=[',
    '  {kind:"scout",x:570,y:480,r:25,hp:2,maxHp:2,score:35,color:"#fff",core:"#eee"},',
    '  {kind:"gunner",x:688,y:480,r:20,hp:6,maxHp:6,score:45,color:"#fff",core:"#eee"},',
    '  {kind:"scout",x:900,y:480,r:25,hp:6,maxHp:6,score:35,color:"#fff",core:"#eee"}',
    ']; updateGreenAura(0.399);'
  ].join("\n"));
  assert.equal(app.eval('game.enemies.length'), 3);
  assert.equal(app.eval('game.stats.kills'), 0);
  app.eval('updateGreenAura(0.001)');
  assert.equal(app.eval('game.stats.kills'), 1);
  assert.equal(app.eval('game.waveKills'), 1);
  assert.equal(app.eval('game.enemies.length'), 2);
  assert.equal(app.eval('game.enemies.find(e=>e.kind==="gunner").hp'), 4);
  assert.equal(app.eval('game.enemies.find(e=>e.x===900).hp'), 6);
  app.eval('updateGreenAura(0.4)');
  assert.equal(app.eval('game.enemies.find(e=>e.kind==="gunner").hp'), 2);
  app.eval('updateGreenAura(0.4)');
  assert.equal(app.eval('game.stats.kills'), 2);
  assert.equal(app.eval('game.enemies.length'), 1);
});

test("green aura respects frontal enemy shielding and can hit a Boss by hull edge", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="green";',
    'game.player.x=500;game.player.y=480;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",x:630,y:480,r:35,hp:10,maxHp:10,score:80,color:"#f88",core:"#fff"})];',
    'game.boss={x:775,y:480,rx:100,ry:80,hp:60,maxHp:60,active:true,color:"#f66",core:"#fff",parts:[]};',
    'updateGreenAura(0.4);'
  ].join("\n"));
  assert.equal(app.eval('game.enemies[0].hp'), 10);
  assert.equal(app.eval('game.enemies[0].shieldHp'), 6);
  assert.equal(app.eval('game.boss.hp'), 58);
  app.eval('game.player.x=220; updateGreenAura(0.4)');
  assert.equal(app.eval('game.boss.hp'), 58);
  assert.equal(app.eval('game.enemies[0].shieldHp'), 6);
});

test("green 0.4s clock freezes on pause and transitions; switching weapons cancels it", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="green";',
    'game.invuln=100;game.spawnTimer=999;game.formationTimer=999;',
    'game.player.x=500;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:610,y:480,r:20,hp:10,maxHp:10,',
    '  score:50,color:"#fff",core:"#eee",vx:0,vy:0,t:0,wave:0,shootCd:99,shootBase:99}];',
    'updatePlaying(.19);updatePlaying(.19);'
  ].join("\n"));
  assert.equal(app.eval('game.enemies[0].hp'), 10);
  app.eval('updatePlaying(.02)');
  assert.equal(app.eval('game.enemies[0].hp'), 8);
  app.eval('game.state="PAUSED";updatePlaying(5)');
  assert.equal(app.eval('game.enemies[0].hp'), 8);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=10;updatePlaying(5)');
  assert.equal(app.eval('game.enemies[0].hp'), 8);
  app.eval('game.stageMode="WAVE";updatePlaying(.2);updatePlaying(.2)');
  assert.equal(app.eval('game.enemies[0].hp'), 6);

  app.eval('game.greenAura.elapsed=.3;game.redWeapon.stars=3;collectPowerup({type:"P_PURPLE",x:300,y:300,life:1})');
  assert.equal(app.eval('game.greenAura.elapsed'), 0);
  assert.equal(app.eval('game.redWeapon.stars'), 3);
  app.eval('updatePlaying(2)');
  assert.equal(app.eval('game.enemies[0].hp'), 6);
  app.eval('collectPowerup({type:"P_GREEN",x:300,y:300,life:1});updatePlaying(.2)');
  assert.equal(app.eval('game.enemies[0].hp'), 6);
  app.eval('updatePlaying(.2)');
  assert.equal(app.eval('game.enemies[0].hp'), 4);
  assert.equal(app.eval('game.redWeapon.stars'), 3);
});

test("aura kills a splitter but does not immediately hit the spawned children", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="green";',
    'game.player.x=500;game.player.y=480;',
    'game.enemies=[{kind:"splitter",x:610,y:480,r:36,hp:2,maxHp:2,score:40,color:"#3fa",core:"#fff"}];',
    'updateGreenAura(0.4);'
  ].join("\n"));
  assert.equal(app.eval('game.stats.kills'), 1);
  assert.equal(app.eval('game.enemies.length'), 2);
  assert.equal(app.eval('game.enemies.every(e=>e.minion && e.hp>0)'), true);
  app.eval('updateGreenAura(0.4)');
  assert.equal(app.eval('game.enemies.length'), 0);
  assert.equal(app.eval('game.stats.kills'), 3);
  assert.equal(app.eval('game.waveKills'), 1);
});

test("green ring is visibly drawn at its actual damaging radius and only while equipped", () => {
  const app = boot();
  const shown = app.eval([
    '(() => {',
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="green";',
    'const radii=[];const labels=[];',
    'ctx.arc=(x,y,r)=>radii.push(r);ctx.fillText=(text)=>labels.push(String(text));',
    'drawFrame(.016);',
    'return {radii,labels};',
    '})()'
  ].join("\n"));
  assert.ok(shown.radii.includes(360));
  assert.ok(shown.labels.some(s=>s.includes("GREEN AURA  2 DMG/0.4S")));
  const hidden = app.eval([
    '(() => {',
    'game.weaponType="blue";const radii=[];',
    'ctx.arc=(x,y,r)=>radii.push(r);',
    'drawGreenAura(); return radii;',
    '})()'
  ].join("\n"));
  assert.equal(hidden.length, 0);
});


test("green aura begins its 0.4s global clock on equip even with no targets", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="blue";',
    'game.player.x=500;game.player.y=480;game.nextGuaranteedP=999;',
    'collectPowerup({type:"P_GREEN",x:300,y:300,life:1});',
    'game.enemies=[];',
    'updateGreenAura(.30);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.greenAura.elapsed") - .30) < 1e-9);
  // Enemy enters at t=.30, first hit at t=.40, NOT one period after contact.
  app.eval('game.enemies=[{kind:"scout",x:780,y:480,r:25,hp:8,maxHp:8,score:40,color:"#fff",core:"#eee"}]');
  app.eval("updateGreenAura(.09)");
  assert.equal(app.eval("game.enemies[0].hp"), 8);
  app.eval("updateGreenAura(.01)");
  assert.equal(app.eval("game.enemies[0].hp"), 6);

  // Enemy leaves, then reenters just before the next global t=.80 pulse.
  app.eval("game.enemies[0].x=1100;updateGreenAura(.30)");
  assert.equal(app.eval("game.enemies[0].hp"), 6);
  app.eval("game.enemies[0].x=800;updateGreenAura(.10)");
  assert.equal(app.eval("game.enemies[0].hp"), 4);

  // Recollecting GREEN while already equipped does not reset phase.
  app.eval('updateGreenAura(.30);collectPowerup({type:"P_GREEN",x:300,y:300,life:1})');
  assert.ok(Math.abs(app.eval("game.greenAura.elapsed") - .30) < 1e-9);
  app.eval("updateGreenAura(.10)");
  assert.equal(app.eval("game.enemies[0].hp"), 2);
});

test("doubled green halo hits enemies beyond previous radius but not beyond 360 + hitbox", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="green";',
    'game.player.x=500;game.player.y=480;',
    'game.enemies=[',
    ' {kind:"gunner",x:835,y:480,r:20,hp:8,maxHp:8,score:50,color:"#fff",core:"#eee"},',
    ' {kind:"gunner",x:881,y:480,r:20,hp:8,maxHp:8,score:50,color:"#fff",core:"#eee"}',
    '];updateGreenAura(0.4);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"), 6);
  assert.equal(app.eval("game.enemies[1].hp"), 8);
});


test("BLACK P drop is discoverable and its twin dark shots never inherit blue upgrades", () => {
  const app = boot();
  app.eval('game.state="PLAYING"; game.weaponType="blue"; game.weaponLevel=1; firePlayerWeapons()');
  const baseline = app.eval('JSON.stringify(game.bullets.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,r:b.r,power:b.power})))');
  app.eval('game.bullets=[];collectPowerup({type:"P_BLACK",x:350,y:400,life:1});game.weaponLevel=3;firePlayerWeapons()');
  assert.equal(app.eval("game.weaponType"), "black");
  assert.equal(app.eval("weaponMeta().name"), "SLOW");
  assert.equal(app.eval("game.bullets.length"), 2);
  assert.equal(app.eval('JSON.stringify(game.bullets.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,r:b.r,power:b.power})))'), baseline);
  assert.equal(app.eval("game.bullets.every(b=>b.blackSlow && b.c==='#121522')"), true);
  assert.equal(app.eval("game.bullets.some(b=>b.lance)"), false);
  assert.equal(app.eval("game.missiles.length"), 0);
  assert.ok(Math.abs(app.eval("getFireCooldown()") - 0.101) < 1e-10);
  app.eval("Math.random=()=>0.42");
  assert.equal(app.eval("randomPowerType()"), "P_BLACK");
  app.eval("game.weaponLevel=3;game.powerups=[];dropPlayerPowerOnHit()");
  assert.equal(app.eval('game.powerups.at(-1).type'), "P_BLACK");
});

test("only a real BLACK projectile hit applies 50% slow for 5 seconds and refreshes on repeat", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:410,y:480,r:22,hp:50,maxHp:50,score:40,',
    'color:"#fff",core:"#eee",vx:-100,vy:0,t:0,wave:0,shootCd:2,shootBase:10}];',
    'addPlayerShot(300,480,1100,0,9,1.15,"#121522",{blackSlow:true});',
    'updatePlayerBullets(.12);'
  ].join("\n"));
  assert.equal(app.eval('game.enemies[0].slowRemaining'), 5);
  assert.ok(app.eval('game.enemies[0].hp') < 50);
  assert.equal(app.eval('game.bullets.length'), 0);

  app.eval('updateEnemies(1)');
  assert.equal(app.eval('game.enemies[0].x'), 360);
  assert.equal(app.eval('game.enemies[0].shootCd'), 1.5);
  assert.equal(app.eval('game.enemies[0].t'), 0.5);
  assert.equal(app.eval('game.enemies[0].slowRemaining'), 4);

  // Another weapon's shot cannot refresh a BLACK slow status.
  app.eval('game.enemies[0].x=410;addPlayerShot(300,480,1100,0,9,1.15,"#38e8ff");updatePlayerBullets(.12)');
  assert.equal(app.eval('game.enemies[0].slowRemaining'), 4);
  app.eval('addPlayerShot(300,480,1100,0,9,1.15,"#121522",{blackSlow:true});updatePlayerBullets(.12)');
  assert.equal(app.eval('game.enemies[0].slowRemaining'), 5);

  // A status may expire midway through a frame and the original speed resumes.
  app.eval('blackRules.advance(game.enemies[0],4.5);game.enemies[0].x=410;game.enemies[0].shootCd=2');
  assert.equal(app.eval('game.enemies[0].slowRemaining'), 0.5);
  app.eval('updateEnemies(1)');
  assert.equal(app.eval('game.enemies[0].x'), 335);
  assert.equal(app.eval('game.enemies[0].shootCd'), 1.25);
  assert.equal(app.eval('game.enemies[0].slowRemaining'), 0);
  app.eval('updateEnemies(.25)');
  assert.equal(app.eval('game.enemies[0].x'), 310);
  assert.equal(app.eval('game.enemies[0].shootCd'), 1);
});

test("BLACK projectile slows shielded enemies even if their barrier absorbs its damage", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.player.x=180;game.player.y=480;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",x:400,y:480,r:39,',
    'hp:10,maxHp:10,score:60,color:"#aaf",core:"#fff"})];',
    'addPlayerShot(280,480,1100,0,9,1.15,"#121522",{blackSlow:true});',
    'updatePlayerBullets(.11);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"), 10);
  assert.ok(app.eval("game.enemies[0].shieldHp") < app.eval("game.enemies[0].shieldMax"));
  assert.equal(app.eval("game.enemies[0].slowRemaining"), 5);
});

test("a black shot already flying still slows its victim after equipping another color", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="black";game.player.x=200;game.player.y=480;',
    'game.enemies=[{kind:"gunner",x:410,y:470,r:35,hp:40,maxHp:40,score:30,color:"#fff",core:"#eee"}];',
    'firePlayerWeapons();',
    'collectPowerup({type:"P_GREEN",x:220,y:470,life:1});',
    'updatePlayerBullets(.16);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"), "green");
  assert.equal(app.eval("game.enemies[0].slowRemaining"), 5);
  assert.equal(app.eval("game.redWeapon.stars"), 0);
});

test("BLACK P slows boss movement and attack clock on both hull and turret hits", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";spawnBoss();game.boss.active=true;',
    'game.boss.x=1010;game.boss.y=480;game.boss.shoot=3;',
    'game.player.x=500;game.player.y=480;',
    'addPlayerShot(700,480,1500,0,9,1.15,"#121522",{blackSlow:true});',
    'updatePlayerBullets(.25);'
  ].join("\n"));
  assert.equal(app.eval("game.boss.slowRemaining"), 5);
  app.eval('game.boss.t=0;game.boss.shoot=3;game.boss.warning=0;updateBoss(1)');
  assert.equal(app.eval("game.boss.t"), 0.5);
  assert.equal(app.eval("game.boss.shoot"), 2.5);
  assert.equal(app.eval("game.boss.slowRemaining"), 4);

  // Turret collision also refreshes the same Boss status.
  app.eval([
    'game.boss.x=1010;game.boss.y=480;',
    'const turret=game.boss.parts[0];',
    'const turretX=game.boss.x+turret.x, turretY=game.boss.y+turret.y;',
    'addPlayerShot(turretX-140,turretY,1400,0,9,1.15,"#121522",{blackSlow:true});',
    'updatePlayerBullets(.13);'
  ].join("\n"));
  assert.equal(app.eval("game.boss.slowRemaining"), 5);
  assert.ok(app.eval("game.boss.parts[0].hp < game.boss.parts[0].maxHp"));
  app.eval('game.boss.warning=1;updateBoss(1)');
  assert.equal(app.eval("game.boss.warning"), 0.5);
});

test("BLACK slow halves carrier escort launch cadence and pauses outside combat", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=200;game.player.y=200;',
    'const carrier=spawnEnemyOfKind("carrier",700,480,{vx:0,vy:0,shootCd:99});',
    'carrier.launchCooldown=1;',
    'blackRules.apply(carrier);updateEnemies(1);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies.length"), 1);
  assert.equal(app.eval("game.enemies[0].launchCooldown"), 0.5);
  assert.equal(app.eval("game.enemies[0].slowRemaining"), 4);
  app.eval('game.state="PAUSED";updatePlaying(2)');
  assert.equal(app.eval("game.enemies[0].slowRemaining"), 4);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=10;updatePlaying(2)');
  assert.equal(app.eval("game.enemies[0].slowRemaining"), 4);
  app.eval('game.stageMode="WAVE";updateEnemies(1)');
  assert.equal(app.eval("game.enemies[0].launchedEscorts"), 1);
});

test("slowed enemies and Bosses glow blue only while the debuff is active", () => {
  const app = boot();
  const result = app.eval([
    '(() => {',
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=180;',
    'const e=spawnEnemyOfKind("scout",550,470,{vx:0,vy:0});',
    'const glows=[];ctx.stroke=()=>{glows.push(ctx.shadowColor)};',
    'drawEnemy(e);const before=glows.filter(x=>x==="#178bff").length;',
    'blackRules.apply(e);drawEnemy(e);',
    'const after=glows.filter(x=>x==="#178bff").length;',
    'return {before,after};',
    '})()'
  ].join("\n"));
  assert.equal(result.before, 0);
  assert.equal(result.after, 2);

  const boss = app.eval([
    '(() => {',
    'game.boss=null;game.stageMode="WAVE";spawnBoss();game.boss.active=true;',
    'const glows=[];ctx.stroke=()=>{glows.push(ctx.shadowColor)};',
    'drawBoss(game.boss);const before=glows.filter(x=>x==="#178bff").length;',
    'blackRules.apply(game.boss);drawBoss(game.boss);',
    'return {before,after:glows.filter(x=>x==="#178bff").length};',
    '})()'
  ].join("\n"));
  assert.equal(boss.before, 0);
  assert.equal(boss.after, 2);
  app.eval('blackRules.advance(game.boss,5)');
  assert.equal(app.eval('blackRules.isSlowed(game.boss)'), false);
});

test("BLACK slow does not alter the velocity of already-launched enemy projectiles", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:490,y:480,r:28,hp:10,maxHp:10,',
    'vx:-100,vy:0,shootCd:3,shootBase:3,color:"#aaf",core:"#fff"}];',
    'aimAtPlayer(490,480,300,8,"#fff","#eaf");',
    'const enemy=game.enemies[0];blackRules.apply(enemy);'
  ].join("\n"));
  assert.equal(app.eval('game.enemyBullets[0].vx'), -300);
  app.eval('updateEnemies(.2)');
  assert.equal(app.eval('game.enemyBullets[0].vx'), -300);
});


test("WHITE P is the seventh drop, fires paired unlimited-penetration bolts and retains base cadence", () => {
  const app = boot();
  app.eval('game.state="PLAYING";game.weaponType="white";game.weaponLevel=3;game.bullets=[];firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"), 2);
  assert.equal(app.eval("game.bullets.every(b=>b.whiteConductive && b.hitEnemies.length===0)"), true);
  assert.equal(app.eval("game.bullets.every(b=>b.vx===1120 && b.vy===0)"), true);
  assert.equal(app.eval("game.bullets.every(b=>!b.dead && !b.whiteBossHit)"), true);
  assert.equal(app.eval("game.missiles.length"), 0);
  assert.ok(Math.abs(app.eval("getFireCooldown()") - 0.101) < 1e-10);
  app.eval("Math.random=()=>0.50");
  assert.equal(app.eval("randomPowerType()"), "P_WHITE");
  app.eval('game.weaponLevel=3;game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval("game.powerups.at(-1).type"), "P_WHITE");
  const labels = app.eval([
    '(() => {',
    'const arr=[];ctx.fillText=(label)=>arr.push(String(label));',
    'drawHud();return arr;',
    '})()'
  ].join("\n"));
  assert.ok(labels.includes("WHITE ARC 60% 1-3 HOPS"));
});

test("one white direct hit conducts once to all neighbors within GREEN's 360-radius", () => {
  const app = boot();
  app.eval('Math.random=()=>0.99');
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;',
    'game.enemies=[',
    '  {kind:"gunner",x:400,y:480,r:20,hp:50,maxHp:50,score:40,color:"#fff",core:"#eee"},',
    '  {kind:"scout",x:735,y:480,r:20,hp:50,maxHp:50,score:40,color:"#fff",core:"#eee"},',
    '  {kind:"scout",x:850,y:480,r:20,hp:50,maxHp:50,score:40,color:"#fff",core:"#eee"}',
    '];addPlayerShot(300,480,1100,0,9,1.15,"#fff",whiteRules.createShot());',
    'updatePlayerBullets(.10);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp") - 48.85) < 1e-9);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp") - (50 - 1.15*.60)) < 1e-9);
  assert.equal(app.eval("game.enemies[2].hp"), 50);
  assert.equal(app.eval("game.bullets.length"), 1); // actual piercing
  assert.equal(app.eval("game.bullets[0].hitEnemies.length"), 2);
  assert.equal(app.eval("game.electricArcs.length"), 2); // direct and secondary light
});

test("a one-hop probability result stops at the first wave and never repeats victims", () => {
  const app = boot();
  app.eval('Math.random=()=>0.99');
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;',
    'game.enemies=[',
    '  {kind:"scout",x:400,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    '  {kind:"scout",x:735,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    '  {kind:"scout",x:1090,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}',
    '];addPlayerShot(300,480,1100,0,9,1.15,"#fff",whiteRules.createShot());',
    'updatePlayerBullets(.10);'
  ].join("\n"));
  // Third enemy is 690px from the first contact. One-hop shock never reaches it.
  assert.equal(app.eval("game.enemies[2].hp"), 50);
  const secondaryHp = app.eval("game.enemies[1].hp");
  app.eval("updatePlayerBullets(.30)"); // Cross the already-conducted middle target
  assert.equal(app.eval("game.enemies[1].hp"), secondaryHp);
  assert.equal(app.eval("game.enemies[2].hp"), 50);
  app.eval("updatePlayerBullets(.35)"); // Third target is far enough for a new DIRECT hit
  assert.ok(Math.abs(app.eval("game.enemies[2].hp") - 48.85) < 1e-9);
  assert.equal(app.eval("game.enemies[1].hp"), secondaryHp);
  assert.equal(app.eval("game.bullets[0].hitEnemies.length"), 3);
  assert.equal(app.eval("game.bullets.length"), 1);
});

test("electrical fan-out never damages newly spawned splitter children on the same impact", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=200;game.player.y=480;',
    'game.enemies=[{kind:"splitter",x:400,y:480,r:35,hp:1,maxHp:1,',
    'score:60,color:"#fff",core:"#eee"}];',
    'addPlayerShot(300,480,1100,0,9,1.15,"#fff",whiteRules.createShot());',
    'updatePlayerBullets(.10);'
  ].join("\n"));
  assert.equal(app.eval("game.stats.kills"), 1);
  assert.equal(app.eval("game.enemies.length"), 3); // dead parent is removed by enemy update
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).length"), 2);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).every(e=>e.hp>0)"), true);
  assert.equal(app.eval("game.bullets[0].hitEnemies.length"), 1);
});

test("WHITE conductive splash damages a nearby Boss hull only once per projectile", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:400,y:480,r:20,hp:50,maxHp:50,score:40,color:"#fff",core:"#eee"}];',
    'game.boss={active:true,x:820,y:480,rx:90,ry:80,hp:100,maxHp:100,color:"#fff",parts:[]};',
    'addPlayerShot(300,480,1100,0,9,1.15,"#fff",whiteRules.createShot());',
    'updatePlayerBullets(.10);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.boss.hp") - (100-1.15*.60)) < 1e-9);
  assert.equal(app.eval("game.bullets[0].whiteBossHit"), true);
  // Passing through the Boss later must not inflict a second hit.
  app.eval("updatePlayerBullets(.45)");
  assert.ok(Math.abs(app.eval("game.boss.hp") - (100-1.15*.60)) < 1e-9);
});

test("piercing WHITE boss hull contact conducts once to nearby enemies", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;',
    'game.boss={active:true,x:760,y:480,rx:90,ry:80,hp:100,maxHp:100,color:"#fff",parts:[]};',
    'game.enemies=[{kind:"scout",x:730,y:200,r:20,hp:50,maxHp:50,score:40,color:"#fff",core:"#eee"}];',
    'addPlayerShot(300,480,1100,0,9,1.15,"#fff",whiteRules.createShot());',
    'updatePlayerBullets(.44);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.boss.hp") - 98.85) < 1e-9);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp") - (50-1.15*.60)) < 1e-9);
  assert.equal(app.eval("game.bullets.length"), 1);
  assert.equal(app.eval("game.bullets[0].whiteBossHit"), true);
});

test("white projectile hits Boss turrets before core and cannot damage the same Boss twice", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";spawnBoss();game.boss.active=true;',
    'game.boss.x=1010;game.boss.y=480;',
    'const mount=game.boss.parts[0];',
    'const tx=game.boss.x+mount.x,ty=game.boss.y+mount.y;',
    'addPlayerShot(tx-160,ty,1200,0,9,1.15,"#fff",whiteRules.createShot());',
    'updatePlayerBullets(.15);'
  ].join("\n"));
  assert.ok(app.eval("game.boss.parts[0].hp<game.boss.parts[0].maxHp"));
  assert.equal(app.eval("game.boss.hp"), app.eval("game.boss.maxHp"));
  assert.equal(app.eval("game.bullets[0].whiteBossHit"), true);
  app.eval("updatePlayerBullets(.18)");
  assert.equal(app.eval("game.boss.hp"), app.eval("game.boss.maxHp"));
  assert.equal(app.eval("game.bullets[0].whiteBossHit"), true);
});

test("switching away from white does not disable electricity on bolts in flight", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;',
    'game.weaponType="white";game.redWeapon.stars=3;game.enemies=[',
    '{kind:"scout",x:450,y:470,r:22,hp:20,maxHp:20,score:40,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:700,y:470,r:22,hp:20,maxHp:20,score:40,color:"#fff",core:"#eee"}',
    '];firePlayerWeapons();',
    'collectPowerup({type:"P_GREEN",x:240,y:480,life:1});',
    'updatePlayerBullets(.22);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"), "green");
  assert.equal(app.eval("game.redWeapon.stars"), 3);
  assert.ok(app.eval("game.enemies[0].hp<20 && game.enemies[1].hp<20"));
  assert.equal(app.eval("game.bullets.some(b=>b.whiteConductive)"), true);
});

test("lightning arcs are strictly bounded, fade away and do not persist during pause", () => {
  const app = boot();
  app.eval('for(let i=0;i<500;i++)addElectricArc(100,100,300,200)');
  assert.equal(app.eval("game.electricArcs.length"), 96);
  app.eval("updateParticles(.19)");
  assert.equal(app.eval("game.electricArcs.length"), 0);
  app.eval("game.state='PAUSED';addElectricArc(100,100,200,200);drawElectricArcs()");
  assert.equal(app.eval("game.electricArcs.length"), 1);
});


test("GRAY P joins eighth-color drops and fires only baseline paired bullets", () => {
  const app=boot();
  app.eval('game.state="PLAYING";game.weaponType="blue";game.weaponLevel=1;firePlayerWeapons()');
  const baseline=app.eval('JSON.stringify(game.bullets.map(b=>({vx:b.vx,vy:b.vy,r:b.r,power:b.power})))');
  app.eval('game.bullets=[];collectPowerup({type:"P_GRAY",x:300,y:480,life:1});game.weaponLevel=3;firePlayerWeapons()');
  assert.equal(app.eval("game.weaponType"),"gray");
  assert.equal(app.eval("weaponMeta().name"),"IMPACT");
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.grayImpact && b.c==='#abb3c0')"),true);
  assert.equal(app.eval('JSON.stringify(game.bullets.map(b=>({vx:b.vx,vy:b.vy,r:b.r,power:b.power})))'),baseline);
  assert.equal(app.eval("game.missiles.length"),0);
  assert.ok(Math.abs(app.eval("getFireCooldown()")-.101)<1e-10);
  app.eval("Math.random=()=>.57");
  assert.equal(app.eval("randomPowerType()"),"P_GRAY");
  app.eval("game.powerups=[];dropPlayerPowerOnHit()");
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_GRAY");
});

test("GRAY hit with roll under 20% immediately knocks enemy 100 game coordinates", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;Math.random=()=>.19;',
    'game.enemies=[{kind:"scout",x:410,y:480,r:24,hp:40,maxHp:40,',
    'score:40,color:"#fff",core:"#eee",vx:-100,vy:0,shootCd:99,shootBase:99,t:0,wave:0}];',
    'addPlayerShot(300,480,1100,0,9,1.15,"#abb3c0",{grayImpact:true});updatePlayerBullets(.12);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].x"),510);
  assert.equal(app.eval("grayRules.isStunned(game.enemies[0])"),false);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-38.85)<1e-8);
  assert.equal(app.eval("game.bullets.length"),0);
});

test("GRAY hit with roll between 20% and 25% freezes all attacks and movement for 0.5 seconds", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;Math.random=()=>.22;',
    'game.enemies=[{kind:"gunner",x:410,y:480,r:25,hp:40,maxHp:40,',
    'score:40,color:"#fff",core:"#eee",vx:-100,vy:0,shootCd:0,shootBase:1,t:0,wave:0}];',
    'addPlayerShot(300,480,1100,0,9,1.15,"#abb3c0",{grayImpact:true});updatePlayerBullets(.12);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].grayStunRemaining"),0.5);
  app.eval("updateEnemies(.25);updateEnemies(.25)");
  assert.equal(app.eval("game.enemies[0].x"),410);
  assert.equal(app.eval("game.enemies[0].t"),0);
  assert.equal(app.eval("game.enemyBullets.length"),0);
  app.eval("updateEnemies(.1)");
  assert.equal(app.eval("game.enemies[0].x"),400);
  assert.equal(app.eval("game.enemies[0].grayStunRemaining"),0);
  assert.equal(app.eval("game.enemyBullets.length"),2);
});

test("GRAY 0.5s stun and BLACK slow age independently while carrier escorts cannot spawn", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=200;game.player.y=480;',
    'const e=spawnEnemyOfKind("carrier",700,480,{vx:-100,vy:0,shootCd:99});',
    'e.launchCooldown=0;blackRules.apply(e);grayRules.apply(e,.22);',
    'updateEnemies(.25);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies.length"),1);
  assert.equal(app.eval("game.enemies[0].x"),700);
  assert.equal(app.eval("game.enemies[0].launchedEscorts"),0);
  assert.equal(app.eval("game.enemies[0].grayStunRemaining"),0.25);
  assert.equal(app.eval("game.enemies[0].slowRemaining"),4.75);
  app.eval("updateEnemies(.25)");
  assert.equal(app.eval("game.enemies[0].launchedEscorts"),0);
  assert.equal(app.eval("game.enemies[0].slowRemaining"),4.5);
  app.eval("updateEnemies(.2)");
  assert.equal(app.eval("game.enemies[0].launchedEscorts"),1);
  assert.ok(Math.abs(app.eval("game.enemies[0].x")-690)<1e-8);
});

test("GRAY stun applies on shielded hits without bypassing frontal shield", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=180;game.player.y=480;Math.random=()=>.22;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",x:400,y:480,r:39,',
    'hp:10,maxHp:10,score:50,color:"#aaf",core:"#fff"})];',
    'addPlayerShot(280,480,1100,0,9,1.15,"#abb3c0",{grayImpact:true});updatePlayerBullets(.11);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),10);
  assert.ok(app.eval("game.enemies[0].shieldHp < game.enemies[0].shieldMax"));
  assert.equal(app.eval("game.enemies[0].grayStunRemaining"),0.5);
});

test("GRAY pushes Boss anchor within its arena or stuns a Boss with a ready attack", () => {
  const push=boot();
  push.eval([
    'game.state="PLAYING";game.stageMode="WAVE";spawnBoss();game.boss.active=true;',
    'game.boss.x=1010;game.boss.y=480;game.boss.targetX=1040;',
    'Math.random=()=>.19;',
    'addPlayerShot(700,480,1500,0,9,1.15,"#abb3c0",{grayImpact:true});updatePlayerBullets(.25);'
  ].join("\n"));
  assert.equal(push.eval("game.boss.targetX"),1140);
  assert.equal(push.eval("game.boss.x"),1110);
  const stun=boot();
  stun.eval([
    'game.state="PLAYING";game.stageMode="WAVE";spawnBoss();game.boss.active=true;',
    'game.boss.x=1010;game.boss.y=480;game.boss.targetX=1040;game.boss.shoot=0;',
    'Math.random=()=>.22;',
    'addPlayerShot(700,480,1500,0,9,1.15,"#abb3c0",{grayImpact:true});updatePlayerBullets(.25);'
  ].join("\n"));
  assert.equal(stun.eval("game.boss.grayStunRemaining"),0.5);
  stun.eval("updateBoss(.25)");
  assert.equal(stun.eval("game.boss.x"),1010);
  assert.equal(stun.eval("game.boss.y"),480);
  assert.equal(stun.eval("game.enemyBullets.length"),0);
  stun.eval("updateBoss(.25)");
  assert.equal(stun.eval("game.enemyBullets.length"),0);
  stun.eval("updateBoss(.1)");
  assert.ok(stun.eval("game.boss.t")>0);
});

test("GRAY bullet retains its on-hit effect after player switches to another weapon", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;',
    'game.weaponType="gray";game.redWeapon.stars=3;Math.random=()=>.22;',
    'game.enemies=[{kind:"scout",x:450,y:480,r:28,hp:30,maxHp:30,score:40,color:"#fff",core:"#eee"}];',
    'firePlayerWeapons();collectPowerup({type:"P_RED",x:250,y:480,life:1});updatePlayerBullets(.2);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"red");
  assert.equal(app.eval("game.redWeapon.stars"),3);
  assert.equal(app.eval("game.enemies[0].grayStunRemaining"),0.5);
});

test("WHITE conduction 60% can propagate its second hop but not repeat victims", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;Math.random=()=>.2;',
    'game.enemies=[',
    ' {kind:"scout",x:400,y:480,r:20,hp:50,maxHp:50,score:30,color:"#fff",core:"#eee"},',
    ' {kind:"scout",x:770,y:480,r:20,hp:50,maxHp:50,score:30,color:"#fff",core:"#eee"},',
    ' {kind:"scout",x:1140,y:480,r:20,hp:50,maxHp:50,score:30,color:"#fff",core:"#eee"}',
    '];addPlayerShot(300,480,1100,0,9,1.15,"#fff",whiteRules.createShot());updatePlayerBullets(.1);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.85)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-49.31)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[2].hp")-49.31)<1e-8);
  assert.equal(app.eval("game.bullets[0].hitEnemies.length"),3);
  assert.equal(app.eval("game.electricArcs.length"),3);
  assert.equal(app.eval("game.electricArcs[2].fromX"),770);
});

test("WHITE conditional third hop cannot propagate a fourth time", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;Math.random=()=>0;',
    'game.enemies=[400,770,1140,1510,1880].map(x=>(',
    ' {kind:"scout",x,y:480,r:20,hp:50,maxHp:50,score:30,color:"#fff",core:"#eee"}));',
    'addPlayerShot(300,480,1100,0,9,1.15,"#fff",whiteRules.createShot());updatePlayerBullets(.1);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets[0].hitEnemies.length"),4);
  for(let i=1;i<=3;i++){
    assert.ok(Math.abs(app.eval("game.enemies["+i+"].hp")-49.31)<1e-8);
  }
  assert.equal(app.eval("game.enemies[4].hp"),50);
  assert.equal(app.eval("game.electricArcs.length"),4);
  assert.equal(app.eval("game.electricArcs[3].fromX"),1140);
});

test("GRAY stun label disappears on expiration and stun time freezes during pause", () => {
  const app=boot();
  const visual=app.eval([
    '(() => {',
    'game.state="PLAYING";const e=spawnEnemyOfKind("scout",550,470,{vx:0,vy:0});',
    'const labels=[];ctx.fillText=(text)=>labels.push(String(text));',
    'drawEnemy(e);const before=labels.filter(s=>s==="STUN").length;',
    'grayRules.apply(e,.22);drawEnemy(e);',
    'return {before,after:labels.filter(s=>s==="STUN").length};',
    '})()'
  ].join("\n"));
  assert.equal(visual.before,0);
  assert.equal(visual.after,1);
  app.eval("game.state='PAUSED';updatePlaying(3)");
  assert.equal(app.eval("game.enemies[0].grayStunRemaining"),0.5);
  app.eval("game.state='PLAYING';game.stageMode='TRANSITION';game.transition=20;updatePlaying(3)");
  assert.equal(app.eval("game.enemies[0].grayStunRemaining"),0.5);
  app.eval("game.stageMode='WAVE';updateEnemies(1)");
  assert.equal(app.eval("game.enemies[0].grayStunRemaining"),0);
});


test("GRAY 75% amplified hit deals exactly 1.5x damage to a normal enemy, with no knockback or stun", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;Math.random=()=>.25;',
    'game.enemies=[{kind:"scout",x:410,y:480,r:25,hp:40,maxHp:40,',
    'score:40,color:"#fff",core:"#eee",vx:-100,vy:0,shootCd:2,shootBase:2,t:0,wave:0}];',
    'addPlayerShot(300,480,1100,0,9,1.15,"#abb3c0",{grayImpact:true});',
    'updatePlayerBullets(.12);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp") - (40 - 1.15 * 1.5)) < 1e-9);
  assert.equal(app.eval("game.enemies[0].x"), 410);
  assert.equal(app.eval("game.enemies[0].grayStunRemaining"), undefined);
  assert.equal(app.eval("game.bullets.length"), 0);
});

test("GRAY amplified hit applies 1.5x to frontal shield rather than bypassing it", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.player.x=180;game.player.y=480;Math.random=()=>.999;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",x:400,y:480,r:39,',
    'hp:10,maxHp:10,score:50,color:"#aaf",core:"#fff"})];',
    'addPlayerShot(280,480,1100,0,9,1.15,"#abb3c0",{grayImpact:true});',
    'updatePlayerBullets(.11);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].shieldMax - game.enemies[0].shieldHp") - 1.15 * 1.5) < 1e-9);
  assert.equal(app.eval("game.enemies[0].hp"), 10);
  assert.equal(app.eval("game.enemies[0].x"), 400);
  assert.equal(app.eval("grayRules.isStunned(game.enemies[0])"), false);
});

test("GRAY amplified hit applies 1.5x to the Boss hull without control effects", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;Math.random=()=>.8;',
    'game.boss={active:true,x:1010,y:480,rx:100,ry:80,hp:100,maxHp:100,',
    'parts:[],color:"#fff",core:"#fff"};',
    'addPlayerShot(700,480,1500,0,9,1.15,"#abb3c0",{grayImpact:true});',
    'updatePlayerBullets(.25);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.boss.hp") - (100 - 1.15 * 1.5)) < 1e-9);
  assert.equal(app.eval("game.boss.x"), 1010);
  assert.equal(app.eval("grayRules.isStunned(game.boss)"), false);
});

test("GRAY amplified hit multiplies Boss turret damage before weak-point scaling", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";Math.random=()=>.5;spawnBoss();',
    'game.boss.active=true;game.boss.x=1010;game.boss.y=480;',
    'const part=game.boss.parts[0];',
    'const px=game.boss.x+part.x, py=game.boss.y+part.y;',
    'addPlayerShot(px-160,py,1200,0,9,1.15,"#abb3c0",{grayImpact:true});',
    'updatePlayerBullets(.15);'
  ].join("\n"));
  const partLoss = app.eval("game.boss.parts[0].maxHp - game.boss.parts[0].hp");
  assert.ok(Math.abs(partLoss - 1.15 * 1.5 * bossParts.BALANCE.weakPointDamageScale) < 1e-9);
  assert.equal(app.eval("game.boss.hp"), app.eval("game.boss.maxHp"));
  assert.equal(app.eval("grayRules.isStunned(game.boss)"), false);
});

test("GRAY-only multiplier leaves untagged projectiles at normal base damage", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;Math.random=()=>.9;',
    'game.enemies=[{kind:"scout",x:410,y:480,r:25,hp:40,maxHp:40,',
    'score:40,color:"#fff",core:"#eee"}];',
    'addPlayerShot(300,480,1100,0,9,1.15,"#38e8ff");',
    'updatePlayerBullets(.12);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp") - (40 - 1.15)) < 1e-9);
  assert.equal(app.eval("game.enemies[0].grayStunRemaining"), undefined);
});


test("GRAY fires five dual-bullet volleys then rests for 0.4s before resuming", () => {
  const app=boot();
  app.eval('game.state="PLAYING";game.stageMode="WAVE";game.weaponType="gray";game.spawnTimer=999;game.formationTimer=999;game.invuln=99;keys.Space=true');
  for(let i=1;i<=4;i++){
    app.eval("game.fireCooldown=0;updatePlaying(.001)");
    assert.equal(app.eval("game.grayWeapon.volleys"),i);
    assert.ok(Math.abs(app.eval("game.fireCooldown-getFireCooldown()"))<1e-9);
  }
  app.eval("game.fireCooldown=0;updatePlaying(.001)");
  assert.equal(app.eval("game.grayWeapon.volleys"),0);
  assert.equal(app.eval("game.fireCooldown"),0.4);
  assert.equal(app.eval("game.bullets.filter(b=>b.grayImpact).length"),10);
  app.eval("updatePlaying(.2);updatePlaying(.199)");
  assert.equal(app.eval("game.grayWeapon.volleys"),0);
  assert.equal(app.eval("game.bullets.filter(b=>b.grayImpact).length"),10);
  app.eval("updatePlaying(.002)");
  assert.equal(app.eval("game.grayWeapon.volleys"),1);
  assert.ok(Math.abs(app.eval("game.fireCooldown-getFireCooldown()"))<1e-9);
  assert.equal(app.eval("game.bullets.filter(b=>b.grayImpact).length"),12);
});

test("GRAY 0.4s burst rest freezes during pause", () => {
  const app=boot();
  app.eval('game.state="PLAYING";game.stageMode="WAVE";game.weaponType="gray";game.spawnTimer=999;game.formationTimer=999;keys.Space=true');
  for(let i=0;i<5;i++)app.eval("game.fireCooldown=0;updatePlaying(.001)");
  assert.equal(app.eval("game.fireCooldown"),0.4);
  app.eval('game.state="PAUSED";updatePlaying(2)');
  assert.equal(app.eval("game.fireCooldown"),0.4);
  assert.equal(app.eval("game.grayWeapon.volleys"),0);
});

test("recollecting GRAY keeps burst streak; switching weapons resets it without losing RED stars", () => {
  const app=boot();
  app.eval('game.state="PLAYING";game.stageMode="WAVE";game.weaponType="gray";game.spawnTimer=999;game.formationTimer=999;game.redWeapon.stars=4;keys.Space=true');
  for(let i=0;i<3;i++)app.eval("game.fireCooldown=0;updatePlaying(.001)");
  assert.equal(app.eval("game.grayWeapon.volleys"),3);
  app.eval('collectPowerup({type:"P_GRAY",x:500,y:480,life:1})');
  assert.equal(app.eval("game.grayWeapon.volleys"),3);
  app.eval('collectPowerup({type:"P_BLUE",x:500,y:480,life:1})');
  assert.equal(app.eval("game.grayWeapon.volleys"),0);
  assert.equal(app.eval("game.redWeapon.stars"),4);
  assert.ok(Math.abs(app.eval("getFireCooldown() - Math.max(.07,.115-game.weaponLevel*.014)"))<1e-9);
  app.eval('collectPowerup({type:"P_GRAY",x:500,y:480,life:1})');
  assert.equal(app.eval("game.grayWeapon.volleys"),0);
  app.eval("updatePlaying(.001)");
  assert.equal(app.eval("game.grayWeapon.volleys"),1);
  assert.ok(Math.abs(app.eval("game.fireCooldown-getFireCooldown()"))<1e-9);
});

test("GRAY burst counters never affect RED star progression or PURPLE shooting cadence", () => {
  const app=boot();
  app.eval('game.state="PLAYING";game.stageMode="WAVE";game.weaponType="gray";game.redWeapon.stars=2;game.redWeapon.volleys=3;game.spawnTimer=999;game.formationTimer=999;keys.Space=true');
  for(let i=0;i<5;i++)app.eval("game.fireCooldown=0;updatePlaying(.001)");
  assert.equal(app.eval("game.grayWeapon.volleys"),0);
  assert.equal(app.eval("game.redWeapon.volleys"),3);
  assert.equal(app.eval("game.redWeapon.stars"),2);
  app.eval('collectPowerup({type:"P_PURPLE",x:500,y:480,life:1})');
  assert.equal(app.eval("game.grayWeapon.volleys"),0);
  assert.ok(Math.abs(app.eval("getFireCooldown() - Math.max(.10,.145-game.weaponLevel*.012)"))<1e-9);
  assert.equal(app.eval("game.redWeapon.stars"),2);
});


test("PINK P is the ninth pickup: one guided bolt at every level, with distinct HUD and recovery drop", () => {
  const app = boot();
  app.eval('game.state="PLAYING";game.weaponType="blue";game.weaponLevel=1;firePlayerWeapons()');
  const baseDamage = app.eval("game.bullets[0].power");
  app.eval('game.bullets=[];collectPowerup({type:"P_PINK",x:350,y:480,life:1});game.weaponLevel=3;firePlayerWeapons()');
  assert.equal(app.eval("game.weaponType"), "pink");
  assert.equal(app.eval("weaponMeta().name"), "SEEKER");
  assert.equal(app.eval("game.bullets.length"), 1);
  assert.equal(app.eval("game.bullets[0].pinkHoming"), true);
  assert.equal(app.eval("game.bullets[0].vy"), 0);
  assert.equal(app.eval("game.bullets[0].power"), baseDamage);
  assert.equal(app.eval("game.bullets[0].life"), pinkWeapon.RULES.bulletLifetimeSeconds);
  assert.equal(app.eval("game.missiles.length"), 0);
  assert.ok(Math.abs(app.eval("getFireCooldown()") - 0.101) < 1e-10);
  app.eval("Math.random=()=>.65");
  assert.equal(app.eval("randomPowerType()"), "P_PINK");
  app.eval("game.powerups=[];dropPlayerPowerOnHit()");
  assert.equal(app.eval("game.powerups.at(-1).type"), "P_PINK");
  const labels = app.eval([
    '(() => {',
    'const text=[];ctx.fillText=(s)=>text.push(String(s));drawHud();return text;',
    '})()'
  ].join("\n"));
  assert.ok(labels.includes("PINK SEEK  2/.4S  15%x25"));
  app.eval("drawPlayerBullets(); drawPowerups()");
});

test("PINK main-loop firing always emits one bolt and rests 0.4s after every second firing action", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="pink";',
    'game.invuln=100;game.spawnTimer=999;game.formationTimer=999;',
    'keys.Space=true;Math.random=()=>.99;',
    'updatePlaying(.001);'
  ].join("\n"));
  assert.equal(app.eval("game.pinkWeapon.volleys"), 1);
  assert.equal(app.eval("game.bullets.filter(b=>b.pinkHoming).length"), 1);
  assert.ok(Math.abs(app.eval("game.fireCooldown") - 0.101) < 1e-10);
  app.eval("game.fireCooldown=0;updatePlaying(.001)");
  assert.equal(app.eval("game.pinkWeapon.volleys"), 0);
  assert.equal(app.eval("game.fireCooldown"), 0.4);
  assert.equal(app.eval("game.bullets.filter(b=>b.pinkHoming).length"), 2);
  assert.equal(app.eval("game.missiles.length"), 0);
  app.eval("updatePlaying(.2);updatePlaying(.199)");
  assert.equal(app.eval("game.pinkWeapon.volleys"), 0);
  assert.equal(app.eval("game.bullets.filter(b=>b.pinkHoming).length"), 2);
  app.eval("updatePlaying(.002)");
  assert.equal(app.eval("game.pinkWeapon.volleys"), 1);
  assert.equal(app.eval("game.bullets.filter(b=>b.pinkHoming).length"), 3);
  assert.ok(Math.abs(app.eval("game.fireCooldown") - 0.101) < 1e-10);
});

test("PINK 15% proc adds exactly one 25x homing missile to one regular shot", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="pink";',
    'game.invuln=100;game.spawnTimer=999;game.formationTimer=999;',
    'keys.Space=true;Math.random=()=>.149999;',
    'updatePlaying(.001);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"), 1);
  assert.equal(app.eval("game.missiles.length"), 1);
  assert.equal(app.eval("game.missiles[0].pinkSpecial"), true);
  assert.equal(app.eval("game.missiles[0].power/game.bullets[0].power"), 25);
  assert.equal(app.eval("game.missiles[0].r"), pinkWeapon.RULES.specialMissileSize / 2);
  assert.ok(Math.abs(app.eval("game.missiles[0].life") - 4.599) < 1e-9); // Same frame advances the missile by 0.001s.
  assert.equal(app.eval("game.pinkWeapon.volleys"), 1);
  app.eval("Math.random=()=>.15;game.fireCooldown=0;updatePlaying(.001)");
  assert.equal(app.eval("game.bullets.length"), 2);
  assert.equal(app.eval("game.missiles.length"), 1);
  assert.equal(app.eval("game.pinkWeapon.volleys"), 0);
  assert.equal(app.eval("game.fireCooldown"), 0.4);
  app.eval("drawMissiles();drawPlayerBullets()");
});

test("PINK special missile probability upgrade triggers in the former 10%-15% band", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="pink";',
    'game.invuln=100;game.spawnTimer=999;game.formationTimer=999;',
    'keys.Space=true;Math.random=()=>0.125;updatePlaying(.001);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"), 1);
  assert.equal(app.eval("game.missiles.length"), 1);
  assert.equal(app.eval("game.missiles[0].pinkSpecial"), true);
  assert.equal(app.eval("game.missiles[0].power / game.bullets[0].power"), 25);
  assert.equal(app.eval("game.pinkWeapon.volleys"), 1);
});

test("PINK rocket's 25x damage ratio survives Overdrive and does not become a blue lance", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="pink";',
    'game.spawnTimer=999;game.formationTimer=999;',
    'game.combat.energy=100;activateOverdrive();keys.Space=true;',
    'Math.random=()=>0;updatePlaying(.001);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"), 1);
  assert.equal(app.eval("game.bullets[0].lance"), undefined);
  assert.equal(app.eval("game.missiles.length"), 1);
  assert.ok(app.eval("game.bullets[0].power") > 1.15);
  assert.ok(Math.abs(app.eval("game.missiles[0].power/game.bullets[0].power") - 25) < 1e-9);
});

test("PINK guided bolt homes toward enemies, reacquires after destruction, and preserves swept collisions", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="pink";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:700,y:200,r:25,hp:30,maxHp:30,score:30,color:"#fff",core:"#eee"}];',
    'firePlayerWeapons();updatePlayerBullets(.05);'
  ].join("\n"));
  const turning = app.eval("game.bullets[0].vy");
  assert.ok(turning < 0);
  assert.ok(Math.abs(app.eval("Math.hypot(game.bullets[0].vx,game.bullets[0].vy)") - 940) < 1e-7);
  app.eval("game.enemies[0].hp=0;updatePlayerBullets(.05)");
  assert.ok(Math.abs(app.eval("game.bullets[0].vy") - turning) < 1e-8);
  app.eval('game.enemies=[{kind:"scout",x:730,y:850,r:25,hp:30,maxHp:30,score:30,color:"#fff",core:"#eee"}];updatePlayerBullets(.05)');
  assert.ok(app.eval("game.bullets[0].vy") > turning);

  // Target directly on the swept horizontal segment gets hit even for big dt.
  app.eval([
    'game.bullets=[];game.enemies=[{kind:"scout",x:420,y:480,r:22,hp:50,maxHp:50,',
    'score:30,color:"#fff",core:"#eee"}];firePlayerWeapons();updatePlayerBullets(.25);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp") - 48.85) < 1e-9);
  assert.equal(app.eval("game.bullets.length"), 0);
});

test("PINK bullet can home in on active Boss but ignores inactive Boss and expires after 3.6s", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="pink";game.player.x=175;game.player.y=480;',
    'game.boss={x:750,y:200,rx:100,ry:80,active:false,hp:100,maxHp:100,parts:[]};',
    'firePlayerWeapons();updatePlayerBullets(.05);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets[0].vy"), 0);
  app.eval("game.boss.active=true;updatePlayerBullets(.05)");
  assert.ok(app.eval("game.bullets[0].vy") < 0);
  app.eval('game.boss.active=false;game.bullets[0].life=.02;updatePlayerBullets(.03)');
  assert.equal(app.eval("game.bullets.length"), 0);
});

test("PINK bonus missile shares missile homing, swept enemy collision and kill economics", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="pink";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:465,y:470,r:35,hp:20,maxHp:20,score:50,',
    'color:"#fff",core:"#eee",vx:0,vy:0}];',
    'firePlayerWeapons(true);updateMissiles(.45);'
  ].join("\n"));
  assert.equal(app.eval("game.missiles.length"), 0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp") - (-8.75)) < 1e-8);
  assert.equal(app.eval("game.stats.kills"), 1);
});

test("PINK special missile does not bypass a shield and keeps Boss turret priority", () => {
  const shield = boot();
  shield.eval([
    'game.state="PLAYING";game.weaponType="pink";',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",x:470,y:480,r:39,',
    'hp:50,maxHp:50,score:50,color:"#aaf",core:"#fff"})];',
    'addMissile(350,480,1,28.75,{pinkSpecial:true});updateMissiles(.22);'
  ].join("\n"));
  assert.ok(shield.eval("game.enemies[0].shieldHp") < shield.eval("game.enemies[0].shieldMax"));
  assert.ok(shield.eval("game.enemies[0].hp") <= 50);
  assert.equal(shield.eval("game.missiles.length"), 0);

  const boss = boot();
  boss.eval([
    'game.state="PLAYING";game.stageMode="WAVE";spawnBoss();game.boss.active=true;',
    'game.boss.x=1010;game.boss.y=480;',
    'const turret=game.boss.parts[0];turret.hp=100;turret.maxHp=100;',
    'const tx=game.boss.x+turret.x,ty=game.boss.y+turret.y;',
    'addMissile(tx-30,ty,1,28.75,{pinkSpecial:true});updateMissiles(.04);'
  ].join("\n"));
  assert.ok(Math.abs(boss.eval("game.boss.parts[0].hp") - (100 - 28.75*bossParts.BALANCE.weakPointDamageScale)) < 1e-8);
  assert.equal(boss.eval("game.boss.hp"), boss.eval("game.boss.maxHp"));
  assert.equal(boss.eval("game.missiles.length"), 0);
});

test("PINK missile damages Boss hull at twenty-five times direct pink bullet power", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.player.x=175;game.player.y=480;',
    'game.boss={active:true,x:520,y:480,rx:100,ry:80,hp:100,maxHp:100,color:"#fff",parts:[]};',
    'game.weaponType="pink";firePlayerWeapons(true);updateMissiles(.45);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.boss.hp") - 71.25) < 1e-8);
  assert.equal(app.eval("game.missiles.length"), 0);
});

test("PINK rest freezes while paused, missile/bullet persist after switching, and the streak resets", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="pink";',
    'game.spawnTimer=999;game.formationTimer=999;game.redWeapon.stars=3;',
    'game.player.y=480;keys.Space=true;Math.random=()=>0;',
    'updatePlaying(.001);game.fireCooldown=0;updatePlaying(.001);'
  ].join("\n"));
  assert.equal(app.eval("game.fireCooldown"), 0.4);
  assert.equal(app.eval("game.pinkWeapon.volleys"), 0);
  assert.equal(app.eval("game.bullets.length"), 2);
  assert.equal(app.eval("game.missiles.length"), 2);
  const beforeX = app.eval("game.missiles[0].x");
  const bulletX = app.eval("game.bullets[0].x");
  app.eval('game.state="PAUSED";updatePlaying(2)');
  assert.equal(app.eval("game.missiles[0].x"), beforeX);
  assert.equal(app.eval("game.bullets[0].x"), bulletX);
  assert.equal(app.eval("game.fireCooldown"), 0.4);
  app.eval('game.state="PLAYING";keys.Space=false;collectPowerup({type:"P_GREEN",x:350,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"), "green");
  assert.equal(app.eval("game.pinkWeapon.volleys"), 0);
  assert.equal(app.eval("game.redWeapon.stars"), 3);
  app.eval("updatePlayerBullets(.04);updateMissiles(.04)");
  assert.ok(app.eval("game.bullets.every(b=>b.pinkHoming)"));
  assert.ok(app.eval("game.missiles.every(m=>m.pinkSpecial)"));
  assert.ok(app.eval("game.missiles[0].x") > beforeX);
  app.eval('collectPowerup({type:"P_PINK",x:350,y:480,life:1})');
  assert.equal(app.eval("game.pinkWeapon.volleys"), 0);
});

test("PINK bonus missile respects the existing 48 missile pool cap", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="pink";',
    'game.spawnTimer=999;game.formationTimer=999;keys.Space=true;',
    'for(let i=0;i<48;i++)addMissile(120,480,1,2);',
    'Math.random=()=>0;updatePlaying(.001);'
  ].join("\n"));
  assert.equal(app.eval("game.missiles.length"), 48);
  assert.equal(app.eval("game.bullets.filter(b=>b.pinkHoming).length"), 1);
  assert.equal(app.eval("game.pinkWeapon.volleys"), 1);
});


test("PINK black special missile is 100 game units across; YELLOW missiles retain their original size", () => {
  const app=boot();
  app.eval('game.state="PLAYING";addMissile(210,480,1,28.75,{pinkSpecial:true});addMissile(220,500,1,2)');
  assert.equal(app.eval("game.missiles[0].r"),50);
  assert.equal(app.eval("game.missiles[1].r"),14);
  assert.equal(app.eval("game.missiles[0].power"),28.75);
  assert.equal(app.eval("game.missiles[1].power"),2);
  const visuals=app.eval([
    '(() => {',
    'const fills=[],strokes=[],rectangles=[];',
    'ctx.fill=()=>fills.push(ctx.fillStyle);',
    'ctx.stroke=()=>strokes.push(ctx.strokeStyle);',
    'ctx.fillRect=(x,y,w,h)=>rectangles.push([x,y,w,h,ctx.fillStyle]);',
    'drawMissiles();',
    'return {fills,strokes,rectangles};',
    '})()'
  ].join("\n"));
  assert.ok(visuals.fills.includes("#030306")); // The missile body is BLACK.
  assert.ok(visuals.strokes.includes("#ff89d2")); // Pink trim stays visible on black space.
  assert.ok(visuals.rectangles.some(r=>r[0]===-44 && r[1]===-50 && r[2]===24 && r[3]===28));
  assert.ok(visuals.rectangles.some(r=>r[0]===-44 && r[1]===22 && r[2]===24 && r[3]===28));
});

test("PINK missile deals 25x to directly struck enemy, 1x to nearby others and nearby Boss hull", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=180;game.player.y=480;',
    'game.enemies=[',
    ' {kind:"scout",x:490,y:480,r:25,hp:50,maxHp:50,score:30,color:"#fff",core:"#eee"},',
    ' {kind:"scout",x:795,y:480,r:25,hp:50,maxHp:50,score:30,color:"#fff",core:"#eee"},',
    ' {kind:"scout",x:900,y:480,r:25,hp:50,maxHp:50,score:30,color:"#fff",core:"#eee"}',
    '];game.boss={active:true,x:735,y:480,rx:90,ry:85,hp:100,maxHp:100,parts:[],color:"#fff"};',
    'addMissile(350,480,1,28.75,{pinkSpecial:true});updateMissiles(.15);'
  ].join("\n"));
  assert.equal(app.eval("game.missiles.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp") - 21.25) < 1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp") - 48.85) < 1e-8);
  assert.equal(app.eval("game.enemies[2].hp"),50);
  assert.ok(Math.abs(app.eval("game.boss.hp") - 98.85) < 1e-8);
  assert.equal(app.eval("game.pinkExplosions.length"),1);
  assert.ok(app.eval("game.pinkExplosions[0].x") > 350);
  assert.equal(app.eval("game.pinkExplosions[0].life"),pinkWeapon.RULES.explosionLifetimeSeconds);
});

test("PINK explosion uses shield absorption for secondary hits instead of bypassing shield", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=180;game.player.y=480;',
    'game.enemies=[',
    ' {kind:"scout",x:490,y:480,r:25,hp:50,maxHp:50,score:30,color:"#fff",core:"#eee"},',
    ' enemyBehaviors.initializeEnemy({kind:"shield",x:730,y:480,r:39,hp:30,maxHp:30,',
    '  score:60,color:"#aaf",core:"#fff"})',
    '];addMissile(350,480,1,28.75,{pinkSpecial:true});updateMissiles(.15);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[1].shieldMax - game.enemies[1].shieldHp") - 1.15)<1e-8);
  assert.equal(app.eval("game.enemies[1].hp"),30);
  assert.equal(app.eval("game.enemies[0].hp"),21.25);
});

test("PINK missile directly hitting the Boss hull splashes other enemies without double-damaging Boss", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=180;game.player.y=480;',
    'game.boss={active:true,x:540,y:480,rx:100,ry:80,hp:100,maxHp:100,parts:[],color:"#fff"};',
    'game.enemies=[{kind:"scout",x:750,y:640,r:25,hp:50,maxHp:50,',
    'score:30,color:"#fff",core:"#eee"}];',
    'addMissile(350,480,1,28.75,{pinkSpecial:true});updateMissiles(.20);'
  ].join("\n"));
  assert.equal(app.eval("game.missiles.length"),0);
  assert.ok(Math.abs(app.eval("game.boss.hp") - 71.25) < 1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp") - 48.85) < 1e-8);
  assert.equal(app.eval("game.pinkExplosions.length"),1);
});

test("PINK missile striking Boss turret maintains turret priority and only other enemies take blast", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=180;',
    'spawnBoss();game.boss.active=true;game.boss.x=1010;game.boss.y=480;',
    'const turret=game.boss.parts[0];turret.hp=100;turret.maxHp=100;',
    'const tx=game.boss.x+turret.x,ty=game.boss.y+turret.y;',
    'game.enemies=[{kind:"scout",x:tx,y:ty+130,r:25,hp:50,maxHp:50,',
    'score:30,color:"#fff",core:"#eee"}];',
    'addMissile(tx-30,ty,1,28.75,{pinkSpecial:true});updateMissiles(.04);'
  ].join("\n"));
  assert.equal(app.eval("game.missiles.length"),0);
  assert.ok(Math.abs(app.eval("game.boss.parts[0].hp")-(100-28.75*bossParts.BALANCE.weakPointDamageScale))<1e-8);
  assert.equal(app.eval("game.boss.hp"),app.eval("game.boss.maxHp"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.85)<1e-8);
});

test("PINK rocket detonation cannot splash newly split minions spawned by its 25x kill", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=180;',
    'game.enemies=[{kind:"splitter",x:490,y:480,r:35,hp:1,maxHp:1,',
    'score:60,color:"#fff",core:"#eee"}];',
    'addMissile(350,480,1,28.75,{pinkSpecial:true});updateMissiles(.15);'
  ].join("\n"));
  assert.equal(app.eval("game.stats.kills"),1);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).length"),2);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).every(e=>e.hp===e.maxHp)"),true);
  assert.equal(app.eval("game.pinkExplosions.length"),1);
});

test("PINK explosion FX have exact GREEN halo radius, are capped and expire without damage", () => {
  const app=boot();
  app.eval('for(let i=0;i<35;i++)addPinkExplosion(400+i,480);');
  assert.equal(app.eval("game.pinkExplosions.length"),pinkWeapon.RULES.maxExplosionEffects);
  assert.equal(app.eval("game.pinkExplosions[0].x"),423);
  const drawn=app.eval([
    '(() => {',
    'const arcs=[],strokes=[];',
    'ctx.arc=(x,y,r)=>arcs.push(r);ctx.stroke=()=>strokes.push(ctx.strokeStyle);',
    'game.pinkExplosions[0].life=.2;drawPinkExplosions();',
    'return {arcs,strokes};',
    '})()'
  ].join("\n"));
  assert.ok(drawn.arcs.includes(greenWeapon.RULES.radius));
  assert.ok(drawn.strokes.includes("#ff82ce"));
  assert.equal(app.eval("game.pinkExplosions.length"),12);
  app.eval('game.state="PAUSED";updatePlaying(2)');
  assert.equal(app.eval("game.pinkExplosions[1].life"),pinkWeapon.RULES.explosionLifetimeSeconds);
  app.eval('updateParticles(.6)');
  assert.equal(app.eval("game.pinkExplosions.length"),0);
});

test("non-PINK YELLOW missile keeps original 14-unit radius and causes no area blast", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=180;',
    'game.enemies=[',
    ' {kind:"scout",x:490,y:480,r:25,hp:50,maxHp:50,score:30,color:"#fff",core:"#eee"},',
    ' {kind:"scout",x:720,y:480,r:25,hp:50,maxHp:50,score:30,color:"#fff",core:"#eee"}',
    '];addMissile(350,480,1,2);updateMissiles(.30);'
  ].join("\n"));
  assert.equal(app.eval("game.missiles.length"),0);
  assert.equal(app.eval("game.pinkExplosions.length"),0);
  assert.equal(app.eval("game.enemies[1].hp"),50);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48)<1e-8);
});


test("ORANGE P is the tenth pickup; two starter-grade shots and its HUD survive any level", () => {
  const app = boot();
  app.eval('game.state="PLAYING";game.weaponType="blue";game.weaponLevel=1;firePlayerWeapons()');
  const blue = app.eval('JSON.stringify(game.bullets.map(b=>({vx:b.vx,vy:b.vy,r:b.r,power:b.power})))');
  app.eval('game.bullets=[];collectPowerup({type:"P_ORANGE",x:300,y:480,life:1});game.weaponLevel=3;firePlayerWeapons()');
  assert.equal(app.eval("game.weaponType"),"orange");
  assert.equal(app.eval("weaponMeta().name"),"BURST");
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval('game.bullets.every(b=>b.orangeBlast && b.c==="#ff932e")'),true);
  assert.equal(app.eval('JSON.stringify(game.bullets.map(b=>({vx:b.vx,vy:b.vy,r:b.r,power:b.power})))'),blue);
  assert.ok(Math.abs(app.eval("getFireCooldown()")-.101)<1e-10);
  assert.equal(app.eval("game.missiles.length"),0);
  app.eval("Math.random=()=>.73");
  assert.equal(app.eval("randomPowerType()"),"P_ORANGE");
  app.eval('game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval('game.powerups.at(-1).type'),"P_ORANGE");
  const labels=app.eval([
    '(() => {const values=[];ctx.fillText=(label)=>values.push(String(label));',
    'drawHud();drawPowerups();drawPlayerBullets();return values})()'
  ].join("\n"));
  assert.ok(labels.includes("ORANGE BLAST  R100  X3"));
});

test("ORANGE shot detonates at first swept contact, 3x damage to direct and nearby, no 1x extra", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=180;',
    'game.enemies=[',
    '{kind:"scout",x:400,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:480,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:620,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}',
    '];addPlayerShot(300,480,1100,0,9,1.15,"#ff932e",{orangeBlast:true});',
    'updatePlayerBullets(.32);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-46.55)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-46.55)<1e-8);
  assert.equal(app.eval("game.enemies[2].hp"),50);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
  assert.ok(Math.abs(app.eval("game.orangeExplosions[0].x")-371)<1e-8);
  assert.equal(app.eval("game.orangeExplosions[0].y"),480);
  assert.equal(app.eval("game.orangeExplosions[0].life"),orangeWeapon.RULES.explosionLifetimeSeconds);
});

test("ORANGE explosion affects an exact-radius edge target but not a target 1 unit farther", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=180;',
    'game.enemies=[',
    '{kind:"scout",x:400,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:491,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:492,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}',
    '];addPlayerShot(300,480,1100,0,9,1.15,"#ff932e",{orangeBlast:true});',
    'updatePlayerBullets(.25);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-46.55)<1e-8);
  assert.equal(app.eval("game.enemies[2].hp"),50);
});

test("ORANGE splash damages a nearby Boss hull once when the direct target is another enemy", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=180;',
    'game.enemies=[{kind:"scout",x:400,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}];',
    'game.boss={active:true,x:620,y:480,rx:150,ry:80,hp:100,maxHp:100,parts:[],color:"#fff"};',
    'addPlayerShot(300,480,1100,0,9,1.15,"#ff932e",{orangeBlast:true});',
    'updatePlayerBullets(.32);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-46.55)<1e-8);
  assert.ok(Math.abs(app.eval("game.boss.hp")-96.55)<1e-8);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
});

test("ORANGE directly hitting Boss hull does 3x once and hits nearby off-lane enemies", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=180;',
    'game.boss={active:true,x:600,y:480,rx:100,ry:80,hp:100,maxHp:100,parts:[],color:"#fff"};',
    'game.enemies=[{kind:"scout",x:530,y:575,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}];',
    'addPlayerShot(300,480,1100,0,9,1.15,"#ff932e",{orangeBlast:true});',
    'updatePlayerBullets(.32);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.boss.hp")-96.55)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-46.55)<1e-8);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
  assert.ok(Math.abs(app.eval("game.orangeExplosions[0].x")-491)<1e-8);
});

test("ORANGE Boss turret hit uses 3x base shot damage through weak point, not Boss hull", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=180;',
    'spawnBoss();game.boss.active=true;game.boss.x=1010;game.boss.y=480;',
    'const part=game.boss.parts[0];part.hp=100;part.maxHp=100;',
    'const tx=game.boss.x+part.x,ty=game.boss.y+part.y;',
    'game.enemies=[{kind:"scout",x:tx,y:ty+70,r:25,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}];',
    'addPlayerShot(tx-160,ty,1200,0,9,1.15,"#ff932e",{orangeBlast:true});',
    'updatePlayerBullets(.15);'
  ].join("\n"));
  const turretLoss=app.eval("game.boss.parts[0].maxHp-game.boss.parts[0].hp");
  assert.ok(Math.abs(turretLoss-1.15*3*bossParts.BALANCE.weakPointDamageScale)<1e-8);
  assert.equal(app.eval("game.boss.hp"),app.eval("game.boss.maxHp"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-46.55)<1e-8);
});

test("ORANGE shield absorbs 3x explosion damage with no extra direct hit", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=180;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",',
    'x:400,y:480,r:39,hp:20,maxHp:20,score:60,color:"#aaf",core:"#fff"}),',
    '{kind:"scout",x:450,y:530,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}];',
    'addPlayerShot(280,480,1100,0,9,1.15,"#ff932e",{orangeBlast:true});',
    'updatePlayerBullets(.22);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].shieldMax-game.enemies[0].shieldHp")-3.45)<1e-8);
  assert.equal(app.eval("game.enemies[0].hp"),20);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-46.55)<1e-8);
});

test("ORANGE killing a splitter does not hit its newly spawned children in the same blast", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=180;',
    'game.enemies=[{kind:"splitter",x:400,y:480,r:35,hp:1,maxHp:1,',
    'score:60,color:"#fff",core:"#eee"}];',
    'addPlayerShot(280,480,1100,0,9,1.15,"#ff932e",{orangeBlast:true});',
    'updatePlayerBullets(.22);'
  ].join("\n"));
  assert.equal(app.eval("game.stats.kills"),1);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).length"),2);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).every(e=>e.hp===e.maxHp)"),true);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
});

test("ORANGE projectile already in flight still detonates after switching weapons", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=180;',
    'game.enemies=[{kind:"scout",x:500,y:470,r:22,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}];',
    'game.weaponType="orange";firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'collectPowerup({type:"P_BLUE",x:250,y:480,life:1});',
    'updatePlayerBullets(.3);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-46.55)<1e-8);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
});

test("ORANGE blast FX draw at 100 radius, stay capped and expire only in active time", () => {
  const app=boot();
  app.eval('for(let i=0;i<75;i++)addOrangeExplosion(100+i,480)');
  assert.equal(app.eval("game.orangeExplosions.length"),orangeWeapon.RULES.maxExplosionEffects);
  assert.equal(app.eval("game.orangeExplosions[0].x"),127);
  const visuals=app.eval([
    '(() => { const radii=[],strokeColors=[];',
    'ctx.arc=(_x,_y,r)=>radii.push(r);ctx.stroke=()=>strokeColors.push(ctx.strokeStyle);',
    'drawOrangeExplosions();return {radii,strokeColors};})()'
  ].join("\n"));
  assert.ok(visuals.radii.includes(orangeWeapon.RULES.radius));
  assert.ok(visuals.strokeColors.includes("#ff9c39"));
  app.eval('game.state="PAUSED";updatePlaying(2)');
  assert.equal(app.eval("game.orangeExplosions[0].life"),orangeWeapon.RULES.explosionLifetimeSeconds);
  app.eval("updateParticles(.36)");
  assert.equal(app.eval("game.orangeExplosions.length"),0);
});

test("ORANGE hits never trigger PINK special rockets or GREEN aura and leave other guns unchanged", () => {
  const app=boot();
  app.eval('game.state="PLAYING";game.weaponType="orange";game.weaponLevel=3;game.redWeapon.stars=4;firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.missiles.length"),0);
  assert.equal(app.eval("game.redWeapon.stars"),4);
  assert.equal(app.eval("game.bullets.every(b=>b.orangeBlast && !b.pinkHoming && !b.blackSlow && !b.whiteConductive)"),true);
  app.eval('collectPowerup({type:"P_GREEN",x:350,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"green");
  assert.equal(app.eval("game.redWeapon.stars"),4);
  assert.equal(app.eval("game.orangeExplosions.length"),0);
});


test("PINK 25x impact against enemy still splashes only 1x into adjacent shield", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=180;',
    'game.enemies=[',
    ' {kind:"scout",x:490,y:480,r:25,hp:60,maxHp:60,score:30,color:"#fff",core:"#eee"},',
    ' enemyBehaviors.initializeEnemy({kind:"shield",x:730,y:480,r:39,',
    '  hp:40,maxHp:40,score:60,color:"#aaf",core:"#fff"})',
    '];addMissile(350,480,1,28.75,{pinkSpecial:true});updateMissiles(.15);'
  ].join("\n"));
  assert.equal(app.eval("game.missiles.length"), 0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp") - 31.25) < 1e-9);
  assert.ok(Math.abs(app.eval("game.enemies[1].shieldMax-game.enemies[1].shieldHp") - 1.15) < 1e-9);
  assert.equal(app.eval("game.enemies[1].hp"), 40);
  assert.equal(app.eval("game.pinkExplosions.length"), 1);
});

test("PINK 15% bonus special retains 25x power and tracking after switching to ORANGE P", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="pink";',
    'game.player.x=175;game.player.y=480;game.spawnTimer=999;',
    'game.formationTimer=999;keys.Space=true;Math.random=()=>0.125;',
    'updatePlaying(.001);keys.Space=false;',
    'collectPowerup({type:"P_ORANGE",x:350,y:480,life:1});'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"), "orange");
  assert.equal(app.eval("game.missiles.length"), 1);
  assert.equal(app.eval("game.missiles[0].pinkSpecial"), true);
  assert.ok(Math.abs(app.eval("game.missiles[0].power / game.bullets[0].power") - 25) < 1e-9);
  app.eval('game.enemies=[{kind:"scout",x:480,y:465,r:35,hp:100,maxHp:100,score:50,color:"#fff",core:"#eee"}];updateMissiles(.45)');
  assert.equal(app.eval("game.missiles.length"), 0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp") - 71.25) < 1e-8);
});


test("BROWN P is a recoverable eleventh pickup and never spawns ordinary bullets", () => {
  const app=boot();
  app.eval('game.state="PLAYING";game.weaponType="blue";game.bullets=[]');
  app.eval('collectPowerup({type:"P_BROWN",x:350,y:480,life:1});firePlayerWeapons()');
  assert.equal(app.eval("game.weaponType"),"brown");
  assert.equal(app.eval("weaponMeta().name"),"LOCK LASER");
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.length"),0);
  app.eval('game.weaponLevel=3;firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(Math.abs(app.eval("getFireCooldown()")-0.101)<1e-10);
  app.eval('Math.random=()=>.8');
  assert.equal(app.eval("randomPowerType()"),"P_BROWN");
  app.eval('game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_BROWN");
  const labels=app.eval('(() => {const labels=[];ctx.fillText=t=>labels.push(String(t));drawHud();drawPowerups();return labels;})()');
  assert.ok(labels.includes("BROWN LOCK LASER"));
});

test("BROWN laser auto-locks first enemy without penetrating a second enemy",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brown";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[',
    ' {kind:"scout",x:460,y:480,r:25,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:740,y:480,r:25,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"}',
    '];updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.brownBeam.kind"),"enemy");
  assert.equal(app.eval("game.brownBeam.x"),435);
  assert.equal(app.eval("game.brownBeam.startX"),235);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-9);
  assert.equal(app.eval("game.enemies[1].hp"),100);
  app.eval("updateBrownLaser(.202,true)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-96.55)<1e-8);
  assert.equal(app.eval("game.enemies[1].hp"),100);
});

test("BROWN laser can retarget after the nearest enemy dies and clears on FIRE release",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brown";',
    'game.enemies=[',
    ' {kind:"scout",x:460,y:480,r:20,hp:1,maxHp:1,score:30,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:740,y:480,r:20,hp:50,maxHp:50,score:30,color:"#fff",core:"#fff"}',
    '];updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp")<=0,true);
  app.eval("updateBrownLaser(.101,true)");
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-48.85)<1e-8);
  assert.equal(app.eval("game.brownBeam.target"),app.eval("game.enemies[1]"));
  app.eval("updateBrownLaser(.101,false)");
  assert.equal(app.eval("game.brownBeam"),null);
  assert.equal(app.eval("game.brownWeapon.elapsed"),0);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-48.85)<1e-8);
});

test("BROWN laser is genuinely continuous while FIRE held and deals no damage paused",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brown";',
    'game.spawnTimer=999;game.formationTimer=999;',
    'game.enemies=[{kind:"scout",x:540,y:480,r:30,hp:100,maxHp:100,',
    'score:30,color:"#fff",core:"#fff",vx:0,vy:0,t:0,wave:0,shootCd:99,shootBase:99}];',
    'keys.Space=true;updatePlaying(.06);updatePlaying(.05);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-8);
  const hp=app.eval("game.enemies[0].hp");
  app.eval('game.state="PAUSED";updatePlaying(2)');
  assert.equal(app.eval("game.enemies[0].hp"),hp);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";updatePlaying(.5)');
  assert.equal(app.eval("game.enemies[0].hp"),hp);
});

test("BROWN laser hits frontal shield normally rather than bypassing the shield",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="brown";',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",x:460,y:480,',
    'r:39,hp:40,maxHp:40,score:30,color:"#fff",core:"#fff"})];',
    'updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].shieldMax-game.enemies[0].shieldHp")-1.15)<1e-9);
  assert.equal(app.eval("game.enemies[0].hp"),40);
  assert.equal(app.eval("game.brownBeam.target"),app.eval("game.enemies[0]"));
});

test("BROWN laser prioritizes intact Boss turrets, then auto-locks the exposed hull",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brown";',
    'game.player.x=175;game.player.y=420;',
    'spawnBoss();game.boss.active=true;game.boss.x=1010;game.boss.y=480;',
    'game.boss.parts[0].hp=100;game.boss.parts[0].maxHp=100;',
    'updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.brownBeam.kind"),"turret");
  assert.ok(Math.abs(app.eval("game.boss.parts[0].hp")-
    (100-1.15*bossParts.BALANCE.weakPointDamageScale))<1e-8);
  const full=app.eval("game.boss.hp");
  assert.equal(app.eval("game.boss.hp"),full);
  app.eval('game.boss.parts.forEach(p=>p.hp=0);updateBrownLaser(.101,true)');
  assert.equal(app.eval("game.brownBeam.kind"),"boss");
  assert.ok(Math.abs(app.eval("game.boss.hp")-(full-1.15))<1e-8);
});

test("BROWN visual line stops at the first hit surface and is absent when targeting stops",()=>{
  const app=boot();
  const visual=app.eval([
    '(() => {',
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brown";',
    'game.enemies=[{kind:"scout",x:520,y:480,r:25,hp:20,maxHp:20}];',
    'const ends=[];ctx.lineTo=(x,y)=>ends.push([x,y]);',
    'updateBrownLaser(.05,true);drawBrownLaser();',
    'const hit=game.brownBeam;',
    'updateBrownLaser(.05,false);drawBrownLaser();',
    'return {ends,hitEndX:hit.x,cleared:game.brownBeam===null};',
    '})()'
  ].join("\n"));
  assert.ok(visual.ends.length>=3);
  assert.ok(visual.ends.every(v=>Math.abs(v[0]-visual.hitEndX)<1e-8));
  assert.equal(visual.cleared,true);
});

test("LIME P fires two ordinary twin-lane bullets from the muzzle, not prepositioned satellites", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=175;game.player.y=480;',
    'collectPowerup({type:"P_LIME",x:400,y:480,life:1});',
    'game.weaponLevel=3;firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"lime");
  assert.equal(app.eval("weaponMeta().name"),"ORBIT");
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.orbiting)"),true);
  assert.equal(app.eval("game.missiles.length"),0);
  assert.ok(Math.abs(app.eval("getFireCooldown()")-.101)<1e-10);
  assert.equal(app.eval("game.bullets[0].x"),237);
  assert.equal(app.eval("game.bullets[1].x"),237);
  assert.equal(app.eval("game.bullets[0].y"),470);
  assert.equal(app.eval("game.bullets[1].y"),492);
  assert.equal(app.eval("game.bullets[0].vx"),1100);
  assert.equal(app.eval("game.bullets[1].vx"),1100);
  assert.equal(app.eval("game.bullets.every(b=>b.r===9 && b.power===1.15 && b.orbitRadius<360)"),true);
  app.eval("Math.random=()=>.89");
  assert.equal(app.eval("randomPowerType()"),"P_LIME");
  app.eval("game.powerups=[];dropPlayerPowerOnHit()");
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_LIME");
  const labels=app.eval('(() => {const values=[];ctx.fillText=t=>values.push(String(t));drawHud();drawPowerups();return values;})()');
  assert.ok(labels.includes("LIME ORBIT  R360"));
});

test("LIME is rendered as the SAME normal rectangular projectile as BLUE, not a diamond orb", () => {
  const app=boot();
  const rects=app.eval([
    '(() => {',
    'game.weaponType="lime";firePlayerWeapons();',
    'const drawn=[];',
    'ctx.fillRect=(x,y,w,h)=>drawn.push({x,y,w,h,c:ctx.fillStyle});',
    'drawPlayerBullets();return drawn;',
    '})()'
  ].join("\n"));
  assert.equal(rects.filter(r=>r.c==="#eefcff"&&r.w===34&&r.h===10).length,2);
  assert.equal(rects.filter(r=>r.c==="#d1f74c"&&r.h===4).length,2);
});

test("LIME normal shots curve outward and only subsequently join radius 360 while following player", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="lime";',
    'game.player.x=175;game.player.y=480;firePlayerWeapons();',
    'game.player.x=270;game.player.y=550;updatePlayerBullets(.1);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.orbitRadius>150&&b.orbitRadius<360)"),true);
  assert.equal(app.eval("game.bullets.every(b=>Math.abs(Math.hypot(b.x-game.player.x,b.y-game.player.y)-b.orbitRadius)<1e-8)"),true);
  assert.ok(app.eval("game.bullets[0].y")>550);
  assert.ok(app.eval("game.bullets[0].vx")>0);
  assert.ok(app.eval("game.bullets[0].vy")>0);
  app.eval('updatePlayerBullets(.4)');
  assert.equal(app.eval("game.bullets.every(b=>Math.abs(Math.hypot(b.x-game.player.x,b.y-game.player.y)-360)<1e-8)"),true);
});

test("LIME first frame does not damage an enemy by spawning directly on the distant ring", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="lime";game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:535,y:480,r:28,hp:50,maxHp:50,score:20,color:"#fff",core:"#fff"}];',
    'firePlayerWeapons();updatePlayerBullets(.01);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.enemies[0].hp"),50);
  assert.equal(app.eval("game.bullets.every(b=>b.x<300)"),true);
});

test("LIME offscreen orbiters stay alive on their flight path and expire by active time only", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="lime";game.player.x=175;',
    'firePlayerWeapons();updatePlayerBullets(1.0);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.x<0&&b.life>0)"),true);
  app.eval("updatePlayerBullets(3.3)");
  assert.equal(app.eval("game.bullets.length"),0);
});

test("LIME curving normal bullet hits first swept enemy before reaching orbit, never piercing another", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="lime";game.player.x=175;game.player.y=480;',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'const path=limeRules.step({...game.bullets[0]},game.player,.1);',
    'const earlier=path[1],later=path.at(-1);',
    'game.enemies=[',
    ' {kind:"scout",x:earlier.toX,y:earlier.toY,r:10,hp:50,maxHp:50,score:20,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:later.toX,y:later.toY,r:10,hp:50,maxHp:50,score:20,color:"#fff",core:"#fff"}',
    '];updatePlayerBullets(.1);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.85)<1e-8);
  assert.equal(app.eval("game.enemies[1].hp"),50);
});

test("LIME curving normal bullet routes damage through frontal shield", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="lime";game.player.x=175;game.player.y=480;',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'const path=limeRules.step({...game.bullets[0]},game.player,.1);',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",',
    'x:path[2].toX,y:path[2].toY,r:30,hp:40,maxHp:40,score:50,color:"#fff",core:"#fff"})];',
    'updatePlayerBullets(.1);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].shieldMax-game.enemies[0].shieldHp")-1.15)<1e-8);
  assert.equal(app.eval("game.enemies[0].hp"),40);
});

test("LIME normal bullet hits Boss turret via weak point before hull", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="lime";',
    'game.player.x=175;game.player.y=480;',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'const path=limeRules.step({...game.bullets[0]},game.player,.1),p=path.at(-1);',
    'game.boss={active:true,x:p.toX+115,y:p.toY,rx:70,ry:80,hp:100,maxHp:100,',
    'parts:[{id:"UPPER TURRET",x:-115,y:0,r:22,hp:100,maxHp:100}],color:"#fff"};',
    'updatePlayerBullets(.1);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(Math.abs(app.eval("game.boss.parts[0].hp")-
    (100-1.15*bossParts.BALANCE.weakPointDamageScale))<1e-8);
  assert.equal(app.eval("game.boss.hp"),100);
});

test("LIME normal bullet can hit Boss hull during outward curve before rim", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="lime";',
    'game.player.x=175;game.player.y=480;',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'const path=limeRules.step({...game.bullets[0]},game.player,.1),p=path.at(-1);',
    'game.boss={active:true,x:p.toX+40,y:p.toY,rx:65,ry:60,hp:100,maxHp:100,parts:[],color:"#fff"};',
    'updatePlayerBullets(.1);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(Math.abs(app.eval("game.boss.hp")-98.85)<1e-8);
});

test("LIME accepts unlimited simultaneous orbiting bullets, independent from other weapon bullet cap", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="blue";',
    'addPlayerShot(300,480,1100,0,9,1.15,"#38e8ff");',
    'game.weaponType="lime";for(let i=0;i<230;i++)firePlayerWeapons();'
  ].join("\n"));
  assert.equal(limeWeapon.RULES.maxOrbitingBullets,Infinity);
  assert.equal(app.eval("game.bullets.filter(b=>b.orbiting).length"),460);
  assert.equal(app.eval("game.bullets.filter(b=>!b.orbiting).length"),1);
  app.eval('game.weaponType="blue";firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.filter(b=>b.orbiting).length"),460);
  assert.equal(app.eval("game.bullets.filter(b=>!b.orbiting).length"),3);
});

test("LIME ring guide is cosmetic only; the normal bullets, not a passive aura, deal damage", () => {
  const app=boot();
  const visual=app.eval([
    '(() => {',
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="lime";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:535,y:480,r:25,hp:50,maxHp:50}];',
    'const r=[];ctx.arc=(x,y,radius)=>r.push(radius);',
    'drawLimeOrbitRing();return {r,hp:game.enemies[0].hp};',
    '})()'
  ].join("\n"));
  assert.ok(visual.r.includes(limeWeapon.RULES.radius));
  assert.equal(visual.hp,50);
});

test("already-fired LIME normal bullets continue orbiting after a color switch; pause freezes flight", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="lime";game.player.x=175;game.player.y=480;',
    'firePlayerWeapons();collectPowerup({type:"P_BLUE",x:300,y:480,life:1});'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.bullets.filter(b=>b.orbiting).length"),2);
  const angle=app.eval("game.bullets[0].orbitAngle"),life=app.eval("game.bullets[0].life");
  app.eval('game.state="PAUSED";updatePlaying(2)');
  assert.equal(app.eval("game.bullets[0].orbitAngle"),angle);
  assert.equal(app.eval("game.bullets[0].life"),life);
  app.eval('game.state="PLAYING";game.player.x=225;updatePlayerBullets(.5)');
  assert.ok(app.eval("game.bullets[0].orbitAngle")>angle);
  assert.equal(app.eval("game.bullets[0].orbiting"),true);
  assert.ok(Math.abs(app.eval("Math.hypot(game.bullets[0].x-game.player.x,game.bullets[0].y-game.player.y)")-360)<1e-8);
});

test("BROWN and LIME respect existing fighter Overdrive damage scaling",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=175;',
    'game.weaponType="lime";game.combat.energy=100;activateOverdrive();',
    'firePlayerWeapons();'
  ].join("\n"));
  const scale=app.eval("combatRules.weaponDamageScale(game.combat,selectedShip().id)");
  assert.ok(scale>1);
  assert.ok(Math.abs(app.eval("game.bullets[0].power")-1.15*scale)<1e-8);
  app.eval([
    'game.weaponType="brown";',
    'game.enemies=[{kind:"scout",x:460,y:480,r:25,hp:100,maxHp:100,color:"#fff",core:"#fff"}];',
    'updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-(100-1.15*scale))<1e-8);
});


test("LIME held fire preserves the very first muzzle bullet through a COMPLETE 360 orbit", () => {
  const app=boot();
  const result=app.eval([
    '(() => {',
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="lime";',
    'game.player.x=175;game.player.y=480;game.spawnTimer=999;',
    'game.formationTimer=999;game.invuln=999;keys.Space=true;',
    'updatePlaying(.033);',
    'const oldest=game.bullets[0];',
    'for(let i=0;i<88;i++)updatePlaying(.033);',
    'return {',
    '  alive:game.bullets.includes(oldest),',
    '  age:oldest.orbitAge,life:oldest.life,',
    '  count:game.bullets.filter(b=>b.orbiting).length,',
    '  radius:Math.hypot(oldest.x-game.player.x,oldest.y-game.player.y)',
    '};})()'
  ].join("\n"));
  assert.equal(result.alive,true,
    "Continuous fire must not evict the oldest bullet before its first full revolution");
  assert.ok(result.age > limeWeapon.RULES.outwardSeconds +
    2*Math.PI/limeWeapon.RULES.radiansPerSecond);
  assert.ok(result.life > 0);
  assert.ok(Math.abs(result.radius-360)<1e-8);
  assert.ok(result.count>32);
  assert.equal(limeWeapon.RULES.maxOrbitingBullets,Infinity);
});

test("LIME 5 seconds of full-auto fire recycles by TTL and impacts, never by quantity cap", () => {
  const app=boot();
  const result=app.eval([
    '(() => {',
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="lime";',
    'game.player.x=175;game.player.y=480;game.spawnTimer=999;',
    'game.formationTimer=999;game.invuln=999;keys.Space=true;',
    'for(let i=0;i<155;i++)updatePlaying(.033);',
    'return {',
    '  live:game.bullets.filter(b=>b.orbiting&&b.life>0).length,',
    '  total:game.bullets.filter(b=>b.orbiting).length',
    '};})()'
  ].join("\n"));
  assert.ok(result.total>32);
  assert.ok(result.total<100, "finite lifetime bounds normal held-fire projectile population");
  assert.equal(result.live,result.total);
});


test("SKY P is the 13th collectible and switches damage/homing/slow at actual game.hp 3", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="blue";',
    'collectPowerup({type:"P_SKY",x:300,y:480,life:1});',
    'game.weaponLevel=3;game.hp=4;firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"sky");
  assert.equal(app.eval("weaponMeta().short"),"SKY");
  assert.equal(app.eval("game.bullets.length"),2);
  assert.ok(Math.abs(app.eval("game.bullets[0].power")-2.875)<1e-8);
  assert.equal(app.eval("game.bullets.every(b=>b.skyShot&&!b.skyHoming&&!b.blackSlow)"),true);
  assert.ok(Math.abs(app.eval("getFireCooldown()")-.101)<1e-8);
  const labels=app.eval('(() => {const arr=[];ctx.fillText=t=>arr.push(String(t));drawHud();return arr;})()');
  assert.ok(labels.includes("SKY BOOST  2.5X"));
  app.eval('game.bullets=[];game.hp=3;firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"),2);
  assert.ok(Math.abs(app.eval("game.bullets[0].power")-1.15)<1e-8);
  assert.equal(app.eval("game.bullets.every(b=>b.skyHoming&&b.blackSlow&&b.skyShot)"),true);
  assert.equal(app.eval("game.bullets[0].life"),skyWeapon.RULES.seekingLifetimeSeconds);
  const low=app.eval('(() => {const arr=[];ctx.fillText=t=>arr.push(String(t));drawHud();return arr;})()');
  assert.ok(low.includes("SKY SEEK  BLACK SLOW"));
  app.eval('game.hp=2;game.bullets=[];firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.every(b=>b.skyHoming&&b.blackSlow)"),true);
  app.eval('Math.random=()=>.99');
  assert.equal(app.eval("randomPowerType()"),"P_SKY");
  app.eval('game.weaponLevel=3;game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_SKY");
});

test("SKY mode decision freezes in each already-fired bullet even after HP crosses 3", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="sky";game.hp=4;firePlayerWeapons();',
    'game.hp=3;firePlayerWeapons();',
    'game.hp=5;firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),6);
  assert.equal(app.eval("game.bullets.slice(0,2).every(b=>b.power===2.875&&!b.blackSlow&&!b.skyHoming)"),true);
  assert.equal(app.eval("game.bullets.slice(2,4).every(b=>b.power===1.15&&b.blackSlow&&b.skyHoming)"),true);
  assert.equal(app.eval("game.bullets.slice(4).every(b=>b.power===2.875&&!b.blackSlow&&!b.skyHoming)"),true);
});

test("SKY low-health shots steer toward living targets and keep BLACK's exact 5s debuff and glow", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="sky";game.hp=3;',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:480,y:520,r:30,hp:100,maxHp:100,',
    'score:20,color:"#fff",core:"#fff"}];',
    'firePlayerWeapons();updatePlayerBullets(.17);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].slowRemaining"),blackWeapon.RULES.duration);
  assert.ok(app.eval("game.enemies[0].hp")<100);
  assert.equal(app.eval("game.enemies[0].grayStunRemaining"),undefined);
  const strokes=app.eval([
    '(() => {const colors=[];ctx.stroke=()=>colors.push(ctx.strokeStyle);',
    'drawEnemy(game.enemies[0]);return colors;})()'
  ].join("\n"));
  assert.ok(strokes.includes("#50b9ff"));
  assert.ok(strokes.includes("#d1f3ff"));
  app.eval('collectPowerup({type:"P_ORANGE",x:300,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"orange");
  assert.equal(app.eval("game.enemies[0].slowRemaining"),5);
});

test("SKY high-health ordinary hit deals 2.5x, with no status; SKY low-health tracks Boss turret", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="sky";game.hp=4;',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:450,y:470,r:25,hp:50,maxHp:50,',
    'score:20,color:"#fff",core:"#fff"}];',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.23);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-47.125)<1e-8);
  assert.equal(app.eval("game.enemies[0].slowRemaining"),undefined);
  app.eval([
    'game.bullets=[];game.enemies=[];game.hp=3;',
    'game.boss={active:true,x:540,y:480,rx:100,ry:80,hp:100,maxHp:100,',
    'parts:[{id:"UPPER TURRET",x:-80,y:0,r:28,hp:40,maxHp:40}],color:"#fff"};',
    'firePlayerWeapons();updatePlayerBullets(.22);'
  ].join("\n"));
  assert.equal(app.eval("game.boss.slowRemaining"),blackWeapon.RULES.duration);
  assert.ok(app.eval("game.boss.parts[0].hp")<40);
  assert.equal(app.eval("game.boss.hp"),100);
});

test("SKY low-health homing bullets remain active after changing weapon and expire in active time", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="sky";game.hp=3;',
    'game.enemies=[{kind:"scout",x:900,y:650,r:18,hp:100,maxHp:100,color:"#fff",core:"#fff"}];',
    'firePlayerWeapons();collectPowerup({type:"P_GREEN",x:200,y:400,life:1});'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"green");
  assert.equal(app.eval("game.bullets.filter(b=>b.skyHoming).length"),2);
  const before=app.eval("game.bullets[0].life");
  app.eval('game.state="PAUSED";updatePlaying(5)');
  assert.equal(app.eval("game.bullets[0].life"),before);
  app.eval('game.state="PLAYING";updatePlayerBullets(.1)');
  assert.ok(app.eval("game.bullets[0]?.life")<before);
});

test("gray stun renders a proportional gold countdown ring and exactly three spinning stars", () => {
  const app=boot();
  const draw=app.eval([
    '(() => {',
    'const arcs=[],paints=[],labels=[];',
    'ctx.ellipse=(x,y,rx,ry,r,start,end)=>arcs.push({rx,ry,start,end});',
    'ctx.fill=()=>paints.push(ctx.fillStyle);',
    'ctx.fillText=(label)=>labels.push(String(label));',
    'game.t=2.5;drawGrayStun(30,25,.25);',
    'return {arcs,paints,labels};})()'
  ].join("\n"));
  assert.equal(draw.arcs.length,2);
  assert.ok(Math.abs((draw.arcs[0].end-draw.arcs[0].start)-Math.PI)<1e-8);
  assert.equal(draw.paints.length,3);
  assert.ok(draw.labels.includes("STUN"));
  assert.equal(app.eval("grayRules.RULES.stunChance"),0.05);
  assert.equal(app.eval("grayRules.RULES.stunSeconds"),0.5);
  const hide=app.eval('(() => {const labels=[];ctx.fillText=t=>labels.push(String(t));drawGrayStun(30,25,0);return labels;})()');
  assert.equal(hide.includes("STUN"),false);
});

test("gray stun enhancement appears on existing enemy and Boss status without changing damage", () => {
  const app=boot();
  const messages=app.eval([
    '(() => {',
    'const drawn=[];ctx.fillText=t=>drawn.push(String(t));',
    'game.state="PLAYING";game.t=2;',
    'game.enemies=[{kind:"scout",x:440,y:480,r:30,hp:20,color:"#fff",core:"#fff",grayStunRemaining:.4}];',
    'game.boss={active:true,x:950,y:480,rx:100,ry:80,hp:100,maxHp:100,',
    'parts:[],pattern:0,color:"#fff",core:"#eee",name:"BOSS",grayStunRemaining:.2};',
    'drawEnemy(game.enemies[0]);drawBoss(game.boss);',
    'return drawn;})()'
  ].join("\n"));
  assert.ok(messages.filter(x=>x==="STUN").length>=2);
  assert.equal(app.eval("game.enemies[0].hp"),20);
  assert.equal(app.eval("game.boss.hp"),100);
});

test("RED fan stars still accumulate after switching but neither HUD nor STAR UP popup shows off-red",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="red";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'redRules.fire(game.redWeapon,0);',
    'collectPowerup({type:"P_SKY",x:300,y:480,life:1});game.message="";',
    'updatePlaying(3.01);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"sky");
  assert.equal(app.eval("game.redWeapon.stars"),1);
  assert.equal(app.eval("game.message.includes('RED P')"),false);
  const labels=app.eval('(() => {const arr=[];ctx.fillText=t=>arr.push(String(t));drawHud();return arr;})()');
  assert.equal(labels.some(t=>t.includes("RED P")),false);
  app.eval('collectPowerup({type:"P_RED",x:300,y:480,life:1})');
  assert.equal(app.eval("game.redWeapon.stars"),1);
  const redLabels=app.eval('(() => {const arr=[];ctx.fillText=t=>arr.push(String(t));drawHud();return arr;})()');
  assert.ok(redLabels.some(t=>t.includes("RED P")&&t.includes("★☆☆☆☆")));
});
