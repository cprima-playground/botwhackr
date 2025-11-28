import Phaser from "phaser";
import { gameplayTuning } from "../config/gameConfig";

export class LevelGenerator {
  private readonly scene: Phaser.Scene;
  private readonly obstacles: Phaser.Physics.Arcade.Group;
  private readonly groundY: number;
  private elapsed = 0;
  private spawnInterval = 1000;

  constructor(scene: Phaser.Scene, obstacles: Phaser.Physics.Arcade.Group, groundY: number) {
    this.scene = scene;
    this.obstacles = obstacles;
    this.groundY = groundY;
    this.resetTimer();
  }

  update(delta: number) {
    this.elapsed += delta;
    if (this.elapsed >= this.spawnInterval) {
      this.spawnObstacle();
      this.resetTimer();
    }

    this.recycleObstacles();
  }

  reset() {
    this.obstacles.clear(true, true);
    this.resetTimer();
  }

  private spawnObstacle() {
    const obstacle = this.obstacles.get(0, 0, "obstacle") as Phaser.Physics.Arcade.Sprite;
    if (!obstacle) return;

    obstacle.setActive(true);
    obstacle.setVisible(true);
    obstacle.setPosition(this.scene.scale.width + Phaser.Math.Between(10, 40), this.groundY - 9);
    if (obstacle.body) {
      const body = obstacle.body as Phaser.Physics.Arcade.Body;
      body.setVelocityX(-gameplayTuning.runSpeed);
      body.setAllowGravity(false);
      body.setImmovable(true);
    }
  }

  private recycleObstacles() {
    const children = this.obstacles.getChildren() as Phaser.Physics.Arcade.Sprite[];
    children.forEach((child) => {
      if (child.x < -32) {
        this.obstacles.killAndHide(child);
      }
    });
  }

  private resetTimer() {
    this.elapsed = 0;
    this.spawnInterval = Phaser.Math.Between(900, 1400);
  }
}
