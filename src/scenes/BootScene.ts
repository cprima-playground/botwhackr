import Phaser from "phaser";
import { gameDimensions, worldConfig } from "../config/gameConfig";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  create() {
    this.scale.setGameSize(gameDimensions.width, gameDimensions.height);
    this.cameras.main.setBackgroundColor(worldConfig.backgroundColor);
    this.scene.start("preload");
  }
}
