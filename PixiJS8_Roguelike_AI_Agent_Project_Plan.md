# PixiJS v8 Roguelike — Project Plan for AI Agent

This document is a clean sequential implementation plan for building a 2D top-down arena roguelike in PixiJS. It intentionally does not include previous implementation notes, completed-state markers, or references to another engine's file structure.

---

## 0. Agent Operating Rules

### 0.1 Main rule: strict sequential implementation

The agent must follow this order:

1. Theme
2. Block
3. Task

Do not start a new task until the current task is implemented and verified.
Do not start a new block until all tasks in the current block are complete.
Do not start a new theme until all blocks in the current theme are complete.

### 0.2 Progress markers

Use these checkboxes:

- `[ ]` Not started
- `[~]` In progress
- `[x]` Completed and verified

When a task is completed, the agent must:

1. Mark the task as `[x]`.
2. Add a short implementation note only for the current task if it is useful for future continuation.
3. Mark the block as `[x]` only when all tasks inside it are `[x]`.
4. Mark the theme as `[x]` only when all blocks inside it are `[x]`.

### 0.3 Required start-of-session behavior

At the beginning of every implementation session:

1. Read the current plan.
2. Find the first theme that is not `[x]`.
3. Inside it, find the first block that is not `[x]`.
4. Inside it, find the first task that is not `[x]`.
5. Work only on that task unless the user explicitly says otherwise.
6. After implementation, run relevant checks and update progress markers.

### 0.4 Definition of Done

A task is complete only when:

- The code, entity factory, screen, typed config, UI, or configuration change is implemented.
- The project opens in PixiJS v8 without blocking errors.
- The game can enter the local dev server from the configured app entry point.
- There are no relevant TypeScript compile errors or runtime errors caused by the change.
- The change is small enough to review.
- The behavior matches the task description.
- The progress checkbox has been updated.

### 0.5 Preferred implementation style

Use a clean, modular PixiJS structure. Avoid putting the whole game into one massive class.

Recommended principles:

- Use entity factories or reusable view/component builders for entities and reusable gameplay objects.
- Use classs/components for single responsibilities.
- Use typed config objects for manually tunable gameplay data.
- Gameplay values must be stored in typed config objects or dedicated config classes, not hardcoded deep inside logic.
- Player skills, enemy stats, spawn rules, upgrade cards, and boss behavior must be easy to tune manually.
- Keep input, movement, combat, spawning, progression, UI, and visual indicators as separate concerns.
- Prefer explicit explicit constructor arguments, dependency injection, or system registries over fragile app-wide searches.
- Use TypeScript events, PixiJSEvents, or serialized callbacks where useful, but avoid a global event bus for everything.
- Prefer simple architecture first, then extend safely.

### 0.6 Suggested tech assumptions

Unless the project already defines otherwise, assume:

- Rendering library: PixiJS v8
- Language: TypeScript
- Build tooling: Vite or another lightweight bundler with a local dev server
- Game type: 2D top-down arena roguelike
- Input: keyboard + mouse/pointer events through browser APIs and PixiJS interaction/events
- Rendering: PixiJS `Application`, `Container`, `Sprite/Graphics visual`, `Graphics`, `Text`, and optional `AnimatedSprite/Graphics visual`
- Player body: custom entity with position, velocity, radius, movement controller, and collision shape
- Enemies: custom entities updated by gameplay systems, with circle or rectangle hit shapes
- Projectiles, hazards, and indicators: pooled entities rendered with PixiJS Graphics/Sprite/Graphics visuals
- UI: HTML/CSS overlay or PixiJS UI Containers; choose one main approach and keep it consistent
- Data/config: typed TypeScript objects, JSON, or data modules
- Physics/collision: lightweight custom collision using circles, rectangles, spatial filtering, and explicit overlap checks
- Persistence: browser `localStorage` or IndexedDB for level progress and personal bests

---

## 1. Project Vision

### 1.1 Game concept

The game is a fast roguelike arena survival game built with PixiJS v8 and TypeScript.

The player controls an inexperienced mage who must survive for 5 minutes inside an arena. The game must feel intense and dynamic: the player should constantly move, dodge, dash, manage cooldowns, manage mana, and choose upgrades when leveling up.

### 1.2 Core fantasy

The player is not a static spellcaster. The mage survives through mobility, timing, and dangerous close-range decisions.

The main combat identity:

- Dash through enemies to damage them.
- Use teleport to escape or reposition under pressure.
- Use an area explosion when surrounded.
- Level up and shape the build through upgrade cards.

### 1.3 Session structure

One run lasts 5 minutes.

Important timing:

- `00:00 - 04:00`: escalating waves of enemies.
- `04:00`: a boss or extremely dangerous elite wave always appears.
- `04:00 - 05:00`: final survival phase.
- `05:00`: survival success condition.

### 1.4 Gameplay pillars

- High movement speed and constant pressure.
- Enemies with readable but dangerous behavior.
- Clear attack indicators before dangerous enemy abilities.
- Skill cooldown and mana management.
- Upgrade choices that noticeably change the run.
- Config-driven balancing.

---

## 2. Recommended PixiJS Project Structure

The agent may adapt the structure to the existing repository, but the project should stay close to this organization conceptually. Avoid hard-coding gameplay assumptions into folder names or file paths. This is a conceptual layout, not a requirement to use exact filenames.

```text
src/
  app/
    bootstrap/
    screens/
    loop/
  core/
    math/
    time/
    events/
    pool/
    collision/
  game/
    state/
    config/
    arena/
    camera/
  input/
  entities/
    player/
    enemies/
    bosses/
    projectiles/
    hazards/
    pickups/
    indicators/
  combat/
  skills/
  upgrades/
  spawning/
  ui/
  audio/
  save/
assets/
  sprite/graphics visuals/
  vfx/
  audio/
  fonts/
public/
tests/
```

Recommended architectural idea:

- Keep PixiJS rendering objects separate from gameplay state when possible.
- Use entity classes or plain objects for gameplay state.
- Use systems for input, movement, collision, combat, spawning, upgrades, UI synchronization, audio, and saving.
- Use `Container` hierarchy for visual layering: background, hazards, pickups, enemies, player, projectiles, indicators, UI or overlays.
- Use data modules or JSON-like config for all tunable values.

---

## 3. Progress Plan

## Theme 1 — Project Foundation `[x]`

Goal: create a stable PixiJS v8 + TypeScript game foundation that can run, update, render, and be extended safely.

### Block 1.1 — Project setup `[x]`

- [x] Create or verify a PixiJS v8 project setup.
- [x] Add a clean PixiJS folder structure for screens, scripts, entity factories or reusable view/component builders, typed config data, art, audio, visual effects, UI, and tests.
- [x] Add or verify the browser app bootstrap and initial screen flow.
- [x] Add basic input bindings: movement, dash, teleport, explosion, pause, restart.
- [x] Confirm the app starts in the browser and displays a placeholder game screen.

### Block 1.2 — Game loop and state `[x]`

- [x] Implement a central game application/screen responsible for wiring core systems.
- [x] Use the PixiJS ticker for frame updates and a fixed-step accumulator where deterministic gameplay updates are useful.
- [x] Add delta-time based updates for rendering, UI, timers, and non-fixed systems.
- [x] Add `GameState` with at least: `Boot`, `Playing`, `LevelUpSelection`, `TeleportTargeting`, `Paused`, `Victory`, `Defeat`.
- [x] Add gameplay time-scale support so the game can slow down during teleport targeting while UI and pointer feedback remain responsive.

### Block 1.3 — Core utilities `[x]`

- [x] Add helper utilities for 2D movement, vector math, interpolation, clamping, and angle calculations.
- [x] Add clamp, distance, normalize, random, and weighted-random helpers if needed.
- [x] Add circle/radius overlap helpers for skills and hazards.
- [x] Add a simple typed event system or lightweight gameplay event service for events such as level up, enemy killed, player damaged, skill used, and run finished.

## Theme 2 — Player Core `[ ]`

Goal: create the player mage with movement, stats, health, mana, regeneration, experience, and leveling.

### Block 2.1 — Player entity `[ ]`

- [ ] Create the player entity with gameplay state, custom movement controller, collision radius, placeholder visual, and TypeScript controller/system integration.
- [ ] Add config-driven base stats: max HP, max MP, HP regen, MP regen, movement speed, collision radius.
- [ ] Add update logic for movement and regeneration.
- [ ] Add damage handling and death state.
- [ ] Expose necessary typed events: damaged, died, mana_changed, hp_changed, level_changed.

### Block 2.2 — Input system `[ ]`

- [ ] Implement keyboard movement input using PixiJS Input System actions.
- [ ] Implement pointer tracking from screen-space mouse position to world-space arena coordinates.
- [ ] Implement left mouse button input for dash.
- [ ] Implement `Q` input for teleport.
- [ ] Implement a dedicated input action for explosion.
- [ ] Implement input gating so locked skills cannot be used before the required level.

### Block 2.3 — Experience and level system `[ ]`

- [ ] Add player XP and level state.
- [ ] Add configurable XP requirements per level or a formula.
- [ ] Add XP essence pickup or direct XP reward placeholder.
- [ ] Trigger level-up flow when XP reaches the requirement.
- [ ] Pause or block combat flow while upgrade cards are being selected.

## Theme 3 — Player Skills `[ ]`

Goal: implement three configurable mage skills with cooldown, mana cost, unlock level, and clear feedback.

### Block 3.1 — Shared skill framework `[ ]`

- [ ] Create a common `Skill` base script or typed config object-driven skill model.
- [ ] Add cooldown tracking.
- [ ] Add mana cost checks.
- [ ] Add unlock level checks.
- [ ] Add config typed config objects or config scripts for all skill values.
- [ ] Expose skill state to UI: locked, ready, cooling down, insufficient mana.

### Block 3.2 — Dash skill: left mouse button `[ ]`

Skill description: when the player presses left mouse button, the mage dashes toward the mouse pointer, passes through enemies, and damages enemies touched during the dash.

- [ ] Implement dash direction from player position to mouse pointer.
- [ ] Add config values: mana cost, cooldown, dash distance, dash duration, damage, hit radius, invulnerability or collision bypass behavior if needed.
- [ ] Move the player quickly during the dash using `custom custom movement/collision body` or a kinematic 2D movement controller-friendly logic.
- [ ] Allow passing through enemies during dash or ignore enemy body blocking during dash.
- [ ] Damage each enemy only once per dash activation.
- [ ] Add visual feedback for dash movement, such as trail, afterimage, or short motion effect.
- [ ] Add cooldown and mana consumption.

### Block 3.3 — Teleport skill: Q, unlock level 5 `[ ]`

Skill description: at level 5, the player unlocks teleport. When pressing `Q`, the mage disappears, the game slows down, and the mouse cursor receives a circular indicator. The circle shrinks during a 2-second targeting window. The player must choose a valid point. If the player does not click, the mage teleports to the last valid pointer position when the timer ends.

- [ ] Lock teleport until player level 5.
- [ ] Add config values: mana cost, cooldown, max radius, targeting duration, time scale during targeting, fade/disappear duration, reappear duration.
- [ ] On `Q`, enter teleport targeting state if cooldown and mana allow.
- [ ] Make the player visually disappear or fade during targeting.
- [ ] Slow the game using `Time.timeScale` with unscaled UI time where needed while keeping UI usable.
- [ ] Show a radius indicator around the player for max teleport range.
- [ ] Show a cursor indicator circle that shrinks over 2 seconds.
- [ ] Clamp target position to valid radius.
- [ ] Confirm teleport by left click during targeting.
- [ ] Auto-confirm teleport to the last valid pointer position when the targeting timer ends.
- [ ] Consume mana and start cooldown only when teleport actually activates.
- [ ] Restore normal time scale after teleport.

### Block 3.4 — Explosion skill: unlock level 8 `[ ]`

Skill description: at level 8, the player unlocks an area explosion centered on the player.

- [ ] Lock explosion until player level 8.
- [ ] Add config values: mana cost, cooldown, radius, damage, knockback if used, visual duration.
- [ ] Activate explosion from a dedicated input key selected by the project implementation.
- [ ] Damage all enemies inside the radius.
- [ ] Add clear visual effect for the explosion radius.
- [ ] Add cooldown and mana consumption.

## Theme 4 — Enemies `[ ]`

Goal: implement multiple enemy archetypes with readable behavior, configurable stats, and scalable spawning.

### Block 4.1 — Enemy foundation `[ ]`

- [ ] Create base `Enemy` screen/script with HP, speed, damage, radius, reward XP, and type.
- [ ] Add enemy factory using config-driven definitions or visual factory or entity factory mappings.
- [ ] Add enemy movement update.
- [ ] Add enemy damage and death handling.
- [ ] Add contact damage against the player.
- [ ] Add XP reward or XP essence spawn on death.

### Block 4.2 — Warrior enemies `[ ]`

- [ ] Implement basic warrior that walks directly toward the player.
- [ ] Implement fast warrior with lower HP and higher speed.
- [ ] Add config for both warrior types.
- [ ] Verify both types can spawn and damage the player.

### Block 4.2A — Playable combat checkpoint `[ ]`

- [ ] Ensure launching the main screen shows the playable game instead of placeholder content.
- [ ] Add an in-game checkpoint HUD with controls, HP/MP/XP, enemy count, kills, and FPS.
- [ ] Add continuous warrior spawning for a short performance/combat test loop.
- [ ] Ensure the player can move, use dash damage, kill enemies, and keep playing without a blocking level-up selection screen.

### Block 4.3 — Ranged enemies `[ ]`

- [ ] Implement basic shooter that keeps distance and fires projectiles.
- [ ] Implement grenade thrower with delayed area damage indicator.
- [ ] Implement Molotov thrower that creates a temporary burning area.
- [ ] Add projectile and hazard systems if not already present.
- [ ] Add config for fire rate, projectile speed, range, damage, grenade fuse, Molotov duration, and area radius.

Grenade thrower behavior:

- Keeps preferred distance from the player and throws grenades at the player's current position when in range.
- The target zone appears immediately as an outer damage circle.
- An inner circle shrinks toward the center during the fuse so the player can read when the explosion will occur.
- When the inner circle reaches the center, the grenade deals one burst of area damage and spawns a short explosion effect.

Molotov thrower behavior:

- Keeps preferred distance from the player and throws Molotovs at the player's current position when in range.
- The initial target zone uses the same readable outer circle and shrinking inner fuse circle.
- On impact, it spawns a short explosion effect and creates a burning fire zone.
- The fire zone deals periodic damage while active and uses its own shrinking inner circle to show when the damaging area will end.

### Block 4.4 — Mage enemies `[ ]`

- [ ] Implement summoner mage that periodically summons weak warriors.
- [ ] Implement healer mage that heals nearby enemies.
- [ ] Implement teleport mage that shows a target indicator before teleporting.
- [ ] Add config for summon interval, summon count, heal radius, heal amount, teleport cooldown, teleport warning duration, and teleport range.
- [ ] Ensure mage behavior is readable and not unfair.

Mage behavior notes:

- Summoner mage keeps distance and periodically spawns weak warriors around itself using the configured summon type, count, and radius.
- Healer mage keeps distance and periodically heals nearby enemies inside a readable green pulse radius.
- Teleport mage keeps distance and creates a blue target indicator before relocating; the shrinking inner circle shows when the teleport will complete.
- Mage cooldowns and ranges are tuned longer than basic ranged attacks so their support behavior is readable during the playable checkpoint.

### Block 4.5 — Combat feedback and damage grace `[ ]`

- [ ] Add short player invulnerability after receiving damage.
- [ ] Show an enemy health indicator only after that enemy receives damage.
- [ ] Hide the enemy health indicator shortly after damage feedback expires.

## Theme 5 — Bosses and Elite Threats `[ ]`

Goal: add the 4-minute danger spike with bosses or very strong enemies.

### Block 5.1 — Boss foundation `[ ]`

- [ ] Create base `Boss` screen/script or boss behavior layer.
- [ ] Add boss config definitions.
- [ ] Add boss health bar UI.
- [ ] Add boss spawn event at exactly 4 minutes.
- [ ] Ensure the boss phase can coexist with regular enemies or override regular spawning depending on config.

### Block 5.2 — Area attack boss `[ ]`

Boss description: attacks an area with a clear warning indicator showing where the attack will land.

- [ ] Implement attack wind-up.
- [ ] Show area warning indicator before damage.
- [ ] Apply damage after wind-up.
- [ ] Add config for radius, damage, wind-up time, cooldown, and attack pattern.

### Block 5.3 — Tank boss `[ ]`

Boss description: a boss with very high HP and simple but dangerous pressure.

- [ ] Implement high-HP boss with chase behavior.
- [ ] Add heavy contact damage or periodic slam if desired.
- [ ] Add config for HP, speed, damage, and optional enrage behavior.

### Block 5.4 — Horde boss `[ ]`

Boss description: the boss encounter is represented by an organized horde of weak warriors.

- [ ] Implement horde boss phase as a spawn pattern, not necessarily a single entity.
- [ ] Spawn many weak warriors in waves.
- [ ] Add config for total count, wave size, spawn interval, and spawn positions.
- [ ] Mark the horde boss as defeated when enough horde enemies are killed or when the survival timer ends.

### Block 5.5 — Meteor summoner boss `[ ]`

Boss description: a spellcaster boss summons meteors. Each meteor shows an impact indicator before landing. When a meteor lands, it deals damage and spawns warriors.

- [ ] Implement meteor warning indicator.
- [ ] Apply impact damage after warning delay.
- [ ] Spawn warriors at or near the impact point.
- [ ] Add config for meteor count, warning duration, impact radius, impact damage, summon count, and cast cooldown.

## Theme 6 — Arena, Timer, Waves, and Spawning `[ ]`

Goal: make the game playable as a 5-minute survival run with escalating pressure.

### Block 6.1 — Arena `[ ]`

- [ ] Add arena boundaries.
- [ ] Prevent the player from leaving the arena.
- [ ] Spawn enemies outside the immediate player safety radius.
- [ ] Add simple background and visual orientation markers.

### Block 6.2 — Run timer and win/lose conditions `[ ]`

- [ ] Add a run timer starting at 0.
- [ ] End with victory at 5 minutes if the player is alive.
- [ ] End with defeat if the player dies.
- [ ] Display timer in HUD.
- [ ] Trigger boss or elite phase at 4 minutes.

### Block 6.3 — Wave scheduler `[ ]`

- [ ] Implement configurable spawn waves.
- [ ] Increase spawn difficulty over time.
- [ ] Add enemy type weights per time segment.
- [ ] Add spawn rate scaling.
- [ ] Add max enemy count protection for performance.

## Theme 7 — Upgrade Cards and Progression `[ ]`

Goal: create a level-up card system that improves player stats and skill behavior.

### Block 7.1 — Upgrade card foundation `[ ]`

- [ ] Create upgrade card data structure, preferably as typed config data.
- [ ] Create upgrade config list.
- [ ] Add card rarity or weight if useful.
- [ ] Add upgrade application logic.
- [ ] Add upgrade selection state that pauses or blocks normal gameplay.

### Block 7.2 — Stat upgrade cards `[ ]`

Implement cards for:

- [ ] Max HP.
- [ ] Max MP.
- [ ] HP regen.
- [ ] MP regen.
- [ ] Movement speed.

### Block 7.3 — Skill upgrade cards `[ ]`

Implement cards for:

- [ ] Dash cooldown reduction.
- [ ] Dash damage increase.
- [ ] Teleport cooldown reduction.
- [ ] Teleport radius increase.
- [ ] Explosion cooldown reduction.
- [ ] Explosion damage increase.
- [ ] Explosion radius increase.

### Block 7.4 — Upgrade selection UI `[ ]`

- [ ] Show 3 upgrade cards on level up.
- [ ] Allow selecting one card.
- [ ] Apply selected upgrade immediately.
- [ ] Resume gameplay after selection.
- [ ] Prevent duplicate or invalid cards when necessary.

## Theme 8 — Combat, Collision, and Feedback `[ ]`

Goal: make hits, damage, cooldowns, and danger zones clear and satisfying.

### Block 8.1 — Damage system `[ ]`

- [ ] Centralize damage application.
- [ ] Support damage source metadata: player skill, enemy contact, projectile, hazard, boss attack.
- [ ] Add temporary invulnerability windows if needed.
- [ ] Add hit flash or simple feedback.

### Block 8.2 — Collision system `[ ]`

- [ ] Use PixiJS collision layers/masks consistently for player, enemies, projectiles, pickups, hazards, and indicators.
- [ ] Implement radius-based overlap checks for skills and area attacks where direct physics queries are clearer.
- [ ] Add optimization if enemy count becomes high.
- [ ] Prevent collision checks from becoming too expensive.
- [ ] Keep dash collision behavior special: pass through enemies but still apply damage.

### Block 8.3 — Indicators and readability `[ ]`

- [ ] Add warning indicators for enemy grenade impact.
- [ ] Add warning indicators for Molotov impact or burning area.
- [ ] Add warning indicators for boss area attacks.
- [ ] Add warning indicators for meteor impacts.
- [ ] Add warning indicator for teleport mage destination.
- [ ] Make indicators visually distinct from player skill indicators.

## Theme 9 — User Interface `[ ]`

Goal: build a minimal but informative HUD for a fast roguelike.

### Block 9.1 — HUD foundation `[ ]`

- [ ] Show HP bar.
- [ ] Show MP bar.
- [ ] Show level and XP progress.
- [ ] Show run timer.
- [ ] Show current enemy or boss phase if useful.

### Block 9.2 — Skill bar `[ ]`

- [ ] Show dash icon/state.
- [ ] Show teleport icon/state and locked state until level 5.
- [ ] Show explosion icon/state and locked state until level 8.
- [ ] Show cooldown overlay or countdown.
- [ ] Show insufficient mana state.

### Block 9.3 — End screens `[ ]`

- [ ] Add victory screen after 5 minutes.
- [ ] Add defeat screen after player death.
- [ ] Show simple run summary: level reached, enemies killed, boss phase survived or failed.
- [ ] Add restart button.

### Block 9.4 — UI and encounter improvements `[ ]`

- [ ] Prevent the lower HUD/pause-style panel from flashing behind upgrade cards.
- [ ] Randomize boss selection so each run can produce a different boss phase.
- [ ] Keep the boss health UI from overlapping the player's HP panel.
- [ ] Add more map action with boss-inspired enhanced warriors spawning every 30 seconds.

## Theme 10 — Balancing and Configuration `[ ]`

Goal: make all gameplay values easy to tune manually without hunting through logic code.

### Block 10.1 — Config cleanup `[ ]`

- [ ] Move player values into `PlayerConfig` typed config object or the relevant implementation asset.
- [ ] Move skill values into `SkillConfig` typed config objects or the relevant implementation asset.
- [ ] Move enemy values into `EnemyConfig` typed config objects or the relevant implementation asset.
- [ ] Move boss values into `BossConfig` typed config objects or the relevant implementation asset.
- [ ] Move upgrade values into `UpgradeCardData` typed config objects or the relevant implementation asset.
- [ ] Move spawn and wave values into `WaveConfig` typed config objects or the relevant implementation asset.

### Block 10.2 — Balance pass `[ ]`

- [ ] Tune player movement speed.
- [ ] Tune dash distance, cooldown, damage, and mana cost.
- [ ] Tune teleport radius, cooldown, and mana cost.
- [ ] Tune explosion radius, cooldown, damage, and mana cost.
- [ ] Tune enemy HP, speed, damage, and spawn rates.
- [ ] Tune boss phase difficulty.
- [ ] Tune XP gain and level curve so level 5 and level 8 are reachable at meaningful moments.

## Theme 11 — Performance and Polish `[ ]`

Goal: keep the game smooth and improve feel.

### Block 11.1 — Performance `[ ]`

- [ ] Add object pooling for projectiles, indicators, hazards, and frequent visual effects if needed.
- [ ] Avoid creating many temporary objects every frame.
- [ ] Add group-based lookup or spatial partitioning if enemy counts become high.
- [ ] Verify performance during heavy waves and boss phase.
- [ ] Verify the game remains playable in target production build if web production build is planned.

### Block 11.2 — Visual polish `[ ]`

- [ ] Add placeholder art or simple stylized shapes for player, enemies, projectiles, hazards, and bosses.
- [ ] Add clear color/shape language for enemy types.
- [ ] Add dash trail.
- [ ] Add teleport disappear/reappear effect.
- [ ] Add explosion effect.
- [ ] Add damage and death effects.

### Block 11.3 — Audio polish `[ ]`

- [ ] Add basic sound manager.
- [ ] Add skill sounds.
- [ ] Add enemy hit/death sounds.
- [ ] Add boss warning sounds.
- [ ] Add low HP or danger feedback if useful.

## Theme 12 — Testing, QA, and Release Readiness `[ ]`

Goal: make sure the game is stable enough to iterate and share.

### Block 12.1 — Manual QA checklist `[ ]`

- [ ] Verify the player can survive, take damage, regenerate, and die.
- [ ] Verify dash damages enemies and respects cooldown and mana.
- [ ] Verify teleport unlocks at level 5 and works correctly.
- [ ] Verify explosion unlocks at level 8 and works correctly.
- [ ] Verify all enemy archetypes spawn and behave correctly.
- [ ] Verify the boss or elite phase starts at 4 minutes.
- [ ] Verify victory triggers at 5 minutes.
- [ ] Verify upgrade cards apply correctly.
- [ ] Verify restart works.

### Block 12.2 — Browser build verification `[ ]`

- [ ] Run the project through the local dev server.
- [ ] Check the browser console and terminal output for TypeScript/build/runtime errors.
- [ ] Run a production build.
- [ ] Fix warnings that indicate real problems.
- [ ] Verify the production build runs locally in a browser preview.

## Theme 13 — Main Menu and Screen Transitions `[ ]`

Goal: create a polished main menu as the true game entry point, with animated buttons and smooth screen transitions.

### Block 13.1 — Main menu screen `[ ]`

- [ ] Create a main menu screen with a background, title label, Play button, and Exit button.
- [ ] Add tween-based scale/color animation when hovering over buttons.
- [ ] Wire Play button to transition to the level configurator screen.
- [ ] Wire Exit button to quit the application.
- [ ] Update the bootstrap flow so the main menu is the true entry point instead of placeholder gameplay.

### Block 13.2 — Splash screen transition `[ ]`

- [ ] Create a full-screen splash/transition overlay with a fade-in/fade-out animation.
- [ ] Use the splash screen as a transition layer when switching between main menu, level configurator, and game screens.
- [ ] Expose a screen transition method that fades out, loads the target screen, and fades back in.

## Theme 14 — Level Configurator `[ ]`

Goal: replace the direct game launch with a level selection screen. The player unlocks levels by completing the previous one. Each level is progressively harder and more interesting.

### Block 14.1 — Level configurator screen `[ ]`

- [ ] Create a level configurator screen with a title and 5 level buttons laid out clearly.
- [ ] Level 1 is always unlocked. Levels 2–5 unlock only after completing the previous level (victory).
- [ ] Store unlock progress in persistent local save data.
- [ ] Locked levels are grayed out and unclickable. Unlocked levels show their name and difficulty.
- [ ] Add a Back button to return to the main menu.
- [ ] Each level button transitions to the game screen via the splash screen.

### Block 14.2 — Level definitions `[ ]`

- [ ] **Level 1 — The Awakening**: 3 min, slow waves, no boss.
- [ ] **Level 2 — Rising Threat**: 5 min standard run, random boss.
- [ ] **Level 3 — The Crucible**: 5 min, +20% HP/dmg, meteor boss.
- [ ] **Level 4 — Horde Siege**: 5 min, 2× wave caps, horde boss, elites every 20s.
- [ ] **Level 5 — Apocalypse**: 6 min, 2× caps, all enemies, boss at 3.5 min, elites every 15s.
- [ ] Store level definitions in dedicated level configuration data and pass the selected config into the run screen.
- [ ] The game startup flow reads the selected level config and applies runtime overrides before spawning gameplay systems.

## Theme 15 — Gameplay Improvements `[ ]`

Goal: apply targeted gameplay improvements: dash charges, music continuity during upgrade selection, and polished upgrade card UI.

### Block 15.1 — Dash charge system `[ ]`

- [ ] Replace the single-cooldown dash with a 3-charge system.
- [ ] Each charge regenerates independently on its own cooldown timer.
- [ ] Using a dash consumes one charge immediately if any charge is available.
- [ ] The skill bar shows charge count (e.g. "2/3  Ready").
- [ ] Update the dash skill configuration with `max_charges = 3`.
- [ ] Update the player skill controller to track dash charges and dash recharge timers.
- [ ] Updated skill state emission and HUD display.

### Block 15.2 — Music continuity during upgrade selection `[ ]`

- [ ] LEVEL_UP_SELECTION no longer pauses the screen hierarchy.
- [ ] Player input disabled; `is_combat_flow_blocked()` stops physics systems.
- [ ] Only PAUSED, VICTORY, DEFEAT pause the tree.
- [ ] Music plays uninterrupted during upgrade card selection.

### Block 15.3 — Upgrade card visual polish `[ ]`

- [ ] Cards have colored background and accent bar per target category (green=stats, blue=dash, purple=teleport, orange=explosion).
- [ ] Category label, styled title, separator, description, and stack label with matching accent color.
- [ ] Tween wiggle on hover: scale up + quick rotation wiggle (1.2° → -0.6° → 0°).
- [ ] Tween back to rest on mouse leave.

## Theme 16 — Critical Wiring Verification `[ ]`

Goal: verify the systems added in earlier themes work together correctly in PixiJS and are not only implemented in isolation.

### Block 16.1 — Dash charge system verification `[ ]`

- [ ] Ensure dash recharge timers always continue while charges are below max.
- [ ] Verify consecutive dashes work while charges remain above 0.
- [ ] Verify dash cannot be activated when all charges are empty.
- [ ] Verify the skill bar updates charge count and recharge countdown correctly.

### Block 16.2 — UI layout verification `[ ]`

- [ ] Center the level selection cards correctly across common resolutions.
- [ ] Center the main menu title and buttons correctly across common resolutions.
- [ ] Center the end screen summary panel correctly across common resolutions.
- [ ] Verify UI scaling works with the selected Canvas Scaler settings.

### Block 16.3 — Level config and difficulty wiring `[ ]`

- [ ] Ensure selected level configuration is stored before entering gameplay.
- [ ] Apply wave max enemy multipliers to spawning.
- [ ] Apply spawn interval multipliers to wave timing.
- [ ] Apply enemy HP, damage, and speed multipliers through runtime enemy config duplication or equivalent safe data copying.
- [ ] Verify level descriptions match actual gameplay configuration.


## Theme 17 — Game Feel & Polish Pass `[ ]`

Goal: add juice and feedback to make the game feel better to play.

### Block 17.1 — Camera and screen shake `[ ]`

- [ ] Add Camera2D that follows the player.
- [ ] Add screen shake on player damage, scaled by damage amount.
- [ ] Screen shake fades out smoothly.

### Block 17.2 — Floating XP text `[ ]`

- [ ] Spawn floating "+N XP" text at enemy death position.
- [ ] Text floats upward and fades out over 0.6 seconds.

## Theme 18 — UI & Interaction Fixes `[ ]`

Goal: fix critical UI and interaction bugs: upgrade pausing, button centering, card visuals, hover animations, and arena collision.

### Block 18.1 — Upgrade selection pausing `[ ]`

- [ ] Re-add `get_tree().paused = true` during LEVEL_UP_SELECTION so the game freezes while choosing cards.
- [ ] Upgrade UI already uses PROCESS_MODE_ALWAYS so buttons work while paused.

### Block 18.2 — Main menu and card UI fixes `[ ]`

- [ ] Fix main menu buttons to fill the container width (SIZE_EXPAND_FILL) instead of shrinking to one side.
- [ ] Fix level selection cards: add proper background ColorRect and accent bar, increase card height for better readability.
- [ ] Fix card hover animation: add panel-level mouse_entered/mouse_exited, set child controls to MOUSE_FILTER_IGNORE, route button hover to the panel's tween to prevent double animation.

### Block 18.3 — Arena collision and skill boundary fix `[ ]`

- [ ] Add WALL collision layer (bit 7) to CollisionLayers.
- [ ] Set arena walls to WALL layer instead of PLAYER layer.
- [ ] Add WALL to player's collision mask so the player collides with arena walls.
- [ ] Add per-frame arena clamping in physics updates to prevent dash from pushing the player outside.
- [ ] Clamp player position after teleport confirmation (already existed).

### Block 18.4 — Camera shake on level up `[ ]`

- [ ] Trigger a short camera shake (0.18s, intensity 3.5) when the player levels up.

## Theme 19 — Gameplay Depth & Engagement `[ ]`

Goal: add systems that increase gameplay depth, reward mastery, and make each run feel distinct.

### Block 19.1 — Elite enemy variants `[ ]`

- [ ] Add elite enemy modifier system: "Swift" (+40% speed, -20% HP), "Fortified" (+60% HP, -15% speed, +25% contact damage), "Volatile" (explodes on death dealing area damage).
- [ ] Elites have a distinct visual glow or outline color.
- [ ] Elite spawn chance increases with wave progression (5% wave 1, 15% wave 3, 25% wave 5).
- [ ] Elites drop bonus XP (+50%).
- [ ] Config-driven via an `elite_modifiers` dictionary applied at spawn time.

### Block 19.2 — Combo and streak system `[ ]`

- [ ] Track consecutive kills within a 2-second window as a "kill streak".
- [ ] Display streak counter in the HUD (e.g., "x5 Streak!").
- [ ] Streak multiplier grants bonus XP: +10% per streak level (capped at x10).
- [ ] Visual feedback: streak counter pulses and grows with each kill.
- [ ] Streak resets to 0 if no kill within 2 seconds.

### Block 19.3 — Environmental hazards `[ ]`

- [ ] Add rotating fire pillars that periodically sweep across arena sections.
- [ ] Add shrinking safe zones during boss phase that force the player to stay mobile.
- [ ] Hazards have clear warning indicators before activation.
- [ ] Hazards damage both the player and enemies inside them.
- [ ] Config-driven spawn timing and damage values.

### Block 19.4 — Run statistics and post-run summary `[ ]`

- [ ] Track damage dealt per skill, damage taken, distance dashed, teleports used, explosions used.
- [ ] Track peak kill streak, highest wave reached, time spent in boss phase.
- [ ] Expand the end screen to show a detailed breakdown of the run.
- [ ] Add "Personal Best" tracking per level (stored in level_progress.json).
- [ ] Show comparison to previous best on the end screen.

### Block 19.5 — Dynamic difficulty adjustment `[ ]`

- [ ] If the player takes no damage for 30 seconds, slightly increase enemy spawn rate (+5%).
- [ ] If the player HP drops below 25%, slightly decrease enemy spawn rate (-10%) and increase MP regen (+20%).
- [ ] These adjustments are invisible to the player but keep the game feeling fair.
- [ ] Config-driven thresholds and adjustment values.
- [ ] Resets on level select or restart.

---


## Revision Topics

The following topics are flagged for revisiting in future sessions.

- **Dash charge HUD**: the skill widget already shows charge count text; consider visual charge pips or icons once art assets are added.
- **Level progress persistence**: persistent local save data should handle corruption gracefully and reset on error.
- **Level difficulty multipliers**: enemy HP/damage scaling in levels 3–5 may need balance tuning after playtesting.
- **Splash transition timing**: fade duration should feel responsive; tweak fade-in and fade-out duration values per screen context.
- **Upgrade card icons**: the icon placeholder area should be wired to actual sprite/graphics visual resources once art assets are added.
- **Main menu music**: consider separate menu music distinct from in-game music to create a clearer mood separation.
- **Level 5 dual boss phase**: the description was corrected to "boss at 3.5 min"; a second boss spawn after the first dies could be added as an extension.
- **Camera zoom per level**: consider slight zoom changes for higher difficulty levels to increase arena tension.
- **Floating text variety**: add floating damage numbers for skill hits (dash, explosion) in addition to XP text.

---



## 4. Gameplay Configuration Requirements

All major values must be easy to tune manually in typed config objects, JSON-like data modules, or data files.

### 4.1 Player config example

Example as a TypeScript config object:

```ts
production build type PlayerConfig = {
  maxHp: number;
  maxMp: number;
  hpRegenPerSecond: number;
  mpRegenPerSecond: number;
  moveSpeed: number;
  collisionRadius: number;
};

production build const playerConfig: PlayerConfig = {
  maxHp: 100,
  maxMp: 100,
  hpRegenPerSecond: 0.5,
  mpRegenPerSecond: 3,
  moveSpeed: 260,
  collisionRadius: 16,
};
```

### 4.2 Skill config example

Example as typed skill config data:

```ts
production build type BaseSkillConfig = {
  skillId: string;
  unlockLevel: number;
  manaCost: number;
  cooldownSeconds: number;
};

production build type DashSkillConfig = BaseSkillConfig & {
  distance: number;
  durationSeconds: number;
  damage: number;
  hitRadius: number;
  maxCharges: number;
};

production build const dashSkillConfig: DashSkillConfig = {
  skillId: "dash",
  unlockLevel: 1,
  manaCost: 15,
  cooldownSeconds: 1.2,
  distance: 180,
  durationSeconds: 0.14,
  damage: 30,
  hitRadius: 22,
  maxCharges: 3,
};
```

### 4.3 Enemy config requirements

Each enemy definition should include:

- Type ID
- Display name
- Visual factory key or asset key
- HP
- Speed
- Damage
- Collision radius
- XP reward
- Behavior config
- Spawn weight or wave availability

### 4.4 Boss config requirements

Each boss definition should include:

- Type ID
- Display name
- Visual factory key or asset key
- HP or phase rules
- Damage values
- Attack cooldowns
- Warning durations
- Indicator radius or shape
- Spawn rules
- Optional summoned enemy types

### 4.5 PixiJS-specific implementation requirements

- Use a clear container hierarchy and z-order for background, hazards, pickups, enemies, player, projectiles, indicators, and UI.
- Keep gameplay state separate from PixiJS display objects where practical.
- Avoid expensive traversal of large containers every frame; use registries, arrays, object pools, or spatial partitioning.
- Use ticker delta carefully and convert it to seconds consistently.
- Use a fixed-step accumulator for gameplay logic if frame-rate-dependent behavior becomes noticeable.
- Use object pooling for frequently spawned objects such as projectiles, indicators, hazards, floating text, and short-lived effects.
- If object pooling is introduced, make sure reused objects reset state, subscriptions, timers, alpha/scale/visibility, and parent container state correctly.
- Keep config data immutable during a run unless runtime copies are intentionally created.
- Separate save data from config data.
- Use `localStorage` only for simple progress/personal-best data; use IndexedDB only if save data becomes larger.
- Keep browser resize handling, resolution scaling, and device pixel ratio behavior explicit.

## 5. Plan Update Commands

The agent should support these user commands while working with the plan.

### 5.1 Add new theme

User command format:

```text
PLAN: ADD THEME
Title: <theme title>
Goal: <theme goal>
Position: <end | before theme N | after theme N>
```

Agent action:

1. Add a new theme with checkbox `[ ]`.
2. Add the goal text.
3. Add at least one empty block placeholder if no block is provided.
4. Do not mark anything complete.

Template:

```md
## Theme N — <theme title> `[ ]`

Goal: <theme goal>

### Block N.1 — <block title> `[ ]`

- [ ] <task>
```

### 5.2 Add new block

User command format:

```text
PLAN: ADD BLOCK
Theme: <theme number or exact theme title>
Title: <block title>
Tasks:
- <task 1>
- <task 2>
Position: <end | before block N.M | after block N.M>
```

Agent action:

1. Add the block under the selected theme.
2. Number it consistently.
3. Add each task as unchecked.
4. Keep the theme unchecked if this new block is unchecked.

### 5.3 Add new task

User command format:

```text
PLAN: ADD TASK
Block: <block number or exact block title>
Task: <task text>
Position: <end | before task text | after task text>
```

Agent action:

1. Add the task as `[ ]`.
2. Keep the parent block unchecked if the task is unchecked.
3. Keep the parent theme unchecked if the block is unchecked.

### 5.4 Mark task complete

User command format:

```text
PLAN: COMPLETE TASK
Task: <task text or task number>
Evidence: <short note about what was implemented and checked>
```

Agent action:

1. Mark the task `[x]`.
2. Add the evidence as a short note under the relevant block.
3. If all tasks in the block are `[x]`, mark the block `[x]`.
4. If all blocks in the theme are `[x]`, mark the theme `[x]`.

### 5.5 Mark task in progress

User command format:

```text
PLAN: START TASK
Task: <task text or task number>
```

Agent action:

1. Mark the task `[~]`.
2. Do not start any later task.
3. Do not mark the parent block or theme complete.

---

## 6. Starting Prompt for Implementation Sessions

Use this prompt at the start of a new implementation session:

```text
Follow the PixiJS roguelike project plan strictly: theme -> block -> task.
Find the first unchecked task in the first unchecked block of the first unchecked theme.
Work only on that task.
After implementation, run relevant checks.
Then update the task checkbox, block checkbox if complete, theme checkbox if complete, and add a short implementation note only if it helps future continuation.
Do not skip ahead unless I explicitly say so.
```
