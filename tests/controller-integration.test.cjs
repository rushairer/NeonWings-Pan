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
const source = fs.readFileSync(path.join(__dirname, "../src/game.js"), "utf8");

function makePad(index = 0) {
  return {
    index, connected: true, axes: [0, 0, 0, 0],
    buttons: Array.from({ length: 16 }, () => ({ pressed: false, value: 0 }))
  };
}
function press(pad, index, down) {
  pad.buttons[index].pressed = down;
  pad.buttons[index].value = down ? 1 : 0;
}
function boot(storage = new Map()) {
  const listeners = new Map();
  const documentListeners = new Map();
  const pad = makePad();
  const gamepads = [pad];
  const canvas = { style: {}, getContext: () => ({}) };
  const window = {
    innerWidth: 1280, innerHeight: 960,
    NeonPlatform: platform, NeonController: controller, NeonCombat: combat, NeonRedWeapon: redWeapon, NeonGreenWeapon: greenWeapon, NeonSolarAuraWeapon: solarAuraWeapon, NeonBlackWeapon: blackWeapon, NeonBlueBlackWeapon: blueBlackWeapon, NeonWhiteWeapon: whiteWeapon, NeonRedWhiteWeapon: redWhiteWeapon, NeonGrayWeapon: grayWeapon, NeonGrayFlameWeapon: grayFlameWeapon, NeonPinkWeapon: pinkWeapon, NeonOrangeWeapon: orangeWeapon, NeonRedOrangeWeapon: redOrangeWeapon, NeonRedBlueWeapon: redBlueWeapon, NeonBrownWeapon: brownWeapon, NeonPurpleWhiteWeapon: purpleWhiteWeapon, NeonBrownYellowWeapon: brownYellowWeapon, NeonLimeWeapon: limeWeapon, NeonSkyWeapon: skyWeapon, NeonDarkRedWeapon: darkRedWeapon, NeonDarkRedGoldWeapon: darkRedGoldWeapon, NeonRainbowWeapon: rainbowWeapon, NeonMagnetWeapon: magnetWeapon, NeonArcLaserWeapon: arcLaserWeapon, NeonStasisWeapon: stasisWeapon, NeonEclipseWeapon: eclipseWeapon, NeonRecruitWeapon: recruitWeapon, NeonCollision: collision, NeonEnemyBehaviors: enemyBehaviors, NeonWorlds: worlds, NeonBossParts: bossParts, NeonModes: modes, NeonRecords: records, NeonSelectLayout: selectLayout,
    addEventListener: (event, callback) => listeners.set(event, callback)
  };
  const document = {
    hidden: false,
    getElementById: () => canvas,
    addEventListener: (event, callback) => documentListeners.set(event, callback)
  };
  const context = vm.createContext({
    window, document,
    navigator: { getGamepads: () => gamepads },
    localStorage: {
      getItem: key => storage.get(key) ?? null,
      setItem: (key, value) => storage.set(key, String(value))
    },
    performance: { now: () => 100 },
    requestAnimationFrame: () => {},
    setTimeout: () => {}, setInterval: () => 1, clearInterval: () => {},
    console
  });
  vm.runInContext(source, context, { filename: "src/game.js" });
  return { pad, gamepads, listeners, documentListeners, storage, eval: code => vm.runInContext(code, context) };
}

test("default B and RT both shoot without consuming BOMB", () => {
  const app = boot();
  app.eval('game.state = "PLAYING"');
  press(app.pad, 1, true);
  assert.equal(app.eval("readInput(0.016)"), true);
  press(app.pad, 1, false);
  press(app.pad, 7, true);
  assert.equal(app.eval("readInput(0.016)"), true);
  press(app.pad, 7, false);
  assert.equal(app.eval("readInput(0.016)"), false);
  assert.equal(app.eval("game.bomb"), 2);
});

test("controller options can remap fire/bomb and persist to another boot", () => {
  const storage = new Map();
  const app = boot(storage);
  app.eval('game.state = "PAUSED"; pauseMenu.page = "main"; pauseMenu.index = 8; activatePauseItem()');
  assert.equal(app.eval('pauseMenu.page'), 'controls');
  app.eval('pauseMenu.index = 1; adjustPauseItem(1)');
  assert.equal(app.eval('settings.firePrimary'), 4);
  app.eval('pauseMenu.index = 3; adjustPauseItem(1); adjustPauseItem(1)');
  // A -> B -> RB: X is reserved for the floor laser, Y is Overdrive.
  assert.equal(app.eval('settings.bombButton'), 5);
  const after = boot(storage);
  assert.equal(after.eval('settings.firePrimary'), 4);
  assert.equal(after.eval('settings.bombButton'), 5);
  after.eval('game.state = "PLAYING"');
  press(after.pad, 4, true);
  assert.equal(after.eval('readInput(0.016)'), true);
  press(after.pad, 4, false);
  press(after.pad, 5, true);
  after.eval('pollGamepadSystemButtons()');
  assert.equal(after.eval('game.bomb'), 1);
  after.eval('pollGamepadSystemButtons()');
  assert.equal(after.eval('game.bomb'), 1);
  press(after.pad, 5, false);
  after.eval('pollGamepadSystemButtons()');
  press(after.pad, 5, true);
  after.eval('pollGamepadSystemButtons()');
  assert.equal(after.eval('game.bomb'), 0);
});

test("deadzone adjustment affects input, not D-pad controls", () => {
  const app = boot();
  app.eval('game.state = "PLAYING"');
  app.pad.axes[0] = 0.14;
  app.eval('readInput(0.016)');
  assert.equal(app.eval('game.player.vx'), 0);
  app.eval('game.state = "PAUSED"; pauseMenu.page = "controls"; pauseMenu.index = 5; adjustPauseItem(-1)');
  assert.equal(app.eval('settings.stickDeadzone'), 0.16);
  app.eval('game.state = "PLAYING"');
  app.pad.axes[0] = 0.17;
  app.eval('readInput(0.016)');
  assert.ok(app.eval('game.player.vx') > 0);
});

test("controller loss pauses game, and reconnect cannot auto-resume with held START", () => {
  const app = boot();
  app.eval('game.state = "PLAYING"; keys.Space = true');
  app.eval('pollGamepadSystemButtons()');
  app.pad.connected = false;
  app.listeners.get('gamepaddisconnected')({ gamepad: app.pad });
  assert.equal(app.eval('game.state'), 'PAUSED');
  assert.equal(app.eval('keys.Space'), false);
  assert.equal(app.eval('activeGamepadIndex'), null);
  app.pad.connected = true;
  press(app.pad, 9, true);
  app.listeners.get('gamepadconnected')({ gamepad: app.pad });
  app.eval('pollGamepadSystemButtons()');
  assert.equal(app.eval('game.state'), 'PAUSED');
  press(app.pad, 9, false);
  app.eval('pollGamepadSystemButtons()');
  press(app.pad, 9, true);
  app.eval('pollGamepadSystemButtons()');
  assert.equal(app.eval('game.state'), 'PLAYING');
});

test("silent disconnect is detected during polling", () => {
  const app = boot();
  app.eval('game.state = "PLAYING"; pollGamepadSystemButtons()');
  app.gamepads.length = 0;
  app.eval('pollGamepadSystemButtons()');
  assert.equal(app.eval('game.state'), 'PAUSED');
});

test("reset controller settings preserves audio settings and escape exits submenu", () => {
  const app = boot();
  app.eval('settings.master = 0.5; settings.firePrimary = 2; settings.bombButton = 3; game.state = "PAUSED"; pauseMenu.page = "controls"; pauseMenu.index = 6; activatePauseItem()');
  assert.equal(app.eval('settings.master'), 0.5);
  assert.equal(app.eval('settings.firePrimary'), 1);
  assert.equal(app.eval('settings.bombButton'), 0);
  app.listeners.get('keydown')({ code: 'Escape', preventDefault() {} });
  assert.equal(app.eval('game.state'), 'PAUSED');
  assert.equal(app.eval('pauseMenu.page'), 'main');
});

test("overdrive button remaps independently without stealing shooting or bomb input", () => {
  const app = boot();
  app.eval('game.state = "PAUSED"; pauseMenu.page = "controls"; pauseMenu.index = 4; adjustPauseItem(1)');
  assert.equal(app.eval("settings.overdriveButton"), 4);
  app.eval('game.state = "PLAYING"; game.combat.energy = 100');
  press(app.pad, 4, true);
  app.eval("pollGamepadSystemButtons()");
  assert.equal(app.eval("game.combat.active"), 6);
  assert.equal(app.eval("game.bomb"), 2);
  assert.equal(app.eval("readInput(0)"), false);
  app.eval("game.combat.active = 0; game.combat.energy = 100");
  app.eval("pollGamepadSystemButtons()");
  assert.equal(app.eval("game.combat.active"), 0); // edge-triggered
  press(app.pad, 4, false);
  app.eval("pollGamepadSystemButtons()");
  press(app.pad, 4, true);
  app.eval("pollGamepadSystemButtons()");
  assert.equal(app.eval("game.combat.active"), 6);
});

test("keyboard C activates only on new key press", () => {
  const app = boot();
  app.eval('game.state = "PLAYING"; game.combat.energy = 100');
  app.listeners.get("keydown")({ code: "KeyC", preventDefault() {} });
  assert.equal(app.eval("game.combat.active"), 6);
  app.eval("game.combat.active = 0; game.combat.energy = 100");
  app.listeners.get("keydown")({ code: "KeyC", preventDefault() {} });
  assert.equal(app.eval("game.combat.active"), 0);
  app.listeners.get("keyup")({ code: "KeyC" });
  app.listeners.get("keydown")({ code: "KeyC", preventDefault() {} });
  assert.equal(app.eval("game.combat.active"), 6);
});

test("gamepad D-pad chooses modes; shoulder buttons select training stage", () => {
  const app=boot();
  const poll=()=>app.eval("pollGamepadSystemButtons()");
  press(app.pad,9,true);
  poll(); press(app.pad,9,false); poll();
  assert.equal(app.eval("game.state"),"SELECT");
  press(app.pad,13,true);poll();press(app.pad,13,false);poll();
  assert.equal(app.eval("menu.selectedMode"),"bossRush");
  press(app.pad,13,true);poll();press(app.pad,13,false);poll();
  assert.equal(app.eval("menu.selectedMode"),"training");
  press(app.pad,5,true);poll();press(app.pad,5,false);poll();
  assert.equal(app.eval("menu.trainingStage"),1);
  press(app.pad,4,true);poll();press(app.pad,4,false);poll();
  assert.equal(app.eval("menu.trainingStage"),0);
  press(app.pad,9,true);poll();
  assert.equal(app.eval("game.mode"),"training");
  assert.equal(app.eval("game.state"),"PLAYING");
});

test("gamepad Start closes completed Boss Rush result and returns to menu", () => {
  const app=boot();
  app.eval('menu.selectedMode="bossRush";startSelectedGame();game.state="RUSH_CLEAR"');
  press(app.pad,9,true);app.eval("pollGamepadSystemButtons()");
  assert.equal(app.eval("game.state"),"TITLE");
});

test("physical X opens local records from the title and Start safely closes it", () => {
  const app=boot();
  press(app.pad,2,true);
  app.eval("pollGamepadSystemButtons()");
  assert.equal(app.eval("game.state"),"RECORDS");
  press(app.pad,2,false);
  app.eval("pollGamepadSystemButtons()");
  press(app.pad,9,true);
  app.eval("pollGamepadSystemButtons()");
  assert.equal(app.eval("game.state"),"TITLE");
});


test("floor turret uses right stick, X triggers once, remains steerable, then cools for 10 seconds", () => {
  const app=boot();
  app.eval('game.state="PLAYING";game.stageMode="WAVE"');
  app.pad.axes[2]=1;
  app.eval("updateFloorLaser(0.5)");
  assert.equal(app.eval("game.floorLaser.x"), 1000);
  assert.equal(app.eval("game.player.x"), 175);
  press(app.pad,2,true);
  app.eval("pollGamepadSystemButtons()");
  assert.equal(app.eval("game.floorLaser.active"), 5);
  assert.equal(app.eval("game.bomb"), 2);
  app.eval("updateFloorLaser(1)");
  assert.equal(app.eval("game.floorLaser.x"), 1244);
  assert.equal(app.eval("game.floorLaser.active"), 4);
  app.eval("pollGamepadSystemButtons()");
  assert.equal(app.eval("game.floorLaser.active"), 4);
  app.pad.axes[2]=-1;
  app.eval("updateFloorLaser(4)");
  assert.equal(app.eval("game.floorLaser.active"), 0);
  assert.equal(app.eval("game.floorLaser.cooldown"), 10);
  press(app.pad,2,false);app.eval("pollGamepadSystemButtons()");
  press(app.pad,2,true);app.eval("pollGamepadSystemButtons()");
  assert.equal(app.eval("game.floorLaser.active"), 0);
  app.eval("updateFloorLaser(10)");
  assert.equal(app.eval("game.floorLaser.cooldown"), 0);
  press(app.pad,2,false);app.eval("pollGamepadSystemButtons()");
  press(app.pad,2,true);app.eval("pollGamepadSystemButtons()");
  assert.equal(app.eval("game.floorLaser.active"), 5);
});

test("laser deals 0.1 per simulation frame and freezes while paused", () => {
  const app=boot();
  app.eval('game.state="PLAYING";game.stageMode="WAVE";game.floorLaser.x=640;game.floorLaser.active=5;game.enemies=[{x:640,y:480,r:25,hp:10,maxHp:10,kind:"scout",vx:0,vy:0,color:"#fff",core:"#fff"}]');
  app.eval("updateFloorLaser(.016)");
  const afterOne=app.eval("game.enemies[0].hp");
  assert.ok(afterOne <= 9.9000001 && afterOne >= 9.8999999);
  app.eval("updateFloorLaser(.016)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-9.8)<1e-8);
  app.eval('game.state="PAUSED"');
  // updatePlaying gates the damage and cooldown while paused.
  app.eval("updatePlaying(2)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-9.8)<1e-8);
  assert.equal(app.eval("game.floorLaser.active")>4.9,true);
});

test("laser never starts in a menu or benchmark", () => {
  const app=boot();
  assert.equal(app.eval("activateFloorLaser()"),false);
  app.eval('game.state="PLAYING";game.stageMode="TRANSITION"');
  assert.equal(app.eval("activateFloorLaser()"),false);
});


test("RED-BLUE triple starfall emits 1080 shots, deals three 1.3x full-field hits, and upgrades once",()=>{
  const app=boot();
  app.eval(`game.state="PLAYING";game.stageMode="WAVE";
    game.weaponType="redblue";
    game.enemies=[{id:999,kind:"scout",x:840,y:450,r:24,
      hp:200,maxHp:200,score:0,color:"#fff",core:"#fff"}];
    game.redWeapon.special={redBlue:true,elapsed:0,emitted:0};
    game.redBlueStarfall={
      stars:NeonRedBlueWeapon.landingTriplet(game.enemies,null),
      elapsed:0,power:11.5,bulletPower:.38
    };`);
  app.eval("updateRedBlueStarfall(.8)");
  assert.equal(app.eval("game.redBlueStarfall"),null);
  assert.equal(app.eval("game.redBlueStarFx.length"),3);
  assert.equal(app.eval("game.redBlueBullets.length"),1080);
  assert.equal(app.eval("game.redWeapon.stars"),1);
  assert.equal(app.eval("game.redWeapon.special"),null);
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-(200-3*11.5*1.3))<1e-7);
  assert.equal(app.eval("new Set(game.redBlueBullets.map(b=>b.redBlueOriginX)).size"),3);
  app.eval("updateRedBlueStarfall(.8)");
  assert.equal(app.eval("game.redWeapon.stars"),1);
});

test("RED-BLUE amplifies any direct player hit once, including floor laser, but unequipping disables it",()=>{
  const app=boot();
  app.eval(`game.state="PLAYING";game.stageMode="WAVE";
    game.enemies=[{id:1001,kind:"scout",x:640,y:480,r:25,
      hp:100,maxHp:100,score:0,color:"#fff",core:"#fff"}];
    game.floorLaser.x=640;game.floorLaser.active=5;
    game.weaponType="redblue";`);
  app.eval("updateFloorLaser(.016)");
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-99.87)<1e-8);
  app.eval('damageEnemy(game.enemies[0],10,640,480,"#fff")');
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-86.87)<1e-8);
  app.eval('game.weaponType="yellow";damageEnemy(game.enemies[0],10,640,480,"#fff")');
  assert.ok(Math.abs(app.eval("game.enemies[0].hp")-76.87)<1e-8);
});
