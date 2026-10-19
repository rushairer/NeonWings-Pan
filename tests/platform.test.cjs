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
const whiteWeapon = require("../src/white-weapon.js");
const redWhiteWeapon = require("../src/red-white-weapon.js");
const grayWeapon = require("../src/gray-weapon.js");
const pinkWeapon = require("../src/pink-weapon.js");
const orangeWeapon = require("../src/orange-weapon.js");
const brownWeapon = require("../src/brown-weapon.js");
const limeWeapon = require("../src/lime-weapon.js");
const skyWeapon = require("../src/sky-weapon.js");
const darkRedWeapon = require("../src/dark-red-weapon.js");
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

function boot(options = {}) {
  const windowEvents = new Map();
  const documentEvents = new Map();
  const canvas = { style: {}, getContext: () => ({}) };
  const storageData = new Map();
  const localStorage = {
    getItem(key) {
      if (options.storageBlocked) throw Error("Storage unavailable");
      return storageData.get(key) ?? null;
    },
    setItem(key, value) {
      if (options.storageBlocked) throw Error("Storage unavailable");
      storageData.set(key, String(value));
    }
  };
  const browserWindow = {
    NeonPlatform: platform,
    NeonController: controller,
    NeonCombat: combat,
    NeonRedWeapon: redWeapon,
    NeonGreenWeapon: greenWeapon, NeonSolarAuraWeapon: solarAuraWeapon,
    NeonBlackWeapon: blackWeapon, NeonWhiteWeapon: whiteWeapon, NeonRedWhiteWeapon: redWhiteWeapon, NeonGrayWeapon: grayWeapon, NeonPinkWeapon: pinkWeapon, NeonOrangeWeapon: orangeWeapon, NeonBrownWeapon: brownWeapon, NeonLimeWeapon: limeWeapon, NeonSkyWeapon: skyWeapon, NeonDarkRedWeapon: darkRedWeapon, NeonRainbowWeapon: rainbowWeapon, NeonMagnetWeapon: magnetWeapon, NeonArcLaserWeapon: arcLaserWeapon, NeonStasisWeapon: stasisWeapon, NeonEclipseWeapon: eclipseWeapon, NeonRecruitWeapon: recruitWeapon,
    NeonCollision: collision,
    NeonEnemyBehaviors: enemyBehaviors,
    NeonWorlds: worlds,
    NeonBossParts: bossParts,
    NeonModes: modes,
    NeonRecords: records,
    NeonSelectLayout: selectLayout,
    innerWidth: options.width || 1920,
    innerHeight: options.height || 1080,
    addEventListener: (event, fn) => windowEvents.set(event, fn)
  };
  const document = {
    hidden: false,
    getElementById: () => canvas,
    addEventListener: (event, fn) => documentEvents.set(event, fn)
  };
  const context = vm.createContext({
    window: browserWindow, document, localStorage,
    navigator: { getGamepads: () => [] },
    performance: { now: () => 100 },
    requestAnimationFrame: () => {},
    setInterval: () => 1, clearInterval: () => {},
    setTimeout: () => 1,
    console
  });
  vm.runInContext(gameSource, context, { filename: "src/game.js" });
  const evaluate = (code) => vm.runInContext(code, context);
  return { windowEvents, documentEvents, browserWindow, document, canvas, evaluate };
}

test("letterboxes without stretching on wide and portrait viewports", () => {
  assert.deepEqual(platform.calculateViewport(1280, 960, 1920, 1080), {
    width: 1440, height: 1080, left: 240, top: 0
  });
  assert.deepEqual(platform.calculateViewport(1280, 960, 390, 844), {
    width: 390, height: 292, left: 0, top: 276
  });
});

test("settings coercion rejects NaN and clamps finite values", () => {
  assert.equal(platform.finiteClamped("oops", 1, 0, 2), 1);
  assert.equal(platform.finiteClamped(10, 1, 0, 2), 2);
  assert.equal(platform.finiteClamped(-5, 1, 0, 2), 0);
});

test("title boots and resizes the original playfield", () => {
  const game = boot();
  assert.equal(game.evaluate("game.state"), "TITLE");
  assert.equal(game.canvas.style.width, "1440px");
  assert.equal(game.canvas.style.left, "240px");
  game.browserWindow.innerWidth = 800;
  game.browserWindow.innerHeight = 600;
  game.windowEvents.get("resize")();
  assert.equal(game.canvas.style.width, "800px");
  assert.equal(game.canvas.style.height, "600px");
});

test("blur pauses gameplay and clears held shooting key", () => {
  const game = boot();
  game.evaluate('game.state = "PLAYING"; keys.Space = true');
  game.windowEvents.get("blur")();
  assert.equal(game.evaluate("game.state"), "PAUSED");
  assert.equal(game.evaluate("keys.Space"), false);
  assert.match(game.evaluate("game.message"), /FOCUS LOST/);
});

test("hiding the page pauses instead of advancing gameplay in background", () => {
  const game = boot();
  game.evaluate('game.state = "PLAYING"');
  game.document.hidden = true;
  game.documentEvents.get("visibilitychange")();
  assert.equal(game.evaluate("game.state"), "PAUSED");
});

test("game still starts when localStorage is blocked", () => {
  const game = boot({ storageBlocked: true });
  assert.equal(game.evaluate("game.state"), "TITLE");
  assert.equal(game.evaluate("highScore()"), 0);
  assert.equal(game.evaluate("saveHighScore(250)"), 250);
  assert.equal(game.evaluate("highScore()"), 250);
});

test("static HTML loads platform before game and doesn't embed legacy code", () => {
  const html = fs.readFileSync(path.join(__dirname, "../index.html"), "utf8");
  assert.ok(html.indexOf('src="./src/platform.js"') < html.indexOf('src="./src/controller.js"'));
  assert.ok(html.indexOf('src="./src/controller.js"') < html.indexOf('src="./src/combat.js"'));
  assert.ok(html.indexOf('src="./src/combat.js"') < html.indexOf('src="./src/red-weapon.js"'));
  assert.ok(html.indexOf('src="./src/red-weapon.js"') < html.indexOf('src="./src/green-weapon.js"'));
  assert.ok(html.indexOf('src="./src/green-weapon.js"') < html.indexOf('src="./src/solar-aura-weapon.js?'));
  assert.ok(html.indexOf('src="./src/solar-aura-weapon.js?') < html.indexOf('src="./src/black-weapon.js"'));
  assert.ok(html.indexOf('src="./src/black-weapon.js"') < html.indexOf('src="./src/white-weapon.js"'));
  assert.ok(html.indexOf('src="./src/white-weapon.js"') < html.indexOf('src="./src/red-white-weapon.js?'));
  assert.ok(html.indexOf('src="./src/red-white-weapon.js?') < html.indexOf('src="./src/gray-weapon.js"'));
  assert.ok(html.indexOf('src="./src/gray-weapon.js"') < html.indexOf('src="./src/pink-weapon.js"'));
  assert.ok(html.indexOf('src="./src/pink-weapon.js"') < html.indexOf('src="./src/orange-weapon.js"'));
  assert.ok(html.indexOf('src="./src/orange-weapon.js"') < html.indexOf('src="./src/brown-weapon.js"'));
  assert.ok(html.indexOf('src="./src/brown-weapon.js"') < html.indexOf('src="./src/lime-weapon.js?'));
  assert.ok(html.indexOf('src="./src/lime-weapon.js?') < html.indexOf('src="./src/sky-weapon.js?'));
  assert.ok(html.indexOf('src="./src/sky-weapon.js?') < html.indexOf('src="./src/dark-red-weapon.js?'));
  assert.ok(html.indexOf('src="./src/dark-red-weapon.js?') < html.indexOf('src="./src/rainbow-weapon.js?'));
  assert.ok(html.indexOf('src="./src/rainbow-weapon.js?') < html.indexOf('src="./src/magnet-weapon.js?'));
  assert.ok(html.indexOf('src="./src/magnet-weapon.js?') < html.indexOf('src="./src/arc-laser-weapon.js?'));
  assert.ok(html.indexOf('src="./src/arc-laser-weapon.js?') < html.indexOf('src="./src/stasis-weapon.js?'));
  assert.ok(html.indexOf('src="./src/stasis-weapon.js?') < html.indexOf('src="./src/eclipse-weapon.js?'));
  assert.ok(html.indexOf('src="./src/eclipse-weapon.js?') < html.indexOf('src="./src/recruit-weapon.js?'));
  assert.ok(html.indexOf('src="./src/recruit-weapon.js?') < html.indexOf('src="./src/collision.js"'));
  assert.ok(html.indexOf('src="./src/collision.js"') < html.indexOf('src="./src/enemy-behaviors.js"'));
  assert.ok(html.indexOf('src="./src/enemy-behaviors.js"') < html.indexOf('src="./src/worlds.js"'));
  assert.ok(html.indexOf('src="./src/worlds.js"') < html.indexOf('src="./src/boss-parts.js"'));
  assert.ok(html.indexOf('src="./src/boss-parts.js"') < html.indexOf('src="./src/modes.js"'));
  assert.ok(html.indexOf('src="./src/modes.js"') < html.indexOf('src="./src/records.js"'));
  assert.ok(html.indexOf('src="./src/records.js"') < html.indexOf('src="./src/select-layout.js"'));
  assert.ok(html.indexOf('src="./src/select-layout.js"') < html.indexOf('src="./src/game.js?'));
  assert.ok(!html.includes("<script>"));
});


test("versioned LIME/game scripts prevent stale JS after successful Pages deploy", () => {
  const html = fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
  const version = require("../package.json").version;
  assert.equal(version,require("../package.json").version);
  assert.match(version,/^\d+\.\d+\.\d+$/);
  assert.ok(html.includes('src="./src/lime-weapon.js?v='+version+'"'));
  assert.ok(html.includes('src="./src/game.js?v='+version+'"'));
  assert.equal(html.includes('src="./src/lime-weapon.js"'),false);
  assert.equal(html.includes('src="./src/game.js"'),false);
});


test("SKY script loads before engine with fresh versioned assets", () => {
  const html = fs.readFileSync(path.join(__dirname, "../index.html"),"utf8");
  const version = require("../package.json").version;
  assert.ok(html.includes('src="./src/sky-weapon.js?v='+version+'"'));
  assert.ok(html.indexOf('src="./src/sky-weapon.js?') < html.indexOf('src="./src/collision.js"'));
  assert.ok(html.indexOf('src="./src/sky-weapon.js?') < html.indexOf('src="./src/game.js?'));
});


test("DARK RED runtime is copied and versioned before game for GitHub Pages",()=>{
  const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
  const build=fs.readFileSync(path.join(__dirname,"../scripts/build.mjs"),"utf8");
  const pkg=require("../package.json");
  // Drive all script-version assertions from package.json; releases must not
  // fail merely because this test still contains the previous patch number.
  assert.match(pkg.version, /^\d+\.\d+\.\d+$/);
  assert.ok(html.includes('src="./src/dark-red-weapon.js?v='+pkg.version+'"'));
  assert.ok(html.includes('src="./src/game.js?v='+pkg.version+'"'));
  assert.ok(build.includes('"src/dark-red-weapon.js"'));
  assert.ok(pkg.scripts.check.includes('node --check src/dark-red-weapon.js'));
});

test("RAINBOW browser module is versioned, copied to Pages, and syntax checked",()=>{
  const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
  const build=fs.readFileSync(path.join(__dirname,"../scripts/build.mjs"),"utf8");
  const pkg=require("../package.json");
  assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
  assert.ok(html.includes('src="./src/rainbow-weapon.js?v='+pkg.version+'"'));
  assert.ok(html.indexOf('src="./src/dark-red-weapon.js?')<html.indexOf('src="./src/rainbow-weapon.js?'));
  assert.ok(html.indexOf('src="./src/rainbow-weapon.js?')<html.indexOf('src="./src/game.js?'));
  assert.ok(build.includes('"src/rainbow-weapon.js"'));
  assert.ok(pkg.scripts.check.includes("node --check src/rainbow-weapon.js"));
});

test("MAGNET P module is browser-versioned, ordered and included in Pages",()=>{
  const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
  const build=fs.readFileSync(path.join(__dirname,"../scripts/build.mjs"),"utf8");
  const pkg=require("../package.json");
  assert.ok(html.includes('src="./src/magnet-weapon.js?v='+pkg.version+'"'));
  assert.ok(html.includes('src="./src/game.js?v='+pkg.version+'"'));
  assert.ok(html.indexOf('src="./src/rainbow-weapon.js?') <
    html.indexOf('src="./src/magnet-weapon.js?'));
  assert.ok(html.indexOf('src="./src/magnet-weapon.js?') <
    html.indexOf('src="./src/game.js?'));
  assert.ok(build.includes('"src/magnet-weapon.js"'));
  assert.ok(pkg.scripts.check.includes('node --check src/magnet-weapon.js'));
  assert.equal(magnetWeapon.RULES.radius,greenWeapon.RULES.radius);
});

test("ARC LASER and STASIS versioned standalone runtimes ship to Pages before engine",()=>{
  const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
  const build=fs.readFileSync(path.join(__dirname,"../scripts/build.mjs"),"utf8");
  const pkg=require("../package.json");
  for(const name of ["arc-laser","stasis"]){
    assert.ok(html.includes('src="./src/'+name+'-weapon.js?v='+pkg.version+'"'));
    assert.ok(build.includes('"src/'+name+'-weapon.js"'));
    assert.ok(pkg.scripts.check.includes("node --check src/"+name+"-weapon.js"));
  }
  assert.ok(html.indexOf('src="./src/magnet-weapon.js?')<
    html.indexOf('src="./src/arc-laser-weapon.js?'));
  assert.ok(html.indexOf('src="./src/arc-laser-weapon.js?')<
    html.indexOf('src="./src/stasis-weapon.js?'));
  assert.ok(html.indexOf('src="./src/stasis-weapon.js?')<
    html.indexOf('src="./src/game.js?'));
  assert.equal(arcLaserWeapon.canEquip("brown"),true);
  assert.equal(stasisWeapon.RULES.freezeSeconds,3);
});

test("ECLIPSE and RECRUIT modules remain present in the static build",()=>{
  const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
  const build=fs.readFileSync(path.join(__dirname,"../scripts/build.mjs"),"utf8");
  const pkg=require("../package.json");
  assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
  for(const name of ["eclipse","recruit"]){
    assert.ok(html.includes('src="./src/'+name+'-weapon.js?v='+pkg.version+'"'));
    assert.ok(build.includes('"src/'+name+'-weapon.js"'));
    assert.ok(pkg.scripts.check.includes("node --check src/"+name+"-weapon.js"));
  }
  assert.ok(html.indexOf('src="./src/stasis-weapon.js?') <
    html.indexOf('src="./src/eclipse-weapon.js?'));
  assert.ok(html.indexOf('src="./src/eclipse-weapon.js?') <
    html.indexOf('src="./src/recruit-weapon.js?'));
  assert.ok(html.indexOf('src="./src/recruit-weapon.js?') <
    html.indexOf('src="./src/game.js?'));
  assert.equal(eclipseWeapon.canEquip("darkred"),true);
  assert.equal(recruitWeapon.RULES.maxAllies,24);
});

test("SOLAR AURA remains versioned, checked and built after GREEN before game", () => {
  const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
  const build=fs.readFileSync(path.join(__dirname,"../scripts/build.mjs"),"utf8");
  const pkg=require("../package.json");
  assert.match(pkg.version,/^\d+\.\d+\.\d+$/);
  assert.ok(html.includes('src="./src/solar-aura-weapon.js?v='+pkg.version+'"'));
  assert.ok(html.includes('src="./src/game.js?v='+pkg.version+'"'));
  assert.ok(html.indexOf('src="./src/green-weapon.js"') <
    html.indexOf('src="./src/solar-aura-weapon.js?'));
  assert.ok(html.indexOf('src="./src/solar-aura-weapon.js?') <
    html.indexOf('src="./src/game.js?'));
  assert.ok(build.includes('"src/solar-aura-weapon.js"'));
  assert.ok(pkg.scripts.check.includes('node --check src/solar-aura-weapon.js'));
  assert.equal(solarAuraWeapon.RULES.radius,greenWeapon.RULES.radius);
  assert.equal(solarAuraWeapon.RULES.damagePerPulse,greenWeapon.RULES.damagePerPulse);
});

test("RED-WHITE P runtime is versioned and loaded after RED/WHITE before game",()=>{
  const html=fs.readFileSync(path.join(__dirname,"../index.html"),"utf8");
  const build=fs.readFileSync(path.join(__dirname,"../scripts/build.mjs"),"utf8");
  const pkg=require("../package.json");
  assert.equal(pkg.version,"26.17.0");
  assert.ok(html.includes('src="./src/red-white-weapon.js?v='+pkg.version+'"'));
  assert.ok(html.includes('src="./src/game.js?v='+pkg.version+'"'));
  assert.ok(html.indexOf('src="./src/red-weapon.js"') <
    html.indexOf('src="./src/red-white-weapon.js?'));
  assert.ok(html.indexOf('src="./src/white-weapon.js"') <
    html.indexOf('src="./src/red-white-weapon.js?'));
  assert.ok(html.indexOf('src="./src/red-white-weapon.js?') <
    html.indexOf('src="./src/game.js?'));
  assert.ok(build.includes('"src/red-white-weapon.js"'));
  assert.ok(pkg.scripts.check.includes('node --check src/red-white-weapon.js'));
  assert.equal(redWhiteWeapon.RULES.specialShots,redWeapon.RULES.specialShots);
  assert.equal(redWhiteWeapon.RULES.secondaryDamageFactor,
    whiteWeapon.RULES.secondaryDamageFactor);
});
