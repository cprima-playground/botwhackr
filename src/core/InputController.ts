import Phaser from "phaser";

export class InputController {
  private readonly scene: Phaser.Scene;
  private readonly onJump: () => void;
  private readonly onTakeover: () => void;
  private enabled = false;
  private takeoverLatched = false;

  private readonly pointerHandler = () => this.handleInput();
  private readonly keyboardHandler = () => this.handleInput();

  constructor(scene: Phaser.Scene, onJump: () => void, onTakeover: () => void) {
    this.scene = scene;
    this.onJump = onJump;
    this.onTakeover = onTakeover;

    this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE).on("down", this.keyboardHandler);
    this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.UP).on("down", this.keyboardHandler);
    this.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.W).on("down", this.keyboardHandler);
    this.scene.input.on(Phaser.Input.Events.POINTER_DOWN, this.pointerHandler);
  }

  enable() {
    this.enabled = true;
  }

  disable() {
    this.enabled = false;
  }

  resetTakeoverLatch() {
    this.takeoverLatched = false;
  }

  destroy() {
    this.scene.input.off(Phaser.Input.Events.POINTER_DOWN, this.pointerHandler);
    this.scene.input.keyboard?.removeListener("down", this.keyboardHandler);
  }

  private handleInput() {
    if (!this.enabled) return;

    if (!this.takeoverLatched) {
      this.onTakeover();
      this.takeoverLatched = true;
    }

    this.onJump();
  }
}
