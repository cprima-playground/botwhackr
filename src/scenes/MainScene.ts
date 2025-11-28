import Phaser from "phaser";
import { autoplayConfig } from "../config/autoplayConfig";
import { gameplayTuning, gameDimensions, runnerConstants, uiCopy } from "../config/gameConfig";
import { AudioManager } from "../core/AudioManager";
import { AutoplayController } from "../core/AutoplayController";
import { InputController } from "../core/InputController";
import { LevelGenerator } from "../core/LevelGenerator";
import { ScoringSystem } from "../core/ScoringSystem";

const GROUND_SEGMENT_WIDTH = 32;

export class MainScene extends Phaser.Scene {
  private player!: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private groundSegments: Phaser.Physics.Arcade.Sprite[] = [];
  private groundGroup!: Phaser.Physics.Arcade.Group;
  private groundY = 0;
  private obstacles!: Phaser.Physics.Arcade.Group;
  private levelGenerator!: LevelGenerator;
  private inputController!: InputController;
  private autoplay!: AutoplayController;
  private scoring!: ScoringSystem;
  private audio!: AudioManager;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    Z: Phaser.Input.Keyboard.Key;
    M: Phaser.Input.Keyboard.Key;
    P: Phaser.Input.Keyboard.Key;
  };

  private restarting = false;
  private playerHasTakenOver = false;
  private lastTakeoverTime = 0;
  private isMuted = false;
  private isPaused = false;
  private worldSpeed = runnerConstants.worldSpeed;

  constructor() {
    super("main");
  }

  create() {
    this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, gameDimensions.height);
    this.audio = new AudioManager();
    this.scoring = new ScoringSystem(this.game.events);
    this.scoring.setSpeed(this.worldSpeed);

    this.createGround();
    this.createPlayer();
    this.createObstacles();

    this.levelGenerator = new LevelGenerator(this, this.obstacles, this.getGroundTopY());
    this.inputController = new InputController(this, () => this.jump(), () => this.takeControl());
    this.inputController.enable();
    this.autoplay = new AutoplayController(this.player, this.obstacles, () => this.jump());

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys({
      W: Phaser.Input.Keyboard.KeyCodes.W,
      A: Phaser.Input.Keyboard.KeyCodes.A,
      S: Phaser.Input.Keyboard.KeyCodes.S,
      D: Phaser.Input.Keyboard.KeyCodes.D,
      Z: Phaser.Input.Keyboard.KeyCodes.Z,
      M: Phaser.Input.Keyboard.KeyCodes.M,
      P: Phaser.Input.Keyboard.KeyCodes.P,
    }) as unknown as MainScene["keys"];

    this.keys.M.on("down", () => this.toggleMute());
    this.keys.P.on("down", () => this.togglePause());

    this.physics.add.collider(this.player, this.groundGroup);
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
    if (this.isPaused) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    this.anchorPlayer(body);
    this.scrollWorld(delta);
    this.handleJump(body);
    this.levelGenerator.update(delta);
    this.autoplay.update(time);
    this.scoring.tick(delta);
    this.recycleAutoplay();
  }

  private createGround() {
    this.groundGroup = this.physics.add.group({ allowGravity: false, immovable: true });
    this.groundY = gameDimensions.height - gameplayTuning.groundHeight / 2;

    const needed = Math.ceil(gameDimensions.width / GROUND_SEGMENT_WIDTH) + 2;
    let x = GROUND_SEGMENT_WIDTH / 2;

    for (let i = 0; i < needed; i += 1) {
      const segment = this.physics.add.sprite(x, this.groundY, "ground");
      segment.setOrigin(0.5, 0.5);
      const body = segment.body as Phaser.Physics.Arcade.Body;
      body.setAllowGravity(false);
      body.setImmovable(true);
      body.setSize(GROUND_SEGMENT_WIDTH, gameplayTuning.groundHeight);
      this.groundGroup.add(segment);
      this.groundSegments.push(segment);
      x += GROUND_SEGMENT_WIDTH;
    }
  }

  private createPlayer() {
    this.player = this.physics.add.sprite(runnerConstants.playerX, this.getGroundTopY() - 10, "player");
    this.player.setCollideWorldBounds(false);
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setSize(16, 16).setOffset(0, 0);
    body.setVelocity(0, 0);

    const cam = this.cameras.main;
    cam.startFollow(this.player, true, 0.15, 0.15);
    cam.setFollowOffset(runnerConstants.cameraOffsetX, 0);
    cam.setBounds(0, 0, Number.MAX_SAFE_INTEGER, gameDimensions.height);
    this.recenterCamera(cam);
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
      body.setVelocityY(runnerConstants.jumpVelocity);
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
    this.player.setPosition(runnerConstants.playerX, this.getGroundTopY() - 10);
    this.worldSpeed = runnerConstants.worldSpeed;
    this.scoring.setSpeed(this.worldSpeed);
    this.scoring.reset();
    this.levelGenerator.reset();
    this.resetGroundSegments();
    this.recenterCamera();

    if (!this.playerHasTakenOver) {
      this.autoplay.reactivate();
    }

    this.game.events.emit("run:state", "");
  }

  private anchorPlayer(body: Phaser.Physics.Arcade.Body) {
    if (this.player.x !== runnerConstants.playerX) {
      this.player.x = runnerConstants.playerX;
    }
    if (body.velocity.x !== 0) {
      body.setVelocityX(0);
    }
  }

  private handleJump(body: Phaser.Physics.Arcade.Body) {
    const jumpPressed =
      this.cursors.space?.isDown ||
      this.cursors.up?.isDown ||
      this.keys.W.isDown ||
      this.keys.Z.isDown;

    if (jumpPressed && body.blocked.down) {
      this.jump();
    }
  }

  private scrollWorld(delta: number) {
    const scroll = (this.worldSpeed * delta) / 1000;

    let rightmost = Math.max(...this.groundSegments.map((segment) => segment.x));

    this.groundSegments.forEach((segment) => {
      segment.x -= scroll;
      const body = segment.body as Phaser.Physics.Arcade.Body;
      body.updateFromGameObject();

      if (segment.x < -GROUND_SEGMENT_WIDTH / 2) {
        segment.x = rightmost + GROUND_SEGMENT_WIDTH;
        body.updateFromGameObject();
        rightmost = segment.x;
      }
    });

    const children = this.obstacles.getChildren() as Phaser.Physics.Arcade.Sprite[];
    children.forEach((child) => {
      if (!child.active) return;
      child.x -= scroll;
      if (child.x < -child.displayWidth) {
        this.obstacles.killAndHide(child);
      }
    });
  }

  private resetGroundSegments() {
    let x = GROUND_SEGMENT_WIDTH / 2;
    this.groundSegments.forEach((segment) => {
      segment.x = x;
      const body = segment.body as Phaser.Physics.Arcade.Body;
      body.updateFromGameObject();
      x += GROUND_SEGMENT_WIDTH;
    });
  }

  private recenterCamera(cam = this.cameras.main) {
    cam.centerOn(this.player.x + runnerConstants.cameraOffsetX, this.player.y);
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

  private toggleMute() {
    this.isMuted = !this.isMuted;
    this.sound.mute = this.isMuted;
    this.audio.toggleMusic(!this.isMuted);
  }

  private togglePause() {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.physics.world.pause();
    } else {
      this.physics.world.resume();
    }
  }

  private getGroundTopY() {
    return this.groundY - gameplayTuning.groundHeight / 2;
  }
}
