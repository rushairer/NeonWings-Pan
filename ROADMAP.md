# NeonWings-Pan roadmap

Independently maintained from NeonWings commit `5ebcb1de1adb288b41a3c5e387f747bc49271c19`.

- [x] Import baseline source, tests and static build
- [x] Rename project and isolate browser storage
- [x] Configure standalone Pages workflow
- [ ] Verify site deployment and controller tests on hardware

## v26.7.1 — Black PINK special rocket and GREEN-sized pink explosion

- [x] Give PINK special missile a black 100 × 100 logical-unit sprite and radius-50 collision, preserving homing and 10× direct damage
- [x] Detonate at impact with GREEN P's exact radius-360 area and single 1× regular PINK bullet damage to nearby OTHER targets
- [x] Prevent direct+AoE double damage; preserve shield and Boss turret/hull hits, plus splitter children snapshot isolation
- [x] Add visually distinct magenta radial blast and rings fading in 0.55s, capped at 12 active FX
- [x] Leave YELLOW missiles, PINK 5% proc, two-shot cadence, weapon swaps and Overdrive damage scaling intact
- [x] Add missile radius, contact damage, area blast, shield, Boss, FX lifetime and non-PINK regression tests
- [ ] Confirm black rocket silhouette and 360-radius visual performance on device

## v26.7.0 — PINK P single-seeker, burst fire, 10× special missile

- [x] Add ninth P pickup with distinct pink sprite, player HUD, and regular drop/restore behavior
- [x] Fire exactly one homing pink bullet per action at all weapon levels, using swept collisions and finite projectile TTL
- [x] Apply a 0.4-second firing rest after each two single-bullet pink shots
- [x] Roll 5% per firing action for one additional homing 10× damage missile
- [x] Reuse bounded YELLOW missile targeting/physics and ordinary enemy shield/Boss turret/hull damage paths
- [x] Preserve launched PINK projectiles and their 10× power after swapping weapon colors
- [x] Add isolated steering/probability/unit tests, collision/integration regressions, docs, and CI asset checks
- [ ] Verify homing readability, balance, and crowded-stage FPS on physical handheld or browser

## v26.6.2 — GRAY P 20/5/75 and burst-rest timing

- [x] Set knockback to 20%, stun to 5%, amplified damage to 75%, strictly mutually exclusive
- [x] Shorten stun to 0.5 seconds; retain 100-unit knockback and 1.5× amplified damage
- [x] Rest 0.4 seconds after every five gray two-bullet volleys; count volleys, not bullets
- [x] Reset the gray streak when switching weapons; retain the streak when collecting another GRAY P
- [x] Keep RED stars, other weapons, shield/Boss damage rules and BLACK slow interactions unchanged
- [x] Add deterministic probability/threshold, stun expiry, burst cadence, pause and swap regression tests
- [ ] Check real-device gray burst responsiveness and Boss difficulty balance

## v26.6.1 — GRAY P probability rebalance

- [x] Reduce GRAY knockback chance from 50% to 10%, preserving 100-unit push
- [x] Reduce GRAY stun chance from 50% to 10%, preserving 1-second duration
- [x] Add mutually exclusive 80% 1.5× direct damage outcome
- [x] Multiply pre-existing normal/Boss/shield damage path, without changing other P guns
- [x] Cover [0, .1), [.1, .2), [.2, 1) boundaries and normal/shield/Boss/turret combat tests
- [ ] Manual balance and performance acceptance on handheld hardware

## v26.6.0 — WHITE P probabilistic chains + new GRAY P

- [x] WHITE secondary damage 60%, no per-hop falloff, radius-360 geometry shared with GREEN
- [x] Always first propagation wave; 50% second wave and 10% third conditional on second (max three)
- [x] Breadth-first waves, no infinite recursion, per-projectile enemy/Boss hit dedup and origin-linked arcs
- [x] GRAY P added as eighth pickup, visually distinguishable paired starter-grade bullets and HUD
- [x] Every gray hit independently chooses 50% immediate 100-coordinate knockback or 50% one-second stun
- [x] Stun freezes ordinary/Zigzag/Boss positioning, even pre-ready attacks and carrier escort production
- [x] BLACK slowdown continues to age during GRAY stun; pause and stage boundaries freeze timers
- [x] Complete syntax/build/test and Pages release gate
- [ ] In-game difficulty, FX density, Boss arena clamping and handheld FPS acceptance

## v26.5.0 — White P piercing and one-hop electricity

- [x] Seventh P pickup, white projectile artwork, status HUD and regular reward-drop integration
- [x] Twin piercing shots continue to the edge of the playfield with per-projectile damage deduplication
- [x] Direct hits trigger a single finite electrical spread using GREEN's 360-radius geometry
- [x] Electrical hits have 55% direct-shot damage; chain victims never trigger more chains
- [x] Preserve regular enemy shield and score pipelines and Boss turret/hull collision handling
- [x] Bound the electricity visual effect pool to 96 transient white-blue arcs
- [x] Add isolated unit tests and integration test fixtures for all affected runtimes
- [ ] Real-browser and handheld playtest for difficulty, effect readability and sustained FPS

## v26.4.0 — Black P slow-control weapon

- [x] Sixth P pickup with black / icy-blue visual identity and paired normal projectiles
- [x] Applying 50% enemy/Boss movement slowdown and 50% attack-frequency slowdown on direct projectile hit
- [x] Five-second per-target status, refreshed but never stacked; pause and stage transitions freeze
- [x] Blue electric glow while slowed with no damage or additional gameplay effects
- [x] Preserve enemy frontal shields, boss turret collision and all existing weapon systems
- [x] Isolate the rules and add unit/integration regression coverage
- [ ] Check balance and visual clarity of slow effect in actual browser and handheld gameplay

## v26.3.2 — Faster green halo damage

- [x] Shorten green aura period from 1s to 0.4s, still 2 HP per pulse (5 HP/s per target)
- [x] Preserve radius 360 and equip-based timer irrespective of target contact
- [x] Align HUD, pure tests, integration tests and documentation
- [ ] Recheck balance, visual density and FPS in real browser/device gameplay

## v26.3.1 — Enlarged green halo and activation-based pulse

- [x] Double green P ring drawing and damage radius to 360 (diameter 720)
- [x] Confirm damage ticks at global 1-second intervals from equip, not time since enemy contact
- [x] Cover entering/leaving the ring and empty activation with regressions
- [ ] Recheck balance, visual readability and frame rate with large halo in live gameplay

## v26.3.0 — NeonWings-Pan green proximity weapon

- [x] Add green P as fifth loot color, with distinct pickup visuals and green HUD status
- [x] Reuse unupgraded dual starter shots, retaining original cadence at every upgrade level
- [x] Add glowing radius-360 aura around equipped fighter, with full-geometry hit checks
- [x] Deal 2 HP per second to all overlapping enemies and Boss hulls through existing damage pipelines
- [x] Freeze clock in pause/transition/rewards; reset partial second when unequipped
- [x] Add pure geometry/timing unit tests and combat/visual regression checks
- [ ] Validate green aura readability, gameplay balance and FPS on browser/handheld devices

## v26.2.0 — NeonWings-Pan red weapon

- [x] Add fourth, red P pickup to normal loot selection and hit-recovery drop paths
- [x] Two fixed parallel red shots; rest for 0.4s after 5 + star level volleys
- [x] Independent 10% proc on normal red volleys with only one active special
- [x] Exactly 250 projectiles within ±10° in 3 seconds of active combat
- [x] Star grant after fan completion, max five; keep stars when switching weapons
- [x] Deduct one star on real HP loss, including while a non-red gun is equipped
- [x] Persistent HUD star display and bounded player bullet budget of 360
- [x] Add unit, integration, static asset and regression checks
- [ ] Manually playtest red cone readability, difficulty balance and sustained 60 FPS on target devices

## Inherited baseline history (reference only)

# NeonWings development roadmap

Status is based on code shipped to `main`. Aspirational features are **not** described as completed.

## v23 — Foundation & handheld polish (in progress)

- [x] Split static entry point from the existing game runtime without changing rendering technology
- [x] Preserve 4:3 logical aspect ratio on widescreen and portrait displays
- [x] Pause when tab/app is hidden or focused window is lost; clear held keys
- [x] Gracefully handle browser environments without localStorage
- [x] Add dependency-free Node smoke tests and GitHub Actions build/deploy workflow
- [x] Remappable dual fire buttons / bomb button, saved settings and tunable stick deadzone (8–44%)
- [x] Gamepad disconnection pauses; reconnect requires releasing held buttons before explicit resume
- [ ] AYANEO AIR MINI physical controller, rumble and audio regression testing
- [ ] Verify first-load, pause, sound and controller behaviors in Chromium and Android
- [ ] Consider TypeScript/Vite only after confirming no regression in Pages/offline behavior

## v24 — Combat evolution (in progress)

- [x] Pure tested NEON OVERDRIVE rules: one-time grazing, kill-charge, combo multiplier, timed activation
- [x] Full game wiring: keyboard/gamepad activation, remappable Y button, energy/combo HUD and combat statistics
- [x] Blue piercing lance, purple wide spread with close-range damage, yellow multi-target missile volley
- [x] Distinct fighter traits: Falcon graze/speed bonus; Vanguard kill-charge/damage/one-hit guard
- [x] Fix Bomb wave completion and count Bomb kills accurately without combo/charge farming
- [x] v24.1: swept projectile collision, hit-before-graze resolution, bounded FX/bullets, F3 frame diagnostics
- [ ] First-stage balance review and 60 FPS profiling on AYANEO AIR MINI
- [ ] Visual QA for crowded HUD/bullets and sustained Overdrive effects in Chromium/Android
- [ ] Optional telegraph/accessibility tuning after playtesting

## v25 — Living worlds (in progress)

- [x] Shield enemies have finite frontal barriers, break visual effects and flanking counterplay
- [x] Splitters release two child drones and carriers launch capped escort waves with hatch telegraphs
- [x] Child drones have restricted score economy (no wave goals, combo, energy or drops); Stage 1 roster corrected
- [x] Five procedural environments, unique warned hazards, normal damage / invulnerability, and pause-safe timers
- [ ] Stage environment hardware/balance verification in Chromium and AYANEO AIR MINI
- [x] Five Bosses have individually destructible front weapon mounts; destroying mounts reduces projectile density/frequency
- [x] First complete clear saves high score and shows a victory epilogue; explicit Start/Enter returns to stronger Loop 2
- [ ] Boss weapon readability and difficulty pacing acceptance tests on real devices
- [ ] Device/browser gameplay balance checks for Stages 3–5

## v26 — Arcade universe (in progress)

- [x] Separate, tested Classic / Boss Rush / Training progression and menu rules
- [x] Boss Rush: five real Bosses in sequence, differentiated clear / Game Over, and separate local best score
- [x] Training: selectable stage, ten-kill Boss drills, full-health equipment reset, unranked free play
- [ ] Mission mode and tailored completion objectives
- [x] Separate local Classic/Boss Rush top-five history, run grades (S/A/B/C) and eight persistent milestone badges; Training is unranked
- [x] v26.1.1 selection-screen overlap regression: mode selector vs fighter highlight, including Training hint, both ships and footer
- [ ] Daily seeded challenge; deterministic combat RNG separate from rendering; replay-compatible fixed-tick simulation still pending
- [ ] Device/browser acceptance for mode menus and full five-Boss run

## v27 — Signature experience (planned)

- [ ] Music and visual-polish pass
- [ ] Optional PWA/offline installation path
- [ ] Performance budgets, device acceptance and release packaging

## Quality gates

`npm run check`, `npm test`, `npm run build`; manual gamepad and audio checks are still required before saying a version is released.
