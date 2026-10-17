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
    NeonPlatform: platform, NeonController: controller, NeonCombat: combat, NeonRedWeapon: redWeapon, NeonGreenWeapon: greenWeapon, NeonCollision: collision, NeonEnemyBehaviors: enemyBehaviors, NeonWorlds: worlds, NeonBossParts: bossParts, NeonModes: modes, NeonRecords: records, NeonSelectLayout: selectLayout,
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
  app.eval('Math.random=()=>0.7');
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

test("red star HUD survives switching and original blue firing cooldown is unchanged", () => {
  const app = boot();
  const labels = app.eval([
    '(() => {',
    '  game.state="PLAYING";game.weaponType="blue";game.redWeapon.stars=4;',
    '  const drawn=[];ctx.fillText=(...args)=>drawn.push(String(args[0]));',
    '  drawFrame(0.016);return drawn;',
    '})()'
  ].join("\n"));
  assert.ok(labels.some(text=>text.includes("RED P") && text.includes("★★★★☆")));
  assert.equal(app.eval("getFireCooldown()"), app.eval("Math.max(.07,.115-game.weaponLevel*.014)"));
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
  app.eval('Math.random=()=>0.99');
  assert.equal(app.eval('randomPowerType()'), "P_GREEN");
});

test("green aura deals two HP once per second to all nearby enemies, not distant ones", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="green";',
    'game.player.x=500;game.player.y=480;',
    'game.enemies=[',
    '  {kind:"scout",x:570,y:480,r:25,hp:2,maxHp:2,score:35,color:"#fff",core:"#eee"},',
    '  {kind:"gunner",x:688,y:480,r:20,hp:6,maxHp:6,score:45,color:"#fff",core:"#eee"},',
    '  {kind:"scout",x:900,y:480,r:25,hp:6,maxHp:6,score:35,color:"#fff",core:"#eee"}',
    ']; updateGreenAura(0.999);'
  ].join("\n"));
  assert.equal(app.eval('game.enemies.length'), 3);
  assert.equal(app.eval('game.stats.kills'), 0);
  app.eval('updateGreenAura(0.001)');
  assert.equal(app.eval('game.stats.kills'), 1);
  assert.equal(app.eval('game.waveKills'), 1);
  assert.equal(app.eval('game.enemies.length'), 2);
  assert.equal(app.eval('game.enemies.find(e=>e.kind==="gunner").hp'), 4);
  assert.equal(app.eval('game.enemies.find(e=>e.x===900).hp'), 6);
  app.eval('updateGreenAura(1)');
  assert.equal(app.eval('game.enemies.find(e=>e.kind==="gunner").hp'), 2);
  app.eval('updateGreenAura(1)');
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
    'updateGreenAura(1);'
  ].join("\n"));
  assert.equal(app.eval('game.enemies[0].hp'), 10);
  assert.equal(app.eval('game.enemies[0].shieldHp'), 6);
  assert.equal(app.eval('game.boss.hp'), 58);
  app.eval('game.player.x=300; updateGreenAura(1)');
  assert.equal(app.eval('game.boss.hp'), 58);
  assert.equal(app.eval('game.enemies[0].shieldHp'), 6);
});

test("green pulse clock freezes on pause and transitions; weapon swap cancels it", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="green";',
    'game.invuln=100;game.spawnTimer=999;game.formationTimer=999;',
    'game.player.x=500;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:610,y:480,r:20,hp:10,maxHp:10,',
    '  score:50,color:"#fff",core:"#eee",vx:0,vy:0,t:0,wave:0,shootCd:99,shootBase:99}];',
    'updatePlaying(.49);updatePlaying(.49);'
  ].join("\n"));
  assert.equal(app.eval('game.enemies[0].hp'), 10);
  app.eval('updatePlaying(.02)');
  assert.equal(app.eval('game.enemies[0].hp'), 8);
  app.eval('game.state="PAUSED";updatePlaying(5)');
  assert.equal(app.eval('game.enemies[0].hp'), 8);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=10;updatePlaying(5)');
  assert.equal(app.eval('game.enemies[0].hp'), 8);
  app.eval('game.stageMode="WAVE";updatePlaying(.5);updatePlaying(.5)');
  assert.equal(app.eval('game.enemies[0].hp'), 6);

  app.eval('game.greenAura.elapsed=.75;game.redWeapon.stars=3;collectPowerup({type:"P_PURPLE",x:300,y:300,life:1})');
  assert.equal(app.eval('game.greenAura.elapsed'), 0);
  assert.equal(app.eval('game.redWeapon.stars'), 3);
  app.eval('updatePlaying(2)');
  assert.equal(app.eval('game.enemies[0].hp'), 6);
  app.eval('collectPowerup({type:"P_GREEN",x:300,y:300,life:1});updatePlaying(.5)');
  assert.equal(app.eval('game.enemies[0].hp'), 6);
  app.eval('updatePlaying(.5)');
  assert.equal(app.eval('game.enemies[0].hp'), 4);
  assert.equal(app.eval('game.redWeapon.stars'), 3);
});

test("aura kills a splitter but does not immediately hit the spawned children", () => {
  const app = boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="green";',
    'game.player.x=500;game.player.y=480;',
    'game.enemies=[{kind:"splitter",x:610,y:480,r:36,hp:2,maxHp:2,score:40,color:"#3fa",core:"#fff"}];',
    'updateGreenAura(1);'
  ].join("\n"));
  assert.equal(app.eval('game.stats.kills'), 1);
  assert.equal(app.eval('game.enemies.length'), 2);
  assert.equal(app.eval('game.enemies.every(e=>e.minion && e.hp>0)'), true);
  app.eval('updateGreenAura(1)');
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
  assert.ok(shown.radii.includes(180));
  assert.ok(shown.labels.some(s=>s.includes("GREEN AURA  2 DMG/S")));
  const hidden = app.eval([
    '(() => {',
    'game.weaponType="blue";const radii=[];',
    'ctx.arc=(x,y,r)=>radii.push(r);',
    'drawGreenAura(); return radii;',
    '})()'
  ].join("\n"));
  assert.equal(hidden.length, 0);
});
