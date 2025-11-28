import Phaser from "phaser";
import { autoplayConfig } from "../config/autoplayConfig";
import { gameplayTuning, gameDimensions, uiCopy } from "../config/gameConfig";
import { AudioManager } from "../core/AudioManager";
import { AutoplayController } from "../core/AutoplayController";
import { InputController } from "../core/InputController";
import { LevelGenerator } from "../core/LevelGenerator";
import { ScoringSystem } from "../core/ScoringSystem";

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private ground!: Phaser.GameObjects.Rectangle;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private levelGenerator!: LevelGenerator;
  private inputController!: InputController;
  private autoplay!: AutoplayController;
  private scoring!: ScoringSystem;
  private audio!: AudioManager;

  private restarting = false;
  private playerHasTakenOver = false;
  private lastTakeoverTime = 0;

  constructor() {
    super("main");
  }

  create() {
    this.physics.world.setBounds(0, 0, gameDimensions.width, gameDimensions.height);
    this.audio = new AudioManager();
    this.scoring = new ScoringSystem(this.game.events);

    this.createGround();
    this.createPlayer();
    this.createObstacles();

    this.levelGenerator = new LevelGenerator(this, this.obstacles, this.getGroundTopY());
    this.inputController = new InputController(this, () => this.jump(), () => this.takeControl());
    this.inputController.enable();
    this.autoplay = new AutoplayController(this.player, this.obstacles, () => this.jump());

    this.physics.add.collider(this.player, this.ground as Phaser.GameObjects.GameObject);
    this.physics.add.collider(
      this.player,
      this.obstacles,
      () => this.handlePlayerHit(),
      undefined,
      this,
    );

    this.scoring.reset();
    this.game.events.emit("control:mode", uiCopy.autoplayActive);
  }

  update(time: number, delta: number) {
    if (this.restarting) return;

    this.keepRunSpeed();
    this.levelGenerator.update(delta);
    this.autoplay.update(time);
    this.scoring.tick(delta);
    this.recycleAutoplay();
  }

  private createGround() {
    this.ground = this.add.rectangle(
      gameDimensions.width / 2,
      gameDimensions.height - gameplayTuning.groundHeight / 2,
      gameDimensions.width,
      gameplayTuning.groundHeight,
      0x11202e,
    );
    this.physics.add.existing(this.ground, true);
    const body = this.ground.body as Phaser.Physics.Arcade.StaticBody;
    body.updateFromGameObject();
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(48, this.getGroundTopY() - 10, "player");
    this.player.setCollideWorldBounds(true);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 16).setOffset(0, 0);
    body.setVelocityX(gameplayTuning.runSpeed);
    body.setMaxVelocity(gameplayTuning.runSpeed, 600);
  }

  private createObstacles() {
    this.obstacles = this.physics.add.group({
      allowGravity: false,
      immovable: true,
      defaultKey: "obstacle",
      maxSize: 12,
    });
  }

  private jump() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down) {
      body.setVelocityY(gameplayTuning.jumpVelocity);
      this.audio.playSfx("jump");
      if (this.playerHasTakenOver) {
        this.lastTakeoverTime = this.time.now;
      }
    }
  }

  private takeControl() {
    if (this.playerHasTakenOver) return;
    this.playerHasTakenOver = true;
    this.lastTakeoverTime = this.time.now;
    this.autoplay.deactivate();
    this.game.events.emit("control:mode", uiCopy.playerActive);
  }

  private handlePlayerHit() {
    if (this.restarting) return;
    this.restarting = true;
    this.scoring.markDeath();
    this.game.events.emit("run:state", uiCopy.restarting);
    this.player.setTint(0xff7b7b);
    this.time.delayedCall(gameplayTuning.resetDelayMs, () => this.resetRun());
  }

  private resetRun() {
    this.restarting = false;
    this.player.clearTint();
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(0, 0);
    this.player.setPosition(48, this.getGroundTopY() - 10);
    this.scoring.reset();
    this.levelGenerator.reset();

    if (!this.playerHasTakenOver) {
      this.autoplay.reactivate();
    }

    body.setVelocityX(gameplayTuning.runSpeed);
    this.game.events.emit("run:state", "");
  }

  private keepRunSpeed() {
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (body.velocity.x < gameplayTuning.runSpeed) {
      body.setVelocityX(gameplayTuning.runSpeed);
    }
  }

  private recycleAutoplay() {
    if (!this.playerHasTakenOver) return;
    const inactiveTime = this.time.now - this.lastTakeoverTime;
    if (inactiveTime > autoplayConfig.reenableTimeoutMs) {
      this.playerHasTakenOver = false;
      this.autoplay.reactivate();
      this.inputController.resetTakeoverLatch();
      this.game.events.emit("control:mode", uiCopy.autoplayActive);
    }
  }

  private getGroundTopY() {
    return this.ground.y - gameplayTuning.groundHeight / 2;
  }
}
