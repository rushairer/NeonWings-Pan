# NeonWings-Pan

Independently maintained arcade game initialized from [NeonWings](https://github.com/rushairer/NeonWings) commit `5ebcb1de1adb288b41a3c5e387f747bc49271c19` (v26.1.1).

**Play:** https://rushairer.github.io/NeonWings-Pan/

**Development:** `npm run check && npm test && npm run build`. `main` deploys via GitHub Actions. Configure repository Pages source to **GitHub Actions**. Settings, records and scores are isolated from the original game.

## Original gameplay baseline

A controller-first, five-stage, side-scrolling neon arcade shooter built with browser Canvas 2D. Originally tuned for AYANEO AIR MINI. Play as **FALCON-01** (fast, small hitbox) or **VANGUARD-02** (more armor).

## Currently playable

- Five themed stages and five multi-phase bosses; higher-difficulty loops after stage five
- 11 enemy types, formations, fifteen weapon families, collectible power-ups and BOMB
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

## v26.12.1 — 彩色武器逐发射击与 0.4 秒间隔

RAINBOW / PRISM now fires **exactly ONE projectile (or ONE replacing PINK special missile) per firing action**, centered on the fighter's muzzle, followed by **0.4 seconds of active-combat cooldown** before the next shot while FIRE is held. The cooldown does not advance during pause. This applies at every weapon level. Each emission independently chooses one of the same eight abilities at the original **7 × 13% + 9% = 100%** distribution. No other weapon's fire cadence or special effect is changed.

**Play:** https://rushairer.github.io/NeonWings-Pan/?v=26.12.1

## v26.12.0 — RAINBOW P / PRISM (彩色随机弹)

The FIFTEENTH P color is RAINBOW / PRISM, obtainable through the normal power-up drops, recoverable after taking a hit, and independently available in Classic, Boss Rush and Training modes. Its pickup has an eight-color perimeter. It fires at the **starter dual-shot cadence** (approximately 0.101s per firing action); **each of the TWO projectile slots independently rolls one mutually exclusive effect**. It NEVER fires all eight at once and never quietly makes an extra DARK RED or PINK proc on top of the selected projectile.

| Random shot type | Per projectile | Inherited behavior |
| --- | ---: | --- |
| Yellow guided bullet | 13% | Yellow-colored homing projectile, seeks a live enemy/Boss (guided flight like YELLOW's target-seeking missiles, but this is a normal-power bullet, not an extra missile) |
| Black slow bullet | 13% | Original BLACK P's 5-second, 50%-speed enemy/Boss slow and same blue-glow status FX |
| Pink missile | **9%** | **REPLACES** that shot with the existing PINK P 100-unit BLACK guided special missile, 25× direct damage, 360-radius pink explosion with only 1× direct-shot damage to OTHER nearby victims |
| Dark red chain bullet | 13% | Original DARK RED P's guaranteed 1× hit then independent 50%-chance full-strength repeats, up to 30 TOTAL damage hits to the SAME living victim; no new 5%-chance dark-red rocket |
| Gray impact bullet | 13% | Original GRAY P's mutually exclusive 20% knockback / 5% 0.5s stun / 75% 1.5× direct-damage outcome on contact |
| White piercing conductive bolt | 13% | Original WHITE P piercing shot plus 360-radius electric arcs, up to 3 hops at original 60% secondary damage per victim (in this game, WHITE is *conductive*, not a missile weapon) |
| Lime orbit bullet | 13% | Original LIME P's ordinary muzzle bullet curving into a 360-radius clockwise orbit around the moving player (3.2s active lifetime, no artificial per-color projectile count cap) |
| Orange explosive bullet | 13% | Original ORANGE P's first-hit radius-100 explosion, 3× ordinary bullet damage to each victim exactly once |

**Total:** 7 × 13% + 9% = **100%**. The type roll is made **once per physical projectile as it is launched**, never on frame update/impact. With two independent projectile slots per action, a dual launch can contain two different effects or even two missiles; outcomes are not manually normalized after launch. Existing shared missile/normal-shot budgets still protect all weapons, while lime orbiters keep their previously requested no-cap semantics and natural TTL.

All damage inherits the original ship/Overdrive scaling, shield absorption, Boss weak-point geometry, kill accounting and existing effects without a second implementation. Already-fired mixed bullets and specials survive P color switches. Unique `P_RAINBOW` drops, rainbow pickup icon, status `RAINBOW  7x13%  M9%`, cache-versioned browser runtime and deterministic 100,000-roll probability tests are included. Existing 14 weapon behaviors are left unchanged.

Playable release: https://rushairer.github.io/NeonWings-Pan/?v=26.12.0

## v26.11.1 — DARK RED P 50% chain up to 30 hits + 5% guided 10× missile

The separate fourteenth DARK RED P weapon now deals far more frequent repeat hits. Every ordinary DARK RED bullet still deals one guaranteed **100% normal 1.15 damage** on actual contact. While the SAME victim stays alive, a fresh **50% chance** triggers each additional **FULL 100% damage event**. The chain stops immediately on the first failed roll, the original enemy's death, Boss turret destruction, or Boss defeat; a strict **30 TOTAL hits per projectile** prevents unlimited damage and no roll happens after the cap. Repeats use the existing damage/score/shield and Overdrive paths, with NO damage reduction or new target acquisition. Under this rule, the probability of 2 or more hits is 50%, 3 or more is 25%, 4 or more is 12.5%; long streaks are increasingly rare.

Each TWO-bullet firing action also has one independent **5% chance** to launch an ADDITIONAL **dark-burgundy guided missile**. Its homing, swept-hit rules, 100-game-unit rocket size, maximum travel life, 48-missile shared cap, radius-360 blast and fade are PINK-special compatible, but the body, fins, trails and explosion are **DARK RED** rather than PINK or black. Its DIRECT impact deals **1,000% of a normal DARK RED shot = 10× (11.5 unscaled)** and independently follows the SAME **50% repeat chance / 30-hit cap**: every successful repeat again deals the missile's complete original **10×** impact damage (never reduced). Boss mounts can receive the chain, but once the original mount breaks, further strikes cannot spill into the Boss hull.

As on the original PINK missile, the area explosion affects OTHER existing nearby enemies/Bosses at 360 logical units for **exactly ONE 100%-strength normal bullet splash**, without chain or repeated detonation. The directly struck victim receives its 10× chained impacts only (no additional splash). Shield absorption, splitter spawning and shared fighter/Overdrive multipliers retain their normal behavior. The 5% missile proc is evaluated once **per ordinary two-bullet firing action**, never per projectile hit or per repeat. DARK RED does NOT inherit normal RED's star progression, and original PINK's 15% chance / 25× rocket remains unchanged.

**HUD:** `DARK RED  50%x30  M5%x10` (50% continuation, 30 total hits, 5% missile launch, 10× rocket impact). New regression tests lock 0.499999 / 0.50 chain boundaries, 0.049999 / 0.05 missile boundaries, max 30 hits / 29 continuation rolls, and end-to-end Boss/weak-point, shield, homing, dropped target, dark-red blast and unaffected original PINK.

**Play:** https://rushairer.github.io/NeonWings-Pan/?v=26.11.1

## v26.11.0 — DARK RED P / CHAIN (深红色)

**The fourteenth P weapon** has a dark burgundy pickup with a three-strike emblem and distinctive crimson-glowing bullets; unlike normal RED P, it has no star progression, volley rest or special fan. DARK RED is available from ordinary P drops with equal per-color odds (**1/14 conditional color probability**), can be re-equipped/recovered and displays `DARK RED  10% CHAIN  x10`.

Each firing action emits **two standard forward bullets** at baseline dual-shot cadence (approximately 0.101s), each dealing normal direct-shot damage **1.15 (100%)** before fighter/Overdrive scaling. When a bullet actually collides with an enemy or Boss, the initial damage event is **guaranteed**. A fresh, independent **10% chance** then decides whether to deal **a second full-strength 100% damage event** to that *same* target. A second success earns a third 10% roll, and so on, up to a **hard maximum of 10 total full-strength hits per bullet** (initial hit + at most nine extras). No random roll or extra damage occurs beyond the tenth hit.

Thus the probability of at least **2 hits is 10%**, **3 hits is 1%**, **4 hits is 0.1%** and **10 hits is 0.0000001%**. Each repeated hit is processed individually through ordinary enemy/Boss damage functions, so existing shields are consumed incrementally, Boss turret weak-point scaling and regular kill rewards apply, and Overdrive scaling remains identical to the initial hit. No damage attenuation occurs.

**No piercing or transfer:** when the original enemy dies, a struck Boss turret breaks, or the Boss dies, the chain stops immediately, without damaging neighboring enemies or newly spawned splitter children. An existing Boss turret-break bonus still removes 6.5% maximum Boss hull HP **once**; this normal effect is not a chain hit. Already-fired DARK RED bullets retain the effect even after switching weapons. The ordinary RED P five-star HUD appears **only when RED P is equipped**, unaffected by DARK RED.

Tests include independent RNG thresholds (0.099999 accepts, 0.10 rejects), max ten hits/no eleventh roll, shield charge, enemy death, splitter, Boss/turret break, Overdrive, weapon switching and all pre-existing weapon regression tests.

**Play:** https://rushairer.github.io/NeonWings-Pan/?v=26.11.0

## v26.10.0 — Unlimited LIME P, adaptive SKY P, clearer GRAY stun and RED-only star UI

This version integrates the previously unverified offline work into the actual `NeonWings-Pan` engine, includes automated gameplay tests and publishes all code and assets together.

**LIME P (yellow-green): unlimited simultaneous bullets.** There is no hard per-weapon count cap and LIME bullets do not consume the shared 360-slot allowance for ordinary weapons. Continuous firing no longer evicts older orbiting bullets. Each one still originates from the normal twin-lane muzzle, spirals outward into the 360-radius circle, expires after **3.2 active seconds**, or disappears on its first hit. These are natural lifetime/collision rules, **not a quantity limit**. The normal game cadence limits typical live bullets, but direct/test firing is not artificially capped.

**SKY P (light blue): 13th collectible.** Its mode uses the game's actual **remaining `game.hp` health cells**, checked whenever a new volley is fired:

- **4 or more HP:** two standard twin-lane shots, each with **2.5× normal 1.15 damage = 2.875** before fighter/Overdrive scaling. No BLACK slow effect.
- **3 HP or fewer, including exactly 3:** two **automatically homing** bullets with ordinary **1× damage**. Each applies BLACK P's exact **5-second, 50% movement/attack slow** on a real hit, reusing BLACK's original **blue-glow slow visual** on enemies/Bosses. A seeking bullet has a 3.6-second active-flight lifetime; its mode does not change if HP changes while it is airborne.
- A unique bright sky-blue collectible icon, twin bullet appearance and a health-reactive HUD identify SKY mode. Every one of the 13 P colors has equal conditional selection probability, without changing the separate HP/BOMB drop logic.

**GRAY P:** the existing **5% chance of a 0.5-second stun** now shows an animated **gold countdown ellipse, three revolving stars and a clear STUN label** above affected enemies/Bosses. This is entirely cosmetic; knockback, damage and CC timers are unchanged and do not advance while paused.

**RED P:** its **five-star progress HUD and star-up notifications appear only while actually equipped with RED P**. Stars earned or lost and an already-started 250-projectile fan still process correctly when other weapons are active. Re-equipping RED P restores the star HUD at the retained level. No star graphics intrude while using SKY or any other P color.

Versioned playable page: https://rushairer.github.io/NeonWings-Pan/?v=26.10.0 (script cache versions match the release).

## v26.9.2 — Fix LIME orbit truncation and browser script caching

The previous update DID add normal muzzle-fired LIME bullets and a curved 360-radius path, but there was a remaining full-auto balancing bug: **two shots per 0.101 s** generate roughly **64 live bullets** during the 3.2-second projectile lifetime. With the old **32-orbiter cap**, the oldest shots were deleted after roughly 1.6 seconds (just over one second after reaching the ring) and **could not complete even one revolution**. The cap is now **72**, enough to preserve their full natural lifespan; the existing global player-bullet limit still applies.

The website also referenced unversioned JavaScript URLs after gameplay changes, potentially leaving an existing browser on cached pre-fix code. The active `src/lime-weapon.js` and `src/game.js` script tags now use **`?v=26.9.2`**. Use [the cache-distinct game link](https://rushairer.github.io/NeonWings-Pan/?v=26.9.2) and check for the `v26.9.2` title to confirm this patch loaded.

**Intended in-game behavior:** press FIRE while holding LIME P: two **ordinary rectangular** lime-core projectiles originate at the two starter muzzle positions, spiral smoothly outward during 0.48 seconds, and then orbit the moving fighter at radius 360 at 2.8 rad/s. With the corrected cap, an unobstructed projectile can **make more than one complete revolution** before it expires naturally after 3.2 seconds. Projectile collisions still deal one base 1.15 hit to just the first target; the visual ring is not an aura and has no damage.

New regression tests now simulate continued FIRE through a full orbit (not just single-shot isolated frames), enforce the real shot rate vs capacity, and ensure the HTML includes cache-versioned scripts. No other P colors changed.

## v26.9.1 — LIME P fires NORMAL bullets with curved orbital flight

Fixed the yellow-green (LIME P) weapon's projectile behavior: it now fires **ordinary twin-lane bullets from the player's muzzle** at exactly the same initial positions and base power as starter-grade BLUE P, rather than spawning diamond-shaped orbiting satellites instantly 360 units away. The yellow-green bullet's **flight path** is the special effect, not the bullet model.

- **Launch:** two normal rectangular 9-radius player bullets emerge at `player.x + 62`, `player.y − 10` and `player.y + 12`, facing forward and moving immediately. They keep the normal bullet damage **1.15** before ship/Overdrive scaling and the existing basic twin-shot cadence.
- **Curved trajectory:** each flying bullet turns clockwise while its distance from the player grows smoothly and continuously. After **0.48 seconds**, it reaches an exact **360-unit radius** around the player's current position and continues circular flight at **2.8 radians/second**. No projectile jumps or teleports to the outer ring upon firing.
- **Player movement:** interpolate the bullet's tracking center during fighter movement to maintain continuous swept flight; switching weapon colors keeps already-fired LIME bullets in motion. No damage is dealt merely by the orbit guide/ring itself.
- **Normal collisions:** ordinary bullet geometry, single impact per projectile, shields, Boss hull/turret priorities, kill scoring and Overdrive remain unchanged. Arc segments include the outward curve and full circular portion; the final live path segment remains eligible to hit even when bullet lifetime expires.
- **Budgets:** preserve 3.2 seconds of active bullet lifetime, maximum 32 simultaneous LIME bullets, and offscreen bullets returning from the circular path. Pause and stage transitions still freeze bullet motion.
- All other P guns, including the BROWN laser, GREEN passive aura, PINK missile and ORANGE blast, remain unchanged.

## v26.9.0 — BROWN P auto-lock laser and LIME P radius-360 orbital shots

Two independently implemented P power-ups join the existing ten (now **12 P colors**, each with equal conditional P-drop chance). Both share the same normal hit/shield/Boss scoring pipeline, and leave the original NeonWings repository unchanged.

**BROWN P / LOCK LASER**: while holding FIRE, fire a visually continuous copper/amber laser from the ship, **not individual bullets**. Automatically aim toward the closest living enemy in front of the muzzle, or a viable active Boss turret/hull. The beam is **clipped to its first geometric obstruction**; it never pierces another enemy, a turret, or the Boss hull. It deals a single-target **1.15 normal-weapon damage every 0.101 active combat seconds** while its lock survives, using ordinary fighter/Overdrive damage scaling and honoring frontal shields, weak-point mounts, kills and scores. Switching guns, releasing FIRE, losing all targets, pause and stage transitions stop damage. With no forward targets the laser has no visible hit beam. The lock refreshes automatically as enemies move, die or spawn; a visible amber beam ends at the actual collision surface (max forward range 1300 logical units).

**LIME P / ORBIT** (黄绿色 P): each normal firing action emits **two lime bullets** starting on the player's **radius-360 circle, opposite each other**. The bullets rotate in a clockwise screen direction at **2.8 radians/second**, maintaining exactly 360 logical units from the player's current position as it moves. Each orbital bullet has base 1.15 direct damage, independently scaled by ship/Overdrive; it **hits only one enemy or Boss part/hull and then disappears**, with shield absorption and Boss weak points intact. Bullets can orbit for up to **3.2 seconds**, with a maximum of **32 simultaneously active**. Large-frame arc segments are subdivided for accurate collision testing. A faint yellow-green circular guide shows the orbit track without passive damage; actual damage requires an orbiting projectile collision. Shots retain their orbital behavior after switching weapon colors; offscreen arc portions survive until returning on-screen or expiry.

Both get unique P pickups, distinct sprite/HUD, regular P drops and recoverable weapon drops. The original PINK 15%/25× special missile, GREEN 360 aura, GRAY burst, RED stars and every prior weapon retain their behavior. Computer/browser CI tests cover laser first-target clipping, Boss turret priority, orbit geometry, lifetime, shield and cross-weapon regressions; handheld real-FPS and balance acceptance remains open.

## v26.8.1 — PINK P special chance 15% and 25× direct missile damage

PINK P now fires its bonus black guided missile with a **15% independent probability per ordinary firing action** (previously 10%), and each successful special deals **25× ordinary PINK bullet damage directly** (previously 10×). At base power 1.15, that is **28.75 direct damage** before normal ship/Overdrive scaling.

- The regular single homing bullet always fires; the 15% special roll happens only once for each firing action, never for each hit or frame.
- The existing **0.4-second rest after two shots**, black 100-game-unit missile, targeting/retargeting and shared missile cap are unchanged.
- The 360-radius pink explosion remains exactly **1× ordinary PINK bullet damage** to *other* nearby enemies/Bosses. The directly struck target takes its 25× hit only, not additional 1× splash; this remains true under Overdrive scaling.
- Existing shield, Boss turret, scoring, already-fired projectiles, other P weapons and pause semantics are unchanged.
- HUD: `PINK SEEK  2/.4S  15%x25`.

## v26.8.0 — ORANGE P / BLAST

The tenth power-up color, **ORANGE P**, joins the regular P drop rotation. Its two orange-glowing starter-grade bullets travel straight forward. Each bullet **detonates immediately on its first swept enemy or Boss/turret collision**; it never pierces or chain-reacts.

- **Area:** the explosion has a **100 logical-unit radius**, measured from the FIRST actual swept projectile impact. A target's collision circle or Boss rectangle counts when touching that radius.
- **Damage:** every affected target, **including the directly struck enemy or Boss**, receives **exactly 3× the normal ORANGE bullet's 1.15 direct power** (3.45 before the shared ship/Overdrive damage scale). This explosive hit *replaces* a separate 1× direct hit, preventing 4× accidental double damage. Boss direct turret impact retains the existing weak-point mechanics; nearby non-direct Bosses take a single hull explosion hit.
- **Safety:** an orange bullet can explode only once. Nearby targets receive one 3× explosion damage event each; no secondary chain, and children spawned by a splitter's destruction are never hit by their parent's explosion. Shields absorb area damage through the established shield rules; Boss kills and score flow through the original combat functions.
- **Visuals:** the hot-orange detonation expands to the same radius 100 and fades over 0.35 seconds, without any drawing-time damage. No more than 48 orange blast FX can remain live at once. Bullets, pickups and the HUD are orange and visually distinct; HUD: `ORANGE BLAST  R100  X3`.
- **Cadence and independence:** ORANGE uses the starting twin-bullet shooting cadence and base damage at all general weapon levels. Switching colors does not erase already-fired orange bullets. Other nine P colors, including PINK's 10% homing missile and GREEN's passive halo, retain their existing effects. All ten P pickups appear in the normal drop pool with equal conditional P-color odds.

## v26.7.2 — PINK P missile chance increased to 10%

PINK P now rolls a **10% independent chance per firing action** to launch its additional black homing missile, increased from 5%. The chance is evaluated once for each single-bullet firing action (not on projectile hit or per frame). Each successful roll fires one extra missile, subject to the existing 48-missile pool cap.

The rest of the PINK P weapon is unchanged: one guided ordinary projectile per firing action, 0.4-second rest after two actions, **10× direct missile damage**, black 100-game-unit special missile body, and a 360-radius pink blast dealing **1× ordinary bullet damage** to nearby other targets. The on-screen HUD now displays `PINK SEEK  2/.4S  10%x10`. Other weapon types are unaffected.

## v26.7.1 — PINK P black 100-unit rocket with 360-radius blast

The 5% PINK P special missile remains a guided 10× direct-damage attack, but the special now has a **black 100 × 100 logical-unit silhouette** (and 100 logical-unit circular collision diameter), visibly outlined in hot pink against the dark playfield. YELLOW missiles remain unchanged.

- **On each direct missile impact:** immediately spawn a large **pink explosion centered on impact**, with the **exact 360 logical-unit radius of GREEN P's halo**, using GREEN's existing enemy-circle and Boss-hull collision geometry.
- **Damage:** the directly struck enemy (including shielded enemies), Boss hull or Boss turret still takes the original **10× PINK bullet damage** and is explicitly excluded from explosion damage. Every other living enemy intersecting the explosion receives **exactly one ordinary PINK bullet's 1× damage**. A nearby Boss can also take one 1× explosion hull hit if it was *not* the direct missile victim. Original shields, kill rewards and Overdrive/ship scaling all remain in effect.
- **Non-propagating:** the explosion does not bounce or chain, nor may it damage newly spawned splitter children. A one-shot nearby-target snapshot is taken before direct-hit damage. Secondary victims cannot trigger further explosions.
- **Visual effects:** a bright pink bloom with quickly expanding rings to radius 360 fades over 0.55 seconds. A dedicated pool holds at most 12 simultaneously active explosions, with expiry on the active gameplay clock. Drawing is cosmetic only; damage happens once at detonation.
- **Preserved:** PINK retains one tracking bullet per shot, a 0.4-second rest after every two shots, a 5% special-missile chance, tenfold direct missile damage, and homing after weapon switching.

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
