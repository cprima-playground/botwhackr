import { runnerConstants } from "../config/gameConfig";

export interface ScoreState {
  distance: number;
  runtimeMs: number;
  deaths: number;
}

export class ScoringSystem {
  private readonly emitter: Phaser.Events.EventEmitter;
  private state: ScoreState = { distance: 0, runtimeMs: 0, deaths: 0 };

  constructor(emitter: Phaser.Events.EventEmitter) {
    this.emitter = emitter;
  }

  reset() {
    this.state = { distance: 0, runtimeMs: 0, deaths: this.state.deaths };
    this.publish();
  }

  markDeath() {
    this.state = { ...this.state, deaths: this.state.deaths + 1 };
    this.publish();
  }

  tick(delta: number) {
    this.state = {
      ...this.state,
      distance: this.state.distance + (runnerConstants.worldSpeed * delta) / 1000,
      runtimeMs: this.state.runtimeMs + delta,
    };
    this.publish();
  }

  getState() {
    return this.state;
  }

  private publish() {
    this.emitter.emit("score:update", this.state);
  }
}
