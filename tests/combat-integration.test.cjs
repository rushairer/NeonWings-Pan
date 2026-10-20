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
const solarAuraWeapon = require("../src/solar-aura-weapon.js");
const blackWeapon = require("../src/black-weapon.js");
const blueBlackWeapon = require("../src/blue-black-weapon.js");
const whiteWeapon = require("../src/white-weapon.js");
const redWhiteWeapon = require("../src/red-white-weapon.js");
const grayWeapon = require("../src/gray-weapon.js");
const grayFlameWeapon = require("../src/gray-flame-weapon.js");
const pinkWeapon = require("../src/pink-weapon.js");
const orangeWeapon = require("../src/orange-weapon.js");
const redOrangeWeapon = require("../src/red-orange-weapon.js");
const redBlueWeapon = require("../src/red-blue-weapon.js");
const brownWeapon = require("../src/brown-weapon.js");
const purpleWhiteWeapon = require("../src/purple-white-weapon.js");
const brownYellowWeapon = require("../src/brown-yellow-weapon.js");
const limeWeapon = require("../src/lime-weapon.js");
const skyWeapon = require("../src/sky-weapon.js");
const darkRedWeapon = require("../src/dark-red-weapon.js");
const darkRedGoldWeapon = require("../src/dark-red-gold-weapon.js");
const rainbowWeapon = require("../src/rainbow-weapon.js");
const magnetWeapon = require("../src/magnet-weapon.js");
const arcLaserWeapon = require("../src/arc-laser-weapon.js");
const stasisWeapon = require("../src/stasis-weapon.js");
const eclipseWeapon = require("../src/eclipse-weapon.js");
const recruitWeapon = require("../src/recruit-weapon.js");
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

function boot(search = "") {
  const ctx = makeCanvasContext();
  const events = new Map();
  const documentEvents = new Map();
  const canvas = { style: {}, getContext: () => ctx };
  const storage = new Map();
  const window = {
    NeonPlatform: platform, NeonController: controller, NeonCombat: combat, NeonRedWeapon: redWeapon, NeonGreenWeapon: greenWeapon, NeonSolarAuraWeapon: solarAuraWeapon, NeonBlackWeapon: blackWeapon, NeonBlueBlackWeapon: blueBlackWeapon, NeonWhiteWeapon: whiteWeapon, NeonRedWhiteWeapon: redWhiteWeapon, NeonGrayWeapon: grayWeapon, NeonGrayFlameWeapon: grayFlameWeapon, NeonPinkWeapon: pinkWeapon, NeonOrangeWeapon: orangeWeapon, NeonRedOrangeWeapon: redOrangeWeapon, NeonRedBlueWeapon: redBlueWeapon, NeonBrownWeapon: brownWeapon, NeonPurpleWhiteWeapon: purpleWhiteWeapon, NeonBrownYellowWeapon: brownYellowWeapon, NeonLimeWeapon: limeWeapon, NeonSkyWeapon: skyWeapon, NeonDarkRedWeapon: darkRedWeapon, NeonDarkRedGoldWeapon: darkRedGoldWeapon, NeonRainbowWeapon: rainbowWeapon, NeonMagnetWeapon: magnetWeapon, NeonArcLaserWeapon: arcLaserWeapon, NeonStasisWeapon: stasisWeapon, NeonEclipseWeapon: eclipseWeapon, NeonRecruitWeapon: recruitWeapon, NeonCollision: collision, NeonEnemyBehaviors: enemyBehaviors, NeonWorlds: worlds, NeonBossParts: bossParts, NeonModes: modes, NeonRecords: records, NeonSelectLayout: selectLayout,
    innerWidth: 1280, innerHeight: 960,
    location: { search },
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


test("handheld ?perf=1 enables performance diagnostics without keyboard F3",()=>{
  const app=boot("?v=26.29.0&perf=1");
  assert.equal(app.eval("performanceOverlay"),true);
  const opt=boot("?perf=true&v=26.29.0");
  assert.equal(opt.eval("performanceOverlay"),true);
  const accidental=boot("?notperf=1&v=26.29.0");
  assert.equal(accidental.eval("performanceOverlay"),false);
  const disabled=boot("?perf=0");
  assert.equal(disabled.eval("performanceOverlay"),false);
  app.events.get("keydown")({code:"F3",repeat:false,preventDefault(){}});
  assert.equal(app.eval("performanceOverlay"),false,
    "F3 still toggles off URL-enabled debug view");
});

test("performance P95 samples only real active foreground frames and bounds its ring buffer",()=>{
  const app=boot("?perf=1");
  const samples=app.eval([
    '(()=>{game.state="PLAYING";',
    'for(let i=0;i<110;i++)recordPerformanceFrame(16.7);',
    'for(let i=0;i<10;i++)recordPerformanceFrame(33.4);',
    'recordPerformanceFrame(400);recordPerformanceFrame(NaN);',
    'recordPerformanceFrame(-1);refreshPerformanceStats();',
    'const first={count:performanceTelemetry.count,p95:performanceTelemetry.p95};',
    'game.state="PAUSED";recordPerformanceFrame(50);',
    'const countAfterPause=performanceTelemetry.count;',
    'game.state="PLAYING";recordPerformanceFrame(12);',
    'refreshPerformanceStats();',
    'return {first,countAfterPause,finalCount:performanceTelemetry.count,',
    'next:performanceTelemetry.next,finalP95:performanceTelemetry.p95,',
    'maxStored:performanceTelemetry.frameTimes.length};})()'
  ].join("\n"));
  assert.equal(samples.first.count,120);
  assert.ok(Math.abs(samples.first.p95-33.4)<1e-8);
  assert.equal(samples.countAfterPause,120);
  assert.equal(samples.finalCount,120);
  assert.equal(samples.next,1);
  assert.ok(samples.finalP95>=16.7);
  assert.equal(samples.maxStored,120);
});

test("performance HUD reports actual Red-Blue outward/seeking counts without mutating bullets",()=>{
  const app=boot("?perf=1");
  const metrics=app.eval([
    '(()=>{game.state="PLAYING";game.fps=59;game.slowFrames=7;',
    'game.redBlueBullets=redBlueRules.radial({x:650,y:480},.38);',
    'for(let i=0;i<120;i++){const b=game.redBlueBullets[i];',
    'b.redBluePhase="homing";b.life=3.6;}',
    'const before=game.redBlueBullets.map(b=>[b.x,b.y,b.life,b.redBluePhase]);',
    'const lines=[];ctx.fillText=t=>lines.push(String(t));',
    'for(let i=0;i<120;i++)recordPerformanceFrame(16.7);',
    'refreshPerformanceStats();drawPerformanceOverlay();',
    'const after=game.redBlueBullets.map(b=>[b.x,b.y,b.life,b.redBluePhase]);',
    'return {lines,same:JSON.stringify(before)===JSON.stringify(after)};})()'
  ].join("\n"));
  assert.equal(metrics.same,true);
  assert.ok(metrics.lines.some(s=>s.includes("FPS 59")&&s.includes("P95 16.7ms")));
  assert.ok(metrics.lines.some(s=>s.includes("RED-BLUE 360/1800")&&
    s.includes("OUT 240")&&s.includes("SEEK 120")));
  assert.ok(metrics.lines.some(s=>s.includes("STAR IDLE")));
});

test("F3-off telemetry does not sample frames or render on normal default startup",()=>{
  const app=boot();
  const a=app.eval([
    '(()=>{game.state="PLAYING";',
    'for(let i=0;i<60;i++)recordPerformanceFrame(16.7);',
    'const drawn=[];ctx.fillText=t=>drawn.push(t);',
    'drawPerformanceOverlay();refreshPerformanceStats();',
    'return {count:performanceTelemetry.count,p95:performanceTelemetry.p95,',
    'drawn:drawn.length};})()'
  ].join("\n"));
  assert.equal(a.count,0);
  assert.equal(a.p95,0);
  assert.equal(a.drawn,0);
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
  app.eval('Math.random=()=>(3+.5)/POWER_TYPES.length');
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
  app.eval('Math.random=()=>(4+.5)/POWER_TYPES.length');
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
  app.eval("Math.random=()=>(5+.5)/POWER_TYPES.length");
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
  app.eval("Math.random=()=>(6+.5)/POWER_TYPES.length");
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
  app.eval("Math.random=()=>(7+.5)/POWER_TYPES.length");
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
  app.eval("Math.random=()=>(8+.5)/POWER_TYPES.length");
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
  app.eval("Math.random=()=>(9+.5)/POWER_TYPES.length");
  assert.equal(app.eval("randomPowerType()"),"P_ORANGE");
  app.eval('game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval('game.powerups.at(-1).type'),"P_ORANGE");
  const labels=app.eval([
    '(() => {const values=[];ctx.fillText=(label)=>values.push(String(label));',
    'drawHud();drawPowerups();drawPlayerBullets();return values})()'
  ].join("\n"));
  assert.ok(labels.includes("ORANGE BLAST  R100  X1.6"));
});

test("ORANGE shot detonates at first swept contact, 1.6x damage to direct and nearby, no 1x extra", () => {
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
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-48.16)<1e-8);
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
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-48.16)<1e-8);
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
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-8);
  assert.ok(Math.abs(app.eval("game.boss.hp")-98.16)<1e-8);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
});

test("ORANGE directly hitting Boss hull does 1.6x once and hits nearby off-lane enemies", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=180;',
    'game.boss={active:true,x:600,y:480,rx:100,ry:80,hp:100,maxHp:100,parts:[],color:"#fff"};',
    'game.enemies=[{kind:"scout",x:530,y:575,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}];',
    'addPlayerShot(300,480,1100,0,9,1.15,"#ff932e",{orangeBlast:true});',
    'updatePlayerBullets(.32);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.boss.hp")-98.16)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-8);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
  assert.ok(Math.abs(app.eval("game.orangeExplosions[0].x")-491)<1e-8);
});

test("ORANGE Boss turret hit uses 1.6x base shot damage through weak point, not Boss hull", () => {
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
  assert.ok(Math.abs(turretLoss-1.15*1.6*bossParts.BALANCE.weakPointDamageScale)<1e-8);
  assert.equal(app.eval("game.boss.hp"),app.eval("game.boss.maxHp"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-8);
});

test("ORANGE shield absorbs 1.6x explosion damage with no extra direct hit", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=180;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",',
    'x:400,y:480,r:39,hp:20,maxHp:20,score:60,color:"#aaf",core:"#fff"}),',
    '{kind:"scout",x:450,y:530,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}];',
    'addPlayerShot(280,480,1100,0,9,1.15,"#ff932e",{orangeBlast:true});',
    'updatePlayerBullets(.22);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].shieldMax-game.enemies[0].shieldHp")-1.84)<1e-8);
  assert.equal(app.eval("game.enemies[0].hp"),20);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-48.16)<1e-8);
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
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-8);
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
  app.eval('Math.random=()=>(10+.5)/POWER_TYPES.length');
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
  app.eval("Math.random=()=>(11+.5)/POWER_TYPES.length");
  assert.equal(app.eval("randomPowerType()"),"P_LIME");
  app.eval("game.powerups=[];dropPlayerPowerOnHit()");
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_LIME");
  const labels=app.eval('(() => {const values=[];ctx.fillText=t=>values.push(String(t));drawHud();drawPowerups();return values;})()');
  assert.ok(labels.includes("LIME ORBIT → SEEK"));
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

test("LIME offscreen orbits finish into bounded homing shots instead of despawning", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="lime";game.player.x=175;',
    'firePlayerWeapons();updatePlayerBullets(1.0);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.x<0&&b.life>0)"),true);
  app.eval("updatePlayerBullets(3.3)");
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.limeHoming&&!b.orbiting)"),true);
  assert.ok(Math.abs(app.eval("game.bullets[0].life")-2.5)<1e-8);
  app.eval("updatePlayerBullets(2.6)");
  assert.equal(app.eval("game.bullets.length"),0,"extra 3.6s TTL must reclaim bullets without targets");
});

test("LIME final orbit tick launches a same-damage homing bolt at the nearest target",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="lime";',
    'game.player.x=175;game.player.y=480;game.enemies=[',
    ' {kind:"scout",x:900,y:480,r:30,hp:50,maxHp:50,score:20,color:"#fff",core:"#fff"}',
    '];firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'game.savedShot=game.bullets[0];updatePlayerBullets(3.2);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),1);
  assert.equal(app.eval("game.bullets[0]===game.savedShot"),true,"do not spawn a replacement projectile");
  assert.equal(app.eval("game.bullets[0].limeHoming"),true);
  assert.equal(app.eval("game.bullets[0].orbiting"),false);
  assert.equal(app.eval("game.bullets[0].life"),limeWeapon.RULES.homingLifetimeSeconds);
  assert.equal(app.eval("game.bullets[0].power"),1.15);
  assert.ok(app.eval("game.bullets[0].vx")>0);
  app.eval("updatePlayerBullets(1.4)");
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.85)<1e-8);
});

test("LIME orbital last swept hit is resolved before homing, with no second damage",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="lime";',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'const path=limeRules.step({...game.bullets[0]},game.player,3.2);',
    'const end=path.at(-1);game.enemies=[{kind:"scout",',
    'x:end.toX,y:end.toY,r:15,hp:50,maxHp:50,score:20,color:"#fff",core:"#fff"}];',
    'updatePlayerBullets(3.2);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.85)<1e-8);
});

test("LIME expired orbiter retargets when enemies appear after an empty field",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="lime";',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(3.2);game.savedShot=game.bullets[0];',
    'game.enemies=[{kind:"scout",x:850,y:450,r:35,hp:50,maxHp:50,',
    'score:20,color:"#fff",core:"#fff"}];'
  ].join("\n"));
  assert.equal(app.eval("game.savedShot.limeHoming"),true);
  assert.equal(app.eval("game.savedShot.life"),limeWeapon.RULES.homingLifetimeSeconds);
  app.eval("updatePlayerBullets(2)");
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.85)<1e-8);
});

test("LIME homing applies weakpoint damage to Boss turrets before hull",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="lime";',
    'const b=limeRules.createShot(game.player,-10);b.life=0;',
    'limeRules.launchHoming(b);b.x=200;b.y=480;b.vx=limeRules.RULES.homingSpeed;b.vy=0;',
    'game.bullets=[{...b,power:1.15,c:"#d1f74c"}];',
    'game.boss={active:true,x:550,y:480,rx:80,ry:70,hp:100,maxHp:100,',
    'parts:[{id:"TEST",x:-150,y:0,r:23,hp:50,maxHp:50}],color:"#fff"};',
    'updatePlayerBullets(.27);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(Math.abs(app.eval("game.boss.parts[0].hp")-
    (50-1.15*bossParts.BALANCE.weakPointDamageScale))<1e-8);
  assert.equal(app.eval("game.boss.hp"),100);
});

test("RAINBOW LIME outcome also transitions to seeking after orbit expiry and weapon swap",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="rainbow";Math.random=()=>.8;',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'const orb=game.bullets[0];game.savedOrb=orb;',
    'collectPowerup({type:"P_BLUE",x:300,y:480,life:1});',
    'updatePlayerBullets(3.2);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),1);
  assert.equal(app.eval("game.bullets[0]===game.savedOrb"),true);
  assert.equal(app.eval("game.bullets[0].rainbowKind"),"orbit");
  assert.equal(app.eval("game.bullets[0].limeHoming"),true);
  assert.equal(app.eval("game.bullets[0].orbiting"),false);
  const life=app.eval("game.bullets[0].life");
  app.eval("game.state='PAUSED';updatePlaying(2)");
  assert.equal(app.eval("game.bullets[0].life"),life);
  app.eval("game.state='PLAYING';updatePlayerBullets(3.7)");
  assert.equal(app.eval("game.bullets.length"),0);
});

test("LIME homing keeps ordinary bullet quota free, and rendering never deals damage",()=>{
  const app=boot();
  const scene=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";game.weaponType="lime";',
    'game.enemies=[{kind:"scout",x:900,y:400,r:12,hp:99,maxHp:99}];',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(3.2);const homing=game.bullets[0];',
    'game.bullets.push(...Array.from({length:360},()=>({x:200,y:400,vx:1,vy:0})));',
    'const count=game.bullets.length;const originalHp=game.enemies[0].hp;',
    'const colors=[];ctx.fillRect=(x,y,w,h)=>colors.push(ctx.fillStyle);',
    'drawPlayerBullets();return {count,hp:originalHp,after:game.enemies[0].hp,',
    'limeHoming:homing.limeHoming,looksLime:colors.includes("#b6e035")};})()'
  ].join("\n"));
  assert.equal(scene.count,361);
  assert.equal(scene.limeHoming,true);
  assert.equal(scene.looksLime,true);
  assert.equal(scene.hp,scene.after);
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
  app.eval('Math.random=()=>(12+.5)/POWER_TYPES.length');
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
    'firePlayerWeapons();updatePlayerBullets(.24);'
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


test("DARK RED is the fourteenth pickup with distinct twin 1x bullets and no RED star system",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="blue";game.redWeapon.stars=3;',
    'collectPowerup({type:"P_DARK_RED",x:300,y:480,life:1});',
    'Math.random=()=>.99;firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"darkred");
  assert.equal(app.eval("weaponMeta().name"),"CHAIN");
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.darkRedChain && b.power===1.15 && b.r===9 && b.vx===1100 && b.vy===0)"),true);
  assert.equal(app.eval("game.redWeapon.stars"),3);
  assert.equal(app.eval("game.redWeapon.volleys"),0);
  assert.ok(Math.abs(app.eval("getFireCooldown()")-.101)<1e-10);
  app.eval("Math.random=()=>(13+.5)/POWER_TYPES.length");
  assert.equal(app.eval("randomPowerType()"),"P_DARK_RED");
  app.eval("game.powerups=[];dropPlayerPowerOnHit()");
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_DARK_RED");
  const labels=app.eval([
    '(() => {const labels=[];ctx.fillText=x=>labels.push(String(x));',
    'drawHud();drawPowerups();drawPlayerBullets();return labels;})()'
  ].join("\n"));
  assert.ok(labels.includes("DARK RED  50%x30  M5%x10"));
  assert.equal(labels.some(x=>x.includes("RED P")),false,
    "DARK RED must never expose ordinary RED star HUD");
});


test("RED-BLUE only evolves from YELLOW or RED and drops as itself after damage",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="blue";',
    'game.redWeapon.stars=3;game.weaponLevel=2;game.score=0;',
    'const wrong={type:"P_RED_BLUE",x:240,y:480,life:12};',
    'game.wrongRedBlue=wrong;game.invalidResult=collectPowerup(wrong);'
  ].join("\n"));
  assert.equal(app.eval("game.invalidResult"),false);
  assert.equal(app.eval("game.wrongRedBlue.life"),12);
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.redWeapon.stars"),3);
  assert.equal(app.eval("game.weaponLevel"),2);
  assert.equal(app.eval("game.score"),0);
  assert.ok(app.eval('game.message.includes("REQUIRES YELLOW OR RED P")'));
  for(const source of ["yellow","red"]) {
    app.eval('game.weaponType="'+source+'";collectPowerup({type:"P_RED_BLUE",x:240,y:480,life:12})');
    assert.equal(app.eval("game.weaponType"),"redblue");
    assert.equal(app.eval("game.redWeapon.stars"),3);
  }
  app.eval('game.weaponLevel=2;game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_RED_BLUE");
  app.eval('collectPowerup({type:"P_RED_BLUE",x:240,y:480,life:12})');
  assert.equal(app.eval("game.weaponType"),"redblue");
});

test("RED-BLUE fires precisely five independent initial rays once per held-FIRE second",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redblue";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'game.player.x=175;game.player.y=480;Math.random=()=>.99;',
    'keys.Space=true;updatePlaying(.001);'
  ].join("\n"));
  assert.equal(app.eval("getFireCooldown()"),1);
  assert.equal(app.eval("game.fireCooldown"),1);
  assert.equal(app.eval("game.redBlueBullets.length"),5);
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.length"),0);
  assert.equal(app.eval("game.redBlueBullets.every(b=>b.power===1.15&&b.redBluePhase==='outward')"),true);
  assert.equal(app.eval("game.redBlueStarfall"),null);
  const vectors=app.eval("game.redBlueBullets.map(b=>Math.round(Math.atan2(b.vy,b.vx)*180/Math.PI))");
  assert.deepEqual(Array.from(vectors),[-60,-30,0,30,60]);
  app.eval("updatePlaying(.999)");
  assert.equal(app.eval("game.redBlueBullets.length"),5);
  app.eval("updatePlaying(.002)");
  assert.equal(app.eval("game.redBlueBullets.length"),10);
  assert.equal(app.eval("game.fireCooldown"),1);
});

test("RED-BLUE outward five-way shots do not hit enemies until launch-radius 360",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redblue";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:430,y:480,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}];',
    'Math.random=()=>.99;firePlayerWeapons();updateRedBlueBullets(.2);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),100);
  assert.equal(app.eval("game.redBlueBullets.length"),5);
  assert.equal(app.eval("game.redBlueBullets[2].redBluePhase"),"outward");
  app.eval("updateRedBlueBullets(.12)");
  assert.equal(app.eval("game.redBlueBullets[2].redBluePhase"),"homing");
  assert.equal(app.eval("game.redBlueBullets[2].redBlueOriginX"),175);
});

test("RED-BLUE Starfall 10% roll is per five-shot volley, lands after .8s and awards one shared star",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redblue";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[',
    '{kind:"scout",x:720,y:260,r:22,hp:100,maxHp:100,score:20,color:"#fff",core:"#fff"},',
    '{kind:"scout",x:890,y:650,r:22,hp:100,maxHp:100,score:20,color:"#fff",core:"#fff"}',
    '];Math.random=()=>.1;firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.redBlueStarfall"),null);
  assert.equal(app.eval("game.redWeapon.special"),null);
  app.eval("Math.random=()=>.09999;firePlayerWeapons()");
  assert.equal(app.eval("game.redBlueBullets.length"),10);
  assert.equal(app.eval("game.redWeapon.special.redBlue"),true);
  assert.equal(app.eval("game.redWeapon.stars"),0);
  app.eval("updateRedBlueStarfall(.799)");
  assert.equal(app.eval("game.enemies[0].hp"),100);
  assert.equal(app.eval("game.enemies[1].hp"),100);
  assert.ok(app.eval("game.redBlueStarfall.elapsed")>.79);
  app.eval("updateRedBlueStarfall(.001)");
  assert.equal(app.eval("game.redBlueStarfall"),null);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-88.5)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-88.5)<1e-8);
  assert.equal(app.eval("game.redBlueBullets.length"),370);
  assert.equal(app.eval("game.redBlueBullets.filter(b=>b.redBlueSpecial).length"),360);
  assert.equal(app.eval("game.redWeapon.stars"),1);
  assert.equal(app.eval("game.redWeapon.special"),null);
  assert.equal(app.eval("game.redBlueStarFx.length"),1);
});

test("RED-BLUE radial burst fires a complete 360-degree circle and tracks after R360",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.redBlueBullets=redBlueRules.radial({x:640,y:480},.38);',
    'game.enemies=[];updateRedBlueBullets(.375);'
  ].join("\n"));
  assert.equal(app.eval("game.redBlueBullets.length"),360);
  assert.equal(app.eval("game.redBlueBullets.every(b=>b.redBluePhase==='homing')"),true);
  assert.equal(app.eval("game.redBlueBullets.every(b=>b.life===3.6)"),true);
  assert.equal(app.eval("new Set(game.redBlueBullets.map(b=>Math.round(Math.atan2(b.vy,b.vx)*180/Math.PI+360)%360)).size"),360);
  assert.ok(Math.abs(app.eval("Math.hypot(game.redBlueBullets[90].x-640,game.redBlueBullets[90].y-480)")-360)<1e-7);
  app.eval("game.redBlueBullets=[game.redBlueBullets[0]];game.enemies=[{kind:'scout',x:1040,y:480,r:23,hp:100,maxHp:100,score:20,color:'#fff',core:'#fff'}];updateRedBlueBullets(.1)");
  assert.equal(app.eval("game.redBlueBullets.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-99.62)<1e-7);
});

test("RED-BLUE full-field Starfall hits Boss hull once without treating mounts as multiple Bosses",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="redblue";',
    'game.boss={active:true,x:950,y:480,rx:100,ry:90,hp:300,maxHp:300,color:"#fff",core:"#fff",',
    'parts:[{id:"TURRET",x:-130,y:0,r:25,hp:90,maxHp:90}]};',
    'Math.random=()=>0;firePlayerWeapons();updateRedBlueStarfall(.8);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.boss.hp")-288.5)<1e-8);
  assert.equal(app.eval("game.boss.parts[0].hp"),90);
  assert.equal(app.eval("game.redBlueBullets.filter(b=>b.redBlueSpecial).length"),360);
  assert.equal(app.eval("game.redWeapon.stars"),1);
});

test("RED-BLUE seeking shot hits first Boss weakpoint via swept collision, not the hull",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="blue";',
    'const b=redBlueRules.volley({x:175,y:480})[2];',
    'b.x=450;b.y=480;b.vx=940;b.vy=0;b.life=3.6;b.redBluePhase="homing";',
    'game.redBlueBullets=[b];',
    'game.boss={active:true,x:730,y:480,rx:90,ry:90,hp:300,maxHp:300,color:"#fff",core:"#fff",',
    'parts:[{id:"LEFT",x:-140,y:0,r:24,hp:70,maxHp:70}]};',
    'updateRedBlueBullets(.23);'
  ].join("\n"));
  assert.equal(app.eval("game.redBlueBullets.length"),0);
  assert.equal(app.eval("game.boss.hp"),300);
  const scale=app.eval("bossParts.BALANCE.weakPointDamageScale");
  assert.ok(Math.abs(app.eval("game.boss.parts[0].hp")-(70-1.15*scale))<1e-7);
});

test("RED-BLUE global blast does not damage freshly split children from same impact",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redblue";',
    'game.enemies=[{kind:"splitter",x:670,y:460,r:24,hp:5,maxHp:5,',
    'vx:0,vy:0,t:0,wave:0,score:40,color:"#fff",core:"#eee"}];',
    'Math.random=()=>0;firePlayerWeapons();updateRedBlueStarfall(.8);'
  ].join("\n"));
  assert.equal(app.eval("game.stats.kills"),1);
  assert.equal(app.eval("game.enemies.filter(e=>e.hp>0).length"),2);
  assert.equal(app.eval("game.enemies.filter(e=>e.hp>0&&e.hp===e.maxHp).length"),2);
});

test("RED-BLUE Starfall persists after weapon swap, suppresses RED fan and pauses correctly",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redblue";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'Math.random=()=>0;firePlayerWeapons();',
    'collectPowerup({type:"P_YELLOW",x:250,y:480,life:1});',
    'game.state="PAUSED";updatePlaying(3);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"yellow");
  assert.equal(app.eval("game.redBlueStarfall.elapsed"),0);
  assert.equal(app.eval("game.redWeapon.special.redBlue"),true);
  assert.equal(app.eval("redRules.tick(game.redWeapon,3,()=>{}).fired"),0);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=10;updatePlaying(2)');
  assert.equal(app.eval("game.redBlueStarfall.elapsed"),0);
  app.eval('game.stageMode="WAVE";updateRedBlueStarfall(.8)');
  assert.equal(app.eval("game.redWeapon.stars"),1);
  assert.equal(app.eval("game.redWeapon.special"),null);
  assert.equal(app.eval("game.redBlueBullets.length"),365);
});

test("RED-BLUE regular fire cannot start a star while an original RED fan already owns special",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="red";',
    'Math.random=()=>0;firePlayerWeapons();redRules.fire(game.redWeapon,0);',
    'game.weaponType="redblue";firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.redWeapon.special.redBlue"),undefined);
  assert.equal(app.eval("game.redBlueStarfall"),null);
  assert.equal(app.eval("game.redBlueBullets.length"),5);
});

test("RED-BLUE uses one shared five-star HUD with RED/RED-WHITE/RED-ORANGE and loses star on HP hit",()=>{
  const app=boot();
  const hud=()=>app.eval('(()=>{const a=[];ctx.fillText=x=>a.push(String(x));drawHud();return a;})()');
  app.eval('game.state="PLAYING";game.weaponType="redblue";game.redWeapon.stars=4');
  assert.ok(hud().some(t=>t.includes("RED-BLUE P")&&t.includes("★★★★☆")));
  assert.ok(hud().includes("RED-BLUE  5-WAY R360 SEEK"));
  app.eval('game.invuln=0;damagePlayer()');
  assert.equal(app.eval("game.redWeapon.stars"),3);
  app.eval('game.weaponType="red"');
  assert.ok(hud().some(t=>t.includes("RED P")&&t.includes("★★★☆☆")));
  app.eval('game.weaponType="redwhite"');
  assert.ok(hud().some(t=>t.includes("RED-WHITE P")&&t.includes("★★★☆☆")));
  app.eval('game.weaponType="redorange"');
  assert.ok(hud().some(t=>t.includes("RED-ORANGE P")&&t.includes("★★★☆☆")));
  app.eval('game.weaponType="yellow"');
  assert.equal(hud().some(t=>t.includes("RED-BLUE P")),false);
  assert.equal(app.eval("game.redWeapon.stars"),3);
});

test("RED-BLUE never truncates the NEW complete 360 ring even with older active shots",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="redblue";',
    'game.redBlueBullets=Array.from({length:1700},()=>redBlueRules.volley(game.player)[0]);',
    'pushRedBlueBullets(redBlueRules.radial({x:850,y:460},.38));'
  ].join("\n"));
  assert.equal(app.eval("game.redBlueBullets.length"),redBlueWeapon.RULES.maxBullets);
  assert.equal(app.eval("game.redBlueBullets.slice(-360).filter(b=>b.redBlueSpecial).length"),360);
});

test("RED-BLUE pickup, lasers, star visuals and 360 pellets only DRAW without combat mutation",()=>{
  const app=boot();
  const state=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redblue";',
    'game.powerups=[{type:"P_RED_BLUE",x:460,y:660,t:0,life:12}];',
    'game.enemies=[{kind:"scout",x:800,y:480,r:20,hp:100,maxHp:100,color:"#fff"}];',
    'game.redBlueBullets=redBlueRules.radial({x:850,y:480},.38);',
    'game.redBlueStarfall={x:850,y:480,elapsed:.4,power:11.5,bulletPower:.38};',
    'const hp=game.enemies[0].hp,counts=game.redBlueBullets.length;',
    'const labels=[],lines=[];ctx.fillText=t=>labels.push(String(t));',
    'ctx.lineTo=(x,y)=>lines.push([x,y]);',
    'drawPowerups();drawRedBlueBullets();drawRedBlueStarfall();drawHud();',
    'return {hp,after:game.enemies[0].hp,count:counts,afterCount:game.redBlueBullets.length,',
    'elapsed:game.redBlueStarfall.elapsed,labels,lines};})()'
  ].join("\n"));
  assert.equal(state.hp,state.after);
  assert.equal(state.count,state.afterCount);
  assert.equal(state.elapsed,.4);
  assert.ok(state.lines.length>=10);
  assert.ok(state.labels.includes("RED-BLUE  5-WAY R360 SEEK"));
});
test("RED-BLUE extends uniform P drop pool to all 29 types without reordering old slots",()=>{
  const app=boot();
  const expected=[
    "P_BLUE","P_PURPLE","P_YELLOW","P_RED","P_GREEN","P_BLACK","P_WHITE",
    "P_GRAY","P_PINK","P_ORANGE","P_BROWN","P_LIME","P_SKY","P_DARK_RED","P_RAINBOW","P_MAGNET","P_ARC_LASER","P_STASIS","P_ECLIPSE","P_RECRUIT","P_SOLAR","P_RED_WHITE","P_GRAY_FLAME","P_RED_ORANGE","P_BROWN_YELLOW","P_PURPLE_WHITE","P_BLUE_BLACK","P_DARK_RED_GOLD","P_RED_BLUE"
  ];
  for(let i=0;i<expected.length;i++){
    const roll=(i+.5)/expected.length;
    app.eval("Math.random=()=>"+roll);
    assert.equal(app.eval("randomPowerType()"),expected[i]);
  }
});

test("DARK RED ordinary contact has only one full-strength hit when 50% fails",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=175;game.player.y=480;',
    'game.weaponType="darkred";game.weaponLevel=3;',
    'game.enemies=[{kind:"scout",x:420,y:470,r:24,hp:100,maxHp:100,',
    'score:20,color:"#fff",core:"#eee"}];',
    'Math.random=()=>.99;firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'Math.random=()=>.5;updatePlayerBullets(.20);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-9);
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.enemies[0].slowRemaining||0"),0);
});

test("DARK RED perpetual 50% success yields exactly thirty full-damage hits",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=175;game.player.y=480;',
    'game.weaponType="darkred";game.weaponLevel=3;',
    'game.enemies=[{kind:"scout",x:420,y:470,r:24,hp:100,maxHp:100,',
    'score:20,color:"#fff",core:"#eee"}];',
    'Math.random=()=>.99;firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'Math.random=()=>0;updatePlayerBullets(.20);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-65.5)<1e-8);
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.stats.kills"),0);
});

test("DARK RED two bullets independently chain on separate target lanes",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=175;game.player.y=480;',
    'game.weaponType="darkred";',
    'game.enemies=[',
    ' {kind:"scout",x:420,y:465,r:8,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    ' {kind:"scout",x:420,y:500,r:8,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];Math.random=()=>.99;firePlayerWeapons();Math.random=()=>0;updatePlayerBullets(.20);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-65.5)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-65.5)<1e-8);
  assert.equal(app.eval("game.bullets.length"),0);
});

test("DARK RED stops immediately when target dies and does not transfer to neighbors",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=175;game.player.y=480;',
    'game.weaponType="darkred";',
    'game.enemies=[',
    ' {kind:"scout",x:420,y:470,r:25,hp:2,maxHp:2,score:20,color:"#fff",core:"#eee"},',
    ' {kind:"scout",x:470,y:470,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];Math.random=()=>.99;firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'Math.random=()=>0;updatePlayerBullets(.22);'
  ].join("\n"));
  assert.ok(app.eval("game.enemies[0].hp")<=0);
  assert.equal(app.eval("game.enemies[1].hp"),100);
  assert.equal(app.eval("game.stats.kills"),1);
});

test("DARK RED kills splitter once; its freshly spawned children never join the damage chain",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=175;',
    'game.weaponType="darkred";',
    'game.enemies=[{kind:"splitter",x:420,y:470,r:35,hp:1,maxHp:1,',
    'score:60,color:"#fff",core:"#eee"}];',
    'Math.random=()=>.99;firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'Math.random=()=>0;updatePlayerBullets(.22);'
  ].join("\n"));
  assert.equal(app.eval("game.stats.kills"),1);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).length"),2);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).every(e=>e.hp===e.maxHp)"),true);
});

test("DARK RED repeated 100% shield hits absorb charge before normal hull hits",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=175;game.weaponType="darkred";',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",',
    'x:420,y:470,r:39,hp:100,maxHp:100,score:50,color:"#fff",core:"#eee"})];',
    'const shield=game.enemies[0];const startShield=shield.shieldHp;',
    'Math.random=()=>.99;firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'Math.random=()=>0;updatePlayerBullets(.20);',
    'game.darkRedShieldLoss=startShield-shield.shieldHp;'
  ].join("\n"));
  const absorbed=app.eval("game.darkRedShieldLoss");
  const hullLoss=100-app.eval("game.enemies[0].hp");
  assert.ok(absorbed>0);
  assert.ok(Math.abs(absorbed+hullLoss-34.5)<1e-8);
  assert.equal(app.eval("game.stats.kills"),0);
});

test("DARK RED repeatedly damages only Boss hull and stops at thirty full hits",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="darkred";',
    'game.player.x=175;game.player.y=480;',
    'game.boss={active:true,x:480,y:470,rx:65,ry:70,hp:100,maxHp:100,',
    'parts:[],color:"#fff",core:"#fff"};',
    'Math.random=()=>.99;firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'Math.random=()=>0;updatePlayerBullets(.20);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.boss.hp")-65.5)<1e-8);
  assert.equal(app.eval("game.bullets.length"),0);
});

test("DARK RED hits Boss turret with original weak-point scaling on every repeat",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="darkred";',
    'game.player.x=175;game.player.y=480;',
    'game.boss={active:true,x:620,y:470,rx:80,ry:70,hp:100,maxHp:100,',
    'parts:[{id:"UPPER TURRET",x:-175,y:0,r:24,hp:100,maxHp:100}],',
    'color:"#fff",core:"#fff"};',
    'Math.random=()=>.99;firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'Math.random=()=>0;updatePlayerBullets(.20);'
  ].join("\n"));
  const expected=1.15*30*bossParts.BALANCE.weakPointDamageScale;
  assert.ok(Math.abs(app.eval("game.boss.parts[0].hp")-(100-expected))<1e-8);
  assert.equal(app.eval("game.boss.hp"),100);
});

test("DARK RED ceases chain as soon as a turret breaks, never punching through to hull",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="darkred";',
    'game.player.x=175;game.player.y=480;',
    'game.boss={active:true,x:620,y:470,rx:80,ry:70,hp:100,maxHp:100,',
    'parts:[{id:"UPPER TURRET",x:-175,y:0,r:24,hp:2,maxHp:2}],',
    'color:"#fff",core:"#fff"};',
    'Math.random=()=>.99;firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'Math.random=()=>0;updatePlayerBullets(.20);'
  ].join("\n"));
  assert.ok(app.eval("game.boss.parts[0].hp")<=0);
  // Destroying a turret normally damages the Boss hull by 6.5% of max HP.
  // That one-time weak-point reward is NOT a chained hull hit.
  assert.equal(app.eval("game.boss.hp"),
    100 - Math.ceil(100 * bossParts.BALANCE.hullDamageOnBreak));
  assert.equal(app.eval("game.bullets.length"),0);
});

test("DARK RED remains 100% per repeat during Overdrive and after swapping weapons",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=175;game.player.y=480;',
    'game.weaponType="darkred";game.redWeapon.stars=4;',
    'game.combat.energy=100;activateOverdrive();Math.random=()=>.99;firePlayerWeapons();',
    'game.bullets=game.bullets.slice(0,1);',
    'game.enemies=[{kind:"scout",x:420,y:470,r:30,hp:100,maxHp:100,',
    'score:20,color:"#fff",core:"#eee"}];',
    'collectPowerup({type:"P_BLUE",x:320,y:480,life:1});',
    'Math.random=()=>0;updatePlayerBullets(.20);'
  ].join("\n"));
  const scale=app.eval("combatRules.weaponDamageScale(game.combat,selectedShip().id)");
  assert.ok(scale>1);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-(100-34.5*scale))<1e-8);
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.redWeapon.stars"),4);
});


test("DARK RED 5% bonus rocket launches once per volley, never at the 0.05 boundary", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="darkred";',
    'game.invuln=100;game.spawnTimer=999;game.formationTimer=999;',
    'keys.Space=true;Math.random=()=>0.049999;updatePlaying(.001);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.missiles.length"),1);
  assert.equal(app.eval("game.missiles[0].darkRedSpecial"),true);
  assert.equal(app.eval("game.missiles[0].pinkSpecial"),undefined);
  assert.equal(app.eval("game.missiles[0].r"),50);
  assert.ok(Math.abs(app.eval("game.missiles[0].power/game.bullets[0].power")-10)<1e-10);
  assert.ok(Math.abs(app.eval("game.missiles[0].life")-4.599)<1e-8);
  app.eval("Math.random=()=>0.05;game.fireCooldown=0;updatePlaying(.001)");
  assert.equal(app.eval("game.bullets.length"),4);
  assert.equal(app.eval("game.missiles.length"),1);
  const labels=app.eval('(() => {const l=[];ctx.fillText=t=>l.push(String(t));drawHud();return l;})()');
  assert.ok(labels.includes("DARK RED  50%x30  M5%x10"));
});

test("DARK RED 10x guided missile homes like PINK and keeps its original strength through Overdrive", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="darkred";',
    'game.player.x=175;game.player.y=480;game.spawnTimer=999;',
    'game.combat.energy=100;activateOverdrive();',
    'Math.random=()=>0;firePlayerWeapons();',
    'game.enemies=[{kind:"scout",x:1150,y:150,r:20,hp:300,maxHp:300,color:"#fff",core:"#eee"}];'
  ].join("\n"));
  assert.equal(app.eval("game.missiles.length"),1);
  assert.ok(Math.abs(app.eval("game.missiles[0].power/game.bullets[0].power")-10)<1e-9);
  const initialAngle=app.eval("Math.atan2(game.missiles[0].vy,game.missiles[0].vx)");
  app.eval('updateMissiles(.07)');
  const following=app.eval("Math.atan2(game.missiles[0].vy,game.missiles[0].vx)");
  assert.ok(following<initialAngle);
  app.eval('collectPowerup({type:"P_BLUE",x:280,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.missiles[0].darkRedSpecial"),true);
});

test("DARK RED missile direct enemy receives exactly thirty 10x hits; nearby gets one 1x splash", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=175;',
    'game.enemies=[',
    '{kind:"scout",x:490,y:480,r:25,hp:400,maxHp:400,score:20,color:"#fff",core:"#fff"},',
    '{kind:"scout",x:730,y:610,r:25,hp:50,maxHp:50,score:20,color:"#fff",core:"#fff"},',
    '{kind:"scout",x:1100,y:900,r:25,hp:50,maxHp:50,score:20,color:"#fff",core:"#fff"}',
    '];addMissile(350,480,1,11.5,{darkRedSpecial:true});',
    'Math.random=()=>0;updateMissiles(.15);'
  ].join("\n"));
  assert.equal(app.eval("game.missiles.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-55)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-48.85)<1e-8);
  assert.equal(app.eval("game.enemies[2].hp"),50);
  assert.equal(app.eval("game.pinkExplosions.length"),1);
  assert.equal(app.eval("game.pinkExplosions[0].darkRed"),true);
  assert.ok(app.eval("game.pinkExplosions[0].x")>350);
});

test("DARK RED 10x missile chains consume shields as distinct full hits, not an aggregated bypass", () => {
  const app=boot();
  const result=app.eval([
    '(() => {',
    'game.state="PLAYING";game.player.x=175;',
    'const shield=enemyBehaviors.initializeEnemy({kind:"shield",',
    'x:490,y:480,r:39,hp:400,maxHp:400,score:30,color:"#fff",core:"#fff"});',
    'game.enemies=[shield];const before=shield.shieldHp;',
    'addMissile(350,480,1,11.5,{darkRedSpecial:true});',
    'Math.random=()=>0;updateMissiles(.15);',
    'return {absorbed:before-shield.shieldHp,hullLoss:400-shield.hp,',
    'blast:game.pinkExplosions.length};',
    '})()'
  ].join("\n"));
  assert.ok(result.absorbed>0);
  assert.ok(result.hullLoss>0);
  assert.ok(Math.abs(result.absorbed+result.hullLoss-345)<1e-8);
  assert.equal(result.blast,1);
});

test("DARK RED missile Boss hull absorbs thirty 10x events; nearby enemies only get ordinary splash", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";',
    'game.boss={active:true,x:540,y:480,rx:100,ry:80,hp:1000,maxHp:1000,',
    'parts:[],color:"#fff",core:"#fff"};',
    'game.enemies=[{kind:"scout",x:750,y:640,r:20,hp:50,maxHp:50,',
    'score:20,color:"#fff",core:"#fff"}];',
    'addMissile(350,480,1,11.5,{darkRedSpecial:true});',
    'Math.random=()=>0;updateMissiles(.20);'
  ].join("\n"));
  assert.equal(app.eval("game.missiles.length"),0);
  assert.ok(Math.abs(app.eval("game.boss.hp")-655)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.85)<1e-8);
  assert.equal(app.eval("game.pinkExplosions[0].darkRed"),true);
});

test("DARK RED missile repeatedly hits only original Boss turret and stops on its destruction", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";spawnBoss();',
    'game.boss.active=true;game.boss.x=1010;game.boss.y=480;',
    'game.boss.hp=1000;game.boss.maxHp=1000;',
    'game.boss.parts[0].hp=1000;game.boss.parts[0].maxHp=1000;',
    'const turret=game.boss.parts[0];',
    'const tx=game.boss.x+turret.x,ty=game.boss.y+turret.y;',
    'addMissile(tx-30,ty,1,11.5,{darkRedSpecial:true});',
    'Math.random=()=>0;updateMissiles(.04);'
  ].join("\n"));
  assert.equal(app.eval("game.missiles.length"),0);
  const expected=11.5*30*bossParts.BALANCE.weakPointDamageScale;
  assert.ok(Math.abs(app.eval("game.boss.parts[0].hp")-(1000-expected))<1e-7);
  assert.equal(app.eval("game.boss.hp"),1000);
  assert.equal(app.eval("game.pinkExplosions.length"),1);
  // A one-hit weak-point break MUST NOT cascade the other 29 strikes into hull.
  app.eval([
    'game.boss.parts[1].hp=0;',
    'game.boss.parts[0].hp=5;game.boss.hp=1000;',
    'game.missiles=[];game.pinkExplosions=[];',
    'const part=game.boss.parts[0];',
    'addMissile(game.boss.x+part.x-30,game.boss.y+part.y,1,11.5,{darkRedSpecial:true});',
    'updateMissiles(.04);'
  ].join("\n"));
  assert.ok(app.eval("game.boss.parts[0].hp")<=0);
  assert.equal(app.eval("game.boss.hp"),
    1000-Math.ceil(1000*bossParts.BALANCE.hullDamageOnBreak));
});

test("DARK RED rocket killing a splitter cannot chain into spawned children or hit them with splash", () => {
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.enemies=[{kind:"splitter",x:490,y:480,r:35,hp:1,maxHp:1,',
    'score:60,color:"#fff",core:"#fff"}];',
    'addMissile(350,480,1,11.5,{darkRedSpecial:true});',
    'Math.random=()=>0;updateMissiles(.15);'
  ].join("\n"));
  assert.equal(app.eval("game.stats.kills"),1);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).length"),2);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).every(e=>e.hp===e.maxHp)"),true);
  assert.equal(app.eval("game.pinkExplosions.length"),1);
});

test("DARK RED missile uses PINK 100-unit silhouette with burgundy shell and crimson blast", () => {
  const app=boot();
  const result=app.eval([
    '(() => {',
    'game.state="PLAYING";',
    'addMissile(350,480,1,11.5,{darkRedSpecial:true});',
    'addMissile(350,500,1,28.75,{pinkSpecial:true});',
    'const fillColors=[],strokeColors=[],ringColors=[],radii=[];',
    'ctx.fill=()=>fillColors.push(ctx.fillStyle);',
    'ctx.strokeRect=()=>strokeColors.push(ctx.strokeStyle);',
    'ctx.stroke=()=>ringColors.push(ctx.strokeStyle);',
    'ctx.arc=(_x,_y,r)=>radii.push(r);',
    'drawMissiles();',
    'addPinkExplosion(420,480,true);drawPinkExplosions();',
    'return {radii,fillColors,strokeColors,ringColors,',
    '  radius:game.missiles[0].r,compare:game.missiles[1].r,',
    '  blastDarkRed:game.pinkExplosions[0].darkRed};',
    '})()'
  ].join("\n"));
  assert.equal(result.radius,50);
  assert.equal(result.radius,result.compare);
  assert.equal(result.blastDarkRed,true);
  assert.ok(result.fillColors.includes("#6b102e"));
  assert.ok(result.fillColors.includes("#030306"));
  assert.ok(result.strokeColors.includes("#ed5175"));
  assert.ok(result.ringColors.includes("#ed466e"));
  assert.ok(result.radii.includes(greenWeapon.RULES.radius));
});

test("DARK RED missile chain and splash do not change original PINK/YELLOW missile properties",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";',
    'addMissile(350,480,1,11.5,{darkRedSpecial:true});',
    'addMissile(350,480,1,28.75,{pinkSpecial:true});',
    'addMissile(350,480,1,2);'
  ].join("\n"));
  assert.equal(app.eval("game.missiles[0].r"),50);
  assert.equal(app.eval("game.missiles[1].r"),50);
  assert.equal(app.eval("game.missiles[2].r"),14);
  assert.equal(app.eval("game.missiles[0].power"),11.5);
  assert.equal(app.eval("game.missiles[1].power"),28.75);
  assert.equal(app.eval("game.missiles[2].power"),2);
});


test("RAINBOW P is the 15th collectible, recoverable, with a distinct 8-color icon and HUD",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="blue";game.redWeapon.stars=3;',
    'collectPowerup({type:"P_RAINBOW",x:320,y:480,life:1});',
    'game.weaponLevel=3;Math.random=()=>.52;firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"rainbow");
  assert.equal(app.eval("weaponMeta().name"),"PRISM");
  assert.equal(app.eval("game.bullets.length"),1);
  assert.equal(app.eval("game.bullets.every(b=>b.grayImpact)"),true);
  assert.equal(app.eval("game.redWeapon.stars"),3);
  assert.equal(app.eval("getFireCooldown()"),.15);
  app.eval('Math.random=()=>(14+.5)/POWER_TYPES.length');
  assert.equal(app.eval("randomPowerType()"),"P_RAINBOW");
  app.eval('game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_RAINBOW");
  const ui=app.eval([
    '(() => {const labels=[],colors=[];',
    'ctx.fillText=t=>labels.push(String(t));',
    'ctx.fillRect=(x,y,w,h)=>colors.push(ctx.fillStyle);',
    'game.powerups=[{type:"P_RAINBOW",x:400,y:460,t:0,life:10}];',
    'drawHud();drawPowerups();',
    'return {labels,colors};})()'
  ].join("\n"));
  assert.ok(ui.labels.includes("RAINBOW  7x13%  M9%"));
  assert.equal(ui.labels.some(x=>x.includes("RED P")),false);
  for(const color of ["#ff5372","#ffa443","#ffe465","#bcf542",
    "#65e9cf","#6bb7ff","#997bff","#f878dc"]) assert.ok(ui.colors.includes(color),color);
});


test("RAINBOW draws one independent effect per single-bullet firing action",()=>{
  const app=boot();
  app.eval([
    'game.weaponType="rainbow";Math.random=()=>.10;firePlayerWeapons();',
    'Math.random=()=>.20;firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets[0].rainbowKind"),"homing");
  assert.equal(app.eval("game.bullets[1].rainbowKind"),"slow");
  assert.equal(app.eval("game.bullets[0].rainbowHoming"),true);
  assert.equal(app.eval("game.bullets[1].blackSlow"),true);
  assert.equal(app.eval("game.bullets.every(b=>b.y===game.player.y)"),true);
  assert.equal(app.eval("game.missiles.length"),0);
});

test("RAINBOW held fire emits exactly one bullet every 0.15 active seconds, freezing while paused",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="rainbow";',
    'game.spawnTimer=999;game.formationTimer=999;game.stageIntro=0;',
    'game.invuln=999;keys.Space=true;Math.random=()=>.20;updatePlaying(.001);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),1);
  assert.equal(app.eval("game.fireCooldown"),.15);
  app.eval("updatePlaying(.07);updatePlaying(.079)");
  assert.equal(app.eval("game.bullets.length"),1);
  app.eval("updatePlaying(.002)");
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.fireCooldown"),.15);
  app.eval('game.state="PAUSED";updatePlaying(5)');
  assert.equal(app.eval("game.fireCooldown"),.15);
  assert.equal(app.eval("game.bullets.length"),2);
  app.eval('game.state="PLAYING";updatePlaying(.07);updatePlaying(.079)');
  assert.equal(app.eval("game.bullets.length"),2);
  app.eval("updatePlaying(.002)");
  assert.equal(app.eval("game.bullets.length"),3);
  assert.equal(app.eval("game.fireCooldown"),.15);
});

test("RAINBOW guided missile replaces its only shot and observes the same 0.15s interval",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="rainbow";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'keys.Space=true;Math.random=()=>.30;updatePlaying(.001);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.length"),1);
  assert.equal(app.eval("game.fireCooldown"),.15);
  app.eval("updatePlaying(.149)");
  assert.equal(app.eval("game.missiles.length"),1);
  app.eval("updatePlaying(.002)");
  assert.equal(app.eval("game.missiles.length"),2);
  assert.equal(app.eval("game.bullets.length"),0);
});

test("all eight RAINBOW probability bands create exactly the inherited shot types",()=>{
  const fixtures=[
    [.05,"homing","rainbowHoming"],
    [.20,"slow","blackSlow"],
    [.30,"missile","pinkSpecial"],
    [.40,"chain","darkRedChain"],
    [.55,"gray","grayImpact"],
    [.68,"conductive","whiteConductive"],
    [.80,"orbit","orbiting"],
    [.95,"blast","orangeBlast"]
  ];
  for(const [roll,kind,flag]of fixtures){
    const app=boot();
    app.eval('game.state="PLAYING";game.weaponType="rainbow";Math.random=()=>'+roll+';firePlayerWeapons()');
    const array=kind==="missile"?"game.missiles":"game.bullets";
    assert.equal(app.eval(array+".length"),1,kind);
    assert.equal(app.eval(array+'.every(s=>s.rainbowKind==="'+kind+'" && s.'+flag+')'),true,kind);
    assert.equal(app.eval(kind==="missile"?"game.bullets.length":"game.missiles.length"),0,kind);
    if(kind==="missile"){
      assert.ok(Math.abs(app.eval("game.missiles[0].power")-28.75)<1e-8);
      assert.equal(app.eval("game.missiles[0].r"),50);
    }
    if(kind==="orbit"){
      assert.equal(app.eval("game.bullets[0].x"),237);
      assert.equal(app.eval("game.bullets[0].y"),480);
    }
  }
});

test("RAINBOW yellow-guided bullet actually steers to moving/dead-replaced enemy",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="rainbow";Math.random=()=>.05;',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'game.enemies=[{kind:"scout",x:580,y:650,r:22,hp:50,maxHp:50,',
    'color:"#fff",core:"#eee",score:20}];',
    'updatePlayerBullets(.05);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets[0].rainbowKind"),"homing");
  assert.ok(app.eval("game.bullets[0].y")>470);
  assert.ok(Math.abs(app.eval("Math.hypot(game.bullets[0].vx,game.bullets[0].vy)")-pinkWeapon.RULES.bulletSpeed)<1e-8);
  app.eval('game.enemies=[];const old=game.bullets[0].vy;updatePlayerBullets(.05);');
  assert.ok(app.eval("game.bullets[0].y")>470);
  assert.equal(app.eval("game.bullets[0].life")>0,true);
});

test("RAINBOW BLACK shot applies the original 5s/50% slow through actual contact",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="rainbow";Math.random=()=>.20;',
    'game.enemies=[{kind:"scout",x:400,y:470,r:24,hp:50,maxHp:50,',
    'color:"#fff",core:"#eee",score:20}];',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.2);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.85)<1e-8);
  assert.equal(app.eval("game.enemies[0].slowRemaining"),blackWeapon.RULES.duration);
  assert.equal(app.eval("blackRules.isSlowed(game.enemies[0])"),true);
});

test("RAINBOW DARK RED projectile repeats up to 30 full-strength 50%-chain hits",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="rainbow";Math.random=()=>.40;',
    'game.enemies=[{kind:"scout",x:400,y:470,r:24,hp:1000,maxHp:1000,',
    'color:"#fff",core:"#eee",score:20}];',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'Math.random=()=>0;updatePlayerBullets(.20);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-(1000-30*1.15))<1e-8);
  assert.equal(app.eval("game.missiles.length"),0,
    "RAINBOW DARK RED chain must not also roll its 5% missile bonus");
});

test("RAINBOW GRAY projectile preserves mutually exclusive stun versus boosted damage",()=>{
  const setup=(outcome)=>{
    const app=boot();
    app.eval([
      'game.state="PLAYING";game.weaponType="rainbow";Math.random=()=>.55;',
      'game.enemies=[{kind:"scout",x:400,y:470,r:24,hp:50,maxHp:50,',
      'color:"#fff",core:"#eee",score:20}];',
      'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);'
    ].join("\n"));
    app.eval('Math.random=()=>'+outcome+';updatePlayerBullets(.20)');
    return app;
  };
  const stunned=setup(.23);
  assert.equal(stunned.eval("game.enemies[0].grayStunRemaining"),grayWeapon.RULES.stunSeconds);
  assert.ok(Math.abs(stunned.eval("game.enemies[0].hp")-48.85)<1e-8);
  const amplified=setup(.80);
  assert.equal(amplified.eval("grayRules.isStunned(game.enemies[0])"),false);
  assert.ok(Math.abs(amplified.eval("game.enemies[0].hp")-(50-1.15*1.5))<1e-8);
});

test("RAINBOW WHITE projectile pierces and deals source WHITE 60%-conductive splash",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="rainbow";Math.random=()=>.68;',
    'game.enemies=[',
    ' {kind:"scout",x:400,y:470,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    ' {kind:"scout",x:680,y:470,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}',
    '];firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'Math.random=()=>.99;updatePlayerBullets(.20);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),1);
  assert.equal(app.eval("game.bullets[0].rainbowKind"),"conductive");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.85)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-(50-1.15*.60))<1e-8);
  assert.equal(app.eval("game.bullets[0].hitEnemies.length"),2);
  assert.ok(app.eval("game.electricArcs.length")>=2);
});

test("RAINBOW LIME-type projectile flies from muzzle into 360 orbit and persists on swap",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="rainbow";Math.random=()=>.80;',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'game.player.x=225;game.player.y=530;updatePlayerBullets(.5);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),1);
  assert.ok(Math.abs(app.eval("Math.hypot(game.bullets[0].x-game.player.x,game.bullets[0].y-game.player.y)")-360)<1e-8);
  assert.equal(app.eval("game.bullets[0].rainbowKind"),"orbit");
  app.eval('collectPowerup({type:"P_BLUE",x:300,y:480,life:1});updatePlayerBullets(.10)');
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.bullets[0].orbiting"),true);
  assert.equal(app.eval("game.bullets[0].rainbowKind"),"orbit");
});

test("RAINBOW ORANGE-type projectile explodes 1.6x once at radius 100",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="rainbow";Math.random=()=>.95;',
    'game.enemies=[',
    ' {kind:"scout",x:400,y:470,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    ' {kind:"scout",x:480,y:470,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    ' {kind:"scout",x:540,y:470,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}',
    '];firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.2);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-48.16)<1e-8);
  assert.equal(app.eval("game.enemies[2].hp"),50);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
});

test("RAINBOW 9% missile replaces a bullet and uses PINK 25x direct plus 1x 360 AoE",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="rainbow";Math.random=()=>.30;',
    'firePlayerWeapons();game.missiles=game.missiles.slice(0,1);',
    'game.enemies=[',
    ' {kind:"scout",x:490,y:480,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    ' {kind:"scout",x:790,y:480,r:25,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}',
    '];',
    'game.missiles[0].x=350;game.missiles[0].y=480;game.missiles[0].vy=0;',
    'updateMissiles(.15);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-71.25)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-48.85)<1e-8);
  assert.equal(app.eval("game.pinkExplosions.length"),1);
});

test("RAINBOW source projectiles retain original damage/target effects after switching to RED",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="rainbow";game.redWeapon.stars=4;',
    'Math.random=()=>.20;firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'collectPowerup({type:"P_RED",x:280,y:480,life:1});',
    'game.enemies=[{kind:"scout",x:400,y:470,r:24,hp:50,maxHp:50,',
    'score:20,color:"#fff",core:"#eee"}];',
    'updatePlayerBullets(.2);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"red");
  assert.equal(app.eval("game.redWeapon.stars"),4);
  assert.equal(app.eval("game.enemies[0].slowRemaining"),blackWeapon.RULES.duration);
});

test("RAINBOW missile projectile choice never adds ordinary or DARK RED bonus missiles",()=>{
  const app=boot();
  app.eval('game.weaponType="rainbow";Math.random=()=>.30;firePlayerWeapons()');
  assert.equal(app.eval("game.missiles.length"),1);
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.every(m=>m.pinkSpecial&&!m.darkRedSpecial)"),true);
  assert.equal(app.eval("game.missiles.every(m=>Math.abs(m.power-28.75)<1e-8&&m.r===50)"),true);
});


test("MAGNET is the 16th P, keeps starter dual-shot cadence and gradient UI",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="blue";game.redWeapon.stars=4;',
    'collectPowerup({type:"P_MAGNET",x:200,y:400,life:1});',
    'game.weaponLevel=3;firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"magnet");
  assert.equal(app.eval("weaponMeta().name"),"MAGNET");
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.magneticShot && b.power===1.15)"),true);
  assert.equal(app.eval("game.redWeapon.stars"),4);
  assert.ok(Math.abs(app.eval("getFireCooldown()")-.101)<1e-10);
  const colors=app.eval([
    '(()=>{const colors=[];',
    'ctx.createLinearGradient=()=>({addColorStop:(p,c)=>colors.push(c)});',
    'game.powerups=[{type:"P_MAGNET",x:500,y:460,t:0,life:10}];',
    'drawPowerups();drawPlayerBullets();',
    'return colors;})()'
  ].join("\n"));
  assert.ok(colors.includes("#ff4568"));
  assert.ok(colors.includes("#a9e8ff"));
  assert.ok(colors.includes("#ff4267"));
  const labels=app.eval([
    '(()=>{const labels=[];ctx.fillText=s=>labels.push(String(s));',
    'drawHud();return labels;})()'
  ].join("\n"));
  assert.ok(labels.includes("MAGNET 10%  R360  2.0S"));
  app.eval('game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_MAGNET");
});

test("MAGNET 10% procs exactly once on real swept enemy hit and not on launch",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="magnet";Math.random=()=>.099999;',
    'game.enemies=[{kind:"scout",x:400,y:470,r:25,hp:100,maxHp:100,',
    'score:20,color:"#fff",core:"#eee"}];',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);'
  ].join("\n"));
  assert.equal(app.eval("game.magneticFields.length"),0);
  app.eval("updatePlayerBullets(.16)");
  assert.equal(app.eval("game.magneticFields.length"),1);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-8);
  assert.ok(app.eval("game.magneticFields[0].x")>360 &&
    app.eval("game.magneticFields[0].x")<400);
  assert.equal(app.eval("game.magneticFields[0].y"),470);
  assert.equal(app.eval("game.magneticFields[0].remaining"),2);
  app.eval([
    'game.magneticFields=[];game.bullets=[];',
    'game.enemies[0].hp=100;Math.random=()=>.1;',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.16);'
  ].join("\n"));
  assert.equal(app.eval("game.magneticFields.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-8);
});

test("MAGNET shot still procs on fully shield-absorbed enemy contact",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="magnet";Math.random=()=>0;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",',
    'x:415,y:470,r:39,hp:100,maxHp:100,score:20,color:"#aaf",core:"#fff"})];',
    'game.enemies[0].shieldHp=30;game.enemies[0].shieldMax=30;',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.18);'
  ].join("\n"));
  assert.equal(app.eval("game.magneticFields.length"),1);
  assert.equal(app.eval("game.enemies[0].hp"),100);
  assert.ok(app.eval("game.enemies[0].shieldHp")<30);
});

test("MAGNET works on living Boss turret or hull without double triggering",()=>{
  for (const part of [true,false]) {
    const app=boot();
    app.eval([
      'game.state="PLAYING";game.stageMode="BOSS";',
      'game.weaponType="magnet";Math.random=()=>0;',
      'game.boss={active:true,x:510,y:470,rx:85,ry:75,hp:150,',
      'maxHp:150,parts:'+ (part?'[{id:"TURRET",x:-147,y:0,r:24,hp:50,maxHp:50}]':'[]')+',',
      'color:"#ff7"};',
      'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
      'updatePlayerBullets(.29);'
    ].join("\n"));
    assert.equal(app.eval("game.magneticFields.length"),1);
    assert.ok(app.eval("game.magneticFields[0].x")>300);
    if (part) assert.ok(app.eval("game.boss.parts[0].hp")<50);
    else assert.ok(app.eval("game.boss.hp")<150);
  }
});

test("MAGNET pulls distant enemies at 100/s rather than stacking natural enemy speed",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'game.enemies=[{kind:"scout",x:1000,y:500,r:24,hp:50,maxHp:50,',
    'vx:-300,vy:0,t:0,wave:0,shootCd:999,shootBase:999,',
    'score:10,color:"#fff",core:"#fff"}];',
    'game.magneticFields=[magnetRules.createField(200,500,1.15)];',
    'updatePlaying(.5);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].x")-950)<1e-8);
  assert.equal(app.eval("game.magneticFields[0].remaining"),1.5);
  app.eval('game.state="PAUSED";updatePlaying(10)');
  assert.equal(app.eval("game.enemies[0].x"),950);
  assert.equal(app.eval("game.magneticFields[0].remaining"),1.5);
  app.eval('game.state="PLAYING";updatePlaying(.5)');
  assert.ok(Math.abs(app.eval("game.enemies[0].x")-900)<1e-8);
  assert.equal(app.eval("game.magneticFields[0].remaining"),1);
});

test("MAGNET attraction respects BLACK 50% slow and GRAY stun, including zigzag recovery",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.enemies=[{kind:"zigzag",x:800,y:480,baseY:480,r:20,',
    'hp:100,maxHp:100,vx:-300,vy:0,t:0,wave:0,',
    'shootCd:999,shootBase:999,slowRemaining:5,',
    'score:10,color:"#fff",core:"#fff"}];',
    'game.magneticFields=[magnetRules.createField(200,480,1.15)];',
    'updateEnemies(1);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].x")-750)<1e-8);
  assert.ok(Math.abs(app.eval(
    "game.enemies[0].baseY+Math.sin(game.enemies[0].t*5.2+game.enemies[0].wave)*120-game.enemies[0].y"
  ))<1e-8);
  app.eval('game.enemies[0].grayStunRemaining=.5;updateEnemies(.5)');
  assert.equal(app.eval("game.enemies[0].x"),750);
  app.eval('game.magneticFields=[];updateEnemies(.001)');
  assert.ok(Math.abs(app.eval(
    "game.enemies[0].baseY+Math.sin(game.enemies[0].t*5.2+game.enemies[0].wave)*120-game.enemies[0].y"
  ))<1e-8);
});

test("MAGNET waits two active seconds and deals N*0.6 to each in-circle enemy only",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.enemies=[',
    ' {kind:"scout",x:520,y:480,r:20,hp:100,maxHp:100,',
    'score:5,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:740,y:480,r:20,hp:100,maxHp:100,',
    'score:5,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:1100,y:480,r:20,hp:100,maxHp:100,',
    'score:5,color:"#fff",core:"#fff"}];',
    'game.magneticFields=[magnetRules.createField(500,480,1.15)];',
    'updateMagneticFields(1.999);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),100);
  assert.equal(app.eval("game.enemies[1].hp"),100);
  app.eval("updateMagneticFields(.001)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.62)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-98.62)<1e-8);
  assert.equal(app.eval("game.enemies[2].hp"),100);
  assert.equal(app.eval("game.magneticFields.length"),0);
  assert.equal(app.eval("game.magneticBursts.length"),1);
  app.eval("updateMagneticFields(1)");
  assert.equal(app.eval("game.enemies[0].hp"),app.eval("game.enemies[1].hp"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.62)<1e-8);
});

test("MAGNET blast includes one Boss hull as one target, not its turrets",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";',
    'game.enemies=[{kind:"scout",x:750,y:480,r:20,hp:100,maxHp:100,',
    'score:5,color:"#fff",core:"#fff"}];',
    'game.boss={active:true,x:1000,y:480,rx:140,ry:100,',
    'hp:100,maxHp:100,parts:[{id:"GUN",x:-100,y:0,r:20,hp:30,maxHp:30}],',
    'color:"#fff",core:"#eee"};',
    'game.magneticFields=[magnetRules.createField(730,480,1.15)];',
    'updateMagneticFields(2);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.boss.hp")-98.62)<1e-8);
  assert.equal(app.eval("game.boss.parts[0].hp"),30);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.62)<1e-8);
});

test("MAGNET fields survive weapon change, obey caps and never proc from blast or drawing",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.weaponType="magnet";Math.random=()=>0;',
    'game.enemies=[{kind:"scout",x:400,y:470,r:24,hp:100,maxHp:100,',
    'score:5,color:"#fff",core:"#fff"}];',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.17);',
    'collectPowerup({type:"P_BLUE",x:300,y:480,life:1});'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.magneticFields.length"),1);
  const old=app.eval("game.enemies[0].hp");
  app.eval("drawMagneticFields();drawFrame(.016)");
  assert.equal(app.eval("game.enemies[0].hp"),old);
  app.eval("updateMagneticFields(2)");
  assert.equal(app.eval("game.magneticFields.length"),0);
  assert.ok(app.eval("game.enemies[0].hp")<old);
  assert.equal(app.eval("game.magneticBursts.length"),1);
  app.eval([
    'game.magneticFields=Array.from({length:8},()=>magnetRules.createField(500,480,1.15));',
    'game.weaponType="magnet";game.bullets=[];firePlayerWeapons();',
    'game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.17);'
  ].join("\n"));
  assert.equal(app.eval("game.magneticFields.length"),8);
  app.eval("spawnBoss()");
  assert.equal(app.eval("game.magneticFields.length"),0);
});

test("MAGNET Boss attraction is capped to arena and resumes scripted movement smoothly",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";',
    'game.boss={active:true,x:950,y:480,targetX:950,pattern:0,',
    'hp:500,maxHp:500,rx:130,ry:100,parts:[],',
    'phase:0,lastPhase:0,t:0,shoot:999,warning:0,',
    'color:"#fff",core:"#eee"};',
    'game.magneticFields=[magnetRules.createField(900,150,1.15)];',
    'updateBoss(1);'
  ].join("\n"));
  const after=app.eval("({x:game.boss.x,y:game.boss.y})");
  assert.ok(after.x>=890 && after.x<=1155);
  assert.ok(after.y>=145 && after.y<=815);
  assert.ok(Math.hypot(after.x-950,after.y-480)<=100+1e-8);
  app.eval("game.magneticFields=[];updateBoss(.016)");
  assert.ok(Math.hypot(app.eval("game.boss.x")-after.x,app.eval("game.boss.y")-after.y)<30);
});


test("ARC LASER pickup is gated to BROWN: wrong color cannot consume or level it",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="blue";game.weaponLevel=1;',
    'game.powerups=[{type:"P_ARC_LASER",x:175,y:480,r:24,life:30,',
    'vx:0,vy:0,t:0,safeTimer:0}];updatePowerups(.01);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.weaponLevel"),1);
  assert.equal(app.eval("game.powerups.length"),1);
  assert.ok(app.eval('game.message.includes("REQUIRES BROWN P")'));
  const hint=app.eval("game.messageTimer");
  app.eval('updatePowerups(.01)');
  assert.ok(app.eval("game.messageTimer")<=hint,
    "locked pickup must not continually retrigger hint");
  app.eval('collectPowerup({type:"P_BROWN",x:200,y:480,life:1});');
  assert.equal(app.eval("game.weaponType"),"brown");
  app.eval("updatePowerups(.01)");
  assert.equal(app.eval("game.weaponType"),"arcLaser");
  assert.equal(app.eval("game.powerups.length"),0);
  assert.equal(app.eval("weaponMeta().name"),"PIERCING ARC");
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("game.bullets.length"),0);
  app.eval('firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"),0);
  app.eval('game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_ARC_LASER");
  app.eval('collectPowerup({type:"P_ARC_LASER",x:200,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"arcLaser");
  app.eval('collectPowerup({type:"P_BLUE",x:200,y:480,life:1})');
  app.eval('const locked={type:"P_ARC_LASER",x:200,y:480,life:8};collectPowerup(locked);game.lockedLife=locked.life');
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.lockedLife"),8);
});

test("ARC LASER pierces aligned targets and conducts 60% to an off-ray victim only once",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="arcLaser";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[',
    ' {kind:"scout",x:460,y:480,r:25,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:740,y:480,r:25,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:600,y:635,r:22,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:1200,y:900,r:22,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"}',
    '];Math.random=()=>.99;updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.length"),0);
  assert.equal(app.eval("game.brownBeam.arcLaser"),true);
  assert.ok(app.eval("game.brownBeam.x")>1280);
  assert.equal(app.eval("game.brownBeam.hits.length"),2);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-98.85)<1e-8,
    "rear direct beam target must not be downgraded to 0.6x");
  assert.ok(Math.abs(app.eval("game.enemies[2].hp")-99.31)<1e-8,
    "off-ray neighbor must get exactly one secondary hit");
  assert.equal(app.eval("game.enemies[3].hp"),100);
  assert.ok(app.eval("game.electricArcs.length")>=1);
  app.eval('game.weaponType="brown";brownRules.reset(game.brownWeapon);updateBrownLaser(.101,true)');
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-97.7)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-98.85)<1e-8);
});

test("ARC LASER every held-fire tick does full direct hits, no shots, and pauses cleanly",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="arcLaser";',
    'game.spawnTimer=999;game.formationTimer=999;',
    'game.enemies=[{kind:"scout",x:600,y:480,r:25,hp:100,',
    'maxHp:100,vx:0,vy:0,t:0,wave:0,shootCd:999,shootBase:999,',
    'score:30,color:"#fff",core:"#fff"}];',
    'keys.Space=true;updatePlaying(.06);updatePlaying(.05);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-8);
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.length"),0);
  app.eval('game.state="PAUSED";updatePlaying(3)');
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-8);
  app.eval('game.state="PLAYING";game.stageMode="WAVE";updatePlaying(.101)');
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-97.7)<1e-8);
  app.eval('keys.Space=false;updatePlaying(.01)');
  assert.equal(app.eval("game.brownBeam"),null);
  assert.equal(app.eval("game.brownWeapon.elapsed"),0);
});

test("ARC LASER front shield and Boss weak point share WHITE electric victim ledger",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="arcLaser";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",',
    'x:450,y:480,r:39,hp:100,maxHp:100,score:50,color:"#abf",core:"#fff"})];',
    'game.boss={active:true,x:900,y:480,rx:120,ry:90,',
    'hp:200,maxHp:200,color:"#fff",core:"#eee",',
    'parts:[{id:"GUN",x:-155,y:0,r:28,hp:100,maxHp:100}]}',
    ';Math.random=()=>.99;updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),100);
  assert.ok(app.eval("game.enemies[0].shieldHp")<app.eval("game.enemies[0].shieldMax"));
  assert.equal(app.eval("game.boss.hp"),200);
  assert.ok(Math.abs(app.eval("game.boss.parts[0].hp")-(100-1.15*bossParts.BALANCE.weakPointDamageScale))<1e-8);
  app.eval('game.boss.parts[0].hp=0;updateBrownLaser(.101,true)');
  assert.ok(Math.abs(app.eval("game.boss.hp")-198.85)<1e-8);
  assert.equal(app.eval("game.boss.parts[0].hp"),0);
});

test("ARC LASER gradients draw its pickup and beam without mutating health",()=>{
  const app=boot();
  const view=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.weaponType="arcLaser";game.enemies=[{kind:"scout",x:560,y:480,',
    'r:25,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"}];',
    'game.powerups=[{type:"P_ARC_LASER",x:500,y:600,t:0,life:10}];',
    'const stops=[];ctx.createLinearGradient=()=>({addColorStop:(pos,c)=>stops.push(c)});',
    'updateBrownLaser(.04,true);const before=game.enemies[0].hp;',
    'drawPowerups();drawBrownLaser();drawFrame(.016);',
    'return {stops,before,after:game.enemies[0].hp};})()'
  ].join("\n"));
  assert.ok(view.stops.includes("#8bdfff"));
  assert.ok(view.stops.includes("#ffffff"));
  assert.ok(view.stops.includes("#8cddff"));
  assert.equal(view.before,view.after);
});

test("STASIS P basic twin bullets and BOMB immediately clears missiles and freezes all enemies",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="stasis";',
    'game.spawnTimer=999;game.formationTimer=999;',
    'game.enemies=[{kind:"scout",x:800,y:480,r:25,hp:100,maxHp:100,',
    'vx:-300,vy:0,t:0,wave:0,shootCd:.01,shootBase:.1,',
    'score:30,color:"#fff",core:"#fff"}];',
    'game.enemyBullets=[{x:350,y:480,vx:-400,vy:0,r:10,life:4}];',
    'game.weaponLevel=3;firePlayerWeapons();useBomb();'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.stasisShot&&b.power===1.15)"),true);
  assert.equal(app.eval("game.bomb"),1);
  assert.equal(app.eval("game.enemyBullets.length"),0);
  assert.equal(app.eval("game.stasisRemaining"),3);
  assert.equal(app.eval("game.enemies[0].hp"),28);
  const x=app.eval("game.enemies[0].x");
  const shoot=app.eval("game.enemies[0].shootCd");
  app.eval("updatePlaying(1)");
  assert.equal(app.eval("game.enemies[0].x"),x);
  assert.equal(app.eval("game.enemies[0].shootCd"),shoot);
  assert.equal(app.eval("game.enemyBullets.length"),0);
  assert.equal(app.eval("game.stasisRemaining"),2);
  app.eval('spawnEnemyOfKind("scout",950,500,{vx:-280,shootCd:0});updatePlaying(.5)');
  assert.equal(app.eval("game.enemies[1].x"),950);
  assert.equal(app.eval("game.enemyBullets.length"),0);
  assert.equal(app.eval("game.stasisRemaining"),1.5);
  app.eval("updatePlaying(1.5)");
  assert.equal(app.eval("game.stasisRemaining"),0);
  assert.equal(app.eval("game.enemies[0].x"),x);
  app.eval("updatePlaying(.1)");
  assert.ok(app.eval("game.enemies[0].x")<x);
});

test("STASIS BOMB keeps Boss phase/shoot/freeze clocks and clears bullets in Boss Rush",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.mode="bossRush";',
    'game.weaponType="stasis";',
    'game.boss={active:true,x:950,y:480,targetX:950,',
    'rx:120,ry:95,hp:500,maxHp:500,pattern:0,',
    'parts:[],color:"#fff",core:"#eee",t:1,shoot:.01,',
    'phase:0,lastPhase:0,warning:.2};',
    'game.enemyBullets=[{x:400,y:400,life:2}];',
    'useBomb();'
  ].join("\n"));
  assert.equal(app.eval("game.stasisRemaining"),3);
  assert.equal(app.eval("game.enemyBullets.length"),0);
  const before=app.eval("({x:game.boss.x,y:game.boss.y,t:game.boss.t,shoot:game.boss.shoot,warning:game.boss.warning})");
  app.eval('updatePlaying(1);updatePlaying(1);updatePlaying(1)');
  assert.equal(app.eval("game.stasisRemaining"),0);
  assert.equal(app.eval("game.boss.x"),before.x);
  assert.equal(app.eval("game.boss.y"),before.y);
  assert.equal(app.eval("game.boss.t"),before.t);
  assert.equal(app.eval("game.boss.shoot"),before.shoot);
  assert.equal(app.eval("game.boss.warning"),before.warning);
  assert.equal(app.eval("game.enemyBullets.length"),0);
  app.eval("updatePlaying(.1)");
  assert.ok(app.eval("game.boss.t")>before.t);
});

test("STASIS BOMB freeze survives weapon changes and pauses/transitions, but not empty bomb",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="stasis";',
    'game.enemies=[{kind:"scout",x:800,y:480,r:24,hp:100,maxHp:100,',
    'vx:-200,vy:0,t:0,wave:0,shootCd:3,shootBase:3,',
    'color:"#fff",core:"#eee"}];useBomb();',
    'collectPowerup({type:"P_BLUE",x:300,y:480,life:1});'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.stasisRemaining"),3);
  app.eval('game.state="PAUSED";updatePlaying(10)');
  assert.equal(app.eval("game.stasisRemaining"),3);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=10;updatePlaying(1)');
  assert.equal(app.eval("game.stasisRemaining"),3);
  app.eval('game.stageMode="WAVE";updatePlaying(.5)');
  assert.equal(app.eval("game.stasisRemaining"),2.5);
  app.eval('game.weaponType="stasis";useBomb()');
  assert.equal(app.eval("game.stasisRemaining"),3);
  app.eval('game.bomb=0;game.stasisRemaining=0;useBomb()');
  assert.equal(app.eval("game.stasisRemaining"),0);
});

test("STASIS stops all enemy bullet creation and disposes even newly injected bullets",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.stasisRemaining=3;',
    'game.enemies=[{kind:"scout",x:740,y:480,r:20,hp:100,maxHp:100,',
    'vx:-200,vy:0,t:0,wave:0,shootCd:0,shootBase:.2,',
    'color:"#fff",core:"#eee"}];',
    'fireEnemy(game.enemies[0]);',
    'fireBossBullet(950,480,Math.PI,500,10,"#fff","#fff");',
    'game.enemyBullets=[{x:560,y:480,vx:-400,vy:0,r:10,life:5}];',
    'updateEnemyBullets(.1);'
  ].join("\n"));
  assert.equal(app.eval("game.enemyBullets.length"),0);
  const before=app.eval("game.enemies[0].x");
  app.eval("updateEnemies(2)");
  assert.equal(app.eval("game.enemies[0].x"),before);
});

test("normal non-STASIS BOMB retains original damage and clears bullets without freeze",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="blue";',
    'game.enemies=[{kind:"scout",x:700,y:480,r:24,hp:100,maxHp:100,',
    'color:"#fff",core:"#fff",score:30}];',
    'game.enemyBullets=[{x:400,y:460,life:3}];useBomb();'
  ].join("\n"));
  assert.equal(app.eval("game.bomb"),1);
  assert.equal(app.eval("game.stasisRemaining"),0);
  assert.equal(app.eval("game.enemies[0].hp"),28);
  assert.equal(app.eval("game.enemyBullets.length"),0);
});

test("STASIS freeze HUD, timed rings and black-white pickups are cosmetic only",()=>{
  const app=boot();
  const image=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.weaponType="stasis";game.stasisRemaining=2.1;',
    'game.enemies=[{kind:"scout",x:680,y:480,r:24,hp:100,maxHp:100,',
    'score:20,color:"#fff",core:"#fff"}];',
    'game.powerups=[{type:"P_STASIS",x:400,y:640,t:0,life:10}];',
    'const labels=[],stops=[];',
    'ctx.fillText=s=>labels.push(String(s));',
    'ctx.createLinearGradient=()=>({addColorStop:(p,c)=>stops.push(c)});',
    'const hp=game.enemies[0].hp;',
    'drawPowerups();drawStasisFreeze();drawHud();drawFrame(.016);',
    'return {hp,before:game.enemies[0].hp,labels,stops};})()'
  ].join("\n"));
  assert.equal(image.hp,image.before);
  assert.ok(image.labels.includes("STASIS BOMB  FREEZE 3S"));
  assert.ok(image.labels.includes("STASIS 2.1S"));
  assert.ok(image.stops.includes("#020408"));
  assert.ok(image.stops.includes("#ffffff"));
});

test("STASIS freeze is cleared when defeated Boss hands off to next stage",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'spawnBoss();game.boss.active=true;',
    'game.stasisRemaining=2.7;game.boss.hp=0;',
    'killBoss();'
  ].join("\n"));
  assert.equal(app.eval("game.boss"),null);
  assert.equal(app.eval("game.stageMode"),"BOSS_REWARD");
  assert.equal(app.eval("game.stasisRemaining"),0);
  app.eval("game.stasisRemaining=1.5;finishBossReward()");
  assert.equal(app.eval("game.stasisRemaining"),0);
});


test("ECLIPSE pickup requires DARK RED, is not consumed on RED, and upgrades after equip",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="red";game.weaponLevel=1;',
    'game.powerups=[{type:"P_ECLIPSE",x:175,y:480,r:24,life:30,',
    'vx:0,vy:0,t:0,safeTimer:0}];updatePowerups(.01);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"red");
  assert.equal(app.eval("game.weaponLevel"),1);
  assert.equal(app.eval("game.powerups.length"),1);
  assert.ok(app.eval('game.message.includes("REQUIRES DARK RED P")'));
  app.eval('collectPowerup({type:"P_DARK_RED",x:200,y:480,life:1});');
  assert.equal(app.eval("game.weaponType"),"darkred");
  app.eval("updatePowerups(.01)");
  assert.equal(app.eval("game.weaponType"),"eclipse");
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("game.powerups.length"),0);
  assert.equal(app.eval("weaponMeta().name"),"SHOCKWAVE");
  assert.equal(app.eval("getFireCooldown()"),.1);
  app.eval('game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_ECLIPSE");
  app.eval('collectPowerup({type:"P_ECLIPSE",x:200,y:480,life:1});');
  assert.equal(app.eval("game.weaponType"),"eclipse");
  app.eval('collectPowerup({type:"P_BLUE",x:200,y:480,life:1});');
  app.eval('const locked={type:"P_ECLIPSE",x:200,y:480,life:8};collectPowerup(locked);game.lockedLife=locked.life');
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.lockedLife"),8);
});

test("ECLIPSE firing emits exactly one player-anchored 360 wave, never DARK RED bullets or missiles",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="eclipse";',
    'game.player.x=500;game.player.y=480;game.weaponLevel=3;',
    'firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.shockwaves.length"),1);
  assert.equal(app.eval("game.shockwaves[0].x"),500);
  assert.equal(app.eval("game.shockwaves[0].y"),480);
  assert.equal(app.eval("game.shockwaves[0].power"),1.15);
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.length"),0);
  assert.equal(app.eval("game.shockwaves[0].radius"),0);
  app.eval('game.combat.energy=100;activateOverdrive();game.weaponType="eclipse";firePlayerWeapons()');
  assert.ok(app.eval("game.shockwaves[1].power")>1.15);
  assert.equal(app.eval("game.bullets.length"),0);
});

test("ECLIPSE traverses every compass direction, penetrates all enemies and cannot repeat-hit",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="eclipse";',
    'game.player.x=500;game.player.y=480;',
    'game.enemies=[',
    ' {kind:"scout",x:900,y:480,r:24,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:100,y:480,r:24,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:500,y:880,r:24,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:500,y:80,r:24,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:800,y:780,r:24,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:1180,y:800,r:24,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"}',
    '];firePlayerWeapons();updateShockwaves(.43);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies.length"),6);
  assert.ok(app.eval("game.enemies.slice(0,5).every(e=>Math.abs(e.hp-98.85)<1e-8)"));
  assert.equal(app.eval("game.enemies[5].hp"),100);
  app.eval('updateShockwaves(.25)');
  assert.ok(app.eval("game.enemies.every(e=>Math.abs(e.hp-98.85)<1e-8)"));
  assert.equal(app.eval("game.shockwaves[0].hitEnemies.length"),6);
  app.eval("updateShockwaves(.5)");
  assert.equal(app.eval("game.shockwaves.length"),0);
  assert.ok(app.eval("game.enemies.every(e=>Math.abs(e.hp-98.85)<1e-8)"));
});

test("ECLIPSE honors frontal shield and hits Boss weakpoint exactly once",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="eclipse";',
    'game.player.x=200;game.player.y=480;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",x:650,y:480,',
    'r:39,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"})];',
    'game.enemies[0].shieldHp=30;game.enemies[0].shieldMax=30;',
    'firePlayerWeapons();updateShockwaves(.32);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),100);
  assert.ok(app.eval("game.enemies[0].shieldHp")<30);
  app.eval([
    'game.shockwaves=[];game.enemies=[];',
    'game.stageMode="BOSS";',
    'game.boss={active:true,x:900,y:480,rx:120,ry:95,hp:300,maxHp:300,',
    'parts:[{id:"GUN",x:-155,y:0,r:28,hp:100,maxHp:100}],',
    'color:"#fff",core:"#eee"};',
    'firePlayerWeapons();updateShockwaves(.4);'
  ].join("\n"));
  const partHp=app.eval("game.boss.parts[0].hp");
  assert.ok(Math.abs(partHp-(100-1.15*bossParts.BALANCE.weakPointDamageScale))<1e-8);
  assert.equal(app.eval("game.boss.hp"),300);
  app.eval('updateShockwaves(.3)');
  assert.equal(app.eval("game.boss.parts[0].hp"),partHp);
  assert.equal(app.eval("game.boss.hp"),300);
});

test("ECLIPSE wave persists after weapon swap, pause freezes it, stage transition clears it",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="eclipse";',
    'game.player.x=500;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:100,y:480,r:25,hp:20,maxHp:20,',
    'score:10,color:"#fff",core:"#fff"}];firePlayerWeapons();',
    'collectPowerup({type:"P_BLUE",x:200,y:480,life:1});'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.shockwaves.length"),1);
  app.eval('game.state="PAUSED";updatePlaying(12)');
  assert.equal(app.eval("game.shockwaves[0].radius"),0);
  app.eval('game.state="PLAYING";updateShockwaves(.27)');
  assert.ok(app.eval("game.enemies[0].hp")<20);
  app.eval('game.stageMode="WAVE";spawnBoss()');
  assert.equal(app.eval("game.shockwaves.length"),0);
});

test("RECRUIT P fires twin gradient bullets and converts only after the enemy is truly killed",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="recruit";',
    'game.player.x=175;game.player.y=480;game.weaponLevel=3;',
    'game.enemies=[{kind:"scout",x:430,y:470,r:24,hp:3,maxHp:3,',
    'score:30,color:"#ff3c7e",core:"#fff"}];',
    'firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.recruitShot&&b.power===1.15)"),true);
  assert.ok(Math.abs(app.eval("getFireCooldown()")-.101)<1e-10);
  assert.equal(app.eval("game.allies.length"),0);
  app.eval("updatePlayerBullets(.2)");
  assert.equal(app.eval("game.enemies[0].hp")>0,true);
  assert.equal(app.eval("game.allies.length"),0);
  app.eval("game.bullets=[];firePlayerWeapons();updatePlayerBullets(.2)");
  assert.equal(app.eval("game.enemies[0].hp")<=0,true);
  assert.equal(app.eval("game.allies.length"),1);
  assert.equal(app.eval("game.allies[0].kind"),"scout");
  assert.equal(app.eval("game.allies[0].friendly"),true);
  assert.equal(app.eval("game.allies[0].color"),"#ff80d8");
  assert.equal(app.eval("game.stats.kills"),1);
  assert.ok(app.eval("game.score")>0);
  app.eval("game.bullets=[];game.powerups=[];game.weaponLevel=3;dropPlayerPowerOnHit()");
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_RECRUIT");
});

test("RECRUIT tagged bullet converts its victim after switching weapons",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="recruit";',
    'game.enemies=[{kind:"sniper",x:410,y:470,r:25,hp:1,maxHp:1,',
    'score:30,color:"#fff",core:"#fff"}];',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'collectPowerup({type:"P_BLUE",x:200,y:480,life:1});',
    'updatePlayerBullets(.2);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.allies.length"),1);
  assert.equal(app.eval("game.allies[0].kind"),"sniper");
});

test("RECRUIT BOMB kills convert normal enemies, but never Bosses or player",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="recruit";',
    'game.enemies=[{kind:"bomber",x:700,y:480,r:24,hp:2,maxHp:20,',
    'score:45,color:"#fff",core:"#fff"}];',
    'useBomb();'
  ].join("\n"));
  assert.equal(app.eval("game.stats.kills"),1);
  assert.equal(app.eval("game.allies.length"),1);
  assert.equal(app.eval("game.allies[0].kind"),"bomber");
  assert.equal(app.eval("game.enemies.length"),0);
  const h=app.eval("game.hp");
  app.eval([
    // This checks FRIENDLY collision only. A random HP pickup spawned by the
    // defeated enemy could otherwise heal the player and masquerade as a hit.
    'game.powerups=[];',
    'game.spawnTimer=999;game.formationTimer=999;',
    'game.player.x=game.allies[0].x;game.player.y=game.allies[0].y;',
    'updatePlaying(.1);'
  ].join("\n"));
  assert.equal(app.eval("game.hp"),h);
});

test("RECRUIT ally flies right, fires right, kills and converts the next hostile",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="recruit";',
    'game.allies=[recruitRules.createAlly({kind:"scout",x:200,y:480,r:20})];',
    'game.enemies=[{kind:"scout",x:320,y:480,r:20,hp:1,maxHp:1,',
    'score:30,color:"#fff",core:"#fff"}];',
    'updateAllies(.2);'
  ].join("\n"));
  assert.ok(app.eval("game.allies[0].x")>200);
  assert.equal(app.eval("game.allyBullets.length"),1);
  assert.ok(app.eval("game.allyBullets[0].vx")>0);
  app.eval("updateAllyBullets(.1)");
  assert.equal(app.eval("game.enemies[0].hp")<=0,true);
  assert.equal(app.eval("game.allies.length"),2);
  assert.equal(app.eval("game.allyBullets.length"),0);
});

test("RECRUIT ally bullets hit Boss turret without entering hostile or player bullet lists",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="blue";',
    'game.allies=[recruitRules.createAlly({kind:"scout",x:400,y:480,r:25})];',
    'game.boss={active:true,x:700,y:480,rx:120,ry:80,',
    'hp:100,maxHp:100,parts:[{id:"TURRET",x:-150,y:0,r:25,hp:30,maxHp:30}],',
    'color:"#fff",core:"#eee"};',
    'updateAllies(.16);updateAllyBullets(.3);'
  ].join("\n"));
  assert.equal(app.eval("game.enemyBullets.length"),0);
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(app.eval("game.boss.parts[0].hp")<30);
  assert.equal(app.eval("game.boss.hp"),100);
});

test("RECRUIT army and projectile hard caps, pause and Boss handoff lifecycle",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="recruit";',
    'game.allies=Array.from({length:24},(_,i)=>recruitRules.createAlly(',
    ' {kind:"scout",x:200+i,y:480,r:24}));',
    'game.enemies=[{kind:"scout",x:500,y:480,r:24,hp:1,maxHp:1,',
    'score:30,color:"#fff",core:"#fff"}];',
    'damageEnemy(game.enemies[0],10,500,480);'
  ].join("\n"));
  assert.equal(app.eval("game.allies.length"),24);
  app.eval('game.allyBullets=Array.from({length:120},()=>recruitRules.createShot(game.allies[0]));');
  app.eval('updateAllies(.25)');
  assert.equal(app.eval("game.allyBullets.length"),120);
  const px=app.eval("game.allies[0].x");
  const life=app.eval("game.allies[0].life");
  app.eval('game.state="PAUSED";updatePlaying(10)');
  assert.equal(app.eval("game.allies[0].x"),px);
  assert.equal(app.eval("game.allies[0].life"),life);
  app.eval('game.state="PLAYING";game.allies[0].life=.01;updateAllies(.02)');
  assert.equal(app.eval("game.allies.length"),23);
  app.eval('spawnBoss()');
  assert.equal(app.eval("game.allies.length"),23);
  app.eval('game.boss.active=true;killBoss()');
  assert.equal(app.eval("game.allies.length"),0);
  assert.equal(app.eval("game.allyBullets.length"),0);
});

test("new gradient pickups, 360 shockwave and allies draw without changing HP",()=>{
  const app=boot();
  const result=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.weaponType="recruit";',
    'game.enemies=[{kind:"scout",x:620,y:480,r:25,hp:100,',
    'maxHp:100,score:30,color:"#fff",core:"#fff"}];',
    'game.allies=[recruitRules.createAlly({kind:"scout",x:300,y:480,r:20})];',
    'game.allyBullets=[recruitRules.createShot(game.allies[0])];',
    'game.shockwaves=[eclipseRules.createWave({x:500,y:480},1.15)];',
    'game.shockwaves[0].radius=180;',
    'game.powerups=[{type:"P_ECLIPSE",x:500,y:590,t:0,life:10},',
    ' {type:"P_RECRUIT",x:600,y:640,t:0,life:10}];',
    'const stops=[],texts=[];',
    'ctx.createLinearGradient=()=>({addColorStop:(p,c)=>stops.push(c)});',
    'ctx.fillText=t=>texts.push(String(t));',
    'const hp=game.enemies[0].hp;',
    'drawPowerups();drawShockwaves();drawAllies();drawAllyBullets();drawFrame(.01);',
    'return {hp,after:game.enemies[0].hp,stops,texts};})()'
  ].join("\n"));
  assert.equal(result.hp,result.after);
  for(const c of ["#07080f","#fb385c","#ff85d9","#80bfff"])
    assert.ok(result.stops.includes(c),c);
  assert.ok(result.texts.includes("ALLY"));
  assert.ok(result.texts.some(x=>x.includes("RECRUIT  ALLIES")));
});


test("SOLAR P is locked to currently equipped GREEN, rejected pickup does not disappear",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="red";',
    'game.weaponLevel=1;game.score=0;game.greenAura.elapsed=.08;',
    'game.powerups=[{type:"P_SOLAR",x:175,y:480,r:24,life:20,',
    'vx:0,vy:0,t:0,safeTimer:0}];updatePowerups(.01);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"red");
  assert.equal(app.eval("game.weaponLevel"),1);
  assert.equal(app.eval("game.score"),0);
  assert.equal(app.eval("game.powerups.length"),1);
  assert.ok(app.eval("game.powerups[0].life")>0);
  assert.equal(app.eval("game.greenAura.elapsed"),.08);
  assert.ok(app.eval('game.message.includes("REQUIRES GREEN P")'));
  const hint=app.eval("game.messageTimer");
  app.eval("updatePowerups(.01)");
  assert.ok(app.eval("game.messageTimer")<=hint);
  app.eval('collectPowerup({type:"P_GREEN",x:200,y:480,life:1});');
  assert.equal(app.eval("game.weaponType"),"green");
  app.eval('game.greenAura.elapsed=.35;updatePowerups(.01)');
  assert.equal(app.eval("game.weaponType"),"solar");
  assert.equal(app.eval("game.powerups.length"),0);
  assert.equal(app.eval("game.greenAura.elapsed"),0,
    "green -> solar must reset the shared global pulse clock");
  assert.equal(app.eval("weaponMeta().name"),"SOLAR AURA");
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("game.score"),200);
});

test("SOLAR same-P recollect preserves pulse phase, other weapon cannot re-equip it",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="green";game.weaponLevel=1;',
    'collectPowerup({type:"P_SOLAR",x:200,y:480,life:1});',
    'game.greenAura.elapsed=.065;',
    'collectPowerup({type:"P_SOLAR",x:200,y:480,life:1});'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"solar");
  assert.equal(app.eval("game.greenAura.elapsed"),.065);
  app.eval('game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_SOLAR");
  app.eval('collectPowerup({type:"P_BLUE",x:200,y:480,life:1});');
  assert.equal(app.eval("game.greenAura.elapsed"),0);
  const score=app.eval("game.score");
  app.eval([
    'const locked={type:"P_SOLAR",x:200,y:480,life:10};',
    'collectPowerup(locked);game.solarLockedLife=locked.life;'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.score"),score);
  assert.equal(app.eval("game.solarLockedLife"),10);
});

test("SOLAR fires precisely the same two starter BLUE/GREEN bullets at Lv.3 and Overdrive",()=>{
  const app=boot();
  const shape='JSON.stringify(game.bullets.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,r:b.r,power:b.power,c:b.c})))';
  app.eval('game.state="PLAYING";game.weaponType="green";game.weaponLevel=3;firePlayerWeapons()');
  const greenBullets=app.eval(shape);
  app.eval([
    'game.bullets=[];collectPowerup({type:"P_SOLAR",x:200,y:480,life:1});',
    'game.weaponLevel=3;firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval(shape),greenBullets);
  assert.equal(app.eval("game.missiles.length"),0);
  assert.ok(Math.abs(app.eval("getFireCooldown()")-.101)<1e-10);
  app.eval('game.combat.energy=100;activateOverdrive();game.bullets=[];firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.some(b=>b.lance)"),false);
  assert.equal(app.eval("game.weaponType"),"solar");
});

test("SOLAR pulses 2 HP every 0.1s for ALL inside the identical GREEN radius",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="solar";',
    'game.player.x=500;game.player.y=480;',
    'game.enemies=[',
    ' {kind:"scout",x:570,y:480,r:25,hp:16,maxHp:16,score:10,color:"#fff",core:"#fff"},',
    ' {kind:"gunner",x:880,y:480,r:20,hp:16,maxHp:16,score:10,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:881,y:480,r:20,hp:16,maxHp:16,score:10,color:"#fff",core:"#fff"}',
    '];updateGreenAura(.099);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),16);
  app.eval('updateGreenAura(.001)');
  assert.equal(app.eval("game.enemies[0].hp"),14);
  assert.equal(app.eval("game.enemies[1].hp"),14);
  assert.equal(app.eval("game.enemies[2].hp"),16);
  app.eval('updateGreenAura(.30)');
  assert.equal(app.eval("game.enemies[0].hp"),8);
  assert.equal(app.eval("game.enemies[1].hp"),8);
  assert.equal(app.eval("game.enemies[2].hp"),16);
  assert.ok(Math.abs(app.eval("game.greenAura.elapsed"))<1e-9);
});

test("SOLAR keeps GREEN shielding and Boss hull edge behavior at 0.1-second pulses",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="solar";',
    'game.player.x=500;game.player.y=480;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",',
    'x:630,y:480,r:35,hp:20,maxHp:20,score:80,color:"#f88",core:"#fff"})];',
    'game.enemies[0].shieldHp=8;game.enemies[0].shieldMax=8;',
    'game.boss={x:850,y:480,rx:100,ry:80,hp:80,maxHp:80,',
    'active:true,color:"#f66",core:"#fff",parts:[]};',
    'updateGreenAura(.10);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),20);
  assert.equal(app.eval("game.enemies[0].shieldHp"),6);
  assert.equal(app.eval("game.boss.hp"),78);
  app.eval('game.player.x=220;updateGreenAura(.20)');
  assert.equal(app.eval("game.enemies[0].shieldHp"),6);
  assert.equal(app.eval("game.boss.hp"),78);
  // Boss outside x distance but centered within 360+rx is the key edge case.
  app.eval('game.player.x=500;updateGreenAura(.2)');
  assert.equal(app.eval("game.boss.hp"),74);
});

test("SOLAR clock starts on equip without targets, pauses, resets only on P switch",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="green";',
    'game.invuln=999;game.spawnTimer=999;game.formationTimer=999;',
    'game.player.x=500;game.player.y=480;',
    'collectPowerup({type:"P_SOLAR",x:200,y:480,life:1});',
    'game.enemies=[];updatePlaying(.06);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.greenAura.elapsed")-.06)<1e-9);
  app.eval('game.enemies=[{kind:"scout",x:700,y:480,r:25,hp:12,maxHp:12,'+
    'score:10,color:"#fff",core:"#fff",vx:0,vy:0,t:0,wave:0,shootCd:999,shootBase:999}];');
  app.eval("updatePlaying(.03)");
  assert.equal(app.eval("game.enemies[0].hp"),12);
  app.eval('game.state="PAUSED";updatePlaying(2)');
  assert.equal(app.eval("game.enemies[0].hp"),12);
  assert.ok(Math.abs(app.eval("game.greenAura.elapsed")-.09)<1e-9);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=10;updatePlaying(3)');
  assert.equal(app.eval("game.enemies[0].hp"),12);
  assert.ok(Math.abs(app.eval("game.greenAura.elapsed")-.09)<1e-9);
  app.eval('game.stageMode="WAVE";updatePlaying(.01)');
  assert.equal(app.eval("game.enemies[0].hp"),10);
  app.eval('updatePlaying(.06)');
  assert.ok(Math.abs(app.eval("game.greenAura.elapsed")-.06)<1e-9);
  app.eval('collectPowerup({type:"P_SOLAR",x:200,y:480,life:1})');
  assert.ok(Math.abs(app.eval("game.greenAura.elapsed")-.06)<1e-9);
  app.eval('updatePlaying(.04)');
  assert.equal(app.eval("game.enemies[0].hp"),8);
  app.eval('collectPowerup({type:"P_BLUE",x:200,y:480,life:1});updatePlaying(.3)');
  assert.equal(app.eval("game.greenAura.elapsed"),0);
  assert.equal(app.eval("game.enemies[0].hp"),8);
  app.eval('collectPowerup({type:"P_GREEN",x:200,y:480,life:1})');
  app.eval('updatePlaying(.10)');
  assert.equal(app.eval("game.enemies[0].hp"),8);
  app.eval('updatePlaying(.30)');
  assert.equal(app.eval("game.enemies[0].hp"),6);
});

test("SOLAR direct passive kills score exactly once and do not damage splitter children on that pulse",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="solar";',
    'game.player.x=500;game.player.y=480;',
    'game.enemies=[{kind:"splitter",x:610,y:480,r:36,hp:2,maxHp:2,',
    'score:40,color:"#3fa",core:"#fff"}];',
    'updateGreenAura(.1);'
  ].join("\n"));
  assert.equal(app.eval("game.stats.kills"),1);
  assert.equal(app.eval("game.enemies.length"),2);
  assert.equal(app.eval("game.enemies.every(e=>e.minion&&e.hp>0)"),true);
  app.eval('updateGreenAura(.1)');
  assert.equal(app.eval("game.stats.kills"),3);
  assert.equal(app.eval("game.enemies.length"),0);
});

test("SOLAR pickup/ring are truly red-yellow gradients, visually radius 360, draw does no damage",()=>{
  const app=boot();
  const result=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.weaponType="solar";game.player.x=500;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:610,y:480,r:25,hp:10,maxHp:10,',
    'score:40,color:"#fff",core:"#eee"}];',
    'game.powerups=[{type:"P_SOLAR",x:500,y:640,t:0,life:10}];',
    'const colors=[],radii=[],labels=[];',
    'ctx.createLinearGradient=()=>({addColorStop:(p,c)=>colors.push(c)});',
    'ctx.arc=(x,y,r)=>radii.push(r);',
    'ctx.fillText=t=>labels.push(String(t));',
    'const hp=game.enemies[0].hp;',
    'drawPowerups();drawGreenAura();drawFrame(.016);',
    'return {hp,after:game.enemies[0].hp,colors,radii,labels};})()'
  ].join("\n"));
  assert.equal(result.hp,result.after);
  assert.ok(result.radii.includes(360));
  assert.ok(result.radii.includes(270));
  for(const color of ["#ff3d4f","#ff9d3d","#ffe04c"])
    assert.ok(result.colors.includes(color),color);
  assert.ok(result.labels.includes("SOLAR AURA  2 DMG/0.1S"));
  app.eval('game.weaponType="blue"');
  const hidden=app.eval([
    '(()=>{const radii=[];ctx.arc=(x,y,r)=>radii.push(r);',
    'drawGreenAura();return radii;})()'
  ].join("\n"));
  assert.equal(hidden.length,0);
});


test("RED-WHITE P is gated to RED/WHITE, rejects unrelated P and preserves RED shared stars",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="blue";game.weaponLevel=1;',
    'game.redWeapon.stars=3;game.score=0;',
    'game.powerups=[{type:"P_RED_WHITE",x:175,y:480,r:24,life:20,',
    'vx:0,vy:0,t:0,safeTimer:0}];updatePowerups(.01);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.weaponLevel"),1);
  assert.equal(app.eval("game.score"),0);
  assert.equal(app.eval("game.redWeapon.stars"),3);
  assert.equal(app.eval("game.powerups.length"),1);
  assert.ok(app.eval('game.message.includes("REQUIRES RED OR WHITE P")'));
  const hint=app.eval("game.messageTimer");
  app.eval('updatePowerups(.01)');
  assert.ok(app.eval("game.messageTimer")<=hint);
  app.eval('collectPowerup({type:"P_RED",x:250,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"red");
  app.eval('updatePowerups(.01)');
  assert.equal(app.eval("game.weaponType"),"redwhite");
  assert.equal(app.eval("game.powerups.length"),0);
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("game.redWeapon.stars"),3);
  assert.equal(app.eval("weaponMeta().name"),"ARC SCATTER");
  const points=app.eval("game.score");
  app.eval('collectPowerup({type:"P_RED_WHITE",x:250,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"redwhite");
  assert.equal(app.eval("game.redWeapon.stars"),3);
  assert.ok(app.eval("game.score")>points);
  app.eval('game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_RED_WHITE");
  app.eval('collectPowerup({type:"P_GREEN",x:250,y:480,life:1})');
  const score=app.eval("game.score");
  app.eval('const locked={type:"P_RED_WHITE",x:300,y:480,life:9};collectPowerup(locked);game.lockedLife=locked.life');
  assert.equal(app.eval("game.weaponType"),"green");
  assert.equal(app.eval("game.score"),score);
  assert.equal(app.eval("game.lockedLife"),9);
});

test("RED-WHITE can also evolve directly from WHITE, without changing stored RED stars",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="white";game.redWeapon.stars=4;',
    'game.weaponLevel=2;collectPowerup({type:"P_RED_WHITE",x:200,y:480,life:1});'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"redwhite");
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("game.redWeapon.stars"),4);
  assert.equal(app.eval("game.redWeapon.volleys"),0);
  assert.equal(app.eval("redWhiteRules.RULES.baseVolleys+game.redWeapon.stars"),9);
  assert.equal(app.eval("getFireCooldown()"),0.1);
});

test("RED-WHITE ordinary volley uses RED dual lanes and true WHITE penetrating electricity",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redwhite";',
    'game.player.x=175;game.player.y=480;game.weaponLevel=3;',
    'firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets[0].y"),467);
  assert.equal(app.eval("game.bullets[1].y"),493);
  assert.equal(app.eval("game.bullets.every(b=>b.vx===1120&&b.vy===0&&b.r===9&&b.power===1.15)"),true);
  assert.equal(app.eval("game.bullets.every(b=>b.whiteConductive&&b.redWhiteShot&&b.hitEnemies.length===0&&!b.whiteBossHit)"),true);
  assert.notEqual(app.eval("game.bullets[0].hitEnemies"),app.eval("game.bullets[1].hitEnemies"));
  assert.equal(app.eval("game.missiles.length"),0);
  assert.ok(Math.abs(app.eval("getFireCooldown()")-.1)<1e-10);
  app.eval('game.combat.energy=100;activateOverdrive();game.bullets=[];firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"),2);
  assert.ok(app.eval("game.bullets.every(b=>b.power>1.15)"));
  assert.equal(app.eval("game.bullets.some(b=>b.lance)"),false);
});

test("RED-WHITE keeps RED 5+star shot streak, 0.4s rest and independent 10% fan trigger",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redwhite";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'keys.Space=true;Math.random=()=>.99;'
  ].join("\n"));
  for(let i=0;i<4;i++)app.eval('game.fireCooldown=0;updatePlaying(.001)');
  assert.equal(app.eval("game.redWeapon.volleys"),4);
  assert.equal(app.eval("game.fireCooldown"),.1);
  app.eval('game.fireCooldown=0;updatePlaying(.001)');
  assert.equal(app.eval("game.redWeapon.volleys"),0);
  assert.equal(app.eval("game.fireCooldown"),.4);
  app.eval('game.redWeapon.stars=2');
  for(let i=0;i<7;i++)app.eval('game.fireCooldown=0;updatePlaying(.001)');
  assert.equal(app.eval("game.redWeapon.volleys"),0);
  assert.equal(app.eval("game.fireCooldown"),.4);
  assert.equal(app.eval("game.redWeapon.special"),null);
  app.eval('game.redWeapon.stars=2;game.fireCooldown=0;Math.random=()=>.099999;updatePlaying(.001);keys.Space=false');
  assert.equal(app.eval("game.redWeapon.special.redWhite"),true);
  assert.equal(app.eval("game.redWeapon.stars"),2);
  app.eval('redRules.switchWeapon(game.redWeapon)');
  assert.equal(app.eval("game.redWeapon.stars"),2);
  assert.equal(app.eval("game.redWeapon.volleys"),0);
});

test("RED-WHITE direct hit penetrates, conducts 60% at radius 360 and avoids double damage",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redwhite";',
    'game.player.x=175;game.player.y=480;Math.random=()=>.99;',
    'game.enemies=[',
    ' {kind:"scout",x:430,y:467,r:20,hp:100,maxHp:100,score:25,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:740,y:467,r:20,hp:100,maxHp:100,score:25,color:"#fff",core:"#fff"},',
    ' {kind:"scout",x:1170,y:467,r:20,hp:100,maxHp:100,score:25,color:"#fff",core:"#fff"}',
    '];firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.18);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-9);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-99.31)<1e-9);
  assert.equal(app.eval("game.enemies[2].hp"),100);
  assert.equal(app.eval("game.bullets.length"),1);
  assert.equal(app.eval("game.bullets[0].hitEnemies.length"),2);
  const second=app.eval("game.enemies[1].hp");
  app.eval('updatePlayerBullets(.29)');
  assert.equal(app.eval("game.enemies[1].hp"),second);
  app.eval('updatePlayerBullets(.39)');
  assert.ok(app.eval("game.enemies[2].hp")<100);
  assert.equal(app.eval("game.enemies[1].hp"),second);
});

test("RED-WHITE inherits WHITE multi-hop 50%-then-10% rules and per-projectile ledger",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="redwhite";',
    'game.player.x=175;game.player.y=480;Math.random=()=>0;',
    'game.enemies=[430,800,1170,1540].map(x=>({kind:"scout",x,y:467,',
    'r:20,hp:100,maxHp:100,score:25,color:"#fff",core:"#fff"}));',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.18);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-9);
  for(let i=1;i<=3;i++)assert.ok(Math.abs(app.eval("game.enemies["+i+"].hp")-99.31)<1e-9);
  assert.equal(app.eval("game.bullets[0].hitEnemies.length"),4);
  assert.equal(app.eval("game.electricArcs.length"),4);
  assert.equal(app.eval("game.bullets[0].whiteBossHit"),false);
});

test("RED-WHITE WHITE-bullet contact respects shields and Boss turret vs hull once",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redwhite";',
    'game.player.x=175;game.player.y=480;Math.random=()=>.99;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",',
    'x:430,y:467,r:36,hp:100,maxHp:100,score:30,color:"#fff",core:"#fff"})];',
    'game.enemies[0].shieldHp=10;game.enemies[0].shieldMax=10;',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.18);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),100);
  assert.ok(Math.abs(app.eval("game.enemies[0].shieldHp")-8.85)<1e-9);
  app.eval([
    'game.bullets=[];game.enemies=[];',
    'game.stageMode="BOSS";',
    'game.boss={active:true,x:760,y:467,rx:100,ry:80,',
    'hp:200,maxHp:200,parts:[{id:"GUN",x:-155,y:0,r:28,hp:80,maxHp:80}],',
    'color:"#fff",core:"#fff"};',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.35);'
  ].join("\n"));
  assert.ok(app.eval("game.boss.parts[0].hp")<80);
  assert.equal(app.eval("game.boss.hp"),200);
  assert.equal(app.eval("game.bullets[0].whiteBossHit"),true);
  const hp=app.eval("game.boss.parts[0].hp");
  app.eval('updatePlayerBullets(.3)');
  assert.equal(app.eval("game.boss.parts[0].hp"),hp);
  assert.equal(app.eval("game.boss.hp"),200);
});

test("RED-WHITE electric fan emits 250 genuine conductive bolts in 3 active seconds and gains ONE RED star",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redwhite";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'game.fanLog=[];const originalEmit=addPlayerShot;',
    'addPlayerShot=(...args)=>{if(args[7]?.redWhiteFan)',
    'game.fanLog.push({vx:args[2],vy:args[3],power:args[5],',
    'conductive:args[7].whiteConductive});originalEmit(...args)};',
    'game.fireCooldown=0;keys.Space=true;Math.random=()=>0;',
    'updatePlaying(.01);keys.Space=false;'
  ].join("\n"));
  assert.equal(app.eval("game.redWeapon.special.redWhite"),true);
  assert.equal(app.eval("game.redWeapon.stars"),0);
  app.eval('game.state="PAUSED";updatePlaying(6)');
  assert.equal(app.eval("game.fanLog.length"),0);
  assert.equal(app.eval("game.redWeapon.stars"),0);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=10;updatePlaying(5)');
  assert.equal(app.eval("game.fanLog.length"),0);
  app.eval('game.stageMode="WAVE";updatePlaying(1)');
  assert.equal(app.eval("game.redWeapon.stars"),0);
  assert.ok(app.eval("game.fanLog.length")>0);
  app.eval('updatePlaying(2)');
  assert.equal(app.eval("game.fanLog.length"),250);
  assert.equal(app.eval("game.redWeapon.stars"),1);
  assert.equal(app.eval("game.redWeapon.special"),null);
  assert.equal(app.eval("game.fanLog.every(b=>b.power===.38&&b.conductive)"),true);
  assert.equal(app.eval("game.fanLog.every(b=>Math.abs(Math.atan2(b.vy,b.vx))<=Math.PI/18+1e-10)"),true);
  assert.equal(app.eval("game.bullets.every(b=>b.whiteConductive||b.redNormal)"),true);
});

test("RED-WHITE fan stays ELECTRIC after P swap; a RED-started fan stays RED after fusion",()=>{
  for(const start of ["red","redwhite"]){
    const app=boot();
    app.eval([
      'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="'+start+'";',
      'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
      'game.fireCooldown=0;keys.Space=true;Math.random=()=>0;updatePlaying(.01);',
      'keys.Space=false;'
    ].join("\n"));
    assert.equal(app.eval("Boolean(game.redWeapon.special.redWhite)"),start==="redwhite");
    app.eval('collectPowerup({type:"P_'+(start==="red"?"RED_WHITE":"RED")+'",x:250,y:480,life:1});');
    assert.equal(app.eval("game.weaponType"),start==="red"?"redwhite":"red");
    app.eval('updatePlaying(.15)');
    const stats=app.eval([
      '(()=>{const fan=game.bullets.filter(b=>b.redSpecial||b.redWhiteFan);',
      'return {count:fan.length,electric:fan.filter(b=>b.redWhiteFan&&b.whiteConductive).length,',
      'red:fan.filter(b=>b.redSpecial&&!b.whiteConductive).length};})()'
    ].join("\n"));
    assert.ok(stats.count>0);
    assert.equal(start==="redwhite"?stats.electric:stats.red,stats.count);
    app.eval('updatePlaying(2.85)');
    assert.equal(app.eval("game.redWeapon.stars"),1);
    assert.equal(app.eval("game.redWeapon.special"),null);
  }
});

test("RED and RED-WHITE display SAME star count; WHITE alone hides it, HP hit removes one",()=>{
  const app=boot();
  app.eval('game.state="PLAYING";game.weaponType="red";game.redWeapon.stars=4;');
  const hud=app.eval([
    '(()=>{const labels=[];ctx.fillText=t=>labels.push(String(t));',
    'drawHud();return labels;})()'
  ].join("\n"));
  assert.ok(hud.some(x=>x.includes("RED P")&&x.includes("★★★★☆")));
  app.eval('collectPowerup({type:"P_RED_WHITE",x:250,y:480,life:1});');
  assert.equal(app.eval("game.redWeapon.stars"),4);
  const labels=app.eval([
    '(()=>{const labels=[];ctx.fillText=t=>labels.push(String(t));',
    'drawHud();return labels;})()'
  ].join("\n"));
  assert.ok(labels.some(x=>x.includes("RED-WHITE P")&&x.includes("★★★★☆")));
  assert.ok(labels.includes("RED-WHITE ARC 60% HOPS"));
  app.eval('game.invuln=0;damagePlayer()');
  assert.equal(app.eval("game.redWeapon.stars"),3);
  const damaged=app.eval([
    '(()=>{const labels=[];ctx.fillText=t=>labels.push(String(t));',
    'drawHud();return labels;})()'
  ].join("\n"));
  assert.ok(damaged.some(x=>x.includes("RED-WHITE P")&&x.includes("★★★☆☆")));
  app.eval('collectPowerup({type:"P_WHITE",x:250,y:480,life:1});');
  const hidden=app.eval([
    '(()=>{const labels=[];ctx.fillText=t=>labels.push(String(t));',
    'drawHud();return labels;})()'
  ].join("\n"));
  assert.equal(hidden.some(x=>x.includes("RED-WHITE P")||x.includes("RED P")),false);
  assert.equal(app.eval("game.redWeapon.stars"),3);
  app.eval('collectPowerup({type:"P_RED",x:250,y:480,life:1})');
  assert.equal(app.eval("game.redWeapon.stars"),3);
});

test("RED-WHITE special caps at five stars, and real BOMB alone never awards a star",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redwhite";',
    'game.invuln=999;game.spawnTimer=999;game.formationTimer=999;',
    'game.redWeapon.stars=5;useBomb();'
  ].join("\n"));
  assert.equal(app.eval("game.redWeapon.stars"),5);
  app.eval('redRules.fire(game.redWeapon,0);redWhiteRules.markTriggeredFan(game.redWeapon);updatePlaying(3)');
  assert.equal(app.eval("game.redWeapon.stars"),5);
  assert.equal(app.eval("game.redWeapon.special"),null);
  assert.ok(app.eval('game.message.includes("MAX 5 STARS")'));
});

test("RED-WHITE gradient icon and original WHITE projectile rendering are visual-only",()=>{
  const app=boot();
  const image=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.weaponType="redwhite";',
    'game.enemies=[{kind:"scout",x:580,y:480,r:25,hp:100,maxHp:100,',
    'score:30,color:"#fff",core:"#fff"}];',
    'game.powerups=[{type:"P_RED_WHITE",x:400,y:640,t:0,life:10}];',
    'firePlayerWeapons();const colors=[],usedFill=[],labels=[];',
    'ctx.createLinearGradient=()=>({addColorStop:(p,c)=>colors.push(c)});',
    'ctx.fillRect=()=>usedFill.push(ctx.fillStyle);',
    'ctx.fillText=t=>labels.push(String(t));',
    'const hp=game.enemies[0].hp;',
    'drawPowerups();drawPlayerBullets();drawHud();drawFrame(.016);',
    'return {hp,after:game.enemies[0].hp,colors,usedFill,labels};})()'
  ].join("\n"));
  assert.equal(image.hp,image.after);
  assert.ok(image.colors.includes("#ff3957"));
  assert.ok(image.colors.includes("#f9fcff"));
  assert.ok(image.usedFill.includes("#8bdbff"),
    "RED-WHITE shots use the authentic WHITE projectile sprite");
  assert.ok(image.labels.some(x=>x.includes("RED-WHITE P")));
});

test("RED-WHITE fan respects existing 360 bullet and 96 arc FX budgets",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redwhite";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'redRules.fire(game.redWeapon,0);redWhiteRules.markTriggeredFan(game.redWeapon);',
    'redRules.tick(game.redWeapon,3,(a)=>addPlayerShot(game.player.x+60,game.player.y,',
    ' Math.cos(a)*1060,Math.sin(a)*1060,5,.38,"#f7fcff",redWhiteRules.createShot(true)));'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),250);
  assert.equal(app.eval("game.bullets.every(b=>b.whiteConductive&&b.redWhiteFan)"),true);
  app.eval('game.bullets=Array.from({length:360},(_,i)=>({x:300,y:100+i*.6,vx:1,vy:0,power:1.15}));firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"),360);
  app.eval('for(let i=0;i<125;i++)addElectricArc(100,100,200+i,200)');
  assert.equal(app.eval("game.electricArcs.length"),96);
});

test("RED-WHITE existing RED and WHITE normal weapons remain unchanged after fusion swaps",()=>{
  const app=boot();
  app.eval('game.state="PLAYING";game.weaponType="red";firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.redNormal&&!b.whiteConductive)"),true);
  app.eval([
    'game.bullets=[];collectPowerup({type:"P_RED_WHITE",x:250,y:480,life:1});',
    'firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.every(b=>b.whiteConductive&&b.redWhiteShot)"),true);
  app.eval('game.bullets=[];collectPowerup({type:"P_WHITE",x:250,y:480,life:1});firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.whiteConductive&&!b.redWhiteShot)"),true);
  app.eval('game.bullets=[];collectPowerup({type:"P_RED",x:250,y:480,life:1});firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.redNormal&&!b.whiteConductive)"),true);
});


test("GRAY FLAME P only equips from current GRAY; rejected pickup persists and keeps score/level",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="blue";game.weaponLevel=1;',
    'game.grayWeapon.volleys=3;game.score=0;',
    'game.powerups=[{type:"P_GRAY_FLAME",x:175,y:480,r:24,life:20,',
    'vx:0,vy:0,t:0,safeTimer:0}];updatePowerups(.01);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.powerups.length"),1);
  assert.equal(app.eval("game.weaponLevel"),1);
  assert.equal(app.eval("game.score"),0);
  assert.equal(app.eval("game.grayWeapon.volleys"),3);
  assert.ok(app.eval('game.message.includes("REQUIRES GRAY P")'));
  const hint=app.eval("game.messageTimer");
  app.eval("updatePowerups(.01)");
  assert.ok(app.eval("game.messageTimer")<=hint);
  app.eval('collectPowerup({type:"P_GRAY",x:200,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"gray");
  app.eval("updatePowerups(.01)");
  assert.equal(app.eval("game.weaponType"),"grayflame");
  assert.equal(app.eval("game.powerups.length"),0);
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("weaponMeta().name"),"INFERNO IMPACT");
  app.eval('game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_GRAY_FLAME");
  app.eval('collectPowerup({type:"P_GRAY_FLAME",x:200,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"grayflame");
  app.eval('collectPowerup({type:"P_RED",x:200,y:480,life:1})');
  const score=app.eval("game.score");
  app.eval('const forbidden={type:"P_GRAY_FLAME",x:200,y:480,life:6};collectPowerup(forbidden);game.forbiddenLife=forbidden.life');
  assert.equal(app.eval("game.weaponType"),"red");
  assert.equal(app.eval("game.score"),score);
  assert.equal(app.eval("game.forbiddenLife"),6);
});

test("GRAY FLAME inherits exact GRAY two-bullet loadout, 5 volleys and 0.4s rest",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="gray";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'firePlayerWeapons();game.grayOriginal=JSON.stringify(game.bullets.map(b=>',
    '({x:b.x,y:b.y,vx:b.vx,vy:b.vy,r:b.r,power:b.power})));',
    'game.bullets=[];collectPowerup({type:"P_GRAY_FLAME",x:200,y:480,life:1});',
    'game.weaponLevel=3;firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("JSON.stringify(game.bullets.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,r:b.r,power:b.power})))"),
    app.eval("game.grayOriginal"));
  assert.equal(app.eval("game.bullets.every(b=>b.grayImpact&&b.grayFlameShot)"),true);
  assert.ok(Math.abs(app.eval("getFireCooldown()")-.101)<1e-10);
  app.eval('game.bullets=[];keys.Space=true;');
  for(let i=0;i<4;i++)app.eval("game.fireCooldown=0;updatePlaying(.001)");
  assert.equal(app.eval("game.grayWeapon.volleys"),4);
  app.eval("game.fireCooldown=0;updatePlaying(.001)");
  assert.equal(app.eval("game.grayWeapon.volleys"),0);
  assert.equal(app.eval("game.fireCooldown"),.4);
  assert.equal(app.eval("game.bullets.filter(b=>b.grayFlameShot).length"),10);
  app.eval("game.state='PAUSED';updatePlaying(1)");
  assert.equal(app.eval("game.fireCooldown"),.4);
});

test("GRAY FLAME rolls ignition only on actual hit; <20% succeeds and ==20% fails",()=>{
  const success=boot();
  success.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;Math.random=()=>.19;',
    'game.enemies=[{kind:"scout",x:410,y:480,r:24,hp:40,maxHp:40,',
    'score:30,color:"#fff",core:"#fff",vx:-100,vy:0}];',
    'addPlayerShot(300,480,1100,0,9,1.15,"#e94d59",',
    '{grayImpact:true,grayFlameShot:true});'
  ].join("\n"));
  assert.equal(success.eval("game.enemies[0].grayFlame"),undefined);
  success.eval("updatePlayerBullets(.12)");
  assert.equal(success.eval("game.enemies[0].x"),510);
  assert.ok(Math.abs(success.eval("game.enemies[0].hp")-38.85)<1e-9);
  assert.equal(success.eval("game.enemies[0].grayFlame.remaining"),5);
  assert.ok(Math.abs(success.eval("game.enemies[0].grayFlame.power")-.69)<1e-10);
  const fail=boot();
  fail.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;Math.random=()=>.2;',
    'game.enemies=[{kind:"scout",x:410,y:480,r:24,hp:40,maxHp:40,',
    'score:30,color:"#fff",core:"#fff"}];',
    'addPlayerShot(300,480,1100,0,9,1.15,"#e94d59",',
    '{grayImpact:true,grayFlameShot:true});updatePlayerBullets(.12);'
  ].join("\n"));
  assert.equal(fail.eval("game.enemies[0].grayStunRemaining"),.5);
  assert.equal(fail.eval("game.enemies[0].grayFlame"),undefined);
  assert.ok(Math.abs(fail.eval("game.enemies[0].hp")-38.85)<1e-9);
});

test("GRAY FLAME can ignite after 75% 1.5x GRAY direct-hit RNG but burn stays 0.6x normal",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.player.x=200;game.player.y=480;',
    'let rolls=0;Math.random=()=>rolls++===0?.75:0;',
    'game.enemies=[{kind:"scout",x:410,y:480,r:24,hp:40,maxHp:40,',
    'score:30,color:"#fff",core:"#fff"}];',
    'addPlayerShot(300,480,1100,0,9,1.15,"#e94d59",',
    '{grayImpact:true,grayFlameShot:true});updatePlayerBullets(.12);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-(40-1.15*1.5))<1e-9);
  assert.equal(app.eval("game.enemies[0].x"),410);
  assert.ok(Math.abs(app.eval("game.enemies[0].grayFlame.power")-.69)<1e-10);
  app.eval("updateGrayFlames(.5)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-(40-1.725-.69))<1e-9);
});

test("GRAY FLAME ticks 0.6x each 0.5s, 10 times total; no on-hit instant or extra 11th tick",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.enemies=[{kind:"scout",x:650,y:480,r:24,hp:100,maxHp:100,',
    'score:30,color:"#fff",core:"#fff"}];',
    'grayFlameRules.ignite(game.enemies[0],0,1.15);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),100);
  app.eval("updateGrayFlames(.499)");
  assert.equal(app.eval("game.enemies[0].hp"),100);
  app.eval("updateGrayFlames(.001)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-99.31)<1e-9);
  app.eval("updateGrayFlames(4.5)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-93.1)<1e-9);
  assert.equal(app.eval("game.enemies[0].grayFlame.remaining"),0);
  app.eval("updateGrayFlames(12)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-93.1)<1e-9);
});

test("GRAY FLAME re-ignition refreshes same status, preserves original stronger Overdrive shot",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.enemies=[{kind:"scout",x:650,y:480,r:24,hp:100,maxHp:100,',
    'score:30,color:"#fff",core:"#fff"}];',
    'grayFlameRules.ignite(game.enemies[0],0,3.45);',
    'updateGrayFlames(1.2);',
    'grayFlameRules.ignite(game.enemies[0],0,1.15);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].grayFlame.remaining"),5);
  assert.ok(Math.abs(app.eval("game.enemies[0].grayFlame.power")-2.07)<1e-9);
  assert.equal(app.eval("Object.keys(game.enemies[0]).filter(x=>x==='grayFlame').length"),1);
  const hp=app.eval("game.enemies[0].hp");
  app.eval("updateGrayFlames(.5)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-(hp-2.07))<1e-9);
});

test("GRAY FLAME burns on frontal shield, not bypassing it, even if impact was blocked",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.player.x=180;Math.random=()=>.19;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",x:400,y:480,',
    'r:39,hp:20,maxHp:20,score:50,color:"#aaf",core:"#fff"})];',
    'game.enemies[0].shieldHp=10;game.enemies[0].shieldMax=10;',
    'addPlayerShot(280,480,1100,0,9,1.15,"#e94d59",',
    '{grayImpact:true,grayFlameShot:true});updatePlayerBullets(.11);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),20);
  assert.equal(app.eval("game.enemies[0].grayFlame.remaining"),5);
  assert.ok(Math.abs(app.eval("game.enemies[0].shieldHp")-8.85)<1e-9);
  app.eval("updateGrayFlames(.5)");
  assert.ok(Math.abs(app.eval("game.enemies[0].shieldHp")-8.16)<1e-9);
  assert.equal(app.eval("game.enemies[0].hp"),20);
});

test("GRAY FLAME Boss-turret burning hits ONLY that mount, stops on destruction",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";Math.random=()=>.19;',
    'game.boss={active:true,x:900,y:480,rx:110,ry:80,hp:200,maxHp:200,',
    'targetX:900,parts:[{id:"TURRET",x:-150,y:0,r:25,hp:80,maxHp:80}],',
    'color:"#fff",core:"#eee"};',
    'addPlayerShot(550,480,1500,0,9,1.15,"#f46",',
    '{grayImpact:true,grayFlameShot:true});updatePlayerBullets(.2);'
  ].join("\n"));
  assert.equal(app.eval("game.boss.parts[0].grayFlame.remaining"),5);
  assert.equal(app.eval("game.boss.grayFlame"),undefined);
  const hp=app.eval("game.boss.parts[0].hp");
  app.eval("updateGrayFlames(.5)");
  assert.ok(app.eval("game.boss.parts[0].hp")<hp);
  assert.equal(app.eval("game.boss.hp"),200);
  app.eval('game.boss.parts[0].hp=0;updateGrayFlames(4)');
  assert.equal(app.eval("game.boss.parts[0].hp"),0);
  assert.equal(app.eval("game.boss.hp"),200);
});

test("GRAY FLAME Boss-hull burn ticks independent of turret and stops after Boss death",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";Math.random=()=>.19;',
    'game.boss={active:true,x:920,y:480,rx:110,ry:80,hp:100,maxHp:100,',
    'parts:[],color:"#fff",core:"#eee"};',
    'addPlayerShot(600,480,1500,0,9,1.15,"#f46",',
    '{grayImpact:true,grayFlameShot:true});updatePlayerBullets(.25);'
  ].join("\n"));
  assert.equal(app.eval("game.boss.grayFlame.remaining"),5);
  const hp=app.eval("game.boss.hp");
  app.eval("updateGrayFlames(.5)");
  assert.ok(Math.abs(app.eval("game.boss.hp")-(hp-.69))<1e-9);
  app.eval('game.boss.hp=.2;updateGrayFlames(.5)');
  assert.equal(app.eval("game.boss"),null);
  assert.equal(app.eval("game.stageMode"),"BOSS_REWARD");
  app.eval("updateGrayFlames(5)");
  assert.equal(app.eval("game.boss"),null);
});

test("GRAY FLAME status pauses outside combat and during STASIS, persists after P change",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="grayflame";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'game.enemies=[{kind:"scout",x:720,y:480,r:25,hp:100,maxHp:100,',
    'score:30,color:"#fff",core:"#eee",vx:0,vy:0,t:0,wave:0,',
    'shootCd:999,shootBase:999}];',
    'grayFlameRules.ignite(game.enemies[0],0,1.15);',
    'collectPowerup({type:"P_BLUE",x:200,y:480,life:1});updatePlaying(.3);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.ok(Math.abs(app.eval("game.enemies[0].grayFlame.remaining")-4.7)<1e-9);
  assert.equal(app.eval("game.enemies[0].hp"),100);
  app.eval('game.state="PAUSED";updatePlaying(20)');
  assert.ok(Math.abs(app.eval("game.enemies[0].grayFlame.remaining")-4.7)<1e-9);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=20;updatePlaying(3)');
  assert.ok(Math.abs(app.eval("game.enemies[0].grayFlame.remaining")-4.7)<1e-9);
  app.eval('game.stageMode="WAVE";game.stasisRemaining=2;updatePlaying(1)');
  assert.ok(Math.abs(app.eval("game.enemies[0].grayFlame.remaining")-4.7)<1e-9);
  app.eval('game.stasisRemaining=0;updatePlaying(.2)');
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-99.31)<1e-9);
});

test("GRAY FLAME DOT kills splitter once and never burns new children on parent tick",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.enemies=[{kind:"splitter",x:670,y:480,r:35,hp:.5,maxHp:5,',
    'score:40,color:"#3fa",core:"#fff"}];',
    'grayFlameRules.ignite(game.enemies[0],0,1.15);',
    'updateGrayFlames(.5);'
  ].join("\n"));
  assert.equal(app.eval("game.stats.kills"),1);
  assert.equal(app.eval("game.enemies.length"),2);
  assert.equal(app.eval("game.enemies.every(e=>e.minion&&e.hp>0&&!e.grayFlame)"),true);
  app.eval("updateGrayFlames(.5)");
  assert.equal(app.eval("game.stats.kills"),1);
});

test("GRAY FLAME gradient pickup, projectiles and moving fire render without damage or clock mutation",()=>{
  const app=boot();
  const visual=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.weaponType="grayflame";game.powerups=[',
    '{type:"P_GRAY_FLAME",x:500,y:620,life:12,t:0}];',
    'game.enemies=[{kind:"scout",x:560,y:480,r:24,hp:100,maxHp:100,',
    'score:30,color:"#fff",core:"#fff"}];',
    'grayFlameRules.ignite(game.enemies[0],0,1.15);',
    'firePlayerWeapons();',
    'const hp=game.enemies[0].hp,remaining=game.enemies[0].grayFlame.remaining;',
    'const colors=[],labels=[];',
    'ctx.createLinearGradient=()=>({addColorStop:(p,c)=>colors.push(c)});',
    'ctx.fillText=t=>labels.push(String(t));',
    'drawPowerups();drawEnemy(game.enemies[0]);drawPlayerBullets();drawHud();',
    'drawFrame(.016);',
    'return {hp,after:game.enemies[0].hp,remaining,',
    'end:game.enemies[0].grayFlame.remaining,colors,labels};})()'
  ].join("\n"));
  assert.equal(visual.hp,visual.after);
  assert.equal(visual.remaining,visual.end);
  for(const color of ["#e92840","#777e90","#f33250","#a5aab4",
      "#e52638","#ff6839","#ffe290"])
    assert.ok(visual.colors.includes(color),color);
  assert.ok(visual.labels.some(l=>l.startsWith("BURN 5.0S")));
  assert.ok(visual.labels.includes("GRAY FLAME  20%  5S"));
});

test("GRAY FLAME unchanged base GRAY never ignites, burns only tagged surviving hits even after P swap",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";Math.random=()=>0;',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:415,y:470,r:25,hp:80,maxHp:80,',
    'score:30,color:"#fff",core:"#fff"}];',
    'game.weaponType="gray";firePlayerWeapons();',
    'game.bullets=game.bullets.slice(0,1);updatePlayerBullets(.2);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].grayFlame"),undefined);
  app.eval([
    'game.bullets=[];game.enemies[0].x=415;',
    'collectPowerup({type:"P_GRAY_FLAME",x:200,y:480,life:1});',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'collectPowerup({type:"P_BLUE",x:200,y:480,life:1});',
    'updatePlayerBullets(.2);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.enemies[0].grayFlame.remaining"),5);
  assert.ok(Math.abs(app.eval("game.enemies[0].grayFlame.power")-.69)<1e-9);
});


test("RED-ORANGE P only unlocks from current RED/ORANGE, rejecting WHITE and RED-WHITE without consuming",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="redwhite";game.weaponLevel=1;',
    'game.redWeapon.stars=3;game.redWeapon.volleys=2;game.score=0;',
    'game.powerups=[{type:"P_RED_ORANGE",x:175,y:480,r:24,life:20,',
    'vx:0,vy:0,t:0,safeTimer:0}];updatePowerups(.01);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"redwhite");
  assert.equal(app.eval("game.weaponLevel"),1);
  assert.equal(app.eval("game.score"),0);
  assert.equal(app.eval("game.redWeapon.stars"),3);
  assert.equal(app.eval("game.redWeapon.volleys"),2);
  assert.equal(app.eval("game.powerups.length"),1);
  assert.ok(app.eval('game.message.includes("REQUIRES RED OR ORANGE P")'));
  const hint=app.eval("game.messageTimer");
  app.eval("updatePowerups(.01)");
  assert.ok(app.eval("game.messageTimer")<=hint);
  app.eval('collectPowerup({type:"P_RED",x:240,y:480,life:1});');
  assert.equal(app.eval("game.weaponType"),"red");
  app.eval("updatePowerups(.01)");
  assert.equal(app.eval("game.weaponType"),"redorange");
  assert.equal(app.eval("weaponMeta().name"),"BLAST SCATTER");
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("game.redWeapon.stars"),3);
  assert.equal(app.eval("game.powerups.length"),0);
  app.eval('game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_RED_ORANGE");
  app.eval('collectPowerup({type:"P_RED_ORANGE",x:240,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"redorange");
  assert.equal(app.eval("game.redWeapon.stars"),3);
  app.eval('collectPowerup({type:"P_WHITE",x:240,y:480,life:1});');
  const score=app.eval("game.score");
  app.eval('const lockedRO={type:"P_RED_ORANGE",x:240,y:480,life:8};collectPowerup(lockedRO);game.lockedROLife=lockedRO.life');
  assert.equal(app.eval("game.weaponType"),"white");
  assert.equal(app.eval("game.score"),score);
  assert.equal(app.eval("game.lockedROLife"),8);
});

test("RED-ORANGE P evolves directly from ORANGE and preserves the one shared RED stars",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="orange";game.redWeapon.stars=4;',
    'game.weaponLevel=2;collectPowerup({type:"P_RED_ORANGE",x:250,y:480,life:1});'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"redorange");
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("game.redWeapon.stars"),4);
  assert.equal(app.eval("game.redWeapon.volleys"),0);
  assert.equal(app.eval("redRules.RULES.baseVolleys+game.redWeapon.stars"),9);
  assert.equal(app.eval("getFireCooldown()"),.1);
  app.eval('collectPowerup({type:"P_ORANGE",x:250,y:480,life:1});');
  assert.equal(app.eval("game.weaponType"),"orange");
  assert.equal(app.eval("game.redWeapon.stars"),4);
});

test("RED-ORANGE fires exact RED twin lanes and starter damage but real ORANGE exploding bullets",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="redorange";',
    'game.player.x=175;game.player.y=480;game.weaponLevel=3;',
    'firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets[0].y"),467);
  assert.equal(app.eval("game.bullets[1].y"),493);
  assert.equal(app.eval("game.bullets.every(b=>b.vx===1120&&b.vy===0&&b.r===8&&b.power===1.15)"),true);
  assert.equal(app.eval("game.bullets.every(b=>b.orangeBlast&&b.redOrangeShot&&!b.redOrangeFan&&!b.whiteConductive&&!b.redNormal)"),true);
  assert.equal(app.eval("game.missiles.length"),0);
  assert.equal(app.eval("getFireCooldown()"),.1);
  app.eval('game.combat.energy=100;activateOverdrive();game.bullets=[];firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.power>1.15&&b.orangeBlast)"),true);
  assert.equal(app.eval("game.bullets.some(b=>b.lance)"),false);
});

test("RED-ORANGE maintains RED five-plus-stars volley streak, .4s rest and 10% special boundary",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redorange";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'keys.Space=true;Math.random=()=>.99;'
  ].join("\n"));
  for(let i=0;i<4;i++)app.eval("game.fireCooldown=0;updatePlaying(.001)");
  assert.equal(app.eval("game.redWeapon.volleys"),4);
  assert.equal(app.eval("game.fireCooldown"),.1);
  app.eval("game.fireCooldown=0;updatePlaying(.001)");
  assert.equal(app.eval("game.redWeapon.volleys"),0);
  assert.equal(app.eval("game.fireCooldown"),.4);
  app.eval("game.redWeapon.stars=2");
  for(let i=0;i<7;i++)app.eval("game.fireCooldown=0;updatePlaying(.001)");
  assert.equal(app.eval("game.redWeapon.volleys"),0);
  assert.equal(app.eval("game.fireCooldown"),.4);
  assert.equal(app.eval("game.redWeapon.special"),null);
  app.eval('game.fireCooldown=0;Math.random=()=>.1;updatePlaying(.001)');
  assert.equal(app.eval("game.redWeapon.special"),null);
  app.eval('game.fireCooldown=0;Math.random=()=>.0999999;updatePlaying(.001);keys.Space=false');
  assert.equal(app.eval("game.redWeapon.special.redOrange"),true);
  assert.equal(app.eval("game.redWeapon.special.redWhite"),undefined);
  assert.equal(app.eval("game.redWeapon.stars"),2);
  app.eval("redRules.switchWeapon(game.redWeapon)");
  assert.equal(app.eval("game.redWeapon.stars"),2);
  assert.equal(app.eval("game.redWeapon.volleys"),0);
});

test("RED-ORANGE direct explosion deals exactly 1.6x once to every radius-100 victim",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=175;',
    'game.weaponType="redorange";game.enemies=[',
    '{kind:"scout",x:430,y:467,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:500,y:500,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:650,y:467,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}',
    '];firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.2);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-48.16)<1e-8);
  assert.equal(app.eval("game.enemies[2].hp"),50);
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
  assert.ok(Math.abs(app.eval("game.orangeExplosions[0].x")-402)<1e-8);
  assert.equal(app.eval("game.orangeExplosions[0].life"),orangeWeapon.RULES.explosionLifetimeSeconds);
});

test("RED-ORANGE inherits ORANGE frontal shield handling, never 1x+1.6x and never piercing",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=175;',
    'game.weaponType="redorange";game.enemies=[',
    'enemyBehaviors.initializeEnemy({kind:"shield",x:430,y:467,r:36,',
    'hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}),',
    '{kind:"scout",x:475,y:510,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}',
    '];game.enemies[0].shieldHp=20;game.enemies[0].shieldMax=20;',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.2);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),50);
  assert.ok(Math.abs(app.eval("game.enemies[0].shieldHp")-(20-1.84))<1e-9);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-48.16)<1e-9);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
});

test("RED-ORANGE inherits ORANGE Boss turret weak-point priority and radius-100 splash",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.player.x=175;',
    'game.weaponType="redorange";',
    'game.boss={active:true,x:760,y:467,rx:100,ry:80,hp:200,maxHp:200,',
    'parts:[{id:"GUN",x:-155,y:0,r:28,hp:80,maxHp:80}],color:"#fff",core:"#fff"};',
    'game.enemies=[{kind:"scout",x:620,y:540,r:20,hp:50,maxHp:50,',
    'score:25,color:"#fff",core:"#fff"}];',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.35);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.boss.parts[0].hp")-
    (80-1.84*bossParts.BALANCE.weakPointDamageScale))<1e-9);
  assert.equal(app.eval("game.boss.hp"),200);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-9);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
});

test("RED-ORANGE Boss hull receives one 1.6x explosion, even when splash reaches nearby enemy",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.player.x=175;',
    'game.weaponType="redorange";',
    'game.boss={active:true,x:650,y:467,rx:100,ry:80,hp:200,maxHp:200,parts:[],',
    'color:"#fff",core:"#fff"};',
    'game.enemies=[{kind:"scout",x:580,y:550,r:20,hp:50,maxHp:50,',
    'score:25,color:"#fff",core:"#fff"}];',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.35);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.boss.hp")-198.16)<1e-9);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-9);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
});

test("RED-ORANGE exploding a splitter never damages its freshly spawned children",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=175;',
    'game.weaponType="redorange";game.enemies=[{kind:"splitter",',
    'x:430,y:467,r:35,hp:1,maxHp:1,score:60,color:"#fff",core:"#eee"}];',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.2);'
  ].join("\n"));
  assert.equal(app.eval("game.stats.kills"),1);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).length"),2);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).every(e=>e.hp===e.maxHp)"),true);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
});

test("RED-ORANGE fan uses 250 real 1.6x orange-explosion bullets at RED's .38 fan power",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redorange";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'game.fanLog=[];const originalEmit=addPlayerShot;',
    'addPlayerShot=(...args)=>{if(args[7]?.redOrangeFan)',
    'game.fanLog.push({vx:args[2],vy:args[3],power:args[5],',
    'explosive:args[7].orangeBlast});originalEmit(...args)};',
    'game.fireCooldown=0;keys.Space=true;Math.random=()=>0;',
    'updatePlaying(.01);keys.Space=false;'
  ].join("\n"));
  assert.equal(app.eval("game.redWeapon.special.redOrange"),true);
  assert.equal(app.eval("game.redWeapon.stars"),0);
  app.eval('game.state="PAUSED";updatePlaying(6)');
  assert.equal(app.eval("game.fanLog.length"),0);
  assert.equal(app.eval("game.redWeapon.stars"),0);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=10;updatePlaying(5)');
  assert.equal(app.eval("game.fanLog.length"),0);
  app.eval('game.stageMode="WAVE";updatePlaying(1)');
  assert.equal(app.eval("game.redWeapon.stars"),0);
  assert.ok(app.eval("game.fanLog.length")>0);
  app.eval('updatePlaying(2)');
  assert.equal(app.eval("game.fanLog.length"),250);
  assert.equal(app.eval("game.redWeapon.stars"),1);
  assert.equal(app.eval("game.redWeapon.special"),null);
  assert.equal(app.eval("game.fanLog.every(b=>b.power===.38&&b.explosive)"),true);
  assert.equal(app.eval("game.fanLog.every(b=>Math.abs(Math.atan2(b.vy,b.vx))<=Math.PI/18+1e-10)"),true);
  assert.equal(app.eval("game.bullets.every(b=>b.redOrangeShot&&b.orangeBlast)"),true);
});

test("RED-ORANGE individual special fan shot explodes at 1.6x its RED fan base, radius 100",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=175;',
    'game.enemies=[',
    '{kind:"scout",x:400,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:480,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}',
    '];addPlayerShot(300,480,1100,0,5,.38,"#ff9040",redOrangeRules.createShot(true));',
    'updatePlayerBullets(.15);'
  ].join("\n"));
  for(let i=0;i<2;i++)
    assert.ok(Math.abs(app.eval("game.enemies["+i+"].hp")-(50-.38*1.6))<1e-9);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
  assert.equal(app.eval("game.bullets.length"),0);
});

test("RED, RED-WHITE, RED-ORANGE started fan keeps its original bullet type after switching P",()=>{
  const transitions=[
    {start:"red",next:"redorange",pickup:"P_RED_ORANGE",tag:"redSpecial"},
    {start:"redorange",next:"red",pickup:"P_RED",tag:"redOrangeFan"},
    {start:"redwhite",next:"red",pickup:"P_RED",tag:"redWhiteFan"},
    {start:"redorange",next:"redwhite",pickup:"P_RED_WHITE",tag:"redOrangeFan"}
  ];
  for(const t of transitions){
    const app=boot();
    app.eval([
      'game.state="PLAYING";game.stageMode="WAVE";',
      'game.weaponType="'+t.start+'";',
      'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
      'game.fireCooldown=0;keys.Space=true;Math.random=()=>0;',
      'updatePlaying(.01);keys.Space=false;'
    ].join("\n"));
    const startTag=app.eval('Boolean(game.redWeapon.special.redWhite)');
    const fireTag=app.eval('Boolean(game.redWeapon.special.redOrange)');
    assert.equal(startTag,t.start==="redwhite");
    assert.equal(fireTag,t.start==="redorange");
    if(t.start==="redorange"&&t.next==="redwhite")
      app.eval('collectPowerup({type:"P_RED",x:230,y:480,life:1})');
    app.eval('collectPowerup({type:"'+t.pickup+'",x:230,y:480,life:1})');
    assert.equal(app.eval("game.weaponType"),t.next);
    app.eval("updatePlaying(.15)");
    const counts=app.eval([
      '(()=>{const fans=game.bullets.filter(b=>b.redSpecial||b.redWhiteFan||b.redOrangeFan);',
      'return {count:fans.length,matching:fans.filter(b=>b.'+t.tag+').length,',
      'explosive:fans.filter(b=>b.orangeBlast).length,',
      'electric:fans.filter(b=>b.whiteConductive).length};})()'
    ].join("\n"));
    assert.ok(counts.count>0,t.start+" to "+t.next);
    assert.equal(counts.matching,counts.count);
    assert.equal(counts.explosive,t.start==="redorange"?counts.count:0);
    assert.equal(counts.electric,t.start==="redwhite"?counts.count:0);
    app.eval("updatePlaying(2.85)");
    assert.equal(app.eval("game.redWeapon.stars"),1);
    assert.equal(app.eval("game.redWeapon.special"),null);
  }
});

test("RED, RED-WHITE and RED-ORANGE display ONE shared five-star HUD, normal ORANGE hides stars",()=>{
  const app=boot();
  app.eval('game.state="PLAYING";game.weaponType="red";game.redWeapon.stars=4;');
  const hud=()=>app.eval([
    '(()=>{const labels=[];ctx.fillText=t=>labels.push(String(t));',
    'drawHud();return labels;})()'
  ].join("\n"));
  assert.ok(hud().some(x=>x.includes("RED P")&&x.includes("★★★★☆")));
  app.eval('collectPowerup({type:"P_RED_ORANGE",x:240,y:480,life:1})');
  assert.equal(app.eval("game.redWeapon.stars"),4);
  assert.ok(hud().some(x=>x.includes("RED-ORANGE P")&&x.includes("★★★★☆")));
  assert.ok(hud().includes("RED-ORANGE BLAST  R100 X1.6"));
  app.eval('game.invuln=0;damagePlayer()');
  assert.equal(app.eval("game.redWeapon.stars"),3);
  assert.ok(hud().some(x=>x.includes("RED-ORANGE P")&&x.includes("★★★☆☆")));
  app.eval('collectPowerup({type:"P_RED",x:240,y:480,life:1})');
  app.eval('collectPowerup({type:"P_RED_WHITE",x:240,y:480,life:1})');
  assert.equal(app.eval("game.redWeapon.stars"),3);
  assert.ok(hud().some(x=>x.includes("RED-WHITE P")&&x.includes("★★★☆☆")));
  app.eval('collectPowerup({type:"P_ORANGE",x:240,y:480,life:1})');
  assert.equal(hud().some(x=>x.includes("RED-ORANGE P")||x.includes("RED-WHITE P")||x.includes("RED P")),false);
  assert.equal(app.eval("game.redWeapon.stars"),3);
  app.eval('collectPowerup({type:"P_RED_ORANGE",x:240,y:480,life:1})');
  assert.ok(hud().some(x=>x.includes("RED-ORANGE P")&&x.includes("★★★☆☆")));
});

test("RED-ORANGE shared special caps at five stars and BOMB alone never awards a star",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redorange";',
    'game.invuln=999;game.spawnTimer=999;game.formationTimer=999;',
    'game.redWeapon.stars=5;useBomb();'
  ].join("\n"));
  assert.equal(app.eval("game.redWeapon.stars"),5);
  app.eval('redRules.fire(game.redWeapon,0);redOrangeRules.markTriggeredFan(game.redWeapon);updatePlaying(3)');
  assert.equal(app.eval("game.redWeapon.stars"),5);
  assert.equal(app.eval("game.redWeapon.special"),null);
  assert.ok(app.eval('game.message.includes("MAX 5 STARS")'));
});

test("RED-ORANGE gradient pickup, projectiles and HUD only draw, without causing damage",()=>{
  const app=boot();
  const v=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.weaponType="redorange";',
    'game.enemies=[{kind:"scout",x:580,y:467,r:25,hp:100,maxHp:100,',
    'score:30,color:"#fff",core:"#fff"}];',
    'game.powerups=[{type:"P_RED_ORANGE",x:400,y:640,t:0,life:10}];',
    'firePlayerWeapons();const colors=[],labels=[];',
    'ctx.createLinearGradient=()=>({addColorStop:(p,c)=>colors.push(c)});',
    'ctx.fillText=t=>labels.push(String(t));',
    'const hp=game.enemies[0].hp;',
    'drawPowerups();drawPlayerBullets();drawHud();drawFrame(.016);',
    'return {hp,after:game.enemies[0].hp,colors,labels};})()'
  ].join("\n"));
  assert.equal(v.hp,v.after);
  for(const c of ["#f72f50","#ffaf36","#fa344f","#ffad37"])
    assert.ok(v.colors.includes(c),c);
  assert.ok(v.labels.includes("RED-ORANGE BLAST  R100 X1.6"));
  assert.ok(v.labels.some(x=>x.includes("RED-ORANGE P")));
});

test("RED-ORANGE fan respects existing 360 projectile and 48 orange explosion FX budgets",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="redorange";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'redRules.fire(game.redWeapon,0);redOrangeRules.markTriggeredFan(game.redWeapon);',
    'redRules.tick(game.redWeapon,3,(a)=>addPlayerShot(game.player.x+60,game.player.y,',
    'Math.cos(a)*1060,Math.sin(a)*1060,5,.38,"#ff9040",redOrangeRules.createShot(true)));'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),250);
  assert.equal(app.eval("game.bullets.every(b=>b.redOrangeFan&&b.orangeBlast)"),true);
  app.eval('game.bullets=Array.from({length:360},(_,i)=>({x:300,y:100+i*.6,vx:1,vy:0,power:1.15}));firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"),360);
  app.eval('for(let i=0;i<140;i++)addOrangeExplosion(100+i,480)');
  assert.equal(app.eval("game.orangeExplosions.length"),48);
  assert.equal(app.eval("game.orangeExplosions[0].x"),192);
  app.eval('game.state="PAUSED";updatePlaying(1)');
  assert.equal(app.eval("game.orangeExplosions.length"),48);
});

test("original RED, RED-WHITE and ORANGE projectile effects remain isolated after RED-ORANGE swaps",()=>{
  const app=boot();
  app.eval('game.state="PLAYING";game.weaponType="red";firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.redNormal&&!b.orangeBlast)"),true);
  app.eval([
    'game.bullets=[];collectPowerup({type:"P_RED_ORANGE",x:240,y:480,life:1});',
    'firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.every(b=>b.redOrangeShot&&b.orangeBlast&&!b.whiteConductive)"),true);
  app.eval('game.bullets=[];collectPowerup({type:"P_ORANGE",x:240,y:480,life:1});firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.every(b=>b.orangeBlast&&!b.redOrangeShot)"),true);
  app.eval('game.bullets=[];collectPowerup({type:"P_RED",x:240,y:480,life:1});');
  app.eval('collectPowerup({type:"P_RED_WHITE",x:240,y:480,life:1});firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.every(b=>b.whiteConductive&&b.redWhiteShot&&!b.orangeBlast)"),true);
  app.eval('game.bullets=[];collectPowerup({type:"P_RED",x:240,y:480,life:1});firePlayerWeapons()');
  assert.equal(app.eval("game.bullets.every(b=>b.redNormal&&!b.orangeBlast)"),true);
});


test("BROWN-YELLOW P only collects from currently equipped BROWN or itself, other pickups persist",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="yellow";game.weaponLevel=1;game.score=0;',
    'game.brownWeapon.elapsed=.05;',
    'game.powerups=[{type:"P_BROWN_YELLOW",x:175,y:480,r:24,life:30,',
    'vx:0,vy:0,t:0,safeTimer:0}];updatePowerups(.01);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"yellow");
  assert.equal(app.eval("game.powerups.length"),1);
  assert.equal(app.eval("game.weaponLevel"),1);
  assert.equal(app.eval("game.score"),0);
  assert.equal(app.eval("game.brownWeapon.elapsed"),.05);
  assert.ok(app.eval('game.message.includes("REQUIRES BROWN P")'));
  const hint=app.eval("game.messageTimer");
  app.eval("updatePowerups(.01)");
  assert.ok(app.eval("game.messageTimer")<=hint);
  app.eval('collectPowerup({type:"P_BROWN",x:200,y:480,life:1});');
  assert.equal(app.eval("game.weaponType"),"brown");
  app.eval("updatePowerups(.01)");
  assert.equal(app.eval("game.weaponType"),"brownyellow");
  assert.equal(app.eval("game.powerups.length"),0);
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("weaponMeta().name"),"REFRACT LASER");
  app.eval("firePlayerWeapons()");
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.length"),0);
  app.eval("game.powerups=[];dropPlayerPowerOnHit()");
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_BROWN_YELLOW");
  app.eval('collectPowerup({type:"P_BROWN_YELLOW",x:200,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"brownyellow");
  app.eval('collectPowerup({type:"P_ARC_LASER",x:200,y:480,life:10})');
  assert.equal(app.eval("game.weaponType"),"brownyellow",
    "Other BROWN-specific evolutions require an actual BROWN predecessor");
  app.eval('collectPowerup({type:"P_BLUE",x:200,y:480,life:1})');
  const score=app.eval("game.score");
  app.eval('const wrong={type:"P_BROWN_YELLOW",x:200,y:480,life:9};collectPowerup(wrong);game.wrongLife=wrong.life');
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.score"),score);
  assert.equal(app.eval("game.wrongLife"),9);
});

test("BROWN-YELLOW maintains zero bullets, continuous Brown 0.101s tick and 1300 range",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brownyellow";',
    'game.weaponLevel=3;game.player.x=175;game.player.y=480;',
    'game.enemies=[',
    '{kind:"scout",x:460,y:480,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:740,y:480,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];firePlayerWeapons();updateBrownLaser(.100,true);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.length"),0);
  assert.equal(app.eval("getFireCooldown()"),.101);
  assert.equal(app.eval("game.enemies[0].hp"),100);
  assert.equal(app.eval("game.enemies[1].hp"),100);
  assert.equal(app.eval("game.brownBeam.x"),435);
  assert.equal(app.eval("game.brownBeam.startX"),235);
  assert.equal(app.eval("game.brownBeam.refraction.target"),app.eval("game.enemies[1]"));
  app.eval("updateBrownLaser(.001,true)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-9);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-98.85)<1e-9);
  assert.equal(app.eval("game.bullets.length"),0);
});

test("BROWN-YELLOW one refraction hits ONE nearby second enemy and never chains into third",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brownyellow";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[',
    '{kind:"scout",x:460,y:480,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:700,y:600,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:1000,y:600,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.brownBeam.target"),app.eval("game.enemies[0]"));
  assert.equal(app.eval("game.brownBeam.refraction.target"),app.eval("game.enemies[1]"));
  assert.equal(app.eval("game.enemies[0].hp"),98.85);
  assert.equal(app.eval("game.enemies[1].hp"),98.85);
  assert.equal(app.eval("game.enemies[2].hp"),100);
  assert.equal(app.eval("game.brownBeam.refraction.refraction"),undefined);
});

test("BROWN-YELLOW with a single live enemy behaves EXACTLY as BROWN with no second ray",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brownyellow";',
    'game.enemies=[{kind:"scout",x:530,y:480,r:25,hp:100,maxHp:100,',
    'score:20,color:"#fff",core:"#eee"}];',
    'updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.brownBeam.refraction"),null);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-9);
  assert.equal(app.eval("game.bullets.length"),0);
});

test("BROWN-YELLOW second beam may bend backward to nearest DIFFERENT living enemy",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brownyellow";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[',
    '{kind:"scout",x:460,y:480,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:300,y:740,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.brownBeam.target"),app.eval("game.enemies[0]"));
  assert.equal(app.eval("game.brownBeam.refraction.target"),app.eval("game.enemies[1]"));
  assert.ok(app.eval("game.brownBeam.refraction.x")<app.eval("game.brownBeam.x"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-9);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-98.85)<1e-9);
});

test("BROWN-YELLOW frontal shield blocks first ray normally; secondary still gets 1.15 hit",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brownyellow";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[',
    'enemyBehaviors.initializeEnemy({kind:"shield",x:460,y:480,r:39,',
    'hp:100,maxHp:100,score:30,color:"#fff",core:"#eee"}),',
    '{kind:"scout",x:730,y:560,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];game.enemies[0].shieldHp=10;game.enemies[0].shieldMax=10;',
    'updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].shieldHp")-8.85)<1e-9);
  assert.equal(app.eval("game.enemies[0].hp"),100);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-98.85)<1e-9);
});

test("BROWN-YELLOW blocks SECOND ray against a closer shield and does not pierce third enemy",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brownyellow";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[',
    '{kind:"scout",x:460,y:480,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    'enemyBehaviors.initializeEnemy({kind:"shield",x:680,y:480,r:39,',
    'hp:100,maxHp:100,score:30,color:"#fff",core:"#eee"}),',
    '{kind:"scout",x:980,y:480,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];game.enemies[1].shieldHp=10;game.enemies[1].shieldMax=10;',
    'updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.brownBeam.refraction.target"),app.eval("game.enemies[1]"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-9);
  assert.ok(Math.abs(app.eval("game.enemies[1].shieldHp")-8.85)<1e-9);
  assert.equal(app.eval("game.enemies[1].hp"),100);
  assert.equal(app.eval("game.enemies[2].hp"),100);
});

test("BROWN-YELLOW secondary laser hits distinct Boss turret weakpoint but never hits hull twice",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="brownyellow";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:460,y:480,r:25,hp:100,maxHp:100,',
    'score:20,color:"#fff",core:"#eee"}];',
    'game.boss={active:true,x:870,y:480,rx:110,ry:80,hp:200,maxHp:200,',
    'parts:[{id:"TURRET",x:-155,y:0,r:25,hp:100,maxHp:100}],',
    'color:"#fff",core:"#eee"};',
    'updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.brownBeam.kind"),"enemy");
  assert.equal(app.eval("game.brownBeam.refraction.kind"),"turret");
  assert.equal(app.eval("game.brownBeam.refraction.target"),app.eval("game.boss"));
  assert.ok(Math.abs(app.eval("game.boss.parts[0].hp")-
    (100-1.15*bossParts.BALANCE.weakPointDamageScale))<1e-9);
  assert.equal(app.eval("game.boss.hp"),200);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-9);
});

test("BROWN-YELLOW refraction from Boss turret hits another enemy without striking Boss again",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="brownyellow";',
    'game.player.x=175;game.player.y=480;',
    'game.boss={active:true,x:680,y:480,rx:110,ry:80,hp:200,maxHp:200,',
    'parts:[{id:"TURRET",x:-155,y:0,r:25,hp:100,maxHp:100}],',
    'color:"#fff",core:"#eee"};',
    'game.enemies=[{kind:"scout",x:960,y:650,r:25,hp:100,maxHp:100,',
    'score:20,color:"#fff",core:"#eee"}];',
    'updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.brownBeam.kind"),"turret");
  assert.equal(app.eval("game.brownBeam.refraction.kind"),"enemy");
  assert.equal(app.eval("game.brownBeam.refraction.target"),app.eval("game.enemies[0]"));
  assert.ok(app.eval("game.boss.parts[0].hp")<100);
  assert.equal(app.eval("game.boss.hp"),200);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-9);
  app.eval("game.enemies=[];updateBrownLaser(.101,true)");
  assert.equal(app.eval("game.brownBeam.refraction"),null);
});

test("BROWN-YELLOW one shared laser clock ticks BOTH targets with same Overdrive factor",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brownyellow";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[',
    '{kind:"scout",x:460,y:480,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:740,y:570,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];game.combat.energy=100;activateOverdrive();',
    'updateBrownLaser(.303,true);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  const damage1=100-app.eval("game.enemies[0].hp");
  const damage2=100-app.eval("game.enemies[1].hp");
  assert.ok(Math.abs(damage1-damage2)<1e-9);
  assert.ok(damage1>3*1.15);
  assert.equal(app.eval("game.brownWeapon.elapsed")<1e-8,true);
});

test("BROWN-YELLOW releases FIRE immediately, pauses and clears refraction on weapon change",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brown";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'game.enemies=[',
    '{kind:"scout",x:520,y:480,r:25,hp:100,maxHp:100,',
    'score:30,color:"#fff",core:"#fff",vx:0,vy:0,t:0,wave:0,shootCd:999,shootBase:999},',
    '{kind:"scout",x:820,y:600,r:25,hp:100,maxHp:100,',
    'score:30,color:"#fff",core:"#fff",vx:0,vy:0,t:0,wave:0,shootCd:999,shootBase:999}',
    '];collectPowerup({type:"P_BROWN_YELLOW",x:300,y:480,life:1});',
    'keys.Space=true;updatePlaying(.06);updatePlaying(.05);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-98.85)<1e-8);
  const hp=app.eval("game.enemies[0].hp");
  app.eval('game.state="PAUSED";updatePlaying(2)');
  assert.equal(app.eval("game.enemies[0].hp"),hp);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=10;updatePlaying(2)');
  assert.equal(app.eval("game.enemies[0].hp"),hp);
  app.eval('game.stageMode="WAVE";keys.Space=false;updatePlaying(.02)');
  assert.equal(app.eval("game.brownBeam"),null);
  assert.equal(app.eval("game.brownWeapon.elapsed"),0);
  app.eval('collectPowerup({type:"P_BROWN",x:300,y:480,life:1});');
  assert.equal(app.eval("game.weaponType"),"brown");
  app.eval('updateBrownLaser(.101,true)');
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-(hp-1.15))<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-98.85)<1e-8,
    "Original BROWN retains first-obstruction-only behavior after switching");
});

test("BROWN-YELLOW can't refract to just-spawned splitter children in original laser tick",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brownyellow";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[',
    '{kind:"splitter",x:460,y:480,r:35,hp:1,maxHp:1,',
    'score:30,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:730,y:540,r:25,hp:100,maxHp:100,',
    'score:30,color:"#fff",core:"#eee"}',
    '];updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.stats.kills"),1);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).length"),2);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).every(e=>e.hp===e.maxHp)"),true);
  assert.ok(Math.abs(app.eval("game.enemies.find(e=>!e.minion&&e.hp>0).hp")-98.85)<1e-8);
});

test("BROWN-YELLOW gradient pickup and both laser lines are cosmetic and do not modify health",()=>{
  const app=boot();
  const v=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.weaponType="brownyellow";game.player.x=175;game.player.y=480;',
    'game.enemies=[',
    '{kind:"scout",x:460,y:480,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:710,y:590,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];game.powerups=[{type:"P_BROWN_YELLOW",x:500,y:680,life:20,t:0}];',
    'updateBrownLaser(.04,true);',
    'const colors=[],lines=[],labels=[];',
    'ctx.createLinearGradient=()=>({addColorStop:(p,c)=>colors.push(c)});',
    'ctx.lineTo=(x,y)=>lines.push([x,y]);',
    'ctx.fillText=t=>labels.push(String(t));',
    'const hp=game.enemies.map(e=>e.hp),time=game.brownWeapon.elapsed;',
    'drawPowerups();drawBrownLaser();drawHud();',
    'return {hp,after:game.enemies.map(e=>e.hp),time,end:game.brownWeapon.elapsed,',
    'colors,lines,labels,beam:game.brownBeam};})()'
  ].join("\n"));
  assert.deepEqual(v.hp,v.after);
  assert.equal(v.time,v.end);
  assert.ok(v.lines.some(([x,y])=>Math.abs(x-v.beam.x)<1e-8&&Math.abs(y-v.beam.y)<1e-8));
  assert.ok(v.lines.some(([x,y])=>Math.abs(x-v.beam.refraction.x)<1e-8&&Math.abs(y-v.beam.refraction.y)<1e-8));
  for(const col of ["#88502e","#ffda52","#91603d","#ffd26c","#fff17c"])
    assert.ok(v.colors.includes(col),col);
  assert.ok(v.labels.includes("REFRACT LASER  1 HOP"));
});

test("BROWN-YELLOW leaves ordinary BROWN and cyan-white ARC LASER independent",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=175;',
    'game.enemies=[',
    '{kind:"scout",x:460,y:480,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:740,y:480,r:25,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];game.weaponType="brown";updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.brownBeam.refraction"),undefined);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-9);
  assert.equal(app.eval("game.enemies[1].hp"),100);
  app.eval('collectPowerup({type:"P_ARC_LASER",x:200,y:480,life:1});updateBrownLaser(.101,true)');
  assert.equal(app.eval("game.weaponType"),"arcLaser");
  assert.equal(app.eval("game.brownBeam.arcLaser"),true);
  assert.ok(app.eval("game.enemies[1].hp")<100);
  app.eval('collectPowerup({type:"P_BROWN",x:200,y:480,life:1});');
  app.eval('collectPowerup({type:"P_BROWN_YELLOW",x:200,y:480,life:1});');
  assert.equal(app.eval("game.weaponType"),"brownyellow");
  assert.equal(app.eval("game.bullets.length"),0);
});



test("PURPLE-WHITE forces one damage-free second after five seconds of real laser fire",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="purplewhite";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:650,y:480,r:30,hp:2000,maxHp:2000,',
    'score:25,color:"#fff",core:"#eee"}];',
    'for(let i=0;i<50;i++) updateBrownLaser(.1,true);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.brownBeam"),null);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-(2000-49*5*1.15))<1e-7);
  assert.equal(app.eval("game.purpleWhiteDuty.restRemaining"),1);
  assert.equal(app.eval("game.purpleWhiteDuty.firedSeconds"),0);
  const damageHp=app.eval("game.enemies[0].hp");
  app.eval("updateBrownLaser(.5,true)");
  assert.equal(app.eval("game.brownBeam"),null);
  assert.equal(app.eval("game.enemies[0].hp"),damageHp);
  const labels=app.eval('(()=>{const x=[];ctx.fillText=t=>x.push(String(t));drawHud();return x;})()');
  assert.ok(labels.includes("PENTA COOL  0.5S"));
  app.eval("updateBrownLaser(.499,true)");
  assert.equal(app.eval("game.brownBeam"),null);
  assert.equal(app.eval("game.enemies[0].hp"),damageHp);
  app.eval("updateBrownLaser(.002,true)");
  assert.equal(app.eval("game.purpleWhiteDuty.restRemaining"),0);
  assert.equal(app.eval("game.brownBeam.beams.length"),5);
  app.eval("updateBrownLaser(.1,true)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-(damageHp-5.75))<1e-8);
});

test("PURPLE-WHITE firing heat survives release and a temporary BROWN switch",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="purplewhite";',
    'game.enemies=[{kind:"scout",x:620,y:480,r:25,hp:2000,maxHp:2000,',
    'score:20,color:"#fff",core:"#eee"}];',
    'for(let i=0;i<48;i++) updateBrownLaser(.1,true);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.purpleWhiteDuty.firedSeconds")-4.8)<1e-8);
  app.eval("updateBrownLaser(.5,false)");
  assert.ok(Math.abs(app.eval("game.purpleWhiteDuty.firedSeconds")-4.8)<1e-8);
  assert.equal(app.eval("game.brownBeam"),null);
  app.eval('collectPowerup({type:"P_BROWN",x:200,y:480,life:1})');
  const brownHp=app.eval("game.enemies[0].hp");
  app.eval("updateBrownLaser(.101,true)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-(brownHp-1.15))<1e-8,
    "normal BROWN laser remains operational");
  app.eval('collectPowerup({type:"P_PURPLE_WHITE",x:200,y:480,life:1})');
  assert.ok(Math.abs(app.eval("game.purpleWhiteDuty.firedSeconds")-4.8)<1e-8,
    "P change must not erase accumulated heat");
  app.eval("updateBrownLaser(.2,true)");
  assert.equal(app.eval("game.purpleWhiteDuty.restRemaining"),1);
  assert.equal(app.eval("game.brownBeam"),null);
});

test("PURPLE-WHITE cooldown freezes across PAUSE, TRANSITION and BOSS_REWARD",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="purplewhite";',
    'game.enemies=[{kind:"scout",x:620,y:480,r:25,hp:2000,maxHp:2000,',
    'score:20,color:"#fff",core:"#eee"}];',
    'for(let i=0;i<50;i++) updateBrownLaser(.1,true);',
    'game.purpleWhiteSnapshot=game.enemies[0].hp;',
    'game.state="PAUSED";updatePlaying(5);'
  ].join("\n"));
  assert.equal(app.eval("game.purpleWhiteDuty.restRemaining"),1);
  assert.equal(app.eval("game.enemies[0].hp"),app.eval("game.purpleWhiteSnapshot"));
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=9;updatePlaying(5)');
  assert.equal(app.eval("game.purpleWhiteDuty.restRemaining"),1);
  app.eval('game.stageMode="BOSS_REWARD";game.rewardTimer=99;updatePlaying(5)');
  assert.equal(app.eval("game.purpleWhiteDuty.restRemaining"),1);
  app.eval('game.stageMode="WAVE";updateBrownLaser(.25,false)');
  assert.ok(Math.abs(app.eval("game.purpleWhiteDuty.restRemaining")-.75)<1e-8);
  assert.equal(app.eval("game.brownBeam"),null);
});

test("PURPLE-WHITE no-target time does not heat lasers or grant free damage",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="purplewhite";',
    'updateBrownLaser(90,true);'
  ].join("\n"));
  assert.equal(app.eval("game.purpleWhiteDuty.firedSeconds"),0);
  assert.equal(app.eval("game.purpleWhiteDuty.restRemaining"),0);
  assert.equal(app.eval("game.brownBeam"),null);
});

test("PURPLE-WHITE cooling beam is not rendered even with a locked victim",()=>{
  const app=boot();
  const result=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";game.weaponType="purplewhite";',
    'game.enemies=[{kind:"scout",x:600,y:480,r:25,hp:2000,maxHp:2000,',
    'score:20,color:"#fff",core:"#eee"}];',
    'for(let i=0;i<50;i++)updateBrownLaser(.1,true);',
    'const hp=game.enemies[0].hp,steps=game.purpleWhiteDuty.restRemaining;',
    'const lines=[];ctx.lineTo=(x,y)=>lines.push([x,y]);drawBrownLaser();',
    'return {hp,after:game.enemies[0].hp,rest:steps,lines,beam:game.brownBeam};})()'
  ].join("\n"));
  assert.equal(result.rest,1);
  assert.equal(result.lines.length,0);
  assert.equal(result.beam,null);
  assert.equal(result.after,result.hp);
});

test("PURPLE-WHITE P requires currently equipped PURPLE or BROWN; invalid drop is persistent",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="red";game.weaponLevel=1;game.score=0;',
    'game.brownWeapon.elapsed=.05;',
    'game.powerups=[{type:"P_PURPLE_WHITE",x:175,y:480,r:24,life:20,',
    'vx:0,vy:0,t:0,safeTimer:0}];updatePowerups(.01);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"red");
  assert.equal(app.eval("game.weaponLevel"),1);
  assert.equal(app.eval("game.score"),0);
  assert.equal(app.eval("game.brownWeapon.elapsed"),.05);
  assert.equal(app.eval("game.powerups.length"),1);
  assert.ok(app.eval('game.message.includes("REQUIRES PURPLE OR BROWN P")'));
  const timer=app.eval("game.messageTimer");
  app.eval("updatePowerups(.01)");
  assert.ok(app.eval("game.messageTimer")<=timer);
  app.eval('collectPowerup({type:"P_PURPLE",x:200,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"purple");
  app.eval("updatePowerups(.01)");
  assert.equal(app.eval("game.weaponType"),"purplewhite");
  assert.equal(app.eval("weaponMeta().name"),"PENTA LOCK");
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("game.powerups.length"),0);
  app.eval("firePlayerWeapons()");
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.length"),0);
  app.eval("game.powerups=[];dropPlayerPowerOnHit()");
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_PURPLE_WHITE");
  const points=app.eval("game.score");
  app.eval('collectPowerup({type:"P_PURPLE_WHITE",x:200,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"purplewhite");
  assert.ok(app.eval("game.score")>points);
  app.eval('collectPowerup({type:"P_BROWN_YELLOW",x:200,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"purplewhite",
    "BrownYellow still requires ordinary Brown; purplewhite is not BROWN");
  app.eval('collectPowerup({type:"P_BLUE",x:200,y:480,life:1})');
  const score=app.eval("game.score");
  app.eval('const wrong={type:"P_PURPLE_WHITE",x:200,y:480,life:8};collectPowerup(wrong);game.wrongLife=wrong.life');
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.score"),score);
  assert.equal(app.eval("game.wrongLife"),8);
});

test("PURPLE-WHITE evolves directly from BROWN, remains one BROWN clock and zero bullet objects",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="brown";',
    'game.weaponLevel=2;game.player.x=175;game.player.y=480;',
    'collectPowerup({type:"P_PURPLE_WHITE",x:250,y:480,life:1});',
    'game.enemies=[{kind:"scout",x:620,y:480,r:25,hp:100,maxHp:100,',
    'score:20,color:"#fff",core:"#eee"}];',
    'firePlayerWeapons();updateBrownLaser(.100,true);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"purplewhite");
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("getFireCooldown()"),.101);
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.length"),0);
  assert.equal(app.eval("game.enemies[0].hp"),100);
  assert.equal(app.eval("game.brownBeam.beams.length"),5);
  app.eval("updateBrownLaser(.001,true)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-94.25)<1e-8);
  assert.equal(app.eval("purpleWhiteRules.groups(game.brownBeam.beams)[0].count"),5);
  assert.equal(app.eval("game.brownWeapon.elapsed"),0);
});

test("PURPLE-WHITE distributes 5 beams among TWO separate enemies as 3x and 2x",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="purplewhite";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[',
    '{kind:"scout",x:520,y:340,r:24,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:580,y:640,r:24,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];updateBrownLaser(.101,true);'
  ].join("\n"));
  const groups=app.eval('purpleWhiteRules.groups(game.brownBeam.beams).map(g=>({index:game.enemies.indexOf(g.target),count:g.count}))');
  assert.equal(groups.length,2);
  assert.deepEqual(groups.map(x=>x.count).sort((a,b)=>b-a),[3,2]);
  assert.equal(groups.reduce((n,g)=>n+g.count,0),5);
  for(const g of groups)
    assert.ok(Math.abs(app.eval("game.enemies["+g.index+"].hp")-(100-1.15*g.count))<1e-9);
  assert.equal(app.eval("game.bullets.length"),0);
});

test("PURPLE-WHITE prioritizes three and five distinct enemies before assigning duplicate rays",()=>{
  for(const n of [3,5]){
    const app=boot();
    const y=[250,360,480,600,720];
    const x=[520,570,620,570,520];
    app.eval([
      'game.state="PLAYING";game.weaponType="purplewhite";game.player.x=175;',
      'game.player.y=480;game.enemies='+JSON.stringify(Array.from({length:n},(_,i)=>({
        kind:"scout",x:x[i],y:y[i],r:24,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"
      })))+';',
      'updateBrownLaser(.101,true);'
    ].join("\n"));
    const groups=app.eval("purpleWhiteRules.groups(game.brownBeam.beams).map(g=>g.count)");
    assert.equal(groups.length,n,"target count "+n);
    assert.equal(groups.reduce((a,b)=>a+b,0),5);
    assert.ok(Math.max(...groups)-Math.min(...groups)<=1);
    if(n===3)assert.deepEqual(groups.sort((a,b)=>b-a),[2,2,1]);
    else assert.deepEqual(groups,[1,1,1,1,1]);
    assert.equal(app.eval("game.bullets.length"),0);
  }
});

test("PURPLE-WHITE honors BROWN first obstruction; covered enemy never receives a rear laser",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="purplewhite";game.player.x=175;',
    'game.player.y=480;game.enemies=[',
    '{kind:"scout",x:450,y:480,r:38,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:750,y:480,r:24,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-94.25)<1e-9);
  assert.equal(app.eval("game.enemies[1].hp"),100);
  assert.equal(app.eval("purpleWhiteRules.groups(game.brownBeam.beams).length"),1);
  app.eval("game.enemies[0].hp=0;updateBrownLaser(.101,true)");
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-94.25)<1e-9);
});

test("PURPLE-WHITE shields absorb ALL five hits and don't lose 5x overdrive scaling",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="purplewhite";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",',
    'x:600,y:480,r:39,hp:100,maxHp:100,score:25,color:"#fff",core:"#eee"})];',
    'game.enemies[0].shieldHp=30;game.enemies[0].shieldMax=30;',
    'game.combat.energy=100;activateOverdrive();',
    'game.lockScale=combatRules.weaponDamageScale(game.combat,selectedShip().id);',
    'updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),100);
  const shield=app.eval("game.enemies[0].shieldHp");
  const scale=app.eval("game.lockScale");
  assert.ok(Math.abs(shield-(30-5*1.15*scale))<1e-9);
  assert.equal(app.eval("game.bullets.length"),0);
});

test("PURPLE-WHITE five rays target living BOSS turrets, then exposed hull only when turrets die",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";game.weaponType="purplewhite";',
    'game.player.x=175;game.player.y=480;',
    'game.boss={active:true,x:900,y:480,rx:105,ry:85,hp:400,maxHp:400,',
    'parts:[{id:"T1",x:-155,y:-52,r:28,hp:100,maxHp:100},',
    '{id:"T2",x:-155,y:52,r:28,hp:100,maxHp:100}],',
    'color:"#fff",core:"#eee"};',
    'updateBrownLaser(.101,true);'
  ].join("\n"));
  const groups=app.eval('purpleWhiteRules.groups(game.brownBeam.beams).map(g=>({index:game.boss.parts.indexOf(g.part),count:g.count,kind:g.kind}))');
  assert.equal(groups.length,2);
  assert.equal(groups.reduce((n,g)=>n+g.count,0),5);
  assert.ok(groups.every(g=>g.kind==="turret"&&g.index>=0));
  assert.equal(app.eval("game.boss.hp"),400);
  for(const g of groups){
    const expected=100-1.15*g.count*app.eval("bossParts.BALANCE.weakPointDamageScale");
    assert.ok(Math.abs(app.eval("game.boss.parts["+g.index+"].hp")-expected)<1e-8);
  }
  app.eval("game.boss.parts.forEach(p=>p.hp=0);updateBrownLaser(.101,true)");
  assert.ok(Math.abs(app.eval("game.boss.hp")-394.25)<1e-8);
  assert.equal(app.eval("purpleWhiteRules.groups(game.brownBeam.beams)[0].kind"),"boss");
  assert.equal(app.eval("purpleWhiteRules.groups(game.brownBeam.beams)[0].count"),5);
});

test("PURPLE-WHITE lock redistribution after a kill keeps five lanes without duplicate kill credit",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="purplewhite";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[',
    '{kind:"scout",x:520,y:340,r:24,hp:1,maxHp:1,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:580,y:640,r:24,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];updateBrownLaser(.202,true);'
  ].join("\n"));
  assert.equal(app.eval("game.stats.kills"),1);
  assert.equal(app.eval("game.enemies[0].hp")<=0,true);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-(100-2*1.15-5*1.15))<1e-9);
  assert.equal(app.eval("purpleWhiteRules.groups(game.brownBeam.beams)[0].count"),5);
  assert.equal(app.eval("game.brownWeapon.elapsed"),0);
});

test("PURPLE-WHITE no target resets timer, never spawns bullets or damages behind player",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="purplewhite";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:80,y:480,r:25,hp:100,maxHp:100,',
    'score:25,color:"#fff",core:"#eee"}];',
    'updateBrownLaser(1,true);'
  ].join("\n"));
  assert.equal(app.eval("game.brownBeam"),null);
  assert.equal(app.eval("game.brownWeapon.elapsed"),0);
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.enemies[0].hp"),100);
});

test("PURPLE-WHITE holds FIRE on 0.101s clock, and stops on release, PAUSE and TRANSITION",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="purple";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'game.enemies=[{kind:"scout",x:620,y:480,r:25,hp:100,maxHp:100,',
    'score:25,color:"#fff",core:"#eee",vx:0,vy:0,t:0,wave:0,',
    'shootCd:999,shootBase:999}];',
    'collectPowerup({type:"P_PURPLE_WHITE",x:200,y:480,life:1});',
    'keys.Space=true;updatePlaying(.06);updatePlaying(.05);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-94.25)<1e-9);
  assert.equal(app.eval("game.bullets.length"),0);
  const hp=app.eval("game.enemies[0].hp");
  app.eval('game.state="PAUSED";updatePlaying(2)');
  assert.equal(app.eval("game.enemies[0].hp"),hp);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=10;updatePlaying(2)');
  assert.equal(app.eval("game.enemies[0].hp"),hp);
  app.eval('game.stageMode="WAVE";keys.Space=false;updatePlaying(.02)');
  assert.equal(app.eval("game.brownBeam"),null);
  assert.equal(app.eval("game.brownWeapon.elapsed"),0);
  app.eval('collectPowerup({type:"P_BROWN",x:200,y:480,life:1});');
  assert.equal(app.eval("game.weaponType"),"brown");
  app.eval('updateBrownLaser(.101,true)');
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-(hp-1.15))<1e-9);
});

test("PURPLE-WHITE rendering draws all five white-violet gradients with NO combat mutations",()=>{
  const app=boot();
  const r=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.weaponType="purplewhite";game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:600,y:480,r:25,hp:100,maxHp:100,',
    'score:20,color:"#fff",core:"#eee"}];',
    'game.powerups=[{type:"P_PURPLE_WHITE",x:500,y:680,t:0,life:20}];',
    'updateBrownLaser(.08,true);',
    'const colors=[],lines=[],labels=[];',
    'ctx.createLinearGradient=()=>({addColorStop:(p,c)=>colors.push(c)});',
    'ctx.lineTo=(x,y)=>lines.push([x,y]);',
    'ctx.fillText=t=>labels.push(String(t));',
    'const hp=game.enemies[0].hp,elapsed=game.brownWeapon.elapsed;',
    'drawPowerups();drawBrownLaser();drawHud();',
    'return {hp,after:game.enemies[0].hp,elapsed,end:game.brownWeapon.elapsed,',
    'colors,lines,labels,beams:game.brownBeam.beams.length};})()'
  ].join("\n"));
  assert.equal(r.hp,r.after);
  assert.equal(r.elapsed,r.end);
  assert.equal(r.beams,5);
  assert.ok(r.lines.length>=15);
  for(const color of ["#7935d8","#ffffff","#9446f5","#cda1ff"])
    assert.ok(r.colors.includes(color),color);
  assert.ok(r.labels.includes("PENTA LOCK  5 BEAMS"));
});

test("PURPLE-WHITE preserves normal PURPLE spread, BROWN one-target laser and ARC LASER piercing",()=>{
  const app=boot();
  app.eval('game.state="PLAYING";game.weaponType="purple";firePlayerWeapons()');
  assert.ok(app.eval("game.bullets.length")>=3);
  app.eval([
    'game.bullets=[];collectPowerup({type:"P_BROWN",x:200,y:480,life:1});',
    'game.enemies=[',
    '{kind:"scout",x:460,y:480,r:30,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:740,y:480,r:24,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-9);
  assert.equal(app.eval("game.enemies[1].hp"),100);
  app.eval('collectPowerup({type:"P_ARC_LASER",x:200,y:480,life:1});updateBrownLaser(.101,true)');
  assert.equal(app.eval("game.weaponType"),"arcLaser");
  assert.ok(app.eval("game.enemies[1].hp")<100);
  app.eval('collectPowerup({type:"P_BROWN",x:200,y:480,life:1});');
  app.eval('collectPowerup({type:"P_PURPLE_WHITE",x:200,y:480,life:1});');
  assert.equal(app.eval("game.weaponType"),"purplewhite");
  assert.equal(app.eval("game.bullets.length"),0);
});

test("PURPLE-WHITE never multiplies one target by 25, even under fighter Overdrive",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="purplewhite";',
    'game.enemies=[{kind:"scout",x:600,y:480,r:26,hp:100,maxHp:100,',
    'score:25,color:"#fff",core:"#eee"}];',
    'game.combat.energy=100;activateOverdrive();',
    'game.fiveScale=combatRules.weaponDamageScale(game.combat,selectedShip().id);',
    'updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-
    (100-1.15*5*app.eval("game.fiveScale")))<1e-9);
  assert.equal(app.eval("game.brownBeam.beams.length"),5);
});

test("PURPLE-WHITE planning stays bounded with many enemies and still locks at most 5 rays",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="purplewhite";',
    'game.enemies=Array.from({length:150},(_,i)=>({',
    'kind:"scout",x:400+(i%15)*45,y:95+Math.floor(i/15)*82,r:14,',
    'hp:100,maxHp:100,score:2,color:"#fff",core:"#eee"}));',
    'updateBrownLaser(.101,true);'
  ].join("\n"));
  assert.ok(app.eval("game.brownBeam.beams.length")<=5);
  assert.ok(app.eval("game.brownBeam.beams.length")>0);
  assert.equal(app.eval("game.bullets.length"),0);
  assert.equal(app.eval("game.missiles.length"),0);
});

test("BLUE-BLACK drop only upgrades from BLACK or same P and preserves rejected pickups",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="blue";game.weaponLevel=1;game.score=0;',
    'game.powerups=[{type:"P_BLUE_BLACK",x:175,y:480,r:24,life:20,',
    'vx:0,vy:0,t:0,safeTimer:0}];updatePowerups(.01);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blue");
  assert.equal(app.eval("game.score"),0);
  assert.equal(app.eval("game.weaponLevel"),1);
  assert.equal(app.eval("game.powerups.length"),1);
  assert.ok(app.eval('game.message.includes("REQUIRES BLACK P")'));
  app.eval('collectPowerup({type:"P_BLACK",x:220,y:480,life:1});updatePowerups(.01)');
  assert.equal(app.eval("game.weaponType"),"blueblack");
  assert.equal(app.eval("weaponMeta().name"),"DEEP FREEZE");
  assert.equal(app.eval("game.powerups.length"),0);
  app.eval("game.powerups=[];dropPlayerPowerOnHit()");
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_BLUE_BLACK");
  app.eval('collectPowerup({type:"P_BLUE_BLACK",x:220,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"blueblack");
  app.eval('collectPowerup({type:"P_PURPLE",x:220,y:480,life:1})');
  const score=app.eval("game.score");
  app.eval('const blocked={type:"P_BLUE_BLACK",x:220,y:480,life:9};collectPowerup(blocked);game.blockedLife=blocked.life');
  assert.equal(app.eval("game.weaponType"),"purple");
  assert.equal(app.eval("game.score"),score);
  assert.equal(app.eval("game.blockedLife"),9);
});

test("BLUE-BLACK uses unchanged BLACK twin-shot lanes/power/cadence",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="black";game.player.x=175;',
    'game.player.y=480;game.weaponLevel=3;firePlayerWeapons();',
    'game.oldShots=JSON.stringify(game.bullets.map(b=>',
    '({x:b.x,y:b.y,vx:b.vx,vy:b.vy,r:b.r,power:b.power})));',
    'game.bullets=[];collectPowerup({type:"P_BLUE_BLACK",x:200,y:480,life:1});',
    'firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"blueblack");
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("JSON.stringify(game.bullets.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,r:b.r,power:b.power})))"),app.eval("game.oldShots"));
  assert.equal(app.eval("game.bullets.every(b=>b.blackSlow&&b.blueBlackSlow)"),true);
  assert.equal(app.eval("game.bullets[0].y"),470);
  assert.equal(app.eval("game.bullets[1].y"),492);
  assert.equal(app.eval("getFireCooldown()"),.101);
  assert.equal(app.eval("game.missiles.length"),0);
});

test("BLUE-BLACK real enemy hit slows BOTH movement and firing time by 90%",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="blueblack";game.player.x=200;',
    'game.player.y=480;game.enemies=[{kind:"scout",x:410,y:470,r:22,',
    'hp:50,maxHp:50,score:30,color:"#fff",core:"#eee",',
    'vx:-100,vy:0,t:0,wave:0,shootCd:2,shootBase:10}];',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.2);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].slowRemaining"),5);
  assert.equal(app.eval("game.enemies[0].slowScale"),.1);
  assert.ok(app.eval("game.enemies[0].hp")<50);
  app.eval("updateEnemies(1)");
  assert.ok(Math.abs(app.eval("game.enemies[0].x")-400)<1e-9);
  assert.ok(Math.abs(app.eval("game.enemies[0].shootCd")-1.9)<1e-9);
  assert.ok(Math.abs(app.eval("game.enemies[0].t")-.1)<1e-9);
  assert.equal(app.eval("game.enemies[0].slowRemaining"),4);
});

test("BLUE-BLACK slows shielded enemy even when frontal shield absorbs bullet",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="blueblack";game.player.x=180;',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",',
    'x:400,y:480,r:39,hp:50,maxHp:50,score:35,color:"#fff",core:"#eee"})];',
    'addPlayerShot(280,480,1100,0,9,1.15,"#2760f5",blueBlackRules.createShot());',
    'updatePlayerBullets(.11);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),50);
  assert.ok(app.eval("game.enemies[0].shieldHp < game.enemies[0].shieldMax"));
  assert.equal(app.eval("game.enemies[0].slowRemaining"),5);
  assert.equal(app.eval("game.enemies[0].slowScale"),.1);
});

test("BLUE-BLACK shot provenance survives P swaps and stun freeze",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="black";game.player.x=200;',
    'game.player.y=480;game.enemies=[{kind:"scout",x:460,y:470,r:28,',
    'hp:50,maxHp:50,score:25,color:"#fff",core:"#eee",',
    'vx:-100,vy:0,shootCd:3,shootBase:10}];',
    'collectPowerup({type:"P_BLUE_BLACK",x:240,y:480,life:1});',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'collectPowerup({type:"P_WHITE",x:240,y:480,life:1});',
    'updatePlayerBullets(.23);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"white");
  assert.equal(app.eval("game.enemies[0].slowRemaining"),5);
  assert.equal(app.eval("game.enemies[0].slowScale"),.1);
  app.eval("grayRules.apply(game.enemies[0],.22);updateEnemies(.25)");
  assert.equal(app.eval("game.enemies[0].grayStunRemaining"),.25);
  assert.equal(app.eval("game.enemies[0].slowRemaining"),4.75);
  app.eval("updateEnemies(.25)");
  assert.equal(app.eval("game.enemies[0].slowRemaining"),4.5);
});

test("BLUE-BLACK Boss hull and turret hits slow movement and attacks by 90%",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";spawnBoss();',
    'game.boss.active=true;game.boss.x=1010;game.boss.y=480;',
    'game.player.x=500;game.player.y=480;',
    'addPlayerShot(700,480,1500,0,9,1.15,"#2760f5",blueBlackRules.createShot());',
    'updatePlayerBullets(.25);'
  ].join("\n"));
  assert.equal(app.eval("game.boss.slowRemaining"),5);
  assert.equal(app.eval("game.boss.slowScale"),.1);
  app.eval("game.boss.t=0;game.boss.shoot=3;game.boss.warning=0;updateBoss(1)");
  assert.ok(Math.abs(app.eval("game.boss.t")-.1)<1e-9);
  assert.ok(Math.abs(app.eval("game.boss.shoot")-2.9)<1e-9);
  assert.equal(app.eval("game.boss.slowRemaining"),4);
  app.eval([
    'const part=game.boss.parts[0];',
    'const x=game.boss.x+part.x,y=game.boss.y+part.y;',
    'addPlayerShot(x-140,y,1400,0,9,1.15,"#2760f5",blueBlackRules.createShot());',
    'updatePlayerBullets(.13);'
  ].join("\n"));
  assert.equal(app.eval("game.boss.slowRemaining"),5);
  assert.equal(app.eval("game.boss.slowScale"),.1);
  assert.ok(app.eval("game.boss.parts[0].hp < game.boss.parts[0].maxHp"));
});

test("BLUE-BLACK slows carrier escort production and never slows already fired bullets",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.player.x=200;',
    'const e=spawnEnemyOfKind("carrier",700,480,{vx:0,vy:0,shootCd:99});',
    'e.launchCooldown=1;e.shootBase=99;',
    'aimAtPlayer(700,480,300,8,"#fff","#eaf");',
    'blueBlackRules.apply(e);updateEnemies(1);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies.length"),1);
  assert.ok(Math.abs(app.eval("game.enemies[0].launchCooldown")-.9)<1e-9);
  assert.equal(app.eval("game.enemies[0].launchedEscorts"),0);
  assert.equal(app.eval("game.enemies[0].slowRemaining"),4);
  assert.equal(app.eval("game.enemyBullets[0].vx"),-300);
});

test("BLUE-BLACK countdown pauses in PAUSED, TRANSITION and STASIS combat freeze",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.spawnTimer=999;game.formationTimer=999;game.invuln=999;',
    'game.enemies=[{kind:"scout",x:700,y:480,r:22,hp:40,maxHp:40,',
    'score:20,color:"#fff",core:"#eee",vx:0,vy:0,t:0,wave:0,',
    'shootCd:999,shootBase:999}];',
    'blueBlackRules.apply(game.enemies[0]);game.stasisRemaining=2;',
    'updatePlaying(1);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].slowRemaining"),5);
  app.eval('game.state="PAUSED";updatePlaying(6)');
  assert.equal(app.eval("game.enemies[0].slowRemaining"),5);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION";game.transition=30;updatePlaying(3)');
  assert.equal(app.eval("game.enemies[0].slowRemaining"),5);
  app.eval('game.stageMode="WAVE";game.stasisRemaining=0;updatePlaying(1)');
  assert.equal(app.eval("game.enemies[0].slowRemaining"),4);
});

test("BLUE-BLACK gradients on pickup, bullet and active victim glow never change HP or slow timer",()=>{
  const app=boot();
  const visual=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.weaponType="blueblack";game.enemies=[{kind:"scout",x:570,y:470,',
    'r:25,hp:100,maxHp:100,score:30,color:"#fff",core:"#eee"}];',
    'game.powerups=[{type:"P_BLUE_BLACK",x:490,y:620,life:20,t:0}];',
    'blueBlackRules.apply(game.enemies[0]);firePlayerWeapons();',
    'const colors=[],labels=[];',
    'ctx.createLinearGradient=()=>({addColorStop:(p,c)=>colors.push(c)});',
    'ctx.fillText=t=>labels.push(String(t));',
    'const hp=game.enemies[0].hp,remaining=game.enemies[0].slowRemaining;',
    'drawPowerups();drawPlayerBullets();drawEnemy(game.enemies[0]);drawHud();',
    'return {hp,after:game.enemies[0].hp,remaining,',
    'end:game.enemies[0].slowRemaining,colors,labels};})()'
  ].join("\n"));
  assert.equal(visual.hp,visual.after);
  assert.equal(visual.remaining,visual.end);
  for(const color of ["#276aff","#050713","#358aff","#040713",
      "#2f8dff","#040816","#050913","#79baff"])
    assert.ok(visual.colors.includes(color),color);
  assert.ok(visual.labels.includes("BLUE-BLACK  SLOW 90% / 5S"));
});


test("DARK RED-GOLD can ONLY evolve from DARK RED; rejected pickup stays and is not scored",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="red";game.weaponLevel=1;',
    'game.score=0;game.redWeapon.stars=3;',
    'game.powerups=[{type:"P_DARK_RED_GOLD",x:175,y:480,r:24,life:20,',
    'vx:0,vy:0,t:0,safeTimer:0}];updatePowerups(.01);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"red");
  assert.equal(app.eval("game.powerups.length"),1);
  assert.equal(app.eval("game.score"),0);
  assert.equal(app.eval("game.weaponLevel"),1);
  assert.equal(app.eval("game.redWeapon.stars"),3);
  assert.ok(app.eval('game.message.includes("REQUIRES DARK RED P")'));
  const hint=app.eval("game.messageTimer");
  app.eval('updatePowerups(.01)');
  assert.ok(app.eval("game.messageTimer")<=hint);
  app.eval('collectPowerup({type:"P_DARK_RED",x:250,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"darkred");
  app.eval('updatePowerups(.01)');
  assert.equal(app.eval("game.weaponType"),"darkredgold");
  assert.equal(app.eval("weaponMeta().name"),"GOLD BURST");
  assert.equal(app.eval("game.powerups.length"),0);
  assert.equal(app.eval("game.weaponLevel"),3);
  assert.equal(app.eval("game.redWeapon.stars"),3);
  app.eval('game.powerups=[];dropPlayerPowerOnHit()');
  assert.equal(app.eval("game.powerups.at(-1).type"),"P_DARK_RED_GOLD");
  app.eval('collectPowerup({type:"P_DARK_RED_GOLD",x:250,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"darkredgold");
  app.eval('collectPowerup({type:"P_ECLIPSE",x:250,y:480,life:1})');
  assert.equal(app.eval("game.weaponType"),"darkredgold",
    "ECLIPSE still requires original DARK RED and cannot unlock from this upgrade");
  app.eval('collectPowerup({type:"P_ORANGE",x:250,y:480,life:1})');
  const score=app.eval("game.score");
  app.eval('const invalidGold={type:"P_DARK_RED_GOLD",x:250,y:480,life:10};collectPowerup(invalidGold);game.invalidGoldLife=invalidGold.life');
  assert.equal(app.eval("game.weaponType"),"orange");
  assert.equal(app.eval("game.score"),score);
  assert.equal(app.eval("game.invalidGoldLife"),10);
});

test("DARK RED-GOLD fires starter twin DARK RED lanes with ORANGE blast, no chains or rockets",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="darkred";',
    'game.player.x=175;game.player.y=480;game.weaponLevel=3;',
    'Math.random=()=>.99;firePlayerWeapons();',
    'game.darkOriginal=JSON.stringify(game.bullets.map(b=>',
    '({x:b.x,y:b.y,vx:b.vx,vy:b.vy,r:b.r,power:b.power})));',
    'game.bullets=[];collectPowerup({type:"P_DARK_RED_GOLD",x:250,y:480,life:1});',
    'Math.random=()=>0;firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("JSON.stringify(game.bullets.map(b=>({x:b.x,y:b.y,vx:b.vx,vy:b.vy,r:b.r,power:b.power})))"),
    app.eval("game.darkOriginal"));
  assert.equal(app.eval("game.bullets[0].y"),470);
  assert.equal(app.eval("game.bullets[1].y"),492);
  assert.equal(app.eval("game.bullets.every(b=>b.orangeBlast&&b.darkRedGoldShot&&!b.darkRedChain)"),true);
  assert.equal(app.eval("game.missiles.length"),0);
  assert.ok(Math.abs(app.eval("getFireCooldown()")-.101)<1e-9);
  assert.equal(app.eval("game.redWeapon.stars"),0);
});

test("DARK RED-GOLD first swept contact deals only one 1.6x explosion, then shifts DIRECT enemy 40",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.enemies=[',
    '{kind:"scout",x:400,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:480,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:620,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}',
    '];addPlayerShot(300,480,1100,0,9,1.15,"#a62540",darkRedGoldRules.createShot());',
    'updatePlayerBullets(.32);'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),0);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-8);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-48.16)<1e-8);
  assert.equal(app.eval("game.enemies[2].hp"),50);
  assert.equal(app.eval("game.enemies[0].x"),440);
  assert.equal(app.eval("game.enemies[1].x"),480,
    "SPLASH victim receives Orange damage but not another direct-bullet knockback");
  assert.equal(app.eval("game.enemies[2].x"),620);
  assert.ok(Math.abs(app.eval("game.orangeExplosions[0].x")-371)<1e-8);
  assert.equal(app.eval("game.orangeExplosions[0].darkRedGold"),true);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
});

test("DARK RED-GOLD explosion radius is determined BEFORE direct target knockback",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.enemies=[',
    '{kind:"scout",x:400,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:491,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"},',
    '{kind:"scout",x:492,y:480,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}',
    '];addPlayerShot(300,480,1100,0,9,1.15,"#a62540",darkRedGoldRules.createShot());',
    'updatePlayerBullets(.25);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-48.16)<1e-9);
  assert.equal(app.eval("game.enemies[2].hp"),50);
  assert.equal(app.eval("game.enemies[0].x"),440);
  assert.ok(Math.abs(app.eval("game.orangeExplosions[0].x")-371)<1e-9);
});

test("DARK RED-GOLD shield takes one 1.6x explosion, but surviving shielded enemy moves 40",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.enemies=[enemyBehaviors.initializeEnemy({kind:"shield",',
    'x:400,y:480,r:39,hp:20,maxHp:20,score:60,color:"#aaf",core:"#fff"}),',
    '{kind:"scout",x:460,y:530,r:20,hp:50,maxHp:50,score:20,color:"#fff",core:"#eee"}];',
    'game.enemies[0].shieldHp=10;game.enemies[0].shieldMax=10;',
    'addPlayerShot(280,480,1100,0,9,1.15,"#a62540",darkRedGoldRules.createShot());',
    'updatePlayerBullets(.22);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].hp"),20);
  assert.ok(Math.abs(app.eval("game.enemies[0].shieldHp")-8.16)<1e-9);
  assert.equal(app.eval("game.enemies[0].x"),440);
  assert.ok(Math.abs(app.eval("game.enemies[1].hp")-48.16)<1e-9);
  assert.equal(app.eval("game.enemies[1].x"),460);
});

test("DARK RED-GOLD on Boss HULL applies 1.6x only once and moves Boss anchor by 40",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";',
    'game.boss={active:true,x:970,y:480,targetX:965,rx:100,ry:80,',
    'hp:200,maxHp:200,parts:[],color:"#fff",core:"#eee"};',
    'game.enemies=[{kind:"scout",x:900,y:575,r:20,hp:50,maxHp:50,',
    'score:20,color:"#fff",core:"#eee"}];',
    'addPlayerShot(650,480,1100,0,9,1.15,"#a62540",darkRedGoldRules.createShot());',
    'updatePlayerBullets(.32);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.boss.hp")-198.16)<1e-9);
  assert.equal(app.eval("game.boss.x"),1010);
  assert.equal(app.eval("game.boss.targetX"),1005);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
  assert.equal(app.eval("game.orangeExplosions[0].darkRedGold"),true);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-9);
  assert.equal(app.eval("game.enemies[0].x"),900);
});

test("DARK RED-GOLD Boss TURRET priority: weakpoint 1.6x, no hull damage, push Boss once",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";',
    'game.boss={active:true,x:950,y:480,targetX:950,rx:100,ry:80,',
    'hp:200,maxHp:200,parts:[{id:"GUN",x:-155,y:0,r:28,hp:80,maxHp:80}],',
    'color:"#fff",core:"#eee"};',
    'game.enemies=[{kind:"scout",x:810,y:560,r:20,hp:50,maxHp:50,',
    'score:20,color:"#fff",core:"#eee"}];',
    'addPlayerShot(580,480,1100,0,9,1.15,"#a62540",darkRedGoldRules.createShot());',
    'updatePlayerBullets(.35);'
  ].join("\n"));
  assert.ok(Math.abs(app.eval("game.boss.parts[0].hp")-
    (80-1.84*bossParts.BALANCE.weakPointDamageScale))<1e-8);
  assert.equal(app.eval("game.boss.hp"),200);
  assert.equal(app.eval("game.boss.x"),990);
  assert.equal(app.eval("game.boss.targetX"),990);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-8);
  assert.equal(app.eval("game.enemies[0].x"),810);
});

test("DARK RED-GOLD enemy direct hit splashes BOSS once and pushes enemy only",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="BOSS";',
    'game.enemies=[{kind:"scout",x:400,y:480,r:20,hp:50,maxHp:50,',
    'score:20,color:"#fff",core:"#eee"}];',
    'game.boss={active:true,x:620,y:480,targetX:620,rx:150,ry:80,',
    'hp:100,maxHp:100,parts:[],color:"#fff"};',
    'addPlayerShot(300,480,1100,0,9,1.15,"#a62540",darkRedGoldRules.createShot());',
    'updatePlayerBullets(.32);'
  ].join("\n"));
  assert.equal(app.eval("game.enemies[0].x"),440);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-8);
  assert.ok(Math.abs(app.eval("game.boss.hp")-98.16)<1e-8);
  assert.equal(app.eval("game.boss.x"),620);
});

test("DARK RED-GOLD kills splitter without pushing corpse or newly spawned children",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'game.enemies=[{kind:"splitter",x:400,y:480,r:35,hp:1,maxHp:1,',
    'score:60,color:"#fff",core:"#eee"}];',
    'game.directParent=game.enemies[0];',
    'addPlayerShot(280,480,1100,0,9,1.15,"#a62540",darkRedGoldRules.createShot());',
    'updatePlayerBullets(.22);'
  ].join("\n"));
  assert.equal(app.eval("game.stats.kills"),1);
  assert.equal(app.eval("game.directParent.x"),400);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).length"),2);
  assert.equal(app.eval("game.enemies.filter(e=>e.minion).every(e=>e.hp===e.maxHp)"),true);
  assert.equal(app.eval("game.orangeExplosions.length"),1);
});

test("DARK RED-GOLD fired projectile retains explosion, knockback and gold FX after P swap",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="darkredgold";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:500,y:470,r:22,hp:50,maxHp:50,',
    'score:20,color:"#fff",core:"#eee"}];',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'collectPowerup({type:"P_GREEN",x:250,y:480,life:1});',
    'updatePlayerBullets(.3);'
  ].join("\n"));
  assert.equal(app.eval("game.weaponType"),"green");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-48.16)<1e-8);
  assert.equal(app.eval("game.enemies[0].x"),540);
  assert.equal(app.eval("game.orangeExplosions[0].darkRedGold"),true);
});

test("DARK RED-GOLD Overdrive scales ORANGE 1.6x blast, but knockback remains exactly 40",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";game.weaponType="darkredgold";',
    'game.player.x=175;game.player.y=480;',
    'game.enemies=[{kind:"scout",x:500,y:470,r:22,hp:100,maxHp:100,',
    'score:20,color:"#fff",core:"#eee"}];',
    'game.combat.energy=100;activateOverdrive();',
    'game.currentScale=combatRules.weaponDamageScale(game.combat,selectedShip().id);',
    'firePlayerWeapons();game.bullets=game.bullets.slice(0,1);',
    'updatePlayerBullets(.30);'
  ].join("\n"));
  const expected=100-1.15*1.6*app.eval("game.currentScale");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-expected)<1e-8);
  assert.equal(app.eval("game.enemies[0].x"),540);
});

test("DARK RED-GOLD gold blast FX is color-provenance-safe, 48-capped, purely cosmetic",()=>{
  const app=boot();
  const visuals=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.weaponType="darkredgold";',
    'game.enemies=[{kind:"scout",x:550,y:470,r:24,hp:100,maxHp:100,',
    'score:20,color:"#fff",core:"#eee"}];',
    'game.powerups=[{type:"P_DARK_RED_GOLD",x:460,y:660,life:12,t:0}];',
    'firePlayerWeapons();',
    'addOrangeExplosion(400,480,true);addOrangeExplosion(350,480,false);',
    'const colors=[],strokes=[],labels=[];',
    'ctx.createLinearGradient=()=>({addColorStop:(p,c)=>colors.push(c)});',
    'ctx.createRadialGradient=()=>({addColorStop:(p,c)=>colors.push(c)});',
    'ctx.stroke=()=>strokes.push(ctx.strokeStyle);',
    'ctx.fillText=t=>labels.push(String(t));',
    'const hp=game.enemies[0].hp,life=game.orangeExplosions.map(b=>b.life);',
    'drawPowerups();drawPlayerBullets();drawOrangeExplosions();drawHud();',
    'return {hp,after:game.enemies[0].hp,life,',
    'afterLife:game.orangeExplosions.map(b=>b.life),colors,strokes,labels};})()'
  ].join("\n"));
  assert.equal(visuals.hp,visuals.after);
  assert.deepEqual(visuals.life,visuals.afterLife);
  for(const c of ["#780e2c","#f8c445","#780c2d","#f7cc51",
      "rgba(238,169,40,.40)","rgba(116,10,38,.19)"])
    assert.ok(visuals.colors.includes(c),c);
  assert.ok(visuals.strokes.includes("#9e1839"));
  assert.ok(visuals.strokes.includes("#ff9c39"),
    "Ordinary ORANGE color must remain unchanged in same frame");
  assert.ok(visuals.labels.includes("DARK RED-GOLD  PUSH40 X1.6"));
  app.eval('for(let i=0;i<80;i++)addOrangeExplosion(i,480,true)');
  assert.equal(app.eval("game.orangeExplosions.length"),48);
  app.eval('game.state="PAUSED";updatePlaying(2)');
  assert.equal(app.eval("game.orangeExplosions.length"),48);
  app.eval('updateParticles(.36)');
  assert.equal(app.eval("game.orangeExplosions.length"),0);
});

test("DARK RED-GOLD effect does not alter regular ORANGE / DARK RED chain or missile / red stars",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.weaponType="darkred";game.weaponLevel=3;',
    'game.redWeapon.stars=3;Math.random=()=>0;firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.missiles.length"),1,
    "Original DARK RED retains its 5% additional 10x guided missile");
  assert.equal(app.eval("game.bullets.every(b=>b.darkRedChain&&!b.orangeBlast)"),true);
  app.eval([
    'game.bullets=[];game.missiles=[];',
    'collectPowerup({type:"P_DARK_RED_GOLD",x:200,y:480,life:1});',
    'firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.missiles.length"),0);
  assert.equal(app.eval("game.bullets.length"),2);
  assert.equal(app.eval("game.bullets.every(b=>b.orangeBlast&&b.darkRedGoldShot&&!b.darkRedChain)"),true);
  assert.equal(app.eval("game.redWeapon.stars"),3);
  app.eval([
    'game.bullets=[];collectPowerup({type:"P_ORANGE",x:200,y:480,life:1});',
    'firePlayerWeapons();'
  ].join("\n"));
  assert.equal(app.eval("game.bullets.every(b=>b.orangeBlast&&!b.darkRedGoldShot)"),true);
  app.eval('addOrangeExplosion(150,480)');
  assert.equal(app.eval("game.orangeExplosions.at(-1).darkRedGold"),false);
});


test("RED-BLUE draws 360 special pellets in batched world-space paths",()=>{
  const app=boot();
  const stats=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.redBlueBullets=redBlueRules.radial({x:640,y:480},.38);',
    'const draws={save:0,restore:0,translate:0,rotate:0,fillRect:0,',
    'moveTo:0,lineTo:0,stroke:0};',
    'for(const key of Object.keys(draws)){const original=ctx[key];',
    'ctx[key]=(...args)=>{draws[key]++;return original(...args);};}',
    'const before=game.redBlueBullets.map(b=>[b.x,b.y,b.life,b.redBluePhase]);',
    'drawRedBlueBullets();',
    'const after=game.redBlueBullets.map(b=>[b.x,b.y,b.life,b.redBluePhase]);',
    'return {draws,unchanged:JSON.stringify(before)===JSON.stringify(after),',
    'shotCount:game.redBlueBullets.length};})()'
  ].join("\n"));
  assert.equal(stats.shotCount,360);
  assert.equal(stats.unchanged,true,"render must not mutate live pellet state");
  assert.ok(stats.draws.save<=2,"full 360-shot fan must not save Canvas per pellet");
  assert.ok(stats.draws.restore<=2);
  assert.equal(stats.draws.rotate,0);
  assert.equal(stats.draws.translate,0);
  assert.equal(stats.draws.fillRect,0);
  assert.equal(stats.draws.moveTo,720,"every pellet contributes red and blue trail");
  assert.equal(stats.draws.lineTo,720);
  assert.ok(stats.draws.stroke<=4,"constant number of batch strokes, not 720");
});

test("RED-BLUE culls offscreen visuals without despawning or re-targeting the actual pellets",()=>{
  const app=boot();
  const stats=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.redBlueBullets=redBlueRules.radial({x:640,y:480},.38);',
    'for(const b of game.redBlueBullets){b.x=2000;b.y=2000;}',
    'let stroke=0,moveTo=0;ctx.stroke=()=>{stroke++;};',
    'ctx.moveTo=()=>{moveTo++;};drawRedBlueBullets();',
    'return {stroke,moveTo,count:game.redBlueBullets.length,',
    'alive:game.redBlueBullets.every(b=>!b.dead)};})()'
  ].join("\n"));
  assert.equal(stats.stroke,0);
  assert.equal(stats.moveTo,0);
  assert.equal(stats.count,360);
  assert.equal(stats.alive,true);
});

test("RED-BLUE swept tracking still damages nearest real enemy once after allocation hardening",()=>{
  const app=boot();
  app.eval([
    'game.state="PLAYING";game.stageMode="WAVE";',
    'const shot=redBlueRules.volley({x:175,y:480})[2];',
    'shot.x=450;shot.y=480;shot.vx=940;shot.vy=0;',
    'shot.life=3.6;shot.redBluePhase="homing";',
    'game.redBlueBullets=[shot];game.redBluePoolRef=game.redBlueBullets;',
    'game.enemies=[',
    ' {kind:"scout",x:520,y:480,r:12,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"},',
    ' {kind:"scout",x:560,y:480,r:12,hp:100,maxHp:100,score:20,color:"#fff",core:"#eee"}',
    '];updateRedBlueBullets(.2);'
  ].join("\n"));
  assert.equal(app.eval("game.redBlueBullets.length"),0);
  assert.equal(app.eval("game.redBlueBullets===game.redBluePoolRef"),true,
    "pool must be compacted in-place");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-98.85)<1e-8);
  assert.equal(app.eval("game.enemies[1].hp"),100,
    "earlier swept hit cannot pass through into the next enemy");
});

test("RED-BLUE five-star HUD advertises the actual 1-second cadence, not RED 0.4s rest",()=>{
  const app=boot();
  const ui=()=>app.eval('(()=>{const a=[];ctx.fillText=x=>a.push(String(x));drawHud();return a;})()');
  app.eval('game.state="PLAYING";game.weaponType="redblue";game.redWeapon.stars=3');
  assert.ok(ui().includes("5-WAY  1.0s / SHOT  R360 SEEK"));
  assert.equal(ui().some(x=>x.includes("VOLLEYS")),false);
  app.eval('game.weaponType="red"');
  assert.ok(ui().some(x=>x.includes("8 VOLLEYS  /  0.4s REST")),
    "original RED burst/rest HUD remains unchanged");
});

test("RED-BLUE stress-smoke: 1800 live shots update and render without Canvas per-pellet transforms",()=>{
  const app=boot();
  const start=performance.now();
  const result=app.eval([
    '(()=>{game.state="PLAYING";game.stageMode="WAVE";',
    'game.redBlueBullets=[];',
    'for(let i=0;i<5;i++)game.redBlueBullets.push(',
    '...redBlueRules.radial({x:620+(i-2)*32,y:460+(i-2)*19},.38));',
    'const pool=game.redBlueBullets;',
    'let rotations=0,strokes=0;',
    'ctx.rotate=()=>{rotations++};ctx.stroke=()=>{strokes++};',
    'for(let f=0;f<40;f++){updateRedBlueBullets(1/60);drawRedBlueBullets();}',
    'return {retained:game.redBlueBullets===pool,',
    'count:game.redBlueBullets.length,rotations,strokes,',
    'homing:game.redBlueBullets.every(b=>b.redBluePhase==="homing")};})()'
  ].join("\n"));
  const elapsed=performance.now()-start;
  assert.equal(result.retained,true);
  assert.equal(result.count,1800);
  assert.equal(result.homing,true);
  assert.equal(result.rotations,0,"no per-pellet Canvas rotation in dense ring");
  assert.ok(result.strokes<=160,"at most four batch strokes per frame");
  // Loose guard against catastrophic algorithmic regression; this is NOT a
  // device FPS test (Node VM mocked Canvas; no GPU compositing).
  assert.ok(elapsed<15000, "1800-pellet 40-frame VM smoke exceeded 15 seconds");
  console.log("RED-BLUE simulated 1800 pellets / 40 frames:",
    Math.round(elapsed)+"ms Node VM (not handheld FPS)");
});
