import { Container } from "pixi.js";
import type { Vec2 } from "../../core/math/Vec2";
import { GameEventEmitter } from "../../core/events/GameEventEmitter";
import type { ArenaBounds } from "../player/Player";
import type {
  EnemyType,
  BaseEnemyConfig,
  WarriorEnemyConfig,
  RangedEnemyConfig,
  GrenadeThrowerConfig,
  MolotovThrowerConfig,
  SummonerMageConfig,
  HealerMageConfig,
  TeleportMageConfig,
} from "../../game/config/EnemyConfig";
import {
  warriorConfig,
  fastWarriorConfig,
  shooterConfig,
  grenadeThrowerConfig,
  molotovThrowerConfig,
  summonerMageConfig,
  healerMageConfig,
  teleportMageConfig,
  projectileConfig,
} from "../../game/config/EnemyConfig";
import { Enemy, EnemyEvents } from "./Enemy";
import type { EnemyDiedData, EnemyContactDamageData } from "./Enemy";
import { WarriorEnemy } from "./WarriorEnemy";
import { ShooterEnemy, ShooterEvents } from "./ShooterEnemy";
import { GrenadeThrowerEnemy, GrenadeEvents } from "./GrenadeThrowerEnemy";
import { MolotovThrowerEnemy, MolotovEvents } from "./MolotovThrowerEnemy";
import { SummonerMageEnemy, SummonerEvents } from "./SummonerMageEnemy";
import type { SummonedWarriorData } from "./SummonerMageEnemy";
import { HealerMageEnemy, HealerEvents } from "./HealerMageEnemy";
import type { HealPulseData } from "./HealerMageEnemy";
import { TeleportMageEnemy } from "./TeleportMageEnemy";
import { ProjectileManager } from "../../game/combat/ProjectileManager";
import { HazardManager } from "../../game/combat/HazardManager";
import type { ExplosionActivatedData } from "../../skills/ExplosionSkill";
import { ExplosionSkillEvents } from "../../skills/ExplosionSkill";
import type { SkillController } from "../../skills/SkillController";

export const EnemyManagerEvents = {
  ENEMY_KILLED: "enemy_manager:killed",
  PLAYER_DAMAGED: "enemy_manager:player_damaged",
} as const;

export interface EnemyKilledData {
  position: Vec2;
  rewardXp: number;
}

export interface PlayerDamagedByEnemyData {
  amount: number;
}

export class EnemyManager {
  private enemies: Enemy[] = [];
  private nextId = 0;
  private kills = 0;
  private enemyContainer: Container;
  private effectContainer: Container;
  private arenaBounds: ArenaBounds;
  readonly events: GameEventEmitter;
  readonly projectiles: ProjectileManager;
  readonly hazards: HazardManager;

  private configMap: Partial<Record<EnemyType, BaseEnemyConfig>> = {
    warrior: warriorConfig,
    fast_warrior: fastWarriorConfig,
    shooter: shooterConfig,
    grenade_thrower: grenadeThrowerConfig,
    molotov_thrower: molotovThrowerConfig,
    summoner_mage: summonerMageConfig,
    healer_mage: healerMageConfig,
    teleport_mage: teleportMageConfig,
  };

  constructor(
    enemyContainer: Container,
    effectContainer: Container,
    arenaBounds: ArenaBounds,
  ) {
    this.enemyContainer = enemyContainer;
    this.effectContainer = effectContainer;
    this.arenaBounds = arenaBounds;
    this.events = new GameEventEmitter();
    this.projectiles = new ProjectileManager(effectContainer);
    this.hazards = new HazardManager(effectContainer);
  }

  wireExplosions(skillController: SkillController): void {
    skillController.explosion.events.on<ExplosionActivatedData>(
      ExplosionSkillEvents.ACTIVATED,
      (data) => this.onExplosionActivated(data),
    );
  }

  private onExplosionActivated(data: ExplosionActivatedData): void {
    for (const enemy of this.enemies) {
      if (!enemy.state.alive) continue;
      const dx = enemy.state.position.x - data.position.x;
      const dy = enemy.state.position.y - data.position.y;
      const distSq = dx * dx + dy * dy;
      const combinedRadius = data.radius + enemy.config.collisionRadius;
      if (distSq <= combinedRadius * combinedRadius) {
        enemy.takeDamage(data.damage);
      }
    }
  }

  spawnEnemy(type: EnemyType, position: Vec2): Enemy {
    const config = this.configMap[type];
    if (!config) {
      throw new Error(`No config for enemy type: ${type}`);
    }
    const id = this.nextId++;
    const enemy = this.createEnemy(config, id);
    enemy.setPosition(position);
    this.wireEnemyEvents(enemy);
    this.enemies.push(enemy);
    return enemy;
  }

  registerExternalEnemy(enemy: Enemy): void {
    this.wireEnemyEvents(enemy);
    this.enemies.push(enemy);
  }

  private createEnemy(config: BaseEnemyConfig, id: number): Enemy {
    switch (config.type) {
      case "warrior":
      case "fast_warrior":
        return new WarriorEnemy(
          config as WarriorEnemyConfig,
          this.enemyContainer,
          id,
        );
      case "shooter":
        return new ShooterEnemy(
          config as RangedEnemyConfig,
          this.enemyContainer,
          id,
        );
      case "grenade_thrower":
        return new GrenadeThrowerEnemy(
          config as GrenadeThrowerConfig,
          this.enemyContainer,
          id,
        );
      case "molotov_thrower":
        return new MolotovThrowerEnemy(
          config as MolotovThrowerConfig,
          this.enemyContainer,
          id,
        );
      case "summoner_mage":
        return new SummonerMageEnemy(
          config as SummonerMageConfig,
          this.enemyContainer,
          id,
        );
      case "healer_mage":
        return new HealerMageEnemy(
          config as HealerMageConfig,
          this.enemyContainer,
          this.effectContainer,
          id,
        );
      case "teleport_mage":
        return new TeleportMageEnemy(
          config as TeleportMageConfig,
          this.enemyContainer,
          this.effectContainer,
          id,
        );
      default:
        return new Enemy(config, this.enemyContainer, id);
    }
  }

  private wireEnemyEvents(enemy: Enemy): void {
    enemy.events.on<EnemyDiedData>(EnemyEvents.DIED, (data) => {
      this.kills++;
      this.events.emit<EnemyKilledData>(EnemyManagerEvents.ENEMY_KILLED, {
        position: data.position,
        rewardXp: data.rewardXp,
      });
    });

    enemy.events.on<EnemyContactDamageData>(
      EnemyEvents.CONTACT_DAMAGE,
      (data) => {
        this.events.emit<PlayerDamagedByEnemyData>(
          EnemyManagerEvents.PLAYER_DAMAGED,
          { amount: data.damage },
        );
      },
    );

    if (enemy instanceof ShooterEnemy) {
      enemy.events.on(ShooterEvents.PROJECTILE_FIRED, (data: {
        position: Vec2;
        direction: Vec2;
        speed: number;
        damage: number;
      }) => {
        this.projectiles.spawn(
          data.position,
          data.direction,
          data.speed,
          data.damage,
          projectileConfig.radius,
          projectileConfig.maxLifetime,
        );
      });
    }

    if (enemy instanceof GrenadeThrowerEnemy) {
      enemy.events.on(GrenadeEvents.GRENADE_THROWN, (data: {
        targetPosition: Vec2;
        radius: number;
        damage: number;
        fuseDuration: number;
      }) => {
        this.hazards.spawnGrenade(
          data.targetPosition,
          data.radius,
          data.damage,
          data.fuseDuration,
        );
      });
    }

    if (enemy instanceof MolotovThrowerEnemy) {
      enemy.events.on(MolotovEvents.MOLOTOV_THROWN, (data: {
        targetPosition: Vec2;
        radius: number;
        damage: number;
        fuseDuration: number;
        fireDuration: number;
        fireDps: number;
      }) => {
        this.hazards.spawnMolotov(
          data.targetPosition,
          data.radius,
          data.damage,
          data.fuseDuration,
          data.fireDuration,
          data.fireDps,
        );
      });
    }

    if (enemy instanceof SummonerMageEnemy) {
      enemy.events.on<SummonedWarriorData>(
        SummonerEvents.WARRIORS_SUMMONED,
        (data) => {
          for (const pos of data.positions) {
            this.spawnEnemy(data.type, pos);
          }
        },
      );
    }

    if (enemy instanceof HealerMageEnemy) {
      enemy.events.on<HealPulseData>(HealerEvents.HEAL_PULSE, () => {
        (enemy as HealerMageEnemy).healNearbyEnemies(this.enemies);
      });
    }
  }

  update(dt: number, playerPos: Vec2, playerRadius: number, onPlayerDamage: (amount: number) => void): void {
    for (const enemy of this.enemies) {
      if (enemy.state.alive) {
        enemy.update(dt, playerPos, this.arenaBounds);
        enemy.checkContactDamage(playerPos, playerRadius);
      }
    }

    this.removeDeadEnemies();
    this.projectiles.update(dt);
    const projectileDamage = this.projectiles.checkCollisionWithPlayer(
      playerPos,
      playerRadius,
    );
    if (projectileDamage > 0) {
      onPlayerDamage(projectileDamage);
    }
    this.projectiles.render();
    this.hazards.update(dt, playerPos, playerRadius, onPlayerDamage);
  }

  private removeDeadEnemies(): void {
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      if (!this.enemies[i].state.alive) {
        this.enemies[i].destroy();
        this.enemies.splice(i, 1);
      }
    }
  }

  get enemyCount(): number {
    return this.enemies.length;
  }

  getEnemies(): readonly Enemy[] {
    return this.enemies;
  }

  get killCount(): number {
    return this.kills;
  }

  setArenaBounds(bounds: ArenaBounds): void {
    this.arenaBounds = bounds;
  }

  reset(): void {
    for (const enemy of this.enemies) {
      enemy.destroy();
    }
    this.enemies = [];
    this.kills = 0;
    this.nextId = 0;
    this.projectiles.reset();
    this.hazards.reset();
  }

  destroy(): void {
    this.reset();
    this.projectiles.destroy();
    this.hazards.destroy();
    this.events.removeAll();
  }
}
