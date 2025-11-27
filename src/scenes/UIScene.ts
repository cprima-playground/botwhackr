import Phaser from "phaser";
import { uiCopy } from "../config/gameConfig";
import { ScoreState } from "../core/ScoringSystem";

export class UIScene extends Phaser.Scene {
  private scoreText!: Phaser.GameObjects.Text;
  private modeText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;

  constructor() {
    super("ui");
  }

  create() {
    const textStyle: Phaser.Types.GameObjects.Text.TextStyle = {
      fontSize: "8px",
      color: "#e8f1ff",
    };

    this.scoreText = this.add.text(8, 8, "Distance: 0m", textStyle);
    this.modeText = this.add.text(8, 18, uiCopy.autoplayActive, textStyle);
    this.statusText = this.add.text(8, 28, uiCopy.instructions, textStyle);

    this.game.events.on("score:update", this.handleScore, this);
    this.game.events.on("control:mode", this.handleMode, this);
    this.game.events.on("run:state", this.handleRunState, this);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.cleanup());
  }

  private handleScore(state: ScoreState) {
    this.scoreText.setText(
      `Distance: ${state.distance.toFixed(1)}m  Time: ${(state.runtimeMs / 1000).toFixed(1)}s  Deaths: ${state.deaths}`,
    );
  }

  private handleMode(mode: string) {
    this.modeText.setText(mode);
  }

  private handleRunState(state: string) {
    this.statusText.setText(state || uiCopy.instructions);
  }

  private cleanup() {
    this.game.events.off("score:update", this.handleScore, this);
    this.game.events.off("control:mode", this.handleMode, this);
    this.game.events.off("run:state", this.handleRunState, this);
  }
}
