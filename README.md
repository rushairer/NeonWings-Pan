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



## v26.27.0 — 红蓝渐变五向追踪 / 五角星天降（第29把武器）

- 新增 `P_RED_BLUE` 红蓝渐变 STARFALL SEEK，**只能从黄色、普通红色升级**，也支持同色再次拾取；其它武器无法拾取。
- 每 **1 秒**向前方 -60°、-30°、0°、+30°、+60° 五个方向各发射一枚 **1.15 基础伤害**子弹；自玩家发射时位置算起走到 **360 坐标**后开始追踪敌人/Boss，追踪速度 940、最长 3.6 秒。转追踪之前为不造成接触伤害的展开段，避免弹幕从原点产生意外叠伤。
- 每次五弹齐射独立有 **10% 概率**启动大招（同红色系概率），大招期间不与其它红色系大招重叠。一个红蓝色五角星从天而降（0.8 秒），落地瞬间对当前场景**全部存活敌机与 Boss 各造成一次基础攻击 10 倍伤害**（基础 11.5，按当前飞机/Overdrive 放大，复用护盾、Boss、击杀和分裂结算）。
- 五角星落点以 1° 间隔整整发出 **360 枚特殊弹**（0–359° 全圆，0.38 原始基础伤害/发），各自飞离大招落点 **360 坐标**之后转入最长 3.6 秒的追踪攻击，使用独立有界弹池，普通 360 子弹数量限制不会截断完整一圈。弹幕本身不是额外10倍。
- 共享唯一 `game.redWeapon.stars` 五星系统：红、红白、红橙与红蓝均共用已有星数、攻击被击中的扣星规则；大招五角星落地完成时升一星（最多 5），切换武器不会清零，红色其它三把大招不被重写。
- 扫掠命中、防盾、Boss 部件、多人场全屏10倍结算、抽奖与多发性能、武器选择/拾取权限、暂停、HUD、Pages 部署、缓存与工程文档均有专用回归测试。
- 当前版本为 **26.27.0**，以下为历史版本改动记录。

## v26.26.0 — 紫白渐变五束激光增加强制停火窗口

- **紫白渐变 PENTA LOCK**：发射累计满 **5 秒**后必须**停火 1 秒**，即 5 秒攻击 / 1 秒冷却循环；冷却结束后仍按住 FIRE 会自动恢复五束锁定。
- 仅实际按住 FIRE 且能锁定有效敌人时累计发射时间；松开 FIRE、短暂停火、切换武器再切回来不会清空已消耗的发射额度，避免通过反复点击绕过限制。冷却期不能发射/造成伤害，激光全部消失，HUD 显示 `PENTA COOL` 倒计时。
- 仅限紫白渐变。单束仍是 1.15 基础伤害、沿用棕色的 **0.101 秒**伤害节拍、最多 5 束、多目标覆盖优先和单体汇聚倍率；棕色、棕黄渐变和 ARC LASER 攻击节奏不改。
- 冷却遵循活跃战斗时间；暂停／关卡过渡／Boss 奖励期间冻结。冷却在切换到其他武器后仍可以自然结束；新的一局/练习局重新计时。
- 版本 **26.26.0**：完整同步主页面、所有带版本的脚本 URL、规则、HUD、回归测试和工程文档。以下历史版本保留供回顾。

## v26.25.0 — 黄绿色环绕子弹到期转追踪

- 黄绿色 LIME 子弹保留 0.48 秒向外螺旋加速至半径 360、绕玩家运动以及原始 3.2 秒环绕寿命；在环绕**最后一段**仍有正常碰撞机会，未命中的才转化为**同一枚**亮黄绿色追踪子弹。
- 追踪模式自动锁定最近的存活敌机或 Boss；目标消失时重新锁定，暂时没有目标则按环绕结束的切线方向飞行。追踪速度 940 游戏坐标/秒、最长持续 3.6 个活跃战斗秒；到期或首次命中销毁，不会无限积累。
- 追踪阶段仍是 1.15 基础伤害的单次命中普通子弹，不会额外生成导弹/爆炸；保留初始战机/Overdrive 加成、护盾与 Boss 炮台优先级。已发射的子弹切换 P 也保持该行为。
- 彩色 RAINBOW 随机到的黄绿色环绕子弹同样继承本效果；原随机抽取概率不变。暂停与非战斗状态不推进子弹寿命；大帧间隔按剩余时间衔接两阶段并保持扫掠碰撞。
- **当前版本 26.25.0**，已刷新相关浏览器脚本缓存版本及自动化测试；下面旧版本记录仅用于回顾历史。

## v26.24.0 — 武器数值调整

- 黑红震荡波：每 **0.1 秒**发射一波，原为 0.55 秒，保留最大 12 波限制。
- 彩色随机武器：每 **0.15 秒**随机发射一发（或被 9% 导弹替代），原为 0.4 秒，抽取概率不变。
- 橙色来源的爆炸倍率统一从 3× 调整为 **1.6×**：橙色、红橙渐变的普通子弹和 250 发大招、深红金色、彩色随机橙色弹。基础普通弹每目标 1.84；红橙大招每目标 0.608，半径依然为 100。粉色／深红导弹倍率不变。
- 当前平衡规则以本节为准，下文保留历史版本参数记录。

## v26.23.0 — DARK RED-GOLD 深红金色击退爆炸武器

新增第 **28 种 P 武器：DARK RED-GOLD（深红→金色渐变）**。只有**当前正在使用普通深红色 DARK RED P** 时才能拾取升级；已经装备 DARK RED-GOLD 可以重复拾取恢复等级。普通红、橙色、深红黑 ECLIPSE 等均不能直接领取；不能领取时掉落物不会消失，也不改变当前武器、得分与武器等级。

**双发爆炸子弹**：继承深红色的普通双发弹道与基础攻击（y-10 / y+12，弹速 1100、基础单发伤害 1.15、约每 0.101 秒一轮），但使用橙色的真实 **100 游戏坐标半径爆炸**。每枚弹命中其路径上的第一个敌人、Boss 炮台或本体时立即爆炸，对直接命中者和范围内其他有效目标分别造成该弹攻击力的 **3 倍**，即未强化下 **3.45 点/目标**；并继续使用所选飞机、Overdrive、护盾及 Boss 弱点等已有结算。

**命中击退 40 坐标**：本次爆炸的伤害与目标名单先按撞击瞬间坐标结算，然后只有**直接命中且仍存活**的敌人才向子弹飞行方向移动 **40 游戏坐标**；爆炸波及但并非直接撞上的其他敌人只受到范围伤害，不额外击退。Boss 被直接命中时可以在其可移动边界内击退，并同步移动 Boss 脚本位置锚点，不会下一帧瞬间弹回。死去的敌人或它刚分裂产生的子代均不会被同一弹丸额外推走或重复受伤。

**新武器只包含指定的击退＋爆炸组合**：普通深红色 DARK RED 自身独有的 50% 多次命中、最高 30 次连锁，以及每轮 5% 额外 10 倍追踪导弹仍保留在原深红武器中；新深红金色武器不会无意把这两套额外伤害机制叠加到每次爆炸上。独立红色 RED 的五星机制也不受影响。

外观采用独立深红和金色渐变的 P、飞弹及爆炸光环。**已经发射的深红金色爆炸弹即使切换武器仍按原弹种命中和击退**；爆炸特效按发射时的弹药标记配色，不会变成普通橙色。保留原橙色的 48 个爆炸特效上限与 0.35 秒时长，并纳入 **28 种 P 等概率掉落池**。

**在线体验：** https://rushairer.github.io/NeonWings-Pan/?v=26.23.0

## v26.22.0 — BLUE-BLACK 蓝黑渐变极限减速武器

新增第 **27 种 P 武器：BLUE-BLACK DEEP FREEZE（蓝色→黑色渐变）**。必须**当前正在使用普通黑色 BLACK P** 才能拾取进化；已装备 BLUE-BLACK 可以再次拾取同类升级或找回掉落。普通蓝色、彩色、浅蓝色自适应武器等均不能直接领取；未满足条件时物品不会消失，不增加分数或等级，提示 `REQUIRES BLACK P`。

**完整继承黑色武器的双发子弹数量、初始伤害和开火速度**：每轮两枚 1.15 基础攻击力的子弹，位置分别为机头 Y-10 / Y+12，速度 1100，每 0.101 秒一轮。敌人的正面护盾吸收子弹、Boss 炮台或机体被命中，都会正常触发减速。

**强化减速：命中目标后移动速度和攻击速度同时降低 90%（只剩原速 10%）**，持续 **5 秒**。这包括普通敌人的运动、瞄准射击间隔和航母护卫机发射间隔，以及 Boss 移动、开火和阶段推进。已有敌方子弹的速度不受影响。重复命中刷新 5 秒，不叠加多个独立减速层；原普通黑色武器依然是减少 **50%**，持续 5 秒。目标已经受到 90% 减速时，普通黑色（包括彩色/浅蓝自适应模拟的黑色减速）再次命中，只刷新持续时间，不会意外削弱效果；5 秒耗尽后恢复正常，后续普通黑色命中仍为 50%。

已经射出的蓝黑子弹在玩家切换武器后仍携带 90% 减速标记。暂停、过场、奖励和 STASIS 全体冻结不推进减速时钟；GRAY 击晕期间也不能运动或攻击，但剩余减速秒数按真实战斗时间减少。战机/Overdrive 对普通攻击的原有倍率与 Boss、护盾伤害处理不变。

视觉上新增蓝黑渐变 P 图标、蓝黑渐变子弹，以及目标身体外围的**蓝黑双色减速光环**（普通黑色仍使用原来的蓝色光环）。HUD 显示 `BLUE-BLACK SLOW 90% / 5S`，加入 **27 种 P 等概率掉落池**及掉血后的对应 P 掉落找回。

**版本：** `v26.22.0`。在线体验：https://rushairer.github.io/NeonWings-Pan/?v=26.22.0

## v26.21.0 — PURPLE-WHITE 紫白渐变五重锁定激光

新增第 **26 种 P 武器：PURPLE-WHITE PENTA LOCK（紫色→白色渐变）**。只能在**当前使用普通紫色 PURPLE P 或普通棕色 BROWN P** 时拾取；已装备 PURPLE-WHITE 时再次拾取可正常升级和恢复。普通白色、黄色、棕黄折射、浅蓝白导电激光等其他武器无法直接获得；未满足前置条件时拾取物不会消失，也不改变得分、等级或武器射击状态。

**五条独立紫白渐变激光**：持续按住开火，五条光束从战机前方不同发射口自动锁定前方的有效敌人/Boss 炮台；每条均沿用棕色激光的前方目标、最大 **1300 游戏坐标**射程、途中首个碰撞物阻挡（不会穿透）、**每 0.101 秒造成一次普通 1.15 基础伤害**。不生成额外物理子弹或导弹，沿用原棕色激光的一套连续开火计时器。

**多目标优先，目标少时火力汇聚**：最多优先命中 5 个不同的有效目标；只有 1 个时，5 条光束全部锁定它，合计造成 **5 × 1.15 = 5.75 点基础伤害/次**；有 2 个时优先各分配 3、2 条，分别造成 **3.45、2.30 点/次**；有 3 个时优先 2、2、1 条，有 4 个时 2、1、1、1 条，5 个及以上时尽量分给 5 个不同目标。只有当前方向真正可见且无遮挡的目标才有资格获得一条锁定；若后方目标被敌人遮挡，光束不会穿透过去凑足 5 个目标。伤害值继续按所选战机、Overdrive 加成。每个目标一轮只结算一次合并伤害，**不会把 5 倍汇聚再额外乘 5 变成 25 倍**。

对正面护盾、Boss 弱点炮台、Boss 机体及分裂敌人，都保留已有的击中处理和得分规则；Boss 炮台可独立分配光束，但同一 Boss 本体不会在一轮内重复结算。当某个目标死亡时，剩余光束可以重新分配给其他目标；暂停、过场、松开开火和切换武器时停止对应的持续攻击。原紫色扇形子弹、棕色单束激光、棕黄折射激光与浅蓝白导电激光均保持原效果。

新增紫白渐变 P、五路紫白渐变能量光束和 `PENTA LOCK 5 BEAMS` HUD，并加入 **26 种 P 等概率掉落池**；25 个以内的最近候选目标和实际绘制的五条光束均有限制，防止密集敌群下的目标选择与视觉特效数量无界增长。

**版本：** `v26.21.0`。在线体验：https://rushairer.github.io/NeonWings-Pan/?v=26.21.0

## v26.20.0 — BROWN-YELLOW 棕黄渐变折射锁定激光

新增第 **25 种 P 武器：BROWN-YELLOW REFRACT LASER（棕色→黄色渐变）**。**只能在当前装备棕色 BROWN P 时获得**（已装备 BROWN-YELLOW 可重复拾取恢复/升级）；普通黄色、浅蓝白 ARC LASER 等其他武器都不允许直接拾取。无资格拾取时 P 不消失、不加分、不换武器，并显示提示「REQUIRES BROWN P」。

**完全继承原棕色激光：**持续按住开火、自动锁定前方最近有效敌人（包含 Boss 炮台或机体）、原始射线只击中第一个阻挡物而不穿透、每 **0.101 秒**结算一次伤害，单次 **1.15 基础伤害**，单段最大射程 **1300 游戏坐标**。武器不发射任何普通子弹；战机及 Overdrive 伤害系数、护盾、击杀积分和 Boss 弱点判定保持原样。

**新增一次折射：**激光首次命中敌人或 Boss 后，会从其**实际命中点**折向范围内**最近的另一个有效目标**（普通敌人或 Boss，包含未被破坏的炮台）。折射线段可以转向屏幕上下左右；最大长度也是 1300，并保留棕色激光的首个遮挡物判定。**折射段仅命中一个不同目标一次**，造成与第一段相同的 1.15 基础伤害（不衰减）；不会继续第三段，也不会对同一敌人或同一个 Boss 的机体/炮台重复伤害。只有一个敌人时只显示第一段激光。原棕色武器仍完全不折射；浅蓝白 ARC LASER 原有的穿透、导电效果也不改变。

释放开火、切换 P、没有有效目标时立即关闭折射激光；暂停、过场、奖励等非正常战斗状态不推进激光伤害计时。新增棕黄渐变拾取物、两段棕黄到金黄色的折线光束和专属 HUD 提示 `REFRACT LASER  1 HOP`；绘制时绝不进行伤害结算。**25 种 P 继续等概率掉落**，包括掉血降级后的本武器 P 恢复。

**在线体验：** https://rushairer.github.io/NeonWings-Pan/?v=26.20.0

## v26.19.0 — RED-ORANGE 红橙渐变爆炸散射武器

新增第 **24 种 P 武器：RED-ORANGE BLAST SCATTER（红色→橙色渐变）**。只有当前正在使用普通红色 RED P 或普通橙色 ORANGE P 时才能拾取；已装备 RED-ORANGE 时重新拾取可以升级/恢复。其他武器（包括 RED-WHITE 红白渐变）不能直接领取红橙 P，物品保持在场上，并提示需要普通红色或橙色 P。

**红色、红白渐变、红橙渐变三种武器共用同一套五星进度**，而不是三套独立星级。红橙沿用 RED 的双发平行弹道，每 0.1 秒一次，连续 `5＋星级` 次双发后休息 0.4 秒，每次双发有独立 10% 概率触发散射大招。大招在 **3 秒内射出 250 枚弹**（±10° 扇角），完整结束后升一颗共享星，最多五星。切换武器后当前大招保持开始时的弹种和剩余进度，完成后正常升星；普通 BOMB 不会直接升星。

**每颗红橙普通子弹和散射大招子弹都变成真正的橙色爆炸弹**：命中首个敌人、Boss 机体或炮台后产生半径 **100 游戏坐标**的爆炸，直接命中者及范围内每个其他目标各造成**该子弹普通直击攻击力的 3 倍**（不是 1＋3 倍）。普通双发子弹基准伤害 1.15，所以爆炸为 **3.45 点/目标**；大招遵循 RED 特殊弹原基础攻击力 0.38，所以爆炸为 **1.14 点/目标**。战机和 Overdrive 加成仍按原攻击力管线计算。护盾、Boss 弱点优先级、分裂敌人子代保护以及爆炸不连锁等全部复用原 ORANGE 机制。

三种红系大招的弹药在触发瞬间锁定：RED 仍发原红弹，RED-WHITE 发白色穿透导电弹，RED-ORANGE 发橙色爆炸弹；切换后不会中途变色。RED / RED-WHITE / RED-ORANGE 都显示同一排共享星级，普通 WHITE/ORANGE/其他武器隐藏星级但保持状态。原始红、橙、红白子弹及击中效果不变。

红橙渐变 P 与子弹有独立外观，并加入 **24 种 P 等概率掉落池**；爆炸特效仍限制为 48 个在场实例，普通子弹沿用 360 枚上限，避免高密度大招效果无限堆积。

**在线体验：** https://rushairer.github.io/NeonWings-Pan/?v=26.19.0

## v26.18.0 — 红灰渐变 GRAY FLAME 灼烧 P 武器

新增第 **23 种 P 武器：GRAY FLAME（红色→灰色渐变）**。**必须当前装备灰色 GRAY P** 才能拾取变成 GRAY FLAME；已装备 GRAY FLAME 时可以再次拾取。其他武器无法领取，掉落物保持在原地，不改变分数、等级或灰色武器攻击节奏。

普通攻击完全继承灰色：固定双发 1.15 基础伤害，每 5 次双发后休息 0.4 秒；实际命中独立产生原有三选一效果（20% 击退 100 游戏坐标、5% 击晕 0.5 秒、75% 造成原攻击的 1.5 倍伤害）。

**新增火焰**：每次真实的 GRAY FLAME 子弹命中后，再独立判定 **20% 概率**使仍然存活的原目标燃烧。火焰附着于敌人，**持续 5 秒**，从点燃起**每 0.5 秒造成一次原普通子弹伤害的 0.6 倍**（未强化：1.15 × 0.6 = **0.69 点/次**，满 5 秒共 **10 次、6.9 点**）。高级灰色伤害那一击的 1.5 倍不传递给火焰；战机/Overdrive 的原始射击倍率保留。点燃没有立即额外伤害，重复点燃刷新持续时间且不会叠加多个燃烧层，保留较强的一次伤害。原灰色武器不会自己产生火焰。

燃烧遵守游戏正常护盾、Boss 弱点及击杀记分；命中 Boss 炮台时火焰只附在那个炮台上，炮台被摧毁后不跳转机体。暂停、过场、奖励页面和 STASIS 全场冻结期间暂停计时，切换武器后已经附着的火焰继续有效。敌人身上显示红橙火焰和灼烧剩余时间。23 种 P 在掉落池中等概率出现。

**在线体验：** https://rushairer.github.io/NeonWings-Pan/?v=26.18.0

## v26.17.0 — RED-WHITE FUSION 红白渐变导电散射武器

新增第 **22** 种 P 武器：**RED-WHITE ARC SCATTER（红色→白色渐变）**，只有**当前正在使用红色 RED P 或白色 WHITE P**时才能拾取变成该武器；已经装备 RED-WHITE 时再次拾取可正常升级或恢复。其他武器无法领取，掉落仍留在场上，不增加分数或等级，仅提示需要红色或白色 P。

- **弹幕发射数量与节奏完全继承红色 RED P**：每轮双发平行子弹，连续 `5＋星级` 轮（每轮间隔 `0.1 秒`）后休息 `0.4 秒`。红色与红白渐变**共用同一星级，最多五星**；不是两套独立星级。
- **每一枚子弹都变成白色 WHITE P 的真实穿透导电子弹**：直击原有伤害，穿透并可命中多个敌人；命中后以 360 范围产生第一跳导电，第二跳有 50% 概率，第三跳为第二跳成功后的 10% 概率；连锁伤害为该枚子弹伤害的 60%。每颗子弹独立命中记录，单颗子弹不会重复伤害同一敌人或 Boss。BOSS 弱点及护盾沿用原伤害管线。
- **红色散射大招也继承**：每轮 10% 触发概率，大招在 3 秒内射出 **250 枚白色穿透导电子弹**，使用原 RED 大招的 ±10° 扇角、弹速和 0.38 基础攻击力。大招完成时共享星级＋1（最多五星），并非按 BOMB 即刻升星。大招启动后即使切换回 RED/WHITE/其他武器，已启动的弹幕仍保持启动时的类型，大招照常完成并升级同一个星级。
- RED 或 RED-WHITE 装备时会显示同一排五星 HUD；普通 WHITE/其他武器不会显示 RED 星级，但星级保持。角色正常受到 HP 伤害时仍扣一颗共享星级（有星级时）。
- 新增红白渐变 P 外观以及 22 种 P 的等概率掉落，并保留原 RED 和 WHITE 的全部普通武器效果。

版本：`v26.17.0`。体验：https://rushairer.github.io/NeonWings-Pan/?v=26.17.0

## v26.16.0 — SOLAR AURA 红→黄渐变光环

新增第 **21** 种 P 武器：**SOLAR AURA（红色→黄色渐变）**。这是绿色武器 GREEN P 的专属进化。必须**当前装备 GREEN P**，才能拾取地图上的 `P_SOLAR`，并变成红黄光环；已装备 SOLAR 时重新拾取同款可继续升级等级或恢复。其他武器（包含 RED/YELLOW）无法直接领取，P 掉落物不会消失，也不会改变得分或等级，只提示「REQUIRES GREEN P」。

光环持续环绕战机、无需按住开火，**攻击半径 360 游戏坐标**（包括碰到圈缘的敌人）；每次脉冲**对圈内每个敌人/Boss 造成 2 点基础伤害**，严格**每 0.1 秒一次**：连续站在范围内，伤害为 **20 HP/秒/目标**，原 GREEN 仍为每 0.4 秒 2 点（5 HP/秒）。两种光环共用绿色的圆形敌人／Boss 矩形机体边缘检测、护盾及击杀结算，不会因为敌人进入范围才开始计时；换武器重置计时，暂停/过场暂停计时，重复拾取同种 SOLAR 不会重置计时。

SOLAR 的普通射击与 GREEN 保持一致：固定双发蓝色 1.15 基础伤害，每约 0.101 秒一次，不受 P 等级影响，也不会获得蓝色特殊穿透枪。红黄渐变光环只影响视觉效果，不会额外造成一笔绘制帧伤害。**21 种 P 均匀掉落**，并提供专属 HUD「SOLAR AURA 2 DMG/0.1S」。

**在线体验：** https://rushairer.github.io/NeonWings-Pan/?v=26.16.0

## v26.15.0 — ECLIPSE / RECRUIT 双渐变 P 武器

**第 19 种：ECLIPSE（黑→红）360°穿透震荡波。** 必须先使用深红色 DARK RED P，再拾取黑红渐变的 ECLIPSE P 才能装备。其他武器（包括普通 RED）即使撞到也无法领取，不会消耗拾取物或升级等级；装备 ECLIPSE 后可再次拾取同类 P。手动发射时不再生成深红色子弹或导弹，改为以飞机所在位置为圆心扩散一枚完整的 360 度震荡波，前后上下无射击盲区，**穿透所有普通敌人，每个目标每波最多受击一次**。以每秒 1600 游戏坐标向外扩散，覆盖半径最大 1500，按住开火每隔 0.55 秒生成新波。单波击中每个敌人造成一枚标准 P 子弹 1.15 倍基础伤害（继承战机与 Overdrive 原有倍率），沿用盾牌、击杀、Boss 炮台/机体结算；旧波切武器后仍继续，暂停时不前进。最多同时 12 波保护 FPS。

**第 20 种：RECRUIT（粉→蓝）转化友军。** 装备后普通攻击发射两枚粉蓝渐变子弹；被这些子弹击败的普通敌人会变成与原敌机外形相同、但颜色是粉蓝、标有 ALLY 的友军。装备此武器期间通过其他攻击或 BOMB 击杀普通敌人同样转换。已发射的粉蓝子弹切武器后依然可转化目标。友军以 **245 游戏坐标/秒向右移动**，每 0.65 秒向右发射友军子弹，能够伤害其它敌人及 Boss（炮台优先），击杀普通敌人也可触发继续转化。友军与其子弹属于独立阵营，**不会伤害玩家，也不会触发玩家碰撞**。最多同时 24 名友军，每名存活 10 游戏秒，友军子弹最多 120 枚、存活 2.1 秒，防止弹幕/内存失控。友军不随武器更换消失，会在完整 Boss 战结束与换关时清理；暂停冻结它们的移动与射击。

两种新增武器纳入 **20 种 P 平均概率掉落池**，遵守拾取门槛；新增渐变 P 图标、红黑波纹、粉蓝友军外观/炮火与 HUD 提示。此改动不修改其他十八种武器已有能力。

**Play:** https://rushairer.github.io/NeonWings-Pan/?v=26.15.0

## v26.14.0 — ARC LASER + STASIS 双渐变 P 武器

**第 17 种：ARC LASER（浅蓝→白）穿透导电激光。** 必须先装备棕色 BROWN P，然后拾取 ARC LASER 的浅蓝白 P 才能升级；使用其他武器碰到该 P 时不会消耗拾取物，仅提示 `REQUIRES BROWN P`。已装备 ARC LASER 时再拾取可正常升级武器等级。继承棕色激光的自动锁定方向、1300 游戏坐标射程和每 0.101 秒一次的伤害判定，但发射可穿透多个敌人的激光，射线上所有目标分别受 1.15 基础伤害。另继承白色 P 导电机制：周围未被同一光束击中的其他目标可受到 60% 二次电弧伤害；独立随机最多 3 跳。直击和连锁共享受击记录，不会重复击中同一目标；Boss 炮台优先于机体。棕色原激光仍不穿透。

**第 18 种：STASIS（黑→白）冻结 BOMB。** 平时发射双排普通子弹。装备此 P 后消耗一次真实 BOMB，正常保留原版清弹幕与范围伤害，同时让全部普通敌人和 Boss **冻结 3 秒**：期间完全无法移动、射击或释放护卫；所有现存敌弹立即消失，并阻止新敌弹生成。冻结期间新出现的敌人也会暂停行动。重复使用 STASIS BOMB 刷新 3 秒而非叠加。冻结在切换武器后持续，暂停、场景转换期间不消耗时间；画面显示冰白色冻结描边及剩余秒数。其他武器使用 BOMB 时不附加冻结。

**取得方式：**两种 P 均加入普通掉落池，18 种 P 平均概率；ARC LASER 的拾取受到 BROWN 装备门槛限制。升级受伤后的 P 恢复遵循原有掉落机制。

**版本：** `v26.14.0`，在线体验 https://rushairer.github.io/NeonWings-Pan/?v=26.14.0

## v26.13.0 — MAGNET P (红色→浅蓝色渐变 / 磁场)

The new **sixteenth P pickup** has a red-to-pale-blue gradient. It fires two ordinary 1.15-power gradient bolts at the original starter 0.101-second cadence, independent of weapon upgrades. Every REAL bullet impact on an enemy, shield or living Boss turret/hull rolls an independent **10% chance** to create a stationary magnetic field **at the actual first swept contact**, not at the player's location.

**Magnetic field radius = 360 game coordinates**, identical to GREEN's aura. For **2 active-combat seconds**, it attracts **all visible enemies anywhere on the screen**, including an active Boss, toward the closest active field at a base **100 game coordinates per second**. It replaces natural movement while active; existing BLACK slowdown and GRAY stun still apply. Bosses remain inside their targetable arena. Fields continue after weapon changes; pause and stage transitions freeze them. Up to eight simultaneous fields can exist, and attraction from overlapping fields never multiplies the stated speed.

Exactly when the field expires, let **N** be the number of living ordinary enemies whose circles intersect its radius, plus one if the Boss hull intersects. **Every target inside gets N × 0.6 × the triggering projectile's original scaled damage** (normal base 1.15; preserve fighter/Overdrive multiplier captured on firing). Example: three qualifying targets receive 3 × 0.6 × 1.15 = **2.07 damage each** before ordinary shielding. Outside enemies take zero field damage, even though they were pulled while the field was active. Bullet contact also deals its normal direct-hit damage. The field itself is one-shot: it does not trigger more fields, hit new splitter children, or repeat damage. Magnetic bursts are visual-only and bounded. Regular enemy kill/scoring/shield rules and Boss stages remain intact; the other fifteen P weapons are unchanged.

**Play:** https://rushairer.github.io/NeonWings-Pan/?v=26.13.0

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
