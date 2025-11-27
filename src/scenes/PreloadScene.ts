import Phaser from "phaser";
import { uiCopy } from "../config/gameConfig";

export class PreloadScene extends Phaser.Scene {
  private progressText?: Phaser.GameObjects.Text;

  constructor() {
    super("preload");
  }

  preload() {
    this.progressText = this.add.text(12, 12, "Preparing assets...", {
      fontSize: "8px",
      color: "#d2f1ff",
    });

    this.createTexture("player", 16, 16, 0x8ae6ff, 0x1f7a9c);
    this.createTexture("obstacle", 12, 18, 0xffb86c, 0x9c531f);
    this.createTexture("ground", 32, 16, 0x203040, 0x101820);

    this.load.on(Phaser.Loader.Events.COMPLETE, () => {
      this.progressText?.setText(uiCopy.autoplayActive);
    });
  }

  create() {
    this.scene.start("main");
    this.scene.launch("ui");
  }

  private createTexture(key: string, width: number, height: number, fill: number, stroke: number) {
    const gfx = this.add.graphics({ x: 0, y: 0 });
    gfx.setVisible(false);
    gfx.fillStyle(fill, 1);
    gfx.fillRoundedRect(0, 0, width, height, 2);
    gfx.lineStyle(2, stroke, 1);
    gfx.strokeRoundedRect(0, 0, width, height, 2);
    gfx.generateTexture(key, width, height);
    gfx.destroy();
  }
}
