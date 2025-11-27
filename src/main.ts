import Phaser from "phaser";
import { gameDimensions, worldConfig } from "./config/gameConfig";
import { BootScene } from "./scenes/BootScene";
import { MainScene } from "./scenes/MainScene";
import { PreloadScene } from "./scenes/PreloadScene";
import { UIScene } from "./scenes/UIScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: gameDimensions.width,
  height: gameDimensions.height,
  parent: "game-container",
  backgroundColor: worldConfig.backgroundColor,
  pixelArt: true,
  render: { antialias: false },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: worldConfig.gravity },
      debug: false,
    },
  },
  scene: [BootScene, PreloadScene, MainScene, UIScene],
};

// eslint-disable-next-line no-new
new Phaser.Game(config);
