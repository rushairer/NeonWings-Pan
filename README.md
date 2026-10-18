# NeonWings-Pan

Independently maintained arcade game initialized from [NeonWings](https://github.com/rushairer/NeonWings) commit `5ebcb1de1adb288b41a3c5e387f747bc49271c19` (v26.1.1).

**Play:** https://rushairer.github.io/NeonWings-Pan/

**Development:** `npm run check && npm test && npm run build`. `main` deploys via GitHub Actions. Configure repository Pages source to **GitHub Actions**. Settings, records and scores are isolated from the original game.

## Original gameplay baseline

A controller-first, five-stage, side-scrolling neon arcade shooter built with browser Canvas 2D. Originally tuned for AYANEO AIR MINI. Play as **FALCON-01** (fast, small hitbox) or **VANGUARD-02** (more armor).

## Currently playable

- Five themed stages and five multi-phase bosses; higher-difficulty loops after stage five
- 11 enemy types, formations, nine weapon families, collectible power-ups and BOMB
- Gamepad rumble where browser/device supports it, Web Audio synthesis, volume and vibration options
- Pause, fullscreen, local high score, end-of-run statistics
- v23 foundation: 4:3 letterbox sizing; auto-pause on background/focus loss or controller disconnection; browser-storage fallback
- Pause menu → **CONTROLLER OPTIONS**: change both fire buttons, BOMB and OVERDRIVE independently; calibrate stick deadzone (8–44%); restore controller defaults without resetting audio
- v24 in development: graze enemy shots to build charge, chain enemy kills for up to 5× score, then manually trigger NEON OVERDRIVE to temporarily amplify the current weapon
- v24.1 hardening: continuous projectile collision against fast bullets, contact priority over grazing, bounded effects/projectile arrays, and F3 performance diagnostics
- v25 first pass: shield enemies protect their front until shield energy is broken; splitters release two small drones on destruction; carriers visibly telegraph and launch a limited number of escorts
- v25 arenas: five different procedural backdrops and timed, telegraphed hazards; warnings indicate the future danger zone before it can hurt the player
- v25.1 Boss dismantling: shoot either visible cannon mount to disable it; destroyed turrets reduce the Boss attack density/rate; clearing the fifth stage for the first time awards a pauseable victory epilogue before optional Loop 2
- v26 preview: select Classic, Boss Rush, or Training during fighter selection; Boss Rush has its own high score while Training never writes ranked scores
- v26.1 local hangar: Classic and Boss Rush each retain their five highest ranked runs, show a run grade and unlock eight milestone badges. Training remains unranked.
- v26.1.1 UI fix: fighter/mode selector uses explicit non-overlapping layout geometry; selected fighter frame, Training hint, ship descriptions and score footer retain safe spacing.
- **v26.2.0 NeonWings-Pan exclusive:** red P twin-line fire, a 250-projectile ±10° special fan triggered on 10% of eligible volleys, and an independent 0–5 star progression.
- **v26.3.0 NeonWings-Pan exclusive:** green P retains starter-grade dual shots and adds a passive neon halo dealing area damage to nearby enemies once per second.

## v26.7.0 — PINK P / SEEKER

PINK P is the ninth P pickup in the regular collectible rotation, independent of the original NeonWings repository.

- **Single guided shot:** one visibly pink homing bullet is emitted per firing action, regardless of weapon level. It begins pointing forward and smoothly turns toward the nearest viable target; enemy destruction, spawning, movement, and Boss activations cause retargeting, while no target means it flies along its last heading. The projectile uses swept collision detection, starter-grade direct damage **1.15** (before player/Overdrive scaling), and a bounded **3.6-second lifetime**.
- **Burst cadence:** after every **2 single-bullet firing actions**, PINK rests for **0.4 seconds**, then repeats. Normal between-shot interval uses the starter-grade firing interval (0.101s). Fire button release or collecting PINK again preserves the partial count; changing weapon colors resets that count without affecting RED stars or GRAY burst state.
- **5% special missile:** each ordinary PINK firing action also makes **one 5% roll**. When successful, the same action fires **one EXTRA** homing pink missile in addition to its regular guided bullet. Its impact damage is exactly **10× the normal PINK bullet** (11.5 before common Overdrive/ship scaling, 10× afterward). Both projectile types share existing damage, shielding, Boss turret/hull, and kill-economy rules. Missile guidance and 48-missile shared cap reuse the established YELLOW missile system, but the pink missile has its own visual trail and body.
- **Persistence and safety:** PINK bullets/missiles launched before a weapon swap keep their homing behavior and damage; pause/transitions freeze progression. Bounded projectile and particle pools avoid unbounded growth. Other P weapons, including yellow missile damage, are unchanged.
- **HUD:** `PINK SEEK  2/.4S  5%x10`; it shows guided bullets, burst rest and missile probability/multiplier.

## v26.6.2 — GRAY P 20/5/75 and five-volley burst

GRAY P now rolls one of three **mutually exclusive** effects per actual projectile collision:

- **20% knockback:** push the enemy/Boss up to 100 logical game coordinates; the projectile still deals its normal damage.
- **5% stun:** freeze movement, enemy attacks, carrier escort launches and Boss telegraphs for **0.5 seconds** of active combat time; still deal normal damage. Subsequent stuns refresh to 0.5 seconds. Existing BLACK slow continues expiring independently.
- **75% amplified damage:** deal **1.5× the original gray projectile's damage**, without knockback or stun. Enemy frontal shields, Boss hulls and turrets use their existing damage pipeline.
- **Firing cadence:** one firing action emits **two gray bullets** and counts as **one volley**. After **five volleys**, impose a **0.4-second pause** before the next. Between the first four volleys the original starting-grade firing interval remains unchanged. Releasing the fire button or collecting another GRAY P does not reset the streak, but switching weapon colors does; RED P stars are unaffected. Pausing the game freezes the remaining firing cooldown.
- **Exact probability intervals:** `[0,0.20)` knockback, `[0.20,0.25)` stun and `[0.25,1)` amplified. The gray HUD now reads `GRAY 20/5/75  1.5X`.

## v26.6.1 — GRAY P 10/10/80 damage rebalance

Each GRAY P projectile now rolls **exactly one** outcome on collision:

- **10% knockback:** push the target 100 logical game coordinates; ordinary direct bullet damage remains unchanged.
- **10% stun:** freeze enemy/Boss movement and attacks for 1 second; ordinary direct bullet damage remains unchanged.
- **80% amplified damage:** deal **1.5× the normal direct bullet damage**, with neither knockback nor stun. The multiplier also affects existing frontal shield absorption and Boss turret weak-point damage, using the original damage pipeline.
- Probability thresholds are [0, 0.1), [0.1, 0.2), and [0.2, 1). Every direct hit independently rolls once. The game HUD shows `GRAY 10/10/80 1.5X`.

No change to gray bullet count or cadence, 100-coordinate push distance, stun duration, or any other P weapon's effects.

## v26.6.0 — WHITE P conduction upgrade and new GRAY P

WHITE P preserves its paired piercing white projectiles and GREEN P's radius-360 electric range. **Every secondary electricity hit now deals 60% of the original bullet's direct damage**, without any further loss across propagation levels.

- **First hop: 100%** on every new direct projectile hit; targets hit electrically do not reroll a new chain.
- **Second hop: 50% probability** per direct hit. If unlocked, every newly reached target from hop 1 becomes a possible origin for a second radius-360 spread.
- **Third hop: 10% conditional probability** if hop 2 was unlocked, corresponding to 5% unconditional probability. No propagation is allowed past hop 3.
- Each propagation wave may hit multiple targets, but per-projectile hit deduplication ensures a single projectile cannot repeatedly damage an enemy or a Boss. Visual white-blue arcs connect each actual hop origin and remain bounded at 96 concurrent effects. No infinite chain or exponential recursion.

**GRAY P / IMPACT** is the eighth collectable P weapon, with two normal-damage gray projectiles at the original unupgraded firing cadence. Every bullet that hits a living enemy (including its shield), or an active Boss/turret, independently selects exactly one effect:

- **50% knockback:** immediately move the victim **100 logical game coordinates** away from the incoming projectile. Bosses also shift their scripted anchor, with arena limits preventing pushing them offscreen.
- **50% stun:** freeze the victim's motion, enemy shooting, carrier escort launches and Boss attacks/warnings for **1 second**. The stun wears off automatically; another stun hit refreshes the duration to 1 second. A small STUN label makes its active status visible.
- Other weapons and already-fired enemy bullets are not altered. Swapping weapons preserves already-inflicted stun/knockback outcomes, while overlapping BLACK slow and GRAY stun expire on their own real-combat clocks. Pause, transitions and reward screens do not consume stun time.

The eight P pickups share the regular P drop distribution. Test gates cover both probability boundaries, exact 100-unit displacement, attack/movement freezing, combined BLACK/GRAY timing, multi-hop White FX, and previous Blue/Red/Green/Black behavior. Hardware balance/FPS testing remains open.

## v26.5.0 — WHITE P / PIERCE + CONDUCT

The seventh P pickup is **white**, appearing alongside the existing P colors. Its paired luminous-white shots use the starter weapon cadence and travel through enemies rather than vanishing on the first collision.

- **Piercing:** each white projectile remains in flight until leaving the playfield, damaging each directly contacted enemy **at most once per projectile**; it can damage one Boss (hull or turret) at most once. Other weapons' piercing and ordinary bullets remain unchanged.
- **Electric conduction:** every fresh **direct** contact causes one non-recursive area discharge centered on the projectile impact. All other living enemies intersecting that area also take electrical damage. The area uses the **exact same 360 logical-pixel radius as GREEN P**, including the target's hitbox, and is sourced from GREEN P's rule rather than duplicated.
- **Damage balance baseline:** the struck target takes the normal white shot damage (1.15 before Overdrive scaling); secondary targets take **55% of the shot's direct damage**. Original enemy shield absorption, kills and Boss hull damage logic still apply. Direct boss turret hits preserve turret mechanics. Enemies within electric range of an enemy hit can conduct to the Boss hull once, but indirect conduction cannot target Boss turrets.
- **No infinite chains:** secondary victims **never** generate new discharges. Direct and electrical contacts share one victim ledger per projectile, so a victim cannot be hit twice by the same projectile even if later crossed by it; direct hits farther along the shot can initiate further local discharges.
- **Effects and performance:** short-lived, bounded white-blue lightning arcs show the struck neighbors and never cause additional damage. At most 96 arc effects are kept. Switching weapons does not strip conductivity from white shots already in flight.
- **Coexistence:** RED P stars, GREEN P global 0.4-second halo ticks, and BLACK P 5-second slow status are unaffected.

## v26.4.0 — BLACK P / SLOW

BLACK P joins the regular P pickup rotation as the sixth weapon. It fires two visible charcoal-dark shots with icy-blue edging at the starter dual-shot cadence, regardless of general weapon level. Black does not inherit blue's extra shots or Overdrive lance. Its usual bullet damage remains intact.

- **Guaranteed slowing on collision:** any BLACK P projectile that hits a living enemy (including a frontal shield) or an active Boss (including a turret) applies **-50% movement speed and -50% attack frequency for five seconds**. Already-fired enemy bullets keep their existing velocities.
- **Every hit refreshes 5s:** repeated black hits refresh the same status instead of stacking (never -75% or -100%).
- **Movement and attack:** horizontal motion, oscillating vertical motion, Boss position patterns, enemy shooting intervals, carrier escort-launch cooldown and Boss warning/attack timers all progress at half speed while afflicted. After 5s the original speeds return automatically.
- **Blue glow only:** afflicted regular enemies and Bosses visibly pulse with an electric-blue aura for the duration. The glow produces **no additional damage, shield, or other effect**.
- **Persistence:** switching weapons does not immediately cure afflicted enemies; their existing five-second combat clock keeps running. The debuff freezes during pause, stage transitions, and non-combat reward screens. Red stars and green halo behavior are unchanged.
- **Performance:** glow is drawn only for currently afflicted enemies, with no added particle spawning or unbounded gameplay arrays.

## v26.3.2 — GREEN P faster damage pulses

- Green P now deals **2 HP per target every 0.4 seconds**, equivalent to **5 HP per second per target** before shielding, instead of once per second.
- The pulse clock still begins at equip and runs even with no targets present. Contact and entry/exit never restart it.
- The 360-radius green ring (720 diameter), starter-grade ordinary bullets, and other weapons are unchanged.

## v26.3.1 — GREEN P halo size and global pulse timing

- Doubled the green ring's **visual and damage radius** from 180 to 360 logical pixels (diameter 720).
- Locked damage to a **single global one-second clock from activation**. Enemy touch/entry never starts or resets a separate timer.
- Added regression tests covering empty-field startup, late enemy entry, leaving/re-entering range, visual radius, and boundary collision.

## v26.3.0 — GREEN P / AURA

The fifth collectible P is green. Picking it up surrounds the selected fighter with a glowing green ring and equips the proximity aura.

- **Regular bullets:** identical to the untouched starting (blue Lv.1) dual-line shots and their original firing interval, regardless of the current overall weapon level. Green adds no missiles, spread, or blue Overdrive lance. Ordinary Overdrive damage scaling still applies to its starter bullets.
- **Passive ring:** 360 logical-pixel radius (twice its previous radius) centered on the fighter, visible as a glowing green circle. It **does not require holding fire**.
- **Damage:** every completed 0.4-second interval of active combat after the aura is equipped, each intersecting enemy takes 2 HP damage (5 HP/s). The 0.4-second clock starts at activation, continues even if no enemies are nearby, and is never restarted when an enemy enters or leaves the ring. Enemies entering mid-cycle are hit at the next global 0.4-second pulse, not 0.4 seconds after contact. The ring also damages Boss hulls when their hitboxes intersect it, and honors existing enemy frontal shields, kills, and loot/score rules. This fixed radius/damage is the initial balance baseline; hardware playtesting is still needed.
- **Timing:** its activation-based 0.4-second timer pauses when the game is paused or in stage transitions/reward screens. Switching to another P stops the aura and resets its partial second. On re-equipping green, a new full 0.4-second interval is required to pulse.
- **Coexistence:** RED P star levels still persist independently when switching to green; a previously activated red fan is allowed to finish normally.

## v26.2.0 — RED P / SCATTER

The fourth P pickup is **red** and can drop wherever blue/purple/yellow P pickups can drop. Picking it up equips RED P without resetting previously earned RED P stars.

- **Normal fire:** every volley shoots two parallel red forward shots. After **5 + RED star level** volleys, the red gun pauses **0.4 seconds**. At zero stars it rests after five; at five stars it rests after ten.
- **Proc chance:** each normal red volley has an independent **10%** chance to begin a special. There can only be **one special active at a time**.
- **Special:** shoots **250 smaller red projectiles over three seconds**, distributed within **±10°** around the forward attack direction. The next star is granted **only when all 250 have been launched**; level caps at five, but the special can still activate at five stars.
- **Switching weapons:** stored red stars survive switching to any other weapon; active special streams also finish. Other weapons keep their own original cadence, damage and Overdrive rules.
- **Taking real damage:** each HP-losing hit subtracts **one red star**, down to zero, even if another gun is equipped. Invulnerability and absorbed Vanguard Overdrive guard hits do not subtract a star.
- **Combat-time clock:** pause, focus loss, stage transitions and Boss reward intervals freeze the special timer. Releasing fire does not cancel an already-triggered special. New runs start at zero stars.
- **HUD:** bottom-center red panel retains star progress even while another weapon is equipped. Player bullet cap is now 360 to accommodate the special while preserving bounded memory.

The 250-shot fan is backed by deterministic timing/angle tests and browser mock integration tests. Browser visuals, controller feel and device FPS remain to be manually accepted.

## Run

Open `index.html` in a modern browser. For a static server:

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000. No runtime dependencies or network services are required.

```sh
npm run check
npm test
npm run build
```

The build copies the offline-capable game files to `dist/`. No bundling or remote assets are necessary yet.

## Controls

| Context | Gamepad | Keyboard |
| --- | --- | --- |
| Move | Left stick / D-pad | Arrow keys / WASD |
| Fire (hold) | B / RT (remappable) | Space / J / K |
| BOMB | A (remappable) | Shift / L / X |
| NEON OVERDRIVE | Y (remappable) | C / I |
| Start / pause / resume | Start | Enter to start; P / Escape to pause/resume |
| Select fighter / adjust pause settings | D-pad | Arrow keys |
| Fullscreen | Select | F |
| Controller options | Pause → Controller Options (B to confirm) | Pause → Controller Options (Enter to confirm) |

When the page becomes hidden, loses focus, or the active controller disconnects, gameplay pauses without auto-resuming. After reconnect, release held buttons before pressing Start again. Menu confirmation always stays on physical B and system Start/Select are never remapped.

## NEON OVERDRIVE (v24 preview)

Graze incoming bullets **without actually colliding** with them (one charge per bullet), or defeat enemies, to fill a 100-point energy meter. Activate manually using **Y** or **C / I**. The timer only advances during active waves/Boss fights; pause and between-stage transitions do not consume charge.

- **FALCON-01:** gains more energy from grazing; 6-second Overdrive, +18% movement, piercing cyan lances (up to three different enemies).
- **VANGUARD-02:** gains more charge from regular kills; 7-second Overdrive, 30% shot/missile damage boost and one protective hit absorption.
- **Weapons:** blue line shoots a piercing lance; purple spread widens and deals +50% close-range damage; yellow missiles fan out to several nearby targets with a capped extra volley.
- **Scoring:** 3.8-second combo chain, multiplier increases every five kills up to 5×; getting hit breaks the combo. Bomb kills still award normal score but never farm charge or combos.

Overdrive requires a full meter and cannot recharge while active. A damaging hit ends it; Vanguard may use its one shield charge first. HUD shows energy, active duration, graze count and combo. These features require controller/browser playtesting before a stable release claim.

### Profiling / performance budgets

Press **F3** on a keyboard during play to toggle a small performance diagnostics overlay showing observed FPS, frames longer than 25 ms, particle/enemy-bullet counts, shots and missiles. Rendering uses a fixed logical 1280×960 playfield. v24.1 limits active particles to 800, enemy bullets to 340, player bullets to 360, and missiles to 48. These are defensive memory ceilings, **not** evidence of stable 60 FPS on AYANEO hardware. Bullets use swept collision against enemies and the player, including across frames with longer elapsed time. Real-device playtests should check controller feel, visual readability and frame pacing.

## v25 enemy behavior preview

- **Shield (Stage 3 and Stage 5):** a visible left-facing energy arc absorbs frontal damage, has finite shield health, and can be bypassed by flanking from behind. After its barrier breaks, the normal hull takes full damage.
- **Splitter (Stage 4):** destroyed splitters release up to two small drone enemies, only during active waves. A screen-clearing BOMB suppresses this secondary spawn.
- **Carrier (Stage 5):** a glowing hangar warns of a drone launch; each carrier deploys at most three escorts over its lifetime with a maximum of two escorts alive per carrier.

Spawned drones give only small points and count toward total defeated enemies. They do **not** increase stage wave goals, extend combos, charge Overdrive, or drop pickups. The live enemy list has a maximum size of 84. Stage 1's reward formation no longer spawns Stage 3-only shield units.

These features currently have unit/integration coverage, not final hardware or browser balance approval.

## Five living arenas

The original 1280×960 Canvas playfield now renders stage-specific, procedurally drawn environment silhouettes, with no remote images or new dependencies. Hazards are **fair, timed, and telegraphed**:

| Stage | Environment mechanic | Player counterplay |
| --- | --- | --- |
| 1 — Skyline | Narrow electrical rail column | Move outside the glowing vertical stripe |
| 2 — Canyon | Targeted rockfall impact | Leave the marked circular impact zone |
| 3 — Orbit | Full-width cryo lane | Move above or below the marked row |
| 4 — Hive | Blooming spore cloud | Exit the spore ring |
| 5 — Citadel | Diagonal core scan | Dodge away from the slanted energy path |

Danger zones are purely visual during their warning phase. Damage can only occur during their brief active phase and uses normal HP, invulnerability, and fighter shielding. The world clock freezes during pause, transitions, and boss rewards, then resets for the next stage. These mechanics still require real browser/handheld balance testing.

## Boss weapon mounts and first-clear ending (v25.1)

Each of the five bosses now has **two visible, player-facing turrets** with individual health rings. Target a glowing turret with bullets or missiles; breaking it deals a small amount of damage to the main Boss HP, awards a fixed one-time bonus, and reduces aimed-fan projectile count plus overall attack frequency. Core hits still deal direct Boss damage, and BOMB remains a defensive alternative. Breaking a mount cannot grant repeated points.

After **Stage 5 is cleared for the first time in Loop 1**, the game shows a victory epilogue with the run score and combat stats. This is an explicit, non-timed intermission: the high score is saved and no enemies or danger timers advance. **Start or Enter** begins Loop 2. Later loops do not repeat the epilogue.

These improvements are validated by deterministic rules and mocked-canvas integration tests. In-game appearance and device performance still need visual and handheld verification.

## Arcade Universe game modes (v26)

Press Start / Enter at the title screen to choose a fighter **and a mode**. Use **Up/Down** to select Classic, Boss Rush, or Training, and Left/Right to switch between Falcon and Vanguard. On a controller use the D-pad; on a keyboard use arrow keys or WASD. In Training, use **LB/RB or Q/E** to choose which of the five stages to practice.

| Mode | Starting equipment | Stage progression | High scores |
| --- | --- | --- | --- |
| **Classic Arcade** | Original Level 1 weapon, normal health, 2 Bombs | Original five stages, first-clear epilogue, stronger endless loops | Original Classic local high-score key (unchanged) |
| **Boss Rush** | Level 2 weapon, normal health, 2 Bombs | Bosses 1–5 back-to-back, with brief reward / transition between fights | Separate local Boss Rush record |
| **Training** | Level 3 weapon, full HP, 3 Bombs | Select any stage; 10 kills to practice its Boss; repeat the same stage | Unranked: no high-score writes |

**Boss Rush** keeps real Boss phases, destructible weapon mounts and normal damage. The run ends with a dedicated completion screen after all five Bosses, or a Game Over if HP runs out. Use Start / Enter from the result screen to return to the title menu.

**Training** restores full HP and equipment between rounds and revives after losing the last hit point, while preserving visual hit feedback and practice statistics. Pause → Return to Title to exit the drill. Normal enemy combat, hazards and Boss phases remain enabled so that practice has real mechanics.

**Local Records and Achievements:** From the title screen press **H on keyboard / X on the gamepad** to open the local hangar. It shows the best five completed runs for Classic and Boss Rush separately, their grades and chosen fighter, plus eight unlockable milestones. Start / Enter / H returns to the title menu. Grades summarize the run milestone and damage taken (S/A/B/C); they are not online skill rankings. Training is explicitly excluded from records and achievements.

The Classic historical high-score key and Boss Rush high-score key remain unchanged. The Top Five / achievements are stored under a separate `neon_wings_arcade_records_v26` localStorage key and degrade to in-memory state if browser storage is unavailable. No accounts, network services, external assets or new dependencies are introduced. Mission mode, daily seeded challenges and replay-compatible simulation are **not** yet shipped.

## GitHub Pages

The workflow tests, builds, and publishes `dist/` when changes reach `main`. Configure the repository once at **Settings → Pages → Build and deployment → Source: GitHub Actions**. The workflow cannot turn this repository setting on itself. Deployment may be blocked until this one-time setting is enabled.

## Development

See [AGENTS.md](AGENTS.md) for invariants and test gates; [ROADMAP.md](ROADMAP.md) for upcoming versions.

This project is still evolving. Hardware rumble and browser fullscreen are browser/device-dependent; not all browsers support them. No software license has yet been specified in this repository.
