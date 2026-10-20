# NeonWings-Pan roadmap

Independently maintained from NeonWings commit `5ebcb1de1adb288b41a3c5e387f747bc49271c19`.

- [x] Import baseline source, tests and static build
- [x] Rename project and isolate browser storage
- [x] Configure standalone Pages workflow
- [ ] Verify site deployment and controller tests on hardware



## v26.28.0 — 红蓝全圆弹幕性能与交互收口

- [x] 360 发五角星特殊弹由逐弹 2 次 rect + 每弹 save/translate/rotate 改为按飞行阶段+颜色层批量 Canvas 描边，保持红蓝发光辨识（无每发单独光晕）
- [x] 仅离屏渲染裁剪，不丢失弹丸追踪/命中或星级
- [x] 消除 Red-Blue 每弹的扫掠数组/内层闭包，战斗中复用临时缓冲、惰性构造真实命中数据并原地移除失效弹丸
- [x] 红蓝共享五星 HUD 显示独立 1.0s 五向发射节奏，普通 RED/RED-WHITE/RED-ORANGE 的 5+星齐射/0.4s 冷却完全不变
- [x] 追加完整 360 绘制调用预算、离屏存续、最近命中/一次命中、复用接口、1800 弹 40 帧 Node 模拟性能回归和静态 CI 门禁
- [ ] 在真实掌机 Chrome/触屏 WebView 中实测 360/1800 弹时的 FPS、帧间抖动、发热与星形可读性；Node Mock Canvas 并不能代替 GPU/设备表现

## v26.27.0 — 红蓝 STARFALL SEEK（29th P）

- [x] P_RED_BLUE：仅黄色/普通红色/同色可拾取，原 28 色掉落槽不改位置，29 色新武器末尾加入
- [x] 每 1 秒五向散射（±60°、±30°、0°），各弹飞到距离发射时玩家位置 R360 后启动追踪
- [x] 共用唯一红色五星计数；10% 每次齐射触发五角星大招，禁止与已有红色大招重叠；落地完成后升星
- [x] 五角星 0.8 秒从屏幕上方降落，落地对全场每个当时存活敌人与 Boss 结算 10× 一次伤害，防止波及新生分裂子机
- [x] 落点每一度发射一枚共 360 枚特殊弹，R360 展开后各自转向追踪，保持一击回收、全角度、独立有界弹池和已有其它弹丸限额
- [x] 彩色图标/弹丸/大招 Canvas 特效、共享五星 HUD、29 种掉落测试、Node/浏览器回归测试、静态构建/Pages 缓存刷新
- [ ] 实机验证掌机同屏 360 枚追踪弹的 FPS 和特效可读性

## v26.26.0 — PURPLE-WHITE 5 秒发射 / 1 秒停火

- [x] 仅紫白渐变 PENTA LOCK 新增发射负载状态：真正锁定敌人并持续按 FIRE 的时间累计 5.0 个活跃战斗秒，然后强制停火 1.0 个活跃战斗秒
- [x] 强制冷却期 5 条激光全部隐藏、不得命中/造成伤害；HUD 展示冷却剩余秒数；持续 FIRE 自动恢复下一轮 5 秒
- [x] 继续复用 BROWN 0.101 秒真实伤害节拍，保持 5 条光束、多目标锁定/汇聚、原始伤害、弱点和护盾行为；进入冷却时清空 Brown 小数节拍，下一轮重新完整计时
- [x] 松开 FIRE 不会清零已经消耗的发射时间；强制冷却在活跃战斗中持续，无目标或松开 FIRE 不产生额外发射热量；切换武器不重置进度且后台继续冷却
- [x] 暂停、过场、Boss 奖励期不推进定时器；重新开局/练习局重置；棕色、棕黄渐变、浅蓝白 ARC LASER 不受影响
- [x] 为边界大 dt、发射中断、切枪、无目标、真实 HUD、无渲染伤害补充单元/集成回归测试；更新脚本缓存版本
- [ ] 掌机真实浏览器实测冷却提示视觉可读性和手感

## v26.25.0 — LIME 环绕→追踪弹

- [x] 先按原有 3.2s 在玩家 360 半径内螺旋环绕，最后扫掠命中优先处理
- [x] 未命中则将原子弹转换为自动追踪目标的黄绿色弹丸，速度 940，追踪寿命 3.6s，保持 1.15 基础伤害
- [x] 目标消失/没有敌人时安全转向或继续惯性飞行，支持 Boss 炮台、护盾、已射弹武器切换及 RAINBOW 随机环绕弹
- [x] 追踪阶段保持原先 P 弹上限豁免，但用 3.6 秒 TTL 回收；最后环绕扫掠判定/大帧剩余时间/暂停时间均有回归测试
- [x] 更新 HUD、子弹可视化、README/AGENTS、静态构建版本 26.25.0
- [ ] 真机检验满屏追踪弹的 FPS 和目标识别度

## v26.24.0 — 武器平衡

- [x] ECLIPSE 发射间隔 0.1 秒；保持 12 波上限
- [x] RAINBOW 发射间隔 0.15 秒；抽取概率及单发机制不变
- [x] ORANGE 共同倍率 1.6× 覆盖普通橙、红橙普通与大招、深红金、彩色橙色弹
- [x] 更新 HUD、测试和 Pages 缓存脚本版本
- [ ] 真实浏览器/掌机验证高频震荡波帧率

## v26.23.0 — DARK RED-GOLD 40-unit knockback plus ORANGE blasts

- [x] Add 28th uniform P drop: deep-red→gold gradient, collectible ONLY from currently equipped DARK RED or the same fusion, with nonconsuming ineligible pickup
- [x] Keep DARK RED starter 2 bullets (y-10,+12, 1100 speed, 1.15 base) at 0.101s and convert into actual ORANGE first-swept-contact 100-radius 3x nonrecursive explosions
- [x] Push only the DIRECT original surviving hit victim 40 units after resolving snapshot blast; keep splash victims in place, handle Boss scripted targetX and bounds, don't move dead/just-spawned targets
- [x] Keep original DARK RED 30-hit 50% repeat and 5% 10x missile exclusive to DARK RED; new fusion has only knockback+explosion, preventing unrequested chained explosions
- [x] Retain ORANGE original 48-effect .35s cap; deep red/gold event provenance after weapon swaps, FX-only drawing, no gameplay mutations
- [x] Add P pickup/recovery, projectile, HUD, all-28 drop probabilities, updated build/cache/doc version and exhaustive hit/shield/Boss/Overdrive/splitter/visual/compatibility tests
- [ ] Manually assess readability of crimson/gold bursts and crowded-wave FPS on real browser and handheld

## v26.22.0 — BLUE-BLACK gradient 90% slowing shots

- [x] Add 27th collectible BLUE-to-BLACK P as an upgrade available exclusively from ordinary BLACK (or repeat BLUE-BLACK), with persistent rejected drops and safe pickup/recovery mapping
- [x] Preserve original BLACK dual 1.15 starter-damage bullets, normal 0.101s firing cycle, true hit/shield/Boss weakpoint logic while tagging new bullets for 90% slow
- [x] Apply a five-second nonstacking 0.1x movement AND attack time scale using a backwards-compatible shared BLACK status. Original BLACK/SKY/Rainbow keep 0.5x reduction
- [x] Give strongest existing 90% slow precedence over subsequent weaker normal BLACK hits; refresh five-second duration, expire precisely with midframe normal-speed remainder
- [x] Keep GRAY stun/STASIS freeze and pause/transition compatibility, independent Boss/escort firing timers and launched enemy bullets, preserve on-hit bullet effect after changing P
- [x] Render blue-black P, blue-black projectile gradients and stronger target/Boss rings without combat-side rendering effects; preserve original blue glow
- [x] Version both changed BLACK module and new BLUE-BLACK browser module, static build/test VM and 27-way uniform P drops
- [ ] Manually assess glow readability and extreme slowdown timing in browser/handheld

## v26.21.0 — PURPLE-WHITE five-lock converging lasers

- [x] Add 26th P as a violet-to-white gradient, collectable only from PURPLE, BROWN or itself; rejected P remains without side effects
- [x] Inherit BROWN continuous hold-FIRE, first-obstruction laser, 0.101s interval, 1.15 base damage, 1300-unit range and zero projectiles
- [x] Make five visibly distinct beams prioritize five different visible targets; distribute spare channels fairly (one target 5x, two 3+2, three 2+2+1), aggregate damage once per victim
- [x] Reuse BROWN's one damage clock and normal shield/Boss turret/score/splitter/Overdrive pipeline, with reassignment on kill rather than extra beam clocks
- [x] Implement violet-white P and beams, 26 equal-probability P drops, loss/recovery, compact PENTA LOCK HUD and versioned Pages static build
- [x] Add pure matching/geometry, collision, protection, single-target/no-double-count, scarce-target, fighter, controller, render and crowded-field regression tests
- [ ] Visually check readability, multi-target lock switching and high-density FPS on actual browser/handheld

## v26.20.0 — BROWN-YELLOW one-hop refracted lock laser

- [x] Add 25th brown→yellow gradient P, collectible only while BROWN or the same fusion is currently equipped; rejected drops remain with no score/level/state side effects
- [x] Retain Brown hold-to-fire first-obstruction acquisition, zero bullet objects, original 0.101s/1.15 scaled hit and 1300-unit range per segment
- [x] On real first target contact, refract exactly once to nearest other live target (enemy or Boss), up to 1300 units from first contact; second segment also stops at its first obstruction with no piercing or recursive hits
- [x] Enforce original-target exclusion, Boss identity, shields, turret priority, kill/score and splitter liveness; reset on release/weapon swap, pause and transitions freeze the shared brown clock
- [x] Add brown/yellow P gradient, dual laser line visuals and compact HUD; update 25-way uniform drops, power-loss recovery, Pages version/cache/build and dedicated unit/integration regression tests
- [ ] Visually validate bent beams, Boss targeting and frame timing on physical handheld/browser

## v26.19.0 — RED-ORANGE shared-star exploding scatter

- [x] Add 24th P with red/orange gradient, exclusive RED or ORANGE predecessor (or same-P recollection), nonconsuming invalid pickups
- [x] Share exactly one RED star/volley/special state across RED, RED-WHITE and RED-ORANGE, including 5+stars double volleys then 0.4s rest and 10% special proc
- [x] Make each normal twin bullet and all 250 fan shots a genuine ORANGE 100-radius 3x first-contact explosive bullet, keeping RED 1.15 normal and 0.38 special base power
- [x] Preserve initial fan projectile type on weapon swaps, pause and transitions; only a completed three-second fan earns one shared star (max 5)
- [x] Reuse original ORANGE Boss/shield/turret handling, splitter snapshots, 48 visual effects and 360 normal-bullet cap without changing standalone RED/RED-WHITE/ORANGE
- [x] Implement new P/recovery/drop mapping, gradients, shared HUD, 24 equal P drops, versioned Pages and full Node/unit/combat/controller/build regressions
- [ ] Validate fan readability and late-wave FPS with real browser/handheld playtests

## v26.18.0 — GRAY FLAME P / red-gray burn

- [x] Add twenty-third P color with red-gray gradient, exclusive GRAY prerequisite and persistent rejected pickups
- [x] Preserve all three GRAY impact outcomes and the five-volley / 0.4-second burst timing
- [x] On real GRAY FLAME bullet hits, independently proc a 20% five-second attached burn, refresh rather than stack
- [x] Apply precisely ten 0.5-second burn ticks at 0.6x original scaled normal shot strength through normal shields, scores and Boss turret/hull damage
- [x] Persist burns across weapon swaps and freeze clocks during pause/transition/STASIS; stop on death, stage and turret destruction
- [x] Include procedural red-orange flames, red-gray gradient bolts/pickups, 23-way P drops and regression tests
- [ ] Verify mixed fire/stun visuals, handheld FPS, and gameplay balance on real hardware

## v26.17.0 — RED-WHITE P shared stars + conductive RED fan

- [x] Add 22nd RED→WHITE gradient P that can be collected only while RED or WHITE or already this fusion is currently equipped; rejected drops remain in world
- [x] Preserve RED's twin parallel bullets, 0.1s volley timing, rest after 5+star volleys for 0.4s, and one independent 10% 250-shot/3s fan opportunity per volley
- [x] Swap fusion's ordinary and 250 fan projectiles to WHITE's penetrating 360-radius multi-hop electricity with unique per-projectile victim ledgers, same original RED shot powers and angles
- [x] Maintain ONE shared RED star state and max-five progression: RED special completion or FUSION electric special completion upgrades the same star counter; star HUD visible for both
- [x] Lock an active fan's projectile identity to its firing-time weapon, so switching P midfan never changes it; real HP loss still decrements stars
- [x] Cover RED/WHITE inheritance, Boss/parts/shields, drop fairness, pickup and loss/recovery, render/FX caps, controller/platform/browser versioning and static build
- [ ] Manual QA: 250 electric fan projectile readability and late-game FPS on handheld/browser

## v26.16.0 — SOLAR AURA red→yellow GREEN upgrade

- [x] Add the twenty-first P color with an accurate red-to-yellow gradient pickup and glowing radius-360 halo; GREEN P is the only unlock path (current GREEN or same SOLAR), with nonconsuming rejected pickups
- [x] Reuse GREEN's enemy circle and Boss hull geometry, 2 HP/pulse, shields, kills, and boss transitions; improve SOLAR pulse frequency to 0.1s (20 HP/s per in-range target), without modifying GREEN's 0.4s (5 HP/s)
- [x] Use the same two unupgraded ordinary bullets as GREEN at the same 0.101s cadence, independent of P level and BLUE Overdrive lance
- [x] Make global pulse time start at equip (even if halo is empty), pause/freeze across non-combat screens, reset on switching P, and preserve phase on same-SOLAR pickup
- [x] Include SOLAR in all 21 equal P drops, loss/recovery, HUD, asset cache version, build, AGENTS.md, release notes and comprehensive tests
- [ ] Confirm red-yellow ring readability and performance on the actual handheld/browser

## v26.15.0 — ECLIPSE shockwave / RECRUIT allied conversion

- [x] Add 19th BLACK→RED gradient ECLIPSE P, obtainable only while DARK RED or ECLIPSE is currently equipped; gated pickup remains in the field and has no side effects otherwise
- [x] Replace DARK RED bullets/missiles with 360° expanding piercing shockwave. Each ring uses exact full-circle swept collision (no directional gaps) at 1600 units/s up to 1500 radius, firing every 0.55s at 1.15 original scaled shot power
- [x] Multiple living enemies, frontal shields and a live Boss can be struck once each per wave, with normal score/kill/weakpoint mechanics, frozen in pause/transition and phase-safe
- [x] Add 20th PINK→BLUE gradient RECRUIT P with two starter bullets, converting defeated ordinary enemies into friendly units after normal kill/score/drop accounting
- [x] Friendly units fly toward screen RIGHT, attack to the RIGHT with their own target-safe projectiles, preserve recognizable enemy shapes and cannot harm the player
- [x] Bound allies, ally bullets, TTL and shockwave instances, update every pause/scene lifecycle, maintain P-swap behavior, 20-way drop equality, Pages version and automated tests
- [ ] Physical controller/browser playtest: full wave legibility and 24-ally late-wave FPS

## v26.14.0 — ARC LASER / STASIS P weapons

- [x] Add light-cyan-to-white piercing conductive laser P, equipped ONLY after collecting its pickup while BROWN is active (or replenishing while ARC LASER active)
- [x] Trace BROWN's lock direction through multiple targets up to 1300 logical units, retaining 0.101-second damage cadence; preserve BROWN's original first-hit-only behavior
- [x] Reuse WHITE's 60%-power multi-hop electric conductivity, premarking beam-direct targets to prevent weaker duplicate damage; respect Boss turret-versus-hull priority
- [x] Add black-to-white STASIS P with ordinary dual-shot fire and original BOMB damage, augmented by all-enemy/all-Boss 3-second freeze
- [x] Clear all enemy bullets when frozen, block any new ones, freeze movement/shoot/escort/phase clocks, and preserve the freeze after weapon switches
- [x] Add visual gradients, status text, freeze rings/counter, uniform 18-color P drops, asset version, build scripts and deterministic tests
- [ ] Verify on real handheld: beam visibility, BOMB freeze pacing and large-enemy-wave FPS

## v26.13.0 — MAGNET P gradient-field attraction

- [x] Add 16th uniform P color with red-to-pale-blue gradient pickup, bullets and HUD
- [x] On each real normal-shot enemy/shield/Boss contact roll independent 10% magnetic-field proc
- [x] Stationary radius-360 field (GREEN geometry), attracting all visible enemies + Bosses at baseline 100 logical units/s for 2 active seconds
- [x] Multiple overlapping fields choose nearest center without additive velocity; preserve GRAY stun, BLACK slow, Boss boundaries and scripted resume
- [x] When field expires, snapshot living targets within range, including at most one Boss hull; deal each N*0.6 of the original projectile's scaled damage with standard shields/Boss/score semantics
- [x] Cap active fields/burst FX at 8 each, use visual-only canvas effects and keep existing bullets/fields active after weapon swaps
- [x] Update distribution, browser asset cache version, node tests, and deployment build
- [ ] Confirm magnet readability, gameplay balance and FPS on AYANEO AIR MINI or real browser

## v26.12.1 — RAINBOW P single projectile per 0.4 seconds

- [x] Replace the prior 2-projectile / 0.101s volley with one centered shot every 0.4 active-combat seconds while firing is held
- [x] Apply identical pacing when the randomized projectile is a replacement PINK missile; retain all eight effect probabilities and inherited combat behavior
- [x] Preserve pause-safe cooldown, other weapon cadences, all 15 P drops and browser cache busting
- [x] Cover bullet/missile held-fire cadence, pause, one-projectile emission and all eight abilities with tests
- [ ] Verify balance and projectile readability on actual handheld/browser hardware

## v26.12.0 — RAINBOW P / eight randomly inherited projectile abilities

- [x] Add fifteenth multicolor P pickup with distinct eight-color rim, HUD and normal collectible/HP-dropped re-equip behavior
- [x] Keep two physical starter-rate projectile slots and independently select exactly ONE of eight original weapon modes per slot
- [x] Enforce 13% each for yellow homing, black slow, DARK RED chain, GRAY impact, WHITE penetration + conductivity, LIME orbit, ORANGE explosion
- [x] Enforce 9% PINK guided 100-unit missile instead of the corresponding bullet slot: 25× direct and 360-radius 1× splash
- [x] Reuse original 50%/30-hit DARK RED, GRAY 20/5/75, WHITE 3-hop, BLACK 5s/50%, ORANGE 100-radius 3× and LIME radius-360 logic directly
- [x] Draw each mixed projectile with its inherited weapon-style sprite; show faint orbital ring only when rainbow has active LIME-type orbits
- [x] Keep RED star UI restricted to original RED P; preserve regular YELLOW guided missiles, PINK 15% missile, and DARK RED 5% extra missile rules unchanged
- [x] Add explicit RNG boundary and 100k-roll distribution tests, plus combat coverage for every selected projectile type, shields, Boss and palette
- [ ] Manually inspect device FPS/visual readability with many concurrent mixed projectiles and verify controller gameplay

## v26.11.1 — DARK RED 50% repeat / 30 hits / 5% guided 10× rocket

- [x] Raise per-successful-landed-hit continuation chance from 10% to 50% with independent RNG on every extra 100%-strength hit
- [x] Increase HARD max from 10 to 30 TOTAL full-damage events per direct ordinary-bullet or special-rocket collision; STOP at original victim death or Boss mount break
- [x] Fire one BONUS homing missile on an independent 5% roll per TWO-bullet DARK RED firing action; never roll on hit or for every chained strike
- [x] Make rocket same radius-50 / 100 logical-unit homing physics and 360-range impact explosion as PINK, visually DARK RED
- [x] Set each direct rocket chain damage event to exactly 10× normal bullet power (1000%, before common fighter/Overdrive scale)
- [x] Keep 360-radius splash at one ordinary 1× hit to nearby OTHER targets, no splash chain, no direct-target double damage
- [x] Retain normal RED's stars/fan, PINK's own 15%/25× special, YELLOW missiles, shields, Boss weak points and 14-color P pool
- [x] Update browser cache versions, rules, HUD and deterministic unit/integration tests
- [ ] Manual gameplay pacing, Boss chain balance and performance on AYANEO AIR MINI

## v26.11.0 — DARK RED P / 10%-chance chained full damage

- [x] Implement separate fourteenth DARK RED P pickup and normal twin-shot loadout (baseline 1.15 power / 0.101s)
- [x] After a guaranteed real hit, independently roll a 10% chance for each additional 100%-strength damage hit on the same victim
- [x] Limit to 10 total hits per projectile (one initial, nine extra), iterative and bounded
- [x] Apply each hit through existing frontal shield, Boss weak point, scoring, kill and Overdrive damage logic
- [x] Stop on original enemy death, original turret destruction or Boss defeat; no target transfer or splitter-child damage
- [x] Preserve normal RED stars, fan projectiles and unique RED-only star HUD, including after weapon switching
- [x] Update 14-color P probability, pickup sprite, projectile FX, HUD, browser assets/build and versioned Pages entry
- [x] Add deterministic unit and combat integration tests for RNG boundaries, ten-hit cap, shields, turret-break penalty and flight persistence
- [ ] Manual hardware balance/FPS and visual validation for extremely rare long hit chains

## v26.10.0 — Live rollout: unlimited LIME, SKY adaptive, GRAY FX, RED-only stars

- [x] Remove LIME's 72-bullet ceiling and exclude orbiting bullets from the ordinary shared 360 projectile quota, keeping 3.2s TTL and one-hit removal
- [x] Add SKY as 13th P color (distinct icon, equal-share P drop, runtime asset, recoverable dropped weapon and HUD)
- [x] Read authoritative current `game.hp`: at 4+ HP, 2.5× ordinary SKY bullets; at <=3 HP, 1× seeking SKY bullets with BLACK's exact 5s/50% slow/blue-glow visual
- [x] Improve GRAY stun feedback with proportionate golden countdown, moving stars and STUN label for Bosses/enemies, preserving 5% chance and 0.5s timer
- [x] Hide RED star progress and RED special completion star toasts when another weapon is equipped, preserving red star state/ongoing fans
- [x] Version and copy SKY browser module, update every test fixture, and add health threshold, slow, Boss, orbit-limit, gray render and red HUD tests
- [ ] Check sustained unlimited orbit visual FPS and SKY/GRAY readability on AYANEO AIR MINI

## v26.9.2 — LIME full-revolution and cache-visible fix

- [x] Identify 32-bullet cap evicting real LIME shots after ~1.6 seconds during held FIRE
- [x] Increase LIME-specific concurrent projectile cap to 72 (>= 64 lifetime shots), preserving full 3.2s TTL
- [x] Cache-bust LIME runtime + game engine scripts with current version query
- [x] Test full-revolution survival under real held-FIRE game-loop simulation, 5-second steady firing, and versioned HTML
- [ ] Handheld real FPS test with up to ~64 active orbiting bullets and visual flight verification

## v26.9.1 — LIME P normal-bullet launch and smooth orbital trajectory

- [x] Replace instant radius-360 spawned satellite/dia­mond projectile with normal two-lane muzzle bullets
- [x] Retain normal bullet rendering, hitbox and damage while changing only the flight path
- [x] Curve smoothly outward from the muzzle onto radius-360 clockwise orbit over 0.48 active seconds
- [x] Follow the moving player continuously; subdivide both outward motion and circular flight for swept collisions
- [x] Retain 3.2s flight TTL, 32 orbiting-bullet cap, offscreen return, pause and in-flight weapon-switch behavior
- [x] Add unit and engine tests for no teleport/no instantaneous perimeter hit, normal sprite, shield/Boss and moving-center trajectory
- [ ] Real-device review of the curved trajectory, orbit readability and sustained FPS

## v26.9.0 — BROWN P targeting laser + LIME P orbital shots

- [x] Add BROWN P and LIME P as 11th/12th regular drop colors, with distinct sprites and HUD
- [x] BROWN P: hold FIRE for continuous auto-targeting laser; emit no ordinary bullets
- [x] BROWN laser locks a forward live enemy/Boss turret or hull, stops at first obstruction, never penetrates, deals base 1.15 per 0.101s active combat
- [x] LIME P: two orbiting bullets per shot at fixed radius 360 about moving player, 2.8 rad/s, 3.2s lifetime, 32-bullet cap
- [x] Orbit collision uses small arc segments and one victim per bullet; shield, Boss weak points and other P remain unaffected
- [x] Isolate lock targeting and orbital geometry into independent, testable browser/Node modules
- [x] Update HTML/Pages assets, agent invariants, drop odds, controller+combat fixtures and current release notes
- [ ] Real-device performance, beam tracking feel and orbit damage tuning

## v26.8.1 — PINK P 15% chance / 25× direct missile damage

- [x] Increase independent per-shot PINK homing missile chance from 10% to 15%
- [x] Increase the direct missile hit from 10× to 25× normal PINK bullet damage (28.75 unscaled)
- [x] Preserve radius-360 PINK blast damage at **1×** normal bullet strength, including fighter/Overdrive scaling
- [x] Preserve two shots then 0.4-second rest, 100-unit black missile, shielding, Boss turret priority and persistent in-flight specials
- [x] Test 0.149999 hit / 0.15 miss, deterministic 1500-per-10k distribution, 10%-15% unlocked band and 25×/1× split
- [x] Test directly impacted enemy and Boss, nearby shield, weapon swap, and all existing Orange/other weapon regressions
- [ ] Real-device difficulty balance and special-FX FPS review

## v26.8.0 — ORANGE P on-hit area blast

- [x] Add tenth ORANGE P pickup, two vivid orange baseline-grade shots, clear HUD and equal-share P drop routing
- [x] First swept collision detonates the bullet, with true 100-game-unit-radius blast and 3× regular bullet damage
- [x] Resolve the directly hit target through the blast damage without accidental extra 1× damage; preserve Boss turret priority and shield behavior
- [x] Sort enemy/Boss swept contacts by the earliest impact to avoid detonating behind closer targets
- [x] One event per target, no propagation and no damage to splitter children created during that same explosion
- [x] Short-lived orange fireball/ripple FX at radius 100 with a strict concurrent count cap of 48
- [x] Isolate geometry/rules in orange-weapon.js and cover both unit and combat integration regressions
- [ ] Check FX clarity, baseline damage balance and sustained FPS in real browser/AYANEO AIR MINI

## v26.7.2 — PINK missile launch probability 10%

- [x] Increase per-firing-action independent special homing missile probability from 5% to 10%
- [x] Preserve two-shot cadence and 0.4-second rest, black 100-unit missile, 10× direct hit and GREEN-sized pink splash
- [x] Update in-game weapon HUD and release documentation to match 10%
- [x] Lock 0.099999 triggers, 0.10 does not, plus the 0.05–0.10 newly unlocked probability range
- [x] Keep other colors' drop and damage rules unaffected

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
