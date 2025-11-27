import Phaser from "phaser";
import { autoplayConfig } from "../config/autoplayConfig";

export class AutoplayController {
  private readonly player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody;
  private readonly obstacles: Phaser.Physics.Arcade.Group;
  private readonly requestJump: () => void;

  private active = true;
  private lastJumpTime = 0;

  constructor(
    player: Phaser.Types.Physics.Arcade.SpriteWithDynamicBody,
    obstacles: Phaser.Physics.Arcade.Group,
    requestJump: () => void,
  ) {
    this.player = player;
    this.obstacles = obstacles;
    this.requestJump = requestJump;
  }

  update(time: number) {
    if (!this.active) return;

    const body = this.player.body as Phaser.Physics.Arcade.Body;
    if (!body.blocked.down) return;

    const candidate = this.getNearestObstacle();
    if (!candidate) return;

    const distance = candidate.x - this.player.x;
    const timeSinceJump = time - this.lastJumpTime;

    if (distance <= autoplayConfig.lookAhead && timeSinceJump > autoplayConfig.jumpBufferMs) {
      this.lastJumpTime = time;
      this.requestJump();
    }
  }

  deactivate() {
    this.active = false;
  }

  reactivate() {
    this.active = true;
    this.lastJumpTime = 0;
  }

  private getNearestObstacle(): Phaser.Physics.Arcade.Sprite | null {
    const children = this.obstacles.getChildren() as Phaser.Physics.Arcade.Sprite[];
    let nearest: Phaser.Physics.Arcade.Sprite | null = null;
    let minDistance = Number.MAX_VALUE;

    children.forEach((child) => {
      if (!child.active) return;
      const distance = child.x - this.player.x;
      if (distance > 0 && distance < minDistance) {
        minDistance = distance;
        nearest = child;
      }
    });

    return nearest;
  }
}
